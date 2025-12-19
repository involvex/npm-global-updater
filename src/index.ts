#!/usr/bin/env node
import {
  validatePackageManager,
  formatPackageManagerList,
} from "./utils/packageManager";

export async function run() {
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

  console.log("=".repeat(50));

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

    case "version":
    case "--version":
    case "-v":
      {
        const { showversion } = await import("./commands/version");
        showversion();
      }
      break;
    case "about": {
      const { showabout } = await import("./commands/about");
      showabout();
    }
  }

  function showHelp() {
    console.log(`
Usage: npm-updater [--pm <package-manager>] <command>

Package Managers:
  --pm npm                Use npm (default)
  --pm pnpm               Use pnpm
  --pm yarn               Use Yarn
  --pm bun                Use Bun

Commands:
  version(-v, --version)        Show npm-updater version
  ls                            List all global packages
  updateall                     Update all global packages
  update                        Update single global package
  help                          Show this help message
  latestversion                 Show latest version of a npm package
  about                         Show information about npm-updater

Options:
  --help, -h                    Show this help message
  --pm <package-manager>        Specify package manager (npm, pnpm, yarn, bun)
  --update, -u                  Update a package
  --version, -v                 Show npm-updater version

Examples:
  npm-updater ls                    # List packages using npm
  npm-updater --pm pnpm ls          # List packages using pnpm
  npm-updater --pm yarn updateall   # Update all packages using Yarn
  npm-updater update prettier       # Update prettier using npm (default)

For more information, visit: https://github.com/involvex/npm-global-updater
    `);
  }
}

run();
