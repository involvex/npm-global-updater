import { ExportManager, type ExportResult } from "../export/exportManager";

export async function runExport(
  format?: "txt" | "json",
  output?: string,
  packageManagers?: string[],
  filterByPackageManager?: string,
  includeTimestamps?: boolean,
): Promise<void> {
  const exportManager = new ExportManager();

  try {
    await exportManager.initialize();

    const options = {
      format: format,
      output: output,
      packageManagers: packageManagers,
      filterByPackageManager: filterByPackageManager,
      includeTimestamps: includeTimestamps,
    };

    // Validate options
    const validation = exportManager.validateExportOptions(options);
    if (!validation.valid) {
      console.log("❌ Export validation failed:");
      for (const error of validation.errors) {
        console.log(`  - ${error}`);
      }
      return;
    }

    console.log("🚀 Starting package export...");

    const result: ExportResult = await exportManager.exportPackages(options);

    if (result.success) {
      console.log("✅ Export completed successfully!");
      console.log(`📁 File saved to: ${result.filePath}`);
      console.log(`📦 Packages exported: ${result.packagesExported}`);
      console.log(`💾 Format: ${options.format || "default"}`);
    } else {
      console.log("❌ Export failed:", result.message);
    }
  } catch (error) {
    console.log(
      "❌ Export error:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}

export async function showExportTemplates(): Promise<void> {
  const exportManager = new ExportManager();
  await exportManager.initialize();

  const templates = exportManager.getExportTemplates();

  console.log("📋 Export Templates:\n");

  console.log("JSON Format Template:");
  console.log("=".repeat(50));
  console.log(templates.json);
  console.log("");

  console.log("TXT Format Template:");
  console.log("=".repeat(50));
  console.log(templates.txt);
}

export default runExport;
