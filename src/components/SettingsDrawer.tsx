/**
 * Settings Drawer Component
 * Slide-out drawer for managing environment and proxy client settings
 */

'use client';

import { useState, useEffect } from 'react';
import { getEnvironmentConfig } from '@/lib/environments';
import {
  Drawer,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Toolbar,
  IconButton,
  Tooltip,
  Alert,
  Paper,
  Chip
} from '@mui/material';
import {
  Close,
  Settings,
  CloudQueue,
  Public,
  Refresh
} from '@mui/icons-material';

interface Environment {
  key: string;
  name: string;
}

interface ProxyClient {
  clientId: string;
  name: string;
}

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  selectedEnvironment: string;
  onEnvironmentChange: (environment: string) => void;
  selectedProxyClient: string;
  onProxyClientChange: (client: string) => void;
  environmentOptions: Environment[];
  proxyClients: ProxyClient[];
  onRefreshSchema: () => void;
}

export default function SettingsDrawer({
  open,
  onClose,
  selectedEnvironment,
  onEnvironmentChange,
  selectedProxyClient,
  onProxyClientChange,
  environmentOptions,
  proxyClients,
  onRefreshSchema
}: SettingsDrawerProps) {
  const [localSelectedEnvironment, setLocalSelectedEnvironment] = useState(selectedEnvironment);
  const [localSelectedProxyClient, setLocalSelectedProxyClient] = useState(selectedProxyClient);

  // Update local state when props change
  useEffect(() => {
    setLocalSelectedEnvironment(selectedEnvironment);
    setLocalSelectedProxyClient(selectedProxyClient);
  }, [selectedEnvironment, selectedProxyClient]);

  const handleEnvironmentChange = (value: string) => {
    setLocalSelectedEnvironment(value);
    onEnvironmentChange(value);
  };

  const handleProxyClientChange = (value: string) => {
    setLocalSelectedProxyClient(value);
    onProxyClientChange(value);
  };

  const isProxyClientVisible = !localSelectedEnvironment.includes('mogs');

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 400,
          maxWidth: '90vw',
        },
      }}
    >
      <Toolbar 
        sx={{ 
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          position: 'sticky',
          top: 0,
          zIndex: 1100
        }}
      >
        <Settings sx={{ mr: 2, color: 'primary.main' }} />
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
          API Settings
        </Typography>
        <Tooltip title="Close settings">
          <IconButton 
            onClick={onClose}
            size="small"
            sx={{ 
              color: 'text.secondary',
              '&:hover': { backgroundColor: 'action.hover' }
            }}
          >
            <Close />
          </IconButton>
        </Tooltip>
      </Toolbar>

      <Box sx={{ p: 3 }}>
        {/* Environment Section */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 3, 
            backgroundColor: 'grey.50',
            border: '1px solid',
            borderColor: 'grey.200'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CloudQueue sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Environment
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select the API environment to connect to for GraphQL operations.
          </Typography>

          <FormControl fullWidth size="medium">
            <InputLabel id="settings-environment-select-label">Environment</InputLabel>
            <Select
              labelId="settings-environment-select-label"
              value={localSelectedEnvironment}
              label="Environment"
              onChange={(e) => handleEnvironmentChange(e.target.value)}
              sx={{
                backgroundColor: 'white',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'grey.300',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'grey.400',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                }
              }}
            >
              {environmentOptions.map(env => (
                <MenuItem key={env.key} value={env.key}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {env.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                        {getEnvironmentConfig(env.key)?.graph_url || env.key}
                      </Typography>
                    </Box>
                    <Chip 
                      size="small"
                      label={env.key.includes('mogs') ? 'MOGS' : 'MGQL'}
                      color={env.key.includes('mogs') ? 'secondary' : 'primary'}
                      sx={{ ml: 1 }}
                    />
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Environment Info */}
          {localSelectedEnvironment && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Connected to: <strong>{environmentOptions.find(env => env.key === localSelectedEnvironment)?.name}</strong>
              </Typography>
            </Alert>
          )}
        </Paper>

        {/* Proxy Client Section - Only for MGQL environments */}
        {isProxyClientVisible && (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              mb: 3, 
              backgroundColor: 'grey.50',
              border: '1px solid',
              borderColor: 'grey.200'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Public sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Proxy Client
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select the proxy client to use for MGQL API requests.
            </Typography>

            <FormControl fullWidth size="medium">
              <InputLabel id="settings-proxy-client-select-label">Proxy Client</InputLabel>
              <Select
                labelId="settings-proxy-client-select-label"
                value={localSelectedProxyClient}
                label="Proxy Client"
                onChange={(e) => handleProxyClientChange(e.target.value)}
                sx={{
                  backgroundColor: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'grey.300',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'grey.400',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  }
                }}
              >
                {proxyClients.map(client => (
                  <MenuItem key={client.clientId} value={client.clientId}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {client.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                        {client.clientId}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Proxy Client Info */}
            {localSelectedProxyClient && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Using proxy: <strong>{proxyClients.find(client => client.clientId === localSelectedProxyClient)?.name}</strong>
                </Typography>
              </Alert>
            )}
          </Paper>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Actions Section */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            backgroundColor: 'grey.50',
            border: '1px solid',
            borderColor: 'grey.200'
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Actions
          </Typography>
          
          <Tooltip title="Refresh GraphQL schema from the selected environment">
            <Box 
              onClick={onRefreshSchema}
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: 2,
                backgroundColor: 'white',
                border: '1px solid',
                borderColor: 'grey.300',
                borderRadius: 1,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: 'grey.50',
                  borderColor: 'primary.main',
                }
              }}
            >
              <Refresh sx={{ mr: 2, color: 'primary.main' }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Refresh Schema
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Update the GraphQL schema from the current environment
                </Typography>
              </Box>
            </Box>
          </Tooltip>
        </Paper>
      </Box>
    </Drawer>
  );
}
