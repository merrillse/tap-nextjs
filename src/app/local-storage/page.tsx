'use client';

import { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, Chip, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Tooltip, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { Storage, Delete, Visibility, Edit, Save, Cancel, DeleteSweep, Refresh, Download, Upload, ExpandMore, Info, Warning, CheckCircle } from '@mui/icons-material';

interface LocalStorageItem {
  key: string;
  value: string;
  size: number;
  type: 'string' | 'object' | 'array' | 'number' | 'boolean' | 'unknown';
  parsedValue?: any;
  lastModified?: string;
}

interface StorageStats {
  totalItems: number;
  totalSize: number;
  searchHistoryItems: number;
  otherItems: number;
  largestItem: string;
  largestItemSize: number;
}

export default function LocalStoragePage() {
  const [storageItems, setStorageItems] = useState<LocalStorageItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<LocalStorageItem[]>([]);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [selectedItem, setSelectedItem] = useState<LocalStorageItem | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load localStorage data
  const loadLocalStorage = () => {
    try {
      const items: LocalStorageItem[] = [];
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value !== null) {
          const item: LocalStorageItem = {
            key,
            value,
            size: new Blob([value]).size,
            type: 'string'
          };

          // Try to parse as JSON to determine type
          try {
            const parsed = JSON.parse(value);
            item.parsedValue = parsed;
            
            if (Array.isArray(parsed)) {
              item.type = 'array';
            } else if (typeof parsed === 'object' && parsed !== null) {
              item.type = 'object';
            } else if (typeof parsed === 'number') {
              item.type = 'number';
            } else if (typeof parsed === 'boolean') {
              item.type = 'boolean';
            }
          } catch (e) {
            // Keep as string type
            item.type = 'string';
          }

          items.push(item);
        }
      });

      // Sort by key name
      items.sort((a, b) => a.key.localeCompare(b.key));
      setStorageItems(items);
      setFilteredItems(items);
      calculateStats(items);
      setError(null);
    } catch (err) {
      setError('Error loading localStorage: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  // Calculate storage statistics
  const calculateStats = (items: LocalStorageItem[]) => {
    const stats: StorageStats = {
      totalItems: items.length,
      totalSize: items.reduce((sum, item) => sum + item.size, 0),
      searchHistoryItems: items.filter(item => item.key.includes('search-history')).length,
      otherItems: items.filter(item => !item.key.includes('search-history')).length,
      largestItem: '',
      largestItemSize: 0
    };

    // Find largest item
    items.forEach(item => {
      if (item.size > stats.largestItemSize) {
        stats.largestItemSize = item.size;
        stats.largestItem = item.key;
      }
    });

    setStorageStats(stats);
  };

  // Filter items based on type and search query
  useEffect(() => {
    let filtered = storageItems;

    // Filter by type
    if (filterType !== 'all') {
      if (filterType === 'search-history') {
        filtered = filtered.filter(item => item.key.includes('search-history'));
      } else {
        filtered = filtered.filter(item => item.type === filterType);
      }
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.value.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  }, [storageItems, filterType, searchQuery]);

  // Load data on component mount
  useEffect(() => {
    loadLocalStorage();
  }, []);

  const handleViewItem = (item: LocalStorageItem) => {
    setSelectedItem(item);
    setViewDialogOpen(true);
  };

  const handleEditItem = (item: LocalStorageItem) => {
    setSelectedItem(item);
    setEditValue(item.value);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (selectedItem) {
      try {
        localStorage.setItem(selectedItem.key, editValue);
        setSuccess(`Successfully updated "${selectedItem.key}"`);
        loadLocalStorage();
        setEditDialogOpen(false);
        setSelectedItem(null);
        setEditValue('');
      } catch (err) {
        setError('Error saving item: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    }
  };

  const handleDeleteItem = (key: string) => {
    if (confirm(`Are you sure you want to delete "${key}"?`)) {
      try {
        localStorage.removeItem(key);
        setSuccess(`Successfully deleted "${key}"`);
        loadLocalStorage();
      } catch (err) {
        setError('Error deleting item: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    }
  };

  const handleClearAllSearchHistory = () => {
    if (confirm('Are you sure you want to clear all search history? This action cannot be undone.')) {
      try {
        const searchHistoryKeys = Object.keys(localStorage).filter(key => key.includes('search-history'));
        searchHistoryKeys.forEach(key => localStorage.removeItem(key));
        setSuccess(`Cleared ${searchHistoryKeys.length} search history items`);
        loadLocalStorage();
      } catch (err) {
        setError('Error clearing search history: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear ALL localStorage? This will remove all stored data and cannot be undone.')) {
      try {
        const itemCount = localStorage.length;
        localStorage.clear();
        setSuccess(`Cleared all ${itemCount} localStorage items`);
        loadLocalStorage();
      } catch (err) {
        setError('Error clearing localStorage: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    }
  };

  const handleExportData = () => {
    try {
      const data: Record<string, string> = {};
      Object.keys(localStorage).forEach(key => {
        data[key] = localStorage.getItem(key) || '';
      });
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `localStorage-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess('LocalStorage data exported successfully');
    } catch (err) {
      setError('Error exporting data: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'object': return '📦';
      case 'array': return '📋';
      case 'number': return '🔢';
      case 'boolean': return '✅';
      case 'string': return '📝';
      default: return '❓';
    }
  };

  const dismissNotifications = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 4 }}>
      <Box sx={{ maxWidth: '1400px', mx: 'auto', px: 3 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Local Storage Manager
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Browse, edit, and manage your browser's local storage data
          </Typography>
        </Box>

        {/* Notifications */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={dismissNotifications}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={dismissNotifications}>
            {success}
          </Alert>
        )}

        {/* Statistics */}
        {storageStats && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Storage Statistics
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr 1fr' }, gap: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">{storageStats.totalItems}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Items</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="secondary">{formatBytes(storageStats.totalSize)}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Size</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">{storageStats.searchHistoryItems}</Typography>
                  <Typography variant="body2" color="text.secondary">Search History</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">{storageStats.otherItems}</Typography>
                  <Typography variant="body2" color="text.secondary">Other Items</Typography>
                </Box>
              </Box>
              {storageStats.largestItem && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="body2">
                    <strong>Largest item:</strong> {storageStats.largestItem} ({formatBytes(storageStats.largestItemSize)})
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* Controls */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={loadLocalStorage}
              >
                Refresh
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleExportData}
              >
                Export All
              </Button>
              <Button
                variant="outlined"
                color="warning"
                startIcon={<DeleteSweep />}
                onClick={handleClearAllSearchHistory}
              >
                Clear Search History
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={handleClearAll}
              >
                Clear All
              </Button>
            </Box>

            {/* Filters */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <TextField
                label="Search keys or values"
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ minWidth: '200px' }}
              />
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {['all', 'search-history', 'object', 'array', 'string', 'number', 'boolean'].map(type => (
                  <Chip
                    key={type}
                    label={type === 'search-history' ? 'Search History' : type.charAt(0).toUpperCase() + type.slice(1)}
                    variant={filterType === type ? 'filled' : 'outlined'}
                    color={filterType === type ? 'primary' : 'default'}
                    onClick={() => setFilterType(type)}
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Local Storage Items
              {filteredItems.length !== storageItems.length && (
                <Chip 
                  label={`${filteredItems.length} of ${storageItems.length}`} 
                  color="primary" 
                  size="small" 
                  sx={{ ml: 2 }}
                />
              )}
            </Typography>
            
            {filteredItems.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Storage sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No items found
                </Typography>
                <Typography color="text.secondary">
                  {storageItems.length === 0 ? 'No localStorage data exists' : 'No items match your current filters'}
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ mt: 2, maxHeight: '600px' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.100' }}>
                      <TableCell><strong>Key</strong></TableCell>
                      <TableCell><strong>Type</strong></TableCell>
                      <TableCell><strong>Size</strong></TableCell>
                      <TableCell><strong>Preview</strong></TableCell>
                      <TableCell><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredItems.map((item, index) => (
                      <TableRow 
                        key={item.key}
                        sx={{ 
                          '&:nth-of-type(odd)': { backgroundColor: 'grey.50' },
                          '&:hover': { backgroundColor: 'blue.50' }
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {item.key.includes('search-history') && (
                              <Chip 
                                label="History" 
                                size="small" 
                                color="info" 
                                sx={{ mr: 1, fontSize: '0.7rem' }}
                              />
                            )}
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontFamily: 'monospace',
                                wordBreak: 'break-all',
                                maxWidth: '200px'
                              }}
                            >
                              {item.key}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ marginRight: '8px' }}>{getTypeIcon(item.type)}</span>
                            <Typography variant="body2">{item.type}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{formatBytes(item.size)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              maxWidth: '300px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {item.type === 'object' || item.type === 'array' 
                              ? JSON.stringify(item.parsedValue).substring(0, 100) + '...'
                              : item.value.substring(0, 100) + (item.value.length > 100 ? '...' : '')
                            }
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="View">
                              <IconButton size="small" onClick={() => handleViewItem(item)}>
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => handleEditItem(item)}>
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton 
                                size="small" 
                                color="error" 
                                onClick={() => handleDeleteItem(item.key)}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* View Dialog */}
        <Dialog 
          open={viewDialogOpen} 
          onClose={() => setViewDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            View localStorage Item: {selectedItem?.key}
          </DialogTitle>
          <DialogContent>
            {selectedItem && (
              <Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Type: {selectedItem.type}</Typography>
                  <Typography variant="subtitle2" color="text.secondary">Size: {formatBytes(selectedItem.size)}</Typography>
                </Box>
                <TextField
                  fullWidth
                  multiline
                  rows={15}
                  value={selectedItem.type === 'object' || selectedItem.type === 'array' 
                    ? JSON.stringify(selectedItem.parsedValue, null, 2)
                    : selectedItem.value
                  }
                  variant="outlined"
                  InputProps={{
                    readOnly: true,
                    sx: { fontFamily: 'monospace', fontSize: '0.9rem' }
                  }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog 
          open={editDialogOpen} 
          onClose={() => setEditDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Edit localStorage Item: {selectedItem?.key}
          </DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Be careful when editing localStorage values. Invalid JSON may break application functionality.
              </Typography>
            </Alert>
            <TextField
              fullWidth
              multiline
              rows={15}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              variant="outlined"
              InputProps={{
                sx: { fontFamily: 'monospace', fontSize: '0.9rem' }
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)} startIcon={<Cancel />}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit} 
              variant="contained" 
              startIcon={<Save />}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
