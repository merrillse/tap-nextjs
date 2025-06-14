'use client';

import { useState, useEffect } from 'react';
import { ENVIRONMENTS, getEnvironmentConfig, getEnvironmentNames, EnvironmentConfig } from '@/lib/environments';
import { safeStringify } from '@/lib/utils';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Box, 
  Typography, 
  Button,
  Alert,
  Paper,
  Grid,
  Chip,
  Autocomplete,
  TextField
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';

export default function SettingsPage() {
  // Available proxy clients - sorted by name for easy discovery
  const proxyClients = [
    { name: 'Primary', clientId: '0oak0jqakvevwjWrp357' },
    { name: 'CCDOPS - Church Calendar', clientId: '0oa17jzhwi9uusIoz358' },
    { name: 'CCDOPS - Church Calendar [non-prod]', clientId: '0oaki3kbszeewJmMX357' },
    { name: 'CCDOPS - Church Calendar [PROD]', clientId: '0oaki3swtbO6fOZ9x357' },
    { name: 'CES', clientId: '0oa16arpkjgDezdcI358' },
    { name: 'CMIS Authorization Service', clientId: '0oao4ayxo9fgtnKYj357' },
    { name: 'CMIS Callings', clientId: '0oa1joivv92SShYCD358' },
    { name: 'CMIS Services Team', clientId: '0oan0z1efagK9cXWu357' },
    { name: 'DMBA Group [non-prod]', clientId: '0oan1043xxD4cTtoU357' },
    { name: 'DMBA Group [PROD]', clientId: '0oan1036pnukfeJSi357' },
    { name: 'EDUINT - Education Integrations', clientId: '0oagzh13nq0zK7c5I357' },
    { name: 'English Connect', clientId: '0oaixehfyryjaiS7M357' },
    { name: 'GVM Travel [non-prod]', clientId: '0oartjtss42ayIfJl357' },
    { name: 'GVM Travel [PROD]', clientId: '0oartjm5nguKZFN2c357' },
    { name: 'HR:MSR:Emergency Contact', clientId: '0oavpvglc1wJ9hVKv357' },
    { name: 'Identity', clientId: '0oa1099z1t0ZRaFwP358' },
    { name: 'ISR - Non-prod', clientId: '0oaqbq6isq9sDyIdx357' },
    { name: 'ISR - Prod', clientId: '0oapmoioz2z64riCE357' },
    { name: 'LCR [non-prod]', clientId: '0oalni75ar2LGLtVR357' },
    { name: 'LCR [PROD]', clientId: '0oalni7s7aEWlSTHQ357' },
    { name: 'Maps Service', clientId: '0oajrl8w5aVKhlkgq357' },
    { name: 'MBI', clientId: 'MBI' },
    { name: 'Member Tools', clientId: '0oakhtcbhyLVVeYFj357' },
    { name: 'Missionary Areabook [non-prod]', clientId: '0oasw5r8hmlOJ5GG0357' },
    { name: 'Missionary Areabook [PROD]', clientId: '0oasw6uegahMJ8N9Y357' },
    { name: 'Missionary Connect [non-prod]', clientId: '0oap88us4pbRI1HX3357' },
    { name: 'Missionary Connect [PROD]', clientId: '0oap88ozbhEr8UKIQ357' },
    { name: 'Missionary Graph Service Team', clientId: '0oak0jqakvevwjWrp357' },
    { name: 'Missionary History [non-prod]', clientId: '0oartk3ix1S0lvthA357' },
    { name: 'Missionary History [PROD]', clientId: '0oartjyikqPqM5LZm357' },
    { name: 'Missionary Portal [non-prod]', clientId: '0oa1gg8qdjlQh49GY358' },
    { name: 'Missionary Portal [PROD]', clientId: '0oa1gg90u4erOhnH2358' },
    { name: 'Missionary WORKS [non-prod]', clientId: '0oaoywrjdh16anAjm357' },
    { name: 'Missionary WORKS [PROD]', clientId: '0oaoypfnvzf56iHqv357' },
    { name: 'MTC Tech [non-prod]', clientId: '0oan0z7opvD8AseBb357' },
    { name: 'MTC Tech [PROD]', clientId: '0oan0z9i7ax38R7Tx357' },
    { name: 'Pathway Anthology [non-prod]', clientId: '0oa10ty566kw1iqcC358' },
    { name: 'Pathway Anthology [PROD]', clientId: '0oa18avadd4EBvHhP358' },
    { name: 'QuickReg [non-prod]', clientId: '0oavlgns0tNH0dvXb357' },
    { name: 'QuickReg [PROD]', clientId: '0oaxn76jai315m4i5357' },
    { name: 'RISK-MDQ', clientId: '0oa11ext3xoSIlS9S358' },
    { name: 'ServiceNow & Missionary Integration', clientId: '0oa1iwzkz1dcZvAIL358' },
    { name: 'TallEmbark', clientId: '0oa11j79yw80Y9jwj358' },
    { name: 'WAS - Ward Activity Sharing [non-prod]', clientId: '0oa1dfokrc9S2D5aO358' },
    { name: 'WAS - Ward Activity Sharing [PROD]', clientId: '0oa19kxjttvFItg3y358' },
    { name: 'Ward Directory & Map', clientId: '0oamyits9uliqoOn7357' },
    { name: 'WSR', clientId: '0oa1gs5l1prHsbDUc358' },
  ].sort((a, b) => a.name.localeCompare(b.name));

  const [selectedEnvKey, setSelectedEnvKey] = useState('mis-gql-stage');
  const [selectedProxyClient, setSelectedProxyClient] = useState('primary');
  const [currentConfig, setCurrentConfig] = useState<EnvironmentConfig | null>(null);
  const [settings, setSettings] = useState({
    environment: 'mis-gql-stage',
    proxyClient: 'primary',
    requestTimeout: 30,
    maxRetries: 3,
    enableLogging: true,
    logLevel: 'info'
  });

  const [saved, setSaved] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{
    status: string;
    error?: string;
    data?: Record<string, unknown>;
  } | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  useEffect(() => {
    const config = getEnvironmentConfig(selectedEnvKey);
    setCurrentConfig(config);
    setSettings(prev => ({ ...prev, environment: selectedEnvKey }));
  }, [selectedEnvKey]);

  // Sync proxy client selection with settings
  useEffect(() => {
    setSettings(prev => ({ ...prev, proxyClient: selectedProxyClient }));
  }, [selectedProxyClient]);

  // Load saved environment on component mount
  useEffect(() => {
    const savedEnv = localStorage.getItem('selectedEnvironment') || 'mis-gql-stage';
    const savedProxyClient = localStorage.getItem('selectedProxyClient') || 'primary';
    const savedSettings = localStorage.getItem('tap-settings');
    
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        setSelectedEnvKey(parsed.environment || savedEnv);
        setSelectedProxyClient(parsed.proxyClient || savedProxyClient);
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
        setSelectedEnvKey(savedEnv);
        setSelectedProxyClient(savedProxyClient);
      }
    } else {
      setSelectedEnvKey(savedEnv);
      setSelectedProxyClient(savedProxyClient);
    }
  }, []);

  const handleSave = () => {
    // Save to localStorage or your preferred storage
    localStorage.setItem('tap-settings', JSON.stringify(settings));
    localStorage.setItem('selectedEnvironment', selectedEnvKey);
    localStorage.setItem('selectedProxyClient', selectedProxyClient);
    // Dispatch custom event to update indicator
    window.dispatchEvent(new Event('environmentChanged'));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setSettings({
      environment: 'mis-gql-stage',
      proxyClient: 'primary',
      requestTimeout: 30,
      maxRetries: 3,
      enableLogging: true,
      logLevel: 'info'
    });
    setSelectedEnvKey('mis-gql-stage');
    setSelectedProxyClient('primary');
  };

  const checkHealth = async () => {
    if (!currentConfig) return;
    
    setCheckingHealth(true);
    try {
      const response = await fetch('/api/health/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          health_url: currentConfig.health_url
        }),
      });

      const healthData = await response.json();

      if (response.ok && healthData.success) {
        setHealthStatus({ status: 'UP', data: healthData.data });
      } else {
        setHealthStatus({ 
          status: 'DOWN', 
          error: healthData.error || `HTTP ${healthData.status}: ${healthData.statusText}` 
        });
      }
    } catch (error) {
      setHealthStatus({ 
        status: 'DOWN', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
    setCheckingHealth(false);
  };

  const handleEnvironmentChange = (event: SelectChangeEvent) => {
    setSelectedEnvKey(event.target.value);
  };

  const handleProxyClientChange = (event: SelectChangeEvent) => {
    setSelectedProxyClient(event.target.value);
  };

  const environmentOptions = getEnvironmentNames();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ maxWidth: '1024px', mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, py: 4 }}>
            
            {/* Header */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h1" sx={{ mb: 1, color: 'text.primary' }}>
                Settings
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Configure your API testing environment and authentication
              </Typography>
            </Box>

            {/* Success Message */}
            {saved && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Settings saved successfully!
              </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              
              {/* Environment Selection */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h2" sx={{ mb: 3 }}>
                  Environment Selection
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: { md: 'flex-end' } }}>
                  <Box sx={{ flex: 1 }}>
                    <FormControl fullWidth>
                      <InputLabel id="environment-select-label">Target Environment</InputLabel>
                      <Select
                        labelId="environment-select-label"
                        id="environment-select"
                        value={selectedEnvKey}
                        label="Target Environment"
                        onChange={handleEnvironmentChange}
                      >
                        {environmentOptions.map(env => (
                          <MenuItem key={env.key} value={env.key}>{env.name}</MenuItem>
                        ))}
                      </Select>
                      <Typography variant="caption" sx={{ mt: 0.5, color: 'text.secondary' }}>
                        Select your target environment
                      </Typography>
                    </FormControl>
                  </Box>
                  
                  <Box>
                    <Button
                      variant="contained"
                      onClick={checkHealth}
                      disabled={checkingHealth || !currentConfig}
                    >
                      {checkingHealth ? 'Checking...' : 'Check Health'}
                    </Button>
                  </Box>
                </Box>

                {/* Health Status */}
                {healthStatus && (
                  <Alert 
                    severity={healthStatus.status === 'UP' ? 'success' : 'error'}
                    sx={{ mt: 2 }}
                  >
                    <Typography variant="body2" fontWeight="medium">
                      {healthStatus.status === 'UP' ? 'Service is healthy' : 'Service is down'}
                    </Typography>
                    {healthStatus.error && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {healthStatus.error}
                      </Typography>
                    )}
                    {healthStatus.data !== undefined && (
                      <Box 
                        component="pre" 
                        sx={{ 
                          mt: 1, 
                          fontSize: '0.75rem', 
                          bgcolor: 'grey.100', 
                          p: 1, 
                          borderRadius: 1, 
                          overflow: 'auto',
                          fontFamily: 'monospace'
                        }}
                      >
                        {safeStringify(healthStatus.data)}
                      </Box>
                    )}
                  </Alert>
                )}
              </Paper>

              {/* Current Environment Configuration Display */}
              {currentConfig && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h2" sx={{ mb: 3 }}>
                    Current Environment Configuration
                  </Typography>
                  
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.secondary', mb: 0.5 }}>
                        GraphQL Endpoint
                      </Typography>
                      <Box sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1, fontFamily: 'monospace', fontSize: '0.875rem', wordBreak: 'break-all' }}>
                        {currentConfig.graph_url}
                      </Box>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.secondary', mb: 0.5 }}>
                        Health Check URL
                      </Typography>
                      <Box sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1, fontFamily: 'monospace', fontSize: '0.875rem', wordBreak: 'break-all' }}>
                        {currentConfig.health_url}
                      </Box>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.secondary', mb: 0.5 }}>
                        OAuth Token URL
                      </Typography>
                      <Box sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1, fontFamily: 'monospace', fontSize: '0.875rem', wordBreak: 'break-all' }}>
                        {currentConfig.access_token_url}
                      </Box>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.secondary', mb: 0.5 }}>
                        Client ID
                      </Typography>
                      <Box sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1, fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        {currentConfig.client_id || 'Not configured'}
                      </Box>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.secondary', mb: 0.5 }}>
                        Scope
                      </Typography>
                      <Box sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1, fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        {currentConfig.scope}
                      </Box>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.secondary', mb: 0.5 }}>
                        Client Secret
                      </Typography>
                      <Box sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1, fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        🔒 Configured server-side
                      </Box>
                      <Typography variant="caption" sx={{ mt: 0.5, color: 'text.secondary' }}>
                        Client secrets are managed securely via environment variables
                      </Typography>
                    </Box>
                  </Box>

                  {/* Proxy Client Selection */}
                  <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <Autocomplete
                        value={proxyClients.find(c => c.clientId === selectedProxyClient) || null}
                        onChange={(event, newValue) => {
                          setSelectedProxyClient(newValue?.clientId || 'primary');
                        }}
                        options={proxyClients}
                        getOptionLabel={(option) => `${option.name} (${option.clientId})`}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Proxy Client"
                            variant="outlined"
                          />
                        )}
                        renderOption={(props, option) => {
                          const { key, ...otherProps } = props;
                          return (
                            <Box component="li" key={key} {...otherProps}>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                  {option.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                                  {option.clientId}
                                </Typography>
                              </Box>
                            </Box>
                          );
                        }}
                      />
                      <Typography variant="caption" sx={{ mt: 0.5, color: 'text.secondary' }}>
                        Select which client to proxy API requests as. This sets the proxy-client header.
                      </Typography>
                    </FormControl>

                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
                        ℹ️ Current Proxy Configuration
                      </Typography>
                      <Typography variant="body2" component="div">
                        <strong>Proxy Client ID:</strong> <Chip label={selectedProxyClient} size="small" sx={{ ml: 1, fontFamily: 'monospace' }} />
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        <strong>Client Name:</strong> {proxyClients.find(c => c.clientId === selectedProxyClient)?.name || 'Unknown'}
                      </Typography>
                      <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>
                        All GraphQL requests will include header: <code>proxy-client: {selectedProxyClient}</code>
                      </Typography>
                    </Alert>
                  </Box>
                </Paper>
              )}

              {/* Request Settings */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h2" sx={{ mb: 3 }}>
                  Request Settings
                </Typography>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                  <TextField
                    label="Request Timeout (seconds)"
                    type="number"
                    value={settings.requestTimeout}
                    onChange={(e) => setSettings({...settings, requestTimeout: parseInt(e.target.value)})}
                    inputProps={{ min: 5, max: 120 }}
                    helperText="Maximum time to wait for API response"
                    fullWidth
                  />
                  
                  <TextField
                    label="Max Retries"
                    type="number"
                    value={settings.maxRetries}
                    onChange={(e) => setSettings({...settings, maxRetries: parseInt(e.target.value)})}
                    inputProps={{ min: 0, max: 10 }}
                    helperText="Number of retry attempts for failed requests"
                    fullWidth
                  />
                </Box>
              </Paper>

              {/* Logging Settings */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h2" sx={{ mb: 3 }}>
                  Logging Settings
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      id="enableLogging"
                      checked={settings.enableLogging}
                      onChange={(e) => setSettings({...settings, enableLogging: e.target.checked})}
                      style={{ marginRight: 8 }}
                    />
                    <Typography variant="body2">
                      Enable Request/Response Logging
                    </Typography>
                  </Box>
                  
                  {settings.enableLogging && (
                    <Box sx={{ ml: 3 }}>
                      <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel id="log-level-label">Log Level</InputLabel>
                        <Select
                          labelId="log-level-label"
                          value={settings.logLevel}
                          label="Log Level"
                          onChange={(e) => setSettings({...settings, logLevel: e.target.value})}
                        >
                          <MenuItem value="error">Error</MenuItem>
                          <MenuItem value="warn">Warning</MenuItem>
                          <MenuItem value="info">Info</MenuItem>
                          <MenuItem value="debug">Debug</MenuItem>
                        </Select>
                        <Typography variant="caption" sx={{ mt: 0.5, color: 'text.secondary' }}>
                          Minimum level for logged messages
                        </Typography>
                      </FormControl>
                    </Box>
                  )}
                </Box>
              </Paper>

              {/* Environment Quick Switch */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h2" sx={{ mb: 3 }}>
                  Quick Environment Switch
                </Typography>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                  {environmentOptions.map((env) => (
                    <Paper
                      key={env.key}
                      variant={selectedEnvKey === env.key ? "elevation" : "outlined"}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        border: selectedEnvKey === env.key ? '2px solid' : '1px solid',
                        borderColor: selectedEnvKey === env.key ? 'primary.main' : 'divider',
                        bgcolor: selectedEnvKey === env.key ? 'primary.50' : 'background.paper',
                        '&:hover': {
                          bgcolor: selectedEnvKey === env.key ? 'primary.50' : 'grey.50'
                        }
                      }}
                      onClick={() => setSelectedEnvKey(env.key)}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                        {env.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        {ENVIRONMENTS[env.key].domain}
                      </Typography>
                      {selectedEnvKey === env.key && (
                        <Chip 
                          label="Active" 
                          size="small" 
                          color="primary" 
                          sx={{ mt: 1 }}
                        />
                      )}
                    </Paper>
                  ))}
                </Box>
              </Paper>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleReset}
                  sx={{ px: 3, py: 1 }}
                >
                  Reset to Defaults
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  sx={{ px: 3, py: 1 }}
                >
                  Save Settings
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      );
    }
