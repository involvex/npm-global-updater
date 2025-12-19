import { exec } from "child_process";
import {
  getPackageManager,
  getPackageManagerConfig,
} from "../utils/packageManager";

export async function showlatestversion(
  packageName?: string,
  packageManager?: string,
) {
  const name = packageName || process.argv[3];

  if (!name) {
    console.log("Error: Please provide a package name.");
    console.log(
      "Usage: npm-updater [--pm <package-manager>] latestversion <package-name>",
    );
    return;
  }

  const pm = getPackageManager(packageManager);
  const config = getPackageManagerConfig(pm);

  console.log(
    `Fetching latest version of ${name} using ${config.displayName}...`,
  );

  const viewCommand = config.viewCommand(name);

  exec(viewCommand, (error, stdout, stderr) => {
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
