'use client';

import React from 'react';
import UsersPage from './UsersPage';
import { 
  useUsers, 
  useRoles, 
  useOrganizerActions 
} from './hooks';

/**
 * UsersPageContainer component
 * Container component that manages state and data fetching for the UsersPage
 */
const UsersPageContainer = () => {
  // Use the hooks to fetch and manage data
  const usersHook = useUsers();
  
  const { 
    roles, 
    loading: rolesLoading 
  } = useRoles();
  
  const organizerActions = useOrganizerActions({
    refreshUsers: usersHook.fetchUsers,
    onSuccess: (action) => {
      console.log(`Organizer action ${action} completed successfully`);
    }
  });

  // Loading state is true if any data is loading
  const loading = usersHook.loading || rolesLoading;
  
  // Combine props for the presentation component
  const props = {
    // User data
    users: usersHook.users,
    filteredUsers: usersHook.filteredUsers,
    roles,
    loading,
    error: usersHook.error,
    
    // Filters
    searchTerm: usersHook.searchTerm,
    setSearchTerm: usersHook.setSearchTerm,
    tabValue: usersHook.tabValue,
    setTabValue: usersHook.setTabValue,
    
    // User operations
    createUser: usersHook.createUser,
    updateUser: usersHook.updateUser,
    deleteUser: usersHook.deleteUser,
    
    // Organizer operations
    createOrganizer: organizerActions.createOrganizer,
    deleteOrganizer: organizerActions.deleteOrganizer,
    
    // Other
    pagination: usersHook.pagination,
    setPagination: usersHook.setPagination,
    selectedUser: organizerActions.selectedUser,
    organizerLoading: organizerActions.loading
  };

  return <UsersPage {...props} />;
};

export default UsersPageContainer;