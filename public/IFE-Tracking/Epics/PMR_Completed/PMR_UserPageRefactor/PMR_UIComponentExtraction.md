# PMR_UserPageRefactor - UI Component Extraction Plan

## Overview

This document outlines the plan for breaking down the monolithic UsersPage component (currently 1,349 lines) into smaller, focused UI components that follow the component hierarchy defined in the PMR. This extraction will improve maintainability, enable better testing, and set the stage for future enhancements.

## Component Hierarchy

The proposed component hierarchy follows a logical structure with clear responsibility boundaries:

```
UsersPageContainer (src/app/dashboard/users/page.js)
└── UsersPage (src/components/users/UsersPage.js)
    ├── UserHeader (src/components/users/components/UserHeader.js)
    │   ├── Typography (title)
    │   └── AddUserButton (src/components/users/components/AddUserButton.js)
    ├── UserTabNavigationBar (src/components/users/components/UserTabNavigationBar.js)
    │   ├── Tabs
    │   └── UserSearchBar (src/components/users/components/UserSearchBar.js)
    ├── TabPanel > All Users (src/components/common/TabPanel.js)
    │   └── UserTable (src/components/users/components/UserTable.js)
    │       ├── DataGrid
    │       └── ColumnRenderers
    │           ├── StatusDisplay (src/components/users/components/StatusDisplay.js)
    │           └── ActionButtons (src/components/users/components/ActionButtons.js)
    ├── TabPanel > Organizers
    │   └── UserTable (reused)
    ├── TabPanel > Admins
    │   └── UserTable (reused)
    ├── AddUserDialog (src/components/users/components/AddUserDialog.js)
    │   └── UserForm (src/components/users/components/UserForm.js)
    └── EditUserDialog (src/components/users/components/EditUserDialog.js)
        └── UserEditForm (existing component)
```

## Component Descriptions and Interfaces

### 1. UsersPageContainer

**Purpose**: Container component that manages state and data fetching.

**Implementation**:
```jsx
// src/app/dashboard/users/page.js
'use client';

import UsersPage from '@/components/users/UsersPage';
import { useUsers, useRoles, useOrganizerActions } from '@/components/users/hooks';

export default function UsersPageContainer() {
  // Use the hooks
  const usersHook = useUsers();
  const { roles } = useRoles();
  const organizerActions = useOrganizerActions({
    refreshUsers: usersHook.fetchUsers
  });

  // Combine props for the presentation component
  const props = {
    ...usersHook,
    roles,
    ...organizerActions
  };

  return <UsersPage {...props} />;
}
```

### 2. UsersPage

**Purpose**: Main presentation component that composes the UI from smaller components.

**Props**:
```typescript
interface UsersPageProps {
  // Data
  users: User[];
  filteredUsers: User[];
  roles: Role[];
  loading: boolean;
  error: Error | null;
  
  // Filters
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  tabValue: number;
  setTabValue: (tab: number) => void;
  
  // User operations
  createUser: (userData: NewUserData) => Promise<User>;
  updateUser: (userData: User) => Promise<User>;
  deleteUser: (userId: string) => Promise<void>;
  
  // Organizer operations
  createOrganizer: (user: User) => Promise<void>;
  deleteOrganizer: (user: User) => Promise<void>;
  
  // Other
  pagination: PaginationState;
  setPagination: (pagination: Partial<PaginationState>) => void;
  selectedUser: User | null;
  organizerLoading: boolean;
}
```

**Implementation**:
```jsx
// src/components/users/UsersPage.js
import React, { useState } from 'react';
import UserHeader from './components/UserHeader';
import UserTabNavigationBar from './components/UserTabNavigationBar';
import UserTable from './components/UserTable';
import AddUserDialog from './components/AddUserDialog';
import EditUserDialog from './components/EditUserDialog';
import TabPanel from '@/components/common/TabPanel';

export default function UsersPage(props) {
  // Local state for dialogs
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Handlers
  const handleAddUser = () => setAddDialogOpen(true);
  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditDialogOpen(true);
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <UserHeader 
        onAddUser={handleAddUser} 
      />
      
      <UserTabNavigationBar
        value={props.tabValue}
        onChange={props.setTabValue}
        searchTerm={props.searchTerm}
        onSearchChange={props.setSearchTerm}
      />
      
      <TabPanel value={props.tabValue} index={0}>
        <UserTable
          users={props.filteredUsers}
          loading={props.loading}
          onEdit={handleEditUser}
          onDelete={props.deleteUser}
          pagination={props.pagination}
          onPaginationChange={props.setPagination}
        />
      </TabPanel>
      
      <TabPanel value={props.tabValue} index={1}>
        <UserTable
          users={props.filteredUsers}
          loading={props.loading}
          onEdit={handleEditUser}
          onDelete={props.deleteUser}
          onCreateOrganizer={props.createOrganizer}
          onDeleteOrganizer={props.deleteOrganizer}
          pagination={props.pagination}
          onPaginationChange={props.setPagination}
          organizerLoading={props.organizerLoading}
          selectedUser={props.selectedUser}
        />
      </TabPanel>
      
      <TabPanel value={props.tabValue} index={2}>
        <UserTable
          users={props.filteredUsers}
          loading={props.loading}
          onEdit={handleEditUser}
          onDelete={props.deleteUser}
          pagination={props.pagination}
          onPaginationChange={props.setPagination}
        />
      </TabPanel>
      
      <AddUserDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSubmit={props.createUser}
        loading={props.loading}
      />
      
      <EditUserDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        user={editingUser}
        roles={props.roles}
        onSubmit={props.updateUser}
        loading={props.loading}
      />
    </Box>
  );
}
```

### 3. UserHeader

**Purpose**: Displays page title and Add User button.

**Props**:
```typescript
interface UserHeaderProps {
  onAddUser: () => void;
}
```

**Implementation**:
```jsx
// src/components/users/components/UserHeader.js
import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/Add';

export default function UserHeader({ onAddUser }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
      <Typography variant="h4" component="h1">
        User Management
      </Typography>
      
      <Button
        variant="contained"
        color="primary"
        startIcon={<PersonAddIcon />}
        onClick={onAddUser}
      >
        Add User
      </Button>
    </Box>
  );
}
```

### 4. UserTabNavigationBar

**Purpose**: Manages tab selection and contains search functionality.

**Props**:
```typescript
interface UserTabNavigationBarProps {
  value: number;
  onChange: (newValue: number) => void;
  searchTerm: string;
  onSearchChange: (newTerm: string) => void;
}
```

**Implementation**:
```jsx
// src/components/users/components/UserTabNavigationBar.js
import React from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import UserSearchBar from './UserSearchBar';

export default function UserTabNavigationBar({
  value,
  onChange,
  searchTerm,
  onSearchChange
}) {
  const handleTabChange = (_, newValue) => {
    onChange(newValue);
  };
  
  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Tabs value={value} onChange={handleTabChange}>
          <Tab label="All Users" id="users-tab-0" />
          <Tab label="Organizers" id="users-tab-1" />
          <Tab label="Admins" id="users-tab-2" />
        </Tabs>
        
        <UserSearchBar
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Search users..."
        />
      </Box>
    </Box>
  );
}
```

### 5. UserSearchBar

**Purpose**: Provides search functionality.

**Props**:
```typescript
interface UserSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}
```

**Implementation**:
```jsx
// src/components/users/components/UserSearchBar.js
import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

export default function UserSearchBar({
  value,
  onChange,
  placeholder = "Search users..."
}) {
  const handleChange = (event) => {
    onChange(event.target.value);
  };
  
  return (
    <TextField
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      variant="outlined"
      size="small"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        )
      }}
      sx={{ width: 250 }}
    />
  );
}
```

### 6. TabPanel (Already Exists but Needs to be Moved)

**Purpose**: Wrapper component for tab content that handles visibility.

**Props**:
```typescript
interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}
```

**Implementation**:
```jsx
// src/components/common/TabPanel.js
import React from 'react';
import { Box } from '@mui/material';

export default function TabPanel(props) {
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
```

### 7. AddUserDialog 

**Purpose**: Dialog for adding new users.

**Props**:
```typescript
interface AddUserDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (userData: NewUserData) => Promise<void>;
  loading: boolean;
}
```

**Implementation**:
```jsx
// src/components/users/components/AddUserDialog.js
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress
} from '@mui/material';
import UserForm from './UserForm';
import { useUserForm } from '../hooks';

export default function AddUserDialog({
  open,
  onClose,
  onSubmit,
  loading
}) {
  const userForm = useUserForm({
    initialData: {
      email: '',
      password: '',
      localUserInfo: {
        firstName: '',
        lastName: '',
        isApproved: true,
        isEnabled: true,
        isActive: true
      },
      isOrganizer: false
    },
    onSubmit: async (data) => {
      await onSubmit(data);
      onClose();
    }
  });
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Add New User</DialogTitle>
      <DialogContent>
        <UserForm
          formData={userForm.formData}
          errors={userForm.errors}
          handleChange={userForm.handleChange}
          handleToggle={userForm.handleToggle}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={userForm.submit}
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading && <CircularProgress size={24} />}
        >
          {loading ? 'Creating...' : 'Create User'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

### 8. EditUserDialog 

**Purpose**: Dialog for editing existing users.

**Props**:
```typescript
interface EditUserDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  roles: Role[];
  onSubmit: (updatedUser: User) => Promise<void>;
  loading: boolean;
}
```

**Implementation**:
```jsx
// src/components/users/components/EditUserDialog.js
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress
} from '@mui/material';
import UserEditForm from '../UserEditForm';

export default function EditUserDialog({
  open,
  onClose,
  user,
  roles,
  onSubmit,
  loading
}) {
  const handleSubmit = async (userData) => {
    await onSubmit(userData);
    onClose();
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit User</DialogTitle>
      <DialogContent>
        {user && (
          <UserEditForm
            user={user}
            roles={roles}
            onUpdate={handleSubmit}
            loading={loading}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

### 9. StatusDisplay (Already Exists)

**Purpose**: Displays user status indicators.

**Props**:
```typescript
interface StatusDisplayProps {
  user: User;
}
```

### 10. ActionButtons

**Purpose**: Action buttons for each user row.

**Props**:
```typescript
interface ActionButtonsProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => Promise<void>;
  onCreateOrganizer?: (user: User) => Promise<void>;
  onDeleteOrganizer?: (user: User) => Promise<void>;
  loading?: boolean;
  isSelected?: boolean;
}
```

**Implementation**:
```jsx
// src/components/users/components/ActionButtons.js
import React from 'react';
import { Box, Button, Tooltip, CircularProgress } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

export default function ActionButtons({
  user,
  onEdit,
  onDelete,
  onCreateOrganizer,
  onDeleteOrganizer,
  loading = false,
  isSelected = false
}) {
  // Handler for delete
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${user.displayName}?`)) {
      onDelete(user._id);
    }
  };
  
  // Organizer action button
  const renderOrganizerButton = () => {
    if (!onCreateOrganizer || !onDeleteOrganizer) return null;
    
    const hasOrgId = user.regionalOrganizerInfo?.organizerId;
    
    if (hasOrgId) {
      return (
        <Button
          variant="outlined"
          color="secondary"
          size="small"
          onClick={() => onDeleteOrganizer(user)}
          disabled={loading && isSelected}
          sx={{ ml: 1 }}
        >
          {loading && isSelected ? 'Processing...' : 'Remove Org'}
        </Button>
      );
    }
    
    return (
      <Button
        variant="outlined"
        color="primary"
        size="small"
        onClick={() => onCreateOrganizer(user)}
        disabled={loading && isSelected}
        sx={{ ml: 1 }}
      >
        {loading && isSelected ? 'Creating...' : 'Make Organizer'}
      </Button>
    );
  };
  
  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Button
        variant="text"
        color="primary"
        onClick={() => onEdit(user)}
        startIcon={<EditIcon />}
        size="small"
      >
        Edit
      </Button>
      
      <Tooltip title="Delete user permanently">
        <Button
          variant="text"
          color="error"
          onClick={handleDelete}
          startIcon={<DeleteIcon />}
          disabled={loading && isSelected}
          size="small"
        >
          {loading && isSelected ? <CircularProgress size={20} /> : 'Delete'}
        </Button>
      </Tooltip>
      
      {renderOrganizerButton()}
    </Box>
  );
}
```

## Implementation Plan

### Phase 1: Prepare Shared Components

1. Move TabPanel to common folder
2. Implement StatusDisplay and ActionButtons

### Phase 2: Implement UI Components

1. Create UserHeader
2. Implement UserSearchBar
3. Create UserTabNavigationBar
4. Implement AddUserDialog and EditUserDialog
5. Create UserForm component

### Phase 3: Assemble UsersPage

1. Create UsersPage component that uses all smaller components
2. Implement UsersPageContainer that provides data to UsersPage
3. Replace existing page.js with new container

### Phase 4: Testing and Refinement

1. Test all components in isolation
2. Verify the integrated page works correctly
3. Optimize performance
4. Add missing features if needed

## Benefits

- **Maintainability**: Each component has a single responsibility
- **Testability**: Small components can be tested in isolation
- **Reusability**: Components can be reused in other parts of the application
- **Performance**: Smaller components result in more efficient rendering
- **Collaboration**: Multiple developers can work on different components
- **Documentation**: Props interfaces provide self-documentation

## Next Steps

1. Create shared components
2. Implement UI components
3. Create container component
4. Integrate all components
5. Test and refine