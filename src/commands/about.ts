import packageinfo from "../../package.json";
import { showlogo } from "src/utils/logo";

export async function showabout() {
  showlogo();
  console.log("=== About this app ===");
  console.log("Name: " + packageinfo.name);
  console.log("=".repeat(60));
  console.log("Repository: " + packageinfo.repository.url);
  console.log("=".repeat(60));
  console.log("Description: " + packageinfo.description);
  console.log("=".repeat(60));
  console.log("Version: " + packageinfo.version);
  console.log("=".repeat(60));
  console.log("Author: " + packageinfo.author);
  console.log("=".repeat(60));
}
