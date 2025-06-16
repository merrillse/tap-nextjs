import { Box, CircularProgress } from '@mui/material';
import dynamic from 'next/dynamic';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS } from '@/lib/environments';
import { INTROSPECTION_QUERY } from '@/lib/random-query-generator';

// Dynamically import the client component to avoid SSR issues
const SchemaVisualizerClient = dynamic(
  () => import('@/components/SchemaVisualizerClient'),
  {
    ssr: false,
    loading: () => (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    )
  }
);

export default function SchemaVisualizerPage() {
  return (
    <SchemaVisualizerClient 
      selectedEnvironment="mis-gql-stage"
      onEnvironmentChange={() => {}}
      environments={ENVIRONMENTS}
      apiClient={ApiClient}
      introspectionQuery={INTROSPECTION_QUERY}
    />
  );
}
