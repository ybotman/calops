'use client';

import React from 'react';
import { Container } from '@mui/material';
import LogsPageContainer from '@/components/logs/LogsPageContainer';

/**
 * Logs Page (dashboard/logs)
 * Entry point for the logs viewer page in the dashboard
 */
export default function Page() {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <LogsPageContainer />
    </Container>
  );
}