# Finoly AI Financial Assistant - API Documentation

## Overview

The Finoly API provides a comprehensive set of endpoints for managing financial workflows for both individual users and SME teams. The API supports multi-tenant architecture with role-based access control, enabling expense tracking, budget management, report generation, forecasting, and smart alerts through an AI-powered financial assistant.

**Base URL**: `https://api.finoly.app`

**API Version**: v1

**Authentication**: JWT (JSON Web Token) via NextAuth

**Data Format**: JSON

**Rate Limiting**: Varies by endpoint (specified in each section)

## Architecture Overview

### Account Types

- **Individual Account**: Personal financial management with individual dashboards
- **Business Account**: Multi-tenant business with teams, roles, and permissions

### Multi-Tenant Structure

- **Business (Tenant)**: Top-level organization with multiple teams
- **Teams**: Departments or groups within a business (e.g., Marketing, Finance, Sales)
- **Users**: Can belong to multiple teams within the same business
- **Roles**: Team-scoped, fully customizable roles with granular permissions

### Flexible Role System

- **No Predetermined Roles**: Business owners create custom roles with any name
- **Team-Specific Roles**: Each role belongs to a specific team and cannot be used across teams
- **Granular Permissions**: Each role can have any combination of create, read, update, delete permissions
- **User Assignment**: Users can only be assigned roles that exist within their team

### Access Control Model

- **Hybrid ABAC/RBAC**: Role-based permissions with attribute-based scoping
- **Tenant Isolation**: Complete data isolation between businesses
- **Team-Scoped Access**: Users can only access data from their assigned teams
- **Permission-Based Operations**: All operations require specific permissions from user's role

## Authentication

All API endpoints require authentication via JWT tokens unless explicitly stated otherwise. The API uses NextAuth for session management with JWT strategy.

### Token Format

```http
Authorization: Bearer <jwt_token>
```

### Token Structure

```json
{
  "id": "user_id",
  "email": "user@example.com",
  "accountType": "individual|business",
  "businessId": "business_id",
  "teams": [
    {
      "teamId": "team_id",
      "roleId": "role_id",
      "roleName": "Custom Role Name",
      "permissions": [
        "create_expense",
        "read_budget",
        "update_expense",
        "read_report"
      ]
    }
  ],
  "iat": 1640995200,
  "exp": 1640998800
}
```

**Token Expiration**: 30 minutes (refreshable)

---

## API Endpoint Permission Requirements

### Core Financial Operations

| Endpoint                   | HTTP Method | Required Permission(s)                             | Notes                     |
| -------------------------- | ----------- | -------------------------------------------------- | ------------------------- |
| `POST /api/expenses`       | POST        | `create_expense`                                   | Create new expense record |
| `GET /api/expenses`        | GET         | `read_expense`                                     | View expense records      |
| `PUT /api/expenses/:id`    | PUT         | `update_expense`                                   | Modify existing expense   |
| `DELETE /api/expenses/:id` | DELETE      | `delete_expense`                                   | Remove expense record     |
| `POST /api/budgets`        | POST        | `create_budget`                                    | Create new budget         |
| `GET /api/budgets`         | GET         | `read_budget`                                      | View budget information   |
| `PUT /api/budgets/:id`     | PUT         | `update_budget`                                    | Modify existing budget    |
| `DELETE /api/budgets/:id`  | DELETE      | `delete_budget`                                    | Remove budget             |
| `GET /api/reports`         | GET         | `create_report` + `read_expense` + `read_budget`   | Generate reports          |
| `POST /api/forecasts`      | POST        | `create_forecast` + `read_expense` + `read_budget` | Create forecast           |
| `POST /api/alerts`         | POST        | `create_alert` + `read_budget`                     | Create budget alert       |

### Team Management Operations

| Endpoint                                | HTTP Method | Required Permission(s) | Notes                 |
| --------------------------------------- | ----------- | ---------------------- | --------------------- |
| `POST /api/teams`                       | POST        | Business Owner Only    | Create new team       |
| `GET /api/teams`                        | GET         | Team Member            | View accessible teams |
| `PUT /api/teams/:id`                    | PUT         | `update_team`          | Modify team details   |
| `DELETE /api/teams/:id`                 | DELETE      | `delete_team`          | Remove team           |
| `POST /api/teams/:id/members`           | POST        | `create_user`          | Add user to team      |
| `DELETE /api/teams/:id/members/:userId` | DELETE      | `delete_user`          | Remove user from team |

### Role Management Operations

| Endpoint                                  | HTTP Method | Required Permission(s) | Notes                   |
| ----------------------------------------- | ----------- | ---------------------- | ----------------------- |
| `POST /api/teams/:teamId/roles`           | POST        | `create_role`          | Create custom role      |
| `GET /api/teams/:teamId/roles`            | GET         | `read_role`            | View team roles         |
| `PUT /api/teams/:teamId/roles/:roleId`    | PUT         | `update_role`          | Modify role permissions |
| `DELETE /api/teams/:teamId/roles/:roleId` | DELETE      | `delete_role`          | Remove role             |

### Permission Validation Examples

**Example 1: Creating an Expense**

```http
POST /api/expenses
Authorization: Bearer <jwt_token>
```

**Validation Process:**

1. Extract user context from JWT token
2. Check if user belongs to business
3. Check if user is member of target team
4. Check if user's role has `create_expense` permission
5. Allow/deny request based on validation

**Example 2: Generating a Report**

```http
GET /api/reports?teamId=team_789ghi
Authorization: Bearer <jwt_token>
```

**Validation Process:**

1. Extract user context from JWT token
2. Check if user belongs to business
3. Check if user is member of target team
4. Check if user's role has ALL required permissions: `create_report`, `read_expense`, `read_budget`
5. Allow/deny request based on validation

**Example 3: Cross-Resource Permission Check**

```json
{
  "userId": "usr_123abc",
  "action": "create_report",
  "teamId": "team_789ghi",
  "userPermissions": ["read_expense", "read_budget"],
  "requiredPermissions": ["create_report", "read_expense", "read_budget"]
}
```

**Result**: ❌ **Denied** - User missing `create_report` permission

---

## Authentication Endpoints

### Sign Up

Create a new user account (Individual or Business).

**Endpoint**: `POST /api/auth/signup`

**Rate Limit**: 5 requests per minute per IP

**Headers**:

```http
Content-Type: application/json
```

**Request Body**:

```json
{
  "accountType": "individual",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "confirmPassword": "securePassword123",
  "phone": "+1234567890"
}
```

**For Business Account**:

```json
{
  "accountType": "business",
  "businessName": "Acme Corp",
  "ownerName": "John Doe",
  "email": "john@acme.com",
  "password": "securePassword123",
  "confirmPassword": "securePassword123",
  "phone": "+1234567890"
}
```

**Request Body Fields**:

- `accountType` (string, required): "individual" or "business"
- `name` (string, required): User's full name (for individual) or `ownerName` (for business)
- `businessName` (string, required for business): Business name
- `email` (string, required): Valid email address
- `password` (string, required): Password (min 8 characters, must contain uppercase, lowercase, number)
- `confirmPassword` (string, required): Password confirmation
- `phone` (string, optional): Phone number in international format

**Success Response** (201):

```json
{
  "status": "success",
  "message": "Account created successfully",
  "data": {
    "userId": "usr_123abc",
    "email": "john@example.com",
    "accountType": "business",
    "businessId": "biz_456def",
    "businessName": "Acme Corp",
    "role": "owner",
    "verificationRequired": true
  }
}
```

**Error Responses**:

**400 Bad Request**:

```json
{
  "error": "Validation error",
  "message": "Email already exists",
  "details": {
    "field": "email",
    "code": "DUPLICATE_EMAIL"
  }
}
```

**422 Unprocessable Entity**:

```json
{
  "error": "Validation error",
  "message": "Password confirmation does not match",
  "details": {
    "field": "confirmPassword",
    "code": "PASSWORD_MISMATCH"
  }
}
```

### Sign In

Authenticate user and receive JWT token.

**Endpoint**: `POST /api/auth/login`

**Rate Limit**: 10 requests per minute per IP

**Headers**:

```http
Content-Type: application/json
```

**Request Body**:

```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Success Response** (200):

```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": "usr_123abc",
      "email": "john@example.com",
      "name": "John Doe",
      "accountType": "business",
      "businessId": "biz_456def",
      "businessName": "Acme Corp",
      "role": "owner",
      "teams": [
        {
          "teamId": "team_789ghi",
          "teamName": "Marketing",
          "role": "admin"
        }
      ]
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 1800
  }
}
```

**Error Responses**:

**401 Unauthorized**:

```json
{
  "error": "Authentication failed",
  "message": "Invalid email or password",
  "code": "INVALID_CREDENTIALS"
}
```

### Verify Account

Verify user account via email or phone.

**Endpoint**: `POST /api/auth/verify`

**Rate Limit**: 5 requests per minute per user

**Headers**:

```http
Content-Type: application/json
```

**Request Body**:

```json
{
  "type": "email",
  "token": "abc123def456",
  "userId": "usr_123abc"
}
```

**Success Response** (200):

```json
{
  "status": "success",
  "message": "Account verified successfully",
  "data": {
    "verified": true,
    "type": "email"
  }
}
```

---

## Business Management API

### Get Business Details

Retrieve business information (Business Owner/Tenant Admin only).

**Endpoint**: `GET /api/business`

**Rate Limit**: 50 requests per minute per user

**Required Permission**: Business Owner

**Headers**:

```http
Authorization: Bearer <jwt_token>
```

**Success Response** (200):

```json
{
  "status": "success",
  "data": {
    "id": "biz_456def",
    "name": "Acme Corp",
    "owner": {
      "id": "usr_123abc",
      "name": "John Doe",
      "email": "john@acme.com"
    },
    "teamsCount": 5,
    "usersCount": 25,
    "totalExpenses": 125000,
    "activeBudgets": 8,
    "createdAt": "2024-01-15T10:30:00Z",
    "subscription": {
      "plan": "premium",
      "status": "active",
      "expiresAt": "2024-12-31T23:59:59Z"
    }
  }
}
```

### Update Business Details

Update business information.

**Endpoint**: `PUT /api/business`

**Rate Limit**: 10 requests per minute per user

**Required Permission**: Business Owner

**Headers**:

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:

```json
{
  "name": "Acme Corporation",
  "settings": {
    "defaultCurrency": "USD",
    "fiscalYearStart": "2024-01-01",
    "timezone": "UTC"
  }
}
```

**Success Response** (200):

```json
{
  "status": "success",
  "message": "Business updated successfully",
  "data": {
    "id": "biz_456def",
    "name": "Acme Corporation",
    "settings": {
      "defaultCurrency": "USD",
      "fiscalYearStart": "2024-01-01",
      "timezone": "UTC"
    },
    "updatedAt": "2024-01-20T15:30:00Z"
  }
}
```

---

## Users API

### Get User Profile

Retrieve current user's profile information.

**Endpoint**: `GET /api/users/profile`

**Rate Limit**: 100 requests per minute per user

**Headers**:

```http
Authorization: Bearer <jwt_token>
```

**Success Response** (200):

```json
{
  "status": "success",
  "data": {
    "id": "usr_123abc",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "accountType": "business",
    "businessId": "biz_456def",
    "businessName": "Acme Corp",
    "role": "owner",
    "teams": [
      {
        "id": "team_789ghi",
        "name": "Marketing Team",
        "roleId": "role_123abc",
        "roleName": "Marketing Director",
        "permissions": ["create", "read", "update", "delete"]
      },
      {
        "id": "team_456def",
        "name": "Finance Team",
        "roleId": "role_789ghi",
        "roleName": "Budget Reviewer",
        "permissions": ["read", "update"]
      }
    ],
    "preferences": {
      "currency": "USD",
      "timezone": "UTC",
      "notifications": {
        "email": true,
        "whatsapp": true,
        "web": true
      }
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "lastLoginAt": "2024-01-20T14:22:00Z"
  }
}
```

### Add User to Business

Add a user to a business and assign to teams (Business Owner only).

**Endpoint**: `POST /api/users`

**Rate Limit**: 10 requests per minute per user

**Required Permission**: Business Owner

**Headers**:

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:

```json
{
  "name": "Jane Smith",
  "email": "jane@acme.com",
  "teams": [
    {
      "teamId": "team_789ghi",
      "roleId": "role_123abc"
    }
  ],
  "sendInvitation": true
}
```

**Success Response** (201):

```json
{
  "status": "success",
  "message": "User added successfully",
  "data": {
    "id": "usr_456def",
    "name": "Jane Smith",
    "email": "jane@acme.com",
    "businessId": "biz_456def",
    "teams": [
      {
        "teamId": "team_789ghi",
        "teamName": "Marketing Team",
        "roleId": "role_123abc",
        "roleName": "Manager"
      }
    ],
    "invitationSent": true,
    "createdAt": "2024-01-20T15:30:00Z"
  }
}
```

### List Business Users

Get all users in the business (Business Owner only).

**Endpoint**: `GET /api/users`

**Rate Limit**: 50 requests per minute per user

**Required Permission**: Business Owner

**Headers**:

```http
Authorization: Bearer <jwt_token>
```

**Query Parameters**:

- `teamId` (string, optional): Filter by team ID
- `role` (string, optional): Filter by role name
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Results per page (default: 10, max: 100)

**Success Response** (200):

```json
{
  "status": "success",
  "data": {
    "users": [
      {
        "id": "usr_456def",
        "name": "Jane Smith",
        "email": "jane@acme.com",
        "teams": [
          {
            "teamId": "team_789ghi",
            "teamName": "Marketing Team",
            "roleName": "Manager"
          }
        ],
        "lastLoginAt": "2024-01-20T14:22:00Z",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

### Remove User from Business

Remove a user from the business (Business Owner only).

**Endpoint**: `DELETE /api/users/:userId`

**Rate Limit**: 10 requests per minute per user

**Required Permission**: Business Owner

**Headers**:

```http
Authorization: Bearer <jwt_token>
```

**Path Parameters**:

- `userId` (string, required): User ID to remove

**Success Response** (200):

```json
{
  "status": "success",
  "message": "User removed from business successfully",
  "data": {
    "userId": "usr_456def",
    "removedAt": "2024-01-20T15:30:00Z"
  }
}
```

---

## Teams API

### Create Team

Create a new team within the business.

**Endpoint**: `POST /api/teams`

**Rate Limit**: 10 requests per minute per user

**Required Permission**: Business Owner

**Headers**:

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:

```json
{
  "name": "Marketing Team",
  "description": "Team for marketing expenses and budgets",
  "adminUserId": "usr_123abc",
  "members": [
    {
      "userId": "usr_456def",
      "roleId": "role_123abc"
    }
  ]
}
```

**Request Body Fields**:

- `name` (string, required): Team name (3-50 characters)
- `description` (string, optional): Team description (max 200 characters)
- `adminUserId` (string, required): User ID of team admin
- `members` (array, optional): Array of user-role assignments

**Success Response** (201):

```json
{
  "status": "success",
  "message": "Team created successfully",
  "data": {
    "id": "team_789ghi",
    "name": "Marketing Team",
    "description": "Team for marketing expenses and budgets",
    "businessId": "biz_456def",
    "adminUserId": "usr_123abc",
    "members": [
      {
        "userId": "usr_456def",
        "name": "Jane Smith",
        "roleId": "role_123abc",
        "roleName": "Marketing Specialist",
        "permissions": ["create", "read", "update"],
        "joinedAt": "2024-01-20T15:30:00Z"
      }
    ],
    "defaultRoles": [
      {
        "id": "role_123abc",
        "name": "Marketing Specialist",
        "permissions": ["create", "read", "update"]
      },
      {
        "id": "role_456def",
        "name": "Team Lead",
        "permissions": ["create", "read", "update", "delete"]
      }
    ],
    "createdAt": "2024-01-20T15:30:00Z"
  }
}
```

### List Teams

Get all teams for the authenticated user.

**Endpoint**: `GET /api/teams`

**Rate Limit**: 100 requests per minute per user

**Headers**:

```http
Authorization: Bearer <jwt_token>
```

**Query Parameters**:

- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Results per page (default: 10, max: 100)

**Success Response** (200):

```json
{
  "status": "success",
  "data": {
    "teams": [
      {
        "id": "team_789ghi",
        "name": "Marketing Team",
        "description": "Team for marketing expenses and budgets",
        "userRole": "admin",
        "userPermissions": ["create", "read", "update", "delete"],
        "memberCount": 5,
        "budgetCount": 3,
        "totalExpenses": 15000,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 2,
      "totalPages": 1
    }
  }
}
```

### Get Team Details

Get detailed information about a specific team.

**Endpoint**: `GET /api/teams/:id`

**Rate Limit**: 100 requests per minute per user

**Required Permission**: Team Member

**Headers**:

```http
Authorization: Bearer <jwt_token>
```

**Path Parameters**:

- `id` (string, required): Team ID

**Success Response** (200):

```json
{
  "status": "success",
  "data": {
    "id": "team_789ghi",
    "name": "Marketing Team",
    "description": "Team for marketing expenses and budgets",
    "businessId": "biz_456def",
    "businessName": "Acme Corp",
    "admin": {
      "id": "usr_123abc",
      "name": "John Doe",
      "email": "john@acme.com"
    },
    "members": [
      {
        "id": "usr_456def",
        "name": "Jane Smith",
        "email": "jane@acme.com",
        "roleId": "role_123abc",
        "roleName": "Marketing Specialist",
        "permissions": ["create", "read", "update"],
        "joinedAt": "2024-01-15T10:30:00Z"
      },
      {
        "id": "usr_789ghi",
        "name": "Bob Johnson",
        "email": "bob@acme.com",
        "roleId": "role_456def",
        "roleName": "Campaign Manager",
        "permissions": ["create", "read", "update", "delete"],
        "joinedAt": "2024-01-16T11:45:00Z"
      }
    ],
    "roles": [
      {
        "id": "role_123abc",
        "name": "Marketing Specialist",
        "permissions": ["create", "read", "update"],
        "userCount": 3
      },
      {
        "id": "role_456def",
        "name": "Campaign Manager",
        "permissions": ["create", "read", "update", "delete"],
        "userCount": 2
      },
      {
        "id": "role_789ghi",
        "name": "Data Analyst",
        "permissions": ["read"],
        "userCount": 1
      }
    ],
    "budgets": [
      {
        "id": "budget_123",
        "period": "Q1-2024",
        "amount": 10000,
        "spent": 6500,
        "categories": ["ads", "events"]
      }
    ],
    "stats": {
      "totalExpenses": 15000,
      "monthlyAverage": 5000,
      "topCategories": [
        { "category": "ads", "amount": 8000 },
        { "category": "events", "amount": 4000 }
      ]
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-20T15:30:00Z"
  }
}
```

### Assign User to Team

Assign a user to a team with a specific role (role must exist within the team).

**Endpoint**: `POST /api/teams/:id/members`

**Rate Limit**: 10 requests per minute per user

**Required Permission**: Team Admin or Business Owner

**Headers**:

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Path Parameters**:

- `id` (string, required): Team ID

**Request Body**:

```json
{
  "userId": "usr_789ghi",
  "roleId": "role_456def"
}
```

**Request Body Fields**:

- `userId` (string, required): User ID to assign (must be within the same business)
- `roleId` (string, required): Role ID to assign (must exist within this specific team)

**Success Response** (200):

```json
{
  "status": "success",
  "message": "User assigned to team successfully",
  "data": {
    "userId": "usr_789ghi",
    "userName": "Alice Johnson",
    "userEmail": "alice@acme.com",
    "teamId": "team_789ghi",
    "teamName": "Marketing Team",
    "roleId": "role_456def",
    "roleName": "Budget Reviewer",
    "permissions": ["read", "update"],
    "assignedAt": "2024-01-20T15:30:00Z",
    "assignedBy": {
      "id": "usr_123abc",
      "name": "John Doe",
      "role": "Business Owner"
    }
  }
}
```

**Error Responses**:

**400 Bad Request - Invalid Role**:

```json
{
  "error": "Invalid role assignment",
  "message": "Role does not exist in this team",
  "details": {
    "roleId": "role_456def",
    "teamId": "team_789ghi",
    "code": "ROLE_NOT_IN_TEAM"
  }
}
```

**400 Bad Request - User Not in Business**:

```json
{
  "error": "Invalid user assignment",
  "message": "User does not belong to this business",
  "details": {
    "userId": "usr_789ghi",
    "businessId": "biz_456def",
    "code": "USER_NOT_IN_BUSINESS"
  }
}
```

**409 Conflict - User Already in Team**:

```json
{
  "error": "User already assigned",
  "message": "User is already a member of this team",
  "details": {
    "userId": "usr_789ghi",
    "teamId": "team_789ghi",
    "currentRoleId": "role_123abc",
    "currentRoleName": "Team Lead",
    "code": "USER_ALREADY_IN_TEAM"
  }
}
```

**Validation Rules**:

- User must belong to the same business as the team
- Role must exist within the specific team (roles are team-scoped)
- User cannot be assigned to the same team twice
- Only business owners or team admins can assign users to teams

### Remove User from Team

Remove a user from a team.

**Endpoint**: `DELETE /api/teams/:id/members/:userId`

**Rate Limit**: 10 requests per minute per user

**Required Permission**: Team Admin or Business Owner

**Headers**:

```http
Authorization: Bearer <jwt_token>
```

**Path Parameters**:

- `id` (string, required): Team ID
- `userId` (string, required): User ID to remove

**Success Response** (200):

```json
{
  "status": "success",
  "message": "User removed from team successfully",
  "data": {
    "userId": "usr_789ghi",
    "teamId": "team_789ghi",
    "removedAt": "2024-01-20T15:30:00Z"
  }
}
```

---

## Roles & Permissions API

### Create Role

Create a new custom role within a team (Business Owner or Team Admin only).

**Endpoint**: `POST /api/teams/:teamId/roles`

**Rate Limit**: 10 requests per minute per user

**Required Permission**: Business Owner or Team Admin

**Headers**:

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Path Parameters**:

- `teamId` (string, required): Team ID

**Request Body**:

```json
{
  "name": "Senior Marketing Analyst",
  "description": "Can create and manage marketing campaigns but cannot delete budgets",
  "permissions": [
    "create_expense",
    "read_expense",
    "update_expense",
    "read_budget",
    "read_report",
    "create_report"
  ]
}
```

**Alternative Examples**:

```json
{
  "name": "Budget Reviewer",
  "description": "Can only view budgets and expenses for review",
  "permissions": ["read_budget", "read_expense", "read_report"]
}
```

```json
{
  "name": "Department Head",
  "description": "Full access to all department resources",
  "permissions": [
    "create_expense",
    "read_expense",
    "update_expense",
    "delete_expense",
    "create_budget",
    "read_budget",
    "update_budget",
    "delete_budget",
    "create_report",
    "read_report",
    "update_report",
    "delete_report",
    "create_forecast",
    "read_forecast",
    "update_forecast",
    "delete_forecast",
    "create_alert",
    "read_alert",
    "update_alert",
    "delete_alert",
    "read_receipt",
    "update_receipt"
  ]
}
```

```json
{
  "name": "Expense Tracker",
  "description": "Can create and manage expenses but cannot access budgets",
  "permissions": [
    "create_expense",
    "read_expense",
    "update_expense",
    "create_receipt",
    "read_receipt"
  ]
}
```

```json
{
  "name": "Financial Analyst",
  "description": "Read-only access to all financial data for analysis",
  "permissions": ["read_expense", "read_budget", "read_report", "read_forecast"]
}
```

**Request Body Fields**:

- `name` (string, required): Custom role name (3-50 characters, any name allowed)
- `description` (string, optional): Role description (max 200 characters)
- `permissions` (array, required): Array of resource-specific permission strings

**Available Resources & Permissions**:

| Resource      | Available Permissions                                                    |
| ------------- | ------------------------------------------------------------------------ |
| **Expenses**  | `create_expense`, `read_expense`, `update_expense`, `delete_expense`     |
| **Budgets**   | `create_budget`, `read_budget`, `update_budget`, `delete_budget`         |
| **Reports**   | `create_report`, `read_report`, `update_report`, `delete_report`         |
| **Forecasts** | `create_forecast`, `read_forecast`, `update_forecast`, `delete_forecast` |
| **Alerts**    | `create_alert`, `read_alert`, `update_alert`, `delete_alert`             |
| **Receipts**  | `create_receipt`, `read_receipt`, `update_receipt`, `delete_receipt`     |
| **Teams**     | `create_team`, `read_team`, `update_team`, `delete_team`                 |
| **Users**     | `create_user`, `read_user`, `update_user`, `delete_user`                 |
| **Roles**     | `create_role`, `read_role`, `update_role`, `delete_role`                 |

**Permission Examples by Role Type**:

- **Budget Manager**: `["create_budget", "read_budget", "update_budget", "read_expense", "read_report"]`
- **Expense Approver**: `["read_expense", "update_expense", "read_budget"]`
- **Data Analyst**: `["read_expense", "read_budget", "read_report", "read_forecast"]`
- **Team Admin**: `["create_user", "read_user", "update_user", "create_role", "read_role", "update_role"]`

**Success Response** (201):

```json
{
  "status": "success",
  "message": "Role created successfully",
  "data": {
    "id": "role_789ghi",
    "name": "Senior Marketing Analyst",
    "description": "Can create and manage marketing campaigns but cannot delete budgets",
    "permissions": [
      "create_expense",
      "read_expense",
      "update_expense",
      "read_budget",
      "read_report",
      "create_report"
    ],
    "permissionsByResource": {
      "expenses": ["create", "read", "update"],
      "budgets": ["read"],
      "reports": ["read", "create"],
      "forecasts": [],
      "alerts": [],
      "receipts": [],
      "teams": [],
      "users": [],
      "roles": []
    },
    "teamId": "team_789ghi",
    "teamName": "Marketing Team",
    "businessId": "biz_456def",
    "createdAt": "2024-01-20T15:30:00Z",
    "createdBy": {
      "id": "usr_123abc",
      "name": "John Doe",
      "role": "Business Owner"
    }
  }
}
```

**Error Responses**:

**400 Bad Request**:

```json
{
  "error": "Validation error",
  "message": "Role name already exists in this team",
  "details": {
    "field": "name",
    "code": "DUPLICATE_ROLE_NAME",
    "teamId": "team_789ghi"
  }
}
```

**403 Forbidden**:

```json
{
  "error": "Insufficient permissions",
  "message": "Only business owners or team admins can create roles",
  "code": "PERMISSION_DENIED"
}
```

**Validation Rules**:

- Role names must be unique within each team (but can be same across different teams)
- At least one permission must be specified
- Role names can contain letters, numbers, spaces, and basic punctuation
- Business owners can create roles for any team in their business
- Team admins can only create roles for their own team

### List Team Roles

Get all custom roles within a team.

**Endpoint**: `GET /api/teams/:teamId/roles`

**Rate Limit**: 50 requests per minute per user

**Required Permission**: Team Member

**Headers**:

```http
Authorization: Bearer <jwt_token>
```

**Path Parameters**:

- `teamId` (string, required): Team ID

**Success Response** (200):

```json
{
  "status": "success",
  "data": {
    "roles": [
      {
        "id": "role_123abc",
        "name": "Team Lead",
        "description": "Full access to all team resources",
        "permissions": [
          "create_expense",
          "read_expense",
          "update_expense",
          "delete_expense",
          "create_budget",
          "read_budget",
          "update_budget",
          "delete_budget",
          "create_report",
          "read_report",
          "update_report",
          "delete_report",
          "create_forecast",
          "read_forecast",
          "update_forecast",
          "delete_forecast",
          "create_alert",
          "read_alert",
          "update_alert",
          "delete_alert"
        ],
        "permissionsByResource": {
          "expenses": ["create", "read", "update", "delete"],
          "budgets": ["create", "read", "update", "delete"],
          "reports": ["create", "read", "update", "delete"],
          "forecasts": ["create", "read", "update", "delete"],
          "alerts": ["create", "read", "update", "delete"]
        },
        "userCount": 1,
        "createdAt": "2024-01-15T10:30:00Z",
        "createdBy": {
          "id": "usr_123abc",
          "name": "John Doe"
        }
      },
      {
        "id": "role_456def",
        "name": "Budget Reviewer",
        "description": "Can only view and approve budgets",
        "permissions": [
          "read_budget",
          "update_budget",
          "read_expense",
          "read_report"
        ],
        "permissionsByResource": {
          "expenses": ["read"],
          "budgets": ["read", "update"],
          "reports": ["read"],
          "forecasts": [],
          "alerts": []
        },
        "userCount": 3,
        "createdAt": "2024-01-16T11:45:00Z",
        "createdBy": {
          "id": "usr_123abc",
          "name": "John Doe"
        }
      },
      {
        "id": "role_789ghi",
        "name": "Expense Tracker",
        "description": "Can create and view expenses but cannot modify budgets",
        "permissions": [
          "create_expense",
          "read_expense",
          "update_expense",
          "create_receipt",
          "read_receipt"
        ],
        "permissionsByResource": {
          "expenses": ["create", "read", "update"],
          "budgets": [],
          "reports": [],
          "forecasts": [],
          "alerts": [],
          "receipts": ["create", "read"]
        },
        "userCount": 5,
        "createdAt": "2024-01-17T09:20:00Z",
        "createdBy": {
          "id": "usr_123abc",
          "name": "John Doe"
        }
      },
      {
        "id": "role_012jkl",
        "name": "Financial Analyst",
        "description": "Read-only access to all financial data for analysis",
        "permissions": [
          "read_expense",
          "read_budget",
          "read_report",
          "read_forecast"
        ],
        "permissionsByResource": {
          "expenses": ["read"],
          "budgets": ["read"],
          "reports": ["read"],
          "forecasts": ["read"],
          "alerts": []
        },
        "userCount": 2,
        "createdAt": "2024-01-18T14:15:00Z",
        "createdBy": {
          "id": "usr_123abc",
          "name": "John Doe"
        }
      }
    ],
    "summary": {
      "totalRoles": 4,
      "totalUsers": 11,
      "resourcePermissionDistribution": {
        "expenses": {
          "create": 2,
          "read": 4,
          "update": 2,
          "delete": 1
        },
        "budgets": {
          "create": 1,
          "read": 3,
          "update": 2,
          "delete": 1
        },
        "reports": {
          "create": 1,
          "read": 3,
          "update": 1,
          "delete": 1
        }
      }
    }
  }
}
```

**Notes**:

- All roles are custom-created by business owners or team admins
- Each role can have any combination of permissions
- Role names are unique within each team but can be repeated across different teams
- Users can only be assigned roles that exist within their team

### Update Role

Update an existing role.

**Endpoint**: `PUT /api/teams/:teamId/roles/:roleId`

**Rate Limit**: 10 requests per minute per user

**Required Permission**: Team Admin or Business Owner

**Headers**:

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Path Parameters**:

- `teamId` (string, required): Team ID
- `roleId` (string, required): Role ID

**Request Body**:

```json
{
  "name": "Senior Budget Manager",
  "description": "Updated description",
  "permissions": ["create", "read", "update", "delete"]
}
```

**Success Response** (200):

```json
{
  "status": "success",
  "message": "Role updated successfully",
  "data": {
    "id": "role_789ghi",
    "name": "Senior Budget Manager",
    "description": "Updated description",
    "permissions": ["create", "read", "update", "delete"],
    "updatedAt": "2024-01-20T16:30:00Z"
  }
}
```

### Delete Role

Delete a custom role (users with this role will need to be reassigned).

**Endpoint**: `DELETE /api/teams/:teamId/roles/:roleId`

**Rate Limit**: 5 requests per minute per user

**Required Permission**: Business Owner or Team Admin

**Headers**:

```http
Authorization: Bearer <jwt_token>
```

**Path Parameters**:

- `teamId` (string, required): Team ID
- `roleId` (string, required): Role ID

**Query Parameters**:

- `reassignToRoleId` (string, optional): Role ID to reassign users to (must exist in same team)

**Success Response** (200):

```json
{
  "status": "success",
  "message": "Role deleted successfully",
  "data": {
    "roleId": "role_789ghi",
    "roleName": "Senior Marketing Analyst",
    "teamId": "team_789ghi",
    "affectedUsers": 3,
    "reassignedToRole": {
      "id": "role_456def",
      "name": "Budget Reviewer"
    },
    "deletedAt": "2024-01-20T16:30:00Z",
    "deletedBy": {
      "id": "usr_123abc",
      "name": "John Doe"
    }
  }
}
```

**Error Responses**:

**400 Bad Request - No Reassignment Role**:

```json
{
  "error": "Reassignment required",
  "message": "Must specify reassignToRoleId when deleting role with assigned users",
  "details": {
    "roleId": "role_789ghi",
    "affectedUsers": 3,
    "code": "REASSIGNMENT_REQUIRED"
  }
}
```

**400 Bad Request - Invalid Reassignment Role**:

```json
{
  "error": "Invalid reassignment role",
  "message": "Reassignment role does not exist in this team",
  "details": {
    "reassignToRoleId": "role_999xyz",
    "teamId": "team_789ghi",
    "code": "REASSIGN_ROLE_NOT_FOUND"
  }
}
```

**Validation Rules**:

- Cannot delete a role that has users assigned without specifying a reassignment role
- Reassignment role must exist within the same team
- Only business owners or team admins can delete roles
- At least one role must exist in each team (cannot delete the last role)

---

## Expenses API

### Add Expense

Create a new expense record.

**Endpoint**: `POST /api/expenses`

**Rate Limit**: 20 requests per minute per user

**Required Permission**: `create_expense`

**Headers**:

```http
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Request Body (Form Data)**:

```
amount: 250.50
category: "ads"
description: "Google Ads campaign"
date: "2024-01-20"
teamId: "team_789ghi"
receipt: [file] (optional)
```

**Request Body Fields**:

- `amount` (number, required): Expense amount (positive number)
- `category` (string, required): Expense category (1-20 characters)
- `description` (string, optional): Expense description (max 200 characters)
- `date` (string, required): Expense date (ISO 8601 format)
- `teamId` (string, required): Team ID
- `receipt` (file, optional): Receipt image (JPEG/PNG, max 5MB)

**Success Response** (201):

```json
{
  "status": "success",
  "message": "Expense created successfully",
  "data": {
    "id": "exp_123abc",
    "amount": 250.5,
    "category": "ads",
    "description": "Google Ads campaign",
    "date": "2024-01-20T00:00:00Z",
    "teamId": "team_789ghi",
    "userId": "usr_123abc",
    "businessId": "biz_456def",
    "receiptUrl": "https://storage.vultr.com/receipts/rec_123.jpg",
    "reconciled": false,
    "createdAt": "2024-01-20T15:30:00Z",
    "budget": {
      "id": "budget_123",
      "amount": 10000,
      "spent": 6750.5,
      "remaining": 3249.5,
      "percentageUsed": 67.5
    }
  }
}
```

**Error Responses**:

**403 Forbidden**:

```json
{
  "error": "Insufficient permissions",
  "message": "You don't have permission to create expenses for this team",
  "code": "PERMISSION_DENIED",
  "details": {
    "requiredPermission": "create_expense",
    "userPermissions": ["read_expense", "read_budget"],
    "teamId": "team_789ghi",
    "roleName": "Financial Analyst"
  }
}
```

### Get Expenses

Retrieve expenses based on filters (respects team access).

**Endpoint**: `GET /api/expenses`

**Rate Limit**: 50 requests per minute per user

**Required Permission**: `read_expense`

**Headers**:

```http
Authorization: Bearer <jwt_token>
```

**Query Parameters**:

- `teamId` (string, optional): Filter by team ID (only accessible teams)
- `category` (string, optional): Filter by category
- `period` (string, optional): Filter by period (e.g., "Q1-2024", "2024-01")
- `userId` (string, optional): Filter by user ID
- `reconciled` (boolean, optional): Filter by reconciliation status
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Results per page (default: 20, max: 100)
- `sortBy` (string, optional): Sort field ("date", "amount", "category", default: "date")
- `sortOrder` (string, optional): Sort order ("asc", "desc", default: "desc")

**Success Response** (200):

```json
{
  "status": "success",
  "data": {
    "expenses": [
      {
        "id": "exp_123abc",
        "amount": 250.5,
        "category": "ads",
        "description": "Google Ads campaign",
        "date": "2024-01-20T00:00:00Z",
        "user": {
          "id": "usr_123abc",
          "name": "John Doe",
          "email": "john@acme.com"
        },
        "team": {
          "id": "team_789ghi",
          "name": "Marketing Team"
        },
        "business": {
          "id": "biz_456def",
          "name": "Acme Corp"
        },
        "receiptUrl": "https://storage.vultr.com/receipts/rec_123.jpg",
        "reconciled": true,
        "createdAt": "2024-01-20T15:30:00Z"
      }
    ],
    "summary": {
      "totalAmount": 15000,
      "totalCount": 45,
      "categoryBreakdown": [
        { "category": "ads", "amount": 8000, "count": 12 },
        { "category": "events", "amount": 4000, "count": 8 }
      ],
      "reconciliationStats": {
        "reconciled": 38,
        "unreconciled": 7,
        "reconciliationRate": 84.4
      }
    },
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

### Update Expense

Update an existing expense.

**Endpoint**: `PUT /api/expenses/:id`

**Rate Limit**: 10 requests per minute per user

**Required Permission**: Team Member with "update" permission

**Headers**:

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Path Parameters**:

- `id` (string, required): Expense ID

**Request Body**:

```json
{
  "amount": 275.0,
  "category": "advertising",
  "description": "Updated Google Ads campaign",
  "date": "2024-01-20"
}
```

**Success Response** (200):

```json
{
  "status": "success",
  "message": "Expense updated successfully",
  "data": {
    "id": "exp_123abc",
    "amount": 275.0,
    "category": "advertising",
    "description": "Updated Google Ads campaign",
    "date": "2024-01-20T00:00:00Z",
    "updatedAt": "2024-01-20T16:30:00Z",
    "budgetImpact": {
      "oldSpent": 6750.5,
      "newSpent": 6775.0,
      "difference": 24.5
    }
  }
}
```

### Delete Expense

Delete an expense (soft delete).

**Endpoint**: `DELETE /api/expenses/:id`

**Rate Limit**: 5 requests per minute per user

**Required Permission**: Team Member with "delete" permission

**Headers**:

```http
Authorization: Bearer <jwt_token>
```

**Path Parameters**:

- `id` (string, required): Expense ID

**Success Response** (200):

```json
{
  "status": "success",
  "message": "Expense deleted successfully",
  "data": {
    "id": "exp_123abc",
    "deletedAt": "2024-01-20T16:30:00Z",
    "budgetImpact": {
      "amountRecovered": 275.0,
      "newBudgetSpent": 6500.0
    }
  }
}
```

---

## Budgets API

### Create Budget

Create a new budget for a team.

**Endpoint**: `POST /api/budgets`

**Rate Limit**: 10 requests per minute per user

**Required Permission**: `create_budget`

**Headers**:

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:

```json
{
  "teamId": "team_789ghi",
  "amount": 15000,
  "period": "Q1-2024",
  "categories": ["ads", "events", "travel"],
  "description": "Q1 marketing budget"
}
```

**Success Response** (201):

```json
{
  "status": "success",
  "message": "Budget created successfully",
  "data": {
    "id": "budget_123abc",
    "teamId": "team_789ghi",
    "businessId": "biz_456def",
    "amount": 15000,
    "period": "Q1-2024",
    "categories": ["ads", "events", "travel"],
    "description": "Q1 marketing budget",
    "spent": 0,
    "remaining": 15000,
    "percentageUsed": 0,
    "createdAt": "2024-01-20T15:30:00Z",
    "alerts": [
      {
        "id": "alert_456def",
        "threshold": 80,
        "channels": ["web", "email"]
      }
    ]
  }
}
```

### Get Budgets

Retrieve budgets for accessible teams.

**Endpoint**: `GET /api/budgets`

**Rate Limit**: 50 requests per minute per user

**Required Permission**: Team Member with "read" permission

**Headers**:

```http
Authorization: Bearer <jwt_token>
```

**Query Parameters**:

- `teamId` (string, optional): Filter by team ID (only accessible teams)
- `period` (string, optional): Filter by period
- `active` (boolean, optional): Filter active/inactive budgets
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Results per page (default: 10, max: 50)

**Success Response** (200):

```json
{
  "status": "success",
  "data": {
    "budgets": [
      {
        "id": "budget_123abc",
        "teamId": "team_789ghi",
        "teamName": "Marketing Team",
        "businessId": "biz_456def",
        "amount": 15000,
        "period": "Q1-2024",
        "categories": ["ads", "events", "travel"],
        "description": "Q1 marketing budget",
        "spent": 8500,
        "remaining": 6500,
        "percentageUsed": 56.7,
        "status": "active",
        "daysRemaining": 45,
        "burnRate": 188.9,
        "projectedSpend": 23500,
        "createdAt": "2024-01-20T15:30:00Z"
      }
    ],
    "summary": {
      "totalBudget": 15000,
      "totalSpent": 8500,
      "totalRemaining": 6500,
      "averageUtilization": 56.7,
      "budgetsOverThreshold": 0
    },
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

## Reports API

### Generate Report

Generate a financial report for a team and period.

**Endpoint**: `GET /api/reports`

**Rate Limit**: 10 requests per minute per user

**Required Permission**: `create_report` and `read_expense`, `read_budget`

**Headers**:

```http
Authorization: Bearer <jwt_token>
```

**Query Parameters**:

- `teamId` (string, required): Team ID (must be accessible)
- `period` (string, required): Report period (e.g., "Q1-2024", "2024-01")
- `format` (string, optional): Report format ("pdf", "json", default: "pdf")
- `categories` (string, optional): Comma-separated categories to include
- `includeInsights` (boolean, optional): Include AI-generated insights (default: true)

**Success Response** (200):

```json
{
  "status": "success",
  "message": "Report generated successfully",
  "data": {
    "id": "report_123abc",
    "title": "Q1 2024 Marketing Team Financial Report",
    "period": "Q1-2024",
    "teamId": "team_789ghi",
    "teamName": "Marketing Team",
    "businessId": "biz_456def",
    "businessName": "Acme Corp",
    "format": "pdf",
    "url": "https://storage.vultr.com/reports/report_123abc.pdf",
    "generatedAt": "2024-01-20T16:30:00Z",
    "generatedBy": {
      "id": "usr_123abc",
      "name": "John Doe"
    },
    "summary": {
      "totalExpenses": 15000,
      "budgetAmount": 18000,
      "variance": -3000,
      "variancePercentage": -16.7,
      "expenseCount": 45,
      "categoryBreakdown": [
        { "category": "ads", "amount": 8000, "percentage": 53.3 },
        { "category": "events", "amount": 4000, "percentage": 26.7 },
        { "category": "travel", "amount": 3000, "percentage": 20.0 }
      ]
    },
    "insights": [
      "Marketing expenses are 16.7% under budget",
      "Ad spend represents 53% of total expenses",
      "Event spending peaked in February"
    ],
    "recommendations": [
      "Consider reallocating unused budget to high-performing ad campaigns",
      "Monitor travel expense trend for Q2 planning"
    ]
  }
}
```

---

## Forecasts API

### Generate Forecast

Generate budget forecast based on historical data.

**Endpoint**: `POST /api/forecasts`

**Rate Limit**: 10 requests per minute per user

**Required Permission**: Team Member with "read" permission

**Headers**:

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:

```json
{
  "teamId": "team_789ghi",
  "period": "Q2-2024",
  "categories": ["ads", "events"],
  "methodology": "ai_enhanced"
}
```

**Success Response** (200):

```json
{
  "status": "success",
  "message": "Forecast generated successfully",
  "data": {
    "id": "forecast_123abc",
    "teamId": "team_789ghi",
    "businessId": "biz_456def",
    "period": "Q2-2024",
    "forecastAmount": 16500,
    "confidence": 0.78,
    "methodology": "ai_enhanced",
    "breakdown": {
      "ads": {
        "forecast": 9000,
        "confidence": 0.85,
        "trend": "increasing"
      },
      "events": {
        "forecast": 4500,
        "confidence": 0.72,
        "trend": "stable"
      }
    },
    "recommendations": [
      "Increase budget allocation for ads category",
      "Consider early budget approval for Q2"
    ],
    "generatedAt": "2024-01-20T16:30:00Z"
  }
}
```

---

## Alerts API

### Create Alert

Set up a smart alert for budget monitoring.

**Endpoint**: `POST /api/alerts`

**Rate Limit**: 10 requests per minute per user

**Required Permission**: Team Member with "create" permission

**Headers**:

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:

```json
{
  "teamId": "team_789ghi",
  "budgetId": "budget_123abc",
  "threshold": 80,
  "thresholdType": "percentage",
  "categories": ["ads"],
  "channels": ["email", "whatsapp"],
  "frequency": "immediate",
  "message": "Marketing ads budget is approaching limit"
}
```

**Success Response** (201):

```json
{
  "status": "success",
  "message": "Alert created successfully",
  "data": {
    "id": "alert_123abc",
    "teamId": "team_789ghi",
    "businessId": "biz_456def",
    "budgetId": "budget_123abc",
    "threshold": 80,
    "thresholdType": "percentage",
    "categories": ["ads"],
    "channels": ["email", "whatsapp"],
    "frequency": "immediate",
    "message": "Marketing ads budget is approaching limit",
    "active": true,
    "createdAt": "2024-01-20T16:30:00Z"
  }
}
```

---

## WhatsApp Integration API

### Process WhatsApp Message

Process incoming WhatsApp messages and queries.

**Endpoint**: `POST /api/whatsapp/query`

**Rate Limit**: 50 requests per minute per user

**Headers**:

```http
Content-Type: application/json
X-WhatsApp-Webhook-Token: <webhook_token>
```

**Request Body**:

```json
{
  "phone": "+1234567890",
  "message": "Show marketing team expenses for Q1",
  "messageType": "text",
  "timestamp": "2024-01-20T16:30:00Z"
}
```

**Success Response** (200):

```json
{
  "status": "success",
  "message": "Query processed successfully",
  "data": {
    "response": "📊 Marketing Team Q1 Expenses\n\n💰 Total: $8,500 / $15,000\n[████████░░] 56.7%\n\n📈 Breakdown:\n• Ads: $4,500 (53%)\n• Events: $2,500 (29%)\n• Travel: $1,500 (18%)\n\n✅ Under budget by $6,500",
    "responseType": "text",
    "context": {
      "teamId": "team_789ghi",
      "businessId": "biz_456def",
      "period": "Q1-2024",
      "lastQuery": "expense_summary"
    }
  }
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "error": "Error category",
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "fieldName",
    "additionalInfo": "value"
  },
  "timestamp": "2024-01-20T16:30:00Z",
  "requestId": "req_123abc"
}
```

### Permission-Related Errors

**403 Forbidden - Insufficient Permissions**:

```json
{
  "error": "Permission denied",
  "message": "You don't have permission to perform this action",
  "code": "PERMISSION_DENIED",
  "details": {
    "requiredPermission": "create",
    "userRole": "viewer",
    "teamId": "team_789ghi"
  }
}
```

**403 Forbidden - Team Access Denied**:

```json
{
  "error": "Access denied",
  "message": "You are not a member of this team",
  "code": "TEAM_ACCESS_DENIED",
  "details": {
    "teamId": "team_789ghi",
    "businessId": "biz_456def"
  }
}
```

**403 Forbidden - Business Access Denied**:

```json
{
  "error": "Access denied",
  "message": "You don't have access to this business",
  "code": "BUSINESS_ACCESS_DENIED",
  "details": {
    "businessId": "biz_456def"
  }
}
```

---

## Security & Access Control

### Custom Role-Based Permissions

All access control is based on **custom roles** created by business owners or team admins. There are no predetermined roles in the system. Each role has **resource-specific permissions** for granular access control.

#### Resource-Specific Permission Types

Each resource in the system has its own set of permissions:

**Core Resources:**

- **Expenses**: `create_expense`, `read_expense`, `update_expense`, `delete_expense`
- **Budgets**: `create_budget`, `read_budget`, `update_budget`, `delete_budget`
- **Reports**: `create_report`, `read_report`, `update_report`, `delete_report`
- **Forecasts**: `create_forecast`, `read_forecast`, `update_forecast`, `delete_forecast`
- **Alerts**: `create_alert`, `read_alert`, `update_alert`, `delete_alert`
- **Receipts**: `create_receipt`, `read_receipt`, `update_receipt`, `delete_receipt`

**Management Resources:**

- **Teams**: `create_team`, `read_team`, `update_team`, `delete_team`
- **Users**: `create_user`, `read_user`, `update_user`, `delete_user`
- **Roles**: `create_role`, `read_role`, `update_role`, `delete_role`

#### Role Examples with Resource-Specific Permissions

| Custom Role Example     | Resource-Specific Permissions                                                        | Use Case                      |
| ----------------------- | ------------------------------------------------------------------------------------ | ----------------------------- |
| **"Department Head"**   | All permissions for all resources                                                    | Full team management          |
| **"Budget Manager"**    | `create_budget`, `read_budget`, `update_budget`, `read_expense`, `read_report`       | Manage budgets, view expenses |
| **"Expense Tracker"**   | `create_expense`, `read_expense`, `update_expense`, `create_receipt`, `read_receipt` | Add expenses, upload receipts |
| **"Financial Analyst"** | `read_expense`, `read_budget`, `read_report`, `read_forecast`                        | View all data for analysis    |
| **"Expense Approver"**  | `read_expense`, `update_expense`, `read_budget`                                      | Review and approve expenses   |
| **"Budget Reviewer"**   | `read_budget`, `update_budget`, `read_expense`, `read_report`                        | Review budgets and expenses   |
| **"Report Generator"**  | `read_expense`, `read_budget`, `create_report`, `read_report`                        | Generate financial reports    |
| **"Alert Manager"**     | `create_alert`, `read_alert`, `update_alert`, `delete_alert`, `read_budget`          | Manage budget alerts          |

### Access Control Rules

1. **Business Isolation**: Complete separation between different businesses
2. **Team-Scoped Roles**: Roles exist only within specific teams
3. **Resource-Specific Permissions**: Each permission is tied to a specific resource and action
4. **Granular Control**: Business owners can assign any combination of resource permissions
5. **User Assignment**: Users can only be assigned roles from teams they belong to
6. **Multi-Team Access**: Users can have different roles with different permissions in different teams

### Permission Validation Process

1. **Authentication**: Verify JWT token and extract user context
2. **Business Check**: Ensure user belongs to the business
3. **Team Membership**: Verify user is a member of the requested team
4. **Resource Permission**: Check if user's role has the specific resource permission (e.g., `create_expense`)
5. **Resource Access**: Grant or deny access based on resource-specific permission check

### Example Access Scenarios

**Scenario 1: Multi-Resource Role**

```json
{
  "roleName": "Marketing Manager",
  "permissions": [
    "create_expense",
    "read_expense",
    "update_expense",
    "read_budget",
    "update_budget",
    "create_report",
    "read_report"
  ]
}
```

- Can manage expenses fully
- Can view and update budgets (but not create new ones)
- Can create and view reports

**Scenario 2: Limited Resource Access**

```json
{
  "roleName": "Junior Analyst",
  "permissions": ["read_expense", "read_budget", "read_report"]
}
```

- Can only view financial data
- Cannot create, update, or delete anything

**Scenario 3: Cross-Team Different Permissions**

```json
{
  "teams": [
    {
      "teamId": "team_marketing",
      "roleName": "Marketing Lead",
      "permissions": [
        "create_expense",
        "read_expense",
        "update_expense",
        "delete_expense",
        "create_budget",
        "read_budget",
        "update_budget"
      ]
    },
    {
      "teamId": "team_finance",
      "roleName": "Finance Reviewer",
      "permissions": ["read_expense", "read_budget", "read_report"]
    }
  ]
}
```

- Full expense and budget management in Marketing team
- Read-only access to financial data in Finance team

### Data Isolation

1. **Business Level**: Complete isolation between different businesses
2. **Team Level**: Users can only access teams they're assigned to
3. **Role Level**: Access controlled by team-specific roles and permissions

### Token Security

- JWT tokens include business context and team memberships
- Tokens expire after 30 minutes with automatic refresh
- All API calls validate token against requested resource access

---

## Rate Limiting

Rate limits are enforced per endpoint and per user:

- **Authentication**: 5-10 requests per minute
- **Read Operations**: 50-100 requests per minute
- **Write Operations**: 10-20 requests per minute
- **File Uploads**: 5-10 requests per minute

---

## Conclusion

This API documentation provides comprehensive coverage of all Finoly AI Financial Assistant endpoints with multi-tenant support, role-based access control, and complete business isolation. The system supports both individual users and business teams with granular permissions.

**API Support**: api-support@finoly.app

**Documentation Version**: 1.0.0

**Last Updated**: July 7, 2025
