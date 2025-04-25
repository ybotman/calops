# PMR_UserPageRefactor - Component Hierarchy Diagram

## Current Component Hierarchy

The current implementation has a flat structure with most logic contained in the main UsersPage component:

```
UsersPage
├── Header
│   ├── Typography (title)
│   └── Button (Add User)
├── Navigation
│   ├── Tabs
│   └── TextField (Search)
├── TabPanel (All Users)
│   └── DataGrid
│       └── Columns with renderers
├── TabPanel (Organizers)
│   └── DataGrid
│       └── Columns with renderers
├── TabPanel (Admins)
│   └── DataGrid
│       └── Columns with renderers
├── Dialog (Edit User)
│   └── UserEditForm
│       ├── User info display
│       ├── Tabs
│       └── Form fields per tab
└── Dialog (Add User)
    └── Form fields
```

## Proposed Component Hierarchy

The refactored implementation will follow a clean separation of concerns with a clear component hierarchy:

```
UsersPageContainer (state & data management)
└── UsersPage (composition)
    ├── Header
    │   ├── Typography (title)
    │   └── AddUserButton
    ├── TabNavigationBar
    │   ├── Tabs
    │   └── UserSearchBar
    ├── TabPanel (All Users)
    │   └── UserTable
    │       ├── DataGrid
    │       └── Column renderers
    │           ├── StatusDisplay
    │           └── ActionButtons
    ├── TabPanel (Organizers)
    │   └── UserTable
    │       ├── DataGrid
    │       └── Column renderers
    │           ├── StatusDisplay
    │           └── ActionButtons
    ├── TabPanel (Admins)
    │   └── UserTable
    │       ├── DataGrid
    │       └── Column renderers
    │           ├── StatusDisplay
    │           └── ActionButtons
    ├── AddUserDialog
    │   └── UserForm
    └── EditUserDialog
        └── UserEditForm
```

## Data Flow Diagram

The proposed implementation will use a unidirectional data flow pattern:

```
┌─────────────────────────────────────────┐
│                                         │
│  ┌─────────────┐     ┌───────────────┐  │
│  │             │     │               │  │
│  │  useUsers   │◄────┤  API Client   │  │
│  │             │     │               │  │
│  └─────┬───────┘     └───────────────┘  │
│        │                                 │
│        ▼                                 │
│  ┌─────────────┐     ┌───────────────┐  │
│  │             │     │               │  │
│  │  useRoles   │◄────┤  API Client   │  │
│  │             │     │               │  │
│  └─────┬───────┘     └───────────────┘  │
│        │                                 │
│        ▼                                 │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │    UsersPageContainer           │    │
│  │                                 │    │
│  └─────────────────┬───────────────┘    │
│                    │                     │
│                    ▼                     │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │        UsersPage                │    │
│  │                                 │    │
│  └┬───────────────┬───────────────┬┘    │
│   │               │               │      │
│   ▼               ▼               ▼      │
│ ┌────────┐   ┌────────┐   ┌──────────┐  │
│ │        │   │        │   │          │  │
│ │UserTable│  │Dialogs │   │Navigation│  │
│ │        │   │        │   │          │  │
│ └────────┘   └────────┘   └──────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

## Hook Dependencies

The custom hooks will be organized with clear dependencies:

```
useUsers
├── API Client (usersApi)
├── useRoles (for role data)
└── userUtils (for data transformation)

useRoles
├── API Client (rolesApi)
└── roleUtils (for mapping)

useUserFilter
└── useUsers (for user data)

useUserForm
├── useUsers (for operations)
└── useRoles (for role assignment)

useUserActions
├── useUsers (for CRUD operations)
└── useUserForm (for form handling)
```

## Component Interfaces

### TabPanel
```jsx
interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}
```

### UserTable
```jsx
interface UserTableProps {
  users: Array<User>;
  loading: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  pagination?: {
    page: number;
    pageSize: number;
    totalCount: number;
  };
  onPaginationChange?: (newPagination: PaginationParams) => void;
}
```

### StatusDisplay
```jsx
interface StatusDisplayProps {
  user: User;
}
```

### UserSearchBar
```jsx
interface UserSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}
```

### AddUserDialog
```jsx
interface AddUserDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (userData: NewUserData) => void;
  loading: boolean;
}
```

### EditUserDialog
```jsx
interface EditUserDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  roles: Array<Role>;
  onSubmit: (updatedUser: User) => void;
  loading: boolean;
}
```

## Hook Interfaces

### useUsers
```typescript
interface UseUsersReturn {
  users: Array<User>;
  filteredUsers: Array<User>;
  loading: boolean;
  error: Error | null;
  refreshUsers: () => Promise<void>;
  filterUsers: (searchTerm: string, tabValue: number) => void;
  createUser: (userData: NewUserData) => Promise<User>;
  updateUser: (userData: User) => Promise<User>;
  deleteUser: (userId: string) => Promise<void>;
}
```

### useRoles
```typescript
interface UseRolesReturn {
  roles: Array<Role>;
  loading: boolean;
  error: Error | null;
  updateUserRoles: (firebaseUserId: string, roleIds: Array<string>) => Promise<void>;
}
```

### useUserFilter
```typescript
interface UseUserFilterReturn {
  filteredUsers: Array<User>;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  tabValue: number;
  setTabValue: (tab: number) => void;
}
```

This component hierarchy diagram provides a clear visualization of the proposed architecture and will guide the implementation of subsequent phases of the refactoring plan.