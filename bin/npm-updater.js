#!/usr/bin/env node
var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};
var __esm = (fn, res) => () => (fn && (res = fn(fn = 0)), res);

// src/utils/packageManager.ts
function validatePackageManager(pm) {
  if (!SUPPORTED_PACKAGE_MANAGERS.includes(pm)) {
    throw new Error(`Unsupported package manager: ${pm}. Supported managers: ${SUPPORTED_PACKAGE_MANAGERS.join(", ")}`);
  }
  return pm;
}
function getPackageManager(pm) {
  return validatePackageManager(pm || "npm");
}
function getPackageManagerConfig(pm) {
  return PACKAGE_MANAGERS[pm];
}
function formatPackageManagerList() {
  return SUPPORTED_PACKAGE_MANAGERS.join(", ");
}
var PACKAGE_MANAGERS, SUPPORTED_PACKAGE_MANAGERS;
var init_packageManager = __esm(() => {
  PACKAGE_MANAGERS = {
    npm: {
      name: "npm",
      displayName: "npm",
      listCommand: "npm list -g",
      listJsonCommand: "npm ls -g --json",
      installCommand: (packageName, version) => `npm install -g ${version ? `${packageName}@${version}` : `${packageName}@latest`}`,
      viewCommand: (packageName, version) => `npm view ${packageName}${version ? `@${version}` : ""} version`
    },
    pnpm: {
      name: "pnpm",
      displayName: "pnpm",
      listCommand: "pnpm list -g",
      listJsonCommand: "pnpm list -g --json",
      installCommand: (packageName, version) => `pnpm add -g ${version ? `${packageName}@${version}` : `${packageName}@latest`}`,
      viewCommand: (packageName, version) => `pnpm view ${packageName}${version ? `@${version}` : ""} version`
    },
    yarn: {
      name: "yarn",
      displayName: "Yarn",
      listCommand: "yarn global list",
      listJsonCommand: "yarn global list --json",
      installCommand: (packageName, version) => `yarn global add ${version ? `${packageName}@${version}` : `${packageName}@latest`}`,
      viewCommand: (packageName, version) => `yarn info ${packageName}${version ? `@${version}` : ""} version`
    },
    bun: {
      name: "bun",
      displayName: "Bun",
      listCommand: "bun list -g",
      listJsonCommand: "bun list -g --json",
      installCommand: (packageName, version) => `bun add -g ${version ? `${packageName}@${version}` : `${packageName}@latest`}`,
      viewCommand: (packageName, version) => `bun info ${packageName}${version ? `@${version}` : ""} version`
    }
  };
  SUPPORTED_PACKAGE_MANAGERS = [
    "npm",
    "pnpm",
    "yarn",
    "bun"
  ];
});

// src/utils/logo.ts
function showlogo() {
  console.log(`
        ░▀█▀░█▀█░█░█░█▀█░█░░░█░█░█▀▀░█░█
        ░░█░░█░█░▀▄▀░█░█░█░░░▀▄▀░█▀▀░▄▀▄
        ░▀▀▀░▀░▀░░▀░░▀▀▀░▀▀▀░░▀░░▀▀▀░▀░▀`);
}

// src/commands/ls.ts
var exports_ls = {};
__export(exports_ls, {
  runls: () => runls
});
import { exec as exec2 } from "child_process";
async function runls(packageManager) {
  const pm = getPackageManager(packageManager);
  const config = getPackageManagerConfig(pm);
  console.log(`Listing global packages using ${config.displayName}...`);
  exec2(config.listCommand, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(stdout);
  });
}
var init_ls = __esm(() => {
  init_packageManager();
});

// src/commands/updateall.ts
var exports_updateall = {};
__export(exports_updateall, {
  runupdateall: () => runupdateall,
  default: () => updateall_default
});
import { exec as exec3 } from "child_process";
async function runupdateall(packageManager) {
  const pm = getPackageManager(packageManager);
  const config = getPackageManagerConfig(pm);
  console.log(`Checking for globally installed packages using ${config.displayName}...`);
  console.log(`This may take a moment...
`);
  exec3(config.listJsonCommand, (error, stdout) => {
    if (error) {
      console.log(`Error getting package list: ${error.message}`);
      return;
    }
    try {
      const data = JSON.parse(stdout);
      const packages = [];
      if (data.dependencies) {
        for (const [name, info] of Object.entries(data.dependencies)) {
          if (typeof info === "object" && info !== null && "version" in info && typeof info.version === "string") {
            packages.push({
              name,
              version: info.version
            });
          }
        }
      }
      console.log(`Found ${packages.length} globally installed packages`);
      console.log(`Checking for available updates...
`);
      if (packages.length === 0) {
        console.log("No global packages found.");
        return;
      }
      let checkCount = 0;
      const packagesToUpdate = [];
      packages.forEach((pkg) => {
        const command = config.viewCommand(pkg.name);
        exec3(command, (viewError, viewStdout) => {
          checkCount++;
          if (viewError) {
            console.log(`Could not check ${pkg.name}: ${viewError.message}`);
          } else {
            try {
              const versionData = JSON.parse(viewStdout);
              const latestVersion = versionData.version || versionData.latest;
              if (latestVersion && latestVersion !== pkg.version) {
                console.log(`${pkg.name}: ${pkg.version} -> ${latestVersion}`);
                packagesToUpdate.push({
                  name: pkg.name,
                  latest: latestVersion
                });
              } else {
                const specialVersions = ["nightly", "dev", "preview"];
                specialVersions.forEach((specType) => {
                  const specCommand = config.viewCommand(pkg.name, specType);
                  exec3(specCommand, (specError, specStdout) => {
                    if (!specError && specStdout.trim()) {
                      try {
                        const specData = JSON.parse(specStdout);
                        const specVersion = specData.version || specData.latest;
                        if (specVersion && specVersion !== pkg.version) {
                          console.log(`${pkg.name}: ${pkg.version} -> ${specVersion} (${specType})`);
                          packagesToUpdate.push({
                            name: pkg.name,
                            latest: specVersion
                          });
                        }
                      } catch {}
                    }
                  });
                });
              }
            } catch {
              console.log(`Could not parse version info for ${pkg.name}`);
            }
          }
          if (checkCount === packages.length) {
            let updateNext = function() {
              if (updateIndex >= packagesToUpdate.length) {
                console.log(`
\uD83C\uDF89 All updates completed!`);
                return;
              }
              const pkgToUpdate = packagesToUpdate[updateIndex];
              if (pkgToUpdate) {
                console.log(`Updating ${pkgToUpdate.name} to ${pkgToUpdate.latest} using ${config.displayName}...`);
                const updateCommand = config.installCommand(pkgToUpdate.name, pkgToUpdate.latest);
                exec3(updateCommand, (updateError) => {
                  if (updateError) {
                    console.log(`❌ Failed to update ${pkgToUpdate.name}: ${updateError.message}`);
                  } else {
                    console.log(`✅ ${pkgToUpdate.name} updated successfully using ${config.displayName}!`);
                  }
                  updateIndex++;
                  updateNext();
                });
              } else {
                updateIndex++;
                updateNext();
              }
            };
            if (packagesToUpdate.length === 0) {
              console.log(`
All packages are already up to date! ✅`);
              return;
            }
            console.log(`
Found ${packagesToUpdate.length} packages with updates available.`);
            console.log(`Starting updates...
`);
            let updateIndex = 0;
            updateNext();
          }
        });
      });
    } catch (parseError) {
      console.log(`Error parsing ${config.displayName} output: ${parseError}`);
    }
  });
}
var updateall_default;
var init_updateall = __esm(() => {
  init_packageManager();
  updateall_default = runupdateall;
});

// src/commands/update.ts
var exports_update = {};
__export(exports_update, {
  runupdate: () => runupdate,
  default: () => update_default
});
import { exec as exec4 } from "child_process";
async function runupdate(inputPackageName, packageManager) {
  const name = inputPackageName || process.argv[3];
  if (!name) {
    console.log("Error: Please provide a package name.");
    console.log("Usage: npm-updater [--pm <package-manager>] update <package-name>[@version]");
    console.log("Examples:");
    console.log("  npm-updater update react");
    console.log("  npm-updater update @google/gemini-cli@nightly");
    console.log("  npm-updater update typescript@5.0.0");
    return;
  }
  const versionMatch = name.match(/^(.+?)(@.+)$/);
  let packageName;
  let version;
  if (versionMatch && versionMatch[1] && versionMatch[2]) {
    packageName = versionMatch[1];
    version = versionMatch[2].substring(1);
    console.log(`Package: ${packageName}, Version: ${version}`);
  } else {
    packageName = name;
  }
  const pm = getPackageManager(packageManager);
  const config = getPackageManagerConfig(pm);
  const versionInfo = version ? ` to version ${version}` : " to latest version";
  console.log(`Updating ${packageName}${versionInfo} using ${config.displayName}...`);
  const installCommand = config.installCommand(packageName, version);
  exec4(installCommand, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(stdout);
    console.log(`${packageName} has been updated successfully using ${config.displayName}!`);
  });
}
var update_default;
var init_update = __esm(() => {
  init_packageManager();
  update_default = runupdate;
});

// src/config/configManager.ts
import { promises as fs } from "fs";
import { join as join2, dirname as dirname2 } from "path";
import { homedir } from "os";

class ConfigManager {
  static instance;
  configPath;
  dataPath;
  config = null;
  constructor() {
    this.configPath = join2(homedir(), ".config", "npm-updater", "config.json");
    this.dataPath = join2(homedir(), ".config", "npm-updater", "data");
  }
  static getInstance() {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager;
    }
    return ConfigManager.instance;
  }
  async initialize() {
    await this.ensureDirectories();
    await this.loadConfig();
  }
  async ensureDirectories() {
    try {
      await fs.mkdir(dirname2(this.configPath), { recursive: true });
      await fs.mkdir(this.dataPath, { recursive: true });
    } catch {
      console.warn("Failed to create config directories");
    }
  }
  async loadConfig() {
    try {
      const data = await fs.readFile(this.configPath, "utf-8");
      this.config = JSON.parse(data);
    } catch {
      this.config = this.getDefaultConfig();
      await this.saveConfig();
    }
  }
  getDefaultConfig() {
    return {
      alerts: {
        enabled: false,
        interval: { value: 24, unit: "hours" },
        methods: ["desktop"],
        silentMode: false
      },
      export: {
        defaultFormat: "txt",
        defaultDirectory: join2(homedir(), "Downloads"),
        includeTimestamps: true,
        autoTimestamp: true
      },
      tracking: {
        enabled: true,
        storeInstallationDates: true,
        storeUpdateHistory: true,
        retentionDays: 90
      },
      monitoring: {
        checkSecurityVulnerabilities: true,
        checkDeprecatedPackages: true,
        checkOutdatedVersions: true,
        notificationThresholds: {
          critical: 30,
          warning: 7
        }
      },
      packageManagers: {
        default: "npm",
        enabled: ["npm", "pnpm", "yarn", "bun"]
      },
      general: {
        autoBackup: true,
        logLevel: "info",
        maxConcurrentUpdates: 5
      }
    };
  }
  async saveConfig() {
    if (!this.config) {
      throw new Error("Config not initialized");
    }
    const configDir = dirname2(this.configPath);
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2), "utf-8");
  }
  getConfig() {
    if (!this.config) {
      throw new Error("Config not initialized. Call initialize() first.");
    }
    return this.config;
  }
  async updateConfig(updates) {
    if (!this.config) {
      throw new Error("Config not initialized");
    }
    this.config = { ...this.config, ...updates };
    await this.saveConfig();
  }
  getDataPath() {
    return this.dataPath;
  }
  async savePackageMetadata(packageData) {
    const packageFile = join2(this.dataPath, "packages.json");
    let packages = [];
    try {
      const data = await fs.readFile(packageFile, "utf-8");
      packages = JSON.parse(data);
    } catch {}
    const existingIndex = packages.findIndex((p) => p.name === packageData.name && p.packageManager === packageData.packageManager);
    if (existingIndex >= 0) {
      packages[existingIndex] = { ...packages[existingIndex], ...packageData };
    } else {
      packages.push(packageData);
    }
    await fs.writeFile(packageFile, JSON.stringify(packages, null, 2));
  }
  async getPackageMetadata(packageManager) {
    const packageFile = join2(this.dataPath, "packages.json");
    try {
      const data = await fs.readFile(packageFile, "utf-8");
      const packages = JSON.parse(data);
      if (packageManager) {
        return packages.filter((p) => p.packageManager === packageManager);
      }
      return packages;
    } catch {
      return [];
    }
  }
  async saveAlertHistory(alert) {
    const alertsFile = join2(this.dataPath, "alerts.json");
    let alerts = [];
    try {
      const data = await fs.readFile(alertsFile, "utf-8");
      alerts = JSON.parse(data);
    } catch {}
    alerts.push(alert);
    const retentionDays = this.config?.tracking.retentionDays || 90;
    const cutoffDate = new Date;
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const filteredAlerts = alerts.filter((alert2) => new Date(alert2.timestamp) > cutoffDate);
    await fs.writeFile(alertsFile, JSON.stringify(filteredAlerts, null, 2));
  }
  async getAlertHistory(days) {
    const alertsFile = join2(this.dataPath, "alerts.json");
    try {
      const data = await fs.readFile(alertsFile, "utf-8");
      let alerts = JSON.parse(data);
      if (days) {
        const cutoffDate = new Date;
        cutoffDate.setDate(cutoffDate.getDate() - days);
        alerts = alerts.filter((alert) => new Date(alert.timestamp) > cutoffDate);
      }
      return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch {
      return [];
    }
  }
  async cleanupOldData() {
    const retentionDays = this.config?.tracking.retentionDays || 90;
    const cutoffDate = new Date;
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const alerts = await this.getAlertHistory();
    const filteredAlerts = alerts.filter((alert) => new Date(alert.timestamp) > cutoffDate);
    const alertsFile = join2(this.dataPath, "alerts.json");
    await fs.writeFile(alertsFile, JSON.stringify(filteredAlerts, null, 2));
  }
}
var init_configManager = () => {};

// src/database/packageTracker.ts
import { exec as exec5 } from "child_process";

class PackageTracker {
  configManager;
  constructor() {
    this.configManager = ConfigManager.getInstance();
  }
  async initialize() {
    await this.configManager.initialize();
  }
  async scanAllPackages(packageManagers) {
    const config = this.configManager.getConfig();
    const managers = packageManagers || config.packageManagers.enabled;
    const trackedPackages = [];
    for (const manager of managers) {
      try {
        const packages = await this.scanPackageManager(manager);
        trackedPackages.push(...packages);
      } catch (error) {
        console.warn(`Failed to scan packages for ${manager}:`, error);
      }
    }
    if (config.tracking.enabled) {
      await this.savePackageMetadata(trackedPackages);
    }
    return trackedPackages;
  }
  async scanPackageManager(packageManager) {
    const config = getPackageManagerConfig(packageManager);
    const packages = [];
    return new Promise((resolve, reject) => {
      exec5(config.listJsonCommand, async (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const data = JSON.parse(stdout);
          const dependencies = data.dependencies || {};
          for (const [packageName, packageInfo] of Object.entries(dependencies)) {
            if (typeof packageInfo === "object" && packageInfo !== null && "version" in packageInfo) {
              const trackedPackage = await this.trackPackage(packageName, packageInfo.version, packageManager);
              packages.push(trackedPackage);
            }
          }
          resolve(packages);
        } catch (parseError) {
          reject(parseError);
        }
      });
    });
  }
  async trackPackage(name, version, packageManager) {
    const packageInfo = await this.getPackageInfo(name, packageManager);
    const metadata = await this.buildPackageMetadata(name, version, packageManager, packageInfo);
    if (this.configManager.getConfig().tracking.enabled) {
      await this.configManager.savePackageMetadata(metadata);
    }
    return {
      name,
      currentVersion: version,
      latestVersion: packageInfo.latestVersion,
      packageManager,
      isOutdated: packageInfo.latestVersion !== version,
      hasSecurityIssues: Boolean(packageInfo.securityAdvisories && packageInfo.securityAdvisories.length > 0),
      isDeprecated: packageInfo.deprecated || false,
      updateAvailable: packageInfo.latestVersion !== version,
      lastCheck: new Date,
      metadata
    };
  }
  async getPackageInfo(name, packageManager) {
    const config = getPackageManagerConfig(packageManager);
    return new Promise((resolve, reject) => {
      const command = config.viewCommand(name);
      exec5(command, (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const data = JSON.parse(stdout);
          resolve({
            latestVersion: data.version || data.latest || "unknown",
            description: data.description,
            homepage: data.homepage || data.repository?.url,
            license: data.license,
            deprecated: data.deprecated,
            dependencies: data.dependencies,
            devDependencies: data.devDependencies,
            securityAdvisories: data.securityAdvisories || []
          });
        } catch (parseError) {
          reject(parseError);
        }
      });
    });
  }
  async buildPackageMetadata(name, version, packageManager, packageInfo) {
    const existingMetadata = await this.getExistingPackageMetadata(name, packageManager);
    const now = new Date;
    return {
      name,
      version,
      packageManager,
      installedDate: existingMetadata?.installedDate || now,
      lastUpdated: existingMetadata?.lastUpdated || now,
      sourceRegistry: this.getRegistryUrl(packageManager),
      description: packageInfo.description,
      homepage: packageInfo.homepage,
      license: packageInfo.license,
      dependencies: packageInfo.dependencies,
      devDependencies: packageInfo.devDependencies,
      securityAdvisories: packageInfo.securityAdvisories || []
    };
  }
  async getExistingPackageMetadata(name, packageManager) {
    try {
      const allPackages = await this.configManager.getPackageMetadata(packageManager);
      return allPackages.find((p) => p.name === name) || null;
    } catch {
      return null;
    }
  }
  getRegistryUrl(packageManager) {
    const registryUrls = {
      npm: "https://registry.npmjs.org",
      pnpm: "https://registry.npmjs.org",
      yarn: "https://registry.npmjs.org",
      bun: "https://registry.npmjs.org"
    };
    return registryUrls[packageManager] || "unknown";
  }
  async savePackageMetadata(trackedPackages) {
    const savePromises = trackedPackages.map((pkg) => this.configManager.savePackageMetadata(pkg.metadata));
    await Promise.all(savePromises);
  }
  async checkForUpdates(trackedPackages) {
    const updates = [];
    for (const pkg of trackedPackages) {
      if (pkg.updateAvailable) {
        const updateInfo = await this.getUpdateInfo(pkg);
        updates.push(updateInfo);
      }
    }
    return updates;
  }
  async getUpdateInfo(pkg) {
    const packageInfo = await this.getPackageInfo(pkg.name, pkg.packageManager);
    return {
      name: pkg.name,
      currentVersion: pkg.currentVersion,
      latestVersion: packageInfo.latestVersion,
      packageManager: pkg.packageManager,
      changelog: await this.getChangelog(pkg.name),
      securityAdvisory: packageInfo.securityAdvisories?.[0]?.url,
      deprecated: packageInfo.deprecated
    };
  }
  async getChangelog(packageName) {
    try {
      return new Promise((resolve) => {
        const command = `npm view ${packageName} changelog --json`;
        exec5(command, (error, stdout) => {
          if (error) {
            resolve(undefined);
            return;
          }
          try {
            const data = JSON.parse(stdout);
            resolve(data.latest || data.releases?.[0]?.description);
          } catch {
            resolve(undefined);
          }
        });
      });
    } catch {
      return;
    }
  }
  async getPackagesNeedingAttention(trackedPackages) {
    return {
      outdated: trackedPackages.filter((pkg) => pkg.isOutdated),
      security: trackedPackages.filter((pkg) => pkg.hasSecurityIssues),
      deprecated: trackedPackages.filter((pkg) => pkg.isDeprecated)
    };
  }
  getPackageStatistics(trackedPackages) {
    const stats = {
      total: trackedPackages.length,
      outdated: trackedPackages.filter((pkg) => pkg.isOutdated).length,
      upToDate: trackedPackages.filter((pkg) => !pkg.isOutdated).length,
      securityIssues: trackedPackages.filter((pkg) => pkg.hasSecurityIssues).length,
      deprecated: trackedPackages.filter((pkg) => pkg.isDeprecated).length,
      byPackageManager: {}
    };
    for (const pkg of trackedPackages) {
      stats.byPackageManager[pkg.packageManager] = (stats.byPackageManager[pkg.packageManager] || 0) + 1;
    }
    return stats;
  }
}
var init_packageTracker = __esm(() => {
  init_configManager();
  init_packageManager();
});

// src/export/exportManager.ts
import { promises as fs2 } from "fs";
import { join as join3 } from "path";

class ExportManager {
  configManager;
  packageTracker;
  constructor() {
    this.configManager = ConfigManager.getInstance();
    this.packageTracker = new PackageTracker;
  }
  async initialize() {
    await this.configManager.initialize();
    await this.packageTracker.initialize();
  }
  async exportPackages(options = {}) {
    try {
      const config = this.configManager.getConfig();
      const exportOptions = {
        format: options.format || config.export.defaultFormat,
        output: options.output,
        includeTimestamps: options.includeTimestamps ?? config.export.includeTimestamps,
        filterByPackageManager: options.filterByPackageManager,
        filterByInstallationDate: options.filterByInstallationDate,
        packageManagers: options.packageManagers
      };
      const trackedPackages = await this.packageTracker.scanAllPackages(exportOptions.packageManagers);
      const filteredPackages = this.filterPackages(trackedPackages, exportOptions);
      const outputPath = exportOptions.output || this.generateOutputPath(exportOptions);
      const success = await this.writeExportFile(filteredPackages, outputPath, exportOptions);
      return {
        success,
        filePath: success ? outputPath : undefined,
        packagesExported: filteredPackages.length,
        message: success ? `Successfully exported ${filteredPackages.length} packages to ${outputPath}` : `Failed to export packages to ${outputPath}`
      };
    } catch (error) {
      return {
        success: false,
        packagesExported: 0,
        message: `Export failed: ${error instanceof Error ? error.message : "Unknown error"}`
      };
    }
  }
  filterPackages(packages, options) {
    let filtered = [...packages];
    if (options.filterByPackageManager) {
      filtered = filtered.filter((pkg) => pkg.packageManager === options.filterByPackageManager);
    }
    if (options.filterByInstallationDate) {
      const { after, before } = options.filterByInstallationDate;
      filtered = filtered.filter((pkg) => {
        const installDate = new Date(pkg.metadata.installedDate);
        if (after && installDate < after)
          return false;
        if (before && installDate > before)
          return false;
        return true;
      });
    }
    return filtered;
  }
  generateOutputPath(options) {
    const config = this.configManager.getConfig();
    const timestamp = options.includeTimestamps ? this.getTimestamp() : "";
    const extension = options.format;
    const directory = config.export.defaultDirectory;
    const filename = `npm-packages${timestamp ? `-${timestamp}` : ""}.${extension}`;
    return join3(directory, filename);
  }
  getTimestamp() {
    const now = new Date;
    return now.toISOString().slice(0, 19).replace(/:/g, "-").replace("T", "-");
  }
  async writeExportFile(packages, outputPath, options) {
    try {
      const directory = outputPath.substring(0, outputPath.lastIndexOf("/"));
      await fs2.mkdir(directory, { recursive: true });
      let content;
      if (options.format === "json") {
        content = this.generateJsonExport(packages);
      } else {
        content = this.generateTxtExport(packages);
      }
      await fs2.writeFile(outputPath, content, "utf-8");
      return true;
    } catch (error) {
      console.error("Failed to write export file:", error);
      return false;
    }
  }
  generateJsonExport(packages) {
    const exportData = {
      exportDate: new Date().toISOString(),
      format: "json",
      totalPackages: packages.length,
      packageManagers: [...new Set(packages.map((p) => p.packageManager))],
      packages: packages.map((pkg) => ({
        name: pkg.name,
        version: pkg.currentVersion,
        latestVersion: pkg.latestVersion,
        packageManager: pkg.packageManager,
        installedDate: pkg.metadata.installedDate,
        lastUpdated: pkg.metadata.lastUpdated,
        sourceRegistry: pkg.metadata.sourceRegistry,
        description: pkg.metadata.description,
        homepage: pkg.metadata.homepage,
        license: pkg.metadata.license,
        isOutdated: pkg.isOutdated,
        hasSecurityIssues: pkg.hasSecurityIssues,
        isDeprecated: pkg.isDeprecated,
        updateAvailable: pkg.updateAvailable,
        dependencies: Object.keys(pkg.metadata.dependencies || {}).length,
        devDependencies: Object.keys(pkg.metadata.devDependencies || {}).length,
        securityAdvisories: pkg.metadata.securityAdvisories?.length || 0
      }))
    };
    return JSON.stringify(exportData, null, 2);
  }
  generateTxtExport(packages) {
    const lines = [];
    lines.push("=".repeat(80));
    lines.push("NPM Package Export Report");
    lines.push("=".repeat(80));
    lines.push(`Export Date: ${new Date().toLocaleString()}`);
    lines.push(`Total Packages: ${packages.length}`);
    lines.push(`Package Managers: ${[...new Set(packages.map((p) => p.packageManager))].join(", ")}`);
    lines.push("");
    const outdatedCount = packages.filter((p) => p.isOutdated).length;
    const securityIssuesCount = packages.filter((p) => p.hasSecurityIssues).length;
    const deprecatedCount = packages.filter((p) => p.isDeprecated).length;
    lines.push("SUMMARY:");
    lines.push(`  Up to date: ${packages.length - outdatedCount}`);
    lines.push(`  Outdated: ${outdatedCount}`);
    lines.push(`  Security Issues: ${securityIssuesCount}`);
    lines.push(`  Deprecated: ${deprecatedCount}`);
    lines.push("");
    lines.push("PACKAGE DETAILS:");
    lines.push("-".repeat(80));
    for (const pkg of packages) {
      lines.push(`Package: ${pkg.name}`);
      lines.push(`  Version: ${pkg.currentVersion}${pkg.latestVersion && pkg.latestVersion !== pkg.currentVersion ? ` (Latest: ${pkg.latestVersion})` : ""}`);
      lines.push(`  Manager: ${pkg.packageManager}`);
      lines.push(`  Installed: ${new Date(pkg.metadata.installedDate).toLocaleDateString()}`);
      lines.push(`  Updated: ${new Date(pkg.metadata.lastUpdated).toLocaleDateString()}`);
      lines.push(`  Registry: ${pkg.metadata.sourceRegistry}`);
      if (pkg.metadata.description) {
        lines.push(`  Description: ${pkg.metadata.description}`);
      }
      if (pkg.metadata.homepage) {
        lines.push(`  Homepage: ${pkg.metadata.homepage}`);
      }
      if (pkg.metadata.license) {
        lines.push(`  License: ${pkg.metadata.license}`);
      }
      const status = [];
      if (pkg.isOutdated)
        status.push("OUTDATED");
      if (pkg.hasSecurityIssues)
        status.push("SECURITY ISSUES");
      if (pkg.isDeprecated)
        status.push("DEPRECATED");
      if (status.length > 0) {
        lines.push(`  Status: ${status.join(", ")}`);
      }
      const depCount = Object.keys(pkg.metadata.dependencies || {}).length;
      const devDepCount = Object.keys(pkg.metadata.devDependencies || {}).length;
      if (depCount > 0 || devDepCount > 0) {
        lines.push(`  Dependencies: ${depCount} regular, ${devDepCount} dev`);
      }
      if (pkg.metadata.securityAdvisories && pkg.metadata.securityAdvisories.length > 0) {
        lines.push(`  Security Advisories: ${pkg.metadata.securityAdvisories.length}`);
      }
      lines.push("");
    }
    lines.push("=".repeat(80));
    lines.push("End of Export Report");
    lines.push("=".repeat(80));
    return lines.join(`
`);
  }
  getExportTemplates() {
    return {
      json: `{
  "exportDate": "2025-01-01T00:00:00.000Z",
  "format": "json",
  "totalPackages": 0,
  "packageManagers": [],
  "packages": []
}`,
      txt: `================================================================================
NPM Package Export Report
================================================================================
Export Date: 1/1/2025, 12:00:00 AM
Total Packages: 0
Package Managers: 

SUMMARY:
  Up to date: 0
  Outdated: 0
  Security Issues: 0
  Deprecated: 0

PACKAGE DETAILS:
--------------------------------------------------------------------------------
Package: example-package
  Version: 1.0.0 (Latest: 1.0.1)
  Manager: npm
  Installed: 1/1/2025
  Updated: 1/1/2025
  Registry: https://registry.npmjs.org
  Description: Example package description
  Homepage: https://example.com
  License: MIT
  Status: OUTDATED
  Dependencies: 5 regular, 2 dev
  Security Advisories: 1

================================================================================
End of Export Report
================================================================================`
    };
  }
  validateExportOptions(options) {
    const errors = [];
    if (options.format && !["txt", "json"].includes(options.format)) {
      errors.push('Format must be either "txt" or "json"');
    }
    if (options.output) {
      try {
        if (options.output.includes("..") || options.output.includes("\\..\\")) {
          errors.push("Invalid output file path - path traversal not allowed");
        }
      } catch {
        errors.push("Invalid output file path");
      }
    }
    if (options.packageManagers && options.packageManagers.length > 0) {
      const supportedManagers = ["npm", "pnpm", "yarn", "bun"];
      const unsupported = options.packageManagers.filter((pm) => !supportedManagers.includes(pm));
      if (unsupported.length > 0) {
        errors.push(`Unsupported package managers: ${unsupported.join(", ")}`);
      }
    }
    if (options.filterByInstallationDate) {
      const { after, before } = options.filterByInstallationDate;
      if (after && before && after >= before) {
        errors.push('"after" date must be before "before" date');
      }
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }
}
var init_exportManager = __esm(() => {
  init_configManager();
  init_packageTracker();
});

// src/commands/export.ts
var exports_export = {};
__export(exports_export, {
  showExportTemplates: () => showExportTemplates,
  runExport: () => runExport,
  default: () => export_default
});
async function runExport(format, output, packageManagers, filterByPackageManager, includeTimestamps) {
  const exportManager = new ExportManager;
  try {
    await exportManager.initialize();
    const options = {
      format,
      output,
      packageManagers,
      filterByPackageManager,
      includeTimestamps
    };
    const validation = exportManager.validateExportOptions(options);
    if (!validation.valid) {
      console.log("❌ Export validation failed:");
      for (const error of validation.errors) {
        console.log(`  - ${error}`);
      }
      return;
    }
    console.log("\uD83D\uDE80 Starting package export...");
    const result = await exportManager.exportPackages(options);
    if (result.success) {
      console.log("✅ Export completed successfully!");
      console.log(`\uD83D\uDCC1 File saved to: ${result.filePath}`);
      console.log(`\uD83D\uDCE6 Packages exported: ${result.packagesExported}`);
      console.log(`\uD83D\uDCBE Format: ${options.format || "default"}`);
    } else {
      console.log("❌ Export failed:", result.message);
    }
  } catch (error) {
    console.log("❌ Export error:", error instanceof Error ? error.message : "Unknown error");
  }
}
async function showExportTemplates() {
  const exportManager = new ExportManager;
  await exportManager.initialize();
  const templates = exportManager.getExportTemplates();
  console.log(`\uD83D\uDCCB Export Templates:
`);
  console.log("JSON Format Template:");
  console.log("=".repeat(60));
  console.log(templates.json);
  console.log("");
  console.log("TXT Format Template:");
  console.log("=".repeat(60));
  console.log(templates.txt);
}
var export_default;
var init_export = __esm(() => {
  init_exportManager();
  export_default = runExport;
});

// src/notifications/notificationManager.ts
import { promises as fs3 } from "fs";
import { join as join4 } from "path";
import { homedir as homedir2 } from "os";
import { execSync as execSync2 } from "child_process";

class NotificationManager {
  configManager;
  logPath;
  constructor() {
    this.configManager = ConfigManager.getInstance();
    this.logPath = join4(homedir2(), ".config", "npm-updater", "notifications.log");
  }
  async initialize() {
    await this.configManager.initialize();
    await fs3.mkdir(this.configManager.getDataPath(), { recursive: true });
  }
  async sendNotifications(alerts, methods) {
    const results = [];
    for (const method of methods) {
      try {
        let result;
        switch (method) {
          case "desktop":
            result = await this.sendDesktopNotification(alerts);
            break;
          case "email":
            result = await this.sendEmailNotification(alerts);
            break;
          case "log":
            result = await this.sendLogNotification(alerts);
            break;
          default:
            result = {
              success: false,
              method,
              message: `Unknown notification method: ${method}`
            };
        }
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          method,
          message: `Failed to send ${method} notification: ${error instanceof Error ? error.message : "Unknown error"}`
        });
      }
    }
    return results;
  }
  async sendDesktopNotification(alerts) {
    try {
      if (typeof process !== "undefined" && process.platform === "win32") {
        for (const alert of alerts) {
          const command = `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('${alert.message}', 'NPM Package Alert', 'OK', 'Information')"`;
          try {
            execSync2(command);
          } catch (error) {
            console.warn("Desktop notification failed:", error);
          }
        }
      } else {
        console.log(`
\uD83D\uDD14 NPM Package Alerts:`);
        for (const alert of alerts) {
          const emoji = this.getAlertEmoji(alert.type);
          console.log(`${emoji} ${alert.message}`);
        }
        console.log("");
      }
      return {
        success: true,
        method: "desktop",
        message: `Desktop notification sent for ${alerts.length} alerts`
      };
    } catch (error) {
      return {
        success: false,
        method: "desktop",
        message: `Failed to send desktop notification: ${error instanceof Error ? error.message : "Unknown error"}`
      };
    }
  }
  async sendEmailNotification(alerts) {
    const config = this.configManager.getConfig();
    const emailConfig = config.alerts.email;
    if (!emailConfig) {
      return {
        success: false,
        method: "email",
        message: "Email configuration not found"
      };
    }
    try {
      const emailBody = this.generateEmailBody(alerts);
      console.log("Email notification (simulated):");
      console.log("To:", emailConfig.to.join(", "));
      console.log("From:", emailConfig.from);
      console.log("Subject: NPM Package Security Alerts");
      console.log("Body:", emailBody);
      return {
        success: true,
        method: "email",
        message: `Email notification prepared for ${alerts.length} alerts`
      };
    } catch (error) {
      return {
        success: false,
        method: "email",
        message: `Failed to send email notification: ${error instanceof Error ? error.message : "Unknown error"}`
      };
    }
  }
  async sendLogNotification(alerts) {
    try {
      const logEntry = this.generateLogEntry(alerts);
      await fs3.appendFile(this.logPath, logEntry + `
`, "utf-8");
      return {
        success: true,
        method: "log",
        message: `Logged ${alerts.length} alerts to ${this.logPath}`
      };
    } catch (error) {
      return {
        success: false,
        method: "log",
        message: `Failed to write log notification: ${error instanceof Error ? error.message : "Unknown error"}`
      };
    }
  }
  generateEmailBody(alerts) {
    const criticalAlerts = alerts.filter((a) => a.metadata?.severity === "critical");
    const securityAlerts = alerts.filter((a) => a.type === "security");
    const outdatedAlerts = alerts.filter((a) => a.type === "outdated");
    const deprecatedAlerts = alerts.filter((a) => a.type === "deprecated");
    let body = `NPM Package Monitoring Alerts

`;
    body += `Generated: ${new Date().toLocaleString()}
`;
    body += `Total Alerts: ${alerts.length}

`;
    if (criticalAlerts.length > 0) {
      body += `\uD83D\uDEA8 CRITICAL ALERTS (${criticalAlerts.length}):
`;
      for (const alert of criticalAlerts) {
        body += `• ${alert.packageName}: ${alert.message}
`;
      }
      body += `
`;
    }
    if (securityAlerts.length > 0) {
      body += `\uD83D\uDD12 SECURITY ALERTS (${securityAlerts.length}):
`;
      for (const alert of securityAlerts) {
        body += `• ${alert.packageName}: ${alert.message}
`;
      }
      body += `
`;
    }
    if (outdatedAlerts.length > 0) {
      body += `\uD83D\uDCE6 OUTDATED PACKAGES (${outdatedAlerts.length}):
`;
      for (const alert of outdatedAlerts) {
        body += `• ${alert.packageName}: ${alert.message}
`;
      }
      body += `
`;
    }
    if (deprecatedAlerts.length > 0) {
      body += `⚠️ DEPRECATED PACKAGES (${deprecatedAlerts.length}):
`;
      for (const alert of deprecatedAlerts) {
        body += `• ${alert.packageName}: ${alert.message}
`;
      }
      body += `
`;
    }
    body += `Please review these alerts and take appropriate action.
`;
    body += `
This is an automated message from NPM Package Monitor.`;
    return body;
  }
  generateLogEntry(alerts) {
    const timestamp = new Date().toISOString();
    const alertSummary = alerts.map((alert) => `[${alert.type.toUpperCase()}] ${alert.packageName}: ${alert.message}`).join(" | ");
    return `[${timestamp}] NPM Alerts: ${alertSummary}`;
  }
  getAlertEmoji(alertType) {
    const emojis = {
      outdated: "\uD83D\uDCE6",
      security: "\uD83D\uDD12",
      deprecated: "⚠️",
      vulnerable: "\uD83D\uDEA8"
    };
    return emojis[alertType] || "\uD83D\uDCE2";
  }
  async testNotifications() {
    const testAlert = {
      id: "test-alert",
      packageName: "test-package",
      packageManager: "npm",
      type: "outdated",
      message: "Test notification - package update available",
      timestamp: new Date,
      acknowledged: false,
      resolved: false
    };
    return {
      desktop: await this.sendDesktopNotification([testAlert]),
      email: await this.sendEmailNotification([testAlert]),
      log: await this.sendLogNotification([testAlert])
    };
  }
  async getNotificationHistory() {
    try {
      const content = await fs3.readFile(this.logPath, "utf-8");
      return content.split(`
`).filter((line) => line.trim().length > 0);
    } catch {
      return [];
    }
  }
  async clearNotificationLog() {
    try {
      await fs3.writeFile(this.logPath, "", "utf-8");
      return true;
    } catch {
      return false;
    }
  }
  async getNotificationStats() {
    try {
      const history = await this.getNotificationHistory();
      const stats = await fs3.stat(this.logPath);
      return {
        totalLogged: history.length,
        lastNotification: history.length > 0 ? history[history.length - 1] : undefined,
        logFileSize: stats.size
      };
    } catch {
      return {
        totalLogged: 0,
        logFileSize: 0
      };
    }
  }
}
var init_notificationManager = __esm(() => {
  init_configManager();
});

// src/monitoring/alertSystem.ts
import { exec as exec6 } from "child_process";

class AlertSystem {
  configManager;
  packageTracker;
  notificationManager;
  monitoringInterval = null;
  isMonitoring = false;
  constructor() {
    this.configManager = ConfigManager.getInstance();
    this.packageTracker = new PackageTracker;
    this.notificationManager = new NotificationManager;
  }
  async initialize() {
    await this.configManager.initialize();
    await this.packageTracker.initialize();
    await this.notificationManager.initialize();
  }
  async startMonitoring(customConfig) {
    const config = this.configManager.getConfig();
    if (this.isMonitoring) {
      return {
        success: false,
        message: "Monitoring is already active"
      };
    }
    if (customConfig) {
      const updatedConfig = {
        ...config.alerts,
        ...customConfig
      };
      await this.configManager.updateConfig({
        alerts: updatedConfig
      });
    }
    const alertConfig = this.configManager.getConfig().alerts;
    if (!alertConfig.enabled) {
      return {
        success: false,
        message: "Alert system is disabled in configuration"
      };
    }
    const intervalMs = this.calculateIntervalMs(alertConfig.interval);
    this.monitoringInterval = setInterval(async () => {
      await this.performMonitoringCycle();
    }, intervalMs);
    this.isMonitoring = true;
    await this.performMonitoringCycle();
    return {
      success: true,
      message: `Monitoring started with ${alertConfig.interval.value} ${alertConfig.interval.unit} interval`
    };
  }
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    return {
      success: true,
      message: "Monitoring stopped"
    };
  }
  getMonitoringStatus() {
    const config = this.configManager.getConfig().alerts;
    return {
      isActive: this.isMonitoring,
      interval: this.isMonitoring ? `${config.interval.value} ${config.interval.unit}` : "Not running"
    };
  }
  async performMonitoringCycle() {
    try {
      const config = this.configManager.getConfig();
      const alertConfig = config.alerts;
      if (this.isInQuietHours(alertConfig.quietHours)) {
        console.log("Monitoring check skipped - within quiet hours");
        return;
      }
      console.log("Starting monitoring cycle...");
      const trackedPackages = await this.packageTracker.scanAllPackages();
      const updates = await this.packageTracker.checkForUpdates(trackedPackages);
      const securityResults = await this.checkSecurityVulnerabilities(trackedPackages);
      const deprecatedPackages = trackedPackages.filter((pkg) => pkg.isDeprecated);
      const alerts = this.generateAlerts(trackedPackages, updates, securityResults, deprecatedPackages);
      for (const alert of alerts) {
        await this.configManager.saveAlertHistory(alert);
      }
      if (!alertConfig.silentMode && alerts.length > 0) {
        await this.notificationManager.sendNotifications(alerts, alertConfig.methods);
      }
      console.log(`Monitoring cycle completed. Generated ${alerts.length} alerts.`);
    } catch (error) {
      console.error("Error during monitoring cycle:", error);
    }
  }
  async checkSecurityVulnerabilities(packages) {
    const results = [];
    for (const pkg of packages) {
      try {
        const auditResult = await this.runSecurityAudit(pkg.name, pkg.packageManager);
        if (auditResult.vulnerabilities.length > 0) {
          results.push({
            packageName: pkg.name,
            packageManager: pkg.packageManager,
            severity: this.getHighestSeverity(auditResult.vulnerabilities),
            vulnerabilities: auditResult.vulnerabilities,
            needsUpdate: auditResult.needsUpdate
          });
        }
      } catch (error) {
        console.warn(`Failed to check security for ${pkg.name}:`, error);
      }
    }
    return results;
  }
  async runSecurityAudit(packageName, packageManager) {
    return new Promise((resolve) => {
      let command = "";
      switch (packageManager) {
        case "npm":
        case "pnpm":
        case "yarn":
        case "bun":
          command = `npm audit --json --prefix ${process.cwd()}`;
          break;
        default:
          resolve({ vulnerabilities: [], needsUpdate: false });
          return;
      }
      exec6(command, (error, stdout) => {
        if (error) {
          resolve({ vulnerabilities: [], needsUpdate: false });
          return;
        }
        try {
          const auditData = JSON.parse(stdout);
          const vulnerabilities = [];
          if (auditData.vulnerabilities) {
            for (const [pkg, vuln] of Object.entries(auditData.vulnerabilities)) {
              if (pkg === packageName && typeof vuln === "object" && vuln !== null) {
                const vulnData = vuln;
                if (vulnData.via && Array.isArray(vulnData.via)) {
                  for (const via of vulnData.via) {
                    if (typeof via === "object" && via !== null && "title" in via) {
                      const viaData = via;
                      vulnerabilities.push({
                        severity: this.mapSeverity(viaData.severity || "low"),
                        title: viaData.title || "Security vulnerability",
                        url: viaData.url || "",
                        published: new Date,
                        cwe: viaData.cwe
                      });
                    }
                  }
                }
              }
            }
          }
          resolve({
            vulnerabilities,
            needsUpdate: vulnerabilities.length > 0
          });
        } catch {
          resolve({ vulnerabilities: [], needsUpdate: false });
        }
      });
    });
  }
  mapSeverity(severity) {
    const mapping = {
      low: "low",
      moderate: "moderate",
      high: "high",
      critical: "critical"
    };
    return mapping[severity.toLowerCase()] || "low";
  }
  getHighestSeverity(vulnerabilities) {
    const severityOrder = {
      low: 1,
      moderate: 2,
      high: 3,
      critical: 4
    };
    let highest = "low";
    for (const vuln of vulnerabilities) {
      if (vuln.severity && Object.prototype.hasOwnProperty.call(severityOrder, vuln.severity)) {
        const currentSeverityValue = severityOrder[vuln.severity];
        if (currentSeverityValue > severityOrder[highest]) {
          highest = vuln.severity;
        }
      }
    }
    return highest;
  }
  generateAlerts(packages, updates, securityResults, deprecatedPackages) {
    const alerts = [];
    const now = new Date;
    for (const update of updates) {
      alerts.push({
        id: `update-${update.name}-${now.getTime()}`,
        packageName: update.name,
        packageManager: update.packageManager,
        type: "outdated",
        message: `Update available: ${update.name} ${update.currentVersion} → ${update.latestVersion}`,
        timestamp: now,
        acknowledged: false,
        resolved: false,
        metadata: {
          currentVersion: update.currentVersion,
          latestVersion: update.latestVersion,
          changelog: update.changelog
        }
      });
    }
    for (const security of securityResults) {
      alerts.push({
        id: `security-${security.packageName}-${now.getTime()}`,
        packageName: security.packageName,
        packageManager: security.packageManager,
        type: "security",
        message: `Security vulnerability detected in ${security.packageName} (${security.severity} severity)`,
        timestamp: now,
        acknowledged: false,
        resolved: false,
        metadata: {
          severity: security.severity,
          vulnerabilities: security.vulnerabilities.length,
          vulnerabilityDetails: security.vulnerabilities
        }
      });
    }
    for (const pkg of deprecatedPackages) {
      alerts.push({
        id: `deprecated-${pkg.name}-${now.getTime()}`,
        packageName: pkg.name,
        packageManager: pkg.packageManager,
        type: "deprecated",
        message: `Package ${pkg.name} is deprecated`,
        timestamp: now,
        acknowledged: false,
        resolved: false,
        metadata: {
          currentVersion: pkg.currentVersion,
          deprecatedDate: pkg.metadata.lastUpdated
        }
      });
    }
    return alerts;
  }
  calculateIntervalMs(interval) {
    const multipliers = {
      minutes: 60 * 1000,
      hours: 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000
    };
    return interval.value * multipliers[interval.unit];
  }
  isInQuietHours(quietHours) {
    if (!quietHours)
      return false;
    const now = new Date;
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    if (quietHours.start > quietHours.end) {
      return currentTime >= quietHours.start || currentTime <= quietHours.end;
    }
    return currentTime >= quietHours.start && currentTime <= quietHours.end;
  }
  async getAlertSummary(days) {
    const alerts = await this.configManager.getAlertHistory(days);
    const summary = {
      totalAlerts: alerts.length,
      outdated: alerts.filter((a) => a.type === "outdated").length,
      security: alerts.filter((a) => a.type === "security").length,
      deprecated: alerts.filter((a) => a.type === "deprecated").length,
      bySeverity: {},
      lastCheck: new Date
    };
    for (const alert of alerts) {
      const severity = alert.metadata?.severity || "unknown";
      summary.bySeverity[severity] = (summary.bySeverity[severity] || 0) + 1;
    }
    return summary;
  }
  async acknowledgeAlert(alertId) {
    try {
      const alerts = await this.configManager.getAlertHistory();
      const alert = alerts.find((a) => a.id === alertId);
      if (alert) {
        alert.acknowledged = true;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
  async getRecentAlerts(limit = 10) {
    const alerts = await this.configManager.getAlertHistory();
    return alerts.slice(0, limit);
  }
}
var init_alertSystem = __esm(() => {
  init_configManager();
  init_packageTracker();
  init_notificationManager();
});

// src/commands/alerts.ts
var exports_alerts = {};
__export(exports_alerts, {
  stopPackageAlerts: () => stopPackageAlerts,
  startPackageAlerts: () => startPackageAlerts,
  showAlertHistory: () => showAlertHistory,
  getAlertSummary: () => getAlertSummary,
  default: () => alerts_default,
  configureAlerts: () => configureAlerts,
  checkAlertStatus: () => checkAlertStatus,
  acknowledgeAlert: () => acknowledgeAlert
});
async function startPackageAlerts(interval, methods, silentMode) {
  const alertSystem = new AlertSystem;
  try {
    await alertSystem.initialize();
    const customConfig = {
      interval,
      methods,
      silentMode
    };
    console.log("\uD83D\uDD14 Starting package monitoring and alerts...");
    const result = await alertSystem.startMonitoring(customConfig);
    if (result.success) {
      console.log("✅ Package monitoring started successfully!");
      console.log(`\uD83D\uDCCB ${result.message}`);
      const status = alertSystem.getMonitoringStatus();
      console.log(`⏰ Status: ${status.isActive ? "Active" : "Inactive"}`);
      console.log(`\uD83D\uDD04 Check interval: ${status.interval}`);
      console.log(`
\uD83D\uDCDD Available commands:`);
      console.log("  npm-updater alerts status    - Check monitoring status");
      console.log("  npm-updater alerts stop      - Stop monitoring");
      console.log("  npm-updater alerts summary   - Get alert summary");
      console.log("  npm-updater alerts history   - View recent alerts");
    } else {
      console.log("❌ Failed to start monitoring:", result.message);
    }
  } catch (error) {
    console.log("❌ Alert system error:", error instanceof Error ? error.message : "Unknown error");
  }
}
async function stopPackageAlerts() {
  const alertSystem = new AlertSystem;
  try {
    await alertSystem.initialize();
    const result = alertSystem.stopMonitoring();
    if (result.success) {
      console.log("✅ Package monitoring stopped successfully!");
      console.log("\uD83D\uDD15 No further alerts will be generated.");
    } else {
      console.log("❌ Failed to stop monitoring:", result.message);
    }
  } catch (error) {
    console.log("❌ Alert system error:", error instanceof Error ? error.message : "Unknown error");
  }
}
async function checkAlertStatus() {
  const alertSystem = new AlertSystem;
  try {
    await alertSystem.initialize();
    const status = alertSystem.getMonitoringStatus();
    console.log("\uD83D\uDD14 Package Monitoring Status:");
    console.log("=".repeat(40));
    console.log(`Status: ${status.isActive ? "\uD83D\uDFE2 Active" : "\uD83D\uDD34 Inactive"}`);
    console.log(`Check Interval: ${status.interval}`);
    if (status.isActive) {
      console.log(`
\uD83D\uDCCB System is actively monitoring for:`);
      console.log("  \uD83D\uDCE6 Outdated packages");
      console.log("  \uD83D\uDD12 Security vulnerabilities");
      console.log("  ⚠️ Deprecated packages");
    }
  } catch (error) {
    console.log("❌ Status check error:", error instanceof Error ? error.message : "Unknown error");
  }
}
async function getAlertSummary(days) {
  const alertSystem = new AlertSystem;
  try {
    await alertSystem.initialize();
    const summary = await alertSystem.getAlertSummary(days);
    console.log("\uD83D\uDCCA Alert Summary:");
    console.log("=".repeat(40));
    console.log(`Total Alerts: ${summary.totalAlerts}`);
    console.log(`Outdated Packages: ${summary.outdated}`);
    console.log(`Security Issues: ${summary.security}`);
    console.log(`Deprecated Packages: ${summary.deprecated}`);
    console.log(`Last Check: ${summary.lastCheck.toLocaleString()}`);
    if (Object.keys(summary.bySeverity).length > 0) {
      console.log(`
\uD83D\uDD0D By Severity:`);
      for (const [severity, count] of Object.entries(summary.bySeverity)) {
        console.log(`  ${severity}: ${count}`);
      }
    }
  } catch (error) {
    console.log("❌ Summary error:", error instanceof Error ? error.message : "Unknown error");
  }
}
async function showAlertHistory(limit = 10) {
  const alertSystem = new AlertSystem;
  try {
    await alertSystem.initialize();
    const alerts = await alertSystem.getRecentAlerts(limit);
    console.log("\uD83D\uDCDC Recent Alert History:");
    console.log("=".repeat(60));
    if (alerts.length === 0) {
      console.log("No alerts found.");
      return;
    }
    for (const alert of alerts) {
      const emoji = getAlertEmoji(alert.type);
      const timestamp = new Date(alert.timestamp).toLocaleString();
      console.log(`${emoji} ${alert.packageName} (${alert.packageManager})`);
      console.log(`   ${alert.message}`);
      console.log(`   \uD83D\uDCC5 ${timestamp}`);
      console.log(`   \uD83C\uDFF7️  Type: ${alert.type}`);
      if (alert.acknowledged) {
        console.log(`   ✅ Acknowledged`);
      }
      console.log("");
    }
  } catch (error) {
    console.log("❌ History error:", error instanceof Error ? error.message : "Unknown error");
  }
}
async function acknowledgeAlert(alertId) {
  const alertSystem = new AlertSystem;
  try {
    await alertSystem.initialize();
    const success = await alertSystem.acknowledgeAlert(alertId);
    if (success) {
      console.log(`✅ Alert ${alertId} acknowledged successfully!`);
    } else {
      console.log(`❌ Failed to acknowledge alert ${alertId}`);
    }
  } catch (error) {
    console.log("❌ Acknowledge error:", error instanceof Error ? error.message : "Unknown error");
  }
}
async function configureAlerts() {
  const configManager = ConfigManager.getInstance();
  try {
    await configManager.initialize();
    const config = configManager.getConfig();
    console.log("⚙️ Alert Configuration:");
    console.log("=".repeat(40));
    console.log(`Enabled: ${config.alerts.enabled ? "Yes" : "No"}`);
    console.log(`Interval: ${config.alerts.interval.value} ${config.alerts.interval.unit}`);
    console.log(`Methods: ${config.alerts.methods.join(", ")}`);
    console.log(`Silent Mode: ${config.alerts.silentMode ? "Yes" : "No"}`);
    if (config.alerts.quietHours) {
      console.log(`Quiet Hours: ${config.alerts.quietHours.start} - ${config.alerts.quietHours.end}`);
    }
    console.log(`
\uD83D\uDCDD To configure alerts, edit the configuration file:`);
    console.log(`${configManager.getDataPath()}/config.json`);
  } catch (error) {
    console.log("❌ Configuration error:", error instanceof Error ? error.message : "Unknown error");
  }
}
function getAlertEmoji(alertType) {
  const emojis = {
    outdated: "\uD83D\uDCE6",
    security: "\uD83D\uDD12",
    deprecated: "⚠️",
    vulnerable: "\uD83D\uDEA8"
  };
  return emojis[alertType] || "\uD83D\uDCE2";
}
var alerts_default;
var init_alerts = __esm(() => {
  init_alertSystem();
  init_configManager();
  alerts_default = startPackageAlerts;
});

// src/commands/latestversion.ts
var exports_latestversion = {};
__export(exports_latestversion, {
  showlatestversion: () => showlatestversion
});
import { exec as exec7 } from "child_process";
async function showlatestversion(packageName, packageManager) {
  const name = packageName || process.argv[3];
  if (!name) {
    console.log("Error: Please provide a package name.");
    console.log("Usage: npm-updater [--pm <package-manager>] latestversion <package-name>");
    return;
  }
  const pm = getPackageManager(packageManager);
  const config = getPackageManagerConfig(pm);
  console.log(`Fetching latest version of ${name} using ${config.displayName}...`);
  const viewCommand = config.viewCommand(name);
  exec7(viewCommand, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`Latest version of ${name}: ${stdout.trim()}`);
  });
}
var init_latestversion = __esm(() => {
  init_packageManager();
});

// src/commands/version.ts
var exports_version = {};
__export(exports_version, {
  showversion: () => showversion,
  returnversion: () => returnversion,
  default: () => version_default
});
import { join as join5 } from "path";
import { readFileSync as readFileSync2 } from "node:fs";
import { execSync as execSync3 } from "child_process";
import { fileURLToPath as fileURLToPath2 } from "url";
import { dirname as dirname3 } from "path";
function showversion() {
  console.log(`Version: ` + packageJson.version);
}
function returnversion() {
  return packageJson.version;
}
var packageJson, version_default;
var init_version = __esm(() => {
  try {
    const globalpath = execSync3('cmd /c "where npm-updater.cmd"').toString().trim();
    const packageJsonPath = join5(globalpath, "../node_modules", "@involvex/npm-global-updater", "package.json");
    const packageJsonContent = readFileSync2(packageJsonPath);
    packageJson = JSON.parse(packageJsonContent.toString());
  } catch {
    const __filename2 = fileURLToPath2(import.meta.url);
    const __dirname2 = dirname3(__filename2);
    const packageJsonPath = join5(__dirname2, "..", "..", "package.json");
    const packageJsonContent = readFileSync2(packageJsonPath);
    packageJson = JSON.parse(packageJsonContent.toString());
  }
  version_default = showversion;
});

// package.json
var package_default;
var init_package = __esm(() => {
  package_default = {
    name: "@involvex/npm-global-updater",
    version: "0.1.10",
    description: "global npm package updater",
    license: "MIT",
    author: "involvex",
    main: "bin/npm-updater.js",
    type: "module",
    repository: {
      type: "git",
      url: "https://github.com/involvex/npm-global-updater"
    },
    bin: {
      "npm-updater": "bin/npm-updater.js"
    },
    scripts: {
      lint: "eslint src ",
      "lint:fix": "eslint src --fix",
      format: "prettier --write .",
      "format:check": "prettier --check .",
      dev: "bun run src/index.ts",
      "dev:watch": "bun build src/index.ts --target node --outfile bin/npm-updater.js --watch",
      start: "bun bin/npm-updater.js",
      build: "bun build src/index.ts  --target node --outfile bin/npm-updater.js",
      prebuild: "bun run format && bun run lint:fix && bun run typecheck",
      typecheck: "tsc --noEmit",
      "build:portable": "bun build --compile src/index.ts --outfile bin/npm-updater.exe --compile-autoload-package-json --compile-autoload-tsconfig",
      prepublish: "bun run build",
      changelog: "changelogen --output CHANGELOG.md ",
      postversion: "bun run build",
      release: "bun run scripts/release.ts",
      "docs:dev": "bun --watch run docs/index.html",
      docs: "bun run docs/index.html"
    },
    devDependencies: {
      "@eslint/js": "^9.39.2",
      "@eslint/json": "^0.14.0",
      "@types/bun": "^1.3.5",
      changelogen: "^0.6.2",
      eslint: "^9.39.2",
      globals: "^16.5.0",
      prettier: "^3.7.4",
      "typescript-eslint": "^8.50.0"
    },
    peerDependencies: {
      typescript: "^5.9.3"
    },
    dependencies: {
      jiti: "^2.6.1"
    },
    files: [
      "src/**",
      "bin/**",
      "./",
      ".",
      "package.json"
    ],
    packageManager: "bun@1.3.5",
    readme: "README.md",
    homepage: "https://github.com/involvex/npm-global-updater#readme",
    bugs: "https://github.com/involvex/npm-global-updater/issues",
    keywords: [
      "npm",
      "global",
      "updater",
      "bun",
      "npm-updater",
      "npm-global-updater",
      "updater",
      "update"
    ],
    categories: [
      "Other"
    ],
    sponsor: {
      url: "https://github.com/sponsors/involvex"
    },
    funding: {
      type: "github",
      url: "https://github.com/sponsors/involvex"
    },
    dist: {
      bin: [
        "bin/npm-updater.js",
        "bin/npm-updater.exe"
      ]
    },
    directories: {
      bin: "bin",
      docs: "docs",
      src: "src",
      scripts: "scripts"
    },
    galleryBanner: {
      color: "#000000",
      theme: "dark"
    },
    icon: "assets/logo.png",
    banner: "assets/banner.png"
  };
});

// src/commands/about.ts
var exports_about = {};
__export(exports_about, {
  showabout: () => showabout
});
async function showabout() {
  showlogo();
  console.log("=== About this app ===");
  console.log("Name: " + package_default.name);
  console.log("=".repeat(60));
  console.log("Repository: " + package_default.repository.url);
  console.log("=".repeat(60));
  console.log("Description: " + package_default.description);
  console.log("=".repeat(60));
  console.log("Version: " + returnversion());
  console.log("=".repeat(60));
  console.log("Author: " + package_default.author);
  console.log("=".repeat(60));
}
var init_about = __esm(() => {
  init_package();
  init_version();
});

// src/index.ts
init_packageManager();

// src/utils/self-updater.ts
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { exec } from "child_process";
import { execSync } from "child_process";
var packagejson;
try {
  const globalpath = execSync('cmd /c "where npm-updater.cmd"').toString().trim();
  const packageJsonPath = join(globalpath, "../node_modules", "@involvex/npm-global-updater", "package.json");
  const packageJsonContent = readFileSync(packageJsonPath);
  packagejson = JSON.parse(packageJsonContent.toString());
} catch {
  const __filename2 = fileURLToPath(import.meta.url);
  const __dirname2 = dirname(__filename2);
  const packageJsonPath = join(__dirname2, "..", "..", "package.json");
  const packageJsonContent = readFileSync(packageJsonPath);
  packagejson = JSON.parse(packageJsonContent.toString());
}
var npmpackage = "https://registry.npmjs.org/@involvex/npm-global-updater/latest";
async function getLatestVersion() {
  const response = await fetch(npmpackage);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const version = await response.json();
  const latestVersion = version;
  return latestVersion?.version;
}
async function triggerupdate() {
  if (process.argv.includes("self-update")) {
    const latestVersion = await getLatestVersion();
    const currentVersion = packagejson.version;
    console.log("Current version:", currentVersion);
    console.log("Latest version:", latestVersion);
    console.log("Do you want to update? (y/n)");
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (data) => {
      const answer = data.toString().trim().toLowerCase();
      if (answer === "y") {
        exec("npm install -g @involvex/npm-global-updater@latest", (error, stdout, stderr) => {
          if (error) {
            console.error(`Error updating npm-global-updater: ${error}`);
            return;
          }
          console.log(stdout);
          console.error(stderr);
          console.log("npm-global-updater updated successfully. Please restart the application.");
          process.exit(0);
        });
      } else {
        console.log("Update cancelled.");
        process.exit(0);
      }
      process.stdin.pause();
      return true;
    });
  }
}
async function notifyupdate() {
  const latestVersion = await getLatestVersion();
  const currentVersion = packagejson.version;
  if (currentVersion < latestVersion) {
    console.log("=".repeat(60));
    console.log(`	A new version of npm-global-updater is available.
`, `	Please update by running:
`, `	npm install -g @involvex/npm-global-updater@latest
`, `	or run:
`, `	npm-updater self-update
`);
    console.log("=".repeat(60));
    if (process.argv.includes("self-update")) {
      triggerupdate();
    }
    console.log("Triggered update");
  }
}
var self_updater_default = notifyupdate;
if (process.argv.includes("self-update") && !process.argv.includes("y")) {
  triggerupdate();
}

// src/index.ts
async function run() {
  if (!process.argv.includes("self-update")) {
    self_updater_default();
  }
  const args = process.argv.slice(2);
  let packageManager;
  let commandIndex = 0;
  const pmIndex = args.indexOf("--pm");
  if (pmIndex !== -1) {
    packageManager = args[pmIndex + 1];
    if (!packageManager) {
      console.log("Error: --pm flag requires a value");
      console.log(`Supported package managers: ${formatPackageManagerList()}`);
      return;
    }
    try {
      validatePackageManager(packageManager);
    } catch (error) {
      console.log(`Error: ${error instanceof Error ? error.message : "Invalid package manager"}`);
      console.log(`Supported package managers: ${formatPackageManagerList()}`);
      return;
    }
    args.splice(pmIndex, 2);
    commandIndex = 0;
  }
  const command = args[commandIndex];
  console.log("=".repeat(60));
  if (!command || command === "--help" || command === "-h") {
    showHelp();
    return;
  }
  switch (command) {
    case "ls":
    case "list":
      {
        const { runls: runls2 } = await Promise.resolve().then(() => (init_ls(), exports_ls));
        await runls2(packageManager);
      }
      break;
    case "updateall":
      {
        const { runupdateall: runupdateall2 } = await Promise.resolve().then(() => (init_updateall(), exports_updateall));
        await runupdateall2(packageManager);
      }
      break;
    case "update":
    case "upgrade":
    case "--u":
    case "--update":
      {
        const { runupdate: runupdate2 } = await Promise.resolve().then(() => (init_update(), exports_update));
        const packageName = args[commandIndex + 1];
        await runupdate2(packageName, packageManager);
      }
      break;
    case "export-packages":
    case "export":
      {
        const { runExport: runExport2 } = await Promise.resolve().then(() => (init_export(), exports_export));
        const format = args[commandIndex + 1];
        const output = args[commandIndex + 2];
        const includeTimestamps = args.includes("--timestamp") || args.includes("-t");
        const filterByPackageManager = args.includes("--pm") ? args[args.indexOf("--pm") + 1] : undefined;
        await runExport2(format, output, undefined, filterByPackageManager, includeTimestamps);
      }
      break;
    case "export-templates":
      {
        const { showExportTemplates: showExportTemplates2 } = await Promise.resolve().then(() => (init_export(), exports_export));
        await showExportTemplates2();
      }
      break;
    case "start-package-alerts":
    case "alerts":
      {
        const { startPackageAlerts: startPackageAlerts2 } = await Promise.resolve().then(() => (init_alerts(), exports_alerts));
        const intervalIndex = args.indexOf("--interval");
        const intervalValue = intervalIndex !== -1 && args[intervalIndex + 1] ? parseInt(args[intervalIndex + 1]) : undefined;
        const intervalUnit = intervalIndex !== -1 && args[intervalIndex + 2] ? args[intervalIndex + 2] : undefined;
        const methods = args.includes("--method") ? [args[args.indexOf("--method") + 1]] : undefined;
        const silentMode = args.includes("--silent") || args.includes("-s");
        const interval = intervalValue && intervalUnit ? { value: intervalValue, unit: intervalUnit } : undefined;
        await startPackageAlerts2(interval, methods, silentMode);
      }
      break;
    case "alerts-status":
      {
        const { checkAlertStatus: checkAlertStatus2 } = await Promise.resolve().then(() => (init_alerts(), exports_alerts));
        await checkAlertStatus2();
      }
      break;
    case "alerts-stop":
      {
        const { stopPackageAlerts: stopPackageAlerts2 } = await Promise.resolve().then(() => (init_alerts(), exports_alerts));
        await stopPackageAlerts2();
      }
      break;
    case "alerts-summary":
      {
        const { getAlertSummary: getAlertSummary2 } = await Promise.resolve().then(() => (init_alerts(), exports_alerts));
        const daysIndex = args.indexOf("--days");
        const days = daysIndex !== -1 && args[daysIndex + 1] ? parseInt(args[daysIndex + 1]) : undefined;
        await getAlertSummary2(days);
      }
      break;
    case "alerts-history":
      {
        const { showAlertHistory: showAlertHistory2 } = await Promise.resolve().then(() => (init_alerts(), exports_alerts));
        const limitIndex = args.indexOf("--limit");
        const limit = limitIndex !== -1 && args[limitIndex + 1] ? parseInt(args[limitIndex + 1]) : 10;
        await showAlertHistory2(limit);
      }
      break;
    case "alerts-acknowledge":
      {
        const { acknowledgeAlert: acknowledgeAlert2 } = await Promise.resolve().then(() => (init_alerts(), exports_alerts));
        const alertId = args[commandIndex + 1];
        if (!alertId) {
          console.log("Error: Alert ID is required");
          console.log("Usage: npm-updater alerts-acknowledge <alert-id>");
          return;
        }
        await acknowledgeAlert2(alertId);
      }
      break;
    case "alerts-config":
      {
        const { configureAlerts: configureAlerts2 } = await Promise.resolve().then(() => (init_alerts(), exports_alerts));
        await configureAlerts2();
      }
      break;
    case "help": {
      showHelp();
      break;
    }
    case "latestversion":
      {
        const { showlatestversion: showlatestversion2 } = await Promise.resolve().then(() => (init_latestversion(), exports_latestversion));
        const packageName = args[commandIndex + 1];
        await showlatestversion2(packageName, packageManager);
      }
      break;
    case "version":
    case "--version":
    case "-v":
      {
        const { showversion: showversion2 } = await Promise.resolve().then(() => (init_version(), exports_version));
        showversion2();
      }
      break;
    case "about":
      {
        const { showabout: showabout2 } = await Promise.resolve().then(() => (init_about(), exports_about));
        showabout2();
      }
      break;
    case "self-update":
      {
        await self_updater_default();
      }
      break;
    default:
      showHelp();
  }
  function showHelp() {
    showlogo();
    console.log("=".repeat(60));
    console.log(`
Usage: npm-updater [--pm <package-manager>] <command>

Package Managers:
  --pm npm                Use npm (default)
  --pm pnpm               Use pnpm
  --pm yarn               Use Yarn
  --pm bun                Use Bun

Core Commands:
  version(-v, --version)        Show npm-updater version
  ls                            List all global packages
  updateall                     Update all global packages
  update                        Update single global package
  help                          Show this help message
  latestversion                 Show latest version of a npm package
  about                         Show information about npm-updater
  self-update                   Self-update npm-updater


Export Commands:
  export-packages               Export packages to file
  export-templates              Show export format templates

Alert Commands:
  start-package-alerts          Start monitoring and alerts
  alerts-status                 Check monitoring status
  alerts-stop                   Stop monitoring
  alerts-summary                Get alert summary
  alerts-history                View recent alerts
  alerts-acknowledge            Acknowledge an alert
  alerts-config                 Show alert configuration

Options:
  --help, -h                    Show this help message
  --pm <package-manager>        Specify package manager (npm, pnpm, yarn, bun)
  --update, -u                  Update a package
  --version, -v                 Show npm-updater version
  --format [txt|json]           Export format
  --output <filename>           Output file path
  --timestamp, -t               Include timestamps in export
  --interval <value> <unit>     Alert check interval (minutes|hours|days)
  --method [desktop|email|log]  Notification method
  --silent, -s                  Silent mode (no notifications)
  --days <number>               Days for alert summary
  --limit <number>              Number of alerts to show

Examples:
  # Core usage
  npm-updater ls                    # List packages using npm
  npm-updater --pm pnpm ls          # List packages using pnpm
  npm-updater --pm yarn updateall   # Update all packages using Yarn
  npm-updater update prettier       # Update prettier using npm (default)

  # Export functionality
  npm-updater export-packages --format txt --output packages.txt
  npm-updater export-packages --format json --timestamp
  npm-updater export-packages --pm npm --timestamp
  npm-updater export-templates      # Show format templates

  # Alert system
  npm-updater start-package-alerts --interval 24 hours --method desktop
  npm-updater alerts-status
  npm-updater alerts-summary --days 7
  npm-updater alerts-history --limit 20
  npm-updater alerts-stop

For more information, visit: https://github.com/involvex/npm-global-updater
    `);
  }
}
run();
export {
  run
};
