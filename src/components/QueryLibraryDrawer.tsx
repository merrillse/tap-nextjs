/**
 * Query Library Drawer Component
 * Slide-out drawer for managing saved GraphQL queries with enhanced IDE features
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Tab,
  Tabs,
  InputAdornment,
  Tooltip,
  Menu,
  MenuItem,
  Alert,
  Divider,
  Toolbar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  PlayArrow as RunIcon,
  Search as SearchIcon,
  Download as ExportIcon,
  MoreVert as MoreIcon,
  Folder as FolderIcon,
  Edit as EditIcon,
  Close,
  LibraryBooks,
  Add as AddIcon
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

export interface QueryLibraryDrawerProps {
  open: boolean;
  onClose: () => void;
  onSelectQuery: (query: SavedQuery) => void;
  onRunQuery: (query: SavedQuery) => void;
  onEditQuery: (query: SavedQuery) => void;
  currentEnvironment: string;
  width?: number;
}

export interface SaveQueryDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (query: SavedQuery) => void;
  query: string; // Keep as query, was queryString
  variables?: string; // Variables as JSON string
  editingQuery?: SavedQuery | null;
  isDuplicating?: boolean; // For duplicate mode
}

export function SaveQueryDialog({
  open,
  onClose,
  onSave,
  query,
  variables,
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

export function QueryLibraryDrawer({
  open,
  onClose,
  onSelectQuery,
  onRunQuery,
  onEditQuery,
  currentEnvironment,
  width = 700
}: QueryLibraryDrawerProps) {
  const [queries, setQueries] = useState<SavedQuery[]>([]);
  const [filteredQueries, setFilteredQueries] = useState<SavedQuery[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedQueryForMenu, setSelectedQueryForMenu] = useState<SavedQuery | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const listRef = useRef<HTMLUListElement>(null);

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
        (q.tags && q.tags.some(tag => tag.toLowerCase().includes(term)))
      );
    }
    
    // Apply tab-based filtering
    if (selectedTab === 1) {
      // Recent: sort by updatedAt, show most recent first
      result = result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } else if (selectedTab === 2) {
      // Favorites: filter by "favorite" tag
      result = result.filter(q => q.tags?.includes('favorite'));
    }
    
    setFilteredQueries(result);
  }, [searchTerm, queries, selectedTab]);

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
    setShowExportDialog(false);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="temporary"
      sx={{
        '& .MuiDrawer-paper': {
          width: width,
          maxWidth: '90vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      {/* Header */}
      <Toolbar sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        background: 'linear-gradient(135deg, #5e72e4 0%, #825ee4 100%)',
        color: 'white',
        minHeight: '64px !important'
      }}>
        <LibraryBooks sx={{ mr: 2 }} />
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
          Query Library
        </Typography>
        <Typography variant="body2" sx={{ mr: 2, opacity: 0.9 }}>
          {filteredQueries.length} queries
        </Typography>
        <Tooltip title="Export All Queries">
          <IconButton 
            onClick={() => setShowExportDialog(true)}
            sx={{ color: 'white', mr: 1 }}
            aria-label="Export all queries"
          >
            <ExportIcon />
          </IconButton>
        </Tooltip>
        <IconButton 
          onClick={onClose} 
          sx={{ color: 'white' }}
          aria-label="Close query library"
        >
          <Close />
        </IconButton>
      </Toolbar>

      {/* Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Search and Filter Controls */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            fullWidth
            placeholder="Search queries by name, description, tags, or proxy client..."
            value={searchTerm}
            onChange={handleSearchChange}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          
          <Tabs 
            value={selectedTab} 
            onChange={handleTabChange} 
            aria-label="query filter tabs"
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                minHeight: '40px',
                fontSize: '0.875rem'
              }
            }}
          >
            <Tab label="All Queries" />
            <Tab label="Recent" />
            <Tab label="Favorites" />
          </Tabs>
        </Box>

        {/* Query List */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          {filteredQueries.length === 0 ? (
            <Box sx={{ 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2,
              px: 3,
              textAlign: 'center'
            }}>
              <LibraryBooks sx={{ fontSize: 64, color: 'text.disabled' }} />
              <Typography variant="h6" color="text.secondary">
                No queries found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm 
                  ? "Try adjusting your search criteria" 
                  : "Start by saving your first GraphQL query"
                }
              </Typography>
            </Box>
          ) : (
            <List 
              ref={listRef}
              sx={{ 
                flex: 1, 
                overflowY: 'auto',
                px: 1,
                py: 0
              }}
            >
              {filteredQueries.map((query) => (
                <ListItem 
                  key={query.id} 
                  divider 
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: 'action.hover' },
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'flex-start',
                    py: 2,
                    borderRadius: 1,
                    mb: 0.5
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {query.name}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {query.description || 'No description'}
                        </Typography>
                      }
                      onClick={() => onSelectQuery(query)}
                      sx={{ flexGrow: 1, pr: 1, cursor: 'pointer' }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                      <Tooltip title="Run Query">
                        <IconButton 
                          edge="end" 
                          aria-label="run" 
                          onClick={(e) => {
                            e.stopPropagation();
                            onRunQuery(query);
                          }} 
                          size="small"
                          sx={{ 
                            color: 'success.main',
                            '&:hover': { backgroundColor: 'success.light', color: 'success.dark' }
                          }}
                        >
                          <RunIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="More Actions">
                        <IconButton 
                          edge="end" 
                          aria-label="more" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMenuOpen(e, query);
                          }} 
                          size="small"
                        >
                          <MoreIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  
                  {/* Metadata row */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap', width: '100%' }}>
                    {query.tags?.map(tag => {
                      if (tag && typeof tag === 'object' && !Array.isArray(tag)) {
                        // Use type assertion to allow property access
                        const label = (tag as any).label ?? String(tag);
                        const onClick = (tag as any).onClick;
                        // Remove onClick and label from props
                        const { onClick: _oc, label: _lbl, ...chipProps } = tag as any;
                        return (
                          <Chip
                            key={label}
                            label={label}
                            size="small"
                            variant="outlined"
                            {...chipProps}
                            {...(typeof onClick === 'function' ? { onClick } : {})}
                          />
                        );
                      }
                      return (
                        <Chip key={tag} label={tag} size="small" variant="outlined" />
                      );
                    })}
                  </Box>
                  
                  {/* Variables info */}
                  {query.variables && Object.keys(query.variables).length > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                      Variables: {Object.keys(query.variables).join(', ')}
                    </Typography>
                  )}
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        {/* Context Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: { minWidth: 200 }
          }}
        >
          <MenuItem onClick={handleEdit}>
            <EditIcon sx={{ mr: 1 }}/> 
            Edit Query
          </MenuItem>
          <MenuItem onClick={handleExportSelected}>
            <ExportIcon sx={{ mr: 1 }}/> 
            Export Selected Query
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1 }}/> 
            Delete Query
          </MenuItem>
        </Menu>

        {/* Export All Confirmation Dialog */}
        <Dialog
          open={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Export All Queries</DialogTitle>
          <DialogContent>
            <Typography>
              This will export all {queries.length} saved queries to a JSON file. 
              You can import this file later to restore your queries.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowExportDialog(false)}>Cancel</Button>
            <Button onClick={handleExportAll} variant="contained" startIcon={<ExportIcon />}>
              Export All
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Drawer>
  );
}
