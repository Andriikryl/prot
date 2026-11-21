import "server-only";

// Единственная точка входа в БД для кода приложения.
// server-only: клиентский компонент, импортирующий это, сломает сборку.
// Скрипты вне Next (seed, drizzle-kit) используют ./client и ./schema напрямую.
export { db, client } from "./client";
export * from "./schema";
