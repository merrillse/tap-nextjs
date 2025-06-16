/**
 * Query Library Component
 * UI for managing saved GraphQL queries
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Box,
  Typography,
  Tab,
  Tabs,
  InputAdornment,
  Tooltip,
  Menu,
  MenuItem,
  Alert,
  Divider
} from '@mui/material';
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  PlayArrow as RunIcon,
  Search as SearchIcon,
  Download as ExportIcon,
  MoreVert as MoreIcon,
  Folder as FolderIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { QueryLibrary, SavedQuery } from '@/lib/query-library';
import { safeStringify } from '@/lib/utils';

// Proxy clients list for name resolution
const PROXY_CLIENTS = [
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
];

// Helper function to get proxy client name from ID
function getProxyClientName(clientId: string): string {
  const client = PROXY_CLIENTS.find(c => c.clientId === clientId);
  return client ? client.name : clientId;
}

export interface QueryLibraryDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectQuery: (query: SavedQuery) => void;
  onRunQuery: (query: SavedQuery) => void;
  onEditQuery: (query: SavedQuery) => void;
  currentEnvironment: string;
}

export interface SaveQueryDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (query: SavedQuery) => void;
  query: string; // Keep as query, was queryString
  variables?: string; // Variables as JSON string
  environment: string;
  proxyClient?: string; // Added proxy client
  editingQuery?: SavedQuery | null;
  isDuplicating?: boolean; // For duplicate mode
}

export function SaveQueryDialog({
  open,
  onClose,
  onSave,
  query,
  variables,
  environment,
  proxyClient,
  editingQuery,
  isDuplicating = false
}: SaveQueryDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [currentVariables, setCurrentVariables] = useState('{}');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingQuery && !isDuplicating) {
      setName(editingQuery.name);
      setDescription(editingQuery.description || '');
      setTags(editingQuery.tags?.join(', ') || '');
      // editingQuery.variables is Record<string, unknown>, stringify for CodeEditor
      setCurrentVariables(editingQuery.variables ? safeStringify(editingQuery.variables) : '{}');
    } else if (isDuplicating && editingQuery) {
      // For duplication, prefill but clear the name and add "Copy of" prefix
      setName(`Copy of ${editingQuery.name}`);
      setDescription(editingQuery.description || '');
      setTags(editingQuery.tags?.join(', ') || '');
      setCurrentVariables(editingQuery.variables ? safeStringify(editingQuery.variables) : '{}');
    } else {
      setName('');
      setDescription('');
      setTags('');
      // variables prop is already a string
      setCurrentVariables(variables || '{}');
    }
    setError('');
  }, [editingQuery, open, variables, isDuplicating]);

  const handleSave = () => {
    setError(''); // Clear previous errors at the start of a save attempt

    if (!name.trim()) {
      setError('Query name is required');
      return;
    }

    let parsedVars: Record<string, unknown> | undefined = undefined;
    try {
      if (currentVariables.trim() && currentVariables !== '{}') {
        parsedVars = JSON.parse(currentVariables);
      }
    } catch (e) {
      setError('Variables are not valid JSON. Please fix or clear before saving.');
      return;
    }

    try {
      const tagArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
      
      // Constructing the object for QueryLibrary.saveQuery
      // It expects Omit<SavedQuery, 'id' | 'createdAt' | 'updatedAt'> or a full SavedQuery if ID exists for update
      const queryDataForSave: Omit<SavedQuery, 'id' | 'createdAt' | 'updatedAt'> & { id?: string } = {
        name: name.trim(),
        query: query, // Use the query prop
        variables: parsedVars, // This is now Record<string, unknown> | undefined
        description: description.trim() || undefined,
        environment,
        proxyClient, // Added proxy client tracking
        tags: tagArray.length > 0 ? tagArray : undefined,
      };

      if (editingQuery?.id) {
        queryDataForSave.id = editingQuery.id;
      }

      // QueryLibrary.saveQuery handles if it's an update or new based on id or name
      const savedQuery = QueryLibrary.saveQuery(queryDataForSave as any); // Use any for now due to complex type in saveQuery

      onSave(savedQuery);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save query');
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        style: { zIndex: 2004 } // Explicitly set Paper z-index
      }}
      BackdropProps={{
        style: { zIndex: 2003 } // Backdrop z-index lower than Paper
      }}
      transitionDuration={0} // Disable enter/exit transitions
    >
      <DialogTitle>
        {isDuplicating ? 'Duplicate Query' : editingQuery ? 'Update Query' : 'Save Query'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          
          <TextField
            label="Query Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            placeholder="e.g., Get Missionary Details"
          />
          
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={2}
            placeholder="Brief description of what this query does..."
          />
          
          <TextField
            label="Tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            fullWidth
            placeholder="e.g., missionary, search, demo"
            helperText="Comma-separated tags for organization"
          />

          <TextField
            label="GraphQL Variables (JSON)"
            value={currentVariables} // This is a string
            onChange={(e) => setCurrentVariables(e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder='{ "id": "123" }'
            helperText="Variables to be saved with this query."
            InputProps={{
              sx: { fontFamily: 'monospace' }
            }}
          />
          
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom component="div">
              Environment: <Chip 
                label={environment} 
                size="small"
                onClick={(e) => e.stopPropagation()} 
              />
            </Typography>
            <Typography variant="caption" color="text.secondary" component="div">
              Query will be associated with this environment.
            </Typography>
          </Box>
          
          {proxyClient && !environment.includes('mogs') && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom component="div">
                Proxy Client: <Chip 
                  label={(() => {
                    const client = PROXY_CLIENTS.find(c => c.clientId === proxyClient);
                    return client ? client.name : proxyClient;
                  })()} 
                  size="small"
                  onClick={(e) => e.stopPropagation()}
                  color="secondary"
                />
              </Typography>
              <Typography variant="caption" color="text.secondary" component="div">
                Query will use this proxy client for MGQL requests.
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>
          {editingQuery ? 'Update' : 'Save'} Query
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function QueryLibraryDialog({
  open,
  onClose,
  onSelectQuery,
  onRunQuery,
  onEditQuery,
  currentEnvironment
}: QueryLibraryDialogProps) {
  const [queries, setQueries] = useState<SavedQuery[]>([]);
  const [filteredQueries, setFilteredQueries] = useState<SavedQuery[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedQueryForMenu, setSelectedQueryForMenu] = useState<SavedQuery | null>(null);

  const loadQueries = () => {
    const allQueries = QueryLibrary.getQueries(); // Corrected method name
    setQueries(allQueries);
    setFilteredQueries(allQueries);
  };

  useEffect(() => {
    if (open) {
      loadQueries();
      setSearchTerm('');
      setSelectedTab(0);
    }
  }, [open]);

  useEffect(() => {
    let result = queries;
    if (searchTerm) {
      // searchQueries in QueryLibrary takes one argument (searchTerm) and filters its internal list
      // To filter the `queries` state, we either need to pass `queries` to a modified searchQueries 
      // or replicate search logic here. For now, let's assume QueryLibrary.searchQueries(term) searches all.
      // This might need adjustment if QueryLibrary.searchQueries is meant to take a list.
      // For now, filtering the already loaded `queries` array locally for more responsive UI.
      const term = searchTerm.toLowerCase();
      result = queries.filter(q => 
        q.name.toLowerCase().includes(term) ||
        q.query.toLowerCase().includes(term) ||
        (q.description && q.description.toLowerCase().includes(term)) ||
        (q.tags && q.tags.some(tag => tag.toLowerCase().includes(term))) ||
        (q.proxyClient && q.proxyClient.toLowerCase().includes(term)) ||
        (q.proxyClient && getProxyClientName(q.proxyClient).toLowerCase().includes(term))
      );
    }
    
    if (selectedTab === 1) {
      result = result.filter(q => q.environment === currentEnvironment);
    } else if (selectedTab === 2) {
      result = result.filter(q => q.environment !== currentEnvironment);
    }
    setFilteredQueries(result);
  }, [searchTerm, queries, selectedTab, currentEnvironment]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, query: SavedQuery) => {
    setAnchorEl(event.currentTarget);
    setSelectedQueryForMenu(query);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedQueryForMenu(null);
  };

  const handleDelete = () => {
    if (selectedQueryForMenu?.id) {
      QueryLibrary.deleteQuery(selectedQueryForMenu.id);
      loadQueries();
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (selectedQueryForMenu) {
      onEditQuery(selectedQueryForMenu);
      // onClose(); // User might want to keep library open
    }
    handleMenuClose();
  };

  const handleExportSelected = () => {
    if (selectedQueryForMenu) {
      const content = QueryLibrary.exportQueries([selectedQueryForMenu.id]); // Assuming exportQueries can take IDs
      const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${selectedQueryForMenu.name.replace(/\s+/g, '_')}_query.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    handleMenuClose();
  };

  const handleExportAll = () => {
    const content = QueryLibrary.exportQueries(); // Exports all
    const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "apex_graphql_queries_export.json");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // handleMenuClose(); // Not from item menu
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth 
      PaperProps={{
        style: { zIndex: 2002 } // Explicitly set Paper z-index
      }}
      BackdropProps={{
        style: { zIndex: 2001 } // Backdrop z-index lower than Paper
      }}
      transitionDuration={0} // Disable enter/exit transitions
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Query Library
          <Button onClick={handleExportAll} startIcon={<ExportIcon />} size="small">
            Export All Queries
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, minHeight: '60vh' }}>
        <TextField
          fullWidth
          placeholder="Search queries by name, description, tags, or proxy client..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={selectedTab} onChange={handleTabChange} aria-label="query filter tabs">
            <Tab label="All Queries" />
            <Tab label={`Current Env (${currentEnvironment})`} />
            <Tab label="Other Environments" />
          </Tabs>
        </Box>
        {filteredQueries.length === 0 ? (
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="subtitle1" color="text.secondary">
              No queries found matching your criteria.
            </Typography>
          </Box>
        ) : (
          <List sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: 'calc(60vh - 150px)' }}>
            {filteredQueries.map((query) => (
              <ListItem 
                key={query.id} 
                divider 
                sx={{
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'action.hover' },
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'flex-start' 
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <ListItemText
                    primary={<Typography variant="h6">{query.name}</Typography>}
                    secondary={query.description || 'No description'}
                    onClick={() => onSelectQuery(query)}
                    sx={{ flexGrow: 1, pr: 1 }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Tooltip title="Run Query">
                      <IconButton edge="end" aria-label="run" onClick={() => onRunQuery(query)} size="small">
                        <RunIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="More Actions">
                      <IconButton edge="end" aria-label="more" onClick={(e) => handleMenuOpen(e, query)} size="small">
                        <MoreIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                  <Chip 
                    icon={<FolderIcon fontSize="small"/>} 
                    label={query.environment} 
                    size="small" 
                    variant="outlined" 
                    color={query.environment === currentEnvironment ? "primary" : "default"}
                  />
                  {query.proxyClient && (
                    <Chip 
                      label={`Proxy: ${getProxyClientName(query.proxyClient)}`}
                      size="small" 
                      variant="outlined" 
                      color="secondary"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  )}
                  {query.tags?.map(tag => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                  ))}
                </Box>
                {query.variables && Object.keys(query.variables).length > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                    Variables: {Object.keys(query.variables).join(', ')}
                  </Typography>
                )}
              </ListItem>
            ))}
          </List>
        )}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleEdit}><EditIcon sx={{ mr: 1 }}/> Edit Query</MenuItem>
          {/* Duplicate removed for now as QueryLibrary.duplicateQuery doesn't exist */}
          <MenuItem onClick={handleExportSelected}><ExportIcon sx={{ mr: 1 }}/> Export Selected Query</MenuItem>
          <Divider />
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}><DeleteIcon sx={{ mr: 1 }}/> Delete Query</MenuItem>
        </Menu>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
