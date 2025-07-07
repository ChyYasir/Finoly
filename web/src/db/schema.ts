// src/db/schema.ts
import {
  pgTable,
  text,
  timestamp,
  boolean,
  pgEnum,
  integer,
} from "drizzle-orm/pg-core";

// Account type enum
export const accountTypeEnum = pgEnum("account_type", [
  "individual",
  "business",
]);

// Users table
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  hashedPassword: text("hashed_password"),
  accountType: accountTypeEnum("account_type").notNull(),
  businessId: text("business_id"), // References business.id but not enforced to avoid circular dependency
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  phone: text("phone"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

// Businesses table
export const business = pgTable("business", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: text("owner_id").notNull(), // References user.id
  settings: text("settings"), // JSON string for business settings
  teamsCount: integer("teams_count").default(0),
  usersCount: integer("users_count").default(0),
  totalExpenses: integer("total_expenses").default(0),
  activeBudgets: integer("active_budgets").default(0),
  subscriptionPlan: text("subscription_plan").default("free"),
  subscriptionStatus: text("subscription_status").default("active"),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

// Teams table
export const team = pgTable("team", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  businessId: text("business_id").notNull(), // References business.id
  adminUserId: text("admin_user_id").notNull(), // References user.id
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

// Team members table
export const teamMember = pgTable("team_member", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull(), // References team.id
  userId: text("user_id").notNull(), // References user.id
  roleId: text("role_id"), // References role.id
  joinedAt: timestamp("joined_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

// Roles table (team-scoped custom roles)
export const role = pgTable("role", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  teamId: text("team_id").notNull(), // References team.id
  permissions: text("permissions").notNull(), // JSON array of permission strings
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

// Sessions table
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull(), // References user.id
});

// Verification table
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

// Types for TypeScript
export type User = typeof user.$inferSelect;
export type Business = typeof business.$inferSelect;
export type Team = typeof team.$inferSelect;
export type TeamMember = typeof teamMember.$inferSelect;
export type Role = typeof role.$inferSelect;
export type Session = typeof session.$inferSelect;

// Insert types
export type InsertUser = typeof user.$inferInsert;
export type InsertBusiness = typeof business.$inferInsert;
export type InsertTeam = typeof team.$inferInsert;
export type InsertTeamMember = typeof teamMember.$inferInsert;
export type InsertRole = typeof role.$inferInsert;
export type InsertSession = typeof session.$inferInsert;

// Business settings type
export interface BusinessSettings {
  defaultCurrency: string;
  fiscalYearStart: string;
  timezone: string;
  features: {
    whatsappIntegration: boolean;
    aiInsights: boolean;
    advancedReporting: boolean;
  };
  notifications: {
    email: boolean;
    whatsapp: boolean;
    web: boolean;
  };
}

// Permission types
export const PERMISSIONS = {
  // Expense permissions
  CREATE_EXPENSE: "create_expense",
  READ_EXPENSE: "read_expense",
  UPDATE_EXPENSE: "update_expense",
  DELETE_EXPENSE: "delete_expense",

  // Budget permissions
  CREATE_BUDGET: "create_budget",
  READ_BUDGET: "read_budget",
  UPDATE_BUDGET: "update_budget",
  DELETE_BUDGET: "delete_budget",

  // Report permissions
  CREATE_REPORT: "create_report",
  READ_REPORT: "read_report",
  UPDATE_REPORT: "update_report",
  DELETE_REPORT: "delete_report",

  // Forecast permissions
  CREATE_FORECAST: "create_forecast",
  READ_FORECAST: "read_forecast",
  UPDATE_FORECAST: "update_forecast",
  DELETE_FORECAST: "delete_forecast",

  // Alert permissions
  CREATE_ALERT: "create_alert",
  READ_ALERT: "read_alert",
  UPDATE_ALERT: "update_alert",
  DELETE_ALERT: "delete_alert",

  // Team management permissions
  CREATE_TEAM: "create_team",
  READ_TEAM: "read_team",
  UPDATE_TEAM: "update_team",
  DELETE_TEAM: "delete_team",

  // User management permissions
  CREATE_USER: "create_user",
  READ_USER: "read_user",
  UPDATE_USER: "update_user",
  DELETE_USER: "delete_user",

  // Role management permissions
  CREATE_ROLE: "create_role",
  READ_ROLE: "read_role",
  UPDATE_ROLE: "update_role",
  DELETE_ROLE: "delete_role",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Helper function to get default permissions for role types
export function getDefaultPermissions(roleType: string): Permission[] {
  switch (roleType) {
    case "admin":
      return Object.values(PERMISSIONS);
    case "manager":
      return [
        PERMISSIONS.CREATE_EXPENSE,
        PERMISSIONS.READ_EXPENSE,
        PERMISSIONS.UPDATE_EXPENSE,
        PERMISSIONS.CREATE_BUDGET,
        PERMISSIONS.READ_BUDGET,
        PERMISSIONS.UPDATE_BUDGET,
        PERMISSIONS.CREATE_REPORT,
        PERMISSIONS.READ_REPORT,
        PERMISSIONS.CREATE_FORECAST,
        PERMISSIONS.READ_FORECAST,
        PERMISSIONS.CREATE_ALERT,
        PERMISSIONS.READ_ALERT,
        PERMISSIONS.UPDATE_ALERT,
      ];
    case "viewer":
      return [
        PERMISSIONS.READ_EXPENSE,
        PERMISSIONS.READ_BUDGET,
        PERMISSIONS.READ_REPORT,
        PERMISSIONS.READ_FORECAST,
        PERMISSIONS.READ_ALERT,
      ];
    default:
      return [];
  }
}

// Helper function to generate IDs
export function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
}

// Default business settings
export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  defaultCurrency: "USD",
  fiscalYearStart: "2024-01-01",
  timezone: "UTC",
  features: {
    whatsappIntegration: true,
    aiInsights: true,
    advancedReporting: true,
  },
  notifications: {
    email: true,
    whatsapp: true,
    web: true,
  },
};
