'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  Card,
  CardContent,
  List,
  ListItemButton,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Divider
} from '@mui/material';
import {
  Search,
  Info,
  Code,
  DataObject,
  Functions,
  List as ListIcon,
  Category,
  Settings,
  Refresh,
  Close
} from '@mui/icons-material';
import { SelectChangeEvent } from '@mui/material/Select';
import { getEnvironmentConfig, getEnvironmentNames } from '@/lib/environments';
import { ApiClient } from '@/lib/api-client';
import GraphQLPageHeader from '@/components/GraphQLPageHeader';

// GraphQL Schema Types
interface GraphQLType {
  kind: string;
  name?: string;
  description?: string;
  fields?: GraphQLField[];
  inputFields?: GraphQLInputField[];
  interfaces?: GraphQLType[];
  enumValues?: GraphQLEnumValue[];
  possibleTypes?: GraphQLType[];
  ofType?: GraphQLType;
}

interface GraphQLField {
  name: string;
  description?: string;
  args: GraphQLArgument[];
  type: GraphQLType;
  isDeprecated: boolean;
  deprecationReason?: string;
}

interface GraphQLInputField {
  name: string;
  description?: string;
  type: GraphQLType;
  defaultValue?: string;
}

interface GraphQLArgument {
  name: string;
  description?: string;
  type: GraphQLType;
  defaultValue?: string;
}

interface GraphQLEnumValue {
  name: string;
  description?: string;
  isDeprecated: boolean;
  deprecationReason?: string;
}

interface GraphQLDirective {
  name: string;
  description?: string;
  locations: string[];
  args: GraphQLArgument[];
}

interface GraphQLSchema {
  queryType?: { name: string };
  mutationType?: { name: string };
  subscriptionType?: { name: string };
  types: GraphQLType[];
  directives: GraphQLDirective[];
}

interface IntrospectionResult {
  data: {
    __schema: GraphQLSchema;
  };
}

const INTROSPECTION_QUERY = `
query IntrospectionQuery {
  __schema {
    queryType {
      name
    }
    mutationType {
      name
    }
    subscriptionType {
      name
    }
    types {
      kind
      name
      description
      fields(includeDeprecated: true) {
        name
        description
        args {
          name
          description
          type {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                }
              }
            }
          }
          defaultValue
        }
        type {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
              }
            }
          }
        }
        isDeprecated
        deprecationReason
      }
      inputFields {
        name
        description
        type {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
              }
            }
          }
        }
        defaultValue
      }
      interfaces {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
            }
          }
        }
      }
      enumValues(includeDeprecated: true) {
        name
        description
        isDeprecated
        deprecationReason
      }
      possibleTypes {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
            }
          }
        }
      }
    }
    directives {
      name
      description
      locations
      args {
        name
        description
        type {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
              }
            }
          }
        }
        defaultValue
      }
    }
  }
}`;

// Helper functions
function getTypeIcon(kind: string) {
  switch (kind) {
    case 'OBJECT': return <DataObject />;
    case 'SCALAR': return <Code />;
    case 'ENUM': return <ListIcon />;
    case 'INPUT_OBJECT': return <Settings />;
    case 'INTERFACE': return <Functions />;
    case 'UNION': return <Category />;
    default: return <Info />;
  }
}

function getTypeColor(kind: string): 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error' | 'default' {
  switch (kind) {
    case 'OBJECT': return 'primary';
    case 'SCALAR': return 'secondary';
    case 'ENUM': return 'success';
    case 'INPUT_OBJECT': return 'warning';
    case 'INTERFACE': return 'info';
    case 'UNION': return 'error';
    default: return 'default';
  }
}

function formatType(type: GraphQLType): string {
  if (!type) return 'Unknown';
  
  if (type.name) {
    return type.name;
  }
  
  if (type.kind === 'NON_NULL' && type.ofType) {
    return `${formatType(type.ofType)}!`;
  }
  
  if (type.kind === 'LIST' && type.ofType) {
    return `[${formatType(type.ofType)}]`;
  }
  
  return type.kind || 'Unknown';
}

// Helper function to extract the base type name (without LIST/NON_NULL wrappers)
function getBaseTypeName(type: GraphQLType): string | null {
  if (type.name) {
    return type.name;
  }
  if (type.ofType) {
    return getBaseTypeName(type.ofType);
  }
  return null;
}

// Helper function to check if a type is user-defined (not a built-in scalar)
function isUserDefinedType(typeName: string): boolean {
  const builtInTypes = ['String', 'Int', 'Float', 'Boolean', 'ID'];
  return !builtInTypes.includes(typeName) && !typeName.startsWith('__');
}

// Component for clickable type names
function ClickableTypeName({ 
  type, 
  onTypeClick, 
  availableTypes 
}: { 
  type: GraphQLType; 
  onTypeClick: (typeName: string) => void;
  availableTypes: GraphQLType[];
}) {
  const baseTypeName = getBaseTypeName(type);
  const formattedType = formatType(type);
  
  // Check if this is a user-defined type that exists in our schema
  const isClickable = baseTypeName && 
    isUserDefinedType(baseTypeName) && 
    availableTypes.some(t => t.name === baseTypeName);

  if (isClickable) {
    // Split the formatted type to make only the base type name clickable
    const parts = formattedType.split(baseTypeName!);
    
    return (
      <Typography component="span" fontFamily="monospace" color="primary">
        {parts[0]}
        <Typography 
          component="span" 
          sx={{ 
            color: 'primary.main',
            cursor: 'pointer',
            textDecoration: 'underline',
            '&:hover': {
              color: 'primary.dark',
              fontWeight: 'bold'
            }
          }}
          onClick={() => onTypeClick(baseTypeName!)}
        >
          {baseTypeName}
        </Typography>
        {parts[1]}
      </Typography>
    );
  }

  return (
    <Typography component="span" fontFamily="monospace" color="text.secondary">
      {formattedType}
    </Typography>
  );
}

export default function SchemaBrowserPage() {
  // Available proxy clients - sorted by name for easy discovery
  const proxyClients = [
    { name: 'Primary', clientId: '0oak0jqakvevwjWrp357' },
    { name: 'CCDOPS - Church Calendar', clientId: '0oa17jzhwi9uusIoz358' },
    { name: 'CCDOPS - Church Calendar [non-prod]', clientId: '0oaki3kbszeewJmMX357' },
    { name: 'CCDOPS - Church Calendar [PROD]', clientId: '0oaki3swtbO6fOZ9x357' },
    { name: 'CES', clientId: '0oa16arpkjgDezdcI358' },
    { name: 'CMIS Authorization Service', clientId: '0oao4ayxo9fgtnKYj357' },
    { name: 'CMIS Callings', clientId: '0oa1joivv92SShYCD358' },
    { name: 'CMIS Services Team', clientId: '0oan0z1efagK9cXWu357' },
    { name: 'DMBA Group [non-prod]', clientId: '0oan1043xxD4cTtoU357' },
    { name: 'DMBA Group [PROD]', clientId: '0oan1036pnukfeJSi357' },
    { name: 'EDUINT - Education Integrations', clientId: '0oagzh13nq0zK7c5I357' },
    { name: 'English Connect', clientId: '0oaixehfyryjaiS7M357' },
    { name: 'GVM Travel [non-prod]', clientId: '0oartjtss42ayIfJl357' },
    { name: 'GVM Travel [PROD]', clientId: '0oartjm5nguKZFN2c357' },
    { name: 'HR:MSR:Emergency Contact', clientId: '0oavpvglc1wJ9hVKv357' },
    { name: 'Identity', clientId: '0oa1099z1t0ZRaFwP358' },
    { name: 'ISR - Non-prod', clientId: '0oaqbq6isq9sDyIdx357' },
    { name: 'ISR - Prod', clientId: '0oapmoioz2z64riCE357' },
    { name: 'LCR [non-prod]', clientId: '0oalni75ar2LGLtVR357' },
    { name: 'LCR [PROD]', clientId: '0oalni7s7aEWlSTHQ357' },
    { name: 'Maps Service', clientId: '0oajrl8w5aVKhlkgq357' },
    { name: 'MBI', clientId: 'MBI' },
    { name: 'Member Tools', clientId: '0oakhtcbhyLVVeYFj357' },
    { name: 'Missionary Areabook [non-prod]', clientId: '0oasw5r8hmlOJ5GG0357' },
    { name: 'Missionary Areabook [PROD]', clientId: '0oasw6uegahMJ8N9Y357' },
    { name: 'Missionary Connect [non-prod]', clientId: '0oap88us4pbRI1HX3357' },
    { name: 'Missionary Connect [PROD]', clientId: '0oap88ozbhEr8UKIQ357' },
    { name: 'Missionary Graph Service Team', clientId: '0oak0jqakvevwjWrp357' },
    { name: 'Missionary History [non-prod]', clientId: '0oartk3ix1S0lvthA357' },
    { name: 'Missionary History [PROD]', clientId: '0oartjyikqPqM5LZm357' },
    { name: 'Missionary Portal [non-prod]', clientId: '0oa1gg8qdjlQh49GY358' },
    { name: 'Missionary Portal [PROD]', clientId: '0oa1gg90u4erOhnH2358' },
    { name: 'Missionary WORKS [non-prod]', clientId: '0oaoywrjdh16anAjm357' },
    { name: 'Missionary WORKS [PROD]', clientId: '0oaoypfnvzf56iHqv357' },
    { name: 'MTC Tech [non-prod]', clientId: '0oan0z7opvD8AseBb357' },
    { name: 'MTC Tech [PROD]', clientId: '0oan0z9i7ax38R7Tx357' },
    { name: 'Pathway Anthology [non-prod]', clientId: '0oa10ty566kw1iqcC358' },
    { name: 'Pathway Anthology [PROD]', clientId: '0oa18avadd4EBvHhP358' },
    { name: 'QuickReg [non-prod]', clientId: '0oavlgns0tNH0dvXb357' },
    { name: 'QuickReg [PROD]', clientId: '0oaxn76jai315m4i5357' },
    { name: 'RISK-MDQ', clientId: '0oa11ext3xoSIlS9S358' },
    { name: 'ServiceNow & Missionary Integration', clientId: '0oa1iwzkz1dcZvAIL358' },
    { name: 'TallEmbark', clientId: '0oa11j79yw80Y9jwj358' },
    { name: 'WAS - Ward Activity Sharing [non-prod]', clientId: '0oa1dfokrc9S2D5aO358' },
    { name: 'WAS - Ward Activity Sharing [PROD]', clientId: '0oa19kxjttvFItg3y358' },
    { name: 'Ward Directory & Map', clientId: '0oamyits9uliqoOn7357' },
    { name: 'WSR', clientId: '0oa1gs5l1prHsbDUc358' },
  ].sort((a, b) => a.name.localeCompare(b.name));

  const [selectedEnvironment, setSelectedEnvironment] = useState('mis-gql-stage');
  const [selectedProxyClient, setSelectedProxyClient] = useState('0oak0jqakvevwjWrp357'); // Default to primary
  const [schema, setSchema] = useState<GraphQLSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKind, setSelectedKind] = useState('all');
  const [selectedType, setSelectedType] = useState<GraphQLType | null>(null);

  // Refs for scrolling
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  const environmentOptions = getEnvironmentNames();

  // Initialize API client when environment changes
  useEffect(() => {
    const config = getEnvironmentConfig(selectedEnvironment);
    if (config) {
      setApiClient(new ApiClient(config, selectedEnvironment));
    }
    localStorage.setItem('selectedEnvironment', selectedEnvironment);
    window.dispatchEvent(new Event('environmentChanged'));
  }, [selectedEnvironment]);

  // Load saved environment on component mount
  useEffect(() => {
    const savedEnv = localStorage.getItem('selectedEnvironment') || 'mis-gql-stage';
    setSelectedEnvironment(savedEnv);
    
    const savedProxyClient = localStorage.getItem('selectedProxyClient') || '0oak0jqakvevwjWrp357';
    setSelectedProxyClient(savedProxyClient);
  }, []);

  const handleEnvironmentChange = (event: SelectChangeEvent) => {
    setSelectedEnvironment(event.target.value);
  };

  const handleProxyClientChange = (clientId: string) => {
    setSelectedProxyClient(clientId);
    localStorage.setItem('selectedProxyClient', clientId);
  };

  const loadSchema = async () => {
    if (!apiClient) {
      setError('API client not initialized. Please select an environment.');
      return;
    }

    setLoading(true);
    setError(null);
    setSchema(null);

    try {
      const result = await apiClient.executeGraphQLQuery(INTROSPECTION_QUERY, {}) as IntrospectionResult;
      
      if (result.data?.__schema) {
        setSchema(result.data.__schema);
      } else {
        throw new Error('Invalid schema response');
      }
    } catch (err) {
      console.error('Schema introspection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load schema');
    } finally {
      setLoading(false);
    }
  };

  // Auto-load schema when API client is ready
  useEffect(() => {
    if (apiClient) {
      loadSchema();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiClient]);

  // Handle scrolling when selected type changes
  useEffect(() => {
    if (selectedType) {
      // Scroll right panel to top
      if (rightPanelRef.current) {
        rightPanelRef.current.scrollTop = 0;
      }

      // Scroll left panel to show selected type
      if (leftPanelRef.current) {
        const selectedElement = leftPanelRef.current.querySelector(`[data-type-name="${selectedType.name}"]`);
        if (selectedElement) {
          selectedElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }
    }
  }, [selectedType]);

  // Filter and search logic
  const filteredTypes = useMemo(() => {
    if (!schema) return [];

    const types = schema.types.filter(type => {
      // Filter out built-in GraphQL types
      if (!type.name || type.name.startsWith('__')) return false;
      
      // Filter by kind
      if (selectedKind !== 'all' && type.kind !== selectedKind) return false;
      
      // Filter by search term
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          type.name.toLowerCase().includes(search) ||
          (type.description && type.description.toLowerCase().includes(search)) ||
          (type.fields && type.fields.some(field => 
            field.name.toLowerCase().includes(search) ||
            (field.description && field.description.toLowerCase().includes(search))
          ))
        );
      }
      
      return true;
    });

    // Sort alphabetically
    return types.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [schema, searchTerm, selectedKind]);

  const typeKindCounts = useMemo(() => {
    if (!schema) return {};
    
    const counts: Record<string, number> = {};
    schema.types.forEach(type => {
      if (type.name && !type.name.startsWith('__')) {
        counts[type.kind] = (counts[type.kind] || 0) + 1;
      }
    });
    
    return counts;
  }, [schema]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <GraphQLPageHeader
        title="GraphQL Schema Browser"
        description="Explore GraphQL schema structure, types, fields, and relationships for both MGQL and MOGS systems"
        icon={
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        }
        selectedEnvironment={selectedEnvironment}
        environmentOptions={environmentOptions}
        onEnvironmentChange={handleEnvironmentChange}
        selectedProxyClient={selectedProxyClient}
        proxyClients={proxyClients}
        onProxyClientChange={handleProxyClientChange}
        onRefresh={loadSchema}
        isLoading={loading}
        additionalInfo={loading ? 'Loading schema...' : schema ? `${filteredTypes.length} types loaded` : 'Click refresh to load schema'}
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Schema Content */}
      {schema && !loading && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3 }}>
          {/* Left Panel - Type List */}
          <Paper sx={{ p: 2, height: 'calc(100vh - 300px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Search and Filter */}              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  placeholder="Search types and fields..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm && (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setSearchTerm('')}
                          edge="end"
                          aria-label="clear search"
                        >
                          <Close />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
                
                <FormControl fullWidth>
                  <InputLabel>Type Kind</InputLabel>
                  <Select
                    value={selectedKind}
                    label="Type Kind"
                    onChange={(e) => setSelectedKind(e.target.value)}
                  >
                    <MenuItem value="all">All Types ({Object.values(typeKindCounts).reduce((a, b) => a + b, 0)})</MenuItem>
                    {Object.entries(typeKindCounts).map(([kind, count]) => (
                      <MenuItem key={kind} value={kind}>
                        {kind} ({count})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

            {/* Type List */}
            <Box ref={leftPanelRef} sx={{ flex: 1, overflow: 'auto' }}>
              <List dense>
                {filteredTypes.map((type) => (
                  <ListItemButton
                    key={type.name}
                    data-type-name={type.name}
                    selected={selectedType?.name === type.name}
                    onClick={() => setSelectedType(type)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      '&.Mui-selected': {
                        backgroundColor: 'primary.light',
                        color: 'primary.contrastText',
                      }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getTypeIcon(type.kind)}
                          <Typography variant="body2" fontFamily="monospace">
                            {type.name}
                          </Typography>
                          <Chip
                            size="small"
                            label={type.kind}
                            color={getTypeColor(type.kind)}
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={type.description}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Box>
          </Paper>

          {/* Right Panel - Type Details */}
          <Paper ref={rightPanelRef} sx={{ p: 3, height: 'calc(100vh - 300px)', overflow: 'auto' }}>
            {selectedType ? (
              <TypeDetailView 
                type={selectedType} 
                onTypeClick={(typeName: string) => {
                  // First try to find in filtered types, then in all schema types
                  let targetType = filteredTypes.find(t => t.name === typeName);
                  if (!targetType && schema) {
                    targetType = schema.types.find(t => t.name === typeName);
                  }
                  if (targetType) {
                    setSelectedType(targetType);
                    // Clear filters to show the selected type
                    setSearchTerm('');
                    setSelectedKind('all');
                  }
                }}
                availableTypes={schema?.types || []}
              />
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Info sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Select a type to view its details
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      )}      </Container>
    </div>
  );
}

// Type Detail Component
function TypeDetailView({ 
  type, 
  onTypeClick, 
  availableTypes 
}: { 
  type: GraphQLType; 
  onTypeClick: (typeName: string) => void;
  availableTypes: GraphQLType[];
}) {
  return (
    <Box>
      {/* Type Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="h4" component="h2" fontFamily="monospace">
            {type.name}
          </Typography>
          <Chip
            label={type.kind}
            color={getTypeColor(type.kind)}
            variant="filled"
          />
        </Box>
        
        {type.description && (
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {type.description}
          </Typography>
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Fields */}
      {type.fields && type.fields.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Fields ({type.fields.length})
          </Typography>
          {type.fields.map((field) => (
            <FieldView 
              key={field.name} 
              field={field} 
              onTypeClick={onTypeClick}
              availableTypes={availableTypes}
            />
          ))}
        </Box>
      )}

      {/* Input Fields */}
      {type.inputFields && type.inputFields.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Input Fields ({type.inputFields.length})
          </Typography>
          {type.inputFields.map((field) => (
            <InputFieldView 
              key={field.name} 
              field={field} 
              onTypeClick={onTypeClick}
              availableTypes={availableTypes}
            />
          ))}
        </Box>
      )}

      {/* Enum Values */}
      {type.enumValues && type.enumValues.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Enum Values ({type.enumValues.length})
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {type.enumValues.map((enumValue) => (
              <Chip
                key={enumValue.name}
                label={enumValue.name}
                variant={enumValue.isDeprecated ? "outlined" : "filled"}
                color={enumValue.isDeprecated ? "error" : "primary"}
                title={enumValue.description || enumValue.name}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Interfaces */}
      {type.interfaces && type.interfaces.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Implements
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {type.interfaces.map((iface) => (
              <Chip
                key={iface.name}
                label={iface.name}
                color="info"
                variant="outlined"
                onClick={iface.name ? () => onTypeClick(iface.name!) : undefined}
                sx={{ cursor: iface.name ? 'pointer' : 'default' }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Possible Types */}
      {type.possibleTypes && type.possibleTypes.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Possible Types
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {type.possibleTypes.map((possibleType) => (
              <Chip
                key={possibleType.name}
                label={possibleType.name}
                color="secondary"
                variant="outlined"
                onClick={possibleType.name ? () => onTypeClick(possibleType.name!) : undefined}
                sx={{ cursor: possibleType.name ? 'pointer' : 'default' }}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

// Field Component
function FieldView({ 
  field, 
  onTypeClick, 
  availableTypes 
}: { 
  field: GraphQLField; 
  onTypeClick: (typeName: string) => void;
  availableTypes: GraphQLType[];
}) {
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Typography variant="h6" fontFamily="monospace">
            {field.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            : 
          </Typography>
          <ClickableTypeName 
            type={field.type} 
            onTypeClick={onTypeClick}
            availableTypes={availableTypes}
          />
          {field.isDeprecated && (
            <Chip size="small" label="Deprecated" color="error" />
          )}
        </Box>
        
        {field.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {field.description}
          </Typography>
        )}

        {field.args && field.args.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Arguments:
            </Typography>
            {field.args.map((arg) => (
              <Box key={arg.name} sx={{ ml: 2, mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" fontFamily="monospace">
                    <strong>{arg.name}</strong>: 
                  </Typography>
                  <ClickableTypeName 
                    type={arg.type} 
                    onTypeClick={onTypeClick}
                    availableTypes={availableTypes}
                  />
                  {arg.defaultValue && (
                    <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                      = {arg.defaultValue}
                    </Typography>
                  )}
                </Box>
                {arg.description && (
                  <Typography variant="caption" color="text.secondary">
                    {arg.description}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        )}

        {field.deprecationReason && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <strong>Deprecated:</strong> {field.deprecationReason}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// Input Field Component
function InputFieldView({ 
  field, 
  onTypeClick, 
  availableTypes 
}: { 
  field: GraphQLInputField; 
  onTypeClick: (typeName: string) => void;
  availableTypes: GraphQLType[];
}) {
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Typography variant="h6" fontFamily="monospace">
            {field.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            : 
          </Typography>
          <ClickableTypeName 
            type={field.type} 
            onTypeClick={onTypeClick}
            availableTypes={availableTypes}
          />
          {field.defaultValue && (
            <Typography variant="body2" color="text.secondary" fontFamily="monospace">
              = {field.defaultValue}
            </Typography>
          )}
        </Box>
        
        {field.description && (
          <Typography variant="body2" color="text.secondary">
            {field.description}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
