'use client';

import { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, TextField, Alert, CircularProgress, Chip, Accordion, AccordionSummary, AccordionDetails, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Search, Clear, History, ExpandMore, Assignment, LocationOn, Person, Groups, CalendarToday, Info } from '@mui/icons-material';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS, getEnvironmentKeysByService } from '@/lib/environments';

interface LabelValue {
  value: number;
  label: string;
}

interface Companion {
  name: string;
  legacyMissId: number;
}

interface MissionaryHistory {
  legacyMissId: number;
  assignmentLocationId: number;
  assignmentLocationName: string;
  effectiveDate: string;
  effectiveEndDate: string;
  proselytingAreaId: number;
  areaName: string;
  areaDate: string;
  areaEndDate: string;
  roleId: number;
  roleType: string;
  roleDate: string;
  roleEndDate: string;
  companions: Companion[];
  companionshipDate: string;
  companionshipEndDate: string;
}

interface AssignmentLocation {
  id: string;
  name: string;
  type: LabelValue;
  missionaryHistories: MissionaryHistory[];
}

interface SearchHistory {
  id: string;
  searchedAt: string;
}

const SEARCH_HISTORY_KEY = 'assignment-location-search-history';
const MAX_HISTORY_ITEMS = 10;

export default function AssignmentLocationPage() {
  const [assignmentLocationId, setAssignmentLocationId] = useState('');
  const [assignmentLocation, setAssignmentLocation] = useState<AssignmentLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState('mis-gql-dev');
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);

  // Get only MGQL/MIS environments (no MOGS)
  const mgqlEnvironments = Object.entries(ENVIRONMENTS).filter(([key]) => 
    key.startsWith('mis-gql-')
  );

  // Initialize API client with default MIS development environment
  useEffect(() => {
    const savedEnvironment = localStorage.getItem('selectedEnvironment');
    const environmentToUse = (savedEnvironment && ENVIRONMENTS[savedEnvironment] && savedEnvironment.startsWith('mis-gql-')) 
      ? savedEnvironment 
      : 'mis-gql-dev';
    
    setSelectedEnvironment(environmentToUse);
    const config = ENVIRONMENTS[environmentToUse];
    
    if (config) {
      setApiClient(new ApiClient(config, environmentToUse));
    }
  }, []);

  // Update API client when environment changes
  useEffect(() => {
    const config = ENVIRONMENTS[selectedEnvironment];
    if (config) {
      setApiClient(new ApiClient(config, selectedEnvironment));
      localStorage.setItem('selectedEnvironment', selectedEnvironment);
    }
  }, [selectedEnvironment]);

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setSearchHistory(parsed);
      } catch (e) {
        console.error('Error parsing search history:', e);
      }
    }
    setIsHistoryLoaded(true);
  }, []);

  // Save search history to localStorage
  useEffect(() => {
    if (isHistoryLoaded) {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory));
    }
  }, [searchHistory, isHistoryLoaded]);

  const addToHistory = (id: string) => {
    if (!id.trim()) return;
    
    const newHistoryItem: SearchHistory = {
      id: id.trim(),
      searchedAt: new Date().toISOString()
    };

    setSearchHistory(prev => {
      // Remove existing entry if it exists
      const filtered = prev.filter(item => item.id !== id.trim());
      // Add new entry at the beginning
      const updated = [newHistoryItem, ...filtered];
      // Keep only the last MAX_HISTORY_ITEMS
      return updated.slice(0, MAX_HISTORY_ITEMS);
    });
  };

  const removeFromHistory = (id: string) => {
    setSearchHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    setSearchHistory([]);
  };

  const searchAssignmentLocation = async (searchId?: string) => {
    const idToSearch = searchId || assignmentLocationId;
    if (!idToSearch.trim()) {
      setError('Please enter an Assignment Location ID');
      return;
    }

    if (!apiClient) {
      setError('API client not initialized');
      return;
    }

    setLoading(true);
    setError(null);
    setAssignmentLocation(null);

    try {
      const query = `
        query AssignmentLocation($id: ID!) {
          assignmentLocation(id: $id) {
            id
            name
            type {
              value
              label
            }
            missionaryHistories {
              legacyMissId
              assignmentLocationId
              assignmentLocationName
              effectiveDate
              effectiveEndDate
              proselytingAreaId
              areaName
              areaDate
              areaEndDate
              roleId
              roleType
              roleDate
              roleEndDate
              companions {
                name
                legacyMissId
              }
              companionshipDate
              companionshipEndDate
            }
          }
        }
      `;

      const variables = { id: idToSearch };
      const response = await apiClient.executeGraphQLQuery(query, variables);
      
      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors[0].message);
      }

      const data = response.data as { assignmentLocation: AssignmentLocation | null };
      if (data.assignmentLocation) {
        setAssignmentLocation(data.assignmentLocation);
        addToHistory(idToSearch);
        if (searchId) {
          setAssignmentLocationId(searchId);
        }
      } else {
        setError('No assignment location found for this ID');
      }
    } catch (err: any) {
      console.error('Error searching for assignment location:', err);
      setError(err instanceof Error ? err.message : 'Failed to search for assignment location');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchAssignmentLocation();
  };

  const handleClear = () => {
    setAssignmentLocationId('');
    setAssignmentLocation(null);
    setError(null);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const useHistorySearch = (historyItem: SearchHistory) => {
    setAssignmentLocationId(historyItem.id);
  };

  const groupHistoriesByMissionary = (histories: MissionaryHistory[]) => {
    const grouped = histories.reduce((acc, history) => {
      const missionaryId = history.legacyMissId.toString();
      if (!acc[missionaryId]) {
        acc[missionaryId] = [];
      }
      acc[missionaryId].push(history);
      return acc;
    }, {} as Record<string, MissionaryHistory[]>);

    // Sort histories within each missionary by effective date (most recent first)
    Object.keys(grouped).forEach(missionaryId => {
      grouped[missionaryId].sort((a, b) => {
        const dateA = new Date(a.effectiveDate || '1900-01-01').getTime();
        const dateB = new Date(b.effectiveDate || '1900-01-01').getTime();
        return dateB - dateA;
      });
    });

    return grouped;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchAssignmentLocation();
  };

  const clearSearchHistory = () => {
    clearHistory();
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', p: 3 }}>
      <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assignment color="primary" />
            Assignment Location Search
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Find detailed information about an assignment location by ID
          </Typography>
        </Box>

        {/* Environment Selection */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <FormControl fullWidth>
              <InputLabel>Environment</InputLabel>
              <Select
                value={selectedEnvironment}
                label="Environment"
                onChange={(e) => setSelectedEnvironment(e.target.value)}
              >
                {mgqlEnvironments.map(([key, env]) => (
                  <MenuItem key={key} value={key}>
                    {env.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </CardContent>
        </Card>

        {/* Search Form */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
              <TextField
                fullWidth
                label="Assignment Location ID"
                value={assignmentLocationId}
                onChange={(e) => setAssignmentLocationId(e.target.value)}
                placeholder="Enter assignment location ID (e.g., 12345)"
                required
                variant="outlined"
              />
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !assignmentLocationId.trim()}
                startIcon={loading ? <CircularProgress size={20} /> : <Search />}
                sx={{ minWidth: 120 }}
              >
                {loading ? 'Searching...' : 'Search'}
              </Button>
              <Button
                variant="outlined"
                onClick={handleClear}
                startIcon={<Clear />}
                disabled={loading}
              >
                Clear
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Search History */}
        {searchHistory.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <History color="action" />
                  Recent Searches
                </Typography>
                <Button
                  onClick={clearSearchHistory}
                  color="error"
                  size="small"
                  startIcon={<Clear />}
                >
                  Clear History
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {searchHistory.map((item, index) => (
                  <Chip
                    key={index}
                    label={`Location ID: ${item.id}`}
                    onClick={() => useHistorySearch(item)}
                    onDelete={() => removeFromHistory(item.id)}
                    variant="outlined"
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <strong>Search Error:</strong> {error}
          </Alert>
        )}

        {/* Assignment Location Results */}
        {assignmentLocation && (
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ bgcolor: 'primary.50', borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h5" color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Assignment />
                Assignment Location Details
              </Typography>
              <Typography color="primary.dark">Location ID: {assignmentLocation.id}</Typography>
            </CardContent>

            <CardContent sx={{ p: 3 }}>
              {/* Basic Location Information */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn color="primary" />
                  Location Information
                </Typography>
                <Card variant="outlined" sx={{ bgcolor: 'primary.50', p: 2 }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
                    <Box>
                      <Typography variant="caption" color="primary.main">Location Name:</Typography>
                      <Typography variant="body2" fontWeight="medium" color="primary.dark">
                        {assignmentLocation.name || 'Not specified'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="primary.main">Location ID:</Typography>
                      <Typography variant="body2" fontWeight="medium" color="primary.dark">
                        {assignmentLocation.id}
                      </Typography>
                    </Box>
                    {assignmentLocation.type && (
                      <Box>
                        <Typography variant="caption" color="primary.main">Location Type:</Typography>
                        <Typography variant="body2" fontWeight="medium" color="primary.dark">
                          {assignmentLocation.type.label} (ID: {assignmentLocation.type.value})
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Card>
              </Box>

              {/* Missionary Histories */}
              {assignmentLocation.missionaryHistories && assignmentLocation.missionaryHistories.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Groups color="primary" />
                    Missionary Assignment History ({assignmentLocation.missionaryHistories.length} records)
                  </Typography>
                  
                  {(() => {
                    const groupedHistories = groupHistoriesByMissionary(assignmentLocation.missionaryHistories);
                    return (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {Object.entries(groupedHistories).map(([missionaryId, histories]) => (
                          <Card key={missionaryId} variant="outlined" sx={{ bgcolor: 'grey.50' }}>
                            <CardContent>
                              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Person color="action" />
                                Missionary #{missionaryId} ({histories.length} assignment{histories.length > 1 ? 's' : ''})
                              </Typography>
                              
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {histories.map((history, index) => (
                                  <Card key={index} variant="outlined" sx={{ bgcolor: 'background.paper' }}>
                                    <CardContent>
                                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
                                        {/* Assignment Period */}
                                        <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' }, mb: 2 }}>
                                          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                            <Chip
                                              label={`Assignment: ${formatDate(history.effectiveDate)} - ${formatDate(history.effectiveEndDate)}`}
                                              color="success"
                                              variant="outlined"
                                              size="small"
                                            />
                                            {history.roleType && (
                                              <Chip
                                                label={`Role: ${history.roleType}`}
                                                color="primary"
                                                variant="outlined"
                                                size="small"
                                              />
                                            )}
                                          </Box>
                                        </Box>

                                        {/* Assignment Details */}
                                        <Box>
                                          <Typography variant="caption" color="text.secondary">Assignment Location:</Typography>
                                          <Typography variant="body2" fontWeight="medium">
                                            {history.assignmentLocationName} (ID: {history.assignmentLocationId})
                                          </Typography>
                                        </Box>
                                        
                                        {history.areaName && (
                                          <Box>
                                            <Typography variant="caption" color="text.secondary">Proselyting Area:</Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                              {history.areaName} (ID: {history.proselytingAreaId})
                                            </Typography>
                                          </Box>
                                        )}

                                        {history.areaDate && (
                                          <Box>
                                            <Typography variant="caption" color="text.secondary">Area Period:</Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                              {formatDate(history.areaDate)} - {formatDate(history.areaEndDate)}
                                            </Typography>
                                          </Box>
                                        )}

                                        {history.roleDate && (
                                          <Box>
                                            <Typography variant="caption" color="text.secondary">Role Period:</Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                              {formatDate(history.roleDate)} - {formatDate(history.roleEndDate)}
                                            </Typography>
                                          </Box>
                                        )}

                                        {history.roleId && (
                                          <Box>
                                            <Typography variant="caption" color="text.secondary">Role ID:</Typography>
                                            <Typography variant="body2" fontWeight="medium">{history.roleId}</Typography>
                                          </Box>
                                        )}

                                        {history.companionshipDate && (
                                          <Box>
                                            <Typography variant="caption" color="text.secondary">Companionship Period:</Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                              {formatDate(history.companionshipDate)} - {formatDate(history.companionshipEndDate)}
                                            </Typography>
                                          </Box>
                                        )}

                                        {/* Companions */}
                                        {history.companions && history.companions.length > 0 && (
                                          <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' }, mt: 2 }}>
                                            <Typography variant="caption" color="text.secondary">
                                              Companions ({history.companions.length}):
                                            </Typography>
                                            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                              {history.companions.map((companion, compIndex) => (
                                                <Chip
                                                  key={compIndex}
                                                  label={`${companion.name} (#${companion.legacyMissId})`}
                                                  color="secondary"
                                                  variant="outlined"
                                                  size="small"
                                                />
                                              ))}
                                            </Box>
                                          </Box>
                                        )}
                                      </Box>
                                    </CardContent>
                                  </Card>
                                ))}
                              </Box>
                            </CardContent>
                          </Card>
                        ))}
                      </Box>
                    );
                  })()}
                </Box>
              )}

              {/* Summary Statistics */}
              {assignmentLocation.missionaryHistories && assignmentLocation.missionaryHistories.length > 0 && (
                <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Info color="primary" />
                      Location Statistics
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                      <Card sx={{ bgcolor: 'primary.50', textAlign: 'center', p: 2 }}>
                        <Typography variant="h4" fontWeight="bold" color="primary.dark">
                          {new Set(assignmentLocation.missionaryHistories.map(h => h.legacyMissId)).size}
                        </Typography>
                        <Typography variant="caption" color="primary.main">Total Missionaries</Typography>
                      </Card>
                      <Card sx={{ bgcolor: 'success.50', textAlign: 'center', p: 2 }}>
                        <Typography variant="h4" fontWeight="bold" color="success.dark">
                          {assignmentLocation.missionaryHistories.length}
                        </Typography>
                        <Typography variant="caption" color="success.main">Assignment Records</Typography>
                      </Card>
                      <Card sx={{ bgcolor: 'secondary.50', textAlign: 'center', p: 2 }}>
                        <Typography variant="h4" fontWeight="bold" color="secondary.dark">
                          {assignmentLocation.missionaryHistories.reduce((total, h) => total + (h.companions?.length || 0), 0)}
                        </Typography>
                        <Typography variant="caption" color="secondary.main">Total Companions</Typography>
                      </Card>
                    </Box>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card sx={{ bgcolor: 'info.50', border: 1, borderColor: 'info.200' }}>
          <CardContent>
            <Typography variant="h6" color="info.main" gutterBottom>
              💡 How to Use Assignment Location Search
            </Typography>
            <Box sx={{ '& > *': { mb: 1 } }}>
              <Typography variant="body2" color="info.dark">
                • Enter an assignment location ID to find detailed information about that location
              </Typography>
              <Typography variant="body2" color="info.dark">
                • View location details including name, type, and associated missionary histories
              </Typography>
              <Typography variant="body2" color="info.dark">
                • Explore comprehensive missionary assignment records including dates, roles, and companions
              </Typography>
              <Typography variant="body2" color="info.dark">
                • Recent searches are automatically saved and can be accessed from the search history section
              </Typography>
              <Typography variant="body2" color="info.dark">
                • Assignment histories are grouped by missionary and sorted by most recent assignment first
              </Typography>
              <Typography variant="body2" color="info.dark">
                • View statistics including total missionaries, assignment records, and companion relationships
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
