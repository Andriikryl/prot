import { defineConfig } from "steiger";
import fsd from "@feature-sliced/steiger-plugin";

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // Слои app и pages переименованы в _app и _pages (требование Next.js),
    // поэтому проверка опечаток в именах слоёв даёт ложные срабатывания.
    rules: {
      "fsd/typo-in-layer-name": "off",
    },
  },
]);
