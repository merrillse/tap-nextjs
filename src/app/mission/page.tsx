'use client';

import { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, TextField, Alert, CircularProgress, Chip, Accordion, AccordionSummary, AccordionDetails, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Search, Clear, History, ExpandMore, Business, LocationOn, Phone, Email, Fax, Person, Groups, Assignment, Info, MobileScreenShare } from '@mui/icons-material';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS } from '@/lib/environments';

interface Zone {
  id: string;
  name: string;
  districts?: District[];
}

interface District {
  id: string;
  name: string;
}

interface Mission {
  id: string;
  name: string;
  address?: string;
  mailingAddress?: string;
  phoneInternationalCode?: string;
  phone?: string;
  phoneExtension?: string;
  faxInternationalCode?: string;
  fax?: string;
  faxExtension?: string;
  email?: string;
  leaderCmisId?: number;
  leaderName?: string;
  leaderHomeAddress?: string;
  leaderPhoneInternationalCode?: string;
  leaderPhone?: string;
  leaderPhoneExtension?: string;
  leaderCellInternationalCode?: string;
  leaderCell?: string;
  leaderCellExtension?: string;
  leaderEmail?: string;
  mobileDevice?: boolean;
  missionaryAllocation?: number;
  assignmentLocationStatusId?: number;
  assignmentLocationStatusDescription?: string;
  zones?: Zone[];
}

interface SearchHistory {
  id: string;
  searchedAt: string;
}

const SEARCH_HISTORY_KEY = 'mission-search-history';
const MAX_HISTORY_ITEMS = 10;

export default function MissionPage() {
  const [missionId, setMissionId] = useState('');
  const [mission, setMission] = useState<Mission | null>(null);
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

  const searchMission = async (searchId?: string) => {
    const idToSearch = searchId || missionId;
    if (!idToSearch.trim()) {
      setError('Please enter a Mission ID');
      return;
    }

    if (!apiClient) {
      setError('API client not initialized');
      return;
    }

    setLoading(true);
    setError(null);
    setMission(null);

    try {
      const query = `
        query GetMission($id: ID!) {
          mission(id: $id) {
            id
            name
            address
            mailingAddress
            phoneInternationalCode
            phone
            phoneExtension
            faxInternationalCode
            fax
            faxExtension
            email
            leaderCmisId
            leaderName
            leaderHomeAddress
            leaderPhoneInternationalCode
            leaderPhone
            leaderPhoneExtension
            leaderCellInternationalCode
            leaderCell
            leaderCellExtension
            leaderEmail
            mobileDevice
            missionaryAllocation
            assignmentLocationStatusId
            assignmentLocationStatusDescription
            zones {
              id
              name
              districts {
                id
                name
              }
            }
          }
        }
      `;

      const variables = { id: idToSearch };
      const response = await apiClient.executeGraphQLQuery(query, variables);
      const data = response.data as { mission: Mission };

      if (data?.mission) {
        setMission(data.mission);
        addToHistory(idToSearch);
        if (searchId) {
          setMissionId(searchId);
        }
      } else {
        setError('No mission found with that ID');
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
    searchMission();
  };

  const handleClear = () => {
    setMissionId('');
    setMission(null);
    setError(null);
  };

  const formatPhoneNumber = (intlCode?: string, phone?: string, extension?: string) => {
    if (!phone) return 'N/A';
    let formatted = phone;
    if (intlCode) formatted = `+${intlCode} ${formatted}`;
    if (extension) formatted = `${formatted} ext. ${extension}`;
    return formatted;
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 4 }}>
      <Box sx={{ maxWidth: '1200px', mx: 'auto', px: 3 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Mission Search
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Retrieve detailed mission information by Organization Number
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
                  label="Mission ID (Organization Number)"
                  value={missionId}
                  onChange={(e) => setMissionId(e.target.value)}
                  placeholder="Enter mission organization number"
                  variant="outlined"
                  sx={{ flexGrow: 1, minWidth: '300px' }}
                  disabled={loading}
                  helperText="Enter the mission's organization number (e.g., 12345)"
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
                        onClick={() => searchMission(item.id)}
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
        {mission && (
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Business color="primary" />
                {mission.name || 'Mission'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Organization Number: {mission.id}
              </Typography>

              {/* Basic Information */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn />
                    Basic Information
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>Addresses</Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Physical Address:</strong>
                      </Typography>
                      <Typography variant="body2" sx={{ ml: 2, mb: 2, whiteSpace: 'pre-line' }}>
                        {mission.address || 'N/A'}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Mailing Address:</strong>
                      </Typography>
                      <Typography variant="body2" sx={{ ml: 2, whiteSpace: 'pre-line' }}>
                        {mission.mailingAddress || 'N/A'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>Mission Details</Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Missionary Allocation:</strong> {mission.missionaryAllocation || 'N/A'}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Mobile Device:</strong> {mission.mobileDevice ? 'Yes' : 'No'}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Assignment Status:</strong> {mission.assignmentLocationStatusDescription || 'N/A'}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Status ID:</strong> {mission.assignmentLocationStatusId || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Contact Information */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone />
                    Contact Information
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>Phone & Fax</Typography>
                      <Typography variant="body2" gutterBottom>
                        <Phone sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                        <strong>Phone:</strong> {formatPhoneNumber(mission.phoneInternationalCode, mission.phone, mission.phoneExtension)}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <Fax sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                        <strong>Fax:</strong> {formatPhoneNumber(mission.faxInternationalCode, mission.fax, mission.faxExtension)}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <Email sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                        <strong>Email:</strong> {mission.email || 'N/A'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>Mobile Device</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MobileScreenShare color={mission.mobileDevice ? 'success' : 'disabled'} />
                        <Typography variant="body2">
                          Mobile Device Support: {mission.mobileDevice ? 'Enabled' : 'Disabled'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Mission Leadership */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person />
                    Mission Leadership
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>Leader Information</Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Name:</strong> {mission.leaderName || 'N/A'}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>CMIS ID:</strong> {mission.leaderCmisId || 'N/A'}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Home Address:</strong>
                      </Typography>
                      <Typography variant="body2" sx={{ ml: 2, mb: 2, whiteSpace: 'pre-line' }}>
                        {mission.leaderHomeAddress || 'N/A'}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Email:</strong> {mission.leaderEmail || 'N/A'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>Leader Contact</Typography>
                      <Typography variant="body2" gutterBottom>
                        <Phone sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                        <strong>Phone:</strong> {formatPhoneNumber(mission.leaderPhoneInternationalCode, mission.leaderPhone, mission.leaderPhoneExtension)}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <Phone sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                        <strong>Cell:</strong> {formatPhoneNumber(mission.leaderCellInternationalCode, mission.leaderCell, mission.leaderCellExtension)}
                      </Typography>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Zones */}
              {mission.zones && mission.zones.length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Groups />
                      Zones ({mission.zones.length})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Zone Name</TableCell>
                            <TableCell>Zone ID</TableCell>
                            <TableCell>Districts</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {mission.zones.map((zone) => (
                            <TableRow key={zone.id}>
                              <TableCell>{zone.name}</TableCell>
                              <TableCell>{zone.id}</TableCell>
                              <TableCell>
                                {zone.districts && zone.districts.length > 0 ? (
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {zone.districts.map((district) => (
                                      <Chip
                                        key={district.id}
                                        label={district.name}
                                        size="small"
                                        variant="outlined"
                                      />
                                    ))}
                                  </Box>
                                ) : (
                                  'No districts'
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Metadata */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Info />
                    Metadata
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" gutterBottom>
                    <Assignment sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                    <strong>Assignment Location Status ID:</strong> {mission.assignmentLocationStatusId || 'N/A'}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Assignment Location Status:</strong> {mission.assignmentLocationStatusDescription || 'N/A'}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <Groups sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                    <strong>Total Zones:</strong> {mission.zones ? mission.zones.length : 0}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Total Districts:</strong> {mission.zones ? mission.zones.reduce((count, zone) => count + (zone.districts?.length || 0), 0) : 0}
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
