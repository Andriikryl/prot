import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";
import { projects } from "./projects";

export const issueStatus = pgEnum("issue_status", [
  "backlog",
  "todo",
  "in_progress",
  "done",
  "canceled",
]);

export const issuePriority = pgEnum("issue_priority", [
  "none",
  "low",
  "medium",
  "high",
  "urgent",
]);

export const issues = pgTable(
  "issues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // workspaceId дублирует связь через проект осознанно: на нём держатся
    // уникальный номер TRK-42 и индексы списка задач без JOIN на projects
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    status: issueStatus("status").notNull().default("backlog"),
    priority: issuePriority("priority").notNull().default("none"),
    // Без внешнего ключа: таблицу пользователей создаст Better Auth на этапе 2
    assigneeId: text("assignee_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    unique("issues_workspace_number_unique").on(t.workspaceId, t.number),
    index("issues_workspace_status_idx").on(t.workspaceId, t.status),
    index("issues_workspace_assignee_idx").on(t.workspaceId, t.assigneeId),
    index("issues_workspace_created_idx").on(t.workspaceId, t.createdAt),
    index("issues_project_idx").on(t.projectId),
  ],
);
