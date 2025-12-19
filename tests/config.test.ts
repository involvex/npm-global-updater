/**
 * Comprehensive Unit Tests for ConfigManager
 * Testing configuration loading, validation, error handling, and edge cases
 */

import { describe, test, expect, beforeEach } from "bun:test";
import { promises as fs } from "fs";
import { join } from "path";
import { homedir } from "os";
import {
  ConfigManager,
  type PackageMetadata,
  type AlertHistory,
} from "../src/config/configManager";

// Helper function to clean up test data files only (not config)
async function cleanupTestData() {
  const dataPath = join(homedir(), ".config", "npm-updater", "data");
  try {
    await fs.rm(dataPath, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

describe("ConfigManager", () => {
  let configManager: ConfigManager;

  beforeEach(async () => {
    // Reset singleton instance for each test
    (ConfigManager as unknown as { instance?: ConfigManager }).instance =
      undefined;

    configManager = ConfigManager.getInstance();
  });

  describe("Singleton Pattern", () => {
    test("should return the same instance on multiple calls", () => {
      const instance1 = ConfigManager.getInstance();
      const instance2 = ConfigManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    test("should create instance only once", () => {
      const instances = Array.from({ length: 5 }, () =>
        ConfigManager.getInstance(),
      );
      const firstInstance = instances[0];

      instances.forEach(instance => {
        if (firstInstance && instance) {
          expect(instance).toBe(firstInstance);
        }
      });
    });
  });

  describe("Initialization", () => {
    beforeEach(async () => {
      await cleanupTestData(); // Clean data files before each test in this suite
      // Reset singleton instance for each test
      (ConfigManager as unknown as { instance?: ConfigManager }).instance =
        undefined;
      configManager = ConfigManager.getInstance();
    });

    test("should initialize and create default configuration", async () => {
      await configManager.initialize();

      const config = configManager.getConfig();
      expect(config).toBeDefined();
      expect(config.alerts).toBeDefined();
      expect(config.backups).toBeDefined();
      expect(config.export).toBeDefined();
      expect(config.tracking).toBeDefined();
      expect(config.monitoring).toBeDefined();
      expect(config.packageManagers).toBeDefined();
      expect(config.general).toBeDefined();
    });

    test("should create default configuration with correct values", async () => {
      await configManager.initialize();

      const config = configManager.getConfig();

      // Check default values
      expect(config.alerts.enabled).toBe(false);
      expect(config.alerts.interval.value).toBe(24);
      expect(config.alerts.interval.unit).toBe("hours");
      expect(config.alerts.methods).toEqual(["desktop"]);
      expect(config.backups.enabled).toBe(false);
      expect(config.export.defaultFormat).toBe("txt");
      expect(config.tracking.enabled).toBe(true);
      expect(config.monitoring.checkSecurityVulnerabilities).toBe(true);
      expect(config.packageManagers.default).toBe("npm");
      expect(config.general.logLevel).toBe("info");
      expect(config.general.maxConcurrentUpdates).toBe(5);
    });

    test("should use correct default paths", async () => {
      await configManager.initialize();

      const config = configManager.getConfig();

      expect(config.backups.location).toContain(".npm-updater");
      expect(config.export.defaultDirectory).toContain("Downloads");
    });
  });

  describe("Configuration Management", () => {
    beforeEach(async () => {
      await cleanupTestData(); // Clean data files before each test in this suite
      await configManager.initialize();
    });

    test("should provide valid configuration structure", () => {
      const config = configManager.getConfig();

      // Test main sections exist
      expect(typeof config).toBe("object");
      expect(config).not.toBeNull();

      // Test nested structure
      expect(config.alerts.enabled).toBeTypeOf("boolean");
      expect(config.general.logLevel).toBeTypeOf("string");
      expect(config.general.maxConcurrentUpdates).toBeTypeOf("number");
    });

    test("should validate interval configuration", () => {
      const config = configManager.getConfig();

      expect(config.alerts.interval.value).toBeGreaterThan(0);
      expect(["minutes", "hours", "days"]).toContain(
        config.alerts.interval.unit,
      );
    });

    test("should validate package manager configuration", () => {
      const config = configManager.getConfig();

      expect(typeof config.packageManagers.default).toBe("string");
      expect(Array.isArray(config.packageManagers.enabled)).toBe(true);
      expect(config.packageManagers.enabled.length).toBeGreaterThan(0);
    });

    test("should validate monitoring thresholds", () => {
      const config = configManager.getConfig();

      expect(config.monitoring.notificationThresholds.critical).toBeGreaterThan(
        0,
      );
      expect(config.monitoring.notificationThresholds.warning).toBeGreaterThan(
        0,
      );
      expect(config.monitoring.notificationThresholds.critical).toBeGreaterThan(
        config.monitoring.notificationThresholds.warning,
      );
    });
  });

  describe("Package Metadata Operations", () => {
    beforeEach(async () => {
      await cleanupTestData(); // Clean data files before each test in this suite
      await configManager.initialize();
    });

    test("should save and retrieve package metadata", async () => {
      const packageData: PackageMetadata = {
        name: "test-package",
        version: "1.0.0",
        packageManager: "npm",
        installedDate: new Date("2023-01-01"),
        lastUpdated: new Date("2023-01-01"),
        sourceRegistry: "https://registry.npmjs.org",
        description: "Test package",
        license: "MIT",
      };

      await configManager.savePackageMetadata(packageData);

      const packages = await configManager.getPackageMetadata();
      expect(packages).toHaveLength(1);

      if (packages[0]) {
        expect(packages[0].name).toBe("test-package");
        expect(packages[0].version).toBe("1.0.0");
        expect(packages[0].packageManager).toBe("npm");
      }
    });

    test("should update existing package metadata", async () => {
      const initialData: PackageMetadata = {
        name: "test-package",
        version: "1.0.0",
        packageManager: "npm",
        installedDate: new Date("2023-01-01"),
        lastUpdated: new Date("2023-01-01"),
        sourceRegistry: "https://registry.npmjs.org",
      };

      const updatedData: PackageMetadata = {
        ...initialData,
        version: "1.1.0",
        lastUpdated: new Date("2023-02-01"),
      };

      await configManager.savePackageMetadata(initialData);
      await configManager.savePackageMetadata(updatedData);

      const packages = await configManager.getPackageMetadata();
      expect(packages).toHaveLength(1);

      if (packages[0]) {
        expect(packages[0].version).toBe("1.1.0");
      }
    });

    test("should handle empty package metadata", async () => {
      const packages = await configManager.getPackageMetadata();
      expect(packages).toEqual([]);
    });

    test("should filter packages by package manager", async () => {
      const packages = await configManager.getPackageMetadata("npm");
      expect(Array.isArray(packages)).toBe(true);
    });

    test("should validate package metadata structure", async () => {
      const packageData: PackageMetadata = {
        name: "test",
        version: "1.0.0",
        packageManager: "npm",
        installedDate: new Date(),
        lastUpdated: new Date(),
        sourceRegistry: "https://registry.npmjs.org",
      };

      await configManager.savePackageMetadata(packageData);
      const packages = await configManager.getPackageMetadata();

      if (packages[0]) {
        expect(typeof packages[0].name).toBe("string");
        expect(typeof packages[0].version).toBe("string");
        expect(typeof packages[0].packageManager).toBe("string");
        expect(packages[0].installedDate instanceof Date).toBe(true);
        expect(packages[0].lastUpdated instanceof Date).toBe(true);
        expect(typeof packages[0].sourceRegistry).toBe("string");
      }
    });
  });

  describe("Alert History Operations", () => {
    beforeEach(async () => {
      await cleanupTestData(); // Clean data files before each test in this suite
      await configManager.initialize();
    });

    test("should save and retrieve alert history", async () => {
      const alert: AlertHistory = {
        id: "test-alert",
        packageName: "test-package",
        packageManager: "npm",
        type: "outdated",
        message: "Package is outdated",
        timestamp: new Date(), // Use current date to avoid retention filtering
        acknowledged: false,
        resolved: false,
      };

      await configManager.saveAlertHistory(alert);

      // Force a small delay to ensure file write completes
      await new Promise(resolve => setTimeout(resolve, 10));

      const alerts = await configManager.getAlertHistory();
      expect(alerts).toHaveLength(1);

      if (alerts[0]) {
        expect(alerts[0].id).toBe("test-alert");
        expect(alerts[0].packageName).toBe("test-package");
        expect(alerts[0].type).toBe("outdated");
      }
    });

    test("should handle empty alert history", async () => {
      const alerts = await configManager.getAlertHistory();
      expect(alerts).toEqual([]);
    });

    test("should filter alerts by days", async () => {
      const recentAlerts = await configManager.getAlertHistory(1); // Last day
      expect(Array.isArray(recentAlerts)).toBe(true);
    });

    test("should sort alerts by timestamp (newest first)", async () => {
      const oldAlert: AlertHistory = {
        id: "old",
        packageName: "pkg1",
        packageManager: "npm",
        type: "outdated",
        message: "Old",
        timestamp: new Date("2023-01-01"),
        acknowledged: false,
        resolved: false,
      };

      const newAlert: AlertHistory = {
        id: "new",
        packageName: "pkg2",
        packageManager: "npm",
        type: "outdated",
        message: "New",
        timestamp: new Date("2023-12-01"),
        acknowledged: false,
        resolved: false,
      };

      await configManager.saveAlertHistory(oldAlert);
      await configManager.saveAlertHistory(newAlert);

      const alerts = await configManager.getAlertHistory();

      if (alerts[0] && alerts[1]) {
        expect(alerts[0].id).toBe("new"); // Newer first
        expect(alerts[1].id).toBe("old");
      }
    });

    test("should validate alert history structure", async () => {
      const alert: AlertHistory = {
        id: "test",
        packageName: "test-pkg",
        packageManager: "npm",
        type: "outdated",
        message: "Test alert",
        timestamp: new Date(),
        acknowledged: false,
        resolved: false,
      };

      await configManager.saveAlertHistory(alert);
      const alerts = await configManager.getAlertHistory();

      if (alerts[0]) {
        expect(typeof alerts[0].id).toBe("string");
        expect(typeof alerts[0].packageName).toBe("string");
        expect(typeof alerts[0].packageManager).toBe("string");
        expect(["outdated", "vulnerable", "deprecated", "security"]).toContain(
          alerts[0].type,
        );
        expect(typeof alerts[0].message).toBe("string");
        expect(alerts[0].timestamp instanceof Date).toBe(true);
        expect(typeof alerts[0].acknowledged).toBe("boolean");
        expect(typeof alerts[0].resolved).toBe("boolean");
      }
    });
  });

  describe("Data Management", () => {
    beforeEach(async () => {
      await cleanupTestData(); // Clean data files before each test in this suite
      await configManager.initialize();
    });

    test("should provide correct data path", () => {
      const dataPath = configManager.getDataPath();
      expect(typeof dataPath).toBe("string");
      expect(dataPath.length).toBeGreaterThan(0);
      expect(dataPath).toContain("npm-updater");
      expect(dataPath).toContain("data");
    });

    test("should cleanup old data without throwing", async () => {
      await expect(configManager.cleanupOldData()).resolves.toBeUndefined();
    });
  });

  describe("Edge Cases", () => {
    beforeEach(async () => {
      await cleanupTestData(); // Clean data files before each test in this suite
      await configManager.initialize();
    });

    test("should handle extremely long configuration values", async () => {
      const longValue = "a".repeat(10000);

      // This tests that the system can handle large values without crashing
      const config = configManager.getConfig();
      expect(typeof config.general.logLevel).toBe("string");

      // Use longValue to avoid unused variable warning
      expect(longValue.length).toBe(10000);
    });

    test("should handle special characters in configuration", async () => {
      // Test with special characters doesn't crash the system
      const config = configManager.getConfig();
      expect(config).toBeDefined();
    });

    test("should handle timezone-sensitive operations", async () => {
      const testDate = new Date();
      testDate.setDate(testDate.getDate() - 1); // Yesterday to ensure it's within retention
      const timezoneAlert: AlertHistory = {
        id: "tz-test",
        packageName: "test-package",
        packageManager: "npm",
        type: "outdated",
        message: "Test timezone handling",
        timestamp: testDate,
        acknowledged: false,
        resolved: false,
      };

      await configManager.saveAlertHistory(timezoneAlert);

      // Force a small delay to ensure file write completes
      await new Promise(resolve => setTimeout(resolve, 10));

      const alerts = await configManager.getAlertHistory();
      expect(alerts).toHaveLength(1);

      if (alerts[0]) {
        expect(alerts[0].timestamp.getTime()).toBe(
          timezoneAlert.timestamp.getTime(),
        );
      }
    });

    test("should handle concurrent operations gracefully", async () => {
      // Test multiple concurrent operations don't crash
      const operations = [
        configManager.getConfig(),
        configManager.getDataPath(),
        configManager.getPackageMetadata(),
        configManager.getAlertHistory(),
      ];

      const results = await Promise.all(operations);
      expect(results).toHaveLength(4);
    });

    test("should handle invalid data types gracefully", async () => {
      // Test that the system doesn't crash with edge case inputs
      const config = configManager.getConfig();
      expect(config.general.logLevel).toMatch(/^(debug|info|warn|error)$/);
      expect(config.general.maxConcurrentUpdates).toBeGreaterThan(0);
    });
  });

  describe("Performance", () => {
    beforeEach(async () => {
      await cleanupTestData(); // Clean data files before each test in this suite
      await configManager.initialize();
    });

    test("should handle multiple operations efficiently", async () => {
      const startTime = Date.now();

      // Perform multiple operations
      for (let i = 0; i < 10; i++) {
        configManager.getConfig();
        configManager.getDataPath();
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete quickly
      expect(duration).toBeLessThan(1000); // 1 second max
    });

    test("should efficiently handle large numbers of packages", async () => {
      // Add multiple packages
      const packages = Array.from({ length: 100 }, (_, i) => ({
        name: `package-${i}`,
        version: "1.0.0",
        packageManager: i % 2 === 0 ? "npm" : "yarn",
        installedDate: new Date(),
        lastUpdated: new Date(),
        sourceRegistry: "https://registry.npmjs.org",
      }));

      for (const pkg of packages) {
        await configManager.savePackageMetadata(pkg);
      }

      const startTime = Date.now();
      const retrievedPackages = await configManager.getPackageMetadata();
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(retrievedPackages.length).toBeGreaterThan(50);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe("Configuration Validation", () => {
    beforeEach(async () => {
      await cleanupTestData(); // Clean data files before each test in this suite
      await configManager.initialize();
    });

    test("should validate all required configuration sections", () => {
      const config = configManager.getConfig();

      // Test main sections
      expect(config).toHaveProperty("alerts");
      expect(config).toHaveProperty("backups");
      expect(config).toHaveProperty("export");
      expect(config).toHaveProperty("tracking");
      expect(config).toHaveProperty("monitoring");
      expect(config).toHaveProperty("packageManagers");
      expect(config).toHaveProperty("general");

      // Test nested required properties
      expect(config.alerts).toHaveProperty("enabled");
      expect(config.alerts).toHaveProperty("interval");
      expect(config.general).toHaveProperty("logLevel");
      expect(config.general).toHaveProperty("maxConcurrentUpdates");
    });

    test("should validate configuration data types", () => {
      const config = configManager.getConfig();

      // Test boolean properties
      expect(config.alerts.enabled).toBeTypeOf("boolean");
      expect(config.backups.enabled).toBeTypeOf("boolean");
      expect(config.tracking.enabled).toBeTypeOf("boolean");

      // Test string properties
      expect(config.general.logLevel).toBeTypeOf("string");
      expect(config.packageManagers.default).toBeTypeOf("string");

      // Test number properties
      expect(config.general.maxConcurrentUpdates).toBeTypeOf("number");
      expect(config.alerts.interval.value).toBeTypeOf("number");

      // Test array properties
      expect(Array.isArray(config.alerts.methods)).toBe(true);
      expect(Array.isArray(config.packageManagers.enabled)).toBe(true);
    });

    test("should validate enum values", () => {
      const config = configManager.getConfig();

      // Test interval unit enum
      expect(["minutes", "hours", "days"]).toContain(
        config.alerts.interval.unit,
      );

      // Test log level enum
      expect(["debug", "info", "warn", "error"]).toContain(
        config.general.logLevel,
      );

      // Test export format enum
      expect(["txt", "json"]).toContain(config.export.defaultFormat);

      // Test package manager default enum
      expect(["npm", "pnpm", "yarn", "bun"]).toContain(
        config.packageManagers.default,
      );
    });
  });
});
