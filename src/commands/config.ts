#!/usr/bin/env node
import ConfigManager from "../config/configManager.ts";
import { exec } from "child_process";
import "../config/configManager";
import consoleClear from "console-clear";
import { showlogo } from "src/utils/logo.ts";
// import { stdin } from 'bun';
const configManager = ConfigManager.getInstance(); // Initialize the singleton
await configManager.initialize(); // Get the singleton instance
const config = configManager.getConfig();
export async function showconfiguration() {
  consoleClear();
  console.log("Showing configuration...");
  console.log("Type 'generalconfig' (1) to show general config.");
  console.log(
    "Type 'packagemanagerconfig' (2) to show package manager config.",
  );
  console.log("Type 'alertconfig' (3) to show alert config.");
  console.log("Type 'backupconfig' (4) to show backup config.");
  console.log("Type 'back' (9) to go back to the main menu.");
  console.log("Type 'help' (?) to show the available commands.");
  console.log("Type 'exit' (0) or press ctrl+c to quit.");
  await process.stdin.on("data", chunk => {
    switch (chunk.toString().trim()) {
      case "generalconfig":
      case "1":
        showgeneralconfig();
        break;
      case "packagemanagerconfig":
      case "2":
        showpackagemanagerconfig();
        break;
      case "alertconfig":
      case "3":
        showalertconfig();
        break;
      case "backupconfig":
      case "4":
        showbackupconfig();
        break;
      case "help":
      case "?":
        showconfigurationhelp();
        break;
      case "back":
      case "9":
        showmenu();
        break;
      case "exit":
        process.exit(0);
        break;
      default:
        console.log("Type 'exit' or press ctrl+c to quit.");
    }

    function showconfigurationhelp() {
      consoleClear();
      console.log("Showing configuration...");
      console.log("Type 'generalconfig' (1) to show general config.");
      console.log(
        "Type 'packagemanagerconfig' (2) to show package manager config.",
      );
      console.log("Type 'alertconfig' (3) to show alert config.");
      console.log("Type 'backupconfig' (4) to show backup config.");
      console.log("Type 'help' (?) to show the available commands.");
      console.log("Type 'exit' (0) or press ctrl+c to quit.");
      console.log("Type 'back' (9) to go back to the main menu.");
    }
  });
}

export async function showgeneralconfig() {
  console.log("Showing general config...");
  console.log(`  Log Level: ${config.general.logLevel}`);
  console.log(`  Auto Backup: ${config.general.autoBackup}`);
  console.log(
    `  Max Concurrent Updates: ${config.general.maxConcurrentUpdates}`,
  );
}

export async function showpackagemanagerconfig() {
  console.log("Showing package manager config...");
  console.log(`  Default Package Manager: ${config.packageManagers.default}`);
  console.log(
    `  Enabled Package Managers: ${config.packageManagers.enabled.join(", ")}`,
  );
}

export async function showalertconfig() {
  console.log("Showing alert config...");
  console.log(`  Enabled: ${config.alerts.enabled}`);
  console.log(
    `  Interval: ${config.alerts.interval.value} ${config.alerts.interval.unit}`,
  );
  console.log(`  Methods: ${config.alerts.methods.join(", ")}`);
  console.log(
    `  Email: ${config.alerts.email ? "Configured" : "Not Configured"}`,
  );
  console.log(
    `  Quiet Hours: ${config.alerts.quietHours ? "Configured" : "Not Configured"}`,
  );
  console.log(`  Silent Mode: ${config.alerts.silentMode}`);
}
export async function showbackupconfig() {
  console.log("Showing backup config...");
  console.log(`  Enabled: ${config.backups.enabled}`);
  console.log(
    `  Interval: ${config.backups.interval.value} ${config.backups.interval.unit}`,
  );
  console.log(`  Retention: ${config.backups.retentionDays} days`);
  console.log(`  Location: ${config.backups.location}`);
}
export async function updategeneralconfig() {
  console.log("Updating general config...");
  console.log("Type 'exit' or press ctrl+c to quit.");
  await process.stdin.on("data", async chunk => {
    switch (chunk.toString().trim()) {
      case "loglevel":
        console.log(
          "Type the new log level (debug, info, warn, error, fatal):",
        );
        await process.stdin.on("data", chunk => {
          switch (chunk.toString().trim()) {
            case "debug":
              config.general.logLevel = "debug";
              break;
            case "info":
              config.general.logLevel = "info";
              break;
            case "warn":
              config.general.logLevel = "warn";
              break;
            case "error":
              config.general.logLevel = "error";
              console.log(`Log level updated to ${config.general.logLevel}`);
              break;
            default:
              console.log("Invalid log level.");
              break;
          }
        });
        break;
      case "autobackup":
        console.log("Type 'true' or 'false' to enable or disable auto backup:");
        await process.stdin.on("data", chunk => {
          switch (chunk.toString().trim()) {
            case "true":
            case "false":
              config.general.autoBackup = chunk.toString().trim() === "true";
              console.log(
                `Auto backup updated to ${config.general.autoBackup}`,
              );
              break;
            default:
              console.log("Invalid input. Type 'true' or 'false'.");
              break;
          }
        });
        break;
      case "maxconcurrentupdates":
        console.log("Type the new max concurrent updates:");
        await process.stdin.on("data", chunk => {
          const maxConcurrentUpdates = parseInt(chunk.toString().trim());
          if (isNaN(maxConcurrentUpdates)) {
            console.log("Invalid input. Type a number.");
          } else {
            config.general.maxConcurrentUpdates = maxConcurrentUpdates;
            console.log(
              `Max concurrent updates updated to ${config.general.maxConcurrentUpdates}`,
            );
          }
        });
        break;
      case "exit":
        process.exit(0);
        break;
      default:
        console.log("Type 'exit' or press ctrl+c to quit.");
        console.log("Type 'loglevel' to update the log level.");
        console.log("Type 'autobackup' to update the auto backup setting.");
        console.log(
          "Type 'maxconcurrentupdates' to update the max concurrent updates.",
        );
        break;
    }
  });
}
export async function updatepackagemanagerconfig() {
  console.log("Updating package manager config...");
  console.log("Type 'exit' or press ctrl+c to quit.");
  await process.stdin.on("data", async chunk => {
    switch (chunk.toString().trim()) {
      case "default":
        console.log("Type the new default package manager:");
        await process.stdin.on("data", chunk => {
          const defaultPackageManager = chunk.toString().trim();
          if (
            config.packageManagers.enabled.includes(defaultPackageManager) ||
            defaultPackageManager === "" ||
            defaultPackageManager === "npm" ||
            defaultPackageManager === "pnpm" ||
            defaultPackageManager === "yarn" ||
            defaultPackageManager === "bun"
          ) {
            if (defaultPackageManager === "") {
              defaultPackageManager.trim();
            } else if (defaultPackageManager === "npm") {
              config.packageManagers.default = "npm";
            } else if (defaultPackageManager === "pnpm") {
              config.packageManagers.default = "pnpm";
            } else if (defaultPackageManager === "yarn") {
              config.packageManagers.default = "yarn";
            } else if (defaultPackageManager === "bun") {
              config.packageManagers.default = "bun";
            } else {
              console.error("Invalid package manager.");
            }
            // config.packageManagers.default = defaultPackageManager; // This line is redundant
            console.log(
              `Default package manager updated to ${config.packageManagers.default}`,
            );
          } else {
            console.log("Invalid package manager.");
          }
        });
        break;
      case "enabled":
        console.log("Type the new enabled package managers (comma separated):");
        await process.stdin.on("data", chunk => {
          const enabledPackageManagers = chunk.toString().trim().split(",");
          if (
            enabledPackageManagers.every((pm: string) =>
              config.packageManagers.enabled.includes(pm.trim()),
            )
          ) {
            config.packageManagers.enabled = enabledPackageManagers.map(
              (pm: string) => pm.trim(),
            );
            console.log(
              `Enabled package managers updated to ${config.packageManagers.enabled.join(", ")}`,
            );
          } else {
            console.log("Invalid package managers.");
          }
        });
        break;
      case "exit":
        process.exit(0);
        break;
      default:
        console.log("Type 'exit' or press ctrl+c to quit.");
        console.log("Type 'default' to update the default package manager.");
        console.log("Type 'enabled' to update the enabled package managers.");
        break;
    }
  });
}
export async function updatealertconfig() {
  console.log("Updating alert config...");
  console.log("Type 'exit' or press ctrl+c to quit.");
  await process.stdin.on("data", async chunk => {
    switch (chunk.toString().trim()) {
      case "exit":
        process.exit(0);
        break;
      case "enabled":
        console.log("Type 'true' or 'false' to enable or disable alerts:");
        await process.stdin.on("data", chunk => {
          switch (chunk.toString().trim()) {
            case "true":
            case "false":
              config.alerts.enabled = chunk.toString().trim() === "true";
              console.log(`Alerts enabled updated to ${config.alerts.enabled}`);
              break;
            default:
              console.log("Invalid input. Type 'true' or 'false'.");
              break;
          }
        });
        break;
      case "interval":
        console.log("Type the new alert interval value (e.g., '5'):");
        await process.stdin.on("data", async chunk => {
          const value = parseInt(chunk.toString().trim());
          if (isNaN(value) || value <= 0) {
            console.log("Invalid input. Type a positive number.");
            return;
          }
          console.log(
            "Type the new alert interval unit (minutes, hours, days):",
          );
          await process.stdin.on("data", chunk => {
            const unit = chunk.toString().trim();
            if (["minutes", "hours", "days"].includes(unit)) {
              config.alerts.interval.value = value;
              config.alerts.interval.unit = unit as
                | "minutes"
                | "hours"
                | "days";
              console.log(
                `Alert interval updated to ${config.alerts.interval.value} ${config.alerts.interval.unit}`,
              );
            } else {
              console.log("Invalid unit. Type 'minutes', 'hours', or 'days'.");
            }
          });
        });
        break;
      case "methods":
        console.log(
          "Type the new alert methods (comma separated: email, console):",
        );
        await process.stdin.on("data", chunk => {
          const methods = chunk
            .toString()
            .trim()
            .split(",")
            .map(m => m.trim());
          if (
            methods.every(m => ["email", "console"].includes(m)) &&
            methods.length > 0 &&
            methods.length <= 2 &&
            new Set(methods).size === methods.length &&
            methods.every(m => m.length > 0)
          ) {
            config.alerts.methods = methods as ("email" | "desktop" | "log")[];
            console.log(
              `Alert methods updated to ${config.alerts.methods.join(", ")}`,
            );
          } else {
            console.log(
              "Invalid methods. Type 'email', 'console', or both separated by a comma.",
            );
          }
        });
        break;
      default:
        console.log("Type 'exit' or press ctrl+c to quit.");
        console.log("Type 'enabled' to update the alerts enabled setting.");
        console.log("Type 'interval' to update the alerts interval setting.");
        console.log("Type 'methods' to update the alerts methods setting.");
        break;
    }
  });
}
export async function updatebackupconfig() {
  console.log("Updating backup config...");
  console.log("Type 'exit' or press ctrl+c to quit.");
  await process.stdin.on("data", async chunk => {
    switch (chunk.toString().trim()) {
      case "exit":
        process.exit(0);
        break;
      case "enabled":
        console.log("Type 'true' or 'false' to enable or disable backups:");
        await process.stdin.on("data", chunk => {
          switch (chunk.toString().trim()) {
            case "true":
            case "false":
              config.backups.enabled = chunk.toString().trim() === "true";
              console.log(
                `Backups enabled updated to ${config.backups.enabled}`,
              );
              break;
            default:
              console.log("Invalid input. Type 'true' or 'false'.");
              break;
          }
        });
        break;
      case "interval":
        console.log("Type the new backup interval value (e.g., '5'):");
        await process.stdin.on("data", async chunk => {
          const value = parseInt(chunk.toString().trim());
          if (isNaN(value) || value <= 0) {
            console.log("Invalid input. Type a positive number.");
            return;
          }
          console.log(
            "Type the new backup interval unit (minutes, hours, days):",
          );
          await process.stdin.on("data", chunk => {
            const unit = chunk.toString().trim();
            if (["minutes", "hours", "days"].includes(unit)) {
              config.backups.interval.value = value;
              config.backups.interval.unit = unit as
                | "minutes"
                | "hours"
                | "days";
              console.log(
                `Backup interval updated to ${config.backups.interval.value} ${config.backups.interval.unit}`,
              );
            } else {
              console.log("Invalid unit. Type 'minutes', 'hours', or 'days'.");
            }
          });
        });
        break;
      case "retention":
        console.log("Type the new backup retention in days (e.g., '30'):");
        await process.stdin.on("data", chunk => {
          const retentionDays = parseInt(chunk.toString().trim());
          if (isNaN(retentionDays) || retentionDays <= 0) {
            console.log("Invalid input. Type a positive number.");
          } else {
            config.backups.retentionDays = retentionDays;
            console.log(
              `Backup retention updated to ${config.backups.retentionDays} days`,
            );
          }
        });
        break;
      case "location":
        console.log("Type the new backup location:");
        await process.stdin.on("data", chunk => {
          const location = chunk.toString().trim();
          config.backups.location = location;
          console.log(`Backup location updated to ${config.backups.location}`);
        });
        break;
      default:
        exec("clear");
        showhelp();

        break;
    }
  });
}

export async function showmenu() {
  consoleClear();
  showlogo();
  showhelp();
  await process.stdin.on("data", chunk => {
    switch (chunk.toString().trim()) {
      case "showconfig":
      case "1":
        showconfiguration();
        break;
      case "update generalconfig":
      case "2":
        updategeneralconfig();
        break;
      case "update packagemanagerconfig":
      case "3":
        updatepackagemanagerconfig();
        break;
      case "update alertconfig":
      case "4":
        updatealertconfig();
        break;
      case "update backupconfig":
      case "5":
        updatebackupconfig();
        break;
      case "exit":
      case "0":
        console.log("Exiting...");
        process.exit(0);
        break;
      case "help":
      case "?":
        showhelp();
        break;
      default:
        consoleClear();
        showhelp();
        break;
    }
  });
  //   console.log("Type 'help' (?) to show the available commands.");
}

export async function showhelp() {
  console.log("Type 'showconfig' (1) to show the current configuration.");
  console.log(
    "Type 'update generalconfig' (2) to update the general configuration.",
  );
  console.log(
    "Type 'update packagemanagerconfig' (3) to update the package manager configuration.",
  );
  console.log(
    "Type 'update alertconfig' (4) to update the alert configuration.",
  );
  console.log(
    "Type 'update backupconfig' (5) to update the backup configuration.",
  );
  console.log("Type 'exit' (0) or press ctrl+c to quit.");
  console.log("Type 'help' (?) to show the available commands.");
}
//
