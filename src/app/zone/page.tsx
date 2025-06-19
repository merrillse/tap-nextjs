'use client';

import { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, TextField, Alert, CircularProgress, Chip, Accordion, AccordionSummary, AccordionDetails, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Search, Clear, History, ExpandMore, Business, LocationOn, Phone, Email, Person, Groups, Assignment, Info } from '@mui/icons-material';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS } from '@/lib/environments';

interface ProselytingArea {
  id: string;
  name: string;
  address?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
}

interface District {
  id: string;
  name: string;
  proselytingAreas?: ProselytingArea[];
}

interface Mission {
  id: string;
  name: string;
  address?: string;
  mailingAddress?: string;
  phone?: string;
  email?: string;
  leaderName?: string;
  leaderCmisId?: number;
  missionaryAllocation?: number;
}

interface Zone {
  id: string;
  name: string;
  mission?: Mission;
  districts?: District[];
}

interface SearchHistory {
  id: string;
  searchedAt: string;
}

const SEARCH_HISTORY_KEY = 'zone-search-history';
const MAX_HISTORY_ITEMS = 10;

export default function ZonePage() {
  const [zoneId, setZoneId] = useState('');
  const [zone, setZone] = useState<Zone | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState('development');
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);

  // Initialize API client when environment changes
  useEffect(() => {
    const config = ENVIRONMENTS[selectedEnvironment];
    if (config) {
      setApiClient(new ApiClient(config, selectedEnvironment));
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

  const searchZone = async (searchId?: string) => {
    const idToSearch = searchId || zoneId;
    if (!idToSearch.trim()) {
      setError('Please enter a Zone ID');
      return;
    }

    if (!apiClient) {
      setError('API client not initialized');
      return;
    }

    setLoading(true);
    setError(null);
    setZone(null);

    try {
      const query = `
        query GetZone($id: ID!) {
          zone(id: $id) {
            id
            name
            mission {
              id
              name
              address
              mailingAddress
              phone
              email
              leaderName
              leaderCmisId
              missionaryAllocation
            }
            districts {
              id
              name
              proselytingAreas {
                id
                name
                address
                city
                stateProvince
                postalCode
              }
            }
          }
        }
      `;

      const variables = { id: idToSearch };
      const response = await apiClient.executeGraphQLQuery(query, variables);
      const data = response.data as { zone: Zone };

      if (data?.zone) {
        setZone(data.zone);
        addToHistory(idToSearch);
        if (searchId) {
          setZoneId(searchId);
        }
      } else {
        setError('No zone found with that ID');
      }
    } catch (err) {
      console.error('GraphQL Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchZone();
  };

  const handleClear = () => {
    setZoneId('');
    setZone(null);
    setError(null);
  };

  const formatAddress = (area: ProselytingArea) => {
    const parts = [area.address, area.city, area.stateProvince, area.postalCode].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  const getTotalProselytingAreas = () => {
    if (!zone?.districts) return 0;
    return zone.districts.reduce((total, district) => total + (district.proselytingAreas?.length || 0), 0);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 4 }}>
      <Box sx={{ maxWidth: '1200px', mx: 'auto', px: 3 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Zone Search
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Retrieve detailed zone information including mission, districts, and proselyting areas
          </Typography>
        </Box>

        {/* Search Form */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap', mb: 2 }}>
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Environment</InputLabel>
                  <Select
                    value={selectedEnvironment}
                    label="Environment"
                    onChange={(e) => setSelectedEnvironment(e.target.value)}
                    disabled={loading}
                  >
                    {Object.entries(ENVIRONMENTS).map(([key, env]) => (
                      <MenuItem key={key} value={key}>
                        {env.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <TextField
                  label="Zone ID"
                  value={zoneId}
                  onChange={(e) => setZoneId(e.target.value)}
                  placeholder="Enter zone ID"
                  variant="outlined"
                  sx={{ flexGrow: 1, minWidth: '300px' }}
                  disabled={loading}
                  helperText="Enter the zone's unique identifier"
                />
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <Search />}
                  disabled={loading}
                  sx={{ minWidth: '120px' }}
                >
                  {loading ? 'Searching...' : 'Search'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Clear />}
                  onClick={handleClear}
                  disabled={loading}
                >
                  Clear
                </Button>
              </Box>
            </form>

            {/* Search History */}
            {searchHistory.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Button
                    variant="text"
                    startIcon={<History />}
                    onClick={() => setShowHistory(!showHistory)}
                    size="small"
                  >
                    Search History ({searchHistory.length})
                  </Button>
                  <Button
                    variant="text"
                    color="error"
                    onClick={clearHistory}
                    size="small"
                  >
                    Clear History
                  </Button>
                </Box>
                {showHistory && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {searchHistory.map((item, index) => (
                      <Chip
                        key={index}
                        label={`${item.id} (${new Date(item.searchedAt).toLocaleDateString()})`}
                        onClick={() => searchZone(item.id)}
                        onDelete={() => removeFromHistory(item.id)}
                        variant="outlined"
                        size="small"
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { 
                            bgcolor: 'primary.50',
                            borderColor: 'primary.main'
                          }
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Results */}
        {zone && (
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Groups color="primary" />
                {zone.name || 'Zone'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Zone ID: {zone.id}
              </Typography>

              {/* Mission Information */}
              {zone.mission && (
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Business />
                      Mission Information
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>Basic Information</Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Mission Name:</strong> {zone.mission.name || 'N/A'}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Mission ID:</strong> {zone.mission.id || 'N/A'}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Missionary Allocation:</strong> {zone.mission.missionaryAllocation || 'N/A'}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Address:</strong>
                        </Typography>
                        <Typography variant="body2" sx={{ ml: 2, whiteSpace: 'pre-line' }}>
                          {zone.mission.address || 'N/A'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>Leadership & Contact</Typography>
                        <Typography variant="body2" gutterBottom>
                          <Person sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                          <strong>Leader:</strong> {zone.mission.leaderName || 'N/A'}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Leader CMIS ID:</strong> {zone.mission.leaderCmisId || 'N/A'}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <Phone sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                          <strong>Phone:</strong> {zone.mission.phone || 'N/A'}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <Email sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                          <strong>Email:</strong> {zone.mission.email || 'N/A'}
                        </Typography>
                        {zone.mission.mailingAddress && (
                          <>
                            <Typography variant="body2" gutterBottom>
                              <strong>Mailing Address:</strong>
                            </Typography>
                            <Typography variant="body2" sx={{ ml: 2, whiteSpace: 'pre-line' }}>
                              {zone.mission.mailingAddress}
                            </Typography>
                          </>
                        )}
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Zone Statistics */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Info />
                    Zone Statistics
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 3, textAlign: 'center' }}>
                    <Box>
                      <Typography variant="h4" color="primary.main">
                        {zone.districts?.length || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Districts
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="h4" color="secondary.main">
                        {getTotalProselytingAreas()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Proselyting Areas
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="h4" color="success.main">
                        {zone.mission?.missionaryAllocation || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Missionary Allocation
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="h4" color="warning.main">
                        {zone.mission ? 1 : 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Mission
                      </Typography>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Districts */}
              {zone.districts && zone.districts.length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn />
                      Districts ({zone.districts.length})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {zone.districts.map((district) => (
                        <Card key={district.id} variant="outlined">
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              {district.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              District ID: {district.id}
                            </Typography>
                            
                            {district.proselytingAreas && district.proselytingAreas.length > 0 ? (
                              <Box>
                                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                                  Proselyting Areas ({district.proselytingAreas.length})
                                </Typography>
                                <TableContainer component={Paper} variant="outlined">
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell>Area Name</TableCell>
                                        <TableCell>ID</TableCell>
                                        <TableCell>Address</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {district.proselytingAreas.map((area) => (
                                        <TableRow key={area.id}>
                                          <TableCell>{area.name}</TableCell>
                                          <TableCell>{area.id}</TableCell>
                                          <TableCell>{formatAddress(area)}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                No proselyting areas found for this district.
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Raw Data */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Assignment />
                    Raw Data
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" gutterBottom>
                    <strong>Zone ID:</strong> {zone.id}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Zone Name:</strong> {zone.name || 'N/A'}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Mission ID:</strong> {zone.mission?.id || 'N/A'}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Districts Count:</strong> {zone.districts?.length || 0}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Total Proselyting Areas:</strong> {getTotalProselytingAreas()}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}
