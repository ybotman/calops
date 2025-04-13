'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Automatically redirect to dashboard without authentication check
    router.push('/dashboard');
  }, [router]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: 3,
      }}
    >
      <Paper
        sx={{
          padding: 4,
          maxWidth: 600,
          textAlign: 'center',
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <Typography variant="h3" gutterBottom>
          Calendar Admin
        </Typography>
        <Typography variant="subtitle1" sx={{ mb: 4 }}>
          Manage users, locations, organizers, and applications
        </Typography>
        
        <Button
          variant="contained"
          size="large"
          onClick={() => router.push('/dashboard')}
          sx={{ mb: 2 }}
        >
          Go to Dashboard
        </Button>
        
        <Typography variant="body2" sx={{ mt: 4, color: 'text.secondary' }}>
          Version 1.0.0 | © {new Date().getFullYear()} Calendar Admin
        </Typography>
      </Paper>
    </Box>
  );
}