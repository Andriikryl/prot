import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Фронтенд (FSD) не ходит в БД напрямую: данные приходят через
    // публичный API модулей server/ (запросы и сервисы).
    files: ["src/**/*.{ts,tsx}", "app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@server/db", "@server/db/*", "**/server/db", "**/server/db/*"],
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
    // Алиас @/* указывает на src/ (фронтенд), поэтому запрещён целиком.
    files: ["server/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/*", "**/src/*", "**/app/*"],
              message:
                "server/ не должен импортировать фронтенд (src/, app/). Зависимость должна идти от UI к server.",
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
