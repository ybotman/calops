'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Grid,
  FormControlLabel,
  Switch,
  Divider,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/Add';
import LinkIcon from '@mui/icons-material/Link';
import DeleteIcon from '@mui/icons-material/Delete';
import UserEditForm from '@/components/users/UserEditForm';
import { usersApi, rolesApi } from '@/lib/api-client';
import axios from 'axios';

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function UsersPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [appId, setAppId] = useState('1'); // Default to TangoTiempo
  const [editingUser, setEditingUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [roles, setRoles] = useState([]);
  const [creatingOrganizer, setCreatingOrganizer] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    active: true,
    isOrganizer: false,
  });

  // Function to refresh users
  const refreshUsers = async () => {
    try {
      setLoading(true);
      
      // Use timestamp to force fresh data
      const timestamp = new Date().getTime();
      
      let usersData = [];
      
      try {
        // Fetch users directly from the backend with cache busting
        usersData = await usersApi.getUsers(appId, undefined, timestamp);
      } catch (fetchError) {
        console.error('Error fetching users from backend:', fetchError);
        
        // If we're in development mode, provide fallback demo data
        if (process.env.NODE_ENV === 'development') {
          console.log('Using demo data since backend is unavailable');
          usersData = [
            {
              _id: "1",
              firebaseUserId: "demouser1",
              localUserInfo: { firstName: "John", lastName: "Demo" },
              active: true,
              roleIds: [{_id: "66cb85ac74dca51e34e268ef", roleName: "User"}],
              regionalOrganizerInfo: {}
            },
            {
              _id: "2",
              firebaseUserId: "demouser2",
              localUserInfo: { firstName: "Admin", lastName: "User" },
              active: true,
              roleIds: [{_id: "66cb85ac74dca51e34e268ec", roleName: "SystemAdmin"}],
              regionalOrganizerInfo: {}
            },
            {
              _id: "3",
              firebaseUserId: "demoorganizer",
              localUserInfo: { firstName: "Organizer", lastName: "Demo" },
              active: true,
              roleIds: [{_id: "66cb85ac74dca51e34e268ed", roleName: "RegionalOrganizer"}],
              regionalOrganizerInfo: { organizerId: "123", isActive: true, isApproved: true, isEnabled: true }
            }
          ];
        } else {
          // In production, rethrow to show proper error
          throw fetchError;
        }
      }
      
      // Process users data to add display name and computed fields
      const processedUsers = usersData.map(user => ({
        ...user,
        id: user._id, // For DataGrid key
        displayName: `${user.localUserInfo?.firstName || ''} ${user.localUserInfo?.lastName || ''}`.trim() || 'Unnamed User',
        email: user.firebaseUserInfo?.email || 'No email',
        roleNames: (user.roleIds || [])
          .map(role => typeof role === 'object' ? role.roleName : 'Unknown')
          .join(', '),
        isActive: user.active ? 'Active' : 'Inactive',
        isOrganizer: user.regionalOrganizerInfo?.organizerId ? 'Yes' : 'No',
        tempFirebaseId: user.firebaseUserId || '',
      }));
      
      setUsers(processedUsers);
      setFilteredUsers(processedUsers);
      setLoading(false);
      
      // Set a short timeout to reapply filters (sometimes needed for UI refresh)
      setTimeout(() => {
        setFilteredUsers(prev => [...prev]); // Force re-render
      }, 100);
      
      return processedUsers; // Return for chaining
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
      
      // In development mode, just log the error
      if (process.env.NODE_ENV === 'development') {
        console.error(`Failed to fetch users: ${error.message}`);
      } else {
        // In production, show alert
        alert(`Failed to fetch users: ${error.message}`);
      }
      
      throw error; // Rethrow for the caller to handle
    }
  };

  // Fetch users and roles on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch roles first - with hardcoded fallback if backend is unreachable
        const rolesData = await rolesApi.getRoles(appId);
        setRoles(rolesData || []);
        
        // Then refresh users
        try {
          await refreshUsers();
        } catch (userError) {
          console.error('Error fetching users:', userError);
          setLoading(false);
          
          // Set empty users array instead of showing an error
          // This prevents the UI from crashing
          setUsers([]);
          setFilteredUsers([]);
          
          // Show a warning but don't block the UI
          console.warn('Using demo data because backend is unavailable');
        }
      } catch (error) {
        console.error('Error initializing data:', error);
        setLoading(false);
        
        // Show a more helpful message
        if (error.code === 'ERR_NETWORK') {
          alert(`Backend server appears to be offline. Some functionality will be limited.`);
        } else {
          alert(`Failed to fetch data: ${error.message}`);
        }
      } finally {
        // Always make sure loading is false
        setLoading(false);
      }
    };

    fetchData();
  }, [appId]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    
    // Filter users based on tab
    if (newValue === 0) { // All Users
      filterUsers(searchTerm);
    } else if (newValue === 1) { // Organizers
      const organizerUsers = users.filter(user => user.regionalOrganizerInfo?.organizerId);
      applySearch(organizerUsers, searchTerm);
    } else if (newValue === 2) { // Admins
      const adminUsers = users.filter(user => 
        user.roleIds?.some(role => 
          (typeof role === 'object' && 
           (role.roleName === 'SystemAdmin' || role.roleName === 'RegionalAdmin'))
        )
      );
      applySearch(adminUsers, searchTerm);
    } else if (newValue === 3) { // Temp Users
      const tempUsers = users.filter(user => 
        user.firebaseUserId?.startsWith('temp_')
      );
      applySearch(tempUsers, searchTerm);
    }
  };

  // Handle search input change
  const handleSearchChange = (event) => {
    const term = event.target.value;
    setSearchTerm(term);
    filterUsers(term);
  };

  // Filter users based on search term and current tab
  const filterUsers = (term) => {
    let filtered = users;
    
    // Apply tab filtering
    if (tabValue === 1) { // Organizers
      filtered = filtered.filter(user => user.regionalOrganizerInfo?.organizerId);
    } else if (tabValue === 2) { // Admins
      filtered = filtered.filter(user => 
        user.roleIds?.some(role => 
          (typeof role === 'object' && 
           (role.roleName === 'SystemAdmin' || role.roleName === 'RegionalAdmin'))
        )
      );
    } else if (tabValue === 3) { // Temp Users
      filtered = filtered.filter(user => 
        user.firebaseUserId?.startsWith('temp_')
      );
    }
    
    // Apply search term filtering
    applySearch(filtered, term);
  };

  // Apply search filter to the provided list
  const applySearch = (userList, term) => {
    if (!term) {
      setFilteredUsers(userList);
      return;
    }
    
    const lowerTerm = term.toLowerCase();
    const filtered = userList.filter(user =>
      (user.displayName.toLowerCase().includes(lowerTerm)) ||
      (user.email.toLowerCase().includes(lowerTerm)) ||
      (user.roleNames.toLowerCase().includes(lowerTerm)) ||
      (user.firebaseUserId.toLowerCase().includes(lowerTerm))
    );
    
    setFilteredUsers(filtered);
  };

  // Handle edit user button click
  const handleEditUser = (user) => {
    setEditingUser(user);
    setDialogOpen(true);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingUser(null);
  };

  // Handle user update
  const handleUpdateUser = async (updatedUser) => {
    try {
      setLoading(true);
      
      // Extract role IDs from the updatedUser object
      const roleIds = [...updatedUser.roleIds];
      
      // First update general user information (without roleIds to prevent issues)
      const userUpdateData = {
        firebaseUserId: updatedUser.firebaseUserId,
        appId: updatedUser.appId || appId,
        active: updatedUser.active,
        localUserInfo: updatedUser.localUserInfo,
        regionalOrganizerInfo: updatedUser.regionalOrganizerInfo,
        localAdminInfo: updatedUser.localAdminInfo
      };
      
      console.log('Updating user data:', userUpdateData);
      
      // Update user basic information directly to the backend
      await usersApi.updateUser(userUpdateData);
      
      // Update user roles separately directly to the backend
      console.log('Updating user roles:', roleIds);
      await usersApi.updateUserRoles(updatedUser.firebaseUserId, roleIds, appId);
      
      // Refresh the users list
      await refreshUsers();
      filterUsers(searchTerm);
      setDialogOpen(false);
      setEditingUser(null);
      setLoading(false);
      
      // No success message needed
    } catch (error) {
      console.error('Error updating user:', error);
      alert(`Error updating user: ${error.message}`);
      setLoading(false);
    }
  };

  // Handle quick create organizer
  const handleQuickCreateOrganizer = async (user) => {
    try {
      setSelectedUser(user);
      setCreatingOrganizer(true);
      
      // Check if this user has a valid firebase ID (check if it's not a temp ID)
      const isFirebaseUser = !user.firebaseUserId.startsWith('temp_');
      
      // Use the existing user's Firebase ID if available
      const fullName = `${user.localUserInfo?.firstName || ''} ${user.localUserInfo?.lastName || ''}`.trim() || 'Unnamed Organizer';
      const shortName = user.localUserInfo?.firstName || 'Unnamed';
      
      const organizerData = {
        firebaseUserId: user.firebaseUserId,
        linkedUserLogin: user._id,
        appId: user.appId || '1',
        fullName: fullName,
        name: fullName, // Add name as well to ensure it's displayed in lists
        shortName: shortName,
        organizerRegion: "66c4d99042ec462ea22484bd", // US region default
        isActive: true,
        isEnabled: true,
        wantRender: true,
        organizerTypes: {
          isEventOrganizer: true,
          isVenue: false,
          isTeacher: false,
          isMaestro: false,
          isDJ: false,
          isOrchestra: false
        }
      };
      
      // Create the organizer
      const response = await axios.post(`/api/organizers`, organizerData);
      
      console.log("Organizer created:", response.data);
      
      // Update user to include organizerId reference and organizer role
      const userUpdateData = {
        firebaseUserId: user.firebaseUserId,
        appId: user.appId || '1',
        regionalOrganizerInfo: {
          ...user.regionalOrganizerInfo,
          organizerId: response.data.organizer._id || response.data._id,
          isApproved: true,
          isEnabled: true,
          isActive: true
        }
      };
      
      // Update user
      await usersApi.updateUser(userUpdateData);
      
      // Find organizer role
      const organizerRole = roles.find(role => role.roleName === 'RegionalOrganizer');
      if (organizerRole) {
        const roleIds = [...(user.roleIds || [])];
        const roleObjectIds = roleIds.map(role => 
          typeof role === 'object' ? role._id : role
        );
        
        // Add organizer role if not already present
        if (!roleObjectIds.includes(organizerRole._id)) {
          roleObjectIds.push(organizerRole._id);
          await usersApi.updateUserRoles(user.firebaseUserId, roleObjectIds, user.appId || '1');
        }
      }
      
      // Set a delay to ensure backend updates are processed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Force a full refresh of the user data with an anti-cache parameter
      const timestamp = new Date().getTime();
      const refreshedUsers = await usersApi.getUsers(appId, undefined, timestamp);
      
      // Process users data
      const processedUsers = refreshedUsers.map(user => ({
        ...user,
        id: user._id,
        displayName: `${user.localUserInfo?.firstName || ''} ${user.localUserInfo?.lastName || ''}`.trim() || 'Unnamed User',
        email: user.firebaseUserInfo?.email || 'No email',
        roleNames: (user.roleIds || [])
          .map(role => typeof role === 'object' ? role.roleName : 'Unknown')
          .join(', '),
        isActive: user.active ? 'Active' : 'Inactive',
        isOrganizer: user.regionalOrganizerInfo?.organizerId ? 'Yes' : 'No',
        tempFirebaseId: user.firebaseUserId || '',
      }));
      
      setUsers(processedUsers);
      filterUsers(searchTerm);
    } catch (error) {
      console.error("Error creating organizer:", error);
      
      let errorMessage = 'Failed to create organizer';
      if (error.response && error.response.data) {
        errorMessage += `: ${error.response.data.message || JSON.stringify(error.response.data)}`;
      } else {
        errorMessage += `: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setCreatingOrganizer(false);
      setSelectedUser(null);
    }
  };

  // Handle delete organizer
  const handleDeleteOrganizer = async (user) => {
    try {
      if (!user.regionalOrganizerInfo?.organizerId) {
        alert('This user does not have an organizer to delete.');
        return;
      }

      // Get confirmation
      if (!window.confirm(`Are you sure you want to delete the organizer associated with ${user.displayName}?\nThis action cannot be undone.`)) {
        return;
      }

      setSelectedUser(user);
      setLoading(true);

      // First, disconnect the organizer from the user
      const userUpdateData = {
        firebaseUserId: user.firebaseUserId,
        appId: user.appId || '1',
        regionalOrganizerInfo: {
          ...user.regionalOrganizerInfo,
          organizerId: null, // Remove the organizer reference
          isApproved: false,
          isEnabled: false,
          isActive: false
        }
      };

      // Update user to remove organizer connection
      await usersApi.updateUser(userUpdateData);

      // Now delete the organizer
      let organizerId = user.regionalOrganizerInfo.organizerId;
      if (typeof organizerId === 'object') {
        // Handle the case where organizerId is an object with _id
        organizerId = organizerId._id;
      }

      // Delete the organizer
      await axios.delete(`${process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010'}/api/organizers/${organizerId}?appId=${user.appId || '1'}`);

      // Refresh users
      await refreshUsers();
      filterUsers(searchTerm);

      alert('Organizer deleted successfully!');
    } catch (error) {
      console.error("Error deleting organizer:", error);
      
      let errorMessage = 'Failed to delete organizer';
      if (error.response && error.response.data) {
        errorMessage += `: ${error.response.data.message || JSON.stringify(error.response.data)}`;
      } else {
        errorMessage += `: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
      setSelectedUser(null);
    }
  };
  
  // Handle delete user with proper organizer relationship cleanup
  const handleDeleteUser = async (user) => {
    try {
      // Get confirmation with clear warning
      const isTemp = user.firebaseUserId?.startsWith('temp_');
      let confirmMessage = `Are you sure you want to delete user "${user.displayName}"?`;
      
      if (isTemp) {
        confirmMessage += "\nThis is a temporary user created during import.";
      } else {
        confirmMessage += "\n\nWARNING: This will permanently remove this user and they will no longer be able to log in.";
      }
      
      // Check if user is linked to an organizer
      const hasOrganizer = user.regionalOrganizerInfo?.organizerId;
      if (hasOrganizer) {
        confirmMessage += "\n\nIMPORTANT: This user is linked to an organizer. The organizer will NOT be deleted, but will have its user connection removed.";
        confirmMessage += "\nThe organizer will need to be reassigned to another user or it will become inaccessible.";
      }
      
      confirmMessage += "\n\nThis action cannot be undone.";
      
      if (!window.confirm(confirmMessage)) {
        return;
      }

      setSelectedUser(user);
      setLoading(true);
      
      // If user has an organizer connection, first remove that connection to prevent orphaned references
      if (hasOrganizer) {
        try {
          console.log(`User has organizer connection. Updating organizer before deleting user...`);
          
          // Get the organizer ID (handling both string and object formats)
          const organizerId = typeof user.regionalOrganizerInfo.organizerId === 'object'
            ? user.regionalOrganizerInfo.organizerId._id
            : user.regionalOrganizerInfo.organizerId;
          
          // Update the organizer to remove user references
          await axios.patch(`/api/organizers/${organizerId}`, {
            firebaseUserId: null,
            linkedUserLogin: null,
            appId: user.appId || '1'
          });
          
          console.log(`Successfully disconnected user from organizer ${organizerId}`);
        } catch (organizerError) {
          console.error('Error disconnecting user from organizer:', organizerError);
          // Continue with user deletion even if organizer update fails
        }
      }

      // Delete the user
      await usersApi.deleteUser(user._id, user.appId || '1');

      // Refresh the user list
      await refreshUsers();
      filterUsers(searchTerm);

      alert('User deleted successfully!');
    } catch (error) {
      console.error("Error deleting user:", error);
      
      let errorMessage = 'Failed to delete user';
      if (error.response && error.response.data) {
        errorMessage += `: ${error.response.data.message || JSON.stringify(error.response.data)}`;
      } else {
        errorMessage += `: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
      setSelectedUser(null);
    }
  };
  
  // Handle delete all temporary users
  const handleDeleteAllTempUsers = async () => {
    try {
      // Find all temporary users
      const tempUsers = users.filter(user => 
        user.firebaseUserId?.startsWith('temp_')
      );
      
      if (tempUsers.length === 0) {
        alert('No temporary users found to delete.');
        return;
      }
      
      // Get confirmation
      const confirmMessage = `Are you sure you want to delete ALL ${tempUsers.length} temporary users?\n\nThis action cannot be undone.`;
      if (!window.confirm(confirmMessage)) {
        return;
      }
      
      setLoading(true);
      
      // Use our direct bulk deletion endpoint
      const result = await usersApi.deleteAllTempUsers(appId);
      
      // Refresh the user list
      await refreshUsers();
      filterUsers(searchTerm);
      
      // Show results
      if (result.success) {
        alert(`Successfully deleted ${result.message}`);
      } else {
        alert(`Error deleting temporary users: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error in bulk delete process:", error);
      alert(`Error in bulk delete process: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle create new user
  const handleCreateUser = async () => {
    try {
      // Basic validation - Just need email and names for direct backend creation
      if (!newUser.email || !newUser.firstName || !newUser.lastName) {
        alert('Please fill in all required fields (Email, First name, Last name)');
        return;
      }
      
      // Password validation only if we're using it
      if (newUser.password && newUser.password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
      }
      
      // Set loading state
      setLoading(true);
      
      // Log what we're attempting to do
      console.log(`Creating new user: ${newUser.email} (${newUser.firstName} ${newUser.lastName})`);
      
      // Confirm that the user understands temp users
      if (!newUser.password || newUser.password.length === 0) {
        const confirm = window.confirm("You are creating a temporary user without Firebase authentication. This user won't be able to log in. Continue?");
        if (!confirm) {
          setLoading(false);
          return;
        }
      }
      
      // 1. Create user - direct backend call
      try {
        // Create user data
        const userData = {
          email: newUser.email,
          password: newUser.password || '', // Password is optional, will create temp user if missing
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          appId: appId,
          active: newUser.active
        };
        
        // Make the API call directly to our backend
        console.log('Sending user data to API:', userData);
        const response = await axios.post('/api/users', userData);
        console.log('User created response:', response.data);
        
        if (!response.data) {
          throw new Error('No data returned from user creation API');
        }
        
        // Get the newly created user data 
        const createdUser = response.data;
        
        // If the user requested to create an organizer, do that now
        if (newUser.isOrganizer && createdUser.firebaseUserId) {
          try {
            // Prepare organizer data
            const organizerData = {
              firebaseUserId: createdUser.firebaseUserId,
              linkedUserLogin: createdUser._id,
              appId: appId,
              fullName: `${newUser.firstName} ${newUser.lastName}`.trim(),
              shortName: newUser.firstName,
              organizerRegion: "66c4d99042ec462ea22484bd", // US region default
              isActive: true,
              isEnabled: true,
              wantRender: true,
              organizerTypes: {
                isEventOrganizer: true,
                isVenue: false,
                isTeacher: false,
                isMaestro: false,
                isDJ: false,
                isOrchestra: false
              }
            };
            
            console.log('Creating organizer for new user with data:', organizerData);
            
            // Create the organizer
            const organizerResponse = await axios.post('/api/organizers', organizerData);
            console.log("Organizer created:", organizerResponse.data);
            
            // Update user to include organizerId reference
            const userUpdateData = {
              firebaseUserId: createdUser.firebaseUserId,
              appId: appId,
              regionalOrganizerInfo: {
                organizerId: organizerResponse.data._id,
                isApproved: true,
                isEnabled: true,
                isActive: true
              }
            };
            
            // Update user with organizer reference
            await usersApi.updateUser(userUpdateData);
            
            // Add organizer role to the user
            const organizerRole = roles.find(role => role.roleName === 'RegionalOrganizer');
            if (organizerRole) {
              await usersApi.updateUserRoles(createdUser.firebaseUserId, [organizerRole._id], appId);
            }
          } catch (organizerError) {
            console.error("Error creating organizer for new user:", organizerError);
            
            // Still continue since the user was created successfully
            alert(`User created, but could not create organizer: ${organizerError.message}`);
          }
        }
        
        // Refresh the user list with a cache-busting parameter
        console.log('Refreshing users after creation...');
        await refreshUsers();
        filterUsers(searchTerm);
        
        // Reset form and close dialog
        setNewUser({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          active: true,
          isOrganizer: false,
        });
        setAddUserDialogOpen(false);
        
        // No success message needed
      } catch (directError) {
        console.error('Direct backend creation failed:', directError);
        throw directError; // Re-throw to be caught by outer catch
      }
    } catch (error) {
      console.error("Error creating user:", error);
      
      let errorMessage = 'Failed to create user';
      if (error.response) {
        console.error('Error response:', error.response);
        if (typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE html>')) {
          errorMessage += ': Server error - check the console for details';
        } else if (error.response.data && error.response.data.message) {
          errorMessage += `: ${error.response.data.message}`;
        } else {
          errorMessage += `: ${error.message}`;
        }
      } else {
        errorMessage += `: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Define columns for DataGrid
  const columns = [
    { field: 'displayName', headerName: 'Name', flex: 1 },
    { field: 'email', headerName: 'Email', flex: 1 },
    { field: 'roleNames', headerName: 'Roles', flex: 1 },
    { field: 'isActive', headerName: 'Status', width: 100 },
    { field: 'isOrganizer', headerName: 'Organizer', width: 100 },
    { 
      field: 'actions', 
      headerName: 'Actions', 
      width: 280,
      renderCell: (params) => {
        const user = params.row;
        const isDeleting = loading && selectedUser?._id === user._id;
        const isTemp = user.firebaseUserId?.startsWith('temp_');
        
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="text"
              color="primary"
              onClick={() => handleEditUser(user)}
              startIcon={<EditIcon />}
              size="small"
            >
              Edit
            </Button>
            
            {user.isOrganizer === 'No' && (
              <Tooltip title="Create an organizer for this user">
                <Button
                  variant="text"
                  color="secondary"
                  onClick={() => handleQuickCreateOrganizer(user)}
                  startIcon={<LinkIcon />}
                  disabled={creatingOrganizer}
                  size="small"
                >
                  {creatingOrganizer && selectedUser?._id === user._id ? 'Creating...' : 'Create Org'}
                </Button>
              </Tooltip>
            )}
            
            <Tooltip title={isTemp ? "Delete temporary user" : "Delete user permanently"}>
              <Button
                variant="text"
                color="error"
                onClick={() => handleDeleteUser(user)}
                startIcon={<DeleteIcon />}
                disabled={isDeleting}
                size="small"
                sx={{ 
                  marginLeft: 'auto',
                  // Make delete button more prominent for temp users
                  ...(isTemp && { fontWeight: 'bold' })
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </Tooltip>
          </Box>
        );
      }
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">User Management</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<PersonAddIcon />}
          onClick={() => setAddUserDialogOpen(true)}
        >
          Add User
        </Button>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="All Users" />
          <Tab label="Organizers" />
          <Tab label="Admins" />
          <Tab label="Temp Users" />
        </Tabs>
        
        <TextField
          placeholder="Search users..."
          value={searchTerm}
          onChange={handleSearchChange}
          variant="outlined"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ height: 600, width: '100%' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : (
            <DataGrid
              rows={filteredUsers}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              disableSelectionOnClick
              density="standard"
            />
          )}
        </Paper>
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ height: 600, width: '100%' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : (
            <DataGrid
              rows={filteredUsers}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              disableSelectionOnClick
              density="standard"
            />
          )}
        </Paper>
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <Paper sx={{ height: 600, width: '100%' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : (
            <DataGrid
              rows={filteredUsers}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              disableSelectionOnClick
              density="standard"
            />
          )}
        </Paper>
      </TabPanel>
      
      <TabPanel value={tabValue} index={3}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteAllTempUsers}
            disabled={loading || filteredUsers.length === 0}
          >
            Delete All Temporary Users ({filteredUsers.length})
          </Button>
        </Box>
        <Paper sx={{ height: 600, width: '100%' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : (
            <DataGrid
              rows={filteredUsers}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              disableSelectionOnClick
              density="standard"
            />
          )}
        </Paper>
      </TabPanel>
      
      {/* User Edit Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleDialogClose} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          {editingUser && roles.length > 0 && (
            <UserEditForm
              user={editingUser}
              roles={roles}
              onSubmit={handleUpdateUser}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog
        open={addUserDialogOpen}
        onClose={() => setAddUserDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="First Name"
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Last Name"
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  helperText="Optional. If provided, minimum 6 characters. Empty = create temporary user."
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={newUser.active}
                      onChange={(e) => setNewUser({...newUser, active: e.target.checked})}
                    />
                  }
                  label="User is Active"
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <FormControlLabel
                  control={
                    <Switch
                      checked={newUser.isOrganizer}
                      onChange={(e) => setNewUser({...newUser, isOrganizer: e.target.checked})}
                    />
                  }
                  label="Create Organizer for this User"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddUserDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleCreateUser}
          >
            Create User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}