# Frontend Teams and Projects Implementation

This document outlines the complete frontend implementation of Teams/Groups support and Project sharing functionality for LibreChat.

## Overview

The frontend implementation provides a comprehensive user interface for:
- **Team Management**: Create, manage, and collaborate within teams
- **Project Sharing**: Share projects with individuals or teams with different permission levels
- **Dashboard Navigation**: Unified interface to switch between Prompts, Teams, and Projects
- **Real-time Updates**: Reactive UI with optimistic updates and error handling

## Architecture

### Data Layer
- **React Query**: For server state management and caching
- **Custom Hooks**: Typed hooks for all API operations
- **Error Handling**: Comprehensive error handling with user feedback

### Component Structure
- **Page Components**: Full-page views for Teams and Projects
- **Dialog Components**: Modals for creating, editing, and sharing
- **Utility Components**: Reusable confirmation dialogs and forms

### Navigation
- **Dashboard Layout**: Unified layout for all dashboard pages
- **Dynamic Breadcrumbs**: Context-aware navigation breadcrumbs
- **Tab Navigation**: Easy switching between different sections

## Implementation Details

### Data Providers

#### Teams Data Provider (`client/src/data-provider/teams.ts`)
```typescript
// Core team operations
- useUserTeamsQuery: Get user's teams
- useTeamQuery: Get team details
- useTeamMembersQuery: Get team members
- useCreateTeamMutation: Create new team
- useUpdateTeamMutation: Update team
- useDeleteTeamMutation: Delete team
- useInviteToTeamMutation: Invite users to team
- useAcceptInvitationMutation: Accept team invitations
- useRemoveTeamMemberMutation: Remove team members
```

#### Projects Data Provider (`client/src/data-provider/projects.ts`)
```typescript
// Core project operations
- useUserProjectsQuery: Get user's projects
- useProjectQuery: Get project details
- useProjectSharingQuery: Get sharing information
- useCreateProjectMutation: Create new project
- useUpdateProjectMutation: Update project
- useDeleteProjectMutation: Delete project
- useShareProjectMutation: Share project
- useUnshareProjectMutation: Remove sharing
```

### Main Components

#### TeamsPage (`client/src/components/Teams/TeamsPage.tsx`)
**Features:**
- Grid view of user's teams with role indicators
- Create new teams
- Invite users to teams
- Delete teams (owner only)
- Role-based action visibility
- Real-time updates

**Key Elements:**
- Team cards with avatars and descriptions
- Role indicators (Owner, Admin, Member, Viewer)
- Action buttons for invite and delete
- Empty state with call-to-action

#### ProjectsPage (`client/src/components/Projects/ProjectsPage.tsx`)
**Features:**
- Grid view of accessible projects
- Create new projects (personal or team)
- Share projects with users
- Delete projects (owner only)
- Project type indicators (Public, Team, Shared, Private)
- Real-time updates

**Key Elements:**
- Project cards with type indicators
- Statistics (prompts, agents, shares)
- Action buttons for sharing and deletion
- Empty state with call-to-action

### Dialog Components

#### CreateTeamDialog
- Form with name, description, and avatar
- Input validation
- Loading states
- Error handling

#### InviteToTeamDialog
- Email input with validation
- Role selection (Admin, Member, Viewer)
- Invitation management
- Success feedback

#### CreateProjectDialog
- Project name and description
- Team selection (if user is in teams)
- Public/private toggle
- Form validation

#### ShareProjectDialog
- User ID/email input
- Role selection (Viewer, Editor, Admin)
- Current shares display
- Remove sharing functionality

#### ConfirmDeleteDialog
- Reusable confirmation dialog
- Warning styling
- Loading states
- Customizable messages

### Navigation Enhancement

#### DashboardNav (`client/src/components/Nav/DashboardNav.tsx`)
- Tab-style navigation between sections
- Active state indicators
- Responsive design
- Icon and text labels

#### Enhanced DashBreadcrumb
- Dynamic section detection
- Section-specific icons and labels
- Back to chat functionality
- Admin settings integration

### Routing Structure

```typescript
// Dashboard routes in client/src/routes/Dashboard.tsx
{
  path: 'd/*',
  element: <DashboardRoute />,
  children: [
    {
      path: 'prompts/*',
      element: <PromptsView />,
      // ... prompts nested routes
    },
    {
      path: 'teams',
      element: <TeamsPage />,
    },
    {
      path: 'projects',
      element: <ProjectsPage />,
    },
    {
      path: '*',
      element: <Navigate to="/d/prompts" replace={true} />,
    },
  ],
}
```

## UI/UX Features

### Design Patterns
- **Consistent Visual Language**: Following LibreChat's design system
- **Card-based Layout**: Clean grid layouts for teams and projects
- **Role Indicators**: Clear visual indicators for permissions
- **Progressive Disclosure**: Modal dialogs for complex operations

### Responsive Design
- **Mobile-first**: Responsive grid layouts
- **Touch-friendly**: Appropriately sized touch targets
- **Adaptive Navigation**: Collapsible elements on small screens

### Accessibility
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Focus Management**: Logical focus flow
- **Color Contrast**: Accessible color combinations

### User Feedback
- **Toast Notifications**: Success, error, and info messages
- **Loading States**: Skeleton loaders and spinners
- **Optimistic Updates**: Immediate UI updates with rollback
- **Error Boundaries**: Graceful error handling

## State Management

### React Query Integration
- **Automatic Caching**: Intelligent cache management
- **Background Refetching**: Keep data fresh
- **Optimistic Updates**: Immediate UI feedback
- **Error Recovery**: Automatic retry logic

### Cache Management
```typescript
// Example cache invalidation
onSuccess: (data) => {
  queryClient.invalidateQueries([QueryKeys.teams]);
  queryClient.setQueryData([QueryKeys.team, teamId], data);
}
```

### Local State
- **Form State**: Controlled components with validation
- **Modal State**: Dialog open/close management
- **Selection State**: Multi-select and filtering

## Security Considerations

### Client-side Validation
- Input sanitization
- Email format validation
- Required field validation
- Role permission checks

### Permission-based UI
```typescript
const canDeleteTeam = (team: Team) => {
  return team.userRole === 'owner';
};

const canInviteToTeam = (team: Team) => {
  return ['owner', 'admin'].includes(team.userRole || '');
};
```

### Error Handling
- Graceful degradation
- User-friendly error messages
- Network error recovery
- Validation error display

## Performance Optimizations

### Code Splitting
- Lazy loading of dialog components
- Route-based code splitting
- Dynamic imports

### Memoization
```typescript
const teams = useMemo(() => teamsData?.teams || [], [teamsData]);
const canDelete = useMemo(() => canDeleteTeam(team), [team]);
```

### Efficient Rendering
- React.memo for expensive components
- Callback memoization
- Optimized re-renders

## File Structure

```
client/src/
├── components/
│   ├── Teams/
│   │   ├── TeamsPage.tsx
│   │   ├── CreateTeamDialog.tsx
│   │   ├── InviteToTeamDialog.tsx
│   │   ├── ConfirmDeleteDialog.tsx
│   │   └── index.ts
│   ├── Projects/
│   │   ├── ProjectsPage.tsx
│   │   ├── CreateProjectDialog.tsx
│   │   ├── ShareProjectDialog.tsx
│   │   └── index.ts
│   └── Nav/
│       └── DashboardNav.tsx
├── data-provider/
│   ├── teams.ts
│   ├── projects.ts
│   └── index.ts
└── routes/
    ├── Dashboard.tsx
    └── Layouts/
        └── DashBreadcrumb.tsx
```

## Usage Examples

### Creating a Team
1. Navigate to `/d/teams`
2. Click "Create Team" button
3. Fill in team details (name, description, avatar)
4. Submit form
5. Team appears in grid with user as owner

### Inviting Users to Team
1. From teams page, click invite button on team card
2. Enter user email and select role
3. Submit invitation
4. User receives invitation (backend sends email)
5. User can accept via invitation link

### Creating a Project
1. Navigate to `/d/projects`
2. Click "Create Project" button
3. Fill in project details
4. Optionally select team and set public/private
5. Submit form
6. Project appears in grid

### Sharing a Project
1. From projects page, click share button on project card
2. Enter user ID/email and select role
3. Submit sharing
4. User gains access based on role
5. Project shows shared status

## Integration Points

### Backend API Integration
- RESTful API calls using dataService
- Error response handling
- Authentication token management
- Request/response typing

### LibreChat Integration
- Uses existing UI components
- Follows established patterns
- Integrates with existing navigation
- Respects user permissions

### Localization
- Uses existing localization system
- Supports multiple languages
- Fallback to English keys

## Future Enhancements

### Planned Features
1. **Real-time Collaboration**: WebSocket integration for live updates
2. **Advanced Permissions**: Fine-grained permission controls
3. **Team Templates**: Pre-configured team setups
4. **Project Analytics**: Usage statistics and insights
5. **Bulk Operations**: Multi-select actions
6. **Search and Filters**: Enhanced discovery features

### Performance Improvements
1. **Virtual Scrolling**: For large lists
2. **Incremental Loading**: Pagination improvements
3. **Better Caching**: More sophisticated cache strategies
4. **Offline Support**: PWA capabilities

### UI Enhancements
1. **Drag and Drop**: For organizing teams/projects
2. **Advanced Modals**: Multi-step wizards
3. **Rich Text Editing**: Better description editing
4. **File Uploads**: Avatar and attachment support

## Testing Strategy

### Unit Tests
- Component rendering tests
- Hook functionality tests
- Utility function tests
- Error handling tests

### Integration Tests
- API interaction tests
- Navigation flow tests
- Form submission tests
- Permission checks tests

### E2E Tests
- Complete user journeys
- Cross-browser compatibility
- Mobile device testing
- Accessibility testing

This frontend implementation provides a complete, production-ready interface for Teams and Projects functionality that seamlessly integrates with LibreChat's existing architecture while providing an intuitive and powerful collaboration experience.