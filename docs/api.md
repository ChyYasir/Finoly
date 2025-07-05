# Finoly AI Financial Assistant - API Documentation

## Overview

The Finoly API provides a comprehensive set of endpoints for managing financial workflows for SME teams. The API enables expense tracking, budget management, report generation, forecasting, and smart alerts through an AI-powered financial assistant.

**Base URL**: `https://api.finoly.app`

**API Version**: v1

**Authentication**: JWT (JSON Web Token) via NextAuth

**Data Format**: JSON

**Rate Limiting**: Varies by endpoint (specified in each section)

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
  "role": "admin|member",
  "teamId": "team_id",
  "iat": 1640995200,
  "exp": 1640998800
}
```

**Token Expiration**: 30 minutes (refreshable)

---

## Authentication Endpoints

### Sign Up

Create a new user account.

**Endpoint**: `POST /api/auth/signup`

**Rate Limit**: 5 requests per minute per IP

**Headers**:
```http
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "phone": "+1234567890",
  "role": "admin"
}
```

**Request Body Fields**:
- `name` (string, required): User's full name (3-50 characters)
- `email` (string, required): Valid email address
- `password` (string, required): Password (min 8 characters, must contain uppercase, lowercase, number)
- `phone` (string, optional): Phone number in international format
- `role` (string, optional): User role, defaults to "member"

**Success Response** (201):
```json
{
  "status": "success",
  "message": "User created successfully",
  "data": {
    "userId": "usr_123abc",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "admin",
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
  "message": "Password must contain at least 8 characters",
  "details": {
    "field": "password",
    "code": "WEAK_PASSWORD"
  }
}
```

**Validation Rules**:
- Email must be unique
- Password must meet complexity requirements
- Phone number must be valid international format
- Name cannot contain special characters

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
      "role": "admin",
      "teamId": "team_456def"
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

**423 Locked**:
```json
{
  "error": "Account locked",
  "message": "Account temporarily locked due to multiple failed attempts",
  "code": "ACCOUNT_LOCKED",
  "retryAfter": 300
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

**Request Body Fields**:
- `type` (string, required): "email" or "phone"
- `token` (string, required): 6-digit verification code
- `userId` (string, required): User ID to verify

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

**Error Responses**:

**400 Bad Request**:
```json
{
  "error": "Invalid verification code",
  "message": "Verification code has expired",
  "code": "EXPIRED_TOKEN"
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
    "role": "admin",
    "teams": [
      {
        "id": "team_456def",
        "name": "Marketing Team",
        "role": "admin"
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

**Error Responses**:

**401 Unauthorized**:
```json
{
  "error": "Authentication required",
  "message": "JWT token is invalid or expired",
  "code": "INVALID_TOKEN"
}
```

### Update User Profile

Update user profile information.

**Endpoint**: `PUT /api/users/profile`

**Rate Limit**: 10 requests per minute per user

**Headers**:
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "John Smith",
  "phone": "+1234567890",
  "preferences": {
    "currency": "EUR",
    "timezone": "Europe/London",
    "notifications": {
      "email": true,
      "whatsapp": false,
      "web": true
    }
  }
}
```

**Success Response** (200):
```json
{
  "status": "success",
  "message": "Profile updated successfully",
  "data": {
    "id": "usr_123abc",
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "+1234567890",
    "preferences": {
      "currency": "EUR",
      "timezone": "Europe/London",
      "notifications": {
        "email": true,
        "whatsapp": false,
        "web": true
      }
    },
    "updatedAt": "2024-01-20T15:30:00Z"
  }
}
```

### Link Phone Number

Link and verify phone number for WhatsApp integration.

**Endpoint**: `POST /api/users/phone/link`

**Rate Limit**: 5 requests per minute per user

**Headers**:
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "phone": "+1234567890",
  "code": "123456"
}
```

**Request Body Fields**:
- `phone` (string, required): Phone number in international format
- `code` (string, optional): 6-digit verification code (required for verification step)

**Success Response** (200):
```json
{
  "status": "success",
  "message": "Phone number linked successfully",
  "data": {
    "phone": "+1234567890",
    "verified": true,
    "whatsappEnabled": true
  }
}
```

**Error Responses**:

**400 Bad Request**:
```json
{
  "error": "Invalid phone number",
  "message": "Phone number format is invalid",
  "code": "INVALID_PHONE_FORMAT"
}
```

**409 Conflict**:
```json
{
  "error": "Phone number already linked",
  "message": "This phone number is already linked to another account",
  "code": "PHONE_ALREADY_LINKED"
}
```

---

## Teams API

### Create Team

Create a new team for financial management.

**Endpoint**: `POST /api/teams`

**Rate Limit**: 10 requests per minute per user

**Required Permission**: Admin role

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
  "adminId": "usr_123abc",
  "members": [
    "usr_456def",
    "usr_789ghi"
  ]
}
```

**Request Body Fields**:
- `name` (string, required): Team name (3-50 characters, alphanumeric)
- `description` (string, optional): Team description (max 200 characters)
- `adminId` (string, required): User ID of team admin
- `members` (array, optional): Array of user IDs to add as members (max 50)

**Success Response** (201):
```json
{
  "status": "success",
  "message": "Team created successfully",
  "data": {
    "id": "team_456def",
    "name": "Marketing Team",
    "description": "Team for marketing expenses and budgets",
    "adminId": "usr_123abc",
    "members": [
      {
        "id": "usr_456def",
        "name": "Jane Smith",
        "role": "member",
        "joinedAt": "2024-01-20T15:30:00Z"
      },
      {
        "id": "usr_789ghi",
        "name": "Bob Johnson",
        "role": "member",
        "joinedAt": "2024-01-20T15:30:00Z"
      }
    ],
    "createdAt": "2024-01-20T15:30:00Z",
    "updatedAt": "2024-01-20T15:30:00Z"
  }
}
```

**Error Responses**:

**400 Bad Request**:
```json
{
  "error": "Validation error",
  "message": "Team name already exists",
  "details": {
    "field": "name",
    "code": "DUPLICATE_TEAM_NAME"
  }
}
```

**403 Forbidden**:
```json
{
  "error": "Insufficient permissions",
  "message": "Admin role required to create teams",
  "code": "ADMIN_REQUIRED"
}
```

**Validation Rules**:
- Team name must be unique across system
- Admin must be a registered user
- Maximum 50 members per team
- Team name must be 3-50 characters, alphanumeric only

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
- `role` (string, optional): Filter by user role in team ("admin" or "member")

**Success Response** (200):
```json
{
  "status": "success",
  "data": {
    "teams": [
      {
        "id": "team_456def",
        "name": "Marketing Team",
        "description": "Team for marketing expenses and budgets",
        "userRole": "admin",
        "memberCount": 5,
        "budgetCount": 3,
        "totalExpenses": 15000,
        "createdAt": "2024-01-15T10:30:00Z"
      },
      {
        "id": "team_789ghi",
        "name": "Sales Team",
        "description": "Team for sales expenses",
        "userRole": "member",
        "memberCount": 8,
        "budgetCount": 2,
        "totalExpenses": 22000,
        "createdAt": "2024-01-10T09:15:00Z"
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
    "id": "team_456def",
    "name": "Marketing Team",
    "description": "Team for marketing expenses and budgets",
    "admin": {
      "id": "usr_123abc",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "members": [
      {
        "id": "usr_456def",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "role": "member",
        "joinedAt": "2024-01-15T10:30:00Z"
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
        {"category": "ads", "amount": 8000},
        {"category": "events", "amount": 4000}
      ]
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-20T15:30:00Z"
  }
}
```

**Error Responses**:

**404 Not Found**:
```json
{
  "error": "Team not found",
  "message": "Team with ID 'team_456def' does not exist",
  "code": "TEAM_NOT_FOUND"
}
```

**403 Forbidden**:
```json
{
  "error": "Access denied",
  "message": "You are not a member of this team",
  "code": "NOT_TEAM_MEMBER"
}
```

### Update Team

Update team information.

**Endpoint**: `PUT /api/teams/:id`

**Rate Limit**: 10 requests per minute per user

**Required Permission**: Team admin

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
  "name": "Marketing & Growth Team",
  "description": "Updated team description",
  "adminId": "usr_456def"
}
```

**Request Body Fields**:
- `name` (string, optional): New team name (3-50 characters)
- `description` (string, optional): New team description (max 200 characters)
- `adminId` (string, optional): New admin user ID

**Success Response** (200):
```json
{
  "status": "success",
  "message": "Team updated successfully",
  "data": {
    "id": "team_456def",
    "name": "Marketing & Growth Team",
    "description": "Updated team description",
    "adminId": "usr_456def",
    "updatedAt": "2024-01-20T15:30:00Z"
  }
}
```

**Error Responses**:

**400 Bad Request**:
```json
{
  "error": "Validation error",
  "message": "Cannot remove last admin from team",
  "details": {
    "field": "adminId",
    "code": "LAST_ADMIN_REMOVAL"
  }
}
```

### Add Users to Team

Add users to a team.

**Endpoint**: `POST /api/teams/:id/users`

**Rate Limit**: 10 requests per minute per user

**Required Permission**: Team admin

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
  "users": [
    {
      "id": "usr_789ghi",
      "role": "member"
    },
    {
      "id": "usr_012jkl",
      "role": "admin"
    }
  ]
}
```

**Request Body Fields**:
- `users` (array, required): Array of user objects to add
  - `id` (string, required): User ID
  - `role` (string, optional): User role ("admin" or "member", defaults to "member")

**Success Response** (200):
```json
{
  "status": "success",
  "message": "Users added to team successfully",
  "data": {
    "added": [
      {
        "id": "usr_789ghi",
        "name": "Bob Johnson",
        "role": "member",
        "joinedAt": "2024-01-20T15:30:00Z"
      },
      {
        "id": "usr_012jkl",
        "name": "Alice Brown",
        "role": "admin",
        "joinedAt": "2024-01-20T15:30:00Z"
      }
    ],
    "failed": []
  }
}
```

**Error Responses**:

**400 Bad Request**:
```json
{
  "error": "Validation error",
  "message": "Maximum 50 members allowed per team",
  "details": {
    "field": "users",
    "code": "MAX_MEMBERS_EXCEEDED"
  }
}
```

### Remove User from Team

Remove a user from a team.

**Endpoint**: `DELETE /api/teams/:id/users/:userId`

**Rate Limit**: 10 requests per minute per user

**Required Permission**: Team admin

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
    "removedUser": {
      "id": "usr_789ghi",
      "name": "Bob Johnson",
      "removedAt": "2024-01-20T15:30:00Z"
    }
  }
}
```

**Error Responses**:

**400 Bad Request**:
```json
{
  "error": "Cannot remove user",
  "message": "Cannot remove the last admin from team",
  "details": {
    "field": "userId",
    "code": "LAST_ADMIN_REMOVAL"
  }
}
```

---

## Expenses API

### Add Expense

Create a new expense record.

**Endpoint**: `POST /api/expenses`

**Rate Limit**: 20 requests per minute per user

**Required Permission**: Team member or admin

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
teamId: "team_456def"
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
    "amount": 250.50,
    "category": "ads",
    "description": "Google Ads campaign",
    "date": "2024-01-20T00:00:00Z",
    "teamId": "team_456def",
    "userId": "usr_123abc",
    "receiptUrl": "https://storage.vultr.com/receipts/rec_123.jpg",
    "reconciled": false,
    "createdAt": "2024-01-20T15:30:00Z",
    "budget": {
      "id": "budget_123",
      "amount": 10000,
      "spent": 6750.50,
      "remaining": 3249.50,
      "percentageUsed": 67.5
    }
  }
}
```

**Error Responses**:

**400 Bad Request**:
```json
{
  "error": "Validation error",
  "message": "Amount must be positive",
  "details": {
    "field": "amount",
    "code": "INVALID_AMOUNT"
  }
}
```

**403 Forbidden**:
```json
{
  "error": "Access denied",
  "message": "You are not a member of this team",
  "code": "NOT_TEAM_MEMBER"
}
```

**Validation Rules**:
- Amount must be positive (> 0)
- Date cannot be in the future
- Category must be 1-20 characters
- Receipt file must be JPEG/PNG and < 5MB
- User must be a team member

### Get Expenses

Retrieve expenses based on filters.

**Endpoint**: `GET /api/expenses`

**Rate Limit**: 50 requests per minute per user

**Headers**:
```http
Authorization: Bearer <jwt_token>
```

**Query Parameters**:
- `teamId` (string, optional): Filter by team ID
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
        "amount": 250.50,
        "category": "ads",
        "description": "Google Ads campaign",
        "date": "2024-01-20T00:00:00Z",
        "user": {
          "id": "usr_123abc",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "team": {
          "id": "team_456def",
          "name": "Marketing Team"
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
        {"category": "ads", "amount": 8000, "count": 12},
        {"category": "events", "amount": 4000, "count": 8}
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

**Required Permission**: Team admin

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
  "amount": 275.00,
  "category": "advertising",
  "description": "Updated Google Ads campaign",
  "date": "2024-01-20"
}
```

**Request Body Fields**:
- `amount` (number, optional): New expense amount
- `category` (string, optional): New expense category
- `description` (string, optional): New expense description
- `date` (string, optional): New expense date

**Success Response** (200):
```json
{
  "status": "success",
  "message": "Expense updated successfully",
  "data": {
    "id": "exp_123abc",
    "amount": 275.00,
    "category": "advertising",
    "description": "Updated Google Ads campaign",
    "date": "2024-01-20T00:00:00Z",
    "updatedAt": "2024-01-20T16:30:00Z",
    "budgetImpact": {
      "oldSpent": 6750.50,
      "newSpent": 6775.00,
      "difference": 24.50
    }
  }
}
```

**Error Responses**:

**404 Not Found**:
```json
{
  "error": "Expense not found",
  "message": "Expense with ID 'exp_123abc' does not exist",
  "code": "EXPENSE_NOT_FOUND"
}
```

**403 Forbidden**:
```json
{
  "error": "Insufficient permissions",
  "message": "Admin role required to edit expenses",
  "code": "ADMIN_REQUIRED"
}
```

### Delete Expense

Delete an expense (soft delete).

**Endpoint**: `DELETE /api/expenses/:id`

**Rate Limit**: 5 requests per minute per user

**Required Permission**: Team admin

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
      "amountRecovered": 275.00,
      "newBudgetSpent": 6500.00
    }
  }
}
```

### Reconcile Expenses

Match receipts to expenses automatically.

**Endpoint**: `POST /api/expenses/reconcile`

**Rate Limit**: 5 requests per minute per user

**Required Permission**: Team admin

**Headers**:
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "teamId": "team_456def",
  "period": "Q1-2024",
  "tolerance": 5.00
}
```

**Request Body Fields**:
- `teamId` (string, required): Team ID
- `period` (string, optional): Period to reconcile (e.g., "Q1-2024")
- `tolerance` (number, optional): Amount tolerance for matching (default: 5.00)

**Success Response** (200):
```json
{
  "status": "success",
  "message": "Reconciliation completed",
  "data": {
    "summary": {
      "totalExpenses": 45,
      "autoReconciled": 35,
      "manualReviewRequired": 10,
      "reconciliationRate": 77.8
    },
    "autoReconciled": [
      {
        "expenseId": "exp_123abc",
        "receiptId": "rec_456def",
        "matchScore": 0.95,
        "amountDifference": 0.00
      }
    ],
    "manualReview": [
      {
        "expenseId": "exp_789ghi",
        "potentialMatches": [
          {
            "receiptId": "rec_012jkl",
            "matchScore": 0.65,
            "amountDifference": 2.50,
            "reason": "Amount difference within tolerance"
          }
        ]
      }
    ]
  }
}
```

---

## Budgets API

### Create Budget

Create a new budget for a team.

**Endpoint**: `POST /api/budgets`

**Rate Limit**: 10 requests per minute per user

**Required Permission**: Team admin

**Headers**:
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "teamId": "team_456def",
  "amount": 15000,
  "period": "Q1-2024",
  "categories": ["ads", "events", "travel"],
  "description": "Q1 marketing budget"
}
```

**Request Body Fields**:
- `teamId` (string, required): Team ID
- `amount` (number, required): Budget amount (positive number)
- `period` (string, required): Budget period (format: "Qn-YYYY" or "YYYY-MM")
- `categories` (array, required): Array of category strings (1-20 chars each, max 10)
- `description` (string, optional): Budget description (max 200 characters)

**Success Response** (201):
```json
{
  "status": "success",
  "message": "Budget created successfully",
  "data": {
    "id": "budget_123abc",
    "teamId": "team_456def",
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

**Error Responses**:

**400 Bad Request**:
```json
{
  "error": "Validation error",
  "message": "Budget already exists for this period",
  "details": {
    "field": "period",
    "code": "DUPLICATE_BUDGET_PERIOD",
    "existingBudgetId": "budget_456def"
  }
}
```

**403 Forbidden**:
```json
{
  "error": "Insufficient permissions",
  "message": "Admin role required to create budgets",
  "code": "ADMIN_REQUIRED"
}
```

**Validation Rules**:
- Amount must be positive (> 0)
- Period must be in format "Qn-YYYY" or "YYYY-MM"
- Categories must be 1-20 characters each, max 10 categories
- No duplicate budgets for same team and period
- Budget amount should not exceed 10x of average monthly expenses (warning only)

### Get Budgets

Retrieve budgets for a team.

**Endpoint**: `GET /api/budgets`

**Rate Limit**: 50 requests per minute per user

**Headers**:
```http
Authorization: Bearer <jwt_token>
```

**Query Parameters**:
- `teamId` (string, required): Team ID
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
        "alerts": [
          {
            "id": "alert_456def",
            "threshold": 80,
            "triggered": false,
            "channels": ["web", "email"]
          }
        ],
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

### Update Budget

Update an existing budget.

**Endpoint**: `PUT /api/budgets/:id`

**Rate Limit**: 10 requests per minute per user

**Required Permission**: Team admin

**Headers**:
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Path Parameters**:
- `id` (string, required): Budget ID

**Request Body**:
```json
{
  "amount": 18000,
  "description": "Updated Q1 marketing budget",
  "categories": ["ads", "events", "travel", "software"]
}
```

**Request Body Fields**:
- `amount` (number, optional): New budget amount
- `description` (string, optional): New budget description
- `categories` (array, optional): New categories array

**Success Response** (200):
```json
{
  "status": "success",
  "message": "Budget updated successfully",
  "data": {
    "id": "budget_123abc",
    "amount": 18000,
    "description": "Updated Q1 marketing budget",
    "categories": ["ads", "events", "travel", "software"],
    "spent": 8500,
    "remaining": 9500,
    "percentageUsed": 47.2,
    "updatedAt": "2024-01-20T16:30:00Z",
    "changes": {
      "amountChange": 3000,
      "newPercentageUsed": 47.2,
      "additionalRunway": 15.9
    }
  }
}
```

**Error Responses**:

**400 Bad Request**:
```json
{
  "error": "Validation error",
  "message": "New amount must be greater than current spent amount",
  "details": {
    "field": "amount",
    "code": "AMOUNT_BELOW_SPENT",
    "currentSpent": 8500,
    "requestedAmount": 7000
  }
}
```

### Delete Budget

Delete a budget (soft delete).

**Endpoint**: `DELETE /api/budgets/:id`

**Rate Limit**: 5 requests per minute per user

**Required Permission**: Team admin

**Headers**:
```http
Authorization: Bearer <jwt_token>
```

**Path Parameters**:
- `id` (string, required): Budget ID

**Success Response** (200):
```json
{
  "status": "success",
  "message": "Budget deleted successfully",
  "data": {
    "id": "budget_123abc",
    "deletedAt": "2024-01-20T16:30:00Z",
    "impact": {
      "expensesAffected": 25,
      "alertsDisabled": 2,
      "message": "Existing expenses will remain but will not be tracked against this budget"
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

**Required Permission**: Team admin

**Headers**:
```http
Authorization: Bearer <jwt_token>
```

**Query Parameters**:
- `teamId` (string, required): Team ID
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
    "teamId": "team_456def",
    "format": "pdf",
    "url": "https://storage.vultr.com/reports/report_123abc.pdf",
    "generatedAt": "2024-01-20T16:30:00Z",
    "summary": {
      "totalExpenses": 15000,
      "budgetAmount": 18000,
      "variance": -3000,
      "variancePercentage": -16.7,
      "expenseCount": 45,
      "categoryBreakdown": [
        {"category": "ads", "amount": 8000, "percentage": 53.3},
        {"category": "events", "amount": 4000, "percentage": 26.7},
        {"category": "travel", "amount": 3000, "percentage": 20.0}
      ]
    },
    "insights": [
      "Marketing expenses are 16.7% under budget",
      "Ad spend represents 53% of total expenses",
      "Event spending peaked in February",
      "Travel expenses are trending upward"
    ],
    "recommendations": [
      "Consider reallocating unused budget to high-performing ad campaigns",
      "Monitor travel expense trend for Q2 planning",
      "Review event ROI to optimize future spending"
    ],
    "charts": {
      "monthlyTrend": "https://storage.vultr.com/charts/monthly_trend_123.png",
      "categoryBreakdown": "https://storage.vultr.com/charts/category_breakdown_123.png"
    }
  }
}
```

**Error Responses**:

**400 Bad Request**:
```json
{
  "error": "Insufficient data",
  "message": "No expenses found for the specified period",
  "details": {
    "period": "Q1-2024",
    "teamId": "team_456def",
    "code": "NO_DATA_FOUND"
  }
}
```

**403 Forbidden**:
```json
{
  "error": "Insufficient permissions",
  "message": "Admin role required to generate reports",
  "code": "ADMIN_REQUIRED"
}
```

### Get Report by ID

Retrieve a specific report by ID.

**Endpoint**: `GET /api/reports/:id`

**Rate Limit**: 50 requests per minute per user

**Headers**:
```http
Authorization: Bearer <jwt_token>
```

**Path Parameters**:
- `id` (string, required): Report ID

**Success Response** (200):
```json
{
  "status": "success",
  "data": {
    "id": "report_123abc",
    "title": "Q1 2024 Marketing Team Financial Report",
    "period": "Q1-2024",
    "teamId": "team_456def",
    "format": "pdf",
    "url": "https://storage.vultr.com/reports/report_123abc.pdf",
    "generatedAt": "2024-01-20T16:30:00Z",
    "generatedBy": {
      "id": "usr_123abc",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "downloadCount": 5,
    "lastDownloadedAt": "2024-01-22T10:15:00Z",
    "expiresAt": "2024-04-20T16:30:00Z"
  }
}
```

### Schedule Report

Schedule automatic report generation and delivery.

**Endpoint**: `POST /api/reports/schedule`

**Rate Limit**: 5 requests per minute per user

**Required Permission**: Team admin

**Headers**:
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "teamId": "team_456def",
  "frequency": "monthly",
  "format": "pdf",
  "categories": ["ads", "events"],
  "deliveryMethod": "email",
  "recipients": ["john@example.com", "jane@example.com"]
}
```

**Request Body Fields**:
- `teamId` (string, required): Team ID
- `frequency` (string, required): Schedule frequency ("daily", "weekly", "monthly")
- `format` (string, optional): Report format ("pdf", "json", default: "pdf")
- `categories` (array, optional): Categories to include
- `deliveryMethod` (string, required): Delivery method ("email", "whatsapp")
- `recipients` (array, required): List of email addresses or phone numbers

**Success Response** (201):
```json
{
  "status": "success",
  "message": "Report scheduled successfully",
  "data": {
    "id": "schedule_123abc",
    "teamId": "team_456def",
    "frequency": "monthly",
    "format": "pdf",
    "deliveryMethod": "email",
    "recipients": ["john@example.com", "jane@example.com"],
    "nextRunAt": "2024-02-01T09:00:00Z",
    "createdAt": "2024-01-20T16:30:00Z",
    "active": true
  }
}
```

---

## Forecasts API

### Generate Forecast

Generate budget forecast based on historical data.

**Endpoint**: `POST /api/forecasts`

**Rate Limit**: 10 requests per minute per user

**Required Permission**: Team admin

**Headers**:
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "teamId": "team_456def",
  "period": "Q2-2024",
  "categories": ["ads", "events"],
  "methodology": "ai_enhanced"
}
```

**Request Body Fields**:
- `teamId` (string, required): Team ID
- `period` (string, required): Forecast period (format: "Qn-YYYY" or "YYYY-MM")
- `categories` (array, optional): Categories to include in forecast
- `methodology` (string, optional): Forecasting method ("linear", "seasonal", "ai_enhanced", default: "ai_enhanced")

**Success Response** (200):
```json
{
  "status": "success",
  "message": "Forecast generated successfully",
  "data": {
    "id": "forecast_123abc",
    "teamId": "team_456def",
    "period": "Q2-2024",
    "forecastAmount": 16500,
    "confidence": 0.78,
    "methodology": "ai_enhanced",
    "historicalData": {
      "periodsAnalyzed": 4,
      "averageSpend": 14250,
      "growthRate": 0.08,
      "seasonalFactor": 1.12
    },
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
      },
      "travel": {
        "forecast": 3000,
        "confidence": 0.68,
        "trend": "seasonal_increase"
      }
    },
    "factors": [
      "Historical growth trend of 8% per quarter",
      "Seasonal increase expected in Q2",
      "Team expansion planned for April"
    ],
    "recommendations": [
      "Increase budget allocation for ads category",
      "Monitor travel expenses due to team expansion",
      "Consider early budget approval for Q2"
    ],
    "confidenceRange": {
      "low": 14000,
      "high": 19000,
      "median": 16500
    },
    "generatedAt": "2024-01-20T16:30:00Z"
  }
}
```

**Error Responses**:

**400 Bad Request**:
```json
{
  "error": "Insufficient data",
  "message": "Need at least 30 days of historical data for accurate forecasting",
  "details": {
    "teamId": "team_456def",
    "availableData": "15 days",
    "code": "INSUFFICIENT_HISTORICAL_DATA"
  }
}
```

**403 Forbidden**:
```json
{
  "error": "Insufficient permissions",
  "message": "Admin role required to generate forecasts",
  "code": "ADMIN_REQUIRED"
}
```

### Get Forecasts

Retrieve existing forecasts for a team.

**Endpoint**: `GET /api/forecasts`

**Rate Limit**: 50 requests per minute per user

**Headers**:
```http
Authorization: Bearer <jwt_token>
```

**Query Parameters**:
- `teamId` (string, required): Team ID
- `period` (string, optional): Filter by period
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Results per page (default: 10, max: 50)

**Success Response** (200):
```json
{
  "status": "success",
  "data": {
    "forecasts": [
      {
        "id": "forecast_123abc",
        "period": "Q2-2024",
        "forecastAmount": 16500,
        "confidence": 0.78,
        "methodology": "ai_enhanced",
        "generatedAt": "2024-01-20T16:30:00Z",
        "accuracy": null
      }
    ],
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

## Alerts API

### Create Alert

Set up a smart alert for budget monitoring.

**Endpoint**: `POST /api/alerts`

**Rate Limit**: 10 requests per minute per user

**Required Permission**: Team admin

**Headers**:
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "teamId": "team_456def",
  "budgetId": "budget_123abc",
  "threshold": 80,
  "thresholdType": "percentage",
  "categories": ["ads"],
  "channels": ["email", "whatsapp"],
  "frequency": "immediate",
  "message": "Marketing ads budget is approaching limit"
}
```

**Request Body Fields**:
- `teamId` (string, required): Team ID
- `budgetId` (string, optional): Specific budget ID (if not provided, applies to all budgets)
- `threshold` (number, required): Alert threshold (1-100 for percentage, positive number for absolute)
- `thresholdType` (string, required): "percentage" or "absolute"
- `categories` (array, optional): Categories to monitor (empty = all categories)
- `channels` (array, required): Notification channels ("email", "whatsapp", "web")
- `frequency` (string, optional): Alert frequency ("immediate", "daily", "weekly", default: "immediate")
- `message` (string, optional): Custom alert message

**Success Response** (201):
```json
{
  "status": "success",
  "message": "Alert created successfully",
  "data": {
    "id": "alert_123abc",
    "teamId": "team_456def",
    "budgetId": "budget_123abc",
    "threshold": 80,
    "thresholdType": "percentage",
    "categories": ["ads"],
    "channels": ["email", "whatsapp"],
    "frequency": "immediate",
    "message": "Marketing ads budget is approaching limit",
    "active": true,
    "createdAt": "2024-01-20T16:30:00Z",
    "currentStatus": {
      "triggered": false,
      "currentPercentage": 56.7,
      "currentAmount": 8500
    }
  }
}
```

**Error Responses**:

**400 Bad Request**:
```json
{
  "error": "Validation error",
  "message": "Threshold must be between 1 and 100 for percentage type",
  "details": {
    "field": "threshold",
    "code": "INVALID_THRESHOLD_RANGE"
  }
}
```

**403 Forbidden**:
```json
{
  "error": "Insufficient permissions",
  "message": "Admin role required to create alerts",
  "code": "ADMIN_REQUIRED"
}
```

### Get Alerts

Retrieve active alerts for a team.

**Endpoint**: `GET /api/alerts`

**Rate Limit**: 50 requests per minute per user

**Headers**:
```http
Authorization: Bearer <jwt_token>
```

**Query Parameters**:
- `teamId` (string, required): Team ID
- `active` (boolean, optional): Filter by active/inactive status
- `triggered` (boolean, optional): Filter by triggered status
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Results per page (default: 10, max: 50)

**Success Response** (200):
```json
{
  "status": "success",
  "data": {
    "alerts": [
      {
        "id": "alert_123abc",
        "budgetId": "budget_123abc",
        "budgetName": "Q1 2024 Marketing Budget",
        "threshold": 80,
        "thresholdType": "percentage",
        "categories": ["ads"],
        "channels": ["email", "whatsapp"],
        "frequency": "immediate",
        "active": true,
        "triggered": false,
        "lastTriggered": null,
        "currentStatus": {
          "currentPercentage": 56.7,
          "currentAmount": 8500,
          "remainingToThreshold": 3900
        },
        "createdAt": "2024-01-20T16:30:00Z"
      }
    ],
    "summary": {
      "totalAlerts": 1,
      "activeAlerts": 1,
      "triggeredAlerts": 0,
      "alertsNearThreshold": 0
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

### Update Alert

Update an existing alert.

**Endpoint**: `PUT /api/alerts/:id`

**Rate Limit**: 10 requests per minute per user

**Required Permission**: Team admin

**Headers**:
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Path Parameters**:
- `id` (string, required): Alert ID

**Request Body**:
```json
{
  "threshold": 85,
  "channels": ["email", "whatsapp", "web"],
  "active": true
}
```

**Success Response** (200):
```json
{
  "status": "success",
  "message": "Alert updated successfully",
  "data": {
    "id": "alert_123abc",
    "threshold": 85,
    "channels": ["email", "whatsapp", "web"],
    "active": true,
    "updatedAt": "2024-01-20T17:30:00Z"
  }
}
```

### Delete Alert

Delete an alert.

**Endpoint**: `DELETE /api/alerts/:id`

**Rate Limit**: 10 requests per minute per user

**Required Permission**: Team admin

**Headers**:
```http
Authorization: Bearer <jwt_token>
```

**Path Parameters**:
- `id` (string, required): Alert ID

**Success Response** (200):
```json
{
  "status": "success",
  "message": "Alert deleted successfully",
  "data": {
    "id": "alert_123abc",
    "deletedAt": "2024-01-20T17:30:00Z"
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

**Request Body Fields**:
- `phone` (string, required): Sender's phone number
- `message` (string, required): Message content
- `messageType` (string, required): "text" or "image"
- `timestamp` (string, required): Message timestamp

**Success Response** (200):
```json
{
  "status": "success",
  "message": "Query processed successfully",
  "data": {
    "response": "📊 Marketing Team Q1 Expenses\n\n💰 Total: $8,500 / $15,000\n[████████░░] 56.7%\n\n📈 Breakdown:\n• Ads: $4,500 (53%)\n• Events: $2,500 (29%)\n• Travel: $1,500 (18%)\n\n✅ Under budget by $6,500",
    "responseType": "text",
    "context": {
      "teamId": "team_456def",
      "period": "Q1-2024",
      "lastQuery": "expense_summary"
    }
  }
}
```

**Error Responses**:

**400 Bad Request**:
```json
{
  "error": "Invalid request",
  "message": "Phone number not linked to any account",
  "code": "PHONE_NOT_LINKED"
}
```

**429 Too Many Requests**:
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```

### Process WhatsApp Receipt

Process receipt images sent via WhatsApp.

**Endpoint**: `POST /api/whatsapp/receipt`

**Rate Limit**: 10 requests per minute per user

**Headers**:
```http
Content-Type: multipart/form-data
X-WhatsApp-Webhook-Token: <webhook_token>
```

**Request Body (Form Data)**:
```
phone: "+1234567890"
image: [file]
messageId: "wamid.123abc"
timestamp: "2024-01-20T16:30:00Z"
```

**Request Body Fields**:
- `phone` (string, required): Sender's phone number
- `image` (file, required): Receipt image (JPEG/PNG, max 5MB)
- `messageId` (string, required): WhatsApp message ID
- `timestamp` (string, required): Message timestamp

**Success Response** (200):
```json
{
  "status": "success",
  "message": "Receipt processed successfully",
  "data": {
    "response": "✅ Receipt processed!\n\n💰 Amount: $47.50\n📅 Date: Jan 20, 2024\n🏪 Vendor: Starbucks\n\n🔍 Auto-matched to expense ID: exp_123abc\n✅ Reconciled successfully",
    "responseType": "text",
    "receiptData": {
      "amount": 47.50,
      "date": "2024-01-20",
      "vendor": "Starbucks",
      "items": ["Coffee", "Pastry"]
    },
    "expenseId": "exp_123abc",
    "reconciled": true
  }
}
```

**Error Responses**:

**400 Bad Request**:
```json
{
  "error": "Processing failed",
  "message": "Could not read receipt image clearly",
  "code": "RECEIPT_UNREADABLE",
  "suggestion": "Please send a clearer image or enter details manually"
}
```

### Link WhatsApp Number

Link a phone number to a user account for WhatsApp integration.

**Endpoint**: `POST /api/whatsapp/link`

**Rate Limit**: 5 requests per minute per user

**Headers**:
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "phone": "+1234567890",
  "verificationCode": "123456"
}
```

**Success Response** (200):
```json
{
  "status": "success",
  "message": "Phone number linked successfully",
  "data": {
    "phone": "+1234567890",
    "verified": true,
    "linkedAt": "2024-01-20T16:30:00Z"
  }
}
```

---

## Email Integration API

### Process Email Query

Process incoming email queries and commands.

**Endpoint**: `POST /api/email/query`

**Rate Limit**: 10 requests per minute per user

**Headers**:
```http
Content-Type: application/json
X-Email-Webhook-Token: <webhook_token>
```

**Request Body**:
```json
{
  "from": "john@example.com",
  "subject": "Monthly Marketing Report",
  "body": "Please send the Q1 marketing report with expense breakdown",
  "timestamp": "2024-01-20T16:30:00Z"
}
```

**Request Body Fields**:
- `from` (string, required): Sender's email address
- `subject` (string, required): Email subject
- `body` (string, required): Email body content
- `timestamp` (string, required): Email timestamp

**Success Response** (200):
```json
{
  "status": "success",
  "message": "Email query processed successfully",
  "data": {
    "action": "report_generated",
    "reportId": "report_123abc",
    "deliveryMethod": "email",
    "response": "Your Q1 marketing report has been generated and sent to your email address."
  }
}
```

### Send Report via Email

Send a report to specified email addresses.

**Endpoint**: `POST /api/email/report`

**Rate Limit**: 10 requests per minute per user

**Required Permission**: Team admin

**Headers**:
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "reportId": "report_123abc",
  "recipients": ["john@example.com", "jane@example.com"],
  "subject": "Q1 Marketing Financial Report",
  "message": "Please find attached the Q1 marketing financial report."
}
```

**Request Body Fields**:
- `reportId` (string, required): Report ID to send
- `recipients` (array, required): List of email addresses
- `subject` (string, optional): Email subject (auto-generated if not provided)
- `message` (string, optional): Email body message

**Success Response** (200):
```json
{
  "status": "success",
  "message": "Report sent successfully",
  "data": {
    "emailId": "email_123abc",
    "recipients": ["john@example.com", "jane@example.com"],
    "sentAt": "2024-01-20T16:30:00Z",
    "reportUrl": "https://storage.vultr.com/reports/report_123abc.pdf"
  }
}
```

---

## Error Handling

### Standard Error Response Format

All API endpoints return errors in the following format:

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

### Common HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required or invalid
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict (e.g., duplicate data)
- **422 Unprocessable Entity**: Valid request but processing failed
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

### Rate Limiting

Rate limits are enforced per endpoint and per user. When exceeded, the API returns:

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60,
  "limit": 10,
  "remaining": 0,
  "resetAt": "2024-01-20T16:31:00Z"
}
```

### Validation Errors

Validation errors include specific field information:

```json
{
  "error": "Validation error",
  "message": "One or more fields are invalid",
  "code": "VALIDATION_ERROR",
  "details": {
    "fields": [
      {
        "field": "amount",
        "message": "Amount must be positive",
        "code": "INVALID_AMOUNT"
      },
      {
        "field": "email",
        "message": "Email format is invalid",
        "code": "INVALID_EMAIL_FORMAT"
      }
    ]
  }
}
```

---

## Authentication & Security

### JWT Token Structure

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "usr_123abc",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "admin",
    "teamId": "team_456def",
    "iat": 1640995200,
    "exp": 1640998800
  }
}
```

### Token Refresh

Tokens automatically refresh if the user is active. For manual refresh:

**Endpoint**: `POST /api/auth/refresh`

**Headers**:
```http
Authorization: Bearer <current_token>
```

**Success Response** (200):
```json
{
  "status": "success",
  "data": {
    "token": "new_jwt_token",
    "expiresIn": 1800
  }
}
```

### Security Headers

All API responses include security headers:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## Database Integration with Drizzle ORM

### Example Query Structure

```typescript
// Example: Get expenses with Drizzle ORM
import { db } from '@/lib/db';
import { expenses, users, teams } from '@/lib/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

const getExpenses = async (teamId: string, startDate: Date, endDate: Date) => {
  return await db
    .select({
      id: expenses.id,
      amount: expenses.amount,
      category: expenses.category,
      date: expenses.date,
      userName: users.name,
      teamName: teams.name,
    })
    .from(expenses)
    .innerJoin(users, eq(expenses.userId, users.id))
    .innerJoin(teams, eq(expenses.teamId, teams.id))
    .where(
      and(
        eq(expenses.teamId, teamId),
        gte(expenses.date, startDate),
        lte(expenses.date, endDate),
        eq(expenses.isDeleted, false)
      )
    )
    .orderBy(expenses.date);
};
```

### Database Schema References

The API uses the following main tables:
- `users`: User accounts and authentication
- `teams`: Team management and membership
- `expenses`: Expense records and transactions
- `budgets`: Budget allocations and tracking
- `reports`: Generated reports and schedules
- `forecasts`: Budget forecasts and predictions
- `alerts`: Smart alerts and notifications
- `receipts`: Receipt uploads and processing
- `contexts`: MCP context storage for AI conversations

---

## Conclusion

This API documentation provides comprehensive coverage of all Finoly AI Financial Assistant endpoints. For additional support or clarification, please contact the development team or refer to the implementation examples in the codebase.

**API Support**: api-support@finoly.app

**Documentation Version**: 1.0.0

**Last Updated**: January 20, 2024