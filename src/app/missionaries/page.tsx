'use client';

import { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Chip, FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel, Alert, CircularProgress, Paper, Divider } from '@mui/material';
import { Search, Person, LocationOn, CalendarToday, Phone, History, Clear } from '@mui/icons-material';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS } from '@/lib/environments';

// TypeScript interfaces based on the GraphQL schema
interface MissionaryStatusCode {
  SSM_AWAITING_CALL: 'SSM_AWAITING_CALL';
  CALL_SENT: 'CALL_SENT';
  REMOTE_MTC: 'REMOTE_MTC';
  ONSITE_MTC: 'ONSITE_MTC';
  PRE_FIELD: 'PRE_FIELD';
  IN_FIELD: 'IN_FIELD';
  ON_LEAVE: 'ON_LEAVE';
  RELEASED: 'RELEASED';
  UNKNOWN: 'UNKNOWN';
}

const MISSIONARY_STATUS_OPTIONS = [
  { value: 'SSM_AWAITING_CALL', label: 'Awaiting Call' },
  { value: 'CALL_SENT', label: 'Call Sent' },
  { value: 'REMOTE_MTC', label: 'Remote MTC' },
  { value: 'ONSITE_MTC', label: 'Onsite MTC' },
  { value: 'PRE_FIELD', label: 'Pre-Field' },
  { value: 'IN_FIELD', label: 'In Field' },
  { value: 'ON_LEAVE', label: 'On Leave' },
  { value: 'RELEASED', label: 'Released' },
  { value: 'UNKNOWN', label: 'Unknown' }
];

interface MissionariesFilters {
  homeUnitId?: string;
  membershipUnitId?: string;
  submittingUnitId?: string;
  fundingUnitId?: string;
  missionUnitNumber?: number[];
  missionaryStatus?: string[];
}

interface MissionariesInput {
  filter?: MissionariesFilters;
}

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

interface SearchFilters {
  homeUnitId: string;
  membershipUnitId: string;
  submittingUnitId: string;
  fundingUnitId: string;
  missionUnitNumber: string;
  missionaryStatus: string[];
}

interface SearchHistory {
  fieldName: string;
  value: string;
  timestamp: number;
}

export default function MissionariesPage() {
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState('mis-gql-dev');
  
  const [filters, setFilters] = useState<SearchFilters>({
    homeUnitId: '',
    membershipUnitId: '',
    submittingUnitId: '',
    fundingUnitId: '',
    missionUnitNumber: '',
    missionaryStatus: []
  });
  
  const [missionaries, setMissionaries] = useState<Missionary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);

  // Initialize API client when environment changes
  useEffect(() => {
    const config = ENVIRONMENTS[selectedEnvironment];
    if (config) {
      setApiClient(new ApiClient(config, selectedEnvironment));
    }
  }, [selectedEnvironment]);

  // Load search history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('missionaries-search-history');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (err) {
        console.error('Error loading search history:', err);
      }
    }
  }, []);

  // Save search history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('missionaries-search-history', JSON.stringify(searchHistory));
  }, [searchHistory]);

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

  const buildMissionariesQuery = (input: MissionariesInput, unitId?: string) => {
    // Properly format the GraphQL input with correct enum handling
    const buildFilterString = (filter: MissionariesFilters) => {
      const filterParts: string[] = [];
      
      if (filter.homeUnitId) filterParts.push(`homeUnitId: "${filter.homeUnitId}"`);
      if (filter.membershipUnitId) filterParts.push(`membershipUnitId: "${filter.membershipUnitId}"`);
      if (filter.submittingUnitId) filterParts.push(`submittingUnitId: "${filter.submittingUnitId}"`);
      if (filter.fundingUnitId) filterParts.push(`fundingUnitId: "${filter.fundingUnitId}"`);
      if (filter.missionUnitNumber && filter.missionUnitNumber.length > 0) {
        filterParts.push(`missionUnitNumber: [${filter.missionUnitNumber.join(', ')}]`);
      }
      if (filter.missionaryStatus && filter.missionaryStatus.length > 0) {
        // Format enum values without quotes
        const statusEnums = filter.missionaryStatus.join(', ');
        filterParts.push(`missionaryStatus: [${statusEnums}]`);
      }
      
      return filterParts.join(', ');
    };

    const filterString = input.filter ? buildFilterString(input.filter) : '';
    const inputParam = filterString ? `{ filter: { ${filterString} } }` : '{ }';
    const unitIdParam = unitId ? `, unitId: "${unitId}"` : '';
    
    return `
      query GetMissionaries {
        missionaries(missionariesInput: ${inputParam}${unitIdParam}) {
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

    // Check if at least one filter is provided
    const hasFilters = Object.entries(filters).some(([key, value]) => {
      if (key === 'missionaryStatus') return value.length > 0;
      return value.trim() !== '';
    });

    if (!hasFilters) {
      setError('Please provide at least one search filter');
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      // Build the filters object and track search history
      const missionariesFilters: MissionariesFilters = {};
      
      if (filters.homeUnitId) {
        missionariesFilters.homeUnitId = filters.homeUnitId;
        addToSearchHistory('homeUnitId', filters.homeUnitId);
      }
      if (filters.membershipUnitId) {
        missionariesFilters.membershipUnitId = filters.membershipUnitId;
        addToSearchHistory('membershipUnitId', filters.membershipUnitId);
      }
      if (filters.submittingUnitId) {
        missionariesFilters.submittingUnitId = filters.submittingUnitId;
        addToSearchHistory('submittingUnitId', filters.submittingUnitId);
      }
      if (filters.fundingUnitId) {
        missionariesFilters.fundingUnitId = filters.fundingUnitId;
        addToSearchHistory('fundingUnitId', filters.fundingUnitId);
      }
      if (filters.missionUnitNumber) {
        const numbers = filters.missionUnitNumber.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
        if (numbers.length > 0) {
          missionariesFilters.missionUnitNumber = numbers;
          addToSearchHistory('missionUnitNumber', filters.missionUnitNumber);
        }
      }
      // Note: We don't track missionaryStatus in search history as requested
      if (filters.missionaryStatus.length > 0) missionariesFilters.missionaryStatus = filters.missionaryStatus;

      const missionariesInput: MissionariesInput = {
        filter: missionariesFilters
      };

      const query = buildMissionariesQuery(missionariesInput);
      console.log('Executing GraphQL query:', query);

      const response = await apiClient.executeGraphQLQuery(query);
      
      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors[0].message);
      }

      const data = response.data as { missionaries: Missionary[] };
      setMissionaries(data.missionaries || []);
      
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
      setMissionaries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: keyof SearchFilters, value: string | string[]) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStatusChange = (status: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      missionaryStatus: checked 
        ? [...prev.missionaryStatus, status]
        : prev.missionaryStatus.filter(s => s !== status)
    }));
  };

  const clearFilters = () => {
    setFilters({
      homeUnitId: '',
      membershipUnitId: '',
      submittingUnitId: '',
      fundingUnitId: '',
      missionUnitNumber: '',
      missionaryStatus: []
    });
    setMissionaries([]);
    setError(null);
    setHasSearched(false);
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
  };

  const useHistoryValue = (fieldName: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const getFieldLabel = (fieldName: string) => {
    const labels: Record<string, string> = {
      homeUnitId: 'Home Unit ID',
      membershipUnitId: 'Membership Unit ID',
      submittingUnitId: 'Submitting Unit ID',
      fundingUnitId: 'Funding Unit ID',
      missionUnitNumber: 'Mission Unit Numbers'
    };
    return labels[fieldName] || fieldName;
  };

  const formatStatus = (status: string) => {
    return MISSIONARY_STATUS_OPTIONS.find(opt => opt.value === status)?.label || status;
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 4 }}>
      <Box sx={{ maxWidth: '1200px', mx: 'auto', px: 3 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Missionaries Search
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Search for missionaries using various filters
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

        {/* Search Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Search Filters
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ flexBasis: { xs: '100%', md: '48%' } }}>
                <TextField
                  fullWidth
                  label="Home Unit ID"
                  value={filters.homeUnitId}
                  onChange={(e) => handleFilterChange('homeUnitId', e.target.value)}
                  placeholder="Enter home unit ID"
                />
              </Box>
              
              <Box sx={{ flexBasis: { xs: '100%', md: '48%' } }}>
                <TextField
                  fullWidth
                  label="Membership Unit ID"
                  value={filters.membershipUnitId}
                  onChange={(e) => handleFilterChange('membershipUnitId', e.target.value)}
                  placeholder="Enter membership unit ID"
                />
              </Box>
              
              <Box sx={{ flexBasis: { xs: '100%', md: '48%' } }}>
                <TextField
                  fullWidth
                  label="Submitting Unit ID"
                  value={filters.submittingUnitId}
                  onChange={(e) => handleFilterChange('submittingUnitId', e.target.value)}
                  placeholder="Enter submitting unit ID"
                />
              </Box>
              
              <Box sx={{ flexBasis: { xs: '100%', md: '48%' } }}>
                <TextField
                  fullWidth
                  label="Funding Unit ID"
                  value={filters.fundingUnitId}
                  onChange={(e) => handleFilterChange('fundingUnitId', e.target.value)}
                  placeholder="Enter funding unit ID"
                />
              </Box>
              
              <Box sx={{ flexBasis: { xs: '100%', md: '48%' } }}>
                <TextField
                  fullWidth
                  label="Mission Unit Numbers"
                  value={filters.missionUnitNumber}
                  onChange={(e) => handleFilterChange('missionUnitNumber', e.target.value)}
                  placeholder="Enter mission unit numbers (comma separated)"
                  helperText="Example: 123, 456, 789"
                />
              </Box>
            </Box>

            {/* Missionary Status Checkboxes */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Missionary Status
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {MISSIONARY_STATUS_OPTIONS.map((option) => (
                  <Box key={option.value} sx={{ flexBasis: { xs: '100%', sm: '48%', md: '30%' } }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={filters.missionaryStatus.includes(option.value)}
                          onChange={(e) => handleStatusChange(option.value, e.target.checked)}
                        />
                      }
                      label={option.label}
                    />
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <Search />}
                onClick={handleSearch}
                disabled={loading}
                size="large"
              >
                {loading ? 'Searching...' : 'Search Missionaries'}
              </Button>
              
              <Button
                variant="outlined"
                onClick={clearFilters}
                disabled={loading}
                size="large"
              >
                Clear Filters
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
                    Recent Search Values
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
                        backgroundColor: 'primary.light',
                        color: 'primary.contrastText'
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
              Search Results
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
                  Enter your search criteria above and click "Search Missionaries"
                </Typography>
              </Box>
            ) : missionaries.length === 0 && !loading ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Person sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No missionaries found
                </Typography>
                <Typography color="text.secondary">
                  Try adjusting your search criteria
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
