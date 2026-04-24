import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.ts"],
    globals: false,
    coverage: {
      provider: "v8",
      include: ["src/app/api/**/*.ts", "src/db/**/*.ts", "src/lib/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.spec.ts",
        "src/test/**",
        "src/lib/language-context.tsx",
        "src/lib/auth-context.tsx",
        "src/lib/settings-context.tsx",
        "src/lib/i18n.ts",
        "src/lib/excel-parser.ts",
        "src/lib/constants.ts",
        "src/lib/types.ts",
        "src/app/api/seed/**",
        "src/db/index.ts",
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 80,
        statements: 90,
      },
    },
  },
});
