#!/usr/bin/env node
import {
  validatePackageManager,
  formatPackageManagerList,
} from "./utils/packageManager";

import { showlogo } from "./utils/logo";
import notifyupdate from "./utils/self-updater";
// import { exec } from "child_process";
// import "clear";
import consoleclear from "console-clear";

export async function run() {
  if (!process.argv.includes("self-update")) {
    notifyupdate();
  }
  const args = process.argv.slice(2);

  // Parse --pm flag
  let packageManager: string | undefined;
  let commandIndex = 0;

  // Check if --pm flag is present
  const pmIndex = args.indexOf("--pm");
  if (pmIndex !== -1) {
    packageManager = args[pmIndex + 1];
    if (!packageManager) {
      console.log("Error: --pm flag requires a value");
      console.log(`Supported package managers: ${formatPackageManagerList()}`);
      return;
    }

    // Validate package manager
    try {
      validatePackageManager(packageManager);
    } catch (error) {
      console.log(
        `Error: ${error instanceof Error ? error.message : "Invalid package manager"}`,
      );
      console.log(`Supported package managers: ${formatPackageManagerList()}`);
      return;
    }

    // Remove --pm and its value from args, adjust command index
    args.splice(pmIndex, 2);
    commandIndex = 0;
  }

  const command = args[commandIndex];

  console.log("=".repeat(60));

  // Show help if no command provided or if help explicitly requested
  if (!command || command === "--help" || command === "-h") {
    showHelp();
    return;
  }

  switch (command) {
    case "ls":
    case "list":
      {
        const { runls } = await import("./commands/ls");
        await runls(packageManager);
      }
      break;
    case "updateall":
      {
        const { runupdateall } = await import("./commands/updateall");
        await runupdateall(packageManager);
      }
      break;
    case "update":
    case "upgrade":
    case "--u":
    case "--update":
      {
        const { runupdate } = await import("./commands/update");
        const packageName = args[commandIndex + 1]; // args[0] = command, args[1] = packageName
        await runupdate(packageName, packageManager);
      }
      break;
    case "export-packages":
    case "export":
      {
        const { runExport } = await import("./commands/export");
        const format = args[commandIndex + 1] as "txt" | "json" | undefined;
        const output = args[commandIndex + 2];
        const includeTimestamps =
          args.includes("--timestamp") || args.includes("-t");
        const filterByPackageManager = args.includes("--pm")
          ? args[args.indexOf("--pm") + 1]
          : undefined;

        await runExport(
          format,
          output,
          undefined,
          filterByPackageManager,
          includeTimestamps,
        );
      }
      break;
    case "export-templates":
      {
        const { showExportTemplates } = await import("./commands/export");
        await showExportTemplates();
      }
      break;
    case "start-package-alerts":
    case "alerts":
      {
        const { startPackageAlerts } = await import("./commands/alerts");
        const intervalIndex = args.indexOf("--interval");
        const intervalValue =
          intervalIndex !== -1 && args[intervalIndex + 1]
            ? parseInt(args[intervalIndex + 1]!)
            : undefined;
        const intervalUnit =
          intervalIndex !== -1 && args[intervalIndex + 2]
            ? (args[intervalIndex + 2] as "minutes" | "hours" | "days")
            : undefined;
        const methods = args.includes("--method")
          ? [args[args.indexOf("--method") + 1] as "desktop" | "email" | "log"]
          : undefined;
        const silentMode = args.includes("--silent") || args.includes("-s");

        const interval =
          intervalValue && intervalUnit
            ? { value: intervalValue, unit: intervalUnit }
            : undefined;
        await startPackageAlerts(interval, methods, silentMode);
      }
      break;
    case "alerts-status":
      {
        const { checkAlertStatus } = await import("./commands/alerts");
        await checkAlertStatus();
      }
      break;
    case "alerts-stop":
      {
        const { stopPackageAlerts } = await import("./commands/alerts");
        await stopPackageAlerts();
      }
      break;
    case "alerts-summary":
      {
        const { getAlertSummary } = await import("./commands/alerts");
        const daysIndex = args.indexOf("--days");
        const days =
          daysIndex !== -1 && args[daysIndex + 1]
            ? parseInt(args[daysIndex + 1]!)
            : undefined;
        await getAlertSummary(days);
      }
      break;
    case "alerts-history":
      {
        const { showAlertHistory } = await import("./commands/alerts");
        const limitIndex = args.indexOf("--limit");
        const limit =
          limitIndex !== -1 && args[limitIndex + 1]
            ? parseInt(args[limitIndex + 1]!)
            : 10;
        await showAlertHistory(limit);
      }
      break;
    case "alerts-acknowledge":
      {
        const { acknowledgeAlert } = await import("./commands/alerts");
        const alertId = args[commandIndex + 1];
        if (!alertId) {
          console.log("Error: Alert ID is required");
          console.log("Usage: npm-updater alerts-acknowledge <alert-id>");
          return;
        }
        await acknowledgeAlert(alertId);
      }
      break;
    case "alerts-config":
      {
        const { configureAlerts } = await import("./commands/alerts");
        await configureAlerts();
      }
      break;
    case "help": {
      showHelp();
      break;
    }
    case "latestversion":
      {
        const { showlatestversion } = await import("./commands/latestversion");
        const packageName = args[commandIndex + 1];
        await showlatestversion(packageName, packageManager);
      }
      break;
    case "config":
    case "configure":
      {
        const { showmenu } = await import("./commands/config");
        await showmenu();
      }
      break;

    case "version":
    case "--version":
    case "-v":
      {
        const { showversion } = await import("./commands/version");
        showversion();
      }
      break;
    case "about":
      {
        const { showabout } = await import("./commands/about");
        showabout();
      }
      break;
    case "self-update":
      {
        await notifyupdate();
      }
      break;
    default:
      showHelp();
  }

  function showHelp() {
    consoleclear();
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
  config                        Show configuration menu


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
// await clearScreen();
consoleclear();
// setInterval(() => clear({ fullClear: true }), 1000);
run();
