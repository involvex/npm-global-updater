import { exec } from "child_process";
import {
  ConfigManager,
  type PackageMetadata,
  type SecurityAdvisory,
} from "../config/configManager";
import {
  getPackageManagerConfig,
  type PackageManager,
} from "../utils/packageManager";

export interface TrackedPackage {
  name: string;
  currentVersion: string;
  latestVersion?: string;
  packageManager: string;
  isOutdated: boolean;
  hasSecurityIssues: boolean;
  isDeprecated: boolean;
  updateAvailable: boolean;
  lastCheck: Date;
  metadata: PackageMetadata;
}

export interface UpdateInfo {
  name: string;
  currentVersion: string;
  latestVersion: string;
  packageManager: string;
  changelog?: string;
  securityAdvisory?: string;
  releaseDate?: Date;
  deprecated?: boolean;
}

export interface PackageInfo {
  latestVersion: string;
  description?: string;
  homepage?: string;
  license?: string;
  deprecated?: boolean;
  securityAdvisories?: unknown[];
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export class PackageTracker {
  private configManager: ConfigManager;

  constructor() {
    this.configManager = ConfigManager.getInstance();
  }

  public async initialize(): Promise<void> {
    await this.configManager.initialize();
  }

  /**
   * Scan and track all globally installed packages
   */
  public async scanAllPackages(
    packageManagers?: string[],
  ): Promise<TrackedPackage[]> {
    const config = this.configManager.getConfig();
    const managers = packageManagers || config.packageManagers.enabled;
    const trackedPackages: TrackedPackage[] = [];

    for (const manager of managers) {
      try {
        const packages = await this.scanPackageManager(manager);
        trackedPackages.push(...packages);
      } catch (error) {
        console.warn(`Failed to scan packages for ${manager}:`, error);
      }
    }

    // Save package metadata if tracking is enabled
    if (config.tracking.enabled) {
      await this.savePackageMetadata(trackedPackages);
    }

    return trackedPackages;
  }

  /**
   * Scan packages for a specific package manager
   */
  private async scanPackageManager(
    packageManager: string,
  ): Promise<TrackedPackage[]> {
    const config = getPackageManagerConfig(packageManager as PackageManager);
    const packages: TrackedPackage[] = [];

    return new Promise((resolve, reject) => {
      exec(config.listJsonCommand, async (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }

        try {
          const data = JSON.parse(stdout);
          const dependencies = data.dependencies || {};

          for (const [packageName, packageInfo] of Object.entries(
            dependencies,
          )) {
            if (
              typeof packageInfo === "object" &&
              packageInfo !== null &&
              "version" in packageInfo
            ) {
              const trackedPackage = await this.trackPackage(
                packageName,
                packageInfo.version as string,
                packageManager,
              );
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

  /**
   * Track a specific package and gather metadata
   */
  private async trackPackage(
    name: string,
    version: string,
    packageManager: string,
  ): Promise<TrackedPackage> {
    const packageInfo = await this.getPackageInfo(name, packageManager);
    const metadata = await this.buildPackageMetadata(
      name,
      version,
      packageManager,
      packageInfo,
    );

    // Save individual package metadata
    if (this.configManager.getConfig().tracking.enabled) {
      await this.configManager.savePackageMetadata(metadata);
    }

    return {
      name,
      currentVersion: version,
      latestVersion: packageInfo.latestVersion,
      packageManager,
      isOutdated: packageInfo.latestVersion !== version,
      hasSecurityIssues: Boolean(
        packageInfo.securityAdvisories &&
        packageInfo.securityAdvisories.length > 0,
      ),
      isDeprecated: packageInfo.deprecated || false,
      updateAvailable: packageInfo.latestVersion !== version,
      lastCheck: new Date(),
      metadata,
    };
  }

  /**
   * Get detailed information about a package
   */
  private async getPackageInfo(
    name: string,
    packageManager: string,
  ): Promise<PackageInfo> {
    const config = getPackageManagerConfig(packageManager as PackageManager);

    return new Promise((resolve, reject) => {
      const command = config.viewCommand(name);

      exec(command, (error, stdout) => {
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
            securityAdvisories: data.securityAdvisories || [],
          });
        } catch (parseError) {
          reject(parseError);
        }
      });
    });
  }

  /**
   * Build comprehensive package metadata
   */
  private async buildPackageMetadata(
    name: string,
    version: string,
    packageManager: string,
    packageInfo: PackageInfo,
  ): Promise<PackageMetadata> {
    const existingMetadata = await this.getExistingPackageMetadata(
      name,
      packageManager,
    );
    const now = new Date();

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
      securityAdvisories:
        (packageInfo.securityAdvisories as SecurityAdvisory[]) || [],
    };
  }

  /**
   * Get existing package metadata if available
   */
  private async getExistingPackageMetadata(
    name: string,
    packageManager: string,
  ): Promise<PackageMetadata | null> {
    try {
      const allPackages =
        await this.configManager.getPackageMetadata(packageManager);
      return allPackages.find(p => p.name === name) || null;
    } catch {
      return null;
    }
  }

  /**
   * Get the registry URL for a package manager
   */
  private getRegistryUrl(packageManager: string): string {
    const registryUrls = {
      npm: "https://registry.npmjs.org",
      pnpm: "https://registry.npmjs.org",
      yarn: "https://registry.npmjs.org",
      bun: "https://registry.npmjs.org",
    };

    return (
      registryUrls[packageManager as keyof typeof registryUrls] || "unknown"
    );
  }

  /**
   * Save package metadata for all tracked packages
   */
  private async savePackageMetadata(
    trackedPackages: TrackedPackage[],
  ): Promise<void> {
    const savePromises = trackedPackages.map(pkg =>
      this.configManager.savePackageMetadata(pkg.metadata),
    );

    await Promise.all(savePromises);
  }

  /**
   * Check for available updates across all tracked packages
   */
  public async checkForUpdates(
    trackedPackages: TrackedPackage[],
  ): Promise<UpdateInfo[]> {
    const updates: UpdateInfo[] = [];

    for (const pkg of trackedPackages) {
      if (pkg.updateAvailable) {
        const updateInfo = await this.getUpdateInfo(pkg);
        updates.push(updateInfo);
      }
    }

    return updates;
  }

  /**
   * Get detailed update information for a package
   */
  private async getUpdateInfo(pkg: TrackedPackage): Promise<UpdateInfo> {
    const packageInfo = await this.getPackageInfo(pkg.name, pkg.packageManager);

    return {
      name: pkg.name,
      currentVersion: pkg.currentVersion,
      latestVersion: packageInfo.latestVersion,
      packageManager: pkg.packageManager,
      changelog: await this.getChangelog(pkg.name),
      securityAdvisory: (
        packageInfo.securityAdvisories?.[0] as { url?: string }
      )?.url,
      deprecated: packageInfo.deprecated,
    };
  }

  /**
   * Get changelog for a package
   */
  private async getChangelog(packageName: string): Promise<string | undefined> {
    try {
      return new Promise(resolve => {
        const command = `npm view ${packageName} changelog --json`;

        exec(command, (error, stdout) => {
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
      return undefined;
    }
  }

  /**
   * Get packages that need attention (outdated, security issues, deprecated)
   */
  public async getPackagesNeedingAttention(
    trackedPackages: TrackedPackage[],
  ): Promise<{
    outdated: TrackedPackage[];
    security: TrackedPackage[];
    deprecated: TrackedPackage[];
  }> {
    return {
      outdated: trackedPackages.filter(pkg => pkg.isOutdated),
      security: trackedPackages.filter(pkg => pkg.hasSecurityIssues),
      deprecated: trackedPackages.filter(pkg => pkg.isDeprecated),
    };
  }

  /**
   * Get package statistics
   */
  public getPackageStatistics(trackedPackages: TrackedPackage[]): {
    total: number;
    outdated: number;
    upToDate: number;
    securityIssues: number;
    deprecated: number;
    byPackageManager: Record<string, number>;
  } {
    const stats = {
      total: trackedPackages.length,
      outdated: trackedPackages.filter(pkg => pkg.isOutdated).length,
      upToDate: trackedPackages.filter(pkg => !pkg.isOutdated).length,
      securityIssues: trackedPackages.filter(pkg => pkg.hasSecurityIssues)
        .length,
      deprecated: trackedPackages.filter(pkg => pkg.isDeprecated).length,
      byPackageManager: {} as Record<string, number>,
    };

    // Count by package manager
    for (const pkg of trackedPackages) {
      stats.byPackageManager[pkg.packageManager] =
        (stats.byPackageManager[pkg.packageManager] || 0) + 1;
    }

    return stats;
  }
}

export default PackageTracker;
