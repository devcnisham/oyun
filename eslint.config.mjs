import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Claude Code agent worktrees hold their own copies and build output
    ".claude/**",
    ".data/**",
  ]),
  // web, partner and admin must not import each other: shared code goes in src/modules/shared
  ...["web", "partner", "admin"].map((mod) => ({
    files: [`src/modules/${mod}/**/*.{ts,tsx}`],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["web", "partner", "admin"]
            .filter((o) => o !== mod)
            .map((o) => ({ group: [`@/modules/${o}/*`], message: `${mod} must not import ${o}. Move the shared code to src/modules/shared.` })),
        },
      ],
    },
  })),
]);

export default eslintConfig;
