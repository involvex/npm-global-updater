import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Execute a command with proper logging and error handling
 * @param command - The command to execute
 * @param description - Human-readable description of what the command does
 */
async function executeCommand(
  command: string,
  description: string,
): Promise<void> {
  try {
    console.log(`\n🔄 ${description}...`);
    console.log(`📝 Executing: ${command}`);

    const { stdout, stderr } = await execAsync(command, {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
    });

    // Log stdout if there's any output
    if (stdout && stdout.trim()) {
      console.log("📤 Output:");
      console.log(stdout.trim());
    }

    // Log stderr (might contain warnings or important info)
    if (stderr && stderr.trim()) {
      console.log("⚠️  Errors/Warnings:");
      console.log(stderr.trim());
    }

    console.log(`✅ ${description} completed successfully`);
  } catch (error: unknown) {
    let errorMessage = "Unknown error";

    if (error instanceof Error) {
      const err = error as Error & { stderr?: string; stdout?: string };
      errorMessage = err.stderr || err.stdout || error.message;
    }

    console.error(`❌ ${description} failed!`);
    console.error(`Command: ${command}`);
    console.error(`Error: ${errorMessage}`);

    // Re-throw the error to stop the release process
    throw new Error(`${description} failed: ${errorMessage}`);
  }
}

export async function runRelease(): Promise<void> {
  console.log("🚀 Starting Release Script...");
  console.log("=".repeat(50));

  try {
    // Step 1: Build the project
    await executeCommand("bun run build", "Building project");

    // Step 2: Generate changelog
    await executeCommand("bun run changelog", "Generating changelog");

    // Step 3: Add all changes to git
    await executeCommand("git add .", "Adding changes to git");

    // Step 4: Commit changes using changelog
    await executeCommand("git commit -F Changelog.md", "Committing changes");

    // Step 5: Increase version number
    await executeCommand("npm version patch", "Increasing version number");

    // Step 6: Push all changes
    await executeCommand("git push --all", "Pushing changes to remote");

    console.log("\n🎉 Release completed successfully!");
    console.log("=".repeat(50));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("\n💥 Release process failed!");
    console.error(`Reason: ${errorMessage}`);
    process.exit(1);
  }
}

// Run the release script
if (require.main === module) {
  runRelease().catch((error: unknown) => {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Fatal error:", errorMessage);
    process.exit(1);
  });
}
