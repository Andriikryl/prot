import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  // Счётчик для номеров задач (TRK-42). Следующий номер выдаётся атомарным
  // UPDATE ... SET issue_counter = issue_counter + 1 RETURNING issue_counter,
  // поэтому две одновременные задачи не получат один номер.
  issueCounter: integer("issue_counter").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()).defaultNow().notNull(),
});