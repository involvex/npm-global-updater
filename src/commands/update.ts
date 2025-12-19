import { exec } from "child_process";
import {
  getPackageManager,
  getPackageManagerConfig,
} from "../utils/packageManager";

export async function runupdate(packageName?: string, packageManager?: string) {
  // Get package name from command line argument or prompt user
  const name = packageName || process.argv[3]; // args[0] = command, args[1] = "update", args[2] = packageName

  if (!name) {
    console.log("Error: Please provide a package name.");
    console.log(
      "Usage: npm-updater [--pm <package-manager>] update <package-name>",
    );
    return;
  }

  const pm = getPackageManager(packageManager);
  const config = getPackageManagerConfig(pm);

  console.log(`Updating ${name} using ${config.displayName}...`);

  const installCommand = config.installCommand(name);

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
      `${name} has been updated successfully using ${config.displayName}!`,
    );
  });
}

export default runupdate;
