'use client';

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';

// Import components
import UserHeader from './components/UserHeader';
import UserTabNavigationBar from './components/UserTabNavigationBar';
import UserTable from './components/UserTable';
import FirebaseUsersTable from './components/FirebaseUsersTable';
import AddUserDialog from './components/AddUserDialog';
import EditUserDialog from './components/EditUserDialog';
import TabPanel from '@/components/common/TabPanel';
import useFirebaseUsers from './hooks/useFirebaseUsers';

/**
 * UsersPage component
 * Main presentation component for user management
 */
const UsersPage = ({
  // Data
  users,
  filteredUsers,
  roles,
  loading = false,
  error = null,
  
  // Filters
  searchTerm,
  setSearchTerm,
  tabValue,
  setTabValue,
  
  // User operations
  createUser,
  updateUser,
  deleteUser,
  
  // Organizer operations
  createOrganizer,
  deleteOrganizer,
  
  // Other
  pagination = {
    page: 0,
    pageSize: 10,
    totalCount: 0
  },
  setPagination,
  selectedUser,
  organizerLoading = false
}) => {
  // Local state for dialogs
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Firebase users hook - only fetch when Firebase tab is active
  const firebaseUsersHook = useFirebaseUsers({
    autoFetch: tabValue === 3 // Only auto-fetch when Firebase tab is active
  });
  
  // Handlers
  const handleAddUser = () => setAddDialogOpen(true);
  
  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditDialogOpen(true);
  };
  
  const handleAddUserSubmit = async (userData) => {
    try {
      const newUser = await createUser({
        email: userData.email,
        password: userData.password,
        localUserInfo: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          isApproved: true,
          isEnabled: true,
          isActive: true
        },
        active: userData.active,
        isOrganizer: userData.isOrganizer
      });
      
      setAddDialogOpen(false);
      return newUser;
    } catch (err) {
      console.error('Error creating user:', err);
      throw err;
    }
  };
  
  const handleUpdateUser = async (userData) => {
    try {
      const updatedUser = await updateUser(userData);
      setEditDialogOpen(false);
      return updatedUser;
    } catch (err) {
      console.error('Error updating user:', err);
      throw err;
    }
  };
  
  const handlePaginationChange = (page, pageSize) => {
    setPagination({
      page,
      pageSize
    });
  };

  // Firebase handlers
  const handleFirebaseViewDetails = (firebaseUser) => {
    console.log('View Firebase user details:', firebaseUser);
    // TODO: Implement Firebase user details dialog
  };

  const handleCreateUserLogin = (firebaseUser) => {
    console.log('Create UserLogin for Firebase user:', firebaseUser);
    // TODO: Implement UserLogin creation for unmatched Firebase users
  };

  // Fetch Firebase users when switching to Firebase tab
  const handleTabChange = (newTabValue) => {
    setTabValue(newTabValue);
    
    // Fetch Firebase users when switching to Firebase tab (index 3)
    if (newTabValue === 3 && !firebaseUsersHook.lastUpdated) {
      firebaseUsersHook.fetchFirebaseUsers();
    }
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <UserHeader 
        onAddUser={handleAddUser}
        title="User Management" 
      />
      
      <UserTabNavigationBar
        value={tabValue}
        onChange={handleTabChange}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      
      <TabPanel value={tabValue} index={0}>
        <UserTable
          users={filteredUsers}
          loading={loading}
          onEdit={handleEditUser}
          onDelete={deleteUser}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          error={error}
          selectedUser={selectedUser}
        />
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <UserTable
          users={filteredUsers}
          loading={loading || organizerLoading}
          onEdit={handleEditUser}
          onDelete={deleteUser}
          onCreateOrganizer={createOrganizer}
          onDeleteOrganizer={deleteOrganizer}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          error={error}
          selectedUser={selectedUser}
        />
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <UserTable
          users={filteredUsers}
          loading={loading}
          onEdit={handleEditUser}
          onDelete={deleteUser}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          error={error}
          selectedUser={selectedUser}
        />
      </TabPanel>
      
      <TabPanel value={tabValue} index={3}>
        <FirebaseUsersTable
          firebaseUsers={firebaseUsersHook.firebaseUsers}
          stats={firebaseUsersHook.stats}
          loading={firebaseUsersHook.loading}
          error={firebaseUsersHook.error}
          onRefresh={firebaseUsersHook.refresh}
          onViewDetails={handleFirebaseViewDetails}
          onCreateUserLogin={handleCreateUserLogin}
          filter="all"
        />
      </TabPanel>
      
      <AddUserDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSubmit={handleAddUserSubmit}
        loading={loading}
      />
      
      <EditUserDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        user={editingUser}
        roles={roles}
        onSubmit={handleUpdateUser}
        loading={loading}
      />
    </Box>
  );
};

UsersPage.propTypes = {
  // Data
  users: PropTypes.array.isRequired,
  filteredUsers: PropTypes.array.isRequired,
  roles: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  
  // Filters
  searchTerm: PropTypes.string.isRequired,
  setSearchTerm: PropTypes.func.isRequired,
  tabValue: PropTypes.number.isRequired,
  setTabValue: PropTypes.func.isRequired,
  
  // User operations
  createUser: PropTypes.func.isRequired,
  updateUser: PropTypes.func.isRequired,
  deleteUser: PropTypes.func.isRequired,
  
  // Organizer operations
  createOrganizer: PropTypes.func,
  deleteOrganizer: PropTypes.func,
  
  // Other
  pagination: PropTypes.shape({
    page: PropTypes.number,
    pageSize: PropTypes.number,
    totalCount: PropTypes.number
  }),
  setPagination: PropTypes.func.isRequired,
  selectedUser: PropTypes.object,
  organizerLoading: PropTypes.bool
};


export default UsersPage;