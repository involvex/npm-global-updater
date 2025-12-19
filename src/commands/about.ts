import packageinfo from "../../package.json";
import { showlogo } from "src/utils/logo";
import { returnversion } from "./version";
import consoleClear from "console-clear";

export async function showabout() {
  consoleClear();
  showlogo();
  console.log("=== About this app ===");
  console.log("Name: " + packageinfo.name);
  console.log("=".repeat(60));
  console.log("Repository: " + packageinfo.repository.url);
  console.log("=".repeat(60));
  console.log("Description: " + packageinfo.description);
  console.log("=".repeat(60));
  console.log("Version: " + returnversion());
  console.log("=".repeat(60));
  console.log("Author: " + packageinfo.author);
  console.log("=".repeat(60));
  console.log(
    "NPMjs: " + "https://www.npmjs.com/package/@involvex/npm-global-updater",
  );
  console.log("=".repeat(60));
}
