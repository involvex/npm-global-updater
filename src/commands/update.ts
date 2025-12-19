import { exec } from "child_process";
import {
  getPackageManager,
  getPackageManagerConfig,
} from "../utils/packageManager";

export async function runupdate(
  inputPackageName?: string,
  packageManager?: string,
) {
  // Get package name from command line argument or prompt user
  const name = inputPackageName || process.argv[3]; // args[0] = command, args[1] = "update", args[2] = packageName

  if (!name) {
    console.log("Error: Please provide a package name.");
    console.log(
      "Usage: npm-updater [--pm <package-manager>] update <package-name>[@version]",
    );
    console.log("Examples:");
    console.log("  npm-updater update react");
    console.log("  npm-updater update @google/gemini-cli@nightly");
    console.log("  npm-updater update typescript@5.0.0");
    return;
  }

  // Parse package name and version from input (e.g., "@google/gemini-cli@nightly")
  const versionMatch = name.match(/^(.+?)(@.+)$/);
  let packageName: string;
  let version: string | undefined;

  if (versionMatch && versionMatch[1] && versionMatch[2]) {
    packageName = versionMatch[1];
    version = versionMatch[2].substring(1); // Remove the @ symbol
    console.log(`Package: ${packageName}, Version: ${version}`);
  } else {
    packageName = name;
  }

  const pm = getPackageManager(packageManager);
  const config = getPackageManagerConfig(pm);

  const versionInfo = version ? ` to version ${version}` : " to latest version";
  console.log(
    `Updating ${packageName}${versionInfo} using ${config.displayName}...`,
  );

  const installCommand = config.installCommand(packageName, version);

  exec(installCommand, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(stdout);
    console.log(
      `${packageName} has been updated successfully using ${config.displayName}!`,
    );
  });
}

export default runupdate;
