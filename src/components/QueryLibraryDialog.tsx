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
  editingQuery?: SavedQuery | null;
}

export function SaveQueryDialog({
  open,
  onClose,
  onSave,
  query,
  variables,
  environment,
  editingQuery
}: SaveQueryDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [currentVariables, setCurrentVariables] = useState('{}');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingQuery) {
      setName(editingQuery.name);
      setDescription(editingQuery.description || '');
      setTags(editingQuery.tags?.join(', ') || '');
      // editingQuery.variables is Record<string, unknown>, stringify for CodeEditor
      setCurrentVariables(editingQuery.variables ? safeStringify(editingQuery.variables) : '{}');
    } else {
      setName('');
      setDescription('');
      setTags('');
      // variables prop is already a string
      setCurrentVariables(variables || '{}');
    }
    setError('');
  }, [editingQuery, open, variables]);

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
        {editingQuery ? 'Update Query' : 'Save Query'}
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
        (q.tags && q.tags.some(tag => tag.toLowerCase().includes(term)))
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
          placeholder="Search queries by name, description, or tags..."
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
