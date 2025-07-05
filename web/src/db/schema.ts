import { pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";

// Define the 'posts' table
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(), // Auto-incrementing primary key
  title: text("title").notNull(), // A text column for the post title, cannot be null
  content: text("content"), // A nullable text column for post content
  published: boolean("published").default(false).notNull(), // Boolean, defaults to false
  createdAt: timestamp("created_at").defaultNow().notNull(), // Timestamp with default of current time
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(), // Timestamp, updates on row change
});
