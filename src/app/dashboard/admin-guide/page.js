'use client';

import { useState } from 'react';
import { Box, Typography, Tabs, Tab, Paper } from '@mui/material';
import UserGuide from '@/components/admin-guide/UserGuide';
import OrganizerGuide from '@/components/admin-guide/OrganizerGuide';
import VenueGuide from '@/components/admin-guide/VenueGuide';
import EventGuide from '@/components/admin-guide/EventGuide';
import GeoHierarchyGuide from '@/components/admin-guide/GeoHierarchyGuide';
import StatusGuide from '@/components/admin-guide/StatusGuide';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-guide-tabpanel-${index}`}
      aria-labelledby={`admin-guide-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AdminGuidePage() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Admin Guide
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
        This guide explains the data models, relationships, and important concepts for managing the calendar system.
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="admin guide tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Users" />
          <Tab label="Organizers" />
          <Tab label="Venues" />
          <Tab label="Geo Hierarchy" />
          <Tab label="Events" />
          <Tab label="Status" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <UserGuide />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <OrganizerGuide />
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <VenueGuide />
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <GeoHierarchyGuide />
        </TabPanel>
        
        <TabPanel value={tabValue} index={4}>
          <EventGuide />
        </TabPanel>
        
        <TabPanel value={tabValue} index={5}>
          <StatusGuide />
        </TabPanel>
      </Paper>
    </Box>
  );
}