export async function run() {
  const args = process.argv.slice(2);
  const command = args[0];

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
        await runls();
      }
      break;
    case "updateall":
      {
        const { runupdateall } = await import("./commands/updateall");
        await runupdateall();
      }
      break;
    case "update":
    case "upgrade":
    case "--u":
    case "--update":
      {
        const { runupdate } = await import("./commands/update");
        const packageName = args[1]; // args[0] = command, args[1] = packageName
        await runupdate(packageName);
      }
      break;
    case "help": {
      showHelp();
      break;
    }
    case "latestversion":
      {
        const { showlatestversion } = await import("./commands/latestversion");
        const packageName = args[1];
        await showlatestversion(packageName);
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
Usage: npm-updater <command>

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
  --update, -u                  Update a package
  --version, -v                 Show npm-updater version


For more information, visit: https://github.com/involvex/npm-global-updater
      `);
  }
}

run();
