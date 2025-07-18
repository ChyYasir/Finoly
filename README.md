# Finoly - Financial Management Tool

Finoly is a powerful and intuitive financial management tool designed to help individuals and businesses track their finances, manage budgets, and gain insights into their spending habits.

## Features

*   **Dashboard:** A comprehensive overview of your financial status, including key metrics, charts, and recent transactions.
*   **Budgeting:** Create and manage budgets to track your spending and savings goals.
*   **Expense Tracking:** Easily record and categorize your expenses for accurate financial monitoring.
*   **Team Management:** Collaborate with your team by managing members, roles, and permissions.
*   **User Management:** Securely manage user accounts and their access to the application.

## Tech Stack

*   **Frontend:**
    *   [Next.js](https://nextjs.org/) - React framework for building server-side rendered and static web applications.
    *   [React](https://reactjs.org/) - A JavaScript library for building user interfaces.
    *   [TypeScript](https://www.typescriptlang.org/) - A typed superset of JavaScript that compiles to plain JavaScript.
    *   [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework for rapid UI development.
*   **Backend:**
    *   [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction) - Serverless functions for building APIs with Next.js.
    *   [Drizzle ORM](https://orm.drizzle.team/) - A TypeScript ORM for SQL databases.
*   **Database:**
    *   The application is configured to use a SQL database, and the specific implementation can be found in the `drizzle` directory.

## Getting Started

### Prerequisites

*   Node.js (v18 or later)
*   npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/finoly.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd finoly/web
    ```
3.  Install the dependencies:
    ```bash
    npm install
    ```
4.  Set up the environment variables by creating a `.env.local` file in the `web` directory. You can use the `.env.example` file as a template.
5.  Run the database migrations:
    ```bash
    npm run drizzle:migrate
    ```
6.  Start the development server:
    ```bash
    npm run dev
    ```
7.  Open your browser and navigate to `http://localhost:3000` to see the application in action.

## Project Structure

The project is organized as follows:

*   `docs/`: Contains the project documentation, including the Functional Specification Document (FSD) and Product Requirements Document (PRD).
*   `web/`: The main application directory, containing the Next.js project.
    *   `src/`: The source code for the application.
        *   `app/`: The application's pages and API routes.
        *   `components/`: Reusable React components.
        *   `db/`: Database-related files, including the schema and migrations.
        *   `lib/`: Utility functions and hooks.
    *   `public/`: Static assets, such as images and fonts.

## Contributing

Contributions are welcome! Please read the [commit guidelines](docs/commit_guidelines.md) for more information on how to contribute to the project.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
