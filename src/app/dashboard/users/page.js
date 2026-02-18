'use client';

import React from 'react';
import { Box } from '@mui/material';
import UsersPageContainer from '@/components/users/UsersPageContainer';

/**
 * Users Page (dashboard/users)
 * Entry point for the users management page in the dashboard
 */
export default function Page() {
  return (
    <Box>
      <UsersPageContainer />
    </Box>
  );
}