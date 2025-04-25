# PMR_UserPageRefactor - State Management Requirements

This document outlines the state management requirements for the refactored Users page, including what state is needed, where it should be managed, and how it should flow between components.

## Current State Management Issues

The current implementation has several issues with state management:

1. **State Sprawl**: The UsersPage component manages 15+ state variables, making it difficult to understand data flow and state updates.

2. **Mixed Concerns**: UI state (like dialogs and tab values) is mixed with data state (like users and roles).

3. **Inefficient Updates**: State updates often trigger unnecessary re-renders of the entire component tree.

4. **Duplicate State**: Some state is duplicated or derived unnecessarily.

5. **Inconsistent Patterns**: State updates follow different patterns in different parts of the component.

## State Categories

For the refactored implementation, we'll organize state into these categories:

### 1. Data State

State that represents the core data from the API or derived from it.

- **Users data**: The complete list of users fetched from the API
- **Filtered users**: Users filtered by search term and tab selection
- **Roles data**: Available roles for users
- **Current user**: User currently being edited or acted upon

### 2. UI State

State that controls the user interface.

- **Tab selection**: Current active tab
- **Dialog visibility**: Open/closed state of dialogs
- **Form values**: Input values in add/edit forms
- **Search term**: Current search input value

### 3. Async State

State related to asynchronous operations.

- **Loading states**: Loading indicators for different operations
- **Error states**: Error messages for failed operations
- **Success states**: Success messages for completed operations

### 4. Pagination State

State for managing pagination.

- **Page**: Current page number
- **Page size**: Number of items per page
- **Total count**: Total number of items

## State Location and Management

### Data State Management

#### Users State
- **Location**: `useUsers` custom hook
- **Interface**:
  ```typescript
  {
    users: User[];
    filteredUsers: User[];
    getUser: (id: string) => User | undefined;
    refreshUsers: () => Promise<void>;
  }
  ```
- **Management**: Fetched from API on component mount and after CRUD operations

#### Roles State
- **Location**: `useRoles` custom hook
- **Interface**:
  ```typescript
  {
    roles: Role[];
    refreshRoles: () => Promise<void>;
  }
  ```
- **Management**: Fetched from API on component mount

### UI State Management

#### Tab State
- **Location**: `UsersPageContainer` component
- **Interface**:
  ```typescript
  {
    tabValue: number;
    setTabValue: (value: number) => void;
  }
  ```
- **Management**: Controlled by tab click handlers

#### Dialog State
- **Location**: `UsersPageContainer` component
- **Interface**:
  ```typescript
  {
    editDialogOpen: boolean;
    setEditDialogOpen: (open: boolean) => void;
    addDialogOpen: boolean;
    setAddDialogOpen: (open: boolean) => void;
  }
  ```
- **Management**: Controlled by button click handlers and dialog close handlers

#### Search State
- **Location**: `useUserFilter` custom hook
- **Interface**:
  ```typescript
  {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    debouncedSearchTerm: string;
  }
  ```
- **Management**: Updated by search input with debounce

### Async State Management

#### Loading State
- **Location**: Split across hooks by operation
- **Interface**:
  ```typescript
  {
    loading: {
      users: boolean;
      roles: boolean;
      create: boolean;
      update: boolean;
      delete: boolean;
      organizer: boolean;
    }
  }
  ```
- **Management**: Updated at the start and end of each async operation

#### Error State
- **Location**: Split across hooks by operation
- **Interface**:
  ```typescript
  {
    errors: {
      users: Error | null;
      roles: Error | null;
      create: Error | null;
      update: Error | null;
      delete: Error | null;
      organizer: Error | null;
    }
  }
  ```
- **Management**: Set when operations fail, cleared on retry

### Pagination State

- **Location**: `useUsers` custom hook
- **Interface**:
  ```typescript
  {
    pagination: {
      page: number;
      pageSize: number;
      totalCount: number;
    };
    setPagination: (params: Partial<PaginationParams>) => void;
  }
  ```
- **Management**: Updated based on DataGrid pagination events

## State Flow Diagram

```
┌─────────────────────────────────────────────────┐
│                                                 │
│                 App Context                     │
│                                                 │
│  ┌─────────────────────┐                        │
│  │                     │                        │
│  │     currentApp      │                        │
│  │                     │                        │
│  └─────────────────────┘                        │
│                                                 │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│                                                 │
│              UsersPageContainer                 │
│                                                 │
│  ┌─────────────┐     ┌─────────────────┐        │
│  │             │     │                 │        │
│  │  useUsers   │     │   useRoles      │        │
│  │             │     │                 │        │
│  └─────┬───────┘     └───────┬─────────┘        │
│        │                     │                  │
│        ▼                     ▼                  │
│  ┌─────────────┐     ┌─────────────────┐        │
│  │             │     │                 │        │
│  │dialogs/tabs │     │useUserFilter    │        │
│  │             │     │                 │        │
│  └─────┬───────┘     └───────┬─────────┘        │
│        │                     │                  │
└────────┼─────────────────────┼──────────────────┘
         │                     │
         └─────────┬───────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│                                                 │
│                  UsersPage                      │
│                                                 │
│  ┌─────────────┐     ┌─────────────────┐        │
│  │             │     │                 │        │
│  │TabNavigation│     │    TabPanels    │        │
│  │             │     │                 │        │
│  └─────────────┘     └─────────────────┘        │
│                                                 │
│  ┌─────────────┐     ┌─────────────────┐        │
│  │             │     │                 │        │
│  │   Dialogs   │     │    Tables       │        │
│  │             │     │                 │        │
│  └─────────────┘     └─────────────────┘        │
│                                                 │
└─────────────────────────────────────────────────┘
```

## React Hooks Usage

### useState

Used for local component state:
- Dialog visibility
- Tab selection
- Form inputs
- Local UI states

### useEffect

Used for:
- Initial data fetching
- Data refetching after operations
- Synchronizing derived state

### useCallback

Used for:
- Event handlers passed to child components
- Memoizing functions passed to useEffect dependencies

### useMemo

Used for:
- Expensive computations like filtering and mapping
- Derived data from API responses
- Component property memoization

### useReducer

Used in complex hooks where multiple related state updates occur together:
- User CRUD operations
- Form state management
- Complex state transitions

## Form State Management

Forms will use a dedicated `useUserForm` hook that manages:

1. Form values
2. Validation
3. Submission
4. Error handling

The hook will:
- Accept initial values
- Track dirty states
- Validate on submit
- Handle nested object updates
- Provide controlled input handlers

## Implementation Guidelines

1. **Minimize Prop Drilling**: Use custom hooks for shared state rather than passing props through multiple levels.

2. **Atomic State Updates**: Break state into small, focused pieces rather than large objects.

3. **Explicit State Flow**: Make state updates explicit and avoid side effects where possible.

4. **Consistent Patterns**: Use consistent patterns for all state management (e.g., always use the same loading/error pattern).

5. **Memoization**: Use React.memo, useMemo, and useCallback appropriately to prevent unnecessary rerenders.

6. **Controlled Components**: Use controlled components for form inputs to ensure a single source of truth.

7. **Immutable Updates**: Always use immutable update patterns to avoid bugs.

By following these state management requirements, the refactored Users page will be more maintainable, testable, and performant.