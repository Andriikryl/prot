import { desc, eq } from "drizzle-orm";
import { db, issues, projects } from "@server/db";

const DEFAULT_LIMIT = 50;

// Строка списка задач: только то, что нужно для отображения, без описания
export async function getIssuesByWorkspace(
  workspaceId: string,
  { limit = DEFAULT_LIMIT }: { limit?: number } = {},
) {
  return db
    .select({
      id: issues.id,
      number: issues.number,
      title: issues.title,
      status: issues.status,
      priority: issues.priority,
      assigneeId: issues.assigneeId,
      createdAt: issues.createdAt,
      projectKey: projects.key,
    })
    .from(issues)
    .innerJoin(projects, eq(projects.id, issues.projectId))
    .where(eq(issues.workspaceId, workspaceId))
    .orderBy(desc(issues.number))
    .limit(limit);
}

export type IssueListItem = Awaited<
  ReturnType<typeof getIssuesByWorkspace>
>[number];
