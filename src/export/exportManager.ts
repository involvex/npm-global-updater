import { promises as fs } from "fs";
import { join } from "path";
import { ConfigManager } from "../config/configManager";
import {
  PackageTracker,
  type TrackedPackage,
} from "../database/packageTracker";

export interface ExportOptions {
  format: "txt" | "json";
  output?: string;
  includeTimestamps: boolean;
  filterByPackageManager?: string;
  filterByInstallationDate?: {
    after?: Date;
    before?: Date;
  };
  packageManagers?: string[];
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  packagesExported: number;
  message: string;
}

export class ExportManager {
  private configManager: ConfigManager;
  private packageTracker: PackageTracker;

  constructor() {
    this.configManager = ConfigManager.getInstance();
    this.packageTracker = new PackageTracker();
  }

  public async initialize(): Promise<void> {
    await this.configManager.initialize();
    await this.packageTracker.initialize();
  }

  /**
   * Export packages with the specified options
   */
  public async exportPackages(
    options: Partial<ExportOptions> = {},
  ): Promise<ExportResult> {
    try {
      const config = this.configManager.getConfig();
      const exportOptions: ExportOptions = {
        format: options.format || config.export.defaultFormat,
        output: options.output,
        includeTimestamps:
          options.includeTimestamps ?? config.export.includeTimestamps,
        filterByPackageManager: options.filterByPackageManager,
        filterByInstallationDate: options.filterByInstallationDate,
        packageManagers: options.packageManagers,
      };

      // Scan all packages
      const trackedPackages = await this.packageTracker.scanAllPackages(
        exportOptions.packageManagers,
      );

      // Filter packages based on options
      const filteredPackages = this.filterPackages(
        trackedPackages,
        exportOptions,
      );

      // Generate output filename if not provided
      const outputPath =
        exportOptions.output || this.generateOutputPath(exportOptions);

      // Export packages
      const success = await this.writeExportFile(
        filteredPackages,
        outputPath,
        exportOptions,
      );

      return {
        success,
        filePath: success ? outputPath : undefined,
        packagesExported: filteredPackages.length,
        message: success
          ? `Successfully exported ${filteredPackages.length} packages to ${outputPath}`
          : `Failed to export packages to ${outputPath}`,
      };
    } catch (error) {
      return {
        success: false,
        packagesExported: 0,
        message: `Export failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Filter packages based on export options
   */
  private filterPackages(
    packages: TrackedPackage[],
    options: ExportOptions,
  ): TrackedPackage[] {
    let filtered = [...packages];

    // Filter by package manager
    if (options.filterByPackageManager) {
      filtered = filtered.filter(
        pkg => pkg.packageManager === options.filterByPackageManager,
      );
    }

    // Filter by installation date
    if (options.filterByInstallationDate) {
      const { after, before } = options.filterByInstallationDate;

      filtered = filtered.filter(pkg => {
        const installDate = new Date(pkg.metadata.installedDate);

        if (after && installDate < after) return false;
        if (before && installDate > before) return false;

        return true;
      });
    }

    return filtered;
  }

  /**
   * Generate output file path
   */
  private generateOutputPath(options: ExportOptions): string {
    const config = this.configManager.getConfig();
    const timestamp = options.includeTimestamps ? this.getTimestamp() : "";
    const extension = options.format;
    const directory = config.export.defaultDirectory;

    const filename = `npm-packages${timestamp ? `-${timestamp}` : ""}.${extension}`;
    return join(directory, filename);
  }

  /**
   * Get timestamp string for filenames
   */
  private getTimestamp(): string {
    const now = new Date();
    return now.toISOString().slice(0, 19).replace(/:/g, "-").replace("T", "-");
  }

  /**
   * Write export file in the specified format
   */
  private async writeExportFile(
    packages: TrackedPackage[],
    outputPath: string,
    options: ExportOptions,
  ): Promise<boolean> {
    try {
      // Ensure directory exists
      const directory = outputPath.substring(0, outputPath.lastIndexOf("/"));
      await fs.mkdir(directory, { recursive: true });

      let content: string;

      if (options.format === "json") {
        content = this.generateJsonExport(packages);
      } else {
        content = this.generateTxtExport(packages);
      }

      await fs.writeFile(outputPath, content, "utf-8");
      return true;
    } catch (error) {
      console.error("Failed to write export file:", error);
      return false;
    }
  }

  /**
   * Generate JSON export content
   */
  private generateJsonExport(packages: TrackedPackage[]): string {
    const exportData = {
      exportDate: new Date().toISOString(),
      format: "json",
      totalPackages: packages.length,
      packageManagers: [...new Set(packages.map(p => p.packageManager))],
      packages: packages.map(pkg => ({
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
        securityAdvisories: pkg.metadata.securityAdvisories?.length || 0,
      })),
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Generate TXT export content
   */
  private generateTxtExport(packages: TrackedPackage[]): string {
    const lines: string[] = [];

    // Header
    lines.push("=".repeat(80));
    lines.push("NPM Package Export Report");
    lines.push("=".repeat(80));
    lines.push(`Export Date: ${new Date().toLocaleString()}`);
    lines.push(`Total Packages: ${packages.length}`);
    lines.push(
      `Package Managers: ${[...new Set(packages.map(p => p.packageManager))].join(", ")}`,
    );
    lines.push("");

    // Summary
    const outdatedCount = packages.filter(p => p.isOutdated).length;
    const securityIssuesCount = packages.filter(
      p => p.hasSecurityIssues,
    ).length;
    const deprecatedCount = packages.filter(p => p.isDeprecated).length;

    lines.push("SUMMARY:");
    lines.push(`  Up to date: ${packages.length - outdatedCount}`);
    lines.push(`  Outdated: ${outdatedCount}`);
    lines.push(`  Security Issues: ${securityIssuesCount}`);
    lines.push(`  Deprecated: ${deprecatedCount}`);
    lines.push("");

    // Detailed package list
    lines.push("PACKAGE DETAILS:");
    lines.push("-".repeat(80));

    for (const pkg of packages) {
      lines.push(`Package: ${pkg.name}`);
      lines.push(
        `  Version: ${pkg.currentVersion}${pkg.latestVersion && pkg.latestVersion !== pkg.currentVersion ? ` (Latest: ${pkg.latestVersion})` : ""}`,
      );
      lines.push(`  Manager: ${pkg.packageManager}`);
      lines.push(
        `  Installed: ${new Date(pkg.metadata.installedDate).toLocaleDateString()}`,
      );
      lines.push(
        `  Updated: ${new Date(pkg.metadata.lastUpdated).toLocaleDateString()}`,
      );
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

      // Status indicators
      const status: string[] = [];
      if (pkg.isOutdated) status.push("OUTDATED");
      if (pkg.hasSecurityIssues) status.push("SECURITY ISSUES");
      if (pkg.isDeprecated) status.push("DEPRECATED");

      if (status.length > 0) {
        lines.push(`  Status: ${status.join(", ")}`);
      }

      // Dependencies count
      const depCount = Object.keys(pkg.metadata.dependencies || {}).length;
      const devDepCount = Object.keys(
        pkg.metadata.devDependencies || {},
      ).length;
      if (depCount > 0 || devDepCount > 0) {
        lines.push(`  Dependencies: ${depCount} regular, ${devDepCount} dev`);
      }

      // Security advisories
      if (
        pkg.metadata.securityAdvisories &&
        pkg.metadata.securityAdvisories.length > 0
      ) {
        lines.push(
          `  Security Advisories: ${pkg.metadata.securityAdvisories.length}`,
        );
      }

      lines.push(""); // Empty line between packages
    }

    lines.push("=".repeat(80));
    lines.push("End of Export Report");
    lines.push("=".repeat(80));

    return lines.join("\n");
  }

  /**
   * Get export templates for different formats
   */
  public getExportTemplates(): {
    json: string;
    txt: string;
  } {
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
================================================================================`,
    };
  }

  /**
   * Validate export options
   */
  public validateExportOptions(options: Partial<ExportOptions>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate format
    if (options.format && !["txt", "json"].includes(options.format)) {
      errors.push('Format must be either "txt" or "json"');
    }

    // Validate output path
    if (options.output) {
      try {
        // Check if path is valid - basic validation
        if (
          options.output.includes("..") ||
          options.output.includes("\\..\\")
        ) {
          errors.push("Invalid output file path - path traversal not allowed");
        }
      } catch {
        errors.push("Invalid output file path");
      }
    }

    // Validate package managers
    if (options.packageManagers && options.packageManagers.length > 0) {
      const supportedManagers = ["npm", "pnpm", "yarn", "bun"];
      const unsupported = options.packageManagers.filter(
        pm => !supportedManagers.includes(pm),
      );
      if (unsupported.length > 0) {
        errors.push(`Unsupported package managers: ${unsupported.join(", ")}`);
      }
    }

    // Validate date filters
    if (options.filterByInstallationDate) {
      const { after, before } = options.filterByInstallationDate;
      if (after && before && after >= before) {
        errors.push('"after" date must be before "before" date');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default ExportManager;
