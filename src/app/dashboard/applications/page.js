'use client';

import React from 'react';
import { Container } from '@mui/material';
import ApplicationsPageContainer from '@/components/applications/ApplicationsPageContainer';

/**
 * Applications page component for dashboard
 * Follows the same pattern as other refactored pages
 */
export default function Page() {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <ApplicationsPageContainer />
    </Container>
  );
}