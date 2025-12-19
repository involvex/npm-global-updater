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

// src/commands/ls.ts
var exports_ls = {};
__export(exports_ls, {
  runls: () => runls
});
import { exec } from "child_process";
async function runls() {
  exec("npm list -g", (error, stdout, stderr) => {
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
var init_ls = () => {};

// src/commands/updateall.ts
var exports_updateall = {};
__export(exports_updateall, {
  runupdateall: () => runupdateall,
  default: () => updateall_default
});
import { exec as exec2 } from "child_process";
async function runupdateall() {
  console.log("Checking for globally installed npm packages...");
  console.log(`This may take a moment...
`);
  exec2("npm ls -g --json", (error, stdout) => {
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
        const command = `npm view ${pkg.name} version --json`;
        exec2(command, (viewError, viewStdout) => {
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
                  const specCommand = `npm view ${pkg.name}@${specType} version --json`;
                  exec2(specCommand, (specError, specStdout) => {
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
                console.log(`Updating ${pkgToUpdate.name} to ${pkgToUpdate.latest}...`);
                const updateCommand = `npm install -g ${pkgToUpdate.name}@${pkgToUpdate.latest}`;
                exec2(updateCommand, (updateError) => {
                  if (updateError) {
                    console.log(`❌ Failed to update ${pkgToUpdate.name}: ${updateError.message}`);
                  } else {
                    console.log(`✅ ${pkgToUpdate.name} updated successfully!`);
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
      console.log(`Error parsing npm output: ${parseError}`);
    }
  });
}
var updateall_default;
var init_updateall = __esm(() => {
  updateall_default = runupdateall;
});

// src/commands/update.ts
var exports_update = {};
__export(exports_update, {
  runupdate: () => runupdate,
  default: () => update_default
});
import { exec as exec3 } from "child_process";
async function runupdate(packageName) {
  const name = packageName || process.argv[3];
  if (!name) {
    console.log("Error: Please provide a package name.");
    console.log("Usage: npm-updater update <package-name>");
    return;
  }
  console.log(`Updating ${name}...`);
  exec3(`npm install -g ${name}@latest`, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(stdout);
    console.log(`${name} has been updated successfully!`);
  });
}
var update_default;
var init_update = __esm(() => {
  update_default = runupdate;
});

// src/commands/latestversion.ts
var exports_latestversion = {};
__export(exports_latestversion, {
  showlatestversion: () => showlatestversion
});
import { exec as exec4 } from "child_process";
async function showlatestversion(packageName) {
  const name = packageName || process.argv[3];
  if (!name) {
    console.log("Error: Please provide a package name.");
    console.log("Usage: npm-updater latestversion <package-name>");
    return;
  }
  console.log(`Fetching latest version of ${name}...`);
  exec4(`npm view ${name} version`, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`Latest version of ${name}: ${stdout}`);
  });
}
var init_latestversion = () => {};

// package.json
var package_default;
var init_package = __esm(() => {
  package_default = {
    name: "@involvex/npm-global-updater",
    version: "0.0.1",
    description: "global npm package updater",
    license: "MIT",
    author: "involvex",
    main: "src/index.js",
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
      start: "bun bin/npm-updater.js",
      build: "bun build src/index.ts --target node --outfile bin/npm-updater.js",
      prebuild: "bun run format && bun run lint:fix && bun run typecheck",
      typecheck: "tsc --noEmit"
    },
    devDependencies: {
      "@eslint/js": "^9.39.2",
      "@eslint/json": "^0.14.0",
      "@types/bun": "latest",
      eslint: "^9.39.2",
      globals: "^16.5.0",
      prettier: "^3.7.4",
      "typescript-eslint": "^8.50.0"
    },
    peerDependencies: {
      typescript: "^5"
    },
    dependencies: {
      jiti: "^2.6.1"
    }
  };
});

// src/commands/version.ts
var exports_version = {};
__export(exports_version, {
  showversion: () => showversion
});
function showversion() {
  console.log(`Version: ` + package_default.version);
}
var init_version = __esm(() => {
  init_package();
});

// src/commands/about.ts
var exports_about = {};
__export(exports_about, {
  showabout: () => showabout
});
async function showabout() {
  console.log("==================================================");
  console.log("=== About this app ===");
  console.log("Name: " + package_default.name);
  console.log("==================================================");
  console.log("Repository: " + package_default.repository.url);
  console.log("==================================================");
  console.log("Description: " + package_default.description);
  console.log("==================================================");
  console.log("Version: " + package_default.version);
  console.log("==================================================");
  console.log("Author: " + package_default.author);
  console.log("==================================================");
}
var init_about = __esm(() => {
  init_package();
});

// src/index.ts
async function run() {
  const args = process.argv.slice(2);
  const command = args[0];
  console.log("=".repeat(50));
  if (!command || command === "--help" || command === "-h") {
    showHelp();
    return;
  }
  switch (command) {
    case "ls":
    case "list":
      {
        const { runls: runls2 } = await Promise.resolve().then(() => (init_ls(), exports_ls));
        await runls2();
      }
      break;
    case "updateall":
      {
        const { runupdateall: runupdateall2 } = await Promise.resolve().then(() => (init_updateall(), exports_updateall));
        await runupdateall2();
      }
      break;
    case "update":
    case "upgrade":
    case "--u":
    case "--update":
      {
        const { runupdate: runupdate2 } = await Promise.resolve().then(() => (init_update(), exports_update));
        const packageName = args[1];
        await runupdate2(packageName);
      }
      break;
    case "help": {
      showHelp();
      break;
    }
    case "latestversion":
      {
        const { showlatestversion: showlatestversion2 } = await Promise.resolve().then(() => (init_latestversion(), exports_latestversion));
        const packageName = args[1];
        await showlatestversion2(packageName);
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
    case "about": {
      const { showabout: showabout2 } = await Promise.resolve().then(() => (init_about(), exports_about));
      showabout2();
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
export {
  run
};
