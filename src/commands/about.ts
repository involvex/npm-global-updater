import packageinfo from "../../package.json";
export async function showabout() {
  console.log("==================================================");
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
