import { exec } from "child_process";

export async function runrelease() {
  console.log("Starting Release script...");
  console.log("Building project...");
  await (exec("bun run build"));
  console.log("Project built successfully.");
  console.log("Generate Changelog");
  await (exec("bun run changelog"));
  console.log("Commiting changes...");
  await (exec("git add ."));
  await (exec("git commit -F Changelog.md"));
  console.log("Increasing Version");
  await (exec("npm version patch"));
  console.log("Pushing changes...");
  await (exec("git push --all"));
}
runrelease();
