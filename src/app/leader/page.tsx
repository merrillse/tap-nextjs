'use client';

import { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Chip, FormControl, InputLabel, Select, MenuItem, Alert, CircularProgress, Paper, Divider, Avatar } from '@mui/material';
import { Search, Person, LocationOn, CalendarToday, Phone, Email, History, Clear, ContactPhone, Home, Badge } from '@mui/icons-material';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS } from '@/lib/environments';

// TypeScript interfaces based on the GraphQL schema
interface LeaderCitizenship {
  // Define citizenship fields if needed
}

interface LeaderImage {
  // Define image fields if needed
}

interface Leader {
  cmisId?: string;
  spouseCmisId?: string;
  mrn?: string;
  genderCode?: string;
  homeUnitNumber?: number;
  surname?: string;
  givenName?: string;
  preferredSurname?: string;
  preferredGivenName?: string;
  leaderUnitNumber?: number;
  startDate?: string;
  endDate?: string;
  ldsEmail?: string;
  personalEmail?: string;
  phone?: string;
  homeAddress?: string;
  homeLocationId?: number;
  birthDate?: string;
  birthPlace?: string;
  birthLocationId?: number;
  passportNumber?: string;
  passportExpirationDate?: string;
  contactName?: string;
  contactRelationship?: string;
  contactAddress?: string;
  contactEmail?: string;
  contactPhone?: string;
  leaderImage?: LeaderImage;
  citizenships?: LeaderCitizenship[];
}

interface SearchHistory {
  fieldName: string;
  value: string;
  timestamp: number;
}

export default function LeaderPage() {
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState('mis-gql-dev');
  
  const [cmisId, setCmisId] = useState('');
  const [leader, setLeader] = useState<Leader | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);

  // Initialize API client when environment changes
  useEffect(() => {
    const config = ENVIRONMENTS[selectedEnvironment];
    if (config) {
      setApiClient(new ApiClient(config, selectedEnvironment));
    }
  }, [selectedEnvironment]);

  // Load search history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('leader-search-history');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setSearchHistory(parsedHistory);
      } catch (err) {
        console.error('Error loading search history:', err);
      }
    }
    setIsHistoryLoaded(true);
  }, []);

  // Save search history to localStorage whenever it changes (but not on initial load)
  useEffect(() => {
    if (isHistoryLoaded) {
      localStorage.setItem('leader-search-history', JSON.stringify(searchHistory));
    }
  }, [searchHistory, isHistoryLoaded]);

  const addToSearchHistory = (fieldName: string, value: string) => {
    if (!value.trim()) return;
    
    const newEntry: SearchHistory = {
      fieldName,
      value: value.trim(),
      timestamp: Date.now()
    };
    
    setSearchHistory(prev => {
      // Remove any existing entries with the same field and value
      const filtered = prev.filter(entry => 
        !(entry.fieldName === fieldName && entry.value === value.trim())
      );
      
      // Add new entry at the beginning and keep only last 10
      return [newEntry, ...filtered].slice(0, 10);
    });
  };

  const buildLeaderQuery = (cmisId: string) => {
    return `
      query GetLeader {
        leader(cmisId: "${cmisId}") {
          cmisId
          spouseCmisId
          mrn
          genderCode
          homeUnitNumber
          surname
          givenName
          preferredSurname
          preferredGivenName
          leaderUnitNumber
          startDate
          endDate
          ldsEmail
          personalEmail
          phone
          homeAddress
          homeLocationId
          birthDate
          birthPlace
          birthLocationId
          contactName
          contactRelationship
          contactAddress
          contactEmail
          contactPhone
          citizenships {
            # Add citizenship fields if needed
          }
        }
      }
    `;
  };

  const handleSearch = async () => {
    if (!apiClient) {
      setError('API client not initialized');
      return;
    }

    if (!cmisId.trim()) {
      setError('Please provide a CMIS ID');
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      // Add to search history
      addToSearchHistory('cmisId', cmisId);

      const query = buildLeaderQuery(cmisId.trim());
      console.log('Executing GraphQL query:', query);

      const response = await apiClient.executeGraphQLQuery(query);
      
      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors[0].message);
      }

      const data = response.data as { leader: Leader };
      setLeader(data.leader || null);
      
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
      setLeader(null);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setCmisId('');
    setLeader(null);
    setError(null);
    setHasSearched(false);
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('leader-search-history');
  };

  const useHistoryValue = (fieldName: string, value: string) => {
    if (fieldName === 'cmisId') {
      setCmisId(value);
    }
  };

  const getFieldLabel = (fieldName: string) => {
    const labels: Record<string, string> = {
      cmisId: 'CMIS ID'
    };
    return labels[fieldName] || fieldName;
  };

  const getDisplayName = (leader: Leader) => {
    if (leader.preferredGivenName && leader.preferredSurname) {
      return `${leader.preferredGivenName} ${leader.preferredSurname}`;
    }
    if (leader.givenName && leader.surname) {
      return `${leader.givenName} ${leader.surname}`;
    }
    return 'Unknown';
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 4 }}>
      <Box sx={{ maxWidth: '1200px', mx: 'auto', px: 3 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Leader Search
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Search for leader profile and associated data by CMIS ID
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
                {Object.entries(ENVIRONMENTS).map(([key, env]) => (
                  <MenuItem key={key} value={key}>
                    {env.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </CardContent>
        </Card>

        {/* Search Input */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Search by CMIS ID
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
              <TextField
                fullWidth
                label="CMIS ID"
                value={cmisId}
                onChange={(e) => setCmisId(e.target.value)}
                placeholder="Enter CMIS ID"
                helperText="Enter the unique CMIS identifier for the leader"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
              
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <Search />}
                onClick={handleSearch}
                disabled={loading || !cmisId.trim()}
                size="large"
                sx={{ minWidth: '140px' }}
              >
                {loading ? 'Searching...' : 'Search'}
              </Button>
              
              <Button
                variant="outlined"
                onClick={clearSearch}
                disabled={loading}
                size="large"
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
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <History sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Recent Searches
                  </Typography>
                </Box>
                <Button
                  size="small"
                  startIcon={<Clear />}
                  onClick={clearSearchHistory}
                  variant="outlined"
                  color="secondary"
                >
                  Clear History
                </Button>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {searchHistory.map((entry, index) => (
                  <Chip
                    key={`${entry.fieldName}-${entry.value}-${index}`}
                    label={`${getFieldLabel(entry.fieldName)}: ${entry.value}`}
                    variant="outlined"
                    size="small"
                    onClick={() => useHistoryValue(entry.fieldName, entry.value)}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: '#1976d2',
                        color: '#ffffff',
                        borderColor: '#1976d2'
                      }
                    }}
                  />
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Click any value to use it in your search
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Results */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Leader Profile
            </Typography>
            
            {!hasSearched ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Badge sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Ready to Search
                </Typography>
                <Typography color="text.secondary">
                  Enter a CMIS ID above and click "Search" to find leader information
                </Typography>
              </Box>
            ) : !leader && !loading ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Badge sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No leader found
                </Typography>
                <Typography color="text.secondary">
                  No leader record found for this CMIS ID
                </Typography>
              </Box>
            ) : leader ? (
              <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
                <Paper sx={{ p: 4 }}>
                  {/* Leader Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.main', mr: 3 }}>
                      <Badge sx={{ fontSize: 30 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" component="h2" gutterBottom>
                        {getDisplayName(leader)}
                      </Typography>
                      {leader.cmisId && (
                        <Typography variant="subtitle1" color="text.secondary">
                          CMIS ID: {leader.cmisId}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  {/* Leader Details */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                    {/* Personal Information */}
                    <Box>
                      <Typography variant="h6" gutterBottom color="primary">
                        Personal Information
                      </Typography>
                      
                      {leader.mrn && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Badge sx={{ fontSize: 20, mr: 2, color: 'text.secondary' }} />
                          <Typography variant="body1">
                            <strong>MRN:</strong> {leader.mrn}
                          </Typography>
                        </Box>
                      )}
                      
                      {leader.genderCode && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Person sx={{ fontSize: 20, mr: 2, color: 'text.secondary' }} />
                          <Typography variant="body1">
                            <strong>Gender:</strong> {leader.genderCode}
                          </Typography>
                        </Box>
                      )}
                      
                      {leader.birthDate && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <CalendarToday sx={{ fontSize: 20, mr: 2, color: 'text.secondary' }} />
                          <Typography variant="body1">
                            <strong>Birth Date:</strong> {new Date(leader.birthDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      )}
                      
                      {leader.birthPlace && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <LocationOn sx={{ fontSize: 20, mr: 2, color: 'text.secondary' }} />
                          <Typography variant="body1">
                            <strong>Birth Place:</strong> {leader.birthPlace}
                          </Typography>
                        </Box>
                      )}
                      
                      {leader.homeAddress && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Home sx={{ fontSize: 20, mr: 2, color: 'text.secondary' }} />
                          <Typography variant="body1">
                            <strong>Home Address:</strong> {leader.homeAddress}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Leadership Assignment */}
                    <Box>
                      <Typography variant="h6" gutterBottom color="primary">
                        Leadership Assignment
                      </Typography>
                      
                      {leader.leaderUnitNumber && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <LocationOn sx={{ fontSize: 20, mr: 2, color: 'text.secondary' }} />
                          <Typography variant="body1">
                            <strong>Leader Unit:</strong> {leader.leaderUnitNumber}
                          </Typography>
                        </Box>
                      )}
                      
                      {leader.homeUnitNumber && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Home sx={{ fontSize: 20, mr: 2, color: 'text.secondary' }} />
                          <Typography variant="body1">
                            <strong>Home Unit:</strong> {leader.homeUnitNumber}
                          </Typography>
                        </Box>
                      )}
                      
                      {leader.startDate && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <CalendarToday sx={{ fontSize: 20, mr: 2, color: 'text.secondary' }} />
                          <Typography variant="body1">
                            <strong>Start Date:</strong> {new Date(leader.startDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      )}
                      
                      {leader.endDate && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <CalendarToday sx={{ fontSize: 20, mr: 2, color: 'text.secondary' }} />
                          <Typography variant="body1">
                            <strong>End Date:</strong> {new Date(leader.endDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      )}
                      
                      {leader.spouseCmisId && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Person sx={{ fontSize: 20, mr: 2, color: 'text.secondary' }} />
                          <Typography variant="body1">
                            <strong>Spouse CMIS ID:</strong> {leader.spouseCmisId}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  {/* Contact Information */}
                  <Box>
                    <Typography variant="h6" gutterBottom color="primary">
                      Contact Information
                    </Typography>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                      <Box>
                        {leader.ldsEmail && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Email sx={{ fontSize: 20, mr: 2, color: 'text.secondary' }} />
                            <Typography variant="body1">
                              <strong>LDS Email:</strong> {leader.ldsEmail}
                            </Typography>
                          </Box>
                        )}
                        
                        {leader.personalEmail && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Email sx={{ fontSize: 20, mr: 2, color: 'text.secondary' }} />
                            <Typography variant="body1">
                              <strong>Personal Email:</strong> {leader.personalEmail}
                            </Typography>
                          </Box>
                        )}
                        
                        {leader.phone && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Phone sx={{ fontSize: 20, mr: 2, color: 'text.secondary' }} />
                            <Typography variant="body1">
                              <strong>Phone:</strong> {leader.phone}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      <Box>
                        {leader.contactName && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Emergency Contact
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 1 }}>
                              <strong>Name:</strong> {leader.contactName}
                            </Typography>
                            {leader.contactRelationship && (
                              <Typography variant="body1" sx={{ mb: 1 }}>
                                <strong>Relationship:</strong> {leader.contactRelationship}
                              </Typography>
                            )}
                            {leader.contactPhone && (
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <ContactPhone sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body2">
                                  {leader.contactPhone}
                                </Typography>
                              </Box>
                            )}
                            {leader.contactEmail && (
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Email sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body2">
                                  {leader.contactEmail}
                                </Typography>
                              </Box>
                            )}
                            {leader.contactAddress && (
                              <Typography variant="body2">
                                <strong>Address:</strong> {leader.contactAddress}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              </Box>
            ) : null}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
