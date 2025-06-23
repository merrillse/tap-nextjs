'use client';

import { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, TextField, Alert, CircularProgress, Chip, Accordion, AccordionSummary, AccordionDetails, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Search, Clear, History, ExpandMore, Business, LocationOn, Phone, Email, Person, Groups, Assignment, Info, Map } from '@mui/icons-material';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS, getEnvironmentKeysByService } from '@/lib/environments';

interface GeopoliticalLocation {
  locationCodeNumber: number;
  geopoliticalLocationId: number;
  name: string;
}

interface ProselytingArea {
  id: string;
  name: string;
  address?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  country?: GeopoliticalLocation;
  vehicleId?: string;
  vehicleUnitOfMeasureCode?: string;
  vehicleUnitOfMeasureLimit?: number;
  vehicleSTWD?: boolean;
  emailAddress?: string;
  updatedDate?: string;
  ecclesiasticalAreaNumber?: number;
  ecclesiasticalAreaName?: string;
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
}

interface District {
  id: string;
  name: string;
  zone?: Zone;
  proselytingAreas?: ProselytingArea[];
}

interface SearchHistory {
  id: string;
  searchedAt: string;
}

const SEARCH_HISTORY_KEY = 'district-search-history';
const MAX_HISTORY_ITEMS = 10;

export default function DistrictPage() {
  const [districtId, setDistrictId] = useState('');
  const [district, setDistrict] = useState<District | null>(null);
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

  const searchDistrict = async (searchId?: string) => {
    const idToSearch = searchId || districtId;
    if (!idToSearch.trim()) {
      setError('Please enter a District ID');
      return;
    }

    if (!apiClient) {
      setError('API client not initialized');
      return;
    }

    setLoading(true);
    setError(null);
    setDistrict(null);

    try {
      const query = `
        query GetDistrict($id: ID!) {
          district(id: $id) {
            id
            name
            zone {
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
            }
            proselytingAreas {
              id
              name
              address
              city
              stateProvince
              postalCode
              country {
                locationCodeNumber
                geopoliticalLocationId
                name
              }
              vehicleId
              vehicleUnitOfMeasureCode
              vehicleUnitOfMeasureLimit
              vehicleSTWD
              emailAddress
              updatedDate
              ecclesiasticalAreaNumber
              ecclesiasticalAreaName
            }
          }
        }
      `;

      const variables = { id: idToSearch };
      const response = await apiClient.executeGraphQLQuery(query, variables);
      
      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors[0].message);
      }

      const data = response.data as { district: District | null };
      if (data.district) {
        setDistrict(data.district);
        addToHistory(idToSearch);
        if (searchId) {
          setDistrictId(searchId);
        }
      } else {
        setError('No district found with that ID');
      }
    } catch (err: any) {
      console.error('Error searching for district:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchDistrict();
  };

  const handleClear = () => {
    setDistrictId('');
    setDistrict(null);
    setError(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatAddress = (area: ProselytingArea) => {
    const parts = [area.address, area.city, area.stateProvince, area.postalCode].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 4 }}>
      <Box sx={{ maxWidth: '1200px', mx: 'auto', px: 3 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            District Search
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Find detailed information about a district by ID
          </Typography>
        </Box>

        {/* Search Form */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap', mb: 2 }}>
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Environment (MGQL/MIS only)</InputLabel>
                  <Select
                    value={selectedEnvironment}
                    label="Environment (MGQL/MIS only)"
                    onChange={(e) => setSelectedEnvironment(e.target.value)}
                    disabled={loading}
                  >
                    {mgqlEnvironments.map(([key, env]) => (
                      <MenuItem key={key} value={key}>
                        {env.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <TextField
                  label="District ID"
                  value={districtId}
                  onChange={(e) => setDistrictId(e.target.value)}
                  placeholder="Enter district ID (e.g., 12345)"
                  variant="outlined"
                  sx={{ flexGrow: 1, minWidth: '300px' }}
                  disabled={loading}
                  helperText="Enter the district's unique identifier"
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
                        onClick={() => searchDistrict(item.id)}
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
        {district && (
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Map color="primary" />
                {district.name || 'District'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                District ID: {district.id}
              </Typography>

              {/* Zone Information */}
              {district.zone && (
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Groups />
                      Zone Information
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="subtitle2" gutterBottom>Zone Details</Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Zone Name:</strong> {district.zone.name || 'N/A'}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Zone ID:</strong> {district.zone.id || 'N/A'}
                    </Typography>

                    {/* Mission Information */}
                    {district.zone.mission && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>Mission Details</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                          <Box>
                            <Typography variant="body2" gutterBottom>
                              <strong>Mission Name:</strong> {district.zone.mission.name || 'N/A'}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              <strong>Mission ID:</strong> {district.zone.mission.id || 'N/A'}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              <strong>Missionary Allocation:</strong> {district.zone.mission.missionaryAllocation || 'N/A'}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              <strong>Address:</strong>
                            </Typography>
                            <Typography variant="body2" sx={{ ml: 2, whiteSpace: 'pre-line' }}>
                              {district.zone.mission.address || 'N/A'}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" gutterBottom>
                              <Person sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                              <strong>Leader:</strong> {district.zone.mission.leaderName || 'N/A'}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              <strong>Leader CMIS ID:</strong> {district.zone.mission.leaderCmisId || 'N/A'}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              <Phone sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                              <strong>Phone:</strong> {district.zone.mission.phone || 'N/A'}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              <Email sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                              <strong>Email:</strong> {district.zone.mission.email || 'N/A'}
                            </Typography>
                            {district.zone.mission.mailingAddress && (
                              <>
                                <Typography variant="body2" gutterBottom>
                                  <strong>Mailing Address:</strong>
                                </Typography>
                                <Typography variant="body2" sx={{ ml: 2, whiteSpace: 'pre-line' }}>
                                  {district.zone.mission.mailingAddress}
                                </Typography>
                              </>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              )}

              {/* District Statistics */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Info />
                    District Statistics
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 3, textAlign: 'center' }}>
                    <Box>
                      <Typography variant="h4" color="primary.main">
                        {district.proselytingAreas?.length || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Proselyting Areas
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="h4" color="secondary.main">
                        {district.zone ? 1 : 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Zone
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="h4" color="success.main">
                        {district.zone?.mission?.missionaryAllocation || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Mission Allocation
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="h4" color="warning.main">
                        {district.zone?.mission ? 1 : 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Mission
                      </Typography>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Proselyting Areas */}
              {district.proselytingAreas && district.proselytingAreas.length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn />
                      Proselyting Areas ({district.proselytingAreas.length})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Area Name</TableCell>
                            <TableCell>ID</TableCell>
                            <TableCell>Address</TableCell>
                            <TableCell>Country</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Vehicle</TableCell>
                            <TableCell>Updated</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {district.proselytingAreas.map((area) => (
                            <TableRow key={area.id}>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {area.name}
                                </Typography>
                                {area.ecclesiasticalAreaName && (
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    {area.ecclesiasticalAreaName}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {area.id}
                                </Typography>
                                {area.ecclesiasticalAreaNumber && (
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Area #{area.ecclesiasticalAreaNumber}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {formatAddress(area)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {area.country?.name || 'N/A'}
                                </Typography>
                                {area.country?.locationCodeNumber && (
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Code: {area.country.locationCodeNumber}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {area.emailAddress || 'N/A'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {area.vehicleId ? (
                                  <Box>
                                    <Typography variant="body2">
                                      {area.vehicleId}
                                    </Typography>
                                    {area.vehicleUnitOfMeasureCode && (
                                      <Typography variant="caption" color="text.secondary" display="block">
                                        {area.vehicleUnitOfMeasureCode}: {area.vehicleUnitOfMeasureLimit}
                                      </Typography>
                                    )}
                                    {area.vehicleSTWD && (
                                      <Chip label="STWD" size="small" color="primary" variant="outlined" />
                                    )}
                                  </Box>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    N/A
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {formatDate(area.updatedDate)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
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
                    <strong>District ID:</strong> {district.id}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>District Name:</strong> {district.name || 'N/A'}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Zone ID:</strong> {district.zone?.id || 'N/A'}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Zone Name:</strong> {district.zone?.name || 'N/A'}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Mission ID:</strong> {district.zone?.mission?.id || 'N/A'}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Mission Name:</strong> {district.zone?.mission?.name || 'N/A'}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Proselyting Areas Count:</strong> {district.proselytingAreas?.length || 0}
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
