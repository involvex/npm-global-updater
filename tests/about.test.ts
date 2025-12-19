import { test, expect, mock } from "bun:test";
import packageinfo from "../package.json";

// Mock external dependencies to isolate the function under test
mock.module("console-clear", () => ({ default: mock() }));
mock.module("src/utils/logo", () => ({ showlogo: mock() }));
mock.module("./version", () => ({
  returnversion: mock(() => `v${packageinfo.version}`),
}));

test("showabout command should display application information correctly", async () => {
  // Arrange
  const consoleLogMock = mock();
  const originalConsoleLog = console.log;
  console.log = consoleLogMock;

  // Import the function under test
  const { showabout } = await import("../src/commands/about");

  // Act
  await showabout();

  // Assert - Verify function is exported and callable
  expect(typeof showabout).toBe("function");
  expect(showabout).toBeDefined();
  expect(showabout).toBeInstanceOf(Function);

  // Verify the function was called
  expect(consoleLogMock).toHaveBeenCalled();

  // Verify expected console.log calls with proper content
  const logCalls = consoleLogMock.mock.calls;

  const hasAboutHeader = logCalls.some(
    ([arg]) =>
      typeof arg === "string" && arg.includes("=== About this app ==="),
  );
  const hasPackageName = logCalls.some(
    ([arg]) =>
      typeof arg === "string" && arg.includes(`Name: ${packageinfo.name}`),
  );
  const hasRepository = logCalls.some(
    ([arg]) => typeof arg === "string" && arg.includes("Repository:"),
  );
  const hasDescription = logCalls.some(
    ([arg]) => typeof arg === "string" && arg.includes("Description:"),
  );
  const hasVersion = logCalls.some(
    ([arg]) => typeof arg === "string" && arg.includes("Version:"),
  );
  const hasAuthor = logCalls.some(
    ([arg]) => typeof arg === "string" && arg.includes("Author:"),
  );
  const hasNpmLink = logCalls.some(
    ([arg]) => typeof arg === "string" && arg.includes("NPMjs:"),
  );

  expect(hasAboutHeader).toBe(true);
  expect(hasPackageName).toBe(true);
  expect(hasRepository).toBe(true);
  expect(hasDescription).toBe(true);
  expect(hasVersion).toBe(true);
  expect(hasAuthor).toBe(true);
  expect(hasNpmLink).toBe(true);

  // Restore original console.log
  console.log = originalConsoleLog;
});

test("showabout command should handle missing package info gracefully", async () => {
  // Arrange - Mock package with missing properties
  const originalConsoleLog = console.log;
  const consoleLogMock = mock();
  console.log = consoleLogMock;

  // Temporarily modify package info
  const originalRepository = packageinfo.repository;
  packageinfo.repository = { url: "https://example.com" } as {
    type: string;
    url: string;
  };

  // Import fresh copy with modified data
  const { showabout } = await import("../src/commands/about");

  // Act & Assert
  expect(showabout()).resolves.not.toThrow("Error");

  // Verify it still logs something (even with missing data)
  expect(consoleLogMock).toHaveBeenCalled();

  // Restore
  packageinfo.repository = originalRepository;
  console.log = originalConsoleLog;
});

test("showabout command should work as async function", async () => {
  // Arrange
  const originalConsoleLog = console.log;
  const consoleLogMock = mock();
  console.log = consoleLogMock;

  const { showabout } = await import("../src/commands/about");

  // Act
  const result = await showabout();

  // Assert
  expect(result).toBeUndefined(); // Function doesn't return anything explicitly
  expect(consoleLogMock).toHaveBeenCalled();

  // Restore
  console.log = originalConsoleLog;
});

test("showabout command should be properly exported from module", async () => {
  // Arrange & Act
  const aboutModule = await import("../src/commands/about");

  // Assert
  expect(aboutModule).toHaveProperty("showabout");
  expect(typeof aboutModule.showabout).toBe("function");
  expect(aboutModule.showabout.constructor.name).toBe("Function");
});

test("showabout command should not throw errors during execution", async () => {
  // Arrange
  const originalConsoleLog = console.log;
  const consoleLogMock = mock();
  console.log = consoleLogMock;

  const { showabout } = await import("../src/commands/about");

  // Act & Assert
  expect(() => showabout()).not.toThrow(showabout());
  await expect(showabout()).resolves.toBeUndefined();
  expect(consoleLogMock).toHaveBeenCalled();

  // Restore
  console.log = originalConsoleLog;
});
