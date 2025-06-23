'use client';

import { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, TextField, Alert, CircularProgress, Chip, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Search, Clear, History, Assignment, LocationOn, Person, Groups, Phone, Email, CalendarToday, Info } from '@mui/icons-material';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS, getEnvironmentKeysByService } from '@/lib/environments';

interface Option {
  value: string;
  label: string;
}

interface Mission {
  id: string;
  name: string;
  address: string;
  email: string;
  leaderName: string;
  leaderEmail: string;
  phone: string;
  zones: Array<{
    id: string;
    name: string;
  }>;
}

interface Missionary {
  missionaryNumber: number;
  latinFirstName: string;
  latinLastName: string;
}

interface AssignmentLocationComponent {
  id: number;
}

interface Assignment {
  id: string;
  assignmentChurchUnitNumber: number;
  assignmentType: Option;
  assignmentStatus: Option;
  serviceMethod: Option;
  isPermanent: boolean;
  assignmentStartDate: string;
  assignmentEndDate: string;
  curriculumName: string;
  trainingTrackName: string;
  courseName: string;
  trainingFacilityName: string;
  component: AssignmentLocationComponent;
  mission: Mission;
  missionary: Missionary;
  callId: number;
  positionId: number;
}

interface SearchHistory {
  missionaryNumber: string;
  timestamp: string;
  resultFound: boolean;
}

export default function ActiveAssignmentPage() {
  const [missionaryNumber, setMissionaryNumber] = useState('');
  const [assignment, setAssignment] = useState<Assignment | null>(null);
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
    const savedHistory = localStorage.getItem('activeAssignmentSearchHistory');
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
      localStorage.setItem('activeAssignmentSearchHistory', JSON.stringify(searchHistory));
    }
  }, [searchHistory, isHistoryLoaded]);

  const addToHistory = (missionaryNum: string, resultFound: boolean) => {
    if (!missionaryNum.trim()) return;
    
    const newHistoryItem: SearchHistory = {
      missionaryNumber: missionaryNum.trim(),
      timestamp: new Date().toISOString(),
      resultFound
    };

    setSearchHistory(prev => {
      // Remove existing entry if it exists
      const filtered = prev.filter(item => item.missionaryNumber !== missionaryNum.trim());
      // Add new entry at the beginning
      const updated = [newHistoryItem, ...filtered];
      // Keep only the last 10 items
      return updated.slice(0, 10);
    });
  };

  const removeFromHistory = (missionaryNum: string) => {
    setSearchHistory(prev => prev.filter(item => item.missionaryNumber !== missionaryNum));
  };

  const clearHistory = () => {
    setSearchHistory([]);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!missionaryNumber.trim()) return;

    if (!apiClient) {
      setError('API client not initialized. Please refresh the page.');
      return;
    }

    setLoading(true);
    setError(null);
    setAssignment(null);

    try {
      const query = `
        query ActiveAssignment($missionaryNumber: ID!) {
          activeAssignment(missionaryNumber: $missionaryNumber) {
            id
            assignmentChurchUnitNumber
            assignmentType {
              value
              label
            }
            assignmentStatus {
              value
              label
            }
            serviceMethod {
              value
              label
            }
            isPermanent
            assignmentStartDate
            assignmentEndDate
            curriculumName
            trainingTrackName
            courseName
            trainingFacilityName
            callId
            positionId
            component {
              id
            }
            mission {
              id
              name
              address
              email
              leaderName
              leaderEmail
              phone
              zones {
                id
                name
              }
            }
            missionary {
              missionaryNumber
              latinFirstName
              latinLastName
            }
          }
        }
      `;

      const variables = { missionaryNumber };
      const response = await apiClient.executeGraphQLQuery(query, variables);
      
      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors[0].message);
      }

      const data = response.data as { activeAssignment: Assignment | null };
      if (data.activeAssignment) {
        setAssignment(data.activeAssignment);
        addToHistory(missionaryNumber, true);
      } else {
        setError('No active assignment found for this missionary number');
        addToHistory(missionaryNumber, false);
      }
    } catch (err: any) {
      console.error('Error searching for active assignment:', err);
      setError(err.message || 'Failed to search for active assignment');
      addToHistory(missionaryNumber, false);
    } finally {
      setLoading(false);
    }
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

  const handleClear = () => {
    setMissionaryNumber('');
    setAssignment(null);
    setError(null);
  };

  const clearSearchHistory = () => {
    clearHistory();
  };

  const useHistorySearch = (historyItem: SearchHistory) => {
    setMissionaryNumber(historyItem.missionaryNumber);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', p: 3 }}>
      <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assignment color="primary" />
            Active Assignment Search
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Find a missionary's current active assignment by their missionary number
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
                label="Missionary Number / Legacy Miss ID"
                value={missionaryNumber}
                onChange={(e) => setMissionaryNumber(e.target.value)}
                placeholder="Enter missionary number (e.g., 123456)"
                required
                variant="outlined"
              />
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !missionaryNumber.trim()}
                startIcon={loading ? <CircularProgress size={20} /> : <Search />}
                sx={{ minWidth: 150 }}
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
                    label={`Missionary #${item.missionaryNumber} - ${item.resultFound ? 'Found' : 'Not Found'}`}
                    onClick={() => useHistorySearch(item)}
                    onDelete={() => removeFromHistory(item.missionaryNumber)}
                    variant="outlined"
                    color={item.resultFound ? 'success' : 'error'}
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

        {/* Assignment Results */}
        {assignment && (
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ bgcolor: 'primary.50', borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h5" color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Assignment />
                Active Assignment Details
              </Typography>
              <Typography color="primary.dark">Assignment ID: {assignment.id}</Typography>
            </CardContent>

            <CardContent sx={{ p: 3 }}>
              {/* Missionary Information */}
              {assignment.missionary && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person color="primary" />
                    Missionary Information
                  </Typography>
                  <Card variant="outlined" sx={{ bgcolor: 'grey.50', p: 2 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Missionary Number:</Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {assignment.missionary.missionaryNumber}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Name:</Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {assignment.missionary.latinFirstName} {assignment.missionary.latinLastName}
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Box>
              )}

              {/* Assignment Details */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Assignment color="primary" />
                  Assignment Details
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
                  <Card sx={{ bgcolor: 'primary.50', p: 2 }}>
                    <Typography variant="caption" color="primary.main">Assignment Type:</Typography>
                    <Typography variant="body2" fontWeight="medium" color="primary.dark">
                      {assignment.assignmentType?.label || 'Not specified'}
                    </Typography>
                  </Card>
                  <Card sx={{ bgcolor: 'success.50', p: 2 }}>
                    <Typography variant="caption" color="success.main">Assignment Status:</Typography>
                    <Typography variant="body2" fontWeight="medium" color="success.dark">
                      {assignment.assignmentStatus?.label || 'Not specified'}
                    </Typography>
                  </Card>
                  <Card sx={{ bgcolor: 'secondary.50', p: 2 }}>
                    <Typography variant="caption" color="secondary.main">Service Method:</Typography>
                    <Typography variant="body2" fontWeight="medium" color="secondary.dark">
                      {assignment.serviceMethod?.label || 'Not specified'}
                    </Typography>
                  </Card>
                  <Card sx={{ bgcolor: 'warning.50', p: 2 }}>
                    <Typography variant="caption" color="warning.main">Start Date:</Typography>
                    <Typography variant="body2" fontWeight="medium" color="warning.dark">
                      {formatDate(assignment.assignmentStartDate)}
                    </Typography>
                  </Card>
                  <Card sx={{ bgcolor: 'error.50', p: 2 }}>
                    <Typography variant="caption" color="error.main">End Date:</Typography>
                    <Typography variant="body2" fontWeight="medium" color="error.dark">
                      {formatDate(assignment.assignmentEndDate)}
                    </Typography>
                  </Card>
                  <Card sx={{ bgcolor: 'grey.100', p: 2 }}>
                    <Typography variant="caption" color="text.secondary">Is Permanent:</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {assignment.isPermanent ? 'Yes' : 'No'}
                    </Typography>
                  </Card>
                </Box>
              </Box>

              {/* Assignment Location Component */}
              {assignment.component && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn color="primary" />
                    Assignment Location Component
                  </Typography>
                  <Card variant="outlined" sx={{ bgcolor: 'primary.50', p: 2 }}>
                    <Typography variant="caption" color="primary.main">Component ID:</Typography>
                    <Typography variant="body2" fontWeight="medium" color="primary.dark">
                      {assignment.component.id}
                    </Typography>
                  </Card>
                </Box>
              )}

              {/* Mission Information */}
              {assignment.mission && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn color="success" />
                    Mission Information
                  </Typography>
                  <Card variant="outlined" sx={{ bgcolor: 'success.50', p: 2 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2, mb: 2 }}>
                      <Box>
                        <Typography variant="caption" color="success.main">Mission Name:</Typography>
                        <Typography variant="body2" fontWeight="medium" color="success.dark">
                          {assignment.mission.name}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="success.main">Mission ID:</Typography>
                        <Typography variant="body2" fontWeight="medium" color="success.dark">
                          {assignment.mission.id}
                        </Typography>
                      </Box>
                      {assignment.mission.address && (
                        <Box>
                          <Typography variant="caption" color="success.main">Address:</Typography>
                          <Typography variant="body2" fontWeight="medium" color="success.dark">
                            {assignment.mission.address}
                          </Typography>
                        </Box>
                      )}
                      {assignment.mission.phone && (
                        <Box>
                          <Typography variant="caption" color="success.main">Phone:</Typography>
                          <Typography variant="body2" fontWeight="medium" color="success.dark" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Phone fontSize="small" />
                            {assignment.mission.phone}
                          </Typography>
                        </Box>
                      )}
                      {assignment.mission.email && (
                        <Box>
                          <Typography variant="caption" color="success.main">Email:</Typography>
                          <Typography variant="body2" fontWeight="medium" color="success.dark" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Email fontSize="small" />
                            {assignment.mission.email}
                          </Typography>
                        </Box>
                      )}
                      {assignment.mission.leaderName && (
                        <Box>
                          <Typography variant="caption" color="success.main">Mission Leader:</Typography>
                          <Typography variant="body2" fontWeight="medium" color="success.dark">
                            {assignment.mission.leaderName}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    
                    {assignment.mission.zones && assignment.mission.zones.length > 0 && (
                      <Box>
                        <Typography variant="caption" color="success.main">
                          Zones ({assignment.mission.zones.length}):
                        </Typography>
                        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {assignment.mission.zones.map((zone) => (
                            <Chip
                              key={zone.id}
                              label={zone.name}
                              color="success"
                              variant="outlined"
                              size="small"
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Card>
                </Box>
              )}

              {/* Training Information */}
              {(assignment.curriculumName || assignment.trainingTrackName || assignment.courseName || assignment.trainingFacilityName) && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Groups color="secondary" />
                    Training Information
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
                    {assignment.curriculumName && (
                      <Card sx={{ bgcolor: 'secondary.50', p: 2 }}>
                        <Typography variant="caption" color="secondary.main">Curriculum:</Typography>
                        <Typography variant="body2" fontWeight="medium" color="secondary.dark">
                          {assignment.curriculumName}
                        </Typography>
                      </Card>
                    )}
                    {assignment.trainingTrackName && (
                      <Card sx={{ bgcolor: 'secondary.50', p: 2 }}>
                        <Typography variant="caption" color="secondary.main">Training Track:</Typography>
                        <Typography variant="body2" fontWeight="medium" color="secondary.dark">
                          {assignment.trainingTrackName}
                        </Typography>
                      </Card>
                    )}
                    {assignment.courseName && (
                      <Card sx={{ bgcolor: 'secondary.50', p: 2 }}>
                        <Typography variant="caption" color="secondary.main">Course:</Typography>
                        <Typography variant="body2" fontWeight="medium" color="secondary.dark">
                          {assignment.courseName}
                        </Typography>
                      </Card>
                    )}
                    {assignment.trainingFacilityName && (
                      <Card sx={{ bgcolor: 'secondary.50', p: 2 }}>
                        <Typography variant="caption" color="secondary.main">Training Facility:</Typography>
                        <Typography variant="body2" fontWeight="medium" color="secondary.dark">
                          {assignment.trainingFacilityName}
                        </Typography>
                      </Card>
                    )}
                  </Box>
                </Box>
              )}

              {/* Additional IDs */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Info color="action" />
                  System Identifiers
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                  {assignment.assignmentChurchUnitNumber && (
                    <Card sx={{ bgcolor: 'grey.50', p: 2 }}>
                      <Typography variant="caption" color="text.secondary">Church Unit Number:</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {assignment.assignmentChurchUnitNumber}
                      </Typography>
                    </Card>
                  )}
                  {assignment.callId && (
                    <Card sx={{ bgcolor: 'grey.50', p: 2 }}>
                      <Typography variant="caption" color="text.secondary">Call ID:</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {assignment.callId}
                      </Typography>
                    </Card>
                  )}
                  {assignment.positionId && (
                    <Card sx={{ bgcolor: 'grey.50', p: 2 }}>
                      <Typography variant="caption" color="text.secondary">Position ID:</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {assignment.positionId}
                      </Typography>
                    </Card>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card sx={{ bgcolor: 'info.50', border: 1, borderColor: 'info.200' }}>
          <CardContent>
            <Typography variant="h6" color="info.main" gutterBottom>
              💡 How to Use Active Assignment Search
            </Typography>
            <Box sx={{ '& > *': { mb: 1 } }}>
              <Typography variant="body2" color="info.dark">
                • Enter a missionary number (also known as Legacy Miss ID) to find their current active assignment
              </Typography>
              <Typography variant="body2" color="info.dark">
                • The search will return comprehensive assignment details including mission, location, training, and status information
              </Typography>
              <Typography variant="body2" color="info.dark">
                • Recent searches are automatically saved and can be accessed from the search history section
              </Typography>
              <Typography variant="body2" color="info.dark">
                • Click on any item in the search history to quickly repeat that search
              </Typography>
              <Typography variant="body2" color="info.dark">
                • Assignment data includes current mission details, assignment location, training information, and system identifiers
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
