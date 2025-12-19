import { AlertSystem, type AlertSummary } from "../monitoring/alertSystem";
import { ConfigManager } from "../config/configManager";

export async function startPackageAlerts(
  interval?: { value: number; unit: "minutes" | "hours" | "days" },
  methods?: ("desktop" | "email" | "log")[],
  silentMode?: boolean,
): Promise<void> {
  const alertSystem = new AlertSystem();

  try {
    await alertSystem.initialize();

    const customConfig = {
      interval: interval,
      methods: methods,
      silentMode: silentMode,
    };

    console.log("🔔 Starting package monitoring and alerts...");

    const result = await alertSystem.startMonitoring(customConfig);

    if (result.success) {
      console.log("✅ Package monitoring started successfully!");
      console.log(`📋 ${result.message}`);

      const status = alertSystem.getMonitoringStatus();
      console.log(`⏰ Status: ${status.isActive ? "Active" : "Inactive"}`);
      console.log(`🔄 Check interval: ${status.interval}`);

      console.log("\n📝 Available commands:");
      console.log("  npm-updater alerts status    - Check monitoring status");
      console.log("  npm-updater alerts stop      - Stop monitoring");
      console.log("  npm-updater alerts summary   - Get alert summary");
      console.log("  npm-updater alerts history   - View recent alerts");
    } else {
      console.log("❌ Failed to start monitoring:", result.message);
    }
  } catch (error) {
    console.log(
      "❌ Alert system error:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}

export async function stopPackageAlerts(): Promise<void> {
  const alertSystem = new AlertSystem();

  try {
    await alertSystem.initialize();

    const result = alertSystem.stopMonitoring();

    if (result.success) {
      console.log("✅ Package monitoring stopped successfully!");
      console.log("🔕 No further alerts will be generated.");
    } else {
      console.log("❌ Failed to stop monitoring:", result.message);
    }
  } catch (error) {
    console.log(
      "❌ Alert system error:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}

export async function checkAlertStatus(): Promise<void> {
  const alertSystem = new AlertSystem();

  try {
    await alertSystem.initialize();

    const status = alertSystem.getMonitoringStatus();

    console.log("🔔 Package Monitoring Status:");
    console.log("=".repeat(40));
    console.log(`Status: ${status.isActive ? "🟢 Active" : "🔴 Inactive"}`);
    console.log(`Check Interval: ${status.interval}`);

    if (status.isActive) {
      console.log("\n📋 System is actively monitoring for:");
      console.log("  📦 Outdated packages");
      console.log("  🔒 Security vulnerabilities");
      console.log("  ⚠️ Deprecated packages");
    }
  } catch (error) {
    console.log(
      "❌ Status check error:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}

export async function getAlertSummary(days?: number): Promise<void> {
  const alertSystem = new AlertSystem();

  try {
    await alertSystem.initialize();

    const summary: AlertSummary = await alertSystem.getAlertSummary(days);

    console.log("📊 Alert Summary:");
    console.log("=".repeat(40));
    console.log(`Total Alerts: ${summary.totalAlerts}`);
    console.log(`Outdated Packages: ${summary.outdated}`);
    console.log(`Security Issues: ${summary.security}`);
    console.log(`Deprecated Packages: ${summary.deprecated}`);
    console.log(`Last Check: ${summary.lastCheck.toLocaleString()}`);

    if (Object.keys(summary.bySeverity).length > 0) {
      console.log("\n🔍 By Severity:");
      for (const [severity, count] of Object.entries(summary.bySeverity)) {
        console.log(`  ${severity}: ${count}`);
      }
    }
  } catch (error) {
    console.log(
      "❌ Summary error:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}

export async function showAlertHistory(limit = 10): Promise<void> {
  const alertSystem = new AlertSystem();

  try {
    await alertSystem.initialize();

    const alerts = await alertSystem.getRecentAlerts(limit);

    console.log("📜 Recent Alert History:");
    console.log("=".repeat(50));

    if (alerts.length === 0) {
      console.log("No alerts found.");
      return;
    }

    for (const alert of alerts) {
      const emoji = getAlertEmoji(alert.type);
      const timestamp = new Date(alert.timestamp).toLocaleString();

      console.log(`${emoji} ${alert.packageName} (${alert.packageManager})`);
      console.log(`   ${alert.message}`);
      console.log(`   📅 ${timestamp}`);
      console.log(`   🏷️  Type: ${alert.type}`);
      if (alert.acknowledged) {
        console.log(`   ✅ Acknowledged`);
      }
      console.log("");
    }
  } catch (error) {
    console.log(
      "❌ History error:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}

export async function acknowledgeAlert(alertId: string): Promise<void> {
  const alertSystem = new AlertSystem();

  try {
    await alertSystem.initialize();

    const success = await alertSystem.acknowledgeAlert(alertId);

    if (success) {
      console.log(`✅ Alert ${alertId} acknowledged successfully!`);
    } else {
      console.log(`❌ Failed to acknowledge alert ${alertId}`);
    }
  } catch (error) {
    console.log(
      "❌ Acknowledge error:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}

export async function configureAlerts(): Promise<void> {
  const configManager = ConfigManager.getInstance();

  try {
    await configManager.initialize();

    const config = configManager.getConfig();

    console.log("⚙️ Alert Configuration:");
    console.log("=".repeat(40));
    console.log(`Enabled: ${config.alerts.enabled ? "Yes" : "No"}`);
    console.log(
      `Interval: ${config.alerts.interval.value} ${config.alerts.interval.unit}`,
    );
    console.log(`Methods: ${config.alerts.methods.join(", ")}`);
    console.log(`Silent Mode: ${config.alerts.silentMode ? "Yes" : "No"}`);

    if (config.alerts.quietHours) {
      console.log(
        `Quiet Hours: ${config.alerts.quietHours.start} - ${config.alerts.quietHours.end}`,
      );
    }

    console.log("\n📝 To configure alerts, edit the configuration file:");
    console.log(`${configManager.getDataPath()}/config.json`);
  } catch (error) {
    console.log(
      "❌ Configuration error:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}

function getAlertEmoji(alertType: string): string {
  const emojis: Record<string, string> = {
    outdated: "📦",
    security: "🔒",
    deprecated: "⚠️",
    vulnerable: "🚨",
  };

  return emojis[alertType] || "📢";
}

export default startPackageAlerts;
