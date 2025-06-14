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
  ContentCopy as CopyIcon,
  Folder as FolderIcon
} from '@mui/icons-material';
import { QueryLibrary, SavedQuery } from '@/lib/query-library';

interface QueryLibraryDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectQuery: (query: SavedQuery) => void;
  onRunQuery: (query: SavedQuery) => void;
  currentQuery?: string;
  currentEnvironment: string;
}

interface SaveQueryDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (query: SavedQuery) => void;
  queryString: string;
  environment: string;
  editingQuery?: SavedQuery | null;
}

export function SaveQueryDialog({
  open,
  onClose,
  onSave,
  queryString,
  environment,
  editingQuery
}: SaveQueryDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingQuery) {
      setName(editingQuery.name);
      setDescription(editingQuery.description || '');
      setTags(editingQuery.tags?.join(', ') || '');
    } else {
      setName('');
      setDescription('');
      setTags('');
    }
    setError('');
  }, [editingQuery, open]);

  const handleSave = () => {
    if (!name.trim()) {
      setError('Query name is required');
      return;
    }

    try {
      const variables = QueryLibrary.extractVariables(queryString);
      const tagArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
      
      const savedQuery = QueryLibrary.saveQuery({
        name: name.trim(),
        query: queryString,
        variables,
        description: description.trim() || undefined,
        environment,
        tags: tagArray.length > 0 ? tagArray : undefined
      });

      onSave(savedQuery);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save query');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
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
          
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Environment: <Chip label={environment} size="small" />
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
  currentEnvironment
}: QueryLibraryDialogProps) {
  const [queries, setQueries] = useState<SavedQuery[]>([]);
  const [filteredQueries, setFilteredQueries] = useState<SavedQuery[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedQuery, setSelectedQuery] = useState<SavedQuery | null>(null);

  const loadQueries = () => {
    const allQueries = QueryLibrary.getQueries();
    setQueries(allQueries);
    filterQueries(allQueries, searchTerm, selectedTab);
  };

  useEffect(() => {
    if (open) {
      loadQueries();
    }
  }, [open]); // loadQueries is stable, no need to include it

  const filterQueries = (allQueries: SavedQuery[], search: string, tab: number) => {
    let filtered = allQueries;

    // Filter by environment
    if (tab === 1) {
      filtered = filtered.filter(q => q.environment === currentEnvironment);
    }

    // Filter by search term
    if (search) {
      filtered = QueryLibrary.searchQueries(search);
    }

    // Sort by updated date (newest first)
    filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    setFilteredQueries(filtered);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    filterQueries(queries, term, selectedTab);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
    filterQueries(queries, searchTerm, newValue);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, query: SavedQuery) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedQuery(query);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedQuery(null);
  };

  const handleDeleteQuery = () => {
    if (selectedQuery) {
      QueryLibrary.deleteQuery(selectedQuery.id);
      loadQueries();
    }
    handleMenuClose();
  };

  const handleCopyQuery = () => {
    if (selectedQuery) {
      navigator.clipboard.writeText(selectedQuery.query);
    }
    handleMenuClose();
  };

  const handleExportQueries = () => {
    const data = QueryLibrary.exportQueries();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `graphql-queries-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = QueryLibrary.getStats();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Query Library</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Export Queries">
              <IconButton onClick={handleExportQueries} size="small">
                <ExportIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Statistics */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip icon={<FolderIcon />} label={`${stats.totalQueries} queries`} size="small" />
            <Chip label={`${stats.environments.length} environments`} size="small" />
          </Box>

          {/* Search and Tabs */}
          <TextField
            placeholder="Search queries..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          <Tabs value={selectedTab} onChange={handleTabChange}>
            <Tab label="All Queries" />
            <Tab label={`Current Environment (${currentEnvironment})`} />
          </Tabs>

          {/* Query List */}
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filteredQueries.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                {queries.length === 0 ? (
                  <>
                    <Typography variant="h6" gutterBottom>No saved queries yet</Typography>
                    <Typography variant="body2" component="div">
                      Save your first query to build your library!
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography variant="h6" gutterBottom>No queries found</Typography>
                    <Typography variant="body2" component="div">
                      Try adjusting your search or filter criteria
                    </Typography>
                  </>
                )}
              </Box>
            ) : (
              <List>
                {filteredQueries.map((query, index) => (
                  <div key={query.id}>
                    <ListItem
                      component="div"
                      onClick={() => onSelectQuery(query)}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'action.hover' }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {query.name}
                            </Typography>
                            {query.environment !== currentEnvironment && (
                              <Chip label={query.environment} size="small" color="secondary" />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            {query.description && (
                              <Typography variant="body2" color="text.secondary" component="div">
                                {query.description}
                              </Typography>
                            )}
                            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                              {query.tags?.map(tag => (
                                <Chip key={tag} label={tag} size="small" variant="outlined" />
                              ))}
                            </Box>
                            <Typography variant="caption" color="text.secondary" component="div">
                              Updated: {new Date(query.updatedAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Run Query">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRunQuery(query);
                              }}
                              color="success"
                            >
                              <RunIcon />
                            </IconButton>
                          </Tooltip>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, query)}
                          >
                            <MoreIcon />
                          </IconButton>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < filteredQueries.length - 1 && <Divider />}
                  </div>
                ))}
              </List>
            )}
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleCopyQuery}>
          <CopyIcon sx={{ mr: 1 }} />
          Copy Query
        </MenuItem>
        <MenuItem onClick={handleDeleteQuery} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Query
        </MenuItem>
      </Menu>
    </Dialog>
  );
}
