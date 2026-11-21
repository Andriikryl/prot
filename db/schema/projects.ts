import { pgTable, uuid, text, timestamp, unique } from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    key: text("key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [unique("projects_workspace_key_unique").on(t.workspaceId, t.key)],
);
