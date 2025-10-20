import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig({
  files: ["**/*.js"],
  plugins: { js },
  extends: ["js/recommended"],
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    globals: globals.node,
  },
  rules: {
    "no-console": "off",
    "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
  },
});
