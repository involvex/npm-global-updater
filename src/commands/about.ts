import packageinfo from "../../package.json";
import { showlogo } from "src/utils/logo";

export async function showabout() {
  showlogo();
  console.log("=== About this app ===");
  console.log("Name: " + packageinfo.name);
  console.log("==================================================");
  console.log("Repository: " + packageinfo.repository.url);
  console.log("==================================================");
  console.log("Description: " + packageinfo.description);
  console.log("==================================================");
  console.log("Version: " + packageinfo.version);
  console.log("==================================================");
  console.log("Author: " + packageinfo.author);
  console.log("==================================================");
}
