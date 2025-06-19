'use client';

import { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Chip, FormControl, InputLabel, Select, MenuItem, Alert, CircularProgress, Paper, Divider, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { Search, Business, LocationOn, History, Clear, ExpandMore, AccountTree, Groups, Map } from '@mui/icons-material';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS } from '@/lib/environments';

// TypeScript interfaces based on the GraphQL schema
interface ProselytingArea {
  // Define proselyting area fields if needed
}

interface Missionary {
  id?: string;
  missionaryNumber?: number;
  recommendFirstName?: string;
  recommendLastName?: string;
}

interface EcclesiasticalUnit {
  id?: string;
  missionaryDeptUnitId?: number;
  name?: string;
  type?: string;
  cdolUnitTypeId?: number;
  cdolParentUnit?: number;
  cdolParentUnitTypeId?: number;
  parentUnit?: EcclesiasticalUnit;
  childUnits?: EcclesiasticalUnit[];
  missionOrgNumber?: number;
  proselytingAreas?: ProselytingArea[];
  missionaries?: Missionary[];
}

interface SearchHistory {
  fieldName: string;
  value: string;
  timestamp: number;
}

export default function EcclesiasticalUnitPage() {
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState('mis-gql-dev');
  
  const [unitId, setUnitId] = useState('');
  const [ecclesiasticalUnit, setEcclesiasticalUnit] = useState<EcclesiasticalUnit | null>(null);
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
    const savedHistory = localStorage.getItem('ecclesiastical-unit-search-history');
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
      localStorage.setItem('ecclesiastical-unit-search-history', JSON.stringify(searchHistory));
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

  const buildEcclesiasticalUnitQuery = (id: string) => {
    return `
      query GetEcclesiasticalUnit {
        ecclesiasticalUnit(id: "${id}") {
          id
          missionaryDeptUnitId
          name
          type
          cdolUnitTypeId
          cdolParentUnit
          cdolParentUnitTypeId
          missionOrgNumber
          parentUnit {
            id
            name
            type
            missionaryDeptUnitId
          }
          childUnits {
            id
            name
            type
            missionaryDeptUnitId
          }
          missionaries {
            id
            missionaryNumber
            recommendFirstName
            recommendLastName
          }
          proselytingAreas {
            # Add proselyting area fields if needed
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

    if (!unitId.trim()) {
      setError('Please provide an Ecclesiastical Unit ID');
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      // Add to search history
      addToSearchHistory('unitId', unitId);

      const query = buildEcclesiasticalUnitQuery(unitId.trim());
      console.log('Executing GraphQL query:', query);

      const response = await apiClient.executeGraphQLQuery(query);
      
      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors[0].message);
      }

      const data = response.data as { ecclesiasticalUnit: EcclesiasticalUnit };
      setEcclesiasticalUnit(data.ecclesiasticalUnit || null);
      
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
      setEcclesiasticalUnit(null);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setUnitId('');
    setEcclesiasticalUnit(null);
    setError(null);
    setHasSearched(false);
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('ecclesiastical-unit-search-history');
  };

  const useHistoryValue = (fieldName: string, value: string) => {
    if (fieldName === 'unitId') {
      setUnitId(value);
    }
  };

  const getFieldLabel = (fieldName: string) => {
    const labels: Record<string, string> = {
      unitId: 'Unit ID'
    };
    return labels[fieldName] || fieldName;
  };

  const renderChildUnits = (units: EcclesiasticalUnit[]) => {
    if (!units || units.length === 0) return null;

    return (
      <Box>
        <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 3 }}>
          Child Units ({units.length})
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          {units.map((unit, index) => (
            <Paper key={unit.id || index} sx={{ p: 2, backgroundColor: 'blue.50' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccountTree sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight="bold">
                  {unit.name || 'Unknown Unit'}
                </Typography>
              </Box>
              {unit.type && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Type:</strong> {unit.type}
                </Typography>
              )}
              {unit.id && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>ID:</strong> {unit.id}
                </Typography>
              )}
              {unit.missionaryDeptUnitId && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Dept Unit ID:</strong> {unit.missionaryDeptUnitId}
                </Typography>
              )}
            </Paper>
          ))}
        </Box>
      </Box>
    );
  };

  const renderMissionaries = (missionaries: Missionary[]) => {
    if (!missionaries || missionaries.length === 0) return null;

    return (
      <Box>
        <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 3 }}>
          Missionaries ({missionaries.length})
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
          {missionaries.map((missionary, index) => (
            <Paper key={missionary.id || index} sx={{ p: 2, backgroundColor: 'green.50' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Groups sx={{ mr: 1, color: 'success.main', fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight="bold">
                  {`${missionary.recommendFirstName || ''} ${missionary.recommendLastName || ''}`.trim() || 'Unknown'}
                </Typography>
              </Box>
              {missionary.missionaryNumber && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Missionary #:</strong> {missionary.missionaryNumber}
                </Typography>
              )}
              {missionary.id && (
                <Typography variant="body2" color="text.secondary">
                  <strong>ID:</strong> {missionary.id}
                </Typography>
              )}
            </Paper>
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 4 }}>
      <Box sx={{ maxWidth: '1200px', mx: 'auto', px: 3 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Ecclesiastical Unit Search
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Search for ecclesiastical unit details including hierarchy and assignments
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
              Search by Unit ID
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
              <TextField
                fullWidth
                label="Ecclesiastical Unit ID"
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                placeholder="Enter unit ID"
                helperText="Enter the unique identifier for the ecclesiastical unit"
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
                disabled={loading || !unitId.trim()}
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
              Ecclesiastical Unit Details
            </Typography>
            
            {!hasSearched ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Business sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Ready to Search
                </Typography>
                <Typography color="text.secondary">
                  Enter a unit ID above and click "Search" to find ecclesiastical unit information
                </Typography>
              </Box>
            ) : !ecclesiasticalUnit && !loading ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Business sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No unit found
                </Typography>
                <Typography color="text.secondary">
                  No ecclesiastical unit found for this ID
                </Typography>
              </Box>
            ) : ecclesiasticalUnit ? (
              <Box sx={{ maxWidth: '1000px', mx: 'auto' }}>
                <Paper sx={{ p: 4 }}>
                  {/* Unit Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Business sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                    <Box>
                      <Typography variant="h4" component="h2" gutterBottom>
                        {ecclesiasticalUnit.name || 'Unknown Unit'}
                      </Typography>
                      {ecclesiasticalUnit.type && (
                        <Typography variant="subtitle1" color="text.secondary">
                          Type: {ecclesiasticalUnit.type}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  {/* Unit Basic Information */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom color="primary">
                        Basic Information
                      </Typography>
                      
                      {ecclesiasticalUnit.id && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Business sx={{ fontSize: 20, mr: 2, color: 'text.secondary' }} />
                          <Typography variant="body1">
                            <strong>ID:</strong> {ecclesiasticalUnit.id}
                          </Typography>
                        </Box>
                      )}
                      
                      {ecclesiasticalUnit.missionaryDeptUnitId && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Business sx={{ fontSize: 20, mr: 2, color: 'text.secondary' }} />
                          <Typography variant="body1">
                            <strong>Missionary Dept Unit ID:</strong> {ecclesiasticalUnit.missionaryDeptUnitId}
                          </Typography>
                        </Box>
                      )}
                      
                      {ecclesiasticalUnit.missionOrgNumber && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Map sx={{ fontSize: 20, mr: 2, color: 'text.secondary' }} />
                          <Typography variant="body1">
                            <strong>Mission Org Number:</strong> {ecclesiasticalUnit.missionOrgNumber}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <Box>
                      <Typography variant="h6" gutterBottom color="primary">
                        CDOL Information
                      </Typography>
                      
                      {ecclesiasticalUnit.cdolUnitTypeId && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Business sx={{ fontSize: 20, mr: 2, color: 'text.secondary' }} />
                          <Typography variant="body1">
                            <strong>CDOL Unit Type ID:</strong> {ecclesiasticalUnit.cdolUnitTypeId}
                          </Typography>
                        </Box>
                      )}
                      
                      {ecclesiasticalUnit.cdolParentUnit && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <AccountTree sx={{ fontSize: 20, mr: 2, color: 'text.secondary' }} />
                          <Typography variant="body1">
                            <strong>CDOL Parent Unit:</strong> {ecclesiasticalUnit.cdolParentUnit}
                          </Typography>
                        </Box>
                      )}
                      
                      {ecclesiasticalUnit.cdolParentUnitTypeId && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <AccountTree sx={{ fontSize: 20, mr: 2, color: 'text.secondary' }} />
                          <Typography variant="body1">
                            <strong>CDOL Parent Unit Type ID:</strong> {ecclesiasticalUnit.cdolParentUnitTypeId}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>

                  {/* Parent Unit */}
                  {ecclesiasticalUnit.parentUnit && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom color="primary">
                        Parent Unit
                      </Typography>
                      <Paper sx={{ p: 3, backgroundColor: 'orange.50' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <AccountTree sx={{ mr: 2, color: 'warning.main' }} />
                          <Typography variant="h6">
                            {ecclesiasticalUnit.parentUnit.name || 'Unknown Parent Unit'}
                          </Typography>
                        </Box>
                        {ecclesiasticalUnit.parentUnit.type && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            <strong>Type:</strong> {ecclesiasticalUnit.parentUnit.type}
                          </Typography>
                        )}
                        {ecclesiasticalUnit.parentUnit.id && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            <strong>ID:</strong> {ecclesiasticalUnit.parentUnit.id}
                          </Typography>
                        )}
                        {ecclesiasticalUnit.parentUnit.missionaryDeptUnitId && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Dept Unit ID:</strong> {ecclesiasticalUnit.parentUnit.missionaryDeptUnitId}
                          </Typography>
                        )}
                      </Paper>
                    </Box>
                  )}

                  {/* Child Units */}
                  {ecclesiasticalUnit.childUnits && ecclesiasticalUnit.childUnits.length > 0 && 
                    renderChildUnits(ecclesiasticalUnit.childUnits)
                  }

                  {/* Missionaries */}
                  {ecclesiasticalUnit.missionaries && ecclesiasticalUnit.missionaries.length > 0 && 
                    renderMissionaries(ecclesiasticalUnit.missionaries)
                  }

                  {/* Proselyting Areas */}
                  {ecclesiasticalUnit.proselytingAreas && ecclesiasticalUnit.proselytingAreas.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="h6" gutterBottom color="primary">
                        Proselyting Areas ({ecclesiasticalUnit.proselytingAreas.length})
                      </Typography>
                      <Paper sx={{ p: 2, backgroundColor: 'purple.50' }}>
                        <Typography variant="body2" color="text.secondary">
                          {ecclesiasticalUnit.proselytingAreas.length} proselyting area(s) associated with this unit
                        </Typography>
                      </Paper>
                    </Box>
                  )}
                </Paper>
              </Box>
            ) : null}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
