'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  IconButton,
  Divider,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Search,
  NavigateNext,
  NavigateBefore,
  FilterList,
  Clear,
  Person,
  ExpandMore,
  Refresh
} from '@mui/icons-material';
import { SelectChangeEvent } from '@mui/material/Select';
import { getEnvironmentConfig, getEnvironmentNames } from '@/lib/environments';
import { ApiClient } from '@/lib/api-client';

// GraphQL Types
interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}

interface Missionary {
  missionaryNumber?: number;
  cmisUUID?: string;
  inqMissionaryId?: string;
  id?: string;
  legacyCmisId?: number;
  ldsAccountId?: number;
  recommendFirstName?: string;
  recommendMiddleName?: string;
  recommendLastName?: string;
  recommendNameSuffix?: string;
  latinFirstName?: string;
  latinMiddleName?: string;
  latinLastName?: string;
  latinNameSuffix?: string;
  birthDate?: string;
  birthPlace?: string;
  emailAddress?: string;
  proselytingEmailAddress?: string;
  homeUnitNumber?: number;
  membershipUnitNumber?: number;
  submittingUnitNumber?: number;
  fundingUnitNumber?: number;
}

interface MissionariesEdge {
  node: Missionary;
  cursor: string;
}

interface MissionariesConnection {
  edges: MissionariesEdge[];
  pageInfo: PageInfo;
}

interface MissionariesConnectionInput {
  filter?: MissionariesConnectionFilters;
}

interface MissionariesConnectionFilters {
  serviceDepartment?: ServiceDepartment;
  missionaryStatus?: MissionaryStatusCode[];
}

interface MissionariesConnectionResult {
  data?: {
    missionariesConnection?: MissionariesConnection;
  };
  errors?: Array<{ message: string }>;
}

enum ServiceDepartment {
  COMMUNITY_ORGANIZATIONS = 'COMMUNITY_ORGANIZATIONS',
  AP = 'AP',
  AUD = 'AUD',
  AVD = 'AVD',
  BPW = 'BPW',
  CCD = 'CCD',
  CES = 'CES',
  CHD = 'CHD',
  COR = 'COR',
  CPD = 'CPD',
  CSD = 'CSD',
  CUR = 'CUR',
  DTA = 'DTA',
  FHD = 'FHD',
  FLR = 'FLR',
  FRD = 'FRD',
  GSD = 'GSD',
  HQF = 'HQF',
  HRD = 'HRD',
  ICS = 'ICS',
  LBC = 'LBC',
  MFD = 'MFD',
  MIS = 'MIS',
  MMD = 'MMD',
  OCS = 'OCS',
  OFP = 'OFP',
  OGC = 'OGC',
  PAD = 'PAD',
  PBA = 'PBA',
  PCC = 'PCC',
  PFD = 'PFD',
  PRI = 'PRI',
  PSD = 'PSD',
  PTH = 'PTH',
  QSV = 'QSV',
  QTW = 'QTW',
  SAI = 'SAI',
  SMO = 'SMO',
  SPD = 'SPD',
  TBC = 'TBC',
  TPL = 'TPL',
  WSR = 'WSR'
}

enum MissionaryStatusCode {
  SSM_AWAITING_CALL = 'SSM_AWAITING_CALL',
  CALL_SENT = 'CALL_SENT',
  REMOTE_MTC = 'REMOTE_MTC',
  ONSITE_MTC = 'ONSITE_MTC',
  PRE_FIELD = 'PRE_FIELD',
  IN_FIELD = 'IN_FIELD',
  ON_LEAVE = 'ON_LEAVE',
  RELEASED = 'RELEASED',
  UNKNOWN = 'UNKNOWN'
}

// GraphQL Query
const MISSIONARIES_CONNECTION_QUERY = `
  query MissionariesConnection($input: MissionariesConnectionInput!, $first: Int, $after: String, $last: Int, $before: String) {
    missionariesConnection(input: $input, first: $first, after: $after, last: $last, before: $before) {
      edges {
        node {
          missionaryNumber
          cmisUUID
          inqMissionaryId
          id
          legacyCmisId
          ldsAccountId
          recommendFirstName
          recommendMiddleName
          recommendLastName
          recommendNameSuffix
          latinFirstName
          latinMiddleName
          latinLastName
          latinNameSuffix
          birthDate
          birthPlace
          emailAddress
          proselytingEmailAddress
          homeUnitNumber
          membershipUnitNumber
          submittingUnitNumber
          fundingUnitNumber
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

// Helper functions
const formatMissionaryName = (missionary: Missionary): string => {
  const parts = [
    missionary.recommendFirstName || missionary.latinFirstName,
    missionary.recommendMiddleName || missionary.latinMiddleName,
    missionary.recommendLastName || missionary.latinLastName,
    missionary.recommendNameSuffix || missionary.latinNameSuffix
  ].filter(Boolean);
  return parts.join(' ') || 'Unknown';
};

const getServiceDepartmentLabel = (dept: ServiceDepartment): string => {
  const labels: Record<ServiceDepartment, string> = {
    [ServiceDepartment.COMMUNITY_ORGANIZATIONS]: 'Community Organizations',
    [ServiceDepartment.AP]: 'Audit & Compliance (AP)',
    [ServiceDepartment.AUD]: 'Internal Audit (AUD)',
    [ServiceDepartment.AVD]: 'Audiovisual (AVD)',
    [ServiceDepartment.BPW]: 'Business Process & Workflow (BPW)',
    [ServiceDepartment.CCD]: 'Communication & Creative (CCD)',
    [ServiceDepartment.CES]: 'Church Educational System (CES)',
    [ServiceDepartment.CHD]: 'Church History (CHD)',
    [ServiceDepartment.COR]: 'Corporate (COR)',
    [ServiceDepartment.CPD]: 'Church Physical Development (CPD)',
    [ServiceDepartment.CSD]: 'Church Security (CSD)',
    [ServiceDepartment.CUR]: 'Curriculum (CUR)',
    [ServiceDepartment.DTA]: 'Data & Analytics (DTA)',
    [ServiceDepartment.FHD]: 'Family History (FHD)',
    [ServiceDepartment.FLR]: 'Facilities (FLR)',
    [ServiceDepartment.FRD]: 'Finance & Records (FRD)',
    [ServiceDepartment.GSD]: 'Global Services (GSD)',
    [ServiceDepartment.HQF]: 'Headquarters Facilities (HQF)',
    [ServiceDepartment.HRD]: 'Human Resources (HRD)',
    [ServiceDepartment.ICS]: 'Information & Communication Services (ICS)',
    [ServiceDepartment.LBC]: 'Legal & Business Counsel (LBC)',
    [ServiceDepartment.MFD]: 'Member & Family (MFD)',
    [ServiceDepartment.MIS]: 'Missionary (MIS)',
    [ServiceDepartment.MMD]: 'Materials Management (MMD)',
    [ServiceDepartment.OCS]: 'Office of Church Security (OCS)',
    [ServiceDepartment.OFP]: 'Office of the First Presidency (OFP)',
    [ServiceDepartment.OGC]: 'Office of General Counsel (OGC)',
    [ServiceDepartment.PAD]: 'Public Affairs (PAD)',
    [ServiceDepartment.PBA]: 'Presiding Bishopric Administration (PBA)',
    [ServiceDepartment.PCC]: 'Priesthood & Family (PCC)',
    [ServiceDepartment.PFD]: 'Perpetual Education Fund (PFD)',
    [ServiceDepartment.PRI]: 'Printing (PRI)',
    [ServiceDepartment.PSD]: 'Philanthropies (PSD)',
    [ServiceDepartment.PTH]: 'Pathway (PTH)',
    [ServiceDepartment.QSV]: 'Quorum of the Seventy (QSV)',
    [ServiceDepartment.QTW]: 'Quorum of the Twelve (QTW)',
    [ServiceDepartment.SAI]: 'Self-Reliance & International (SAI)',
    [ServiceDepartment.SMO]: 'Senior Missionary Operations (SMO)',
    [ServiceDepartment.SPD]: 'Store & Properties (SPD)',
    [ServiceDepartment.TBC]: 'Temple & Burial Clothes (TBC)',
    [ServiceDepartment.TPL]: 'Temple (TPL)',
    [ServiceDepartment.WSR]: 'Welfare & Self-Reliance (WSR)'
  };
  return labels[dept] || dept;
};

const getMissionaryStatusLabel = (status: MissionaryStatusCode): string => {
  const labels: Record<MissionaryStatusCode, string> = {
    [MissionaryStatusCode.SSM_AWAITING_CALL]: 'Awaiting Call',
    [MissionaryStatusCode.CALL_SENT]: 'Call Sent',
    [MissionaryStatusCode.REMOTE_MTC]: 'Remote MTC',
    [MissionaryStatusCode.ONSITE_MTC]: 'Onsite MTC',
    [MissionaryStatusCode.PRE_FIELD]: 'Pre-Field',
    [MissionaryStatusCode.IN_FIELD]: 'In Field',
    [MissionaryStatusCode.ON_LEAVE]: 'On Leave',
    [MissionaryStatusCode.RELEASED]: 'Released',
    [MissionaryStatusCode.UNKNOWN]: 'Unknown'
  };
  return labels[status] || status;
};

export default function MissionariesConnectionPage() {
  const [selectedEnvironment, setSelectedEnvironment] = useState('mis-gql-dev');
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Connection data
  const [connection, setConnection] = useState<MissionariesConnection | null>(null);
  
  // Filter states
  const [serviceDepartment, setServiceDepartment] = useState<ServiceDepartment | ''>('');
  const [selectedStatuses, setSelectedStatuses] = useState<MissionaryStatusCode[]>([]);
  
  // Pagination states
  const [pageSize, setPageSize] = useState(10);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined);
  const [cursors, setCursors] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  
  // UI states
  const [showFilters, setShowFilters] = useState(true);

  const environmentOptions = getEnvironmentNames();

  // Initialize API client when environment changes
  useEffect(() => {
    const config = getEnvironmentConfig(selectedEnvironment);
    if (config) {
      setApiClient(new ApiClient(config, selectedEnvironment));
    }
    localStorage.setItem('selectedEnvironment', selectedEnvironment);
    window.dispatchEvent(new Event('environmentChanged'));
  }, [selectedEnvironment]);

  // Load saved environment on component mount
  useEffect(() => {
    const savedEnv = localStorage.getItem('selectedEnvironment') || 'mis-gql-dev';
    setSelectedEnvironment(savedEnv);
  }, []);

  const handleEnvironmentChange = (event: SelectChangeEvent) => {
    setSelectedEnvironment(event.target.value);
    // Reset data when environment changes
    setConnection(null);
    setCurrentCursor(undefined);
    setCursors([]);
    setCurrentPage(1);
  };

  const buildQueryVariables = (cursor?: string, direction: 'forward' | 'backward' = 'forward') => {
    const filters: MissionariesConnectionFilters = {};
    
    if (serviceDepartment) {
      filters.serviceDepartment = serviceDepartment;
    }
    
    if (selectedStatuses.length > 0) {
      filters.missionaryStatus = selectedStatuses;
    }

    const variables: any = {
      input: Object.keys(filters).length > 0 ? { filter: filters } : {}
    };

    if (direction === 'forward') {
      variables.first = pageSize;
      if (cursor) {
        variables.after = cursor;
      }
    } else {
      variables.last = pageSize;
      if (cursor) {
        variables.before = cursor;
      }
    }

    return variables;
  };

  const executeQuery = async (cursor?: string, direction: 'forward' | 'backward' = 'forward') => {
    if (!apiClient) {
      setError('API client not initialized. Please select an environment.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const variables = buildQueryVariables(cursor, direction);
      const result = await apiClient.executeGraphQLQuery(MISSIONARIES_CONNECTION_QUERY, variables) as MissionariesConnectionResult;
      
      if (result.data?.missionariesConnection) {
        setConnection(result.data.missionariesConnection);
      } else if (result.errors) {
        throw new Error(result.errors.map(e => e.message).join(', '));
      } else {
        throw new Error('No data returned from query');
      }
    } catch (err) {
      console.error('Missionaries connection query error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load missionaries');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentCursor(undefined);
    setCursors([]);
    setCurrentPage(1);
    executeQuery();
  };

  const handleNextPage = () => {
    if (connection?.pageInfo.hasNextPage && connection.pageInfo.endCursor) {
      setCursors(prev => [...prev, currentCursor || '']);
      setCurrentCursor(connection.pageInfo.endCursor);
      setCurrentPage(prev => prev + 1);
      executeQuery(connection.pageInfo.endCursor, 'forward');
    }
  };

  const handlePreviousPage = () => {
    if (connection?.pageInfo.hasPreviousPage && cursors.length > 0) {
      const previousCursor = cursors[cursors.length - 1];
      setCursors(prev => prev.slice(0, -1));
      setCurrentCursor(previousCursor || undefined);
      setCurrentPage(prev => prev - 1);
      executeQuery(previousCursor || undefined, 'forward');
    }
  };

  const clearFilters = () => {
    setServiceDepartment('');
    setSelectedStatuses([]);
  };

  const handleStatusChange = (event: SelectChangeEvent<MissionaryStatusCode[]>) => {
    const value = event.target.value;
    setSelectedStatuses(typeof value === 'string' ? value.split(',') as MissionaryStatusCode[] : value);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Missionaries Connection
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Paginated retrieval of missionaries using GraphQL Relay Connection specification
        </Typography>
      </Box>

      {/* Environment Selection */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'center' }}>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <FormControl fullWidth>
              <InputLabel>Environment</InputLabel>
              <Select
                value={selectedEnvironment}
                label="Environment"
                onChange={handleEnvironmentChange}
              >
                {environmentOptions.map((env) => (
                  <MenuItem key={env.key} value={env.key}>
                    {env.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <FormControl fullWidth>
              <InputLabel>Page Size</InputLabel>
              <Select
                value={pageSize}
                label="Page Size"
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showFilters}
                  onChange={(e) => setShowFilters(e.target.checked)}
                />
              }
              label="Show Filters"
            />
          </Box>
        </Box>
      </Paper>

      {/* Filters */}
      {showFilters && (
        <Accordion expanded={showFilters} sx={{ mb: 3 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">
              <FilterList sx={{ mr: 1, verticalAlign: 'middle' }} />
              Filters
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                <Box sx={{ flex: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel>Service Department</InputLabel>
                    <Select
                      value={serviceDepartment}
                      label="Service Department"
                      onChange={(e) => setServiceDepartment(e.target.value as ServiceDepartment)}
                    >
                      <MenuItem value="">All Departments</MenuItem>
                      {Object.values(ServiceDepartment).map((dept) => (
                        <MenuItem key={dept} value={dept}>
                          {getServiceDepartmentLabel(dept)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel>Missionary Status</InputLabel>
                    <Select
                      multiple
                      value={selectedStatuses}
                      label="Missionary Status"
                      onChange={handleStatusChange}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={getMissionaryStatusLabel(value)} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      {Object.values(MissionaryStatusCode).map((status) => (
                        <MenuItem key={status} value={status}>
                          {getMissionaryStatusLabel(status)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Search />}
                  onClick={handleSearch}
                  disabled={loading}
                >
                  Search Missionaries
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Clear />}
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={() => executeQuery(currentCursor)}
                  disabled={loading}
                >
                  Refresh
                </Button>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Results */}
      {connection && !loading && (
        <Paper sx={{ p: 3 }}>
          {/* Results Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Missionaries Results (Page {currentPage})
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {connection.edges.length} missionaries loaded
              </Typography>
              <Divider orientation="vertical" flexItem />
              <IconButton
                onClick={handlePreviousPage}
                disabled={!connection.pageInfo.hasPreviousPage || loading}
              >
                <NavigateBefore />
              </IconButton>
              <Typography variant="body2">{currentPage}</Typography>
              <IconButton
                onClick={handleNextPage}
                disabled={!connection.pageInfo.hasNextPage || loading}
              >
                <NavigateNext />
              </IconButton>
            </Box>
          </Box>

          {/* Pagination Info */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Pagination Information
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">Has Next Page:</Typography>
                <Typography variant="body2">
                  {connection.pageInfo.hasNextPage ? 'Yes' : 'No'}
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">Has Previous Page:</Typography>
                <Typography variant="body2">
                  {connection.pageInfo.hasPreviousPage ? 'Yes' : 'No'}
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">Start Cursor:</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {connection.pageInfo.startCursor ? `${connection.pageInfo.startCursor.substring(0, 20)}...` : 'None'}
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">End Cursor:</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {connection.pageInfo.endCursor ? `${connection.pageInfo.endCursor.substring(0, 20)}...` : 'None'}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Results Table */}
          {connection.edges.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Missionary #</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Birth Date</TableCell>
                    <TableCell>Home Unit</TableCell>
                    <TableCell>IDs</TableCell>
                    <TableCell>Cursor</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {connection.edges.map((edge) => (
                    <TableRow key={edge.cursor} hover>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {edge.node.missionaryNumber || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {formatMissionaryName(edge.node)}
                          </Typography>
                          {edge.node.birthPlace && (
                            <Typography variant="caption" color="text.secondary">
                              {edge.node.birthPlace}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {edge.node.emailAddress || 'N/A'}
                          </Typography>
                          {edge.node.proselytingEmailAddress && (
                            <Typography variant="caption" color="text.secondary">
                              Proselyting: {edge.node.proselytingEmailAddress}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {edge.node.birthDate || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {edge.node.homeUnitNumber || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          {edge.node.cmisUUID && (
                            <Typography variant="caption" color="text.secondary">
                              CMIS: {edge.node.cmisUUID.substring(0, 8)}...
                            </Typography>
                          )}
                          {edge.node.inqMissionaryId && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              INQ: {edge.node.inqMissionaryId}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" fontFamily="monospace" color="text.secondary">
                          {edge.cursor.substring(0, 12)}...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Person sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No missionaries found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your filters or search criteria
              </Typography>
            </Box>
          )}
        </Paper>
      )}
    </Container>
  );
}
