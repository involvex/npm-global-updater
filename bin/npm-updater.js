#!/usr/bin/env node
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

// src/utils/packageManager.ts
function validatePackageManager(pm) {
  if (!SUPPORTED_PACKAGE_MANAGERS.includes(pm)) {
    throw new Error(`Unsupported package manager: ${pm}. Supported managers: ${SUPPORTED_PACKAGE_MANAGERS.join(", ")}`);
  }
  return pm;
}
function getPackageManager(pm) {
  return validatePackageManager(pm || "npm");
}
function getPackageManagerConfig(pm) {
  return PACKAGE_MANAGERS[pm];
}
function formatPackageManagerList() {
  return SUPPORTED_PACKAGE_MANAGERS.join(", ");
}
var PACKAGE_MANAGERS, SUPPORTED_PACKAGE_MANAGERS;
var init_packageManager = __esm(() => {
  PACKAGE_MANAGERS = {
    npm: {
      name: "npm",
      displayName: "npm",
      listCommand: "npm list -g",
      listJsonCommand: "npm ls -g --json",
      installCommand: (packageName, version) => `npm install -g ${version ? `${packageName}@${version}` : `${packageName}@latest`}`,
      viewCommand: (packageName, version) => `npm view ${packageName}${version ? `@${version}` : ""} version`
    },
    pnpm: {
      name: "pnpm",
      displayName: "pnpm",
      listCommand: "pnpm list -g",
      listJsonCommand: "pnpm list -g --json",
      installCommand: (packageName, version) => `pnpm add -g ${version ? `${packageName}@${version}` : `${packageName}@latest`}`,
      viewCommand: (packageName, version) => `pnpm view ${packageName}${version ? `@${version}` : ""} version`
    },
    yarn: {
      name: "yarn",
      displayName: "Yarn",
      listCommand: "yarn global list",
      listJsonCommand: "yarn global list --json",
      installCommand: (packageName, version) => `yarn global add ${version ? `${packageName}@${version}` : `${packageName}@latest`}`,
      viewCommand: (packageName, version) => `yarn info ${packageName}${version ? `@${version}` : ""} version`
    },
    bun: {
      name: "bun",
      displayName: "Bun",
      listCommand: "bun list -g",
      listJsonCommand: "bun list -g --json",
      installCommand: (packageName, version) => `bun add -g ${version ? `${packageName}@${version}` : `${packageName}@latest`}`,
      viewCommand: (packageName, version) => `bun info ${packageName}${version ? `@${version}` : ""} version`
    }
  };
  SUPPORTED_PACKAGE_MANAGERS = [
    "npm",
    "pnpm",
    "yarn",
    "bun"
  ];
});

// src/commands/ls.ts
var exports_ls = {};
__export(exports_ls, {
  runls: () => runls
});
import { exec } from "child_process";
async function runls(packageManager) {
  const pm = getPackageManager(packageManager);
  const config = getPackageManagerConfig(pm);
  console.log(`Listing global packages using ${config.displayName}...`);
  exec(config.listCommand, (error, stdout, stderr) => {
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
var init_ls = __esm(() => {
  init_packageManager();
});

// src/commands/updateall.ts
var exports_updateall = {};
__export(exports_updateall, {
  runupdateall: () => runupdateall,
  default: () => updateall_default
});
import { exec as exec2 } from "child_process";
async function runupdateall(packageManager) {
  const pm = getPackageManager(packageManager);
  const config = getPackageManagerConfig(pm);
  console.log(`Checking for globally installed packages using ${config.displayName}...`);
  console.log(`This may take a moment...
`);
  exec2(config.listJsonCommand, (error, stdout) => {
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
        const command = config.viewCommand(pkg.name);
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
                  const specCommand = config.viewCommand(pkg.name, specType);
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
                console.log(`Updating ${pkgToUpdate.name} to ${pkgToUpdate.latest} using ${config.displayName}...`);
                const updateCommand = config.installCommand(pkgToUpdate.name, pkgToUpdate.latest);
                exec2(updateCommand, (updateError) => {
                  if (updateError) {
                    console.log(`❌ Failed to update ${pkgToUpdate.name}: ${updateError.message}`);
                  } else {
                    console.log(`✅ ${pkgToUpdate.name} updated successfully using ${config.displayName}!`);
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
      console.log(`Error parsing ${config.displayName} output: ${parseError}`);
    }
  });
}
var updateall_default;
var init_updateall = __esm(() => {
  init_packageManager();
  updateall_default = runupdateall;
});

// src/commands/update.ts
var exports_update = {};
__export(exports_update, {
  runupdate: () => runupdate,
  default: () => update_default
});
import { exec as exec3 } from "child_process";
async function runupdate(inputPackageName, packageManager) {
  const name = inputPackageName || process.argv[3];
  if (!name) {
    console.log("Error: Please provide a package name.");
    console.log("Usage: npm-updater [--pm <package-manager>] update <package-name>[@version]");
    console.log("Examples:");
    console.log("  npm-updater update react");
    console.log("  npm-updater update @google/gemini-cli@nightly");
    console.log("  npm-updater update typescript@5.0.0");
    return;
  }
  const versionMatch = name.match(/^(.+?)(@.+)$/);
  let packageName;
  let version;
  if (versionMatch && versionMatch[1] && versionMatch[2]) {
    packageName = versionMatch[1];
    version = versionMatch[2].substring(1);
    console.log(`Package: ${packageName}, Version: ${version}`);
  } else {
    packageName = name;
  }
  const pm = getPackageManager(packageManager);
  const config = getPackageManagerConfig(pm);
  const versionInfo = version ? ` to version ${version}` : " to latest version";
  console.log(`Updating ${packageName}${versionInfo} using ${config.displayName}...`);
  const installCommand = config.installCommand(packageName, version);
  exec3(installCommand, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(stdout);
    console.log(`${packageName} has been updated successfully using ${config.displayName}!`);
  });
}
var update_default;
var init_update = __esm(() => {
  init_packageManager();
  update_default = runupdate;
});

// src/commands/latestversion.ts
var exports_latestversion = {};
__export(exports_latestversion, {
  showlatestversion: () => showlatestversion
});
import { exec as exec4 } from "child_process";
async function showlatestversion(packageName, packageManager) {
  const name = packageName || process.argv[3];
  if (!name) {
    console.log("Error: Please provide a package name.");
    console.log("Usage: npm-updater [--pm <package-manager>] latestversion <package-name>");
    return;
  }
  const pm = getPackageManager(packageManager);
  const config = getPackageManagerConfig(pm);
  console.log(`Fetching latest version of ${name} using ${config.displayName}...`);
  const viewCommand = config.viewCommand(name);
  exec4(viewCommand, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`Latest version of ${name}: ${stdout.trim()}`);
  });
}
var init_latestversion = __esm(() => {
  init_packageManager();
});

// package.json
var package_default;
var init_package = __esm(() => {
  package_default = {
    name: "@involvex/npm-global-updater",
    version: "0.0.14",
    description: "global npm package updater",
    license: "MIT",
    author: "involvex",
    main: "bin/npm-updater.js",
    type: "module",
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
      build: "bun build src/index.ts  --target node --outfile bin/npm-updater.js",
      prebuild: "bun run format && bun run lint:fix && bun run typecheck",
      typecheck: "tsc --noEmit",
      "build:portable": "bun build --compile src/index.ts --outfile bin/npm-updater.exe --compile-autoload-package-json --compile-autoload-tsconfig",
      prepublish: "bun run build",
      changelog: "changelogen --output CHANGELOG.md ",
      release: "bun run scripts/release.ts"
    },
    devDependencies: {
      "@eslint/js": "^9.39.2",
      "@eslint/json": "^0.14.0",
      "@types/bun": "^1.3.5",
      changelogen: "^0.6.2",
      eslint: "^9.39.2",
      globals: "^16.5.0",
      prettier: "^3.7.4",
      "typescript-eslint": "^8.50.0"
    },
    peerDependencies: {
      typescript: "^5.9.3"
    },
    dependencies: {
      jiti: "^2.6.1"
    },
    files: [
      "src/**",
      "./",
      ".",
      "package.json"
    ]
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
init_packageManager();
async function run() {
  const args = process.argv.slice(2);
  let packageManager;
  let commandIndex = 0;
  const pmIndex = args.indexOf("--pm");
  if (pmIndex !== -1) {
    packageManager = args[pmIndex + 1];
    if (!packageManager) {
      console.log("Error: --pm flag requires a value");
      console.log(`Supported package managers: ${formatPackageManagerList()}`);
      return;
    }
    try {
      validatePackageManager(packageManager);
    } catch (error) {
      console.log(`Error: ${error instanceof Error ? error.message : "Invalid package manager"}`);
      console.log(`Supported package managers: ${formatPackageManagerList()}`);
      return;
    }
    args.splice(pmIndex, 2);
    commandIndex = 0;
  }
  const command = args[commandIndex];
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
        await runls2(packageManager);
      }
      break;
    case "updateall":
      {
        const { runupdateall: runupdateall2 } = await Promise.resolve().then(() => (init_updateall(), exports_updateall));
        await runupdateall2(packageManager);
      }
      break;
    case "update":
    case "upgrade":
    case "--u":
    case "--update":
      {
        const { runupdate: runupdate2 } = await Promise.resolve().then(() => (init_update(), exports_update));
        const packageName = args[commandIndex + 1];
        await runupdate2(packageName, packageManager);
      }
      break;
    case "help": {
      showHelp();
      break;
    }
    case "latestversion":
      {
        const { showlatestversion: showlatestversion2 } = await Promise.resolve().then(() => (init_latestversion(), exports_latestversion));
        const packageName = args[commandIndex + 1];
        await showlatestversion2(packageName, packageManager);
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
export {
  run
};
