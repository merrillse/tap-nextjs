'use client';

import { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, TextField, Alert, CircularProgress, Chip, Accordion, AccordionSummary, AccordionDetails, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Search, Clear, History, ExpandMore, LocationOn, Phone, Email, DirectionsCar, Business, Group, Update, Info } from '@mui/icons-material';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS } from '@/lib/environments';

interface ProselytingAreaPhone {
  id: string;
  phoneNumber: string;
  primary: boolean;
}

interface District {
  id: string;
  name: string;
  zone?: {
    id: string;
    name: string;
  };
}

interface GeopoliticalLocation {
  locationCodeNumber: number;
  geopoliticalLocationId: number;
  commonName: string;
  officialName: string;
}

interface EcclesiasticalUnit {
  id: string;
  name: string;
  type: string;
}

interface Assignment {
  id: string;
  missionary: {
    id: string;
    latinFirstName: string;
    latinLastName: string;
  };
  assignmentType?: {
    value: string;
    label: string;
  };
  assignmentStartDate: string;
  assignmentEndDate?: string;
}

interface ProselytingArea {
  id: string;
  name: string;
  district?: District;
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
  ecclesiasticalUnitsList?: string;
  ecclesiasticalUnits?: EcclesiasticalUnit[];
  activeAssignments?: Assignment[];
  proselytingAreaPhones?: ProselytingAreaPhone[];
  ecclesiasticalAreaNumber?: number;
  ecclesiasticalAreaName?: string;
}

interface SearchHistory {
  id: string;
  searchedAt: string;
}

const SEARCH_HISTORY_KEY = 'proselyting-area-search-history';
const MAX_HISTORY_ITEMS = 10;

export default function ProselytingAreaPage() {
  const [proselytingAreaId, setProselytingAreaId] = useState('');
  const [proselytingArea, setProselytingArea] = useState<ProselytingArea | null>(null);
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

  const searchProselytingArea = async (searchId?: string) => {
    const idToSearch = searchId || proselytingAreaId;
    if (!idToSearch.trim()) {
      setError('Please enter a Proselyting Area ID');
      return;
    }

    if (!apiClient) {
      setError('API client not initialized');
      return;
    }

    setLoading(true);
    setError(null);
    setProselytingArea(null);

    try {
      const query = `
        query GetProselytingArea($id: ID!) {
          proselytingArea(id: $id) {
            id
            name
            district {
              id
              name
              zone {
                id
                name
              }
            }
            address
            city
            stateProvince
            postalCode
            country {
              locationCodeNumber
              geopoliticalLocationId
              commonName
              officialName
            }
            vehicleId
            vehicleUnitOfMeasureCode
            vehicleUnitOfMeasureLimit
            vehicleSTWD
            emailAddress
            updatedDate
            ecclesiasticalUnitsList
            ecclesiasticalUnits {
              id
              name
              type
            }
            activeAssignments {
              id
              missionary {
                id
                latinFirstName
                latinLastName
              }
              assignmentType {
                value
                label
              }
              assignmentStartDate
              assignmentEndDate
            }
            proselytingAreaPhones {
              id
              phoneNumber
              primary
            }
            ecclesiasticalAreaNumber
            ecclesiasticalAreaName
          }
        }
      `;

      const variables = { id: idToSearch };
      const response = await apiClient.executeGraphQLQuery(query, variables);
      const data = response.data as { proselytingArea: ProselytingArea };

      if (data?.proselytingArea) {
        setProselytingArea(data.proselytingArea);
        addToHistory(idToSearch);
        if (searchId) {
          setProselytingAreaId(searchId);
        }
      } else {
        setError('No proselyting area found with that ID');
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
    searchProselytingArea();
  };

  const handleClear = () => {
    setProselytingAreaId('');
    setProselytingArea(null);
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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 4 }}>
      <Box sx={{ maxWidth: '1200px', mx: 'auto', px: 3 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Proselyting Area Search
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Retrieve detailed information about a proselyting area by ID
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
                  label="Proselyting Area ID"
                  value={proselytingAreaId}
                  onChange={(e) => setProselytingAreaId(e.target.value)}
                  placeholder="Enter proselyting area ID"
                  variant="outlined"
                  sx={{ flexGrow: 1, minWidth: '300px' }}
                  disabled={loading}
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
                        label={`${item.id} (${formatDate(item.searchedAt)})`}
                        onClick={() => searchProselytingArea(item.id)}
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
        {proselytingArea && (
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn color="primary" />
                {proselytingArea.name || 'Proselyting Area'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                ID: {proselytingArea.id}
              </Typography>

              {/* Basic Information */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">Basic Information</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>Location</Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Address:</strong> {proselytingArea.address || 'N/A'}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>City:</strong> {proselytingArea.city || 'N/A'}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>State/Province:</strong> {proselytingArea.stateProvince || 'N/A'}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Postal Code:</strong> {proselytingArea.postalCode || 'N/A'}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Country:</strong> {proselytingArea.country?.commonName || proselytingArea.country?.officialName || 'N/A'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>Organization</Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>District:</strong> {proselytingArea.district?.name || 'N/A'}
                      </Typography>
                      {proselytingArea.district?.zone && (
                        <Typography variant="body2" gutterBottom>
                          <strong>Zone:</strong> {proselytingArea.district.zone.name}
                        </Typography>
                      )}
                      <Typography variant="body2" gutterBottom>
                        <strong>Ecclesiastical Area:</strong> {proselytingArea.ecclesiasticalAreaName || 'N/A'}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Area Number:</strong> {proselytingArea.ecclesiasticalAreaNumber || 'N/A'}
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
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      <Email sx={{ fontSize: 16, mr: 1 }} />
                      <strong>Email:</strong> {proselytingArea.emailAddress || 'N/A'}
                    </Typography>
                  </Box>
                  
                  {proselytingArea.proselytingAreaPhones && proselytingArea.proselytingAreaPhones.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>Phone Numbers</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {proselytingArea.proselytingAreaPhones.map((phone) => (
                          <Chip
                            key={phone.id}
                            label={`${phone.phoneNumber} ${phone.primary ? '(Primary)' : ''}`}
                            variant={phone.primary ? 'filled' : 'outlined'}
                            color={phone.primary ? 'primary' : 'default'}
                            size="small"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>

              {/* Vehicle Information */}
              {(proselytingArea.vehicleId || proselytingArea.vehicleUnitOfMeasureCode) && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DirectionsCar />
                      Vehicle Information
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" gutterBottom>
                      <strong>Vehicle ID:</strong> {proselytingArea.vehicleId || 'N/A'}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Unit of Measure:</strong> {proselytingArea.vehicleUnitOfMeasureCode || 'N/A'}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Limit:</strong> {proselytingArea.vehicleUnitOfMeasureLimit || 'N/A'}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>STWD:</strong> {proselytingArea.vehicleSTWD ? 'Yes' : 'No'}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Ecclesiastical Units */}
              {proselytingArea.ecclesiasticalUnits && proselytingArea.ecclesiasticalUnits.length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Business />
                      Ecclesiastical Units ({proselytingArea.ecclesiasticalUnits.length})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Unit Name</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>ID</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {proselytingArea.ecclesiasticalUnits.map((unit) => (
                            <TableRow key={unit.id}>
                              <TableCell>{unit.name}</TableCell>
                              <TableCell>{unit.type}</TableCell>
                              <TableCell>{unit.id}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Active Assignments */}
              {proselytingArea.activeAssignments && proselytingArea.activeAssignments.length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Group />
                      Active Assignments ({proselytingArea.activeAssignments.length})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Missionary</TableCell>
                            <TableCell>Assignment</TableCell>
                            <TableCell>Start Date</TableCell>
                            <TableCell>End Date</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {proselytingArea.activeAssignments.map((assignment) => (
                            <TableRow key={assignment.id}>
                              <TableCell>
                                {assignment.missionary.latinFirstName} {assignment.missionary.latinLastName}
                              </TableCell>
                              <TableCell>{assignment.assignmentType?.label || assignment.assignmentType?.value || 'N/A'}</TableCell>
                              <TableCell>{formatDate(assignment.assignmentStartDate)}</TableCell>
                              <TableCell>{assignment.assignmentEndDate ? formatDate(assignment.assignmentEndDate) : 'Current'}</TableCell>
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
                    <Update sx={{ fontSize: 16, mr: 1 }} />
                    <strong>Last Updated:</strong> {formatDate(proselytingArea.updatedDate)}
                  </Typography>
                  {proselytingArea.ecclesiasticalUnitsList && (
                    <Typography variant="body2" gutterBottom>
                      <strong>Ecclesiastical Units List:</strong> {proselytingArea.ecclesiasticalUnitsList}
                    </Typography>
                  )}
                  {proselytingArea.country && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>Country Details</Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Location Code:</strong> {proselytingArea.country.locationCodeNumber}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Geopolitical Location ID:</strong> {proselytingArea.country.geopoliticalLocationId}
                      </Typography>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}
