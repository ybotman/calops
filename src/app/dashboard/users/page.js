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
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/Add';
import LinkIcon from '@mui/icons-material/Link';
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
  const [roles, setRoles] = useState([]);
  const [creatingOrganizer, setCreatingOrganizer] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch users and roles on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // Fetch roles first directly from the backend
        const rolesData = await rolesApi.getRoles(appId);
        setRoles(rolesData || []);
        
        // Then fetch users directly from the backend
        const usersData = await usersApi.getUsers(appId);
        
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
      } catch (error) {
        console.error('Error fetching users:', error);
        setLoading(false);
        alert(`Failed to fetch users: ${error.message}`);
      }
    };

    fetchUsers();
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
      
      // Refresh users list directly from the backend
      const usersData = await usersApi.getUsers(appId);
      
      // Process users data
      const processedUsers = usersData.map(user => ({
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
      setDialogOpen(false);
      setEditingUser(null);
      setLoading(false);
      
      // Show success message
      alert('User updated successfully!');
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
      
      // Create basic organizer data
      const organizerData = {
        firebaseUserId: user.firebaseUserId,
        linkedUserLogin: user._id,
        appId: user.appId || '1',
        fullName: `${user.localUserInfo?.firstName || ''} ${user.localUserInfo?.lastName || ''}`.trim() || 'Unnamed Organizer',
        shortName: user.localUserInfo?.firstName || 'Unnamed',
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
      
      // Attempt to create directly using axios to the backend API
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010'}/api/organizers`, organizerData);
      
      console.log("Organizer created:", response.data);
      
      // Update user to include organizerId reference and organizer role
      const userUpdateData = {
        firebaseUserId: user.firebaseUserId,
        appId: user.appId || '1',
        regionalOrganizerInfo: {
          ...user.regionalOrganizerInfo,
          organizerId: response.data._id,
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
      
      // Refresh users
      const refreshedUsers = await usersApi.getUsers(appId);
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
      
      alert(`Organizer "${organizerData.fullName}" created successfully and linked to this user!`);
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
      width: 220,
      renderCell: (params) => (
        <Box>
          <Button
            variant="text"
            color="primary"
            onClick={() => handleEditUser(params.row)}
            startIcon={<EditIcon />}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          
          {params.row.isOrganizer === 'No' && (
            <Tooltip title="Create an organizer for this user">
              <Button
                variant="text"
                color="secondary"
                onClick={() => handleQuickCreateOrganizer(params.row)}
                startIcon={<LinkIcon />}
                disabled={creatingOrganizer}
              >
                {creatingOrganizer && selectedUser?._id === params.row._id ? 'Creating...' : 'Create Org'}
              </Button>
            </Tooltip>
          )}
        </Box>
      ) 
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
    </Box>
  );
}