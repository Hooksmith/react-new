// Shared ESLint flat config for Next.js zones.
// eslint-config-next bundles react, react-hooks, jsx-a11y and @next/next rules.
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

export default [
  { ignores: [".next/**", "coverage/**", "next-env.d.ts"] },
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      // Raw HTML injection is the #1 XSS vector in React apps — forbid it outright.
      "react/no-danger": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "jsx-a11y/anchor-is-valid": "error",
    },
  },
  prettier,
];
