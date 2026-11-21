import {
  pgTable,
  uuid,
  text,
  timestamp,
  unique,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";
import { issues } from "./issues";

export const labels = pgTable(
  "labels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull().default("#6b7280"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [unique("labels_workspace_name_unique").on(t.workspaceId, t.name)],
);

// Связь many-to-many. Удаление метки или задачи убирает только строки связи,
// сами задачи и метки не страдают.
export const issueLabels = pgTable(
  "issue_labels",
  {
    issueId: uuid("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    labelId: uuid("label_id")
      .notNull()
      .references(() => labels.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.issueId, t.labelId] }),
    // PK покрывает поиск по issueId; обратный поиск «задачи с меткой» нужен свой
    index("issue_labels_label_idx").on(t.labelId),
  ],
);
