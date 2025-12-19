import { exec } from "child_process";
import {
  ConfigManager,
  type AlertHistory,
  type SecurityAdvisory,
} from "../config/configManager";
import {
  PackageTracker,
  type TrackedPackage,
  type UpdateInfo,
} from "../database/packageTracker";
import { NotificationManager } from "../notifications/notificationManager";

export interface AlertConfig {
  interval: {
    value: number;
    unit: "minutes" | "hours" | "days";
  };
  methods: ("desktop" | "email" | "log")[];
  enabled: boolean;
  silentMode: boolean;
  quietHours?: {
    start: string; // HH:MM format
    end: string; // HH:MM format
  };
}

export interface SecurityCheckResult {
  packageName: string;
  packageManager: string;
  severity: "low" | "moderate" | "high" | "critical";
  vulnerabilities: SecurityAdvisory[];
  needsUpdate: boolean;
}

export interface AlertSummary {
  totalAlerts: number;
  outdated: number;
  security: number;
  deprecated: number;
  bySeverity: Record<string, number>;
  lastCheck: Date;
}

export class AlertSystem {
  private configManager: ConfigManager;
  private packageTracker: PackageTracker;
  private notificationManager: NotificationManager;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = false;

  constructor() {
    this.configManager = ConfigManager.getInstance();
    this.packageTracker = new PackageTracker();
    this.notificationManager = new NotificationManager();
  }

  public async initialize(): Promise<void> {
    await this.configManager.initialize();
    await this.packageTracker.initialize();
    await this.notificationManager.initialize();
  }

  /**
   * Start the monitoring system
   */
  public async startMonitoring(
    customConfig?: Partial<AlertConfig>,
  ): Promise<{ success: boolean; message: string }> {
    const config = this.configManager.getConfig();

    if (this.isMonitoring) {
      return {
        success: false,
        message: "Monitoring is already active",
      };
    }

    // Update config if custom config provided
    if (customConfig) {
      const updatedConfig = {
        ...config.alerts,
        ...customConfig,
      };
      await this.configManager.updateConfig({
        alerts: updatedConfig,
      });
    }

    const alertConfig = this.configManager.getConfig().alerts;

    if (!alertConfig.enabled) {
      return {
        success: false,
        message: "Alert system is disabled in configuration",
      };
    }

    // Calculate interval in milliseconds
    const intervalMs = this.calculateIntervalMs(alertConfig.interval);

    // Start monitoring loop
    this.monitoringInterval = setInterval(async () => {
      await this.performMonitoringCycle();
    }, intervalMs);

    this.isMonitoring = true;

    // Perform initial check
    await this.performMonitoringCycle();

    return {
      success: true,
      message: `Monitoring started with ${alertConfig.interval.value} ${alertConfig.interval.unit} interval`,
    };
  }

  /**
   * Stop the monitoring system
   */
  public stopMonitoring(): { success: boolean; message: string } {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.isMonitoring = false;

    return {
      success: true,
      message: "Monitoring stopped",
    };
  }

  /**
   * Get monitoring status
   */
  public getMonitoringStatus(): {
    isActive: boolean;
    interval: string;
    lastCheck?: Date;
  } {
    const config = this.configManager.getConfig().alerts;

    return {
      isActive: this.isMonitoring,
      interval: this.isMonitoring
        ? `${config.interval.value} ${config.interval.unit}`
        : "Not running",
    };
  }

  /**
   * Perform a single monitoring cycle
   */
  private async performMonitoringCycle(): Promise<void> {
    try {
      const config = this.configManager.getConfig();
      const alertConfig = config.alerts;

      // Check if we're in quiet hours
      if (this.isInQuietHours(alertConfig.quietHours)) {
        console.log("Monitoring check skipped - within quiet hours");
        return;
      }

      console.log("Starting monitoring cycle...");

      // Check for updates
      const trackedPackages = await this.packageTracker.scanAllPackages();
      const updates =
        await this.packageTracker.checkForUpdates(trackedPackages);

      // Check for security vulnerabilities
      const securityResults =
        await this.checkSecurityVulnerabilities(trackedPackages);

      // Check for deprecated packages
      const deprecatedPackages = trackedPackages.filter(
        pkg => pkg.isDeprecated,
      );

      // Generate alerts
      const alerts = this.generateAlerts(
        trackedPackages,
        updates,
        securityResults,
        deprecatedPackages,
      );

      // Save alerts to history
      for (const alert of alerts) {
        await this.configManager.saveAlertHistory(alert);
      }

      // Send notifications if not in silent mode
      if (!alertConfig.silentMode && alerts.length > 0) {
        await this.notificationManager.sendNotifications(
          alerts,
          alertConfig.methods,
        );
      }

      console.log(
        `Monitoring cycle completed. Generated ${alerts.length} alerts.`,
      );
    } catch (error) {
      console.error("Error during monitoring cycle:", error);
    }
  }

  /**
   * Check for security vulnerabilities
   */
  private async checkSecurityVulnerabilities(
    packages: TrackedPackage[],
  ): Promise<SecurityCheckResult[]> {
    const results: SecurityCheckResult[] = [];

    for (const pkg of packages) {
      try {
        // Use npm audit or similar security check
        const auditResult = await this.runSecurityAudit(
          pkg.name,
          pkg.packageManager,
        );

        if (auditResult.vulnerabilities.length > 0) {
          results.push({
            packageName: pkg.name,
            packageManager: pkg.packageManager,
            severity: this.getHighestSeverity(auditResult.vulnerabilities),
            vulnerabilities: auditResult.vulnerabilities,
            needsUpdate: auditResult.needsUpdate,
          });
        }
      } catch (error) {
        console.warn(`Failed to check security for ${pkg.name}:`, error);
      }
    }

    return results;
  }

  /**
   * Run security audit for a package
   */
  private async runSecurityAudit(
    packageName: string,
    packageManager: string,
  ): Promise<{
    vulnerabilities: SecurityAdvisory[];
    needsUpdate: boolean;
  }> {
    // This would integrate with npm audit or similar security APIs
    // For now, we'll simulate the response

    return new Promise(resolve => {
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

      exec(command, (error: unknown, stdout: string) => {
        if (error) {
          // If audit fails, return empty results
          resolve({ vulnerabilities: [], needsUpdate: false });
          return;
        }

        try {
          const auditData = JSON.parse(stdout);
          const vulnerabilities: SecurityAdvisory[] = [];

          // Parse npm audit output
          if (auditData.vulnerabilities) {
            for (const [pkg, vuln] of Object.entries(
              auditData.vulnerabilities,
            )) {
              if (
                pkg === packageName &&
                typeof vuln === "object" &&
                vuln !== null
              ) {
                const vulnData = vuln as Record<string, unknown>;
                if (vulnData.via && Array.isArray(vulnData.via)) {
                  for (const via of vulnData.via) {
                    if (
                      typeof via === "object" &&
                      via !== null &&
                      "title" in via
                    ) {
                      const viaData = via as {
                        title?: string;
                        severity?: string;
                        url?: string;
                        cwe?: string;
                      };
                      vulnerabilities.push({
                        severity: this.mapSeverity(viaData.severity || "low"),
                        title: viaData.title || "Security vulnerability",
                        url: viaData.url || "",
                        published: new Date(),
                        cwe: viaData.cwe,
                      });
                    }
                  }
                }
              }
            }
          }

          resolve({
            vulnerabilities,
            needsUpdate: vulnerabilities.length > 0,
          });
        } catch {
          resolve({ vulnerabilities: [], needsUpdate: false });
        }
      });
    });
  }

  /**
   * Map string severity to our enum
   */
  private mapSeverity(
    severity: string,
  ): "low" | "moderate" | "high" | "critical" {
    const mapping: Record<string, "low" | "moderate" | "high" | "critical"> = {
      low: "low",
      moderate: "moderate",
      high: "high",
      critical: "critical",
    };

    return mapping[severity.toLowerCase()] || "low";
  }

  /**
   * Get highest severity from vulnerabilities
   */
  private getHighestSeverity(
    vulnerabilities: SecurityAdvisory[],
  ): "low" | "moderate" | "high" | "critical" {
    const severityOrder: Record<string, number> = {
      low: 1,
      moderate: 2,
      high: 3,
      critical: 4,
    };

    let highest: "low" | "moderate" | "high" | "critical" = "low";

    for (const vuln of vulnerabilities) {
      if (
        vuln.severity &&
        Object.prototype.hasOwnProperty.call(severityOrder, vuln.severity)
      ) {
        const currentSeverityValue = severityOrder[vuln.severity]!;
        if (currentSeverityValue > severityOrder[highest]!) {
          highest = vuln.severity;
        }
      }
    }

    return highest;
  }

  /**
   * Generate alerts based on package status
   */
  private generateAlerts(
    packages: TrackedPackage[],
    updates: UpdateInfo[],
    securityResults: SecurityCheckResult[],
    deprecatedPackages: TrackedPackage[],
  ): AlertHistory[] {
    const alerts: AlertHistory[] = [];
    const now = new Date();

    // Generate update alerts
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
          changelog: update.changelog,
        },
      });
    }

    // Generate security alerts
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
          vulnerabilityDetails: security.vulnerabilities,
        },
      });
    }

    // Generate deprecated alerts
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
          deprecatedDate: pkg.metadata.lastUpdated,
        },
      });
    }

    return alerts;
  }

  /**
   * Calculate interval in milliseconds
   */
  private calculateIntervalMs(interval: {
    value: number;
    unit: "minutes" | "hours" | "days";
  }): number {
    const multipliers = {
      minutes: 60 * 1000,
      hours: 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000,
    };

    return interval.value * multipliers[interval.unit];
  }

  /**
   * Check if current time is within quiet hours
   */
  private isInQuietHours(quietHours?: { start: string; end: string }): boolean {
    if (!quietHours) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    // Handle overnight quiet hours (e.g., 22:00 to 06:00)
    if (quietHours.start > quietHours.end) {
      return currentTime >= quietHours.start || currentTime <= quietHours.end;
    }

    return currentTime >= quietHours.start && currentTime <= quietHours.end;
  }

  /**
   * Get alert summary
   */
  public async getAlertSummary(days?: number): Promise<AlertSummary> {
    const alerts = await this.configManager.getAlertHistory(days);

    const summary: AlertSummary = {
      totalAlerts: alerts.length,
      outdated: alerts.filter(a => a.type === "outdated").length,
      security: alerts.filter(a => a.type === "security").length,
      deprecated: alerts.filter(a => a.type === "deprecated").length,
      bySeverity: {},
      lastCheck: new Date(),
    };

    // Count by severity
    for (const alert of alerts) {
      const severity =
        (alert.metadata as { severity?: string })?.severity || "unknown";
      summary.bySeverity[severity] = (summary.bySeverity[severity] || 0) + 1;
    }

    return summary;
  }

  /**
   * Acknowledge an alert
   */
  public async acknowledgeAlert(alertId: string): Promise<boolean> {
    try {
      const alerts = await this.configManager.getAlertHistory();
      const alert = alerts.find(a => a.id === alertId);

      if (alert) {
        alert.acknowledged = true;
        // Save updated alert (simplified for now)
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Get recent alerts
   */
  public async getRecentAlerts(limit = 10): Promise<AlertHistory[]> {
    const alerts = await this.configManager.getAlertHistory();
    return alerts.slice(0, limit);
  }
}

export default AlertSystem;
