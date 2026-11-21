import { asc, eq } from "drizzle-orm";
import { db, projects, workspaces } from "@server/db";

export type Workspace = typeof workspaces.$inferSelect;
export type Project = typeof projects.$inferSelect;

export async function getWorkspaceBySlug(
  slug: string,
): Promise<Workspace | undefined> {
  return db.query.workspaces.findFirst({
    where: eq(workspaces.slug, slug),
  });
}

export async function getProjectsByWorkspace(
  workspaceId: string,
): Promise<Project[]> {
  return db
    .select()
    .from(projects)
    .where(eq(projects.workspaceId, workspaceId))
    .orderBy(asc(projects.name));
}
