'use client';

import { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, Chip, FormControl, InputLabel, Select, MenuItem, Alert, CircularProgress, Paper, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Search, Settings, History, Clear, List, Code } from '@mui/icons-material';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS } from '@/lib/environments';

// TypeScript interfaces based on the GraphQL schema
interface Option {
  value?: string;
  label?: string;
}

interface SearchHistory {
  fieldName: string;
  value: string;
  timestamp: number;
}

// Entity enum values from schema
const ENTITY_OPTIONS = [
  { value: 'ASSIGNMENT', label: 'Missionary Call Assignment' },
  { value: 'MISSIONARY', label: 'Missionary Call' },
  { value: 'CANDIDATE', label: 'Candidate (Enabled Member)' },
  { value: 'RELATION', label: 'Missionary Call Relations' },
  { value: 'GEOPOLITICAL_LOCATION', label: 'Geopolitical Location' },
  { value: 'MISSION_BOUNDARY_CHANGE', label: 'Mission Boundary Change' },
  { value: 'RECOMMENDATION', label: 'Missionary Recommendation System (MRS)' },
  { value: 'MISSIONARY_LANGUAGE', label: 'Missionary Language' },
  { value: 'MISSIONARY_MEDICAL_LEG_NOTES', label: 'Missionary Medical Leg Notes' },
  { value: 'MISSIONARY_MEDICAL_SCREENING_RESULTS', label: 'Missionary Medical Screening Information' },
  { value: 'SCREENING_MASTER', label: 'Missionary Recommend System (MRS) Screening master' }
];

// AttributeName enum values from schema (commonly used ones)
const ATTRIBUTE_NAME_OPTIONS = [
  // Missionary attributes
  { value: 'ASSAULT_SURVIVOR', label: 'Assault Survivor', entity: 'MISSIONARY' },
  { value: 'ASSIGNED_CHURCH_OWNED_VEHICLE', label: 'Assigned Church Owned Vehicle', entity: 'MISSIONARY' },
  { value: 'CALL_ACCEPTED', label: 'Call Accepted', entity: 'MISSIONARY' },
  { value: 'CALL_LETTER_LANGUAGE', label: 'Call Letter Language', entity: 'MISSIONARY' },
  { value: 'CALL_LETTER_TYPE', label: 'Call Letter Type', entity: 'MISSIONARY' },
  { value: 'CALL_TYPE_CODE', label: 'Call Type Code', entity: 'MISSIONARY' },
  { value: 'CAN_TEXT_MOBILE_PHONE', label: 'Can Text Mobile Phone', entity: 'MISSIONARY' },
  { value: 'CERTIFICATE_REQUESTED', label: 'Certificate Requested', entity: 'MISSIONARY' },
  { value: 'COMPONENT', label: 'Component', entity: 'MISSIONARY' },
  { value: 'DO_NOT_PURGE', label: 'Do Not Purge', entity: 'MISSIONARY' },
  { value: 'GENDER', label: 'Gender', entity: 'MISSIONARY' },
  { value: 'HOUSING_SWEEP_PARTICIPATION', label: 'Housing Sweep Participation', entity: 'MISSIONARY' },
  { value: 'IMMUNIZATION_STATUS', label: 'Immunization Status', entity: 'MISSIONARY' },
  { value: 'MISSIONARY_TYPE', label: 'Missionary Type', entity: 'MISSIONARY' },
  { value: 'OUTBOUND_TRAVEL_PAID_BY', label: 'Outbound Travel Paid By', entity: 'MISSIONARY' },
  { value: 'PRIMARY_MISSIONARY', label: 'Primary Missionary', entity: 'MISSIONARY' },
  { value: 'READY_TO_TRAVEL', label: 'Ready To Travel', entity: 'MISSIONARY' },
  { value: 'RETURN_TRAVEL_PAID_BY', label: 'Return Travel Paid By', entity: 'MISSIONARY' },
  { value: 'SOURCE_OF_DATA', label: 'Source Of Data', entity: 'MISSIONARY' },
  { value: 'WORKFORCE_ENABLED', label: 'Workforce Enabled', entity: 'MISSIONARY' },
  { value: 'RECOMMEND_TYPE', label: 'Recommend Type', entity: 'MISSIONARY' },
  
  // Assignment attributes
  { value: 'COUNCIL_APPROVED', label: 'Council Approved', entity: 'ASSIGNMENT' },
  { value: 'IS_PERMANENT', label: 'Is Permanent', entity: 'ASSIGNMENT' },
  { value: 'SEND_TO_SMMS', label: 'Send To SMMS', entity: 'ASSIGNMENT' },
  { value: 'START_DATE_VERIFIED', label: 'Start Date Verified', entity: 'ASSIGNMENT' },
  { value: 'ASSIGNMENT_TYPE', label: 'Assignment Type', entity: 'ASSIGNMENT' },
  { value: 'SERVICE_METHOD', label: 'Service Method', entity: 'ASSIGNMENT' },
  
  // Relations attributes
  { value: 'CAN_RECEIVE_TEXT_MESSAGES', label: 'Can Receive Text Messages', entity: 'RELATION' },
  { value: 'DO_NOT_CONTACT', label: 'Do Not Contact', entity: 'RELATION' },
  { value: 'EMERGENCY_CONTACT_RELATIONSHIP', label: 'Emergency Contact Relationship', entity: 'RELATION' },
  { value: 'HAS_RELATIVE_SERVING', label: 'Has Relative Serving', entity: 'RELATION' },
  { value: 'IS_DECEASED', label: 'Is Deceased', entity: 'RELATION' },
  { value: 'IS_MEMBER', label: 'Is Member', entity: 'RELATION' },
  { value: 'PARENTAL_RELATIONSHIP_LABEL', label: 'Parental Relationship Label', entity: 'RELATION' },
  { value: 'PHONE_COUNTRY_CODE', label: 'Phone Country Code', entity: 'RELATION' },
  { value: 'RELATIONS_SERVING', label: 'Relations Serving', entity: 'RELATION' },
  
  // Geopolitical Location attributes
  { value: 'GEOPOLITICAL_CLASS', label: 'Geopolitical Class', entity: 'GEOPOLITICAL_LOCATION' },
  { value: 'GEOPOLITICAL_TYPE', label: 'Geopolitical Type', entity: 'GEOPOLITICAL_LOCATION' },
  
  // Medical Screening attributes
  { value: 'CASE_MANAGEMENT', label: 'Case Management', entity: 'MISSIONARY_MEDICAL_SCREENING_RESULTS' },
  { value: 'INSURANCE_STATUS', label: 'Insurance Status', entity: 'MISSIONARY_MEDICAL_SCREENING_RESULTS' },
  
  // Recommendation attributes
  { value: 'COVERAGE_BY_LOCATION_WITHIN_REGION', label: 'Coverage By Location Within Region', entity: 'RECOMMENDATION' },
  { value: 'COVERAGE_BY_LOCATION_OUTSIDE_REGION', label: 'Coverage By Location Outside Region', entity: 'RECOMMENDATION' },
  { value: 'COVERAGE_BY_LOCATION_OUTSIDE_COUNTRY', label: 'Coverage By Location Outside Country', entity: 'RECOMMENDATION' },
  { value: 'PRIMARY_LANGUAGE_DETAILS', label: 'Primary Language Details', entity: 'RECOMMENDATION' },
  { value: 'LANGUAGE_GRADE', label: 'Language Grade', entity: 'RECOMMENDATION' },
  { value: 'PROFICIENCY', label: 'Proficiency', entity: 'RECOMMENDATION' },
  
  // Multi-entity attributes
  { value: 'STATE_CODE', label: 'State Code', entity: 'MULTIPLE' },
  { value: 'STATUS_CODE', label: 'Status Code', entity: 'MULTIPLE' }
];

export default function OptionsPage() {
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState('mis-gql-dev');
  
  const [selectedEntity, setSelectedEntity] = useState('');
  const [selectedAttributeName, setSelectedAttributeName] = useState('');
  const [options, setOptions] = useState<Option[]>([]);
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
    const savedHistory = localStorage.getItem('options-search-history');
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
      localStorage.setItem('options-search-history', JSON.stringify(searchHistory));
    }
  }, [searchHistory, isHistoryLoaded]);

  const addToSearchHistory = (entity: string, attributeName: string) => {
    const searchKey = `${entity}:${attributeName}`;
    const newEntry: SearchHistory = {
      fieldName: 'search',
      value: searchKey,
      timestamp: Date.now()
    };
    
    setSearchHistory(prev => {
      // Remove any existing entries with the same search
      const filtered = prev.filter(entry => entry.value !== searchKey);
      
      // Add new entry at the beginning and keep only last 10
      return [newEntry, ...filtered].slice(0, 10);
    });
  };

  const buildOptionsQuery = (entity: string, attributeName: string) => {
    return `
      query GetOptions {
        options(entity: ${entity}, attributeName: ${attributeName}) {
          value
          label
        }
      }
    `;
  };

  const handleSearch = async () => {
    if (!apiClient) {
      setError('API client not initialized');
      return;
    }

    if (!selectedEntity || !selectedAttributeName) {
      setError('Please select both Entity and Attribute Name');
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      // Add to search history
      addToSearchHistory(selectedEntity, selectedAttributeName);

      const query = buildOptionsQuery(selectedEntity, selectedAttributeName);
      console.log('Executing GraphQL query:', query);

      const response = await apiClient.executeGraphQLQuery(query);
      
      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors[0].message);
      }

      const data = response.data as { options: Option[] };
      setOptions(data.options || []);
      
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSelectedEntity('');
    setSelectedAttributeName('');
    setOptions([]);
    setError(null);
    setHasSearched(false);
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('options-search-history');
  };

  const useHistoryValue = (searchKey: string) => {
    const [entity, attributeName] = searchKey.split(':');
    setSelectedEntity(entity);
    setSelectedAttributeName(attributeName);
  };

  const getFilteredAttributeNames = () => {
    if (!selectedEntity) return ATTRIBUTE_NAME_OPTIONS;
    return ATTRIBUTE_NAME_OPTIONS.filter(attr => 
      attr.entity === selectedEntity || attr.entity === 'MULTIPLE'
    );
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 4 }}>
      <Box sx={{ maxWidth: '1200px', mx: 'auto', px: 3 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Options Search
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Retrieve all possible options for specific entities and attributes
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

        {/* Search Parameters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Search Parameters
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
              <Box sx={{ flexBasis: { xs: '100%', md: '48%' } }}>
                <FormControl fullWidth>
                  <InputLabel>Entity</InputLabel>
                  <Select
                    value={selectedEntity}
                    label="Entity"
                    onChange={(e) => {
                      setSelectedEntity(e.target.value);
                      setSelectedAttributeName(''); // Reset attribute when entity changes
                    }}
                  >
                    {ENTITY_OPTIONS.map((entity) => (
                      <MenuItem key={entity.value} value={entity.value}>
                        <Box>
                          <Typography variant="body1">{entity.label}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {entity.value}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              <Box sx={{ flexBasis: { xs: '100%', md: '48%' } }}>
                <FormControl fullWidth>
                  <InputLabel>Attribute Name</InputLabel>
                  <Select
                    value={selectedAttributeName}
                    label="Attribute Name"
                    onChange={(e) => setSelectedAttributeName(e.target.value)}
                    disabled={!selectedEntity}
                  >
                    {getFilteredAttributeNames().map((attr) => (
                      <MenuItem key={attr.value} value={attr.value}>
                        <Box>
                          <Typography variant="body1">{attr.label}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {attr.value} {attr.entity !== 'MULTIPLE' && `(${attr.entity})`}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <Search />}
                onClick={handleSearch}
                disabled={loading || !selectedEntity || !selectedAttributeName}
                size="large"
              >
                {loading ? 'Searching...' : 'Get Options'}
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
                    key={`${entry.value}-${index}`}
                    label={entry.value.replace(':', ' → ')}
                    variant="outlined"
                    size="small"
                    onClick={() => useHistoryValue(entry.value)}
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
                Click any search to reuse it
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
              Options Results
              {options.length > 0 && (
                <Chip 
                  label={`${options.length} options`} 
                  color="primary" 
                  size="small" 
                  sx={{ ml: 2 }}
                />
              )}
            </Typography>
            
            {!hasSearched ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Settings sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Ready to Search
                </Typography>
                <Typography color="text.secondary">
                  Select an entity and attribute name above, then click "Get Options"
                </Typography>
              </Box>
            ) : options.length === 0 && !loading ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <List sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No options found
                </Typography>
                <Typography color="text.secondary">
                  No options available for the selected entity and attribute
                </Typography>
              </Box>
            ) : options.length > 0 ? (
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.100' }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Code sx={{ mr: 1, fontSize: 18 }} />
                          <strong>Value</strong>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography sx={{ mr: 1 }}>📝</Typography>
                          <strong>Label</strong>
                        </Box>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {options.map((option, index) => (
                      <TableRow 
                        key={`${option.value}-${index}`}
                        sx={{ 
                          '&:nth-of-type(odd)': { backgroundColor: 'grey.50' },
                          '&:hover': { backgroundColor: 'blue.50' }
                        }}
                      >
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontFamily: 'monospace',
                              backgroundColor: 'grey.200',
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              display: 'inline-block'
                            }}
                          >
                            {option.value || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1">
                            {option.label || 'N/A'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : null}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
