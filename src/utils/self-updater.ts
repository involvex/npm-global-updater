import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { exec } from "child_process";
import { execSync } from "child_process";

let packagejson: { version: string };

try {
  const globalpath = execSync('cmd /c "where npm-updater.cmd"')
    .toString()
    .trim();
  const packageJsonPath = join(
    globalpath,
    "../node_modules",
    "@involvex/npm-global-updater",
    "package.json",
  );
  const packageJsonContent = readFileSync(packageJsonPath);
  packagejson = JSON.parse(packageJsonContent.toString());
} catch {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const packageJsonPath = join(__dirname, "..", "..", "package.json");
  const packageJsonContent = readFileSync(packageJsonPath);
  packagejson = JSON.parse(packageJsonContent.toString());
}

const npmpackage =
  "https://registry.npmjs.org/@involvex/npm-global-updater/latest";

async function getLatestVersion() {
  const response = await fetch(npmpackage);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const version = await response.json();
  //   console.log("Json response:", version as { version: string });
  const latestVersion = version as { version: string };
  // console.log("Latest version:", latestVersion?.version);
  return latestVersion?.version;
}
async function triggerupdate() {
  if (process.argv.includes("self-update")) {
    const latestVersion = await getLatestVersion();
    const currentVersion = packagejson.version;
    if (currentVersion < latestVersion) {
      console.log("Current version:", currentVersion);
      console.log("Latest version:", latestVersion);
      console.log("Do you want to update? (y/n)");
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", data => {
        const answer = data.toString().trim().toLowerCase();
        if (answer === "y") {
          exec(
            "npm install -g @involvex/npm-global-updater@latest",
            (error, stdout, stderr) => {
              if (error) {
                console.error(`Error updating npm-global-updater: ${error}`);
                return;
              }
              console.log(stdout);
              console.error(stderr);
              console.log(
                "npm-global-updater updated successfully. Please restart the application.",
              );
              process.exit(0);
            },
          );
        } else {
          console.log("Update cancelled.");
          process.exit(0);
        }
        process.stdin.pause(); // Pause stdin after handling the input
        return true;
      });
    } else {
      console.log("Current version:", currentVersion);
      console.log("No update available.");
      console.log(
        "Find out more at: " +
          "https://www.npmjs.com/package/@involvex/npm-global-updater?activeTab=versions",
      );
    }
  }
}

async function notifyupdate() {
  const latestVersion = await getLatestVersion();
  const currentVersion = packagejson.version;
  // console.log("Current version:", currentVersion);
  // console.log("Latest version:", latestVersion);
  if (currentVersion < latestVersion) {
    console.log("=".repeat(60));
    console.log(
      "\tA new version of npm-global-updater is available.\n",
      "\tPlease update by running:\n",
      "\tnpm install -g @involvex/npm-global-updater@latest\n",
      "\tor run:\n",
      "\tnpm-updater self-update\n",
    );
    console.log("=".repeat(60));
    if (process.argv.includes("self-update")) {
      triggerupdate();
    }
    console.log("Triggered update");
  }
}

export default notifyupdate;

if (process.argv.includes("self-update") && !process.argv.includes("y")) {
  triggerupdate();
}
