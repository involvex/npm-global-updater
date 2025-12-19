// Test utilities and fixtures for ConfigManager testing
import type {
  ConfigSettings,
  PackageMetadata,
  AlertHistory,
} from "../src/config/configManager";

// Test data fixtures
export const createMockConfig = (): ConfigSettings => ({
  alerts: {
    enabled: true,
    interval: { value: 1, unit: "hours" },
    methods: ["desktop", "email"],
    silentMode: false,
    email: {
      smtpHost: "smtp.example.com",
      smtpPort: 587,
      username: "test@example.com",
      password: "testpassword",
      from: "test@example.com",
      to: ["admin@example.com"],
    },
    quietHours: {
      start: "22:00",
      end: "08:00",
    },
  },
  backups: {
    enabled: true,
    interval: { value: 6, unit: "hours" },
    retentionDays: 30,
    location: "/tmp/test-backups",
  },
  export: {
    defaultFormat: "json",
    defaultDirectory: "/tmp/exports",
    includeTimestamps: true,
    autoTimestamp: true,
  },
  tracking: {
    enabled: true,
    storeInstallationDates: true,
    storeUpdateHistory: true,
    retentionDays: 120,
  },
  monitoring: {
    checkSecurityVulnerabilities: true,
    checkDeprecatedPackages: true,
    checkOutdatedVersions: true,
    notificationThresholds: {
      critical: 45,
      warning: 14,
    },
  },
  packageManagers: {
    default: "pnpm",
    enabled: ["npm", "pnpm", "yarn"],
  },
  general: {
    autoBackup: true,
    logLevel: "debug",
    maxConcurrentUpdates: 10,
  },
});

export const createMockPackageMetadata = (): PackageMetadata[] => [
  {
    name: "lodash",
    version: "4.17.21",
    packageManager: "npm",
    installedDate: new Date("2023-01-15"),
    lastUpdated: new Date("2023-01-15"),
    sourceRegistry: "https://registry.npmjs.org",
    description: "Modern JavaScript utility library",
    homepage: "https://lodash.com",
    license: "MIT",
    dependencies: {},
    devDependencies: {},
    securityAdvisories: [],
  },
  {
    name: "express",
    version: "4.18.2",
    packageManager: "yarn",
    installedDate: new Date("2023-02-01"),
    lastUpdated: new Date("2023-02-01"),
    sourceRegistry: "https://registry.yarnpkg.com",
    description: "Fast, unopinionated, minimalist web framework for node",
    homepage: "https://expressjs.com",
    license: "MIT",
    dependencies: {
      "body-parser": "^1.20.1",
      "cookie-parser": "^1.4.6",
    },
    devDependencies: {},
    securityAdvisories: [],
  },
];

export const createMockAlertHistory = (): AlertHistory[] => [
  {
    id: "alert-1",
    packageName: "lodash",
    packageManager: "npm",
    type: "outdated",
    message: "Package lodash has a newer version available",
    timestamp: new Date("2023-12-01"),
    acknowledged: false,
    resolved: false,
    metadata: {
      currentVersion: "4.17.21",
      latestVersion: "4.18.0",
    },
  },
  {
    id: "alert-2",
    packageName: "express",
    packageManager: "yarn",
    type: "security",
    message: "Security vulnerability detected in express",
    timestamp: new Date("2023-12-02"),
    acknowledged: true,
    resolved: false,
    metadata: {
      cve: "CVE-2023-1234",
      severity: "high",
    },
  },
];

export const createInvalidConfig = (): Record<string, unknown> => ({
  alerts: {
    enabled: "not-a-boolean", // Invalid type
    interval: {
      value: "not-a-number", // Invalid type
      unit: "invalid-unit", // Invalid enum value
    },
    methods: ["invalid-method"], // Invalid method
  },
  // Missing required fields
});

export const createMalformedJsonConfig = (): string => `{
  "alerts": {
    "enabled": true,
    "interval": {
      "value": 1,
      "unit": "hours"
    },
    "methods": ["desktop"]
  },
  "invalid": "json", // Extra comma
}`;

// Mock file system operations
export const createMockFs = () => {
  const files = new Map<string, string>();
  const directories = new Set<string>();

  return {
    files,
    directories,

    // Mock mkdir
    mkdir: async (path: string, options?: { recursive?: boolean }) => {
      directories.add(path);
      if (options?.recursive) {
        // Simulate creating parent directories
        const parts = path.split("/");
        for (let i = 1; i < parts.length; i++) {
          directories.add(parts.slice(0, i).join("/"));
        }
      }
    },

    // Mock readFile
    readFile: async (path: string) => {
      const content = files.get(path);
      if (content === undefined) {
        throw new Error(`ENOENT: no such file or directory, open '${path}'`);
      }
      return content;
    },

    // Mock writeFile
    writeFile: async (path: string, content: string) => {
      files.set(path, content);
      directories.add(path.substring(0, path.lastIndexOf("/")) || "/");
    },

    // Reset all data
    reset: () => {
      files.clear();
      directories.clear();
    },

    // Check if directory exists
    dirExists: (path: string) => directories.has(path),

    // Check if file exists
    fileExists: (path: string) => files.has(path),

    // Get file content
    getFileContent: (path: string) => files.get(path) || null,
  };
};

// Test helper functions
export const waitForAsync = (ms: number = 0) =>
  new Promise(resolve => setTimeout(resolve, ms));

export const assertThrowsAsync = async (
  fn: () => Promise<unknown>,
  expectedMessage?: string,
) => {
  let error: Error | null = null;

  try {
    await fn();
  } catch (e) {
    error = e as Error;
  }

  if (error === null) {
    throw new Error("Expected function to throw but it did not");
  }

  if (expectedMessage) {
    if (!error.message.includes(expectedMessage)) {
      throw new Error(
        `Expected error message to contain "${expectedMessage}" but got "${error.message}"`,
      );
    }
  }

  return error;
};

// Validation helpers
export const validateConfigStructure = (config: ConfigSettings) => {
  if (!("alerts" in config)) throw new Error("Config missing alerts property");
  if (!("backups" in config))
    throw new Error("Config missing backups property");
  if (!("export" in config)) throw new Error("Config missing export property");
  if (!("tracking" in config))
    throw new Error("Config missing tracking property");
  if (!("monitoring" in config))
    throw new Error("Config missing monitoring property");
  if (!("packageManagers" in config))
    throw new Error("Config missing packageManagers property");
  if (!("general" in config))
    throw new Error("Config missing general property");

  // Validate alerts structure
  if (!("enabled" in config.alerts))
    throw new Error("Alerts missing enabled property");
  if (!("interval" in config.alerts))
    throw new Error("Alerts missing interval property");
  if (!("methods" in config.alerts))
    throw new Error("Alerts missing methods property");
  if (!("silentMode" in config.alerts))
    throw new Error("Alerts missing silentMode property");

  if (!("value" in config.alerts.interval))
    throw new Error("Alert interval missing value property");
  if (!("unit" in config.alerts.interval))
    throw new Error("Alert interval missing unit property");
  if (!["minutes", "hours", "days"].includes(config.alerts.interval.unit)) {
    throw new Error(
      `Invalid alert interval unit: ${config.alerts.interval.unit}`,
    );
  }
};

export const validatePackageMetadataStructure = (
  packages: PackageMetadata[],
) => {
  packages.forEach(pkg => {
    if (!("name" in pkg)) throw new Error("Package missing name property");
    if (!("version" in pkg))
      throw new Error("Package missing version property");
    if (!("packageManager" in pkg))
      throw new Error("Package missing packageManager property");
    if (!("installedDate" in pkg))
      throw new Error("Package missing installedDate property");
    if (!("lastUpdated" in pkg))
      throw new Error("Package missing lastUpdated property");
    if (!("sourceRegistry" in pkg))
      throw new Error("Package missing sourceRegistry property");

    if (typeof pkg.name !== "string")
      throw new Error("Package name must be string");
    if (typeof pkg.version !== "string")
      throw new Error("Package version must be string");
    if (typeof pkg.packageManager !== "string")
      throw new Error("Package packageManager must be string");
    if (!(pkg.installedDate instanceof Date))
      throw new Error("Package installedDate must be Date");
    if (!(pkg.lastUpdated instanceof Date))
      throw new Error("Package lastUpdated must be Date");
  });
};

export const validateAlertHistoryStructure = (alerts: AlertHistory[]) => {
  alerts.forEach(alert => {
    if (!("id" in alert)) throw new Error("Alert missing id property");
    if (!("packageName" in alert))
      throw new Error("Alert missing packageName property");
    if (!("packageManager" in alert))
      throw new Error("Alert missing packageManager property");
    if (!("type" in alert)) throw new Error("Alert missing type property");
    if (!("message" in alert))
      throw new Error("Alert missing message property");
    if (!("timestamp" in alert))
      throw new Error("Alert missing timestamp property");
    if (!("acknowledged" in alert))
      throw new Error("Alert missing acknowledged property");
    if (!("resolved" in alert))
      throw new Error("Alert missing resolved property");

    if (typeof alert.id !== "string")
      throw new Error("Alert id must be string");
    if (typeof alert.packageName !== "string")
      throw new Error("Alert packageName must be string");
    if (typeof alert.packageManager !== "string")
      throw new Error("Alert packageManager must be string");
    if (
      !["outdated", "vulnerable", "deprecated", "security"].includes(alert.type)
    ) {
      throw new Error(`Invalid alert type: ${alert.type}`);
    }
    if (typeof alert.message !== "string")
      throw new Error("Alert message must be string");
    if (!(alert.timestamp instanceof Date))
      throw new Error("Alert timestamp must be Date");
    if (typeof alert.acknowledged !== "boolean")
      throw new Error("Alert acknowledged must be boolean");
    if (typeof alert.resolved !== "boolean")
      throw new Error("Alert resolved must be boolean");
  });
};
