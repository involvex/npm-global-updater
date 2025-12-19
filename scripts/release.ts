import { exec } from "child_process";

export async function runrelease() {
  console.log("Starting Release script...");
  console.log("Building project...");
  exec("bun run build");
  console.log("Project built successfully.");
  console.log("Generate Changelog");
  exec("bun run changelog");
  console.log("Commiting changes...");
  exec("git add .");
  exec("git commit -F Changelog.md");
  console.log("Increasing Version");
  exec("npm version patch");
  console.log("Pushing changes...");
  exec("git push --all");
}
runrelease();