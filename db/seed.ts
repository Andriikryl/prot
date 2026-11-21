import "dotenv/config";
import { inArray, eq } from "drizzle-orm";
import { db, client } from "./index";
import {
  workspaces,
  projects,
  workspaceMembers,
  issues,
  comments,
  labels,
  issueLabels,
} from "./schema";

// Детерминированный ГПСЧ: каждый запуск сида даёт одни и те же данные
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const weighted = <T>(items: readonly (readonly [T, number])[]): T => {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [value, w] of items) {
    if ((r -= w) < 0) return value;
  }
  return items[items.length - 1][0];
};

const USERS = ["user_alice", "user_bob", "user_carol", "user_dave"] as const;

const VERBS = ["Fix", "Add", "Refactor", "Improve", "Remove", "Document", "Investigate", "Optimize", "Migrate", "Redesign"];
const OBJECTS = [
  "login form validation",
  "sidebar navigation",
  "issue list pagination",
  "email notifications",
  "dark mode colors",
  "search performance",
  "CSV export",
  "webhook retries",
  "keyboard shortcuts",
  "onboarding flow",
  "billing page",
  "avatar upload",
  "rate limiting",
  "audit log",
  "mobile layout",
  "cache invalidation",
  "role permissions",
  "API error messages",
  "drag and drop board",
  "session expiration",
];
const COMMENT_BODIES = [
  "Reproduced on staging, looking into it.",
  "I think this is related to the recent refactor.",
  "Can we get a design review before we start?",
  "Blocked until the API change lands.",
  "Fixed in the latest branch, please verify.",
  "Not a priority for this sprint, moving to backlog.",
  "Added a failing test that covers this case.",
  "Works for me now, closing after QA.",
];

const STATUSES = [
  ["backlog", 25],
  ["todo", 25],
  ["in_progress", 20],
  ["done", 25],
  ["canceled", 5],
] as const;
const PRIORITIES = [
  ["none", 20],
  ["low", 25],
  ["medium", 30],
  ["high", 18],
  ["urgent", 7],
] as const;

const LABELS = [
  { name: "bug", color: "#ef4444" },
  { name: "feature", color: "#3b82f6" },
  { name: "improvement", color: "#10b981" },
  { name: "docs", color: "#8b5cf6" },
  { name: "design", color: "#f59e0b" },
];

const SEED = [
  {
    slug: "acme",
    name: "Acme Inc",
    issueCount: 140,
    projects: [
      { key: "TRK", name: "Tracker" },
      { key: "WEB", name: "Marketing Website" },
    ],
  },
  {
    slug: "globex",
    name: "Globex",
    issueCount: 60,
    projects: [{ key: "PLT", name: "Platform" }],
  },
] as const;

async function main() {
  await db.transaction(async (tx) => {
    // Идемпотентность: удаляем прошлые сид-данные (каскадом уйдёт всё дочернее)
    // и создаём заново. Запись, не относящаяся к сиду, не затрагивается.
    await tx
      .delete(workspaces)
      .where(inArray(workspaces.slug, SEED.map((w) => w.slug)));

    for (const ws of SEED) {
      const [workspace] = await tx
        .insert(workspaces)
        .values({ name: ws.name, slug: ws.slug })
        .returning();

      await tx.insert(workspaceMembers).values(
        USERS.map((userId, i) => ({
          workspaceId: workspace.id,
          userId,
          role: i === 0 ? ("owner" as const) : ("member" as const),
        })),
      );

      const createdProjects = await tx
        .insert(projects)
        .values(ws.projects.map((p) => ({ ...p, workspaceId: workspace.id })))
        .returning();

      const createdLabels = await tx
        .insert(labels)
        .values(LABELS.map((l) => ({ ...l, workspaceId: workspace.id })))
        .returning();

      const issueRows = Array.from({ length: ws.issueCount }, (_, i) => {
        const project = pick(createdProjects);
        const createdAt = new Date(Date.now() - Math.floor(rand() * 90 * 86400000));
        return {
          workspaceId: workspace.id,
          projectId: project.id,
          number: i + 1,
          title: `${pick(VERBS)} ${pick(OBJECTS)}`,
          description:
            rand() < 0.7
              ? `Details for ${project.key}-${i + 1}: steps to reproduce, expected result and notes.`
              : null,
          status: weighted(STATUSES),
          priority: weighted(PRIORITIES),
          assigneeId: rand() < 0.75 ? pick(USERS) : null,
          createdAt,
          updatedAt: createdAt,
        };
      });
      const createdIssues = await tx.insert(issues).values(issueRows).returning();

      const linkRows: { issueId: string; labelId: string }[] = [];
      const commentRows: { issueId: string; authorId: string; body: string }[] = [];
      for (const issue of createdIssues) {
        const labelCount = Math.floor(rand() * 3); // 0..2
        const chosen = new Set<string>();
        while (chosen.size < labelCount) chosen.add(pick(createdLabels).id);
        for (const labelId of chosen) linkRows.push({ issueId: issue.id, labelId });

        if (rand() < 0.4) {
          const n = 1 + Math.floor(rand() * 3);
          for (let c = 0; c < n; c++) {
            commentRows.push({
              issueId: issue.id,
              authorId: pick(USERS),
              body: pick(COMMENT_BODIES),
            });
          }
        }
      }
      if (linkRows.length) await tx.insert(issueLabels).values(linkRows);
      if (commentRows.length) await tx.insert(comments).values(commentRows);

      // Счётчик номеров должен продолжаться после последней сид-задачи
      await tx
        .update(workspaces)
        .set({ issueCounter: ws.issueCount })
        .where(eq(workspaces.id, workspace.id));
    }
  });

  console.log("Seed готов");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => client.end());
