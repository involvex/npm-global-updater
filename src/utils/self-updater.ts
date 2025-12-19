import { exec, execSync } from "child_process";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

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

async function getLatestVersion(): Promise<string> {
  try {
    const response = await fetch(npmpackage);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const version = await response.json();
    return (version as { version: string })?.version;
  } catch (error) {
    console.error("Failed to fetch latest version:", error);
    throw error;
  }
}

async function performUpdate(
  latestVersion: string,
  currentVersion: string,
): Promise<void> {
  console.log("Current version:", currentVersion);
  console.log("Latest version:", latestVersion);
  console.log("Do you want to update? (y/n)");

  // Check if stdin is a TTY (interactive terminal)
  if (process.stdin.isTTY) {
    process.stdin.setEncoding("utf8");

    const handleInput = (data: Buffer) => {
      const answer = data.toString().trim().toLowerCase();

      if (answer === "y" || answer === "yes") {
        executeUpdate();
      } else if (answer === "n" || answer === "no" || answer === "cancel") {
        console.log("Update cancelled.");
        process.exit(0);
      } else {
        console.log("Please enter 'y' or 'n'. Do you want to update? (y/n)");
        // Continue listening for valid input
        return;
      }

      // Clean up the listener after handling input
      process.stdin.off("data", handleInput);
      process.stdin.pause();
    };

    process.stdin.on("data", handleInput);
  } else {
    // Non-interactive mode - auto-update
    console.log("Non-interactive mode detected. Auto-updating...");
    executeUpdate();
  }
}

function executeUpdate(): void {
  exec(
    "npm install -g @involvex/npm-global-updater@latest",
    (error, stdout, stderr) => {
      if (error) {
        console.error(`Error updating npm-global-updater: ${error}`);
        process.exit(1);
      }

      if (stdout) {
        console.log(stdout);
      }
      if (stderr) {
        console.error(stderr);
      }

      console.log(
        "npm-global-updater updated successfully. Please restart the application.",
      );
      process.exit(0);
    },
  );
}

async function triggerupdate(): Promise<void> {
  try {
    const latestVersion = await getLatestVersion();
    const currentVersion = packagejson.version;

    if (!latestVersion) {
      console.error("Failed to fetch latest version information.");
      process.exit(1);
    }

    if (currentVersion < latestVersion) {
      await performUpdate(latestVersion, currentVersion);
    } else {
      console.log("Current version:", currentVersion);
      console.log("No update available.");
      console.log(
        "Find out more at: " +
          "https://www.npmjs.com/package/@involvex/npm-global-updater?activeTab=versions",
      );
    }
  } catch (error) {
    console.error("Update check failed:", error);
    process.exit(1);
  }
}

async function notifyupdate(): Promise<void> {
  try {
    const latestVersion = await getLatestVersion();
    const currentVersion = packagejson.version;

    if (currentVersion < latestVersion) {
      console.log("=".repeat(60));
      console.log("\tA new version of npm-global-updater is available.");
      console.log("\tPlease update by running:");
      console.log("\tnpm install -g @involvex/npm-global-updater@latest");
      console.log("\tor run:");
      console.log("\tnpm-updater self-update");
      console.log("=".repeat(60));

      // Handle self-update mode
      if (process.argv.includes("self-update")) {
        console.log("Triggering self-update...");
        await triggerupdate();
      }
    }
  } catch (error) {
    console.error("Update notification failed:", error);
  }
}

export default notifyupdate;

// Direct execution for self-update mode
if (process.argv.includes("self-update")) {
  triggerupdate();
}
