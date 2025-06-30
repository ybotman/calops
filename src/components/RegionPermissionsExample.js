import React, { useState } from 'react';
import { Button, Box } from '@mui/material';
import RegionPermissionsModal from './RegionPermissionsModal';

// Example of how to use the RegionPermissionsModal in a user management page
export default function RegionPermissionsExample() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAdminMode, setIsAdminMode] = useState(false);

  // Example user data - in real app this would come from API
  const exampleUser = {
    _id: '507f1f77bcf86cd799439011',
    firebaseUid: 'abc123',
    firebaseUserInfo: {
      email: 'user@example.com',
      displayName: 'John Doe'
    },
    roles: ['NamedUser', 'RegionalOrganizer'],
    regionalOrganizerInfo: {
      organizerId: '507f1f77bcf86cd799439012',
      isApproved: true,
      isEnabled: true,
      isActive: true,
      allowedMasteredRegionIds: ['60a1234567890abcdef12345']
    },
    localAdminInfo: {
      isApproved: false,
      isEnabled: false,
      isActive: false,
      allowedAdminMasteredRegionIds: []
    }
  };

  const handleOpenModal = (user, adminMode = false) => {
    setSelectedUser(user);
    setIsAdminMode(adminMode);
    setModalOpen(true);
  };

  const handleUpdateUser = (updatedUser) => {
    console.log('Updated user:', updatedUser);
    // In real app: call API to save updated user
    // Then refresh user list or update state
  };

  return (
    <Box p={3}>
      <h2>Region Permissions Example</h2>
      
      <Box display="flex" gap={2} mb={3}>
        <Button 
          variant="contained" 
          onClick={() => handleOpenModal(exampleUser, false)}
        >
          Edit Organizer Regions
        </Button>
        
        <Button 
          variant="contained" 
          color="secondary"
          onClick={() => handleOpenModal(exampleUser, true)}
        >
          Edit Admin Regions
        </Button>
      </Box>

      <RegionPermissionsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        userLogin={selectedUser}
        onUpdate={handleUpdateUser}
        isAdmin={isAdminMode}
      />

      <Box mt={4}>
        <h3>Integration Instructions:</h3>
        <ol>
          <li>Import the RegionPermissionsModal component</li>
          <li>Pass the user object with the current permissions</li>
          <li>Set isAdmin=true for admin permissions, false for organizer</li>
          <li>Handle the onUpdate callback to save changes</li>
        </ol>
        
        <h3>Usage in User List/Table:</h3>
        <pre>{`
// In your user management component:
import RegionPermissionsModal from '@/components/RegionPermissionsModal';

// In your user table actions:
<IconButton onClick={() => handleEditRegions(user)}>
  <EditLocationIcon />
</IconButton>

// Handler function:
const handleEditRegions = (user) => {
  setSelectedUser(user);
  setModalOpen(true);
};
        `}</pre>
      </Box>
    </Box>
  );
}