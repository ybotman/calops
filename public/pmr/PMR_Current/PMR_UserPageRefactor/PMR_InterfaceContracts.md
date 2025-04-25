# PMR_UserPageRefactor - Interface Contracts

This document defines the interface contracts between the components and hooks in the refactored Users page. These contracts ensure a clean separation of concerns and enable independent development and testing of components.

## UI Component Contracts

### TabPanel

A reusable component for managing tab content visibility.

```typescript
interface TabPanelProps {
  children: React.ReactNode;  // Content to display when tab is active
  value: number;              // Current active tab value
  index: number;              // This tab's index value
  className?: string;         // Optional CSS class
}
```

### UserTable

Displays user data in a table with sorting, filtering, and pagination.

```typescript
interface UserTableProps {
  users: User[];              // Array of user objects to display
  loading: boolean;           // Loading state
  error?: string;             // Error message to display
  onEdit: (user: User) => void;         // Callback when edit button is clicked
  onDelete: (user: User) => void;       // Callback when delete button is clicked
  onCreateOrganizer?: (user: User) => void;  // Optional callback for organizer creation
  onDeleteOrganizer?: (user: User) => void;  // Optional callback for organizer deletion
  columns?: ColumnDefinition[];  // Optional custom column definitions
  pagination?: {
    page: number;
    pageSize: number;
    totalCount: number;
  };
  onPaginationChange?: (newPage: number, newPageSize: number) => void;
}
```

### StatusDisplay

Displays user status indicators for different permission types.

```typescript
interface StatusDisplayProps {
  user: User;                 // User object with status information
  showLabels?: boolean;       // Whether to show text labels (default: true)
  size?: 'small' | 'medium';  // Size of the display (default: 'medium')
}
```

### UserSearchBar

Search input with debounced search functionality.

```typescript
interface UserSearchBarProps {
  value: string;              // Current search term
  onChange: (term: string) => void;  // Callback for search term changes
  placeholder?: string;       // Placeholder text (default: "Search users...")
  debounceMs?: number;        // Debounce delay in ms (default: 300)
}
```

### AddUserDialog

Dialog for creating new users.

```typescript
interface AddUserDialogProps {
  open: boolean;              // Dialog visibility
  onClose: () => void;        // Close dialog callback
  onSubmit: (userData: NewUserData) => Promise<void>;  // Submit form callback
  loading: boolean;           // Loading state during submission
}

interface NewUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  active: boolean;
  isOrganizer: boolean;
}
```

### EditUserDialog

Dialog for editing existing users.

```typescript
interface EditUserDialogProps {
  open: boolean;              // Dialog visibility
  onClose: () => void;        // Close dialog callback
  user: User | null;          // User being edited
  roles: Role[];              // Available roles
  onSubmit: (updatedUser: User) => Promise<void>;  // Submit callback
  loading: boolean;           // Loading state during submission
}
```

## Hook Contracts

### useUsers

Manages user data fetching, filtering, and CRUD operations.

```typescript
interface UseUsersOptions {
  appId?: string;             // Application ID (default: '1')
  initialFilters?: {          // Initial filter settings
    searchTerm?: string;
    tabValue?: number;
  };
}

interface UseUsersReturn {
  // Data
  users: User[];              // All users
  filteredUsers: User[];      // Filtered users based on search and tab
  loading: boolean;           // Loading state
  error: Error | null;        // Error state
  
  // Filtering
  searchTerm: string;         // Current search term
  setSearchTerm: (term: string) => void;  // Update search term
  tabValue: number;           // Current tab index
  setTabValue: (value: number) => void;   // Update tab index
  
  // CRUD operations
  refreshUsers: () => Promise<void>;      // Refresh user data
  createUser: (data: NewUserData) => Promise<User>;  // Create user
  updateUser: (user: User) => Promise<User>;        // Update user
  deleteUser: (userId: string) => Promise<void>;    // Delete user
  
  // Pagination
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
  };
  setPagination: (newPagination: Partial<PaginationParams>) => void;
}
```

### useRoles

Manages role data and operations.

```typescript
interface UseRolesOptions {
  appId?: string;             // Application ID (default: '1')
}

interface UseRolesReturn {
  roles: Role[];              // All roles
  loading: boolean;           // Loading state
  error: Error | null;        // Error state
  refreshRoles: () => Promise<void>;  // Refresh roles data
  updateUserRoles: (firebaseUserId: string, roleIds: string[]) => Promise<void>;  // Update user roles
  getRoleNameById: (roleId: string) => string;  // Get role name by ID
  getRoleNameCodeById: (roleId: string) => string;  // Get role name code by ID
}
```

### useUserFilter

Manages user filtering operations.

```typescript
interface UseUserFilterOptions {
  users: User[];              // Users to filter
  initialFilters?: {          // Initial filter state
    searchTerm?: string;
    tabValue?: number;
  };
}

interface UseUserFilterReturn {
  filteredUsers: User[];      // Filtered user list
  searchTerm: string;         // Current search term
  setSearchTerm: (term: string) => void;  // Update search term
  tabValue: number;           // Current tab value
  setTabValue: (value: number) => void;   // Update tab value
  
  // Advanced filtering
  addFilter: (key: string, value: any) => void;  // Add custom filter
  removeFilter: (key: string) => void;           // Remove custom filter
  clearFilters: () => void;                      // Clear all filters
}
```

### useUserForm

Manages form state for user creation and editing.

```typescript
interface UseUserFormOptions {
  initialData?: Partial<User>;  // Initial form data
  onSubmit?: (data: User) => Promise<void>;  // Submit callback
}

interface UseUserFormReturn {
  formData: User;             // Current form data
  errors: Record<string, string>;  // Form validation errors
  
  // Form operations
  handleChange: (fieldPath: string, value: any) => void;  // Handle field change
  handleToggle: (fieldPath: string) => (event: React.ChangeEvent<HTMLInputElement>) => void;  // Handle toggle
  handleRoleChange: (roleId: string, checked: boolean) => void;  // Handle role change
  reset: () => void;          // Reset form to initial state
  validate: () => boolean;    // Validate form
  submit: () => Promise<void>;  // Submit form
  
  loading: boolean;           // Submission loading state
  submitError: string | null;  // Submission error
}
```

### useUserActions

Manages user-related actions like creating organizers.

```typescript
interface UseUserActionsOptions {
  appId?: string;             // Application ID (default: '1')
  onSuccess?: (action: string, user: User) => void;  // Success callback
}

interface UseUserActionsReturn {
  createOrganizer: (user: User) => Promise<void>;  // Create organizer for user
  deleteOrganizer: (user: User) => Promise<void>;  // Delete user's organizer
  
  loading: boolean;           // Action loading state
  error: Error | null;        // Action error
  selectedUser: User | null;  // Currently selected user
}
```

## Data Models

### User

```typescript
interface User {
  _id: string;                // User ID
  id: string;                 // ID for DataGrid (same as _id)
  firebaseUserId: string;     // Firebase user ID
  appId: string;              // Application ID
  active: boolean;            // Overall active status
  
  // Computed display fields
  displayName: string;        // Combined name for display
  email: string;              // User email
  roleNames: string;          // Comma-separated role name codes
  
  // Nested objects
  firebaseUserInfo?: {
    email: string;
    displayName?: string;
  };
  
  localUserInfo?: {
    firstName?: string;
    lastName?: string;
    isApproved?: boolean;
    isEnabled?: boolean;
    isActive?: boolean;
  };
  
  regionalOrganizerInfo?: {
    organizerId?: string | { _id: string };
    isApproved?: boolean;
    isEnabled?: boolean;
    isActive?: boolean;
  };
  
  localAdminInfo?: {
    isApproved?: boolean;
    isEnabled?: boolean;
    isActive?: boolean;
  };
  
  roleIds: (string | { _id: string, roleNameCode?: string })[];  // Role IDs
  
  createdAt?: string;         // Creation timestamp
  updatedAt?: string;         // Last update timestamp
}
```

### Role

```typescript
interface Role {
  _id: string;                // Role ID
  roleName: string;           // Role name
  roleNameCode: string;       // Role name code (abbreviation)
  description?: string;       // Role description
  appId: string;              // Application ID
}
```

### PaginationParams

```typescript
interface PaginationParams {
  page: number;               // Current page (0-based)
  pageSize: number;           // Items per page
  totalCount: number;         // Total number of items
}
```

## Utilities

### roleUtils

```typescript
// Map role IDs to role name codes
function mapRoleIdsToNameCodes(roleIds: any[], roles: Role[]): string[];

// Convert roles to a string representation
function getRoleDisplayString(roleIds: any[], roles: Role[]): string;

// Check if user has specific role
function hasRole(user: User, roleName: string, roles: Role[]): boolean;

// Process roleIds to ensure consistent format
function processRoleIds(roleIds: any[]): string[];
```

### userUtils

```typescript
// Get a user's display name
function getUserDisplayName(user: User): string;

// Get a user's status for specific role type
function getUserStatus(user: User, type: 'user' | 'organizer' | 'admin'): {
  isApproved: boolean;
  isEnabled: boolean;
  isActive: boolean;
};

// Convert API user to UI model
function processUserData(apiUser: any, roles: Role[]): User;

// Prepare user for API submission
function prepareUserForSubmission(user: User): any;
```

These interface contracts provide a comprehensive blueprint for the component architecture and ensure that each component has a well-defined responsibility and communication pattern. This will enable clean separation of concerns and make the codebase easier to maintain and extend.