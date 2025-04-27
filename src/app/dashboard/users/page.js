'use client';

import React from 'react';
import { Container } from '@mui/material';
import UsersPageContainer from '@/components/users/UsersPageContainer';

/**
 * Users Page (dashboard/users)
 * Entry point for the users management page in the dashboard
 */
export default function Page() {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <UsersPageContainer />
    </Container>
  );
}