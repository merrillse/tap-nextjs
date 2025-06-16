'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, CircularProgress } from '@mui/material';

export default function SchemaBrowserRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the API testing page with a brief delay
    const timer = setTimeout(() => {
      router.push('/api-testing');
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
        gap: 3
      }}
    >
      <CircularProgress size={60} />
      <Typography variant="h5" gutterBottom>
        Schema Browser Moved
      </Typography>
      <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ maxWidth: 400 }}>
        The Schema Browser is now integrated into the GraphQL Testing page as a slide-out drawer.
        Redirecting you to the new location...
      </Typography>
    </Box>
  );
}
