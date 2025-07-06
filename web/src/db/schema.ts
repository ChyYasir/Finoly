import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";

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
