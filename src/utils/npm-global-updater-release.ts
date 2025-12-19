import packagejson from "../../package.json";
import { exec } from "child_process";

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
  return latestVersion?.version;
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
      "\tnpm install -g @involvex/npm-global-updater@latest",
    );
    console.log("=".repeat(60));
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
  } else if (latestVersion <= currentVersion) {
    process.stdin.pause(); // Pause stdin if no update is needed
    return false;
  }
}

export default notifyupdate;
