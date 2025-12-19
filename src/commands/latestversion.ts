import { exec } from "child_process";
export async function showlatestversion(packageName?: string) {
  const name = packageName || process.argv[3];
  if (!name) {
    console.log("Error: Please provide a package name.");
    console.log("Usage: npm-updater latestversion <package-name>");
    return;
  }
  console.log(`Fetching latest version of ${name}...`);
  exec(`npm view ${name} version`, (error, stdout, stderr) => {
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
