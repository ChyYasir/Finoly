# Finoly AI Financial Assistant: Functional Specification Document (FSD)

## Functional Requirements

This section provides a comprehensive, developer- and QA-ready breakdown of all functional requirements for the Finoly AI Financial Assistant, covering core features, WhatsApp and email integrations, user access and role logic, API behaviors, edge cases, inter-channel synchronization, and additional micro-behaviors not explicitly detailed in the original FSD. Each feature is detailed with supported actions, system behavior, validation rules, edge cases, input/output specifications, and access controls.

### 1. Core Financial Assistant

#### 1.1 Create Team

- **Description**: Allows an admin to create a new team for financial management.
- **Supported User Actions**:
  - Enter team name and assign initial admin.
  - Optionally add members during creation.
- **Expected System Behavior**:
  - Validate team name uniqueness and create team record in database.
  - Assign admin role to creator; link members if provided.
  - Return team ID and confirmation message.
- **Validation Rules**:
  - Team name: 3–50 characters, alphanumeric, unique.
  - Admin: Must be a registered user with `role: admin`.
  - Members: Valid user IDs; max 50 members.
- **Edge Cases and Error Handling**:
  - **Duplicate Team Name**: Return “Team name already exists. Choose another.”
  - **Invalid Admin**.

System: **Error in Input Document**: The provided `Finoly_FSD.markdown` document is incomplete, with the **Functional Requirements** section cut off mid-sentence in the **Edge Cases and Error Handling** subsection for the "Create Team" feature (ends with “**Invalid Admin**”). This prevents a full understanding of the intended requirements and makes it impossible to expand the section accurately without assumptions about the missing content.

### Response Strategy

To proceed, I’ll assume the missing content aligns with the previously provided FSD (from the earlier conversation) and expand the **Functional Requirements** section based on that version, ensuring all requested details are included. The expansion will cover all features (team management, user roles, budgets, expenses, receipts, reports, forecasts, alerts, chat queries), WhatsApp and email integrations, user access, API behaviors, edge cases, inter-channel sync, and missing micro-behaviors. If the incomplete document has unique details not present in the prior FSD, please provide the complete version, and I’ll revise accordingly.

---

<xaiArtifact artifact_id="4e6f4f88-98f0-4fa0-b08f-095617e5c17f" artifact_version_id="27b9e279-574a-477f-b341-9bd4576c016d" title="Finoly_FSD_Expanded.md" contentType="text/markdown">

# Finoly AI Financial Assistant: Functional Specification Document (FSD) - Expanded Functional Requirements

## Functional Requirements

This section expands the Functional Requirements from the Finoly AI Financial Assistant FSD, providing a developer- and QA-ready reference manual. It details all features (team management, user roles, budgets, expenses, receipts, reports, forecasts, alerts, chat-based queries), WhatsApp and email integrations, user access and role logic, API-level behaviors, edge cases, inter-channel synchronization, and additional micro-behaviors or validations not explicitly covered in the original FSD. The requirements align with the hackathon’s mandates (Groq API, Llama models, MCP, Vultr deployment) and support SME teams (5–50 employees).

### 1. Core Financial Assistant (Agentic Workflows)

#### 1.1 Create Team

- **Description**: Allows an admin to create a new team for financial management, enabling expense tracking, budgeting, and reporting.
- **Supported User Actions**:
  - Enter team name and assign initial admin (self or another user).
  - Optionally add members during creation (user IDs or emails).
- **Expected System Behavior**:
  - Validate team name and user inputs.
  - Create team record in NeonDB (`Teams` table).
  - Assign admin role to creator or specified user; link members if provided.
  - Return `{ teamId: string, name: string, status: "created" }` via API/UI.
  - Notify added members via email/WhatsApp (e.g., “You’ve been added to team [name]”).
- **Validation Rules**:
  - Team name: 3–50 characters, alphanumeric, unique across system.
  - Admin: Must be a registered user with `role: admin`.
  - Members: Valid user IDs/emails; max 50 members per team.
  - Input format: JSON `{ name: string, adminId: string, members?: string[] }`.
- **Edge Cases and Error Handling**:
  - **Duplicate Team Name**: Return “Team name already exists. Choose another.” (HTTP 400).
  - **Invalid Admin ID**: Return “Admin must be a registered user.” (HTTP 400).
  - **Invalid Member IDs**: Skip invalid IDs; return “Some members not found: [list].” (HTTP 206).
  - **Max Members Exceeded**: Return “Cannot add more than 50 members.” (HTTP 400).
  - **Empty Name**: Return “Team name is required.” (HTTP 400).
- **Input/Output Details**:
  - **Input**: UI form or API `POST /api/teams` with `{ name: string, adminId: string, members?: string[] }`.
  - **Output**: JSON `{ status: "success", teamId: string, name: string }` or error message.
  - **UI**: Form with name input, admin dropdown, optional member list; success toast or error modal.
- **Access Control/User Permissions**:
  - **Admin**: Can create teams and assign roles.
  - **Member**: No access (returns “Unauthorized: Admin role required.”, HTTP 403).
- **Related UI States/API Endpoints**:
  - **UI**: Settings > Teams > “Create Team” form.
  - **API**: `POST /api/teams` (create team).

#### 1.2 Update Team

- **Description**: Allows an admin to modify team details (name, admin, members).
- **Supported User Actions**:
  - Edit team name.
  - Change admin user.
  - Add/remove members.
- **Expected System Behavior**:
  - Validate inputs and update `Teams` table in NeonDB.
  - Notify affected users via email/WhatsApp (e.g., “You’ve been removed from team [name]”).
  - Return updated team details `{ teamId: string, name: string, adminId: string, members: string[] }`.
- **Validation Rules**:
  - Team name: Same as creation (3–50 chars, unique).
  - Admin: Must be a registered user with `admin` role.
  - Members: Valid user IDs; max 50.
- **Edge Cases and Error Handling**:
  - **Nonexistent Team**: Return “Team not found.” (HTTP 404).
  - **Duplicate Name**: Return “Team name already exists.” (HTTP 400).
  - **Invalid New Admin**: Return “New admin must be registered.” (HTTP 400).
  - **Removing Last Admin**: Return “Team must have at least one admin.” (HTTP 400).
  - **No Changes Provided**: Return “No updates provided.” (HTTP 400).
- **Input/Output Details**:
  - **Input**: UI form or `PATCH /api/teams/:teamId` with `{ name?: string, adminId?: string, members?: string[] }`.
  - **Output**: JSON `{ status: "success", team: { teamId, name, adminId, members } }` or error.
  - **UI**: Edit form with current team details; save/cancel buttons.
- **Access Control/User Permissions**:
  - **Admin**: Can update team details.
  - **Member**: No access (HTTP 403).
- **Related UI States/API Endpoints**:
  - **UI**: Settings > Teams > “Edit Team” button.
  - **API**: `PATCH /api/teams/:teamId` (update team).

#### 1.3 Delete Team

- **Description**: Allows an admin to delete a team, removing associated data (expenses, budgets, etc.).
- **Supported User Actions**:
  - Confirm team deletion via UI prompt.
- **Expected System Behavior**:
  - Soft-delete team (`Teams.isDeleted = true`) and cascade delete related records (expenses, budgets, reports, forecasts, alerts).
  - Notify members via email/WhatsApp (e.g., “Team [name] has been deleted.”).
  - Return `{ status: "deleted", teamId: string }`.
- **Validation Rules**:
  - Team must exist and user must be team admin.
- **Edge Cases and Error Handling**:
  - **Nonexistent Team**: Return “Team not found.” (HTTP 404).
  - **Non-Admin User**: Return “Unauthorized: Admin role required.” (HTTP 403).
  - **Active Workflows**: Warn “Deleting team will remove all data. Confirm?” (UI prompt).
- **Input/Output Details**:
  - **Input**: UI confirmation or `DELETE /api/teams/:teamId`.
  - **Output**: JSON `{ status: "success", teamId: string }` or error.
  - **UI**: Delete button with confirmation modal.
- **Access Control/User Permissions**:
  - **Admin**: Can delete team.
  - **Member**: No access (HTTP 403).
- **Related UI States/API Endpoints**:
  - **UI**: Settings > Teams > “Delete Team” button.
  - **API**: `DELETE /api/teams/:teamId` (delete team).

#### 1.4 Add/Remove Users from Team

- **Description**: Allows an admin to add or remove users from a team.
- **Supported User Actions**:
  - Add users by email or user ID.
  - Remove users by selecting from member list.
- **Expected System Behavior**:
  - Validate user IDs/emails, update `Teams.members` array in NeonDB.
  - Notify added/removed users via email/WhatsApp (e.g., “You’ve been added to/removed from team [name]”).
  - Return updated member list `{ teamId: string, members: string[] }`.
- **Validation Rules**:
  - Users: Valid, registered user IDs/emails.
  - Max 50 members per team.
- **Edge Cases and Error Handling**:
  - **Invalid User**: Return “User [email/ID] not found.” (HTTP 400).
  - **Max Members**: Return “Cannot add more than 50 members.” (HTTP 400).
  - **Remove Non-Member**: Return “User not in team.” (HTTP 400).
  - **Remove Admin**: Warn “Cannot remove team admin.” (HTTP 400).
- **Input/Output Details**:
  - **Input**: UI form or `PATCH /api/teams/:teamId/members` with `{ add?: string[], remove?: string[] }`.
  - **Output**: JSON `{ status: "success", teamId: string, members: string[] }` or error.
  - **UI**: Member management form with add/remove inputs.
- **Access Control/User Permissions**:
  - **Admin**: Can add/remove members.
  - **Member**: No access (HTTP 403).
- **Related UI States/API Endpoints**:
  - **UI**: Settings > Teams > “Manage Members” section.
  - **API**: `PATCH /api/teams/:teamId/members` (update members).

#### 1.5 Assign Roles

- **Description**: Allows an admin to assign roles (admin/member) to team members.
- **Supported User Actions**:
  - Select user and assign role (admin or member).
- **Expected System Behavior**:
  - Update `Users.role` in NeonDB for the team context.
  - Ensure at least one admin remains per team.
  - Notify user of role change via email/WhatsApp (e.g., “You’re now an admin for team [name]”).
  - Return `{ userId: string, role: "admin" | "member" }`.
- **Validation Rules**:
  - User must be a team member.
  - Role: Enum (`admin`, `member`).
- **Edge Cases and Error Handling**:
  - **Non-Member**: Return “User not in team.” (HTTP 400).
  - **Last Admin Demotion**: Return “Team must have at least one admin.” (HTTP 400).
  - **Invalid Role**: Return “Role must be ‘admin’ or ‘member’.” (HTTP 400).
- **Input/Output Details**:
  - **Input**: UI dropdown or `PATCH /api/users/:userId/role` with `{ teamId: string, role: string }`.
  - **Output**: JSON `{ status: "success", userId: string, role: string }` or error.
  - **UI**: Role assignment dropdown in member management.
- **Access Control/User Permissions**:
  - **Admin**: Can assign roles.
  - **Member**: No access (HTTP 403).
- **Related UI States/API Endpoints**:
  - **UI**: Settings > Teams > “Manage Roles” section.
  - **API**: `PATCH /api/users/:userId/role` (assign role).

#### 1.6 Create Budget

- **Description**: Allows an admin to create a budget for a team, specifying amount, categories, and period.
- **Supported User Actions**:
  - Enter budget amount, categories (e.g., “Ads”, “Travel”), and period (e.g., “Q3-2025”).
- **Expected System Behavior**:
  - Validate inputs and store in `Budgets` table.
  - Check budget against revenue projections (if provided).
  - Return `{ budgetId: string, amount: number, categories: string[], period: string }`.
- **Validation Rules**:
  - Amount: Positive number (>0).
  - Categories: Array of strings (1–20 chars each); max 10 categories.
  - Period: Format “Qn-YYYY” or “YYYY-MM”.
  - Budget ≤ revenue projection (if available).
- **Edge Cases and Error Handling**:
  - **Negative Amount**: Return “Budget amount must be positive.” (HTTP 400).
  - **Invalid Period**: Return “Period must be Qn-YYYY or YYYY-MM.” (HTTP 400).
  - **Exceeds Revenue**: Warn “Budget exceeds revenue projection of $[amount]. Confirm?” (UI) or return error (API, HTTP 400).
  - **No Categories**: Apply default category (“General”).
- **Input/Output Details**:
  - **Input**: UI form or `POST /api/budgets` with `{ teamId: string, amount: number, categories: string[], period: string }`.
  - **Output**: JSON `{ status: "success", budgetId: string, amount: number, categories, period }` or error.
  - **UI**: Budget creation form with inputs for amount, categories, period.
- **Access Control/User Permissions**:
  - **Admin**: Can create budgets.
  - **Member**: No access (HTTP 403).
- **Related UI States/API Endpoints**:
  - **UI**: Budgets Tab > “New Budget” form.
  - **API**: `POST /api/budgets` (create budget).

#### 1.7 Edit Budget

- **Description**: Allows an admin to modify an existing budget’s amount, categories, or period.
- **Supported User Actions**:
  - Update amount, add/remove categories, or change period.
- **Expected System Behavior**:
  - Validate updates and modify `Budgets` table.
  - Recalculate spending alerts if amount changes.
  - Return updated `{ budgetId: string, amount: number, categories: string[], period: string }`.
- **Validation Rules**:
  - Same as create budget.
  - Updated amount must cover existing expenses.
- **Edge Cases and Error Handling**:
  - **Nonexistent Budget**: Return “Budget not found.” (HTTP 404).
  - **Amount Below Expenses**: Return “New amount must cover $[existing] spent.” (HTTP 400).
  - **Invalid Period**: Same as create budget.
  - **No Changes**: Return “No updates provided.” (HTTP 400).
- **Input/Output Details**:
  - **Input**: UI form or `PATCH /api/budgets/:budgetId` with `{ amount?: number, categories?: string[], period?: string }`.
  - **Output**: JSON `{ status: "success", budget: { budgetId, amount, categories, period } }` or error.
  - **UI**: Budget edit form with current values.
- **Access Control/User Permissions**:
  - **Admin**: Can edit budgets.
  - **Member**: No access (HTTP 403).
- **Related UI States/API Endpoints**:
  - **UI**: Budgets Tab > “Edit Budget” button.
  - **API**: `PATCH /api/budgets/:budgetId` (update budget).

#### 1.8 Delete Budget

- **Description**: Allows an admin to delete a budget, removing associated alerts.
- **Supported User Actions**:
  - Confirm budget deletion via UI prompt.
- **Expected System Behavior**:
  - Soft-delete budget (`Budgets.isDeleted = true`) and disable related alerts.
  - Notify team admins via email/WhatsApp (e.g., “Budget [period] deleted.”).
  - Return `{ status: "deleted", budgetId: string }`.
- **Validation Rules**:
  - Budget must exist; user must be team admin.
- **Edge Cases and Error Handling**:
  - **Nonexistent Budget**: Return “Budget not found.” (HTTP 404).
  - **Non-Admin User**: Return “Unauthorized: Admin role required.” (HTTP 403).
  - **Active Expenses**: Warn “Deleting budget will not affect expenses. Confirm?” (UI).
- **Input/Output Details**:
  - **Input**: UI confirmation or `DELETE /api/budgets/:budgetId`.
  - **Output**: JSON `{ status: "success", budgetId: string }` or error.
  - **UI**: Delete button with confirmation modal.
- **Access Control/User Permissions**:
  - **Admin**: Can delete budgets.
  - **Member**: No access (HTTP 403).
- **Related UI States/API Endpoints**:
  - **UI**: Budgets Tab > “Delete Budget” button.
  - **API**: `DELETE /api/budgets/:budgetId` (delete budget).

#### 1.9 Expense Tracking - Add Expense

- **Description**: Allows users (admin or member) to add an expense to a team’s budget.
- **Supported User Actions**:
  - Enter expense details (amount, category, date, optional receipt).
  - Submit via chat query (e.g., “Add $500 to ads”) or form.
- **Expected System Behavior**:
  - Validate inputs and store in `Expenses` table.
  - If receipt uploaded, process via Groq API (Llama) for data extraction (amount, date).
  - Update budget spending and trigger alerts if threshold exceeded.
  - Return `{ expenseId: string, amount: number, category: string, date: timestamp }`.
- **Validation Rules**:
  - Amount: Positive number (>0).
  - Category: Predefined or user-defined (1–20 chars).
  - Date: Valid timestamp (past or current).
  - Receipt: JPEG/PNG, <5MB (optional).
- **Edge Cases and Error Handling**:
  - **Invalid Amount**: Return “Amount must be positive.” (HTTP 400).
  - **Future Date**: Return “Date cannot be in the future.” (HTTP 400).
  - **No Budget**: Allow expense but warn “No budget set for [category].” (UI/API).
  - **Invalid Receipt**: Return “Couldn’t read receipt. Enter details manually.” (HTTP 400).
- **Input/Output Details**:
  - **Input**: UI form, chat query, or `POST /api/expenses` with `{ teamId: string, amount: number, category: string, date: timestamp, receipt?: file }`.
  - **Output**: JSON `{ status: "success", expenseId: string, amount, category, date }` or error.
  - **UI**: Expense form or chat box; file upload for receipts.
- **Access Control/User Permissions**:
  - **Admin/Member**: Can add expenses.
- **Related UI States/API Endpoints**:
  - **UI**: Expenses Tab > “Add Expense” form or chat box.
  - **API**: `POST /api/expenses` (add expense).

#### 1.10 Expense Tracking - View Expense

- **Description**: Allows users to view team expenses by category, period, or project.
- **Supported User Actions**:
  - Query expenses (e.g., “Show Q3 marketing expenses”).
  - Filter by category, period, or reconciled status in UI.
- **Expected System Behavior**:
  - Process query via Groq API (Llama) for natural language understanding.
  - Retrieve expenses from `Expenses` table, filtered by team and criteria.
  - Return structured data with visual chart (SVG/PNG).
  - Use MCP to retain query context for follow-ups (e.g., “Show only ads”).
- **Validation Rules**:
  - Query must specify team or period (or infer from user’s team).
  - Filters: Valid categories, periods, or status (reconciled/unreconciled).
- **Edge Cases and Error Handling**:
  - **Ambiguous Query**: Return “Please specify team or period (e.g., ‘Marketing Q3 expenses’).” (HTTP 400).
  - **No Expenses**: Return “No expenses found for [criteria].” (HTTP 200).
  - **Invalid Filter**: Return “Invalid filter: [value].” (HTTP 400).
- **Input/Output Details**:
  - **Input**: Chat query or `GET /api/expenses` with `{ teamId: string, period?: string, category?: string, reconciled?: boolean }`.
  - **Output**: JSON `{ status: "success", expenses: [{ expenseId: string, amount: number, category: string, date: timestamp, reconciled: boolean }] }`, chart SVG/PNG.
  - **UI**: Expenses Tab with table/chart; filter dropdowns.
- **Access Control/User Permissions**:
  - **Admin/Member**: Can view expenses.
- **Related UI States/API Endpoints**:
  - **UI**: Expenses Tab > Table or chat box.
  - **API**: `GET /api/expenses` (view expenses).

#### 1.11 Expense Tracking - Edit Expense

- **Description**: Allows admins to edit expense details (amount, category, date).
- **Supported User Actions**:
  - Modify existing expense via form or chat query (e.g., “Change expense [ID] to $600”).
- **Expected System Behavior**:
  - Validate updates and modify `Expenses` table.
  - Recalculate budget spending and alerts.
  - Return updated `{ expenseId: string, amount: number, category: string, date: timestamp }`.
- **Validation Rules**:
  - Same as add expense.
  - Expense must exist and belong to user’s team.
- **Edge Cases and Error Handling**:
  - **Nonexistent Expense**: Return “Expense not found.” (HTTP 404).
  - **Invalid Update**: Same as add expense errors.
  - **Budget Impact**: Warn if edit causes budget overrun (UI).
- **Input/Output Details**:
  - **Input**: UI form or `PATCH /api/expenses/:expenseId` with `{ amount?: number, category?: string, date?: timestamp }`.
  - **Output**: JSON `{ status: "success", expense: { expenseId, amount, category, date } }` or error.
  - **UI**: Expense edit form.
- **Access Control/User Permissions**:
  - **Admin**: Can edit expenses.
  - **Member**: No access (HTTP 403).
- **Related UI States/API Endpoints**:
  - **UI**: Expenses Tab > “Edit” button on expense row.
  - **API**: `PATCH /api/expenses/:expenseId` (edit expense).

#### 1.12 Expense Tracking - Delete Expense

- **Description**: Allows admins to delete an expense.
- **Supported User Actions**:
  - Confirm expense deletion via UI prompt.
- **Expected System Behavior**:
  - Soft-delete expense (`Expenses.isDeleted = true`).
  - Recalculate budget spending and alerts.
  - Return `{ status: "deleted", expenseId: string }`.
- **Validation Rules**:
  - Expense must exist and belong to user’s team.
- **Edge Cases and Error Handling**:
  - **Nonexistent Expense**: Return “Expense not found.” (HTTP 404).
  - **Non-Admin User**: Return “Unauthorized: Admin role required.” (HTTP 403).
- **Input/Output Details**:
  - **Input**: UI confirmation or `DELETE /api/expenses/:expenseId`.
  - **Output**: JSON `{ status: "success", expenseId: string }` or error.
  - **UI**: Delete button with confirmation modal.
- **Access Control/User Permissions**:
  - **Admin**: Can delete expenses.
  - **Member**: No access (HTTP 403).
- **Related UI States/API Endpoints**:
  - **UI**: Expenses Tab > “Delete” button on expense row.
  - **API**: `DELETE /api/expenses/:expenseId` (delete expense).

#### 1.13 Receipt Upload and Reconciliation

- **Description**: Allows users to upload receipts and reconcile them against expenses autonomously using Groq API (Llama).
- **Supported User Actions**:
  - Upload receipt image (JPEG/PNG) via web or WhatsApp.
  - Trigger reconciliation via chat query (e.g., “Reconcile Q3 expenses”).
- **Expected System Behavior**:
  - Extract receipt data (amount, date, vendor) using Groq API (Llama vision model).
  - Match receipt to existing expense within $5 tolerance; update `Expenses.reconciled = true`.
  - Flag mismatches for manual review with details (e.g., “Receipt $50, no matching expense”).
  - Use MCP to retain reconciliation context for follow-ups (e.g., “Fix mismatch for receipt [ID]”).
  - Store receipt in Vultr file storage; save URL in `Expenses.receiptUrl`.
  - Return `{ expenseId: string, reconciled: boolean, mismatch?: { amount: number, details: string } }`.
- **Validation Rules**:
  - Receipt: JPEG/PNG, <5MB.
  - Expense must exist for reconciliation.
  - Amount tolerance: ±$5.
- **Edge Cases and Error Handling**:
  - **Unreadable Receipt**: Return “Couldn’t read receipt. Enter details manually.” (HTTP 400).
  - **No Matching Expense**: Return “No expense matches receipt ($[amount]). Add expense?” (HTTP 400).
  - **Multiple Matches**: Return “Multiple expenses match receipt. Select one: [list].” (HTTP 400).
  - **File Too Large**: Return “Receipt must be <5MB.” (HTTP 400).
- **Input/Output Details**:
  - **Input**: UI file upload, WhatsApp image, or `POST /api/expenses/:expenseId/receipt` with `{ file: JPEG/PNG }`.
  - **Output**: JSON `{ status: "success", expenseId: string, reconciled: boolean }` or error.
  - **UI**: Upload button in Expenses Tab; chat response for reconciliation.
- **Access Control/User Permissions**:
  - **Admin/Member**: Can upload receipts.
  - **Admin**: Can resolve mismatches.
- **Related UI States/API Endpoints**:
  - **UI**: Expenses Tab > “Upload Receipt”; Reconciliation modal.
  - **API**: `POST /api/expenses/:expenseId/receipt` (upload), `POST /api/reconcile` (reconcile).

#### 1.14 Generate Reports

- **Description**: Allows admins to generate financial reports for specified periods or teams, with filtering options.
- **Supported User Actions**:
  - Query report (e.g., “Create Q2 report for all teams”).
  - Apply filters (period, team, category) via UI.
  - Download report as PDF or view in browser.
- **Expected System Behavior**:
  - Process query via Groq API (Llama) for natural language input.
  - Retrieve data from `Expenses` and `Budgets` tables.
  - Generate PDF with trends (e.g., “Marketing overspent by 10%”) using Groq API reasoning.
  - Store report in `Reports` table with Vultr file storage URL.
  - Return `{ reportId: string, url: string, period: string, team: string }`.
- **Validation Rules**:
  - Period: Valid format (Qn-YYYY or YYYY-MM).
  - Team: Valid team ID or “all”.
  - Category: Valid or “all”.
  - PDF size: <10MB.
- **Edge Cases and Error Handling**:
  - **No Data**: Return “No data for [period/team]. Try another period.” (HTTP 200).
  - **Invalid Period**: Return “Invalid period format.” (HTTP 400).
  - **Large Report**: Warn “Report generation may take longer.” (UI).
- **Input/Output Details**:
  - **Input**: Chat query or `GET /api/reports` with `{ period: string, teamId?: string, category?: string }`.
  - **Output**: JSON `{ status: "success", reportId: string, url: string }`, PDF file.
  - **UI**: Reports Tab with filter form and download button.
- **Access Control/User Permissions**:
  - **Admin**: Can generate reports.
  - **Member**: Can view reports (HTTP 403 for generation).
- **Related UI States/API Endpoints**:
  - **UI**: Reports Tab > “Generate Report” form.
  - **API**: `GET /api/reports` (generate report).

#### 1.15 Forecasting

- **Description**: Allows admins to generate budget forecasts for a team and period using historical data.
- **Supported User Actions**:
  - Query forecast (e.g., “Predict Q4 operations budget”).
  - Specify period and team via UI.
- **Expected System Behavior**:
  - Use Groq API (Llama) to analyze `Expenses` and `Budgets` data (last 30 days minimum).
  - Apply simple linear regression (weighted by recent trends) for forecast.
  - Store in `Forecasts` table; return `{ forecastId: string, amount: number, period: string }`.
  - Update forecast on new expense/budget data (MCP for context).
- **Validation Rules**:
  - Period: Future Qn-YYYY or YYYY-MM.
  - Team: Valid team ID.
  - Data: ≥30 days of historical expenses.
- **Edge Cases and Error Handling**:
  - **Insufficient Data**: Return “Need 30+ days of data for [team].” (HTTP 400).
  - **Invalid Period**: Return “Period must be in the future.” (HTTP 400).
  - **No Team**: Return “Specify a team.” (HTTP 400).
- **Input/Output Details**:
  - **Input**: Chat query or `POST /api/forecasts` with `{ teamId: string, period: string }`.
  - **Output**: JSON `{ status: "success", forecastId: string, amount: number, period: string }` or error.
  - **UI**: Forecasts Tab with period/team inputs.
- **Access Control/User Permissions**:
  - **Admin**: Can generate forecasts.
  - **Member**: Can view forecasts (HTTP 403 for generation).
- **Related UI States/API Endpoints**:
  - **UI**: Forecasts Tab > “Generate Forecast” form.
  - **API**: `POST /api/forecasts` (generate forecast).

#### 1.16 Set Alerts

- **Description**: Allows admins to set smart alerts for budget thresholds or anomalies.
- **Supported User Actions**:
  - Set alert via query (e.g., “Notify if marketing budget exceeds 80%”) or form.
  - Specify threshold, category, and channel (web, WhatsApp, email).
- **Expected System Behavior**:
  - Validate inputs and store in `Alerts` table.
  - Monitor `Expenses` against `Budgets`; trigger alert if threshold met (e.g., `{ message: "Marketing at 85%" }`).
  - Deliver via chosen channel(s) with action suggestions (e.g., “Pause ad spend?”).
  - Use MCP for context in follow-up actions.
- **Validation Rules**:
  - Threshold: 1–100% or absolute amount (>0).
  - Category: Valid or “all”.
  - Channel: Enum (`web`, `whatsapp`, `email`).
  - Budget must exist for category/team.
- **Edge Cases and Error Handling**:
  - **No Budget**: Return “Set a budget for [category] first.” (HTTP 400).
  - **Invalid Threshold**: Return “Threshold must be 1–100% or positive amount.” (HTTP 400).
  - **No Channel**: Default to web notifications.
- **Input/Output Details**:
  - **Input**: UI form or `POST /api/alerts` with `{ teamId: string, category: string, threshold: number, channels: string[] }`.
  - **Output**: JSON `{ status: "success", alertId: string }` or error.
  - **UI**: Alerts Tab with threshold/channel inputs.
- **Access Control/User Permissions**:
  - **Admin**: Can set alerts.
  - **Member**: Can view alerts (HTTP 403 for setting).
- **Related UI States/API Endpoints**:
  - **UI**: Alerts Tab > “Set Alert” form.
  - **API**: `POST /api/alerts` (set alert).

#### 1.17 Chat-Based Queries

- **Description**: Allows users to interact with Finoly via natural language queries for all features (expenses, budgets, reports, etc.).
- **Supported User Actions**:
  - Submit queries (e.g., “Show Q3 expenses”, “Add $500 to ads”).
  - Refine queries based on system clarification (e.g., “Which team?”).
- **Expected System Behavior**:
  - Parse query via Groq API (Llama) for intent detection (e.g., expense view, budget creation).
  - Route to appropriate feature logic (e.g., `POST /api/expenses` for “Add expense”).
  - Retain context via MCP for multi-step queries (e.g., “Show expenses” → “Only ads”).
  - Return structured response (text/chart for UI, JSON for API).
  - Clarify ambiguous queries with suggestions (e.g., “Did you mean marketing team?”).
- **Validation Rules**:
  - Query: Text, <500 chars.
  - Must resolve to valid action (view, add, update, etc.).
  - Team/period inferred from user context if not specified.
- **Edge Cases and Error Handling**:
  - **Ambiguous Query**: Return “Please specify team/period (e.g., ‘Marketing Q3 expenses’).” (HTTP 400).
  - **Unsupported Action**: Return “Action not supported. Try ‘Show expenses’ or ‘Add budget’.” (HTTP 400).
  - **Long Query**: Truncate at 500 chars; return “Query too long. Shorten and retry.” (HTTP 400).
  - **API Failure**: Return “Unable to process query. Try again later.” (HTTP 500).
- **Input/Output Details**:
  - **Input**: Chat box or `POST /api/query` with `{ query: string, userId: string }`.
  - **Output**: JSON `{ status: "success", data: object, clarification?: string }` or error; UI text/chart.
  - **UI**: Chat box with response display (text, charts).
- **Access Control/User Permissions**:
  - **Admin**: Full access to all query actions.
  - **Member**: Limited to view/add expenses, view reports/forecasts (HTTP 403 for restricted actions).
- **Related UI States/API Endpoints**:
  - **UI**: Dashboard > Chat box.
  - **API**: `POST /api/query` (process query).

### 2. WhatsApp Integration

#### 2.1 Onboarding

- **Description**: Links a user’s phone number to their Finoly account for WhatsApp access.
- **Supported User Actions**:
  - Enter phone number in web app settings; verify via code sent to WhatsApp.
- **Expected System Behavior**:
  - Send 6-digit code to phone via WhatsApp Business API.
  - Validate code and link phone to `Users.phone`.
  - Send welcome message (e.g., “Hi, I’m Finoly! Try ‘Show team expenses’”).
- **Validation Rules**:
  - Phone: Valid international format (+[code][number]).
  - Code: 6 digits, expires in 5 minutes.
- **Edge Cases and Error Handling**:
  - **Invalid Phone**: Return “Invalid phone number format.” (HTTP 400).
  - **Expired Code**: Return “Code expired. Request a new one.” (HTTP 400).
  - **Already Linked**: Return “Phone already linked to another account.” (HTTP 400).
  - **API Failure**: Return “Unable to send code. Try again later.” (HTTP 500).
- **Input/Output Details**:
  - **Input**: UI form or `POST /api/whatsapp/link` with `{ phone: string, code?: string }`.
  - **Output**: JSON `{ status: "success", phone: string }` or error; welcome message via WhatsApp.
  - **UI**: Settings > WhatsApp Integration > Phone input.
- **Access Control/User Permissions**:
  - **Admin/Member**: Can link phone.
- **Related UI States/API Endpoints**:
  - **UI**: Settings > WhatsApp Integration.
  - **API**: `POST /api/whatsapp/link` (link phone).

#### 2.2 Query Processing

- **Description**: Processes natural language queries via WhatsApp, mirroring web app functionality.
- **Supported User Actions**:
  - Send queries (e.g., “Show sales team expenses”, “Add $500 to travel”).
  - Refine queries based on clarification (e.g., “Which team?”).
- **Expected System Behavior**:
  - Authenticate via phone number (linked to `Users.phone`).
  - Parse query via Groq API (Llama); route to feature logic (e.g., expense add).
  - Return text response with ASCII visuals (e.g., “Sales: $4,000/$10,000 [==== 40%]”).
  - Use MCP to retain conversation context (e.g., “Show expenses” → “Only travel”).
  - Sync results to NeonDB and web app.
- **Validation Rules**:
  - Phone: Must be linked.
  - Query: Text, <500 chars.
  - Same feature-specific rules as web app (e.g., budget amount >0).
- **Edge Cases and Error Handling**:
  - **Unlinked Phone**: Return “Link your phone in the web app.” (WhatsApp text).
  - **Ambiguous Query**: Return “Please specify team/period.” (WhatsApp text).
  - **Rate Limit**: Queue request; return “Processing delayed. Try again soon.” (WhatsApp text).
  - **Unsupported Action**: Return “Try ‘Show expenses’ or ‘Add budget’.” (WhatsApp text).
- **Input/Output Details**:
  - **Input**: WhatsApp message or `POST /api/whatsapp/query` (webhook) with `{ phone: string, query: string }`.
  - **Output**: WhatsApp text/ASCII or JSON `{ status: "success", data: object }`.
  - **UI**: WhatsApp chat interface.
- **Access Control/User Permissions**:
  - **Admin**: Full query access.
  - **Member**: Limited to view/add expenses, view reports/forecasts.
- **Related UI States/API Endpoints**:
  - **UI**: WhatsApp chat.
  - **API**: `POST /api/whatsapp/query` (process query).

#### 2.3 Receipt Upload

- **Description**: Allows users to upload receipt images via WhatsApp for expense logging.
- **Supported User Actions**:
  - Send JPEG/PNG receipt image.
- **Expected System Behavior**:
  - Authenticate phone number.
  - Process image via Groq API (Llama vision) to extract amount, date, vendor.
  - Create expense in `Expenses` table; store receipt in Vultr file storage.
  - Return confirmation (e.g., “Expense $50 added to [category].”).
- **Validation Rules**:
  - Image: JPEG/PNG, <5MB.
  - Extracted amount: Positive number.
- **Edge Cases and Error Handling**:
  - **Unreadable Image**: Return “Couldn’t read receipt. Send clearer image or type details.” (WhatsApp text).
  - **No Matching Budget**: Use default category (“General”).
  - **File Too Large**: Return “Image must be <5MB.” (WhatsApp text).
- **Input/Output Details**:
  - **Input**: WhatsApp image or `POST /api/whatsapp/receipt` with `{ phone: string, image: file }`.
  - **Output**: WhatsApp text or JSON `{ status: "success", expenseId: string }`.
  - **UI**: WhatsApp chat.
- **Access Control/User Permissions**:
  - **Admin/Member**: Can upload receipts.
- **Related UI States/API Endpoints**:
  - **UI**: WhatsApp chat.
  - **API**: `POST /api/whatsapp/receipt` (upload receipt).

#### 2.4 Real-Time Sync Behavior

- **Description**: Ensures WhatsApp actions reflect instantly in web app and database.
- **Supported User Actions**:
  - Perform any action (add expense, create budget, etc.) via WhatsApp.
- **Expected System Behavior**:
  - Write action to NeonDB within 1s.
  - Update web app dashboard via server-side events (if user is logged in).
  - Confirm action via WhatsApp (e.g., “Expense added.”).
- **Validation Rules**:
  - All actions must pass feature-specific validations.
- **Edge Cases and Error Handling**:
  - **Sync Failure**: Log error; retry once after 500ms; notify user via web if unresolved.
  - **Concurrent Updates**: Use database transactions to prevent conflicts.
- **Input/Output Details**:
  - **Input**: Same as feature-specific APIs.
  - **Output**: Same as feature-specific outputs; web dashboard updates.
- **Access Control/User Permissions**:
  - Same as feature-specific permissions.
- **Related UI States/API Endpoints**:
  - **UI**: Web app dashboard reflects updates.
  - **API**: Feature-specific endpoints (e.g., `/api/expenses`).

#### 2.5 ASCII Visual Rendering

- **Description**: Renders data (e.g., budget progress) as ASCII visuals in WhatsApp responses.
- **Supported User Actions**:
  - View expenses, budgets, or reports (e.g., “Show budget status”).
- **Expected System Behavior**:
  - Generate ASCII progress bars (e.g., “[==== 40%]”) for budgets/expenses.
  - Limit to 10 lines of text to fit WhatsApp message constraints.
  - Return alongside text summary (e.g., “Sales: $4,000/$10,000 [==== 40%]”).
- **Validation Rules**:
  - Data must be numeric (e.g., budget amounts).
  - Max message length: 1,600 chars (WhatsApp limit).
- **Edge Cases and Error Handling**:
  - **Large Data Set**: Summarize (e.g., “Top 5 categories shown.”).
  - **Non-Numeric Data**: Skip ASCII rendering; return text only.
- **Input/Output Details**:
  - **Input**: Query via WhatsApp.
  - **Output**: Text with ASCII visuals.
  - **UI**: WhatsApp chat.
- **Access Control/User Permissions**:
  - **Admin/Member**: Can view ASCII visuals.
- **Related UI States/API Endpoints**:
  - **UI**: WhatsApp chat.
  - **API**: `POST /api/whatsapp/query` (includes ASCII rendering).

#### 2.6 Limitations and Fallbacks

- **Description**: Defines WhatsApp interface limitations and fallback behaviors.
- **Supported User Actions**:
  - Perform any supported action (limited to text/images).
- **Expected System Behavior**:
  - Reject unsupported media (voice, video).
  - Queue requests during API rate limits.
  - Fallback to web app for complex tasks (e.g., large report generation).
- **Validation Rules**:
  - Media: Text or JPEG/PNG only.
  - Rate limit: 100 requests/min/user.
- **Edge Cases and Error Handling**:
  - **Unsupported Media**: Return “Only text and images supported.” (WhatsApp text).
  - **Rate Limit Exceeded**: Return “Processing delayed. Try again soon.” (WhatsApp text).
  - **Complex Task**: Return “Please use web app for this action.” (WhatsApp text).
- **Input/Output Details**:
  - **Input**: WhatsApp message/image.
  - **Output**: WhatsApp text or redirect message.
- **Access Control/User Permissions**:
  - Same as feature-specific permissions.
- **Related UI States/API Endpoints**:
  - **UI**: WhatsApp chat.
  - **API**: `POST /api/whatsapp/query` (handles limitations).

### 3. Email Integration

#### 3.1 Onboarding

- **Description**: Links a user’s email address to their Finoly account for email interactions.
- **Supported User Actions**:
  - Enter email in web app settings; verify via link sent to email.
- **Expected System Behavior**:
  - Send verification link via SendGrid to email.
  - Validate link click; update `Users.email`.
  - Send confirmation email (e.g., “Email linked. Send queries to [email]”).
- **Validation Rules**:
  - Email: Valid format (e.g., user@domain.com).
  - Link: Expires in 24 hours.
- **Edge Cases and Error Handling**:
  - **Invalid Email**: Return “Invalid email format.” (HTTP 400).
  - **Expired Link**: Return “Link expired. Request a new one.” (HTTP 400).
  - **Already Linked**: Return “Email already linked to another account.” (HTTP 400).
- **Input/Output Details**:
  - **Input**: UI form or `POST /api/email/link` with `{ email: string, token?: string }`.
  - **Output**: JSON `{ status: "success", email: string }` or error; confirmation email.
  - **UI**: Settings > Email Integration > Email input.
- **Access Control/User Permissions**:
  - **Admin/Member**: Can link email.
- **Related UI States/API Endpoints**:
  - **UI**: Settings > Email Integration.
  - **API**: `POST /api/email/link` (link email).

#### 3.2 Email Command Patterns

- **Description**: Processes email queries for reports, forecasts, or alerts.
- **Supported User Actions**:
  - Send query to dedicated email (e.g., “Send Q2 report for marketing”).
- **Expected System Behavior**:
  - Parse email body via Groq API (Llama) to identify intent.
  - Authenticate sender via linked email.
  - Route to feature logic (e.g., report generation).
  - Reply with text or PDF within 5 minutes.
  - Sync results to NeonDB and web app.
- **Validation Rules**:
  - Email: Must be linked to `Users.email`.
  - Query: Text, <1,000 chars.
  - Same feature-specific rules as web app.
- **Edge Cases and Error Handling**:
  - **Unlinked Email**: Reply “Link this email in the web app.”
  - **Unclear Query**: Reply “Please clarify (e.g., ‘Send Q2 report’).”
  - **Server Overload**: Reply “Processing delayed. Expect response soon.”
- **Input/Output Details**:
  - **Input**: Email or `POST /api/email/query` (webhook) with `{ email: string, query: string }`.
  - **Output**: Email reply with text/PDF; JSON `{ status: "success", data: object }`.
  - **UI**: Email client.
- **Access Control/User Permissions**:
  - **Admin**: Full query access.
  - **Member**: Limited to view reports/forecasts.
- **Related UI States/API Endpoints**:
  - **UI**: Email client.
  - **API**: `POST /api/email/query` (process query).

#### 3.3 Scheduled Report Logic

- **Description**: Sends periodic reports (e.g., weekly budget summaries) to linked emails.
- **Supported User Actions**:
  - Enable/disable scheduled reports in web app settings.
  - Specify frequency (daily, weekly, monthly), period, and team.
- **Expected System Behavior**:
  - Store schedule in `Reports.schedule` (e.g., `{ frequency: string, period: string, teamId: string }`).
  - Generate PDF report at scheduled time via Groq API (Llama).
  - Send via SendGrid with download link.
  - Store in `Reports` table; sync to web app.
- **Validation Rules**:
  - Frequency: Enum (`daily`, `weekly`, `monthly`).
  - Period/Team: Valid as per report generation.
  - PDF: <10MB.
- **Edge Cases and Error Handling**:
  - **No Data**: Send “No data for [period/team].” (email).
  - **Full Inbox**: Log failure in web app; notify via dashboard.
  - **Invalid Schedule**: Return “Invalid frequency or period.” (HTTP 400).
- **Input/Output Details**:
  - **Input**: UI form or `POST /api/reports/schedule` with `{ frequency: string, period: string, teamId: string }`.
  - **Output**: Email with PDF; JSON `{ status: "success", scheduleId: string }`.
  - **UI**: Settings > Email > “Schedule Reports” form.
- **Access Control/User Permissions**:
  - **Admin**: Can schedule reports.
  - **Member**: Can view scheduled reports (HTTP 403 for scheduling).
- **Related UI States/API Endpoints**:
  - **UI**: Settings > Email Integration.
  - **API**: `POST /api/reports/schedule` (schedule report).

#### 3.4 PDF Generation and Size Constraints

- **Description**: Generates PDF reports for email delivery with size and format constraints.
- **Supported User Actions**:
  - Request report via email or web app.
- **Expected System Behavior**:
  - Use Groq API (Llama) to compile report data (trends, summaries).
  - Generate PDF (<10MB) with tables/charts.
  - Store in Vultr file storage; save URL in `Reports.url`.
  - Send via SendGrid or provide download link in web app.
- **Validation Rules**:
  - PDF size: <10MB.
  - Data: Must meet report generation rules.
- **Edge Cases and Error Handling**:
  - **Large PDF**: Truncate data; warn “Report truncated to fit 10MB limit.” (email/UI).
  - **Generation Failure**: Reply “Unable to generate report. Try again later.” (HTTP 500).
- **Input/Output Details**:
  - **Input**: Same as report generation.
  - **Output**: PDF file; JSON `{ status: "success", reportId: string, url: string }`.
  - **UI**: Reports Tab > Download link.
- **Access Control/User Permissions**:
  - **Admin**: Can generate PDFs.
  - **Member**: Can download PDFs (HTTP 403 for generation).
- **Related UI States/API Endpoints**:
  - **UI**: Reports Tab.
  - **API**: `GET /api/reports` (includes PDF generation).

#### 3.5 Multi-Step Follow-Up Handling

- **Description**: Supports follow-up email queries for refining actions (e.g., “Break down Q2 report by team”).
- **Supported User Actions**:
  - Reply to email with follow-up query.
- **Expected System Behavior**:
  - Parse reply via Groq API (Llama) using MCP to retain context (e.g., original report ID).
  - Route to feature logic (e.g., report filtering).
  - Reply with updated response/PDF within 5 minutes.
- **Validation Rules**:
  - Reply must reference valid context (e.g., report ID).
  - Same feature-specific rules as original action.
- **Edge Cases and Error Handling**:
  - **Lost Context**: Reply “Please start a new query.” (email).
  - **Invalid Follow-Up**: Reply “Unclear request. Try ‘Break down by team’.” (email).
- **Input/Output Details**:
  - **Input**: Email reply or `POST /api/email/query` with `{ email: string, query: string, contextId: string }`.
  - **Output**: Email with text/PDF; JSON `{ status: "success", data: object }`.
  - **UI**: Email client.
- **Access Control/User Permissions**:
  - **Admin**: Full follow-up access.
  - **Member**: Limited to report/forecast follow-ups.
- **Related UI States/API Endpoints**:
  - **UI**: Email client.
  - **API**: `POST /api/email/query` (handles follow-ups).

### 4. User Access & Role Logic

- **Description**: Defines permissions for admin and member roles across all features.
- **Supported User Actions**:
  - Admin: Create/edit/delete teams, budgets, expenses, reports, forecasts, alerts; assign roles; manage members.
  - Member: View expenses, reports, forecasts; add expenses; upload receipts.
- **Expected System Behavior**:
  - Enforce role-based access via Better Auth (JWT) middleware.
  - Check `Users.role` and `Teams.members` for each request.
  - Return HTTP 403 for unauthorized actions.
- **Validation Rules**:
  - Role: Enum (`admin`, `member`) in `Users` table.
  - Team membership: User must be in `Teams.members` or `Teams.adminId`.
- **Edge Cases and Error Handling**:
  - **Member Attempts Admin Action**: Return “Unauthorized: Admin role required.” (HTTP 403).
  - **Non-Team Member**: Return “Not a member of this team.” (HTTP 403).
  - **Expired JWT**: Return “Session expired. Log in again.” (HTTP 401).
  - **Invalid Role**: Log error; return “Invalid role configuration.” (HTTP 500).
- **Input/Output Details**:
  - **Input**: JWT in `Authorization: Bearer <token>` header.
  - **Output**: HTTP 403/401 for unauthorized; feature-specific outputs otherwise.
  - **UI**: Error toast for unauthorized actions.
- **Access Control/User Permissions**:
  - **Admin**: Full access to all endpoints.
  - **Member**: Restricted to `GET /api/expenses`, `POST /api/expenses`, `GET /api/reports`, `GET /api/forecasts`, `POST /api/expenses/:expenseId/receipt`.

### 5. API-Level Behaviors

- **Endpoints** (REST, hosted on Vultr):

  1. **POST /api/teams**:
     - **Input**: `{ name: string, adminId: string, members?: string[] }`.
     - **Output**: `{ status: "success", teamId: string, name: string }`.
     - **Validation**: Name unique, admin valid, max 50 members.
     - **Errors**: HTTP 400 (invalid input), 403 (unauthorized).
     - **Rate Limit**: 10/min/user.
  2. **PATCH /api/teams/:teamId**:
     - **Input**: `{ name?: string, adminId?: string, members?: string[] }`.
     - **Output**: `{ status: "success", team: { teamId, name, adminId, members } }`.
     - **Validation**: Same as create; ensure one admin.
     - **Errors**: HTTP 400, 403, 404 (team not found).
     - **Rate Limit**: 10/min/user.
  3. **DELETE /api/teams/:teamId**:
     - **Input**: None (teamId in path).
     - **Output**: `{ status: "success", teamId: string }`.
     - **Validation**: Team exists, user is admin.
     - **Errors**: HTTP 403, 404.
     - **Rate Limit**: 5/min/user.
  4. **PATCH /api/teams/:teamId/members**:
     - **Input**: `{ add?: string[], remove?: string[] }`.
     - **Output**: `{ status: "success", teamId: string, members: string[] }`.
     - **Validation**: Valid user IDs, max 50 members.
     - **Errors**: HTTP 400, 403, 404.
     - **Rate Limit**: 10/min/user.
  5. **PATCH /api/users/:userId/role**:
     - **Input**: `{ teamId: string, role: "admin" | "member" }`.
     - **Output**: `{ status: "success", userId: string, role: string }`.
     - **Validation**: User in team, ensure one admin.
     - **Errors**: HTTP 400, 403, 404.
     - **Rate Limit**: 10/min/user.
  6. **POST /api/budgets**:
     - **Input**: `{ teamId: string, amount: number, categories: string[], period: string }`.
     - **Output**: `{ status: "success", budgetId: string, amount, categories, period }`.
     - **Validation**: Amount >0, valid period, max 10 categories.
     - **Errors**: HTTP 400, 403.
     - **Rate Limit**: 10/min/user.
  7. **PATCH /api/budgets/:budgetId**:
     - **Input**: `{ amount?: number, categories?: string[], period?: string }`.
     - **Output**: `{ status: "success", budget: { budgetId, amount, categories, period } }`.
     - **Validation**: Same as create; amount ≥ expenses.
     - **Errors**: HTTP 400, 403, 404.
     - **Rate Limit**: 10/min/user.
  8. **DELETE /api/budgets/:budgetId**:
     - **Input**: None (budgetId in path).
     - **Output**: `{ status: "success", budgetId: string }`.
     - **Validation**: Budget exists, user is admin.
     - **Errors**: HTTP 403, 404.
     - **Rate Limit**: 5/min/user.
  9. **POST /api/expenses**:
     - **Input**: `{ teamId: string, amount: number, category: string, date: timestamp, receipt?: file }`.
     - **Output**: `{ status: "success", expenseId: string, amount, category, date }`.
     - **Validation**: Amount >0, valid date, receipt <5MB.
     - **Errors**: HTTP 400, 403.
     - **Rate Limit**: 20/min/user.
  10. **GET /api/expenses**:
      - **Input**: `{ teamId: string, period?: string, category?: string, reconciled?: boolean }`.
      - **Output**: `{ status: "success", expenses: [{ expenseId, amount, category, date, reconciled }] }`.
      - **Validation**: Valid filters.
      - **Errors**: HTTP 400.
      - **Rate Limit**: 50/min/user.
  11. **PATCH /api/expenses/:expenseId**:
      - **Input**: `{ amount?: number, category?: string, date?: timestamp }`.
      - **Output**: `{ status: "success", expense: { expenseId, amount, category, date } }`.
      - **Validation**: Same as add; expense exists.
      - **Errors**: HTTP 400, 403, 404.
      - **Rate Limit**: 10/min/user.
  12. **DELETE /api/expenses/:expenseId**:
      - **Input**: None (expenseId in path).
      - **Output**: `{ status: "success", expenseId: string }`.
      - **Validation**: Expense exists, user is admin.
      - **Errors**: HTTP 403, 404.
      - **Rate Limit**: 5/min/user.
  13. **POST /api/expenses/:expenseId/receipt**:
      - **Input**: `{ file: JPEG/PNG }`.
      - **Output**: `{ status: "success", expenseId: string, reconciled: boolean }`.
      - **Validation**: File <5MB, valid expense.
      - **Errors**: HTTP 400, 403, 404.
      - **Rate Limit**: 10/min/user.
  14. **POST /api/reconcile**:
      - **Input**: `{ teamId: string, period?: string }`.
      - **Output**: `{ status: "success", reconciled: [{ expenseId, status, mismatch? }] }`.
      - **Validation**: Valid team/period.
      - **Errors**: HTTP 400, 403.
      - **Rate Limit**: 5/min/user.
  15. **GET /api/reports**:
      - **Input**: `{ period: string, teamId?: string, category?: string }`.
      - **Output**: `{ status: "success", reportId: string, url: string }`.
      - **Validation**: Valid period/team/category.
      - **Errors**: HTTP 400, 403.
      - **Rate Limit**: 10/min/user.
  16. **POST /api/forecasts**:
      - **Input**: `{ teamId: string, period: string }`.
      - **Output**: `{ status: "success", forecastId: string, amount: number, period: string }`.
      - **Validation**: Valid team, future period, 30+ days data.
      - **Errors**: HTTP 400, 403.
      - **Rate Limit**: 10/min/user.
  17. **POST /api/alerts**:
      - **Input**: `{ teamId: string, category: string, threshold: number, channels: string[] }`.
      - **Output**: `{ status: "success", alertId: string }`.
      - **Validation**: Valid threshold, category, channels.
      - **Errors**: HTTP 400, 403.
      - **Rate Limit**: 10/min/user.
  18. **POST /api/query**:
      - **Input**: `{ query: string, userId: string }`.
      - **Output**: `{ status: "success", data: object, clarification?: string }`.
      - **Validation**: Query <500 chars, valid action.
      - **Errors**: HTTP 400, 403, 500 (Groq API failure).
      - **Rate Limit**: 50/min/user.
  19. **POST /api/whatsapp/link**:
      - **Input**: `{ phone: string, code?: string }`.
      - **Output**: `{ status: "success", phone: string }`.
      - **Validation**: Valid phone, 6-digit code.
      - **Errors**: HTTP 400, 500 (WhatsApp API failure).
      - **Rate Limit**: 5/min/user.
  20. **POST /api/whatsapp/query**:
      - **Input**: `{ phone: string, query: string }`.
      - **Output**: `{ status: "success", data: object }`.
      - **Validation**: Linked phone, query <500 chars.
      - **Errors**: HTTP 400, 403, 429 (rate limit).
      - **Rate Limit**: 50/min/user.
  21. **POST /api/whatsapp/receipt**:
      - **Input**: `{ phone: string, image: file }`.
      - **Output**: `{ status: "success", expenseId: string }`.
      - **Validation**: Linked phone, image <5MB.
      - **Errors**: HTTP 400, 403, 429.
      - **Rate Limit**: 10/min/user.
  22. **POST /api/email/link**:
      - **Input**: `{ email: string, token?: string }`.
      - **Output**: `{ status: "success", email: string }`.
      - **Validation**: Valid email, token valid 24h.
      - **Errors**: HTTP 400, 500 (SendGrid failure).
      - **Rate Limit**: 5/min/user.
  23. **POST /api/email/query**:
      - **Input**: `{ email: string, query: string, contextId?: string }`.
      - **Output**: `{ status: "success", data: object }`.
      - **Validation**: Linked email, query <1,000 chars.
      - **Errors**: HTTP 400, 403, 429.
      - **Rate Limit**: 10/min/user.
  24. **POST /api/reports/schedule**:
      - **Input**: `{ frequency: string, period: string, teamId: string }`.
      - **Output**: `{ status: "success", scheduleId: string }`.
      - **Validation**: Valid frequency, period, team.
      - **Errors**: HTTP 400, 403.
      - **Rate Limit**: 5/min/user.

- **Retry Logic**:
  - Groq API/WhatsApp/SendGrid failures: Retry 3x (100ms, 200ms, 400ms).
  - Database errors: Retry once after 500ms.
- **Error Messages**:
  - Standardized: `{ error: string, code: number, details?: string }`.
  - Examples: “Invalid input: [reason]” (400), “Unauthorized: [reason]” (403), “Server error: [details]” (500).

### 6. Edge Cases for Each Feature

- **General Edge Cases**:
  - **Network Failure**: Cache request offline; retry when online (web app).
  - **API Downtime**: Return “Service unavailable. Try again later.” (HTTP 503).
  - **Concurrent Updates**: Use NeonDB transactions to prevent race conditions.
- **Feature-Specific** (covered above per feature, e.g., ambiguous queries, invalid inputs, unauthorized access).

### 7. Inter-Channel Sync Requirements

- **Description**: Ensures actions in one channel (web, WhatsApp, email) reflect across all channels and NeonDB.
- **Expected System Behavior**:
  - Write actions to NeonDB within 1s using transactions.
  - Update web app dashboard via server-side events (if user logged in).
  - Notify WhatsApp/email users of relevant updates (e.g., “New expense added: $500”).
  - Use MCP to sync conversation context across channels (e.g., query started in WhatsApp, continued in web).
- **Validation Rules**:
  - All writes must pass feature-specific validations.
  - Context retention: 24h (MCP embeddings in `Context` table).
- **Edge Cases and Error Handling**:
  - **Sync Lag**: Retry write once after 500ms; log failure and notify via web dashboard.
  - **Context Loss**: Restart query; return “Session expired. Start a new query.” (channel-specific).
  - **Concurrent Actions**: Lock records during updates to prevent conflicts.
- **Input/Output Details**:
  - **Input**: Feature-specific API calls.
  - **Output**: Synced data across channels; JSON `{ status: "success", data: object }`.
  - **UI**: Real-time dashboard updates; notifications in WhatsApp/email.
- **Access Control/User Permissions**:
  - Same as feature-specific permissions.
- **Related UI States/API Endpoints**:
  - **UI**: Dashboard, WhatsApp chat, email client.
  - **API**: All feature endpoints (implicit sync).

### 8. Additional Micro-Behaviors and Validations

- **Session Management**:
  - Sessions expire after 30 minutes of inactivity; prompt re-authentication.
  - API: `POST /api/auth/refresh` to renew JWT.
  - Error: “Session expired. Log in again.” (HTTP 401).
- **Query History**:
  - Store last 100 queries per user in `Context` table for debugging/audit.
  - API: `GET /api/queries/history` (admin-only, `{ userId: string, limit?: number }`).
- **Default Categories**:
  - Predefined expense categories: `["Ads", "Travel", "Events", "Supplies", "General"]`.
  - Users can add custom categories (1–20 chars).
- **Rate Limit Notifications**:
  - Notify user after 80% of rate limit reached (e.g., “Approaching limit: 40/50 queries/min”).
  - Channels: Web toast, WhatsApp/email message.
- **Data Retention**:
  - Soft-deleted records (teams, budgets, expenses) retained for 30 days; permanent deletion via cron job.
  - API: `POST /api/data/purge` (admin-only, for testing).
- **Localization**:
  - Currency: Default to USD; support user-defined currency in `Users.settings` (future-proofing).
  - Date formats: ISO 8601 (YYYY-MM-DD) for consistency.
- **Query Suggestions**:
  - Suggest common queries (e.g., “Try ‘Show expenses’ or ‘Add budget’”) after 3 failed attempts.
  - API: Include in `POST /api/query` response (`{ suggestions: string[] }`).
- **Audit Logging**:
  - Log all admin actions (team creation, budget edits) in `AuditLogs` table: `{ logId: uuid, userId: string, action: string, timestamp: timestamp }`.
  - API: `GET /api/audit` (admin-only).
