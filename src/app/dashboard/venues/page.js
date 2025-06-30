'use client';

import React from 'react';
import { Container } from '@mui/material';
import VenuesPageContainer from '@/components/venues/VenuesPageContainer';

/**
 * Venues Page (dashboard/venues)
 * Entry point for the venues management page in the dashboard
 */
export default function Page() {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <VenuesPageContainer />
    </Container>
  );
}