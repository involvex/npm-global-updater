// Global mocks for testing
import { mock } from "bun:test";
import packageJSON from "../package.json";

// Mock environment variables
process.env.NODE_ENV = "test";
process.env.BUN_ENV = "test";
process.env.NPM_UPDATER_TEST_MODE = "true";

// Mock external dependencies
mock.module("../src/commands/about.ts", () => ({
  showabout: mock(async () => {
    console.log("=== About this app ===");
    console.log("Name: " + packageJSON.name);
    console.log("=".repeat(60));
    console.log("Repository: " + packageJSON.repository.url);
    console.log("=".repeat(60));
    console.log("Description: " + packageJSON.description);
    console.log("=".repeat(60));
    console.log("Version: v" + packageJSON.version);
    console.log("=".repeat(60));
    console.log("Author: " + packageJSON.author);
    console.log("=".repeat(60));
    console.log(
      "NPMjs: https://www.npmjs.com/package/@involvex/npm-global-updater",
    );
    console.log("=".repeat(60));
  }),
}));

// Mock console methods to prevent test pollution
const originalConsole = globalThis.console;
globalThis.console = {
  ...originalConsole,
  warn: mock(() => {}),
  error: mock(() => {}),
  log: mock(() => {}),
} as unknown as Console;

// Note: Cleanup handled in individual test files to avoid TypeScript issues
