import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Фронтенд не ходит в БД напрямую: данные приходят через
    // публичный API модулей server/ (запросы и сервисы).
    files: [
      "app/**/*.{ts,tsx}",
      "components/**/*.{ts,tsx}",
      "hooks/**/*.{ts,tsx}",
      "lib/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@server/db",
                "@server/db/*",
                "@/server/*",
                "**/server/db",
                "**/server/db/*",
              ],
              message:
                "Прямой доступ к БД разрешён только внутри server/. Используй публичный API серверного модуля.",
            },
          ],
        },
      ],
    },
  },
  {
    // Бэкенд не знает о фронтенде: зависимости идут только от UI к server.
    // Алиас @/* указывает на корень проекта (фронтенд), поэтому запрещён целиком.
    files: ["server/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/*", "**/app/*", "**/components/*", "**/hooks/*"],
              message:
                "server/ не должен импортировать фронтенд (app/, components/, hooks/, lib/). Зависимость должна идти от UI к server.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
