import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL не задан");

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema",
  out: "./db/migrations",
  dbCredentials: {
    url: url
  },
});