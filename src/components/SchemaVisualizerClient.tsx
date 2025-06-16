'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  TextField,
  InputAdornment,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Search as SearchIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import dynamic from 'next/dynamic';
import ReactFlow, {
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  ConnectionLineType,
  Position,
  Handle,
  type Node,
  type Edge
} from 'reactflow';
import 'reactflow/dist/style.css';

// Types for React Flow
interface FlowNode extends Node {
  data: NodeData;
}

interface NodeData {
  label: string;
  type: 'type' | 'field' | 'arg' | 'enum' | 'interface' | 'union' | 'scalar';
  description?: string;
  fields?: Array<{
    name: string;
    type: string;
    description?: string;
  }>;
  args?: Array<{
    name: string;
    type: string;
    description?: string;
  }>;
  enumValues?: Array<{
    name: string;
    description?: string;
  }>;
  interfaces?: string[];
  possibleTypes?: string[];
  expanded?: boolean;
}

interface SchemaVisualizerClientProps {
  selectedEnvironment: string;
  onEnvironmentChange: (env: string) => void;
  environments: typeof import('@/lib/environments').ENVIRONMENTS;
  apiClient: any;
  introspectionQuery: string;
}

// Custom Node Components
const TypeNode = ({ data, selected }: { data: NodeData; selected: boolean }) => {
  const getNodeColor = (type: string) => {
    switch (type) {
      case 'type': return '#4CAF50';
      case 'interface': return '#2196F3';
      case 'union': return '#FF9800';
      case 'enum': return '#9C27B0';
      case 'scalar': return '#607D8B';
      default: return '#757575';
    }
  };

  return (
    <Box
      sx={{
        padding: 2,
        borderRadius: 2,
        border: selected ? '2px solid #1976d2' : '1px solid #ddd',
        backgroundColor: 'white',
        minWidth: 200,
        boxShadow: selected ? 3 : 1,
        transition: 'all 0.2s ease-in-out'
      }}
    >
      <Handle type="target" position={Position.Top} />
      <Typography 
        variant="h6" 
        sx={{ 
          color: getNodeColor(data.type),
          fontWeight: 'bold',
          marginBottom: 1
        }}
      >
        {data.label}
      </Typography>
      {data.description && (
        <Typography variant="body2" color="text.secondary" sx={{ marginBottom: 1 }}>
          {data.description.substring(0, 100)}
          {data.description.length > 100 && '...'}
        </Typography>
      )}
      <Chip 
        label={data.type} 
        size="small" 
        sx={{ 
          backgroundColor: getNodeColor(data.type),
          color: 'white',
          fontSize: '0.7rem'
        }} 
      />
      {data.expanded && data.fields && (
        <Box sx={{ marginTop: 1 }}>
          {data.fields.slice(0, 5).map((field, index) => (
            <Typography key={index} variant="body2" sx={{ fontSize: '0.8rem' }}>
              {field.name}: {field.type}
            </Typography>
          ))}
          {data.fields.length > 5 && (
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              +{data.fields.length - 5} more...
            </Typography>
          )}
        </Box>
      )}
      <Handle type="source" position={Position.Bottom} />
    </Box>
  );
};

const nodeTypes = {
  typeNode: TypeNode,
};

export default function SchemaVisualizerClient({
  selectedEnvironment,
  onEnvironmentChange,
  environments,
  apiClient,
  introspectionQuery
}: SchemaVisualizerClientProps) {
  const [schema, setSchema] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [showBackground, setShowBackground] = useState(true);
  const [animateEdges, setAnimateEdges] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const initialNodes: Node[] = [];
  const initialEdges: Edge[] = [];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const loadSchema = useCallback(async () => {
    if (!selectedEnvironment) return;

    setLoading(true);
    setError(null);

    try {
      const environment = environments[selectedEnvironment];
      const client = new apiClient(environment, selectedEnvironment);
      const response = await client.executeGraphQLQuery(introspectionQuery, {});
      
      if (response.errors) {
        throw new Error(response.errors.map((e: any) => e.message).join(', '));
      }

      // Parse the introspection result
      const schemaData = response.data?.__schema;
      if (!schemaData) {
        throw new Error('Invalid schema response format');
      }

      setSchema(schemaData);
      generateGraphFromSchema(schemaData);
    } catch (err) {
      console.error('Schema loading error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load schema');
    } finally {
      setLoading(false);
    }
  }, [selectedEnvironment, environments, apiClient, introspectionQuery]);

  const generateGraphFromSchema = useCallback((schemaData: any) => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    let edgeCounter = 0;

    // Helper function to generate unique edge IDs
    const getEdgeId = () => `edge-${++edgeCounter}`;

    // Process types
    const typeMap = new Map();
    schemaData.types?.forEach((type: any, index: number) => {
      if (type.name.startsWith('__')) return; // Skip introspection types

      const nodeData: NodeData = {
        label: type.name,
        type: type.kind?.toLowerCase() || 'type',
        description: type.description,
        fields: type.fields?.map((field: any) => ({
          name: field.name,
          type: getTypeName(field.type),
          description: field.description
        })),
        args: type.fields?.flatMap((field: any) => 
          field.args?.map((arg: any) => ({
            name: arg.name,
            type: getTypeName(arg.type),
            description: arg.description
          })) || []
        ),
        enumValues: type.enumValues?.map((enumValue: any) => ({
          name: enumValue.name,
          description: enumValue.description
        })),
        interfaces: type.interfaces?.map((iface: any) => iface.name),
        possibleTypes: type.possibleTypes?.map((pType: any) => pType.name),
        expanded: false
      };

      const node: Node = {
        id: type.name,
        type: 'typeNode',
        position: {
          x: (index % 5) * 300,
          y: Math.floor(index / 5) * 200
        },
        data: nodeData
      };

      newNodes.push(node);
      typeMap.set(type.name, type);
    });

    // Generate edges for relationships
    schemaData.types?.forEach((type: any) => {
      if (type.name.startsWith('__')) return;

      // Field type relationships
      type.fields?.forEach((field: any) => {
        const fieldTypeName = getTypeName(field.type);
        if (typeMap.has(fieldTypeName) && fieldTypeName !== type.name) {
          newEdges.push({
            id: getEdgeId(),
            source: type.name,
            target: fieldTypeName,
            label: field.name,
            type: 'smoothstep',
            animated: false,
            style: { stroke: '#64B5F6' }
          });
        }
      });

      // Interface implementations
      type.interfaces?.forEach((iface: any) => {
        if (typeMap.has(iface.name)) {
          newEdges.push({
            id: getEdgeId(),
            source: type.name,
            target: iface.name,
            label: 'implements',
            type: 'smoothstep',
            animated: false,
            style: { stroke: '#4CAF50', strokeDasharray: '5,5' }
          });
        }
      });

      // Union type relationships
      type.possibleTypes?.forEach((pType: any) => {
        if (typeMap.has(pType.name)) {
          newEdges.push({
            id: getEdgeId(),
            source: type.name,
            target: pType.name,
            label: 'union',
            type: 'smoothstep',
            animated: false,
            style: { stroke: '#FF9800', strokeDasharray: '3,3' }
          });
        }
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [setNodes, setEdges]);

  // Helper function to extract type name from GraphQL type
  const getTypeName = (type: any): string => {
    if (type.name) return type.name;
    if (type.ofType) return getTypeName(type.ofType);
    return 'Unknown';
  };

  const filteredNodes = nodes.filter((node: Node) => {
    const matchesFilter = filterType === 'all' || node.data.type === filterType;
    const matchesSearch = !searchTerm || 
      node.data.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.data.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredEdges = edges.filter((edge: Edge) => 
    filteredNodes.some((node: Node) => node.id === edge.source) &&
    filteredNodes.some((node: Node) => node.id === edge.target)
  );

  const onNodeClick = useCallback((event: any, node: Node) => {
    setSelectedNode(node.id);
    
    // Toggle node expansion
    const newExpandedNodes = new Set(expandedNodes);
    if (expandedNodes.has(node.id)) {
      newExpandedNodes.delete(node.id);
    } else {
      newExpandedNodes.add(node.id);
    }
    setExpandedNodes(newExpandedNodes);

    // Update node data
    setNodes((nodes: Node[]) => 
      nodes.map(n => ({
        ...n,
        data: {
          ...n.data,
          expanded: n.id === node.id ? !n.data.expanded : n.data.expanded
        }
      }))
    );
  }, [expandedNodes, setNodes]);

  const resetView = useCallback(() => {
    setFilterType('all');
    setSearchTerm('');
    setSelectedNode(null);
    setExpandedNodes(new Set());
  }, []);

  const exportSchema = useCallback(() => {
    if (!schema) return;
    
    const dataStr = JSON.stringify(schema, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `schema-${selectedEnvironment}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [schema, selectedEnvironment]);

  useEffect(() => {
    if (selectedEnvironment) {
      loadSchema();
    }
  }, [selectedEnvironment, loadSchema]);

  const tabLabels = ['Overview', 'Types', 'Queries', 'Mutations', 'Subscriptions'];

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 2, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Schema Visualizer
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Settings">
              <IconButton onClick={() => setSettingsDrawerOpen(true)}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export Schema">
              <IconButton onClick={exportSchema} disabled={!schema}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh Schema">
              <IconButton onClick={loadSchema} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Environment</InputLabel>
            <Select
              value={selectedEnvironment}
              label="Environment"
              onChange={(e) => onEnvironmentChange(e.target.value)}
            >
              {Object.entries(environments).map(([key, env]) => (
                <MenuItem key={key} value={key}>
                  {env.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Filter</InputLabel>
            <Select
              value={filterType}
              label="Filter"
              onChange={(e) => setFilterType(e.target.value)}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="type">Object Types</MenuItem>
              <MenuItem value="interface">Interfaces</MenuItem>
              <MenuItem value="union">Unions</MenuItem>
              <MenuItem value="enum">Enums</MenuItem>
              <MenuItem value="scalar">Scalars</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            placeholder="Search types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200 }}
          />

          <Button
            variant="outlined"
            size="small"
            onClick={resetView}
            startIcon={<FilterIcon />}
          >
            Reset View
          </Button>
        </Box>
      </Paper>

      {/* Content */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        {loading && (
          <Box sx={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2
          }}>
            <CircularProgress />
            <Typography>Loading schema...</Typography>
          </Box>
        )}

        {error && (
          <Box sx={{ p: 2 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        {!loading && !error && schema && (
          <ReactFlow
            nodes={filteredNodes}
            edges={filteredEdges.map((edge: Edge) => ({
              ...edge,
              animated: animateEdges
            }))}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            connectionLineType={ConnectionLineType.SmoothStep}
            fitView
            fitViewOptions={{ padding: 0.1 }}
          >
            <Controls />
            {showMiniMap && <MiniMap />}
            {showBackground && <Background />}
          </ReactFlow>
        )}
      </Box>

      {/* Settings Drawer */}
      <Drawer
        anchor="right"
        open={settingsDrawerOpen}
        onClose={() => setSettingsDrawerOpen(false)}
      >
        <Box sx={{ width: 300, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Visualization Settings
          </Typography>
          
          <List>
            <ListItem>
              <FormControlLabel
                control={
                  <Switch
                    checked={showMiniMap}
                    onChange={(e) => setShowMiniMap(e.target.checked)}
                  />
                }
                label="Show Mini Map"
              />
            </ListItem>
            
            <ListItem>
              <FormControlLabel
                control={
                  <Switch
                    checked={showBackground}
                    onChange={(e) => setShowBackground(e.target.checked)}
                  />
                }
                label="Show Background"
              />
            </ListItem>
            
            <ListItem>
              <FormControlLabel
                control={
                  <Switch
                    checked={animateEdges}
                    onChange={(e) => setAnimateEdges(e.target.checked)}
                  />
                }
                label="Animate Edges"
              />
            </ListItem>
          </List>

          {schema && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Schema Statistics
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <InfoIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Types" 
                    secondary={schema.types?.filter((t: any) => !t.name.startsWith('__')).length || 0} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <InfoIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Query Fields" 
                    secondary={schema.queryType?.fields?.length || 0} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <InfoIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Mutation Fields" 
                    secondary={schema.mutationType?.fields?.length || 0} 
                  />
                </ListItem>
              </List>
            </Box>
          )}
        </Box>
      </Drawer>
    </Box>
  );
}
