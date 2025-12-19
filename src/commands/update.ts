import { exec } from "child_process";

export async function runupdate(packageName?: string) {
  // Get package name from command line argument or prompt user
  const name = packageName || process.argv[3]; // args[0] = command, args[1] = "update", args[2] = packageName

  if (!name) {
    console.log("Error: Please provide a package name.");
    console.log("Usage: npm-updater update <package-name>");
    return;
  }

  console.log(`Updating ${name}...`);

  exec(`npm install -g ${name}@latest`, (error, stdout, stderr) => {
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

export default runupdate;
