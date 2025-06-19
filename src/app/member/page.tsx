'use client';

import { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Chip, FormControl, InputLabel, Select, MenuItem, Alert, CircularProgress, Paper, Divider } from '@mui/material';
import { Search, Person, LocationOn, CalendarToday, Phone, History, Clear } from '@mui/icons-material';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS } from '@/lib/environments';

// TypeScript interfaces based on the GraphQL schema
interface Missionary {
  // Fields from the actual GraphQL schema
  id?: string;
  missionaryNumber?: number;
  recommendFirstName?: string;
  recommendMiddleName?: string;
  recommendLastName?: string;
  recommendNameSuffix?: string;
  membershipUnitNumber?: number;
  homeUnitNumber?: number;
  submittingUnitNumber?: number;
  fundingUnitNumber?: number;
  missionaryStatus?: {
    value?: string;
    label?: string;
  };
  missionaryType?: {
    value?: string;
    label?: string;
  };
  callSentDate?: string;
  startDate?: string;
  releaseDate?: string;
  infieldDate?: string;
  emailAddress?: string;
  proselytingEmailAddress?: string;
  mobilePhone?: string;
  homePhone?: string;
  assignments?: Array<{
    mission?: {
      name?: string;
    };
    component?: {
      assignmentLanguage?: {
        languageName?: string;
      };
      missionLanguage?: {
        languageName?: string;
      };
    };
  }>;
}

interface SearchHistory {
  fieldName: string;
  value: string;
  timestamp: number;
}

export default function MemberPage() {
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState('mis-gql-dev');
  
  const [cmisUuid, setCmisUuid] = useState('');
  const [missionaries, setMissionaries] = useState<Missionary[]>([]);
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
    const savedHistory = localStorage.getItem('member-search-history');
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
      localStorage.setItem('member-search-history', JSON.stringify(searchHistory));
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

  const buildMemberQuery = (cmisUuid: string) => {
    return `
      query GetMember {
        member(cmisUuid: "${cmisUuid}") {
          id
          missionaryNumber
          recommendFirstName
          recommendMiddleName
          recommendLastName
          recommendNameSuffix
          membershipUnitNumber
          homeUnitNumber
          submittingUnitNumber
          fundingUnitNumber
          missionaryStatus {
            value
            label
          }
          missionaryType {
            value
            label
          }
          callSentDate
          startDate
          releaseDate
          infieldDate
          emailAddress
          proselytingEmailAddress
          mobilePhone
          homePhone
          assignments(input: { filter: { statuses: [ACTIVE] } }) {
            mission {
              name
            }
            component {
              assignmentLanguage {
                languageName
              }
              missionLanguage {
                languageName
              }
            }
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

    if (!cmisUuid.trim()) {
      setError('Please provide a CMIS UUID');
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      // Add to search history
      addToSearchHistory('cmisUuid', cmisUuid);

      const query = buildMemberQuery(cmisUuid.trim());
      console.log('Executing GraphQL query:', query);

      const response = await apiClient.executeGraphQLQuery(query);
      
      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors[0].message);
      }

      const data = response.data as { member: Missionary[] };
      setMissionaries(data.member || []);
      
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
      setMissionaries([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setCmisUuid('');
    setMissionaries([]);
    setError(null);
    setHasSearched(false);
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('member-search-history');
  };

  const useHistoryValue = (fieldName: string, value: string) => {
    if (fieldName === 'cmisUuid') {
      setCmisUuid(value);
    }
  };

  const getFieldLabel = (fieldName: string) => {
    const labels: Record<string, string> = {
      cmisUuid: 'CMIS UUID'
    };
    return labels[fieldName] || fieldName;
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 4 }}>
      <Box sx={{ maxWidth: '1200px', mx: 'auto', px: 3 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Member Search
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Search for missionary experiences associated with a member using CMIS UUID
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
              Search by CMIS UUID
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
              <TextField
                fullWidth
                label="CMIS UUID"
                value={cmisUuid}
                onChange={(e) => setCmisUuid(e.target.value)}
                placeholder="Enter CMIS UUID (e.g., 12345678-1234-1234-1234-123456789012)"
                helperText="Enter the unique CMIS identifier for the member"
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
                disabled={loading || !cmisUuid.trim()}
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
              Missionary Experiences
              {missionaries.length > 0 && (
                <Chip 
                  label={`${missionaries.length} found`} 
                  color="primary" 
                  size="small" 
                  sx={{ ml: 2 }}
                />
              )}
            </Typography>
            
            {!hasSearched ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Person sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Ready to Search
                </Typography>
                <Typography color="text.secondary">
                  Enter a CMIS UUID above and click "Search" to find missionary experiences
                </Typography>
              </Box>
            ) : missionaries.length === 0 && !loading ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Person sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No missionary experiences found
                </Typography>
                <Typography color="text.secondary">
                  No missionary records found for this CMIS UUID
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {missionaries.map((missionary, index) => (
                  <Box key={missionary.id || index} sx={{ flexBasis: { xs: '100%', md: '48%', lg: '30%' } }}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Person sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6">
                          {`${missionary.recommendFirstName || ''} ${missionary.recommendMiddleName || ''} ${missionary.recommendLastName || ''}`.trim() || 'Unknown'}
                        </Typography>
                      </Box>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Box sx={{ space: 2 }}>
                        {missionary.missionaryNumber && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Person sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              <strong>Missionary #:</strong> {missionary.missionaryNumber}
                            </Typography>
                          </Box>
                        )}
                        
                        {missionary.missionaryStatus && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <CalendarToday sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              <strong>Status:</strong> {missionary.missionaryStatus.label || missionary.missionaryStatus.value || 'Unknown'}
                            </Typography>
                          </Box>
                        )}
                        
                        {missionary.missionaryType && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Person sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              <strong>Type:</strong> {missionary.missionaryType.label || missionary.missionaryType.value || 'Unknown'}
                            </Typography>
                          </Box>
                        )}
                        
                        {missionary.membershipUnitNumber && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              <strong>Membership Unit:</strong> {missionary.membershipUnitNumber}
                            </Typography>
                          </Box>
                        )}
                        
                        {missionary.homeUnitNumber && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              <strong>Home Unit:</strong> {missionary.homeUnitNumber}
                            </Typography>
                          </Box>
                        )}
                        
                        {missionary.assignments && missionary.assignments.length > 0 && missionary.assignments[0].mission?.name && (
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Mission:</strong> {missionary.assignments[0].mission.name}
                          </Typography>
                        )}
                        
                        {missionary.assignments && missionary.assignments.length > 0 && missionary.assignments[0].component?.assignmentLanguage?.languageName && (
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Language:</strong> {missionary.assignments[0].component.assignmentLanguage.languageName}
                          </Typography>
                        )}
                        
                        {missionary.emailAddress && (
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Email:</strong> {missionary.emailAddress}
                          </Typography>
                        )}
                        
                        {missionary.mobilePhone && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Phone sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              <strong>Mobile:</strong> {missionary.mobilePhone}
                            </Typography>
                          </Box>
                        )}
                        
                        {missionary.callSentDate && (
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Call Sent:</strong> {new Date(missionary.callSentDate).toLocaleDateString()}
                          </Typography>
                        )}
                        
                        {missionary.startDate && (
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Start Date:</strong> {new Date(missionary.startDate).toLocaleDateString()}
                          </Typography>
                        )}
                        
                        {missionary.infieldDate && (
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>In Field Date:</strong> {new Date(missionary.infieldDate).toLocaleDateString()}
                          </Typography>
                        )}
                        
                        {missionary.releaseDate && (
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Release Date:</strong> {new Date(missionary.releaseDate).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    </Paper>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
