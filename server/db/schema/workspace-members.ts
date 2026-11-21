import { pgTable, pgEnum, uuid, text, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";

export const workspaceRole = pgEnum("workspace_role", ["owner", "member"]);

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    // Без внешнего ключа: таблицу пользователей создаст Better Auth на этапе 2
    userId: text("user_id").notNull(),
    role: workspaceRole("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.workspaceId, t.userId] })],
);
