# Finoly AI Financial Assistant: Product Requirements Document (PRD)

## Project Overview
Finoly is a web-based AI financial assistant designed to streamline financial workflows for small to medium-sized enterprise (SME) teams, such as marketing, sales, and operations. It simplifies expense tracking, budget allocation, financial reporting, and forecasting through an intuitive, prompt-based interface accessible via web, WhatsApp, and email. Finoly automates complex tasks like reconciling expenses, generating consolidated team reports, and suggesting budget optimizations, enabling teams to save time and make smarter financial decisions with minimal manual effort. By integrating with familiar communication channels, Finoly enhances collaboration and accessibility, allowing team members to manage finances on the go or through formal reports. The solution addresses key pain points for SMEs, such as manual spreadsheet-based processes and delayed financial insights, delivering a seamless, scalable tool for the future of work.

**Problem Solved**: SMEs often rely on time-consuming manual processes or complex software for financial management. Finoly provides an easy-to-use, AI-driven platform that automates and accelerates financial workflows, empowering teams to focus on their core responsibilities.

## Goals and Objectives
- Deliver an enterprise-ready financial assistant accessible via web, WhatsApp, and email, deployed on Vultr.
- Automate multi-step financial workflows with 80% task completion without human intervention.
- Achieve 85% user satisfaction (CSAT) for team interactions across channels.
- Support 1,000 active SME users (across teams) within 3 months post-hackathon launch.
- Demonstrate scalability and performance on Vultr with integrated AI capabilities.

## Target Users
Finoly targets SME teams (5–50 employees) needing lightweight, AI-driven financial management:
- **Marketing Teams**: Track campaign budgets and expenses.
- **Sales Teams**: Monitor client entertainment and travel expenses.
- **Operations Teams**: Manage vendor payments and operational budgets.
- **Finance Managers**: Oversee team budgets and generate consolidated reports.

## User Personas
### Persona 1: Sarah, Marketing Team Lead
- **Age**: 32
- **Role**: Marketing Manager at a 20-person SaaS startup
- **Goals**: Track campaign expenses, allocate budgets, generate reports for leadership.
- **Pain Points**: Manual expense tracking in spreadsheets; delays in report generation.
- **Preferred Channels**: Web for detailed analysis, WhatsApp for quick updates, email for reports.

### Persona 2: Raj, Operations Coordinator
- **Age**: 29
- **Role**: Operations Lead at a 15-person e-commerce firm
- **Goals**: Automate vendor payment tracking, reconcile expenses, forecast budgets.
- **Pain Points**: Time-consuming reconciliation; lack of real-time insights.
- **Preferred Channels**: WhatsApp for on-the-go tasks, web for approvals, email for alerts.

## Features
### Core Financial Assistant (Agentic Workflows)
- **Purpose**: Provide an AI-driven, prompt-based interface for SME teams to manage financial workflows autonomously, using contextual task management.
- **Actions Supported**:
  - Track team expenses (e.g., “Show marketing team’s Q3 campaign expenses”).
  - Allocate and monitor budgets (e.g., “Set $10,000 budget for sales team travel”).
  - Generate consolidated reports (e.g., “Create a report for all team expenses in Q2”).
  - Forecast budgets based on historical data (e.g., “Predict next quarter’s operations budget”).
  - Automate expense reconciliation (e.g., match receipts to transactions).
- **Agentic Capabilities**:
  - Multi-step task execution: E.g., for “Reconcile expenses,” Finoly retrieves transactions, matches receipts, flags discrepancies, and suggests corrections.
  - Decision trees: E.g., if budget overspending is detected, Finoly proposes reallocation or alerts the team lead.
  - Feedback loops: Users refine outputs (e.g., “Adjust report to include only travel expenses”).
- **Edge Cases/Constraints**:
  - Ambiguous queries prompt clarification (e.g., “Which team’s expenses?”).
  - Limited to financial workflows; non-financial tasks are out of scope.
  - Requires team admin to assign user roles for access control.

### WhatsApp Integration
- **Purpose**: Enable real-time financial management for mobile-first SME teams, mirroring web app functionality.
- **Actions Supported**:
  - Process team queries (e.g., “Show sales team’s expense status”).
  - Authenticate users via phone number and team role.
  - Sync data with web app in real-time.
  - Support receipt image uploads for expense logging.
  - Trigger automated workflows (e.g., “Reconcile vendor payments”).
- **Agentic Capabilities**:
  - Autonomous task handling: E.g., “Generate weekly budget report” triggers Finoly to compile data and send it via WhatsApp.
  - Contextual memory: Retains conversation context for multi-step tasks (e.g., refining a budget).
- **Edge Cases/Constraints**:
  - Limited to text and images (no voice/video due to WhatsApp API constraints).
  - API rate limits may delay responses during high usage.

### Email Integration
- **Purpose**: Provide a formal channel for non-real-time queries and report delivery for SME teams.
- **Actions Supported**:
  - Parse email queries (e.g., “Send consolidated Q2 report for all teams”).
  - Deliver scheduled reports and alerts (e.g., weekly budget summaries).
  - Support reply-based follow-up (e.g., “Break down report by team”).
- **Agentic Capabilities**:
  - Automated parsing and task execution: E.g., “Forecast next month’s budget” triggers Finoly to analyze data and email a PDF.
  - Proactive alerts: E.g., notifies team leads of budget overruns without manual prompts.
- **Edge Cases/Constraints**:
  - Response time capped at 5 minutes to manage server load.
  - No full email client integration (e.g., Gmail API).

## User Flow
### Core Financial Assistant (Web App)
1. **Account Setup/Login**:
   - User navigates to Finoly web app (hosted on Vultr, accessible via Chrome, Firefox, Safari).
   - New user clicks “Sign Up,” enters email, phone, and team role (e.g., “Marketing Lead”). Finoly sends a verification code to email/phone.
   - Team admin assigns roles (e.g., view-only for junior staff, edit for leads).
   - Returning user logs in via NextAuth (password or 2FA).
   - **Edge Case**: If code expires, user requests a new one. If unauthorized, Finoly prompts admin approval.
   - **Outcome**: User lands on team dashboard showing expenses, budgets, and forecasts.
2. **Dashboard Interaction**:
   - Dashboard displays team financial overview (e.g., “Marketing: $5,000 spent of $10,000 Q3 budget”).
   - User interacts via “Ask Finoly” chat box or clicks sections (e.g., “Expenses,” “Budgets”).
   - **Edge Case**: If no team data exists, Finoly prompts admin to initialize (e.g., “Add your team’s expenses to start.”).
   - **Outcome**: User accesses financial data or initiates AI queries.
3. **Expense Tracking**:
   - User types “Show marketing team’s Q3 campaign expenses” or selects “Expenses” tab.
   - Finoly displays a categorized breakdown (e.g., “Ads: $3,000, Events: $2,000”) with a chart.
   - User adds expenses via “Add expense: $500 on ads” or uploads receipt images. Finoly extracts data and confirms.
   - **Agentic Workflow**: For “Reconcile expenses,” Finoly retrieves transactions, matches receipts, flags mismatches, and suggests corrections, retaining context.
   - **Edge Case**: Ambiguous queries prompt clarification. Unreadable receipts trigger manual entry.
   - **Outcome**: Expenses sync to team dashboard.
4. **Budget Management**:
   - User types “Set $10,000 budget for sales team travel” or selects “New Budget.”
   - Finoly prompts for categories and confirms allocation.
   - **Agentic Workflow**: Finoly monitors spending and suggests reallocations if overspent, using contextual task tracking.
   - **Edge Case**: If budget exceeds revenue projections, Finoly flags it. If no categories are set, defaults are applied.
   - **Outcome**: Budget is tracked and synced.
5. **Report Generation**:
   - User types “Create Q2 report for all teams” or selects “Generate Report.”
   - **Agentic Workflow**: Finoly compiles a PDF/web report with trends (e.g., “Marketing overspent by 10%”) using reasoning, offering download.
   - **Edge Case**: If data is missing, Finoly suggests alternative periods.
   - **Outcome**: Report is saved in team folder.
6. **Forecasting**:
   - User types “Predict next quarter’s operations budget.”
   - Finoly analyzes historical data and generates a forecast (e.g., “Estimated $15,000”).
   - **Agentic Workflow**: Finoly adjusts forecasts based on real-time updates, using context.
   - **Edge Case**: If insufficient data, Finoly prompts for more input.
   - **Outcome**: Forecast is saved and synced.
7. **Smart Alerts**:
   - User sets alerts (e.g., “Notify if marketing budget exceeds 80%”).
   - Finoly sends web notifications for triggers (e.g., “Marketing at 85% of budget”).
   - **Agentic Workflow**: Finoly suggests actions (e.g., “Pause ad spend?”) using decision-making.
   - **Edge Case**: If no budget is set, Finoly prompts creation.
   - **Outcome**: Alerts sync across channels.
8. **Logout**:
   - User clicks “Log Out,” and Finoly terminates the session securely.
   - **Edge Case**: Session timeout after 30 minutes prompts re-authentication.
   - **Outcome**: User returns to login page.

### WhatsApp Interaction
1. **Onboarding**:
   - User navigates to “Settings > WhatsApp Integration” in web app, enters phone number, and verifies via code sent to WhatsApp.
   - **Edge Case**: Invalid number or API issues prompt retry or support contact.
   - **Outcome**: User receives a WhatsApp welcome message (e.g., “Hi, I’m Finoly! Try ‘Show team expenses’”).
2. **Query Initiation**:
   - User sends “Show sales team’s expense status” to Finoly’s WhatsApp number.
   - Finoly authenticates via phone number/team role and responds with a text summary (e.g., “Sales: $4,000 spent of $10,000”).
   - **Agentic Workflow**: For “Reconcile vendor payments,” Finoly retrieves data, matches payments, and reports discrepancies, using context.
   - **Edge Case**: Unauthenticated users are directed to link their number. Unclear queries trigger clarification.
   - **Outcome**: Data syncs to web app.
3. **Expense Tracking, Budget Management, Reports, Forecasting, Alerts**:
   - Similar to web app flows, with text-based responses and ASCII visuals.
   - **Agentic Workflow**: Finoly handles multi-step tasks (e.g., “Generate report”) and offers PDF via email.
   - **Edge Case**: API rate limits may delay responses.
   - **Outcome**: Actions sync to web app.

### Email Interaction
1. **Setup**:
   - User enables email integration in web app settings, verifying their email via a link.
   - **Edge Case**: Expired links or duplicate emails prompt retry or alternative email.
   - **Outcome**: Email is linked, with a confirmation email sent.
2. **Query/Request**:
   - User emails “Send Q2 report for all teams.”
   - Finoly parses, authenticates, and emails a PDF within 5 minutes.
   - **Agentic Workflow**: Finoly includes proactive insights (e.g., “Q2 overspending detected”) using context.
   - **Edge Case**: Unrecognized emails or unclear queries prompt clarification.
   - **Outcome**: Report syncs to web app.
3. **Reports, Alerts, Follow-Ups**:
   - Similar to web app flows, with PDF delivery and reply-based follow-ups.
   - **Agentic Workflow**: Finoly schedules proactive reports using reasoning.
   - **Edge Case**: Server delays or full inboxes trigger notifications in web app.
   - **Outcome**: Actions sync to web app.

## Scope
### In Scope
- AI-driven financial assistant for SME teams with agentic workflows.
- Model Context Protocol (MCP) for contextual task management.
- WhatsApp integration for real-time queries and media uploads.
- Email integration for reports and non-real-time queries.
- Deployment on Vultr’s cloud infrastructure.
- Support for Chrome, Firefox, Safari; WhatsApp on iOS/Android.

### Out of Scope
- Non-financial workflows (e.g., HR or CRM tasks).
- Voice/video support on WhatsApp (Groq Speech Models not used due to API constraints).
- Full email client integration (e.g., Gmail API).
- Compound-beta (not used due to focus on MCP for hackathon timeline).

## Assumptions
- SME teams are familiar with WhatsApp and email for business communication.
- 60% of users will prefer WhatsApp for real-time tasks; 40% will use email for reports.
- AI capabilities support financial query processing with low latency.
- Vultr’s infrastructure supports scalable performance.

## Dependencies
- **Groq API**: For Llama model integration to power AI-driven financial tasks.
- **Model Context Protocol (MCP)**: For contextual memory in agentic workflows.
- **Vultr Cloud Infrastructure**: For hosting web app and APIs (using provided credits).
- **WhatsApp Business API**: For integration (requires approval).
- **Email Service Provider**: SendGrid or similar for email handling.
- **Database**: PostgreSQL on Vultr with vector database support for Llama context.
- **GitHub Repository**: For code, setup instructions, and demo use case.

## Milestones
- **Day 1: Setup and Core Development (24 hours)**:
  - Finalize architecture and set up Vultr environment with $250 credits.
  - Configure Groq API with Llama model and MCP for basic query processing.
  - Initialize Next.js app and PostgreSQL database on Vultr.
  - Implement basic web app UI (login, dashboard, chat interface).
  - Set up GitHub repo with initial commit and setup instructions.
  - **Deliverable**: Basic web app skeleton running on Vultr with Groq API integration.
- **Day 2: Feature Development and Integrations (24 hours)**:
  - Develop core financial assistant features (expense tracking, budget management, reporting) using Llama and MCP.
  - Integrate WhatsApp Business API for real-time queries and receipt uploads.
  - Set up email integration (SendGrid) for report delivery and alerts.
  - Implement agentic workflows (e.g., reconciliation, forecasting) with MCP context retention.
  - **Deliverable**: Functional prototype with web, WhatsApp, and email interactions.
- **Day 3: Testing and Optimization (24 hours)**:
  - Test core features, integrations, and agentic workflows across 10–20 sample queries.
  - Optimize Groq API latency and Vultr performance for demo reliability.
  - Fix bugs (e.g., authentication errors, API rate limits).
  - Prepare demo use case (e.g., marketing team budget management) with sample data.
  - Update GitHub repo with detailed README and demo script.
  - **Deliverable**: Stable prototype ready for demo, with documented setup.
- **Day 4: Demo Preparation and Submission (24 hours)**:
  - Finalize demo presentation showcasing agentic workflows (e.g., expense reconciliation via WhatsApp).
  - Deploy final version on Vultr, ensuring public accessibility.
  - Record a 3-minute demo video showing login, query handling, and report generation.
  - Submit GitHub repo with code, setup instructions, and demo use case.
  - **Deliverable**: Fully deployed app on Vultr, demo video, and hackathon submission.