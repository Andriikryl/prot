import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL не задан");

// В dev Next перезагружает модули при каждой правке (HMR). Без кэша в globalThis
// каждая перезагрузка создавала бы новый пул соединений, а старые оставались
// бы висеть, пока Postgres не упрётся в max_connections.
const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>;
};

export const client = globalForDb.pgClient ?? postgres(url);

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgClient = client;
}

export const db = drizzle(client, { schema });
