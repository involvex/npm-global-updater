import { promises as fs } from "fs";
import { join } from "path";
import { homedir } from "os";
import { execSync } from "child_process";
import { ConfigManager, type AlertHistory } from "../config/configManager";

export interface NotificationConfig {
  methods: ("desktop" | "email" | "log")[];
  email?: {
    smtpHost: string;
    smtpPort: number;
    username: string;
    password: string;
    from: string;
    to: string[];
  };
}

export interface NotificationResult {
  success: boolean;
  method: string;
  message: string;
}

export class NotificationManager {
  private configManager: ConfigManager;
  private logPath: string;

  constructor() {
    this.configManager = ConfigManager.getInstance();
    this.logPath = join(
      homedir(),
      ".config",
      "npm-updater",
      "notifications.log",
    );
  }

  public async initialize(): Promise<void> {
    await this.configManager.initialize();

    // Ensure log directory exists
    await fs.mkdir(this.configManager.getDataPath(), { recursive: true });
  }

  /**
   * Send notifications using the specified methods
   */
  public async sendNotifications(
    alerts: AlertHistory[],
    methods: ("desktop" | "email" | "log")[],
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    for (const method of methods) {
      try {
        let result: NotificationResult;

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
              message: `Unknown notification method: ${method}`,
            };
        }

        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          method,
          message: `Failed to send ${method} notification: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }

    return results;
  }

  /**
   * Send desktop notification
   */
  private async sendDesktopNotification(
    alerts: AlertHistory[],
  ): Promise<NotificationResult> {
    try {
      // Check if we can use desktop notifications
      if (typeof process !== "undefined" && process.platform === "win32") {
        // Windows notification
        for (const alert of alerts) {
          const command = `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('${alert.message}', 'NPM Package Alert', 'OK', 'Information')"`;

          try {
            execSync(command);
          } catch (error) {
            console.warn("Desktop notification failed:", error);
          }
        }
      } else {
        // For non-Windows systems, use terminal notifications
        console.log("\n🔔 NPM Package Alerts:");
        for (const alert of alerts) {
          const emoji = this.getAlertEmoji(alert.type);
          console.log(`${emoji} ${alert.message}`);
        }
        console.log("");
      }

      return {
        success: true,
        method: "desktop",
        message: `Desktop notification sent for ${alerts.length} alerts`,
      };
    } catch (error) {
      return {
        success: false,
        method: "desktop",
        message: `Failed to send desktop notification: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    alerts: AlertHistory[],
  ): Promise<NotificationResult> {
    const config = this.configManager.getConfig();
    const emailConfig = config.alerts.email;

    if (!emailConfig) {
      return {
        success: false,
        method: "email",
        message: "Email configuration not found",
      };
    }

    try {
      // For demonstration, we'll create a simple email body
      // In a real implementation, you would use a library like nodemailer
      const emailBody = this.generateEmailBody(alerts);

      // Log the email instead of actually sending it (for safety)
      console.log("Email notification (simulated):");
      console.log("To:", emailConfig.to.join(", "));
      console.log("From:", emailConfig.from);
      console.log("Subject: NPM Package Security Alerts");
      console.log("Body:", emailBody);

      return {
        success: true,
        method: "email",
        message: `Email notification prepared for ${alerts.length} alerts`,
      };
    } catch (error) {
      return {
        success: false,
        method: "email",
        message: `Failed to send email notification: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Send log notification
   */
  private async sendLogNotification(
    alerts: AlertHistory[],
  ): Promise<NotificationResult> {
    try {
      const logEntry = this.generateLogEntry(alerts);

      await fs.appendFile(this.logPath, logEntry + "\n", "utf-8");

      return {
        success: true,
        method: "log",
        message: `Logged ${alerts.length} alerts to ${this.logPath}`,
      };
    } catch (error) {
      return {
        success: false,
        method: "log",
        message: `Failed to write log notification: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Generate email body for notifications
   */
  private generateEmailBody(alerts: AlertHistory[]): string {
    const criticalAlerts = alerts.filter(
      a => (a.metadata as { severity?: string })?.severity === "critical",
    );
    const securityAlerts = alerts.filter(a => a.type === "security");
    const outdatedAlerts = alerts.filter(a => a.type === "outdated");
    const deprecatedAlerts = alerts.filter(a => a.type === "deprecated");

    let body = "NPM Package Monitoring Alerts\n\n";
    body += `Generated: ${new Date().toLocaleString()}\n`;
    body += `Total Alerts: ${alerts.length}\n\n`;

    if (criticalAlerts.length > 0) {
      body += `🚨 CRITICAL ALERTS (${criticalAlerts.length}):\n`;
      for (const alert of criticalAlerts) {
        body += `• ${alert.packageName}: ${alert.message}\n`;
      }
      body += "\n";
    }

    if (securityAlerts.length > 0) {
      body += `🔒 SECURITY ALERTS (${securityAlerts.length}):\n`;
      for (const alert of securityAlerts) {
        body += `• ${alert.packageName}: ${alert.message}\n`;
      }
      body += "\n";
    }

    if (outdatedAlerts.length > 0) {
      body += `📦 OUTDATED PACKAGES (${outdatedAlerts.length}):\n`;
      for (const alert of outdatedAlerts) {
        body += `• ${alert.packageName}: ${alert.message}\n`;
      }
      body += "\n";
    }

    if (deprecatedAlerts.length > 0) {
      body += `⚠️ DEPRECATED PACKAGES (${deprecatedAlerts.length}):\n`;
      for (const alert of deprecatedAlerts) {
        body += `• ${alert.packageName}: ${alert.message}\n`;
      }
      body += "\n";
    }

    body += "Please review these alerts and take appropriate action.\n";
    body += "\nThis is an automated message from NPM Package Monitor.";

    return body;
  }

  /**
   * Generate log entry for alerts
   */
  private generateLogEntry(alerts: AlertHistory[]): string {
    const timestamp = new Date().toISOString();
    const alertSummary = alerts
      .map(
        alert =>
          `[${alert.type.toUpperCase()}] ${alert.packageName}: ${alert.message}`,
      )
      .join(" | ");

    return `[${timestamp}] NPM Alerts: ${alertSummary}`;
  }

  /**
   * Get emoji for alert type
   */
  private getAlertEmoji(alertType: string): string {
    const emojis: Record<string, string> = {
      outdated: "📦",
      security: "🔒",
      deprecated: "⚠️",
      vulnerable: "🚨",
    };

    return emojis[alertType] || "📢";
  }

  /**
   * Test notification methods
   */
  public async testNotifications(): Promise<{
    desktop: NotificationResult;
    email: NotificationResult;
    log: NotificationResult;
  }> {
    const testAlert: AlertHistory = {
      id: "test-alert",
      packageName: "test-package",
      packageManager: "npm",
      type: "outdated",
      message: "Test notification - package update available",
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
    };

    return {
      desktop: await this.sendDesktopNotification([testAlert]),
      email: await this.sendEmailNotification([testAlert]),
      log: await this.sendLogNotification([testAlert]),
    };
  }

  /**
   * Get notification history
   */
  public async getNotificationHistory(): Promise<string[]> {
    try {
      const content = await fs.readFile(this.logPath, "utf-8");
      return content.split("\n").filter(line => line.trim().length > 0);
    } catch {
      return [];
    }
  }

  /**
   * Clear notification log
   */
  public async clearNotificationLog(): Promise<boolean> {
    try {
      await fs.writeFile(this.logPath, "", "utf-8");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get notification statistics
   */
  public async getNotificationStats(): Promise<{
    totalLogged: number;
    lastNotification?: string;
    logFileSize: number;
  }> {
    try {
      const history = await this.getNotificationHistory();
      const stats = await fs.stat(this.logPath);

      return {
        totalLogged: history.length,
        lastNotification:
          history.length > 0 ? history[history.length - 1] : undefined,
        logFileSize: stats.size,
      };
    } catch {
      return {
        totalLogged: 0,
        logFileSize: 0,
      };
    }
  }
}

export default NotificationManager;
