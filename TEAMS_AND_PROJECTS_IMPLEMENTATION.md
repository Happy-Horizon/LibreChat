# Teams and Projects Implementation for LibreChat

This document outlines the complete implementation of Teams/Groups support and Project sharing functionality, similar to ChatGPT's team features.

## Overview

The implementation adds:
- **Teams/Groups**: Users can create teams, invite members, and manage team permissions
- **Project Sharing**: Projects can be shared with individual users or teams
- **Role-based Access Control**: Different permission levels for team members and project access
- **Invitation System**: Secure token-based invitations with expiration

## Database Schema Changes

### New Collections

#### 1. Teams Collection
```javascript
{
  name: String (required, max 100 chars),
  description: String (optional, max 500 chars),
  avatar: String (optional),
  ownerId: ObjectId (required, ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. Team Memberships Collection
```javascript
{
  teamId: ObjectId (required, ref: Team),
  userId: ObjectId (required, ref: User),
  role: String (enum: ['owner', 'admin', 'member', 'viewer']),
  invitedBy: ObjectId (optional, ref: User),
  joinedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. Team Invitations Collection
```javascript
{
  teamId: ObjectId (required, ref: Team),
  inviterUserId: ObjectId (required, ref: User),
  inviteeEmail: String (required),
  inviteeUserId: ObjectId (optional, ref: User),
  role: String (enum: ['admin', 'member', 'viewer']),
  token: String (required, unique),
  expiresAt: Date (required, TTL index),
  acceptedAt: Date (optional),
  createdAt: Date,
  updatedAt: Date
}
```

### Updated Collections

#### Projects Collection (Enhanced)
```javascript
{
  // Existing fields
  name: String,
  promptGroupIds: [ObjectId],
  agentIds: [String],
  
  // New fields
  description: String (optional),
  ownerId: ObjectId (required, ref: User),
  teamId: ObjectId (optional, ref: Team),
  isPublic: Boolean (default: false),
  sharedWith: [{
    userId: ObjectId (ref: User),
    role: String (enum: ['viewer', 'editor', 'admin']),
    sharedAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Teams API (`/api/teams`)

| Method | Endpoint | Description | Auth | Permissions |
|--------|----------|-------------|------|-------------|
| POST | `/` | Create new team | Required | Any user |
| GET | `/` | Get user's teams | Required | Own teams |
| GET | `/:teamId` | Get team details | Required | Team member |
| PUT | `/:teamId` | Update team | Required | Owner/Admin |
| DELETE | `/:teamId` | Delete team | Required | Owner only |
| GET | `/:teamId/members` | Get team members | Required | Team member |
| POST | `/:teamId/invite` | Invite user to team | Required | Owner/Admin |
| DELETE | `/:teamId/members/:userId` | Remove team member | Required | Owner/Admin/Self |
| POST | `/invitations/accept` | Accept team invitation | Required | Invited user |

### Projects API (`/api/projects`)

| Method | Endpoint | Description | Auth | Permissions |
|--------|----------|-------------|------|-------------|
| GET | `/` | Get user's projects | Required | Accessible projects |
| POST | `/` | Create new project | Required | Any user |
| GET | `/:projectId` | Get project details | Required | Project access |
| PUT | `/:projectId` | Update project | Required | Owner/Editor/Admin |
| DELETE | `/:projectId` | Delete project | Required | Owner only |
| GET | `/:projectId/sharing` | Get sharing info | Required | Owner only |
| POST | `/:projectId/share` | Share project | Required | Owner only |
| DELETE | `/:projectId/share/:userId` | Remove sharing | Required | Owner only |

## Permission System

### Team Roles
- **Owner**: Full control, can delete team, manage all members
- **Admin**: Can invite users, manage members (except owners)
- **Member**: Can access team projects, limited management
- **Viewer**: Read-only access to team projects

### Project Access Levels
- **Owner**: Full control, can delete project, manage sharing
- **Admin**: Can edit project, manage team access (if team project)
- **Editor**: Can edit project content and settings
- **Viewer**: Read-only access to project

### Access Priority
1. **Direct ownership** (project owner)
2. **Public access** (if project is public)
3. **Direct sharing** (explicitly shared with user)
4. **Team access** (if user is team member and project belongs to team)

## Key Features

### 1. Team Management
- Create and manage teams with descriptions and avatars
- Hierarchical permission system
- Secure invitation system with expiring tokens
- Member management with role-based access

### 2. Project Sharing
- Share projects with individual users or entire teams
- Multiple sharing levels (viewer, editor, admin)
- Public projects for broader access
- Team-based project organization

### 3. Security Features
- JWT-based authentication for all endpoints
- Permission validation at every access point
- Secure token-based invitations
- Email verification for invitations
- Protection against unauthorized access

### 4. Database Optimizations
- Compound indexes for efficient queries
- TTL indexes for automatic cleanup of expired invitations
- Optimized aggregation pipelines for complex queries

## Implementation Files

### Backend Files
- `packages/data-schemas/src/schema/team.ts` - Team schema
- `packages/data-schemas/src/schema/teamMembership.ts` - Membership schema
- `packages/data-schemas/src/schema/teamInvitation.ts` - Invitation schema
- `packages/data-schemas/src/models/team.ts` - Team model
- `packages/data-schemas/src/models/teamMembership.ts` - Membership model
- `packages/data-schemas/src/models/teamInvitation.ts` - Invitation model
- `packages/data-schemas/src/types/team.ts` - TypeScript interfaces
- `api/models/Team.js` - Team business logic
- `api/models/Project.js` - Enhanced project logic
- `api/server/controllers/TeamController.js` - Team API controller
- `api/server/controllers/ProjectController.js` - Project API controller
- `api/server/routes/teams.js` - Team routes
- `api/server/routes/projects.js` - Project routes

## Usage Examples

### Creating a Team
```javascript
POST /api/teams
{
  "name": "AI Research Team",
  "description": "Team for AI research projects",
  "avatar": "https://example.com/avatar.jpg"
}
```

### Inviting Users to Team
```javascript
POST /api/teams/64f123456789abcdef012345/invite
{
  "email": "user@example.com",
  "role": "member"
}
```

### Creating a Team Project
```javascript
POST /api/projects
{
  "name": "AI Research Project",
  "description": "Our main research project",
  "teamId": "64f123456789abcdef012345",
  "isPublic": false
}
```

### Sharing a Project
```javascript
POST /api/projects/64f123456789abcdef012346/share
{
  "shares": [
    {
      "userId": "64f123456789abcdef012347",
      "role": "editor"
    }
  ]
}
```

## Security Considerations

1. **Authentication**: All endpoints require JWT authentication
2. **Authorization**: Role-based access control for all operations
3. **Data Validation**: Input validation on all endpoints
4. **Rate Limiting**: Should be implemented for invitation endpoints
5. **Email Verification**: Invitation system verifies email ownership
6. **Token Security**: Invitation tokens are cryptographically secure

## Future Enhancements

1. **Email Notifications**: Send actual emails for invitations
2. **Audit Logging**: Track team and project activities
3. **File Sharing**: Extend sharing to files within projects
4. **Team Templates**: Pre-configured team setups
5. **Advanced Permissions**: Fine-grained permission controls
6. **Team Analytics**: Usage statistics and insights

## Testing

To test the implementation:

1. **Create a team**: `POST /api/teams`
2. **Invite users**: `POST /api/teams/:teamId/invite`
3. **Accept invitation**: `POST /api/teams/invitations/accept`
4. **Create team project**: `POST /api/projects` with `teamId`
5. **Share project**: `POST /api/projects/:projectId/share`
6. **Access shared project**: `GET /api/projects/:projectId`

This implementation provides a comprehensive team and project sharing system that mirrors the functionality found in ChatGPT Teams, with robust security and scalability considerations.