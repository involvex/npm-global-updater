#!/usr/bin/env bun

/**
 * Optimized Release Management Script
 * Automatically manages semantic versioning, changelog generation, and deployment
 */

import { exec } from "child_process";
import { promisify } from "util";
import { readFileSync, writeFileSync, existsSync } from "fs";

const execAsync = promisify(exec);

// Configuration interface
interface ReleaseConfig {
  dryRun: boolean;
  force: boolean;
  preRelease: string | null;
  commitMessage: string | null;
  files: string[];
  buildCommand: string;
  changelogCommand: string;
  pushTags: boolean;
  createAnnotatedTags: boolean;
  analyzeCommits: boolean;
  generateFileMessages: boolean;
  versionIncrement: "auto" | "major" | "minor" | "patch" | "prerelease";
  remote: string;
  branch: string;
}

// Semantic version interface
interface SemanticVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  build?: string;
}

// Conventional commit interface
interface ConventionalCommit {
  type: string;
  scope?: string;
  subject: string;
  body?: string;
  footer?: string;
  breaking: boolean;
  raw: string;
  hash: string;
}

// Git commit interface
interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
  files: string[];
  linesAdded: number;
  linesRemoved: number;
}

/**
 * Intelligent Release Manager - Main orchestrator class
 */
class ReleaseManager {
  private config: ReleaseConfig;
  private currentVersion: string;
  private newVersion: string;
  private commits: GitCommit[];
  private conventionalCommits: ConventionalCommit[];
  private changelog: string;
  private tagName: string;

  constructor(config: ReleaseConfig) {
    this.config = config;
    this.currentVersion = "";
    this.newVersion = "";
    this.commits = [];
    this.conventionalCommits = [];
    this.changelog = "";
    this.tagName = "";
  }

  /**
   * Execute a command with enhanced logging and error handling
   */
  private async executeCommand(
    command: string,
    description: string,
    options: { silent?: boolean; cwd?: string } = {},
  ): Promise<{ stdout: string; stderr: string }> {
    if (!this.config.dryRun) {
      console.log(`\n🔄 ${description}...`);
      console.log(`📝 Executing: ${command}`);
    } else {
      console.log(`\n🧪 [DRY RUN] ${description}...`);
      console.log(`📝 Would execute: ${command}`);
      return { stdout: "", stderr: "" };
    }

    try {
      const { stdout, stderr } = await execAsync(command, {
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024,
        cwd: options.cwd,
      });

      if (!options.silent && stdout?.trim()) {
        console.log("📤 Output:", stdout.trim());
      }

      if (stderr?.trim() && !options.silent) {
        console.log("⚠️  Warnings:", stderr.trim());
      }

      return { stdout, stderr };
    } catch (error) {
      if (this.config.force) {
        console.warn(`⚠️  ${description} failed but continuing due to --force`);
        return {
          stdout: "",
          stderr: error instanceof Error ? error.message : "",
        };
      }
      throw new Error(
        `${description} failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Parse semantic version string into components
   */
  private parseVersion(version: string): SemanticVersion {
    const match = version.match(
      /^(\d+)\.(\d+)\.(\d+)(?:-([\w.-]+))?(?:\+([\w.-]+))?$/,
    );
    if (!match) {
      throw new Error(`Invalid version format: ${version}`);
    }

    return {
      major: parseInt(match[1] || "0"),
      minor: parseInt(match[2] || "0"),
      patch: parseInt(match[3] || "0"),
      prerelease: match[4],
      build: match[5],
    };
  }

  /**
   * Format semantic version components into string
   */
  private formatVersion(version: SemanticVersion): string {
    let formatted = `${version.major}.${version.minor}.${version.patch}`;
    if (version.prerelease) {
      formatted += `-${version.prerelease}`;
    }
    if (version.build) {
      formatted += `+${version.build}`;
    }
    return formatted;
  }

  /**
   * Analyze git commit history for version determination
   */
  private async analyzeCommits(): Promise<void> {
    console.log("🔍 Analyzing commit history...");

    // Use simple git log format for maximum compatibility
    const { stdout: simpleLogOutput } = await this.executeCommand(
      "git log --oneline --no-merges",
      "Getting commit history (simple format)",
      { silent: true },
    );

    // Parse simple format: "hash message"
    this.commits = simpleLogOutput
      .split("\n")
      .filter(line => line.trim())
      .map(line => {
        const parts = line.split(" ", 2);
        const hash = parts[0] || "";
        const message = parts.slice(1).join(" ") || "";
        return {
          hash,
          message,
          author: "Unknown",
          date: new Date().toISOString(),
          files: [],
          linesAdded: 0,
          linesRemoved: 0,
        };
      });

    console.log(`📊 Found ${this.commits.length} commits since last release`);

    // Parse conventional commits
    this.parseConventionalCommits();
    console.log(
      `🏷️  Found ${this.conventionalCommits.length} conventional commits`,
    );
  }

  /**
   * Parse conventional commit messages
   */
  private parseConventionalCommits(): void {
    this.conventionalCommits = this.commits.map(commit => {
      const commitMatch = commit.message.match(
        /^(\w+)(\(([^)]+)\))?(!)?: (.+)$/,
      );

      if (commitMatch) {
        const [, type, , scope, breaking, subject] = commitMatch;
        return {
          type: (type || "").toLowerCase(),
          scope,
          subject: subject || commit.message,
          body: "",
          footer: "",
          breaking:
            !!breaking ||
            (subject || "").toLowerCase().includes("breaking change"),
          raw: commit.message,
          hash: commit.hash,
        };
      }

      return {
        type: "other",
        subject: commit.message,
        breaking: commit.message.toLowerCase().includes("breaking change"),
        raw: commit.message,
        hash: commit.hash,
      };
    });
  }

  /**
   * Determine version increment based on commit analysis
   */
  private determineVersionIncrement(): "major" | "minor" | "patch" {
    // Check for breaking changes (major)
    const hasBreakingChanges = this.conventionalCommits.some(
      commit => commit.breaking || commit.type === "revert",
    );

    if (hasBreakingChanges && this.config.versionIncrement === "auto") {
      console.log("🚨 Breaking changes detected - incrementing major version");
      return "major";
    }

    // Check for new features (minor)
    const hasFeatures = this.conventionalCommits.some(
      commit => commit.type === "feat",
    );

    if (hasFeatures && this.config.versionIncrement === "auto") {
      console.log("✨ New features detected - incrementing minor version");
      return "minor";
    }

    // Default to patch
    console.log("🔧 Bug fixes and minor changes - incrementing patch version");
    return "patch";
  }

  /**
   * Calculate the new version
   */
  private calculateNewVersion(): string {
    const current = this.parseVersion(this.currentVersion);
    const increment = this.determineVersionIncrement();

    let newVersion: SemanticVersion;

    if (this.config.preRelease) {
      newVersion = {
        ...current,
        prerelease: this.config.preRelease,
      };
    } else {
      switch (increment) {
        case "major":
          newVersion = {
            major: current.major + 1,
            minor: 0,
            patch: 0,
          };
          break;
        case "minor":
          newVersion = {
            ...current,
            minor: current.minor + 1,
            patch: 0,
          };
          break;
        case "patch":
        default:
          newVersion = {
            ...current,
            patch: current.patch + 1,
          };
          break;
      }
    }

    return this.formatVersion(newVersion);
  }

  /**
   * Generate smart changelog from commits
   */
  private generateChangelog(): string {
    console.log("📝 Generating changelog...");

    const grouped = new Map<string, ConventionalCommit[]>();

    for (const commit of this.conventionalCommits) {
      if (
        commit.type === "other" ||
        (commit.type === "docs" && !commit.scope)
      ) {
        continue;
      }

      const key =
        commit.type === "docs"
          ? "📚 Documentation"
          : commit.type === "style"
            ? "💄 Style"
            : commit.type === "refactor"
              ? "🔄 Refactor"
              : commit.type === "test"
                ? "🧪 Tests"
                : commit.type === "chore"
                  ? "🏠 Chore"
                  : commit.type === "build"
                    ? "🏗️  Build"
                    : commit.type === "ci"
                      ? "🔧 CI"
                      : commit.type === "perf"
                        ? "⚡ Performance"
                        : commit.type === "feat"
                          ? "✨ Features"
                          : commit.type === "fix"
                            ? "🐛 Bug Fixes"
                            : `🔧 ${commit.type}`;

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(commit);
    }

    let changelog = `## v${this.currentVersion}...v${this.newVersion}\n\n`;
    changelog += `[compare changes](https://github.com/involvex/npm-global-updater/compare/v${this.currentVersion}...v${this.newVersion})\n\n`;

    for (const [category, commits] of grouped) {
      changelog += `### ${category}\n\n`;
      for (const commit of commits) {
        const scope = commit.scope ? `(${commit.scope})` : "";
        const breaking = commit.breaking ? " [BREAKING]" : "";
        changelog += `- **${commit.type}${scope}:** ${commit.subject}${breaking} (${commit.hash.slice(0, 7)})\n`;
      }
      changelog += "\n";
    }

    // Add contributors
    const contributors = new Set(this.commits.map(c => c.author));
    changelog += `### ❤️ Contributors\n\n`;
    for (const contributor of contributors) {
      changelog += `- ${contributor}\n`;
    }

    return changelog;
  }

  /**
   * Generate commit message from file changes
   */
  private generateCommitMessage(): string {
    if (this.config.commitMessage) {
      return this.config.commitMessage;
    }

    const increment = this.determineVersionIncrement();
    const versionType =
      increment === "major"
        ? "major"
        : increment === "minor"
          ? "minor"
          : "patch";

    const features = this.conventionalCommits.filter(c => c.type === "feat");
    const fixes = this.conventionalCommits.filter(c => c.type === "fix");
    const docs = this.conventionalCommits.filter(c => c.type === "docs");

    let message = `release(v${this.newVersion}): `;

    if (features.length > 0) {
      message += `add ${features.length} feature${features.length > 1 ? "s" : ""}`;
      if (fixes.length > 0 || docs.length > 0) {
        message += `, fix ${fixes.length} bug${fixes.length !== 1 ? "s" : ""}`;
        if (docs.length > 0) {
          message += `, update ${docs.length} documentation`;
        }
      }
    } else if (fixes.length > 0) {
      message += `fix ${fixes.length} bug${fixes.length !== 1 ? "s" : ""}`;
      if (docs.length > 0) {
        message += `, update ${docs.length} documentation`;
      }
    } else if (docs.length > 0) {
      message += `update ${docs.length} documentation`;
    } else {
      message += `${versionType} release`;
    }

    return message;
  }

  /**
   * Detect files affected by the new version
   */
  private getVersionAffectedFiles(): string[] {
    const allChangedFiles = new Set<string>();

    // For now, return common version-affected files
    // In a full implementation, we would analyze actual file changes
    const commonFiles = ["package.json", "CHANGELOG.md", "README.md"];

    for (const file of commonFiles) {
      if (existsSync(file)) {
        allChangedFiles.add(file);
      }
    }

    return Array.from(allChangedFiles);
  }

  /**
   * Simple pattern matching for file detection
   */
  private matchesPattern(file: string, pattern: string): boolean {
    if (pattern.endsWith("/**")) {
      const base = pattern.slice(0, -3);
      return file.startsWith(base) || file.includes(base + "/");
    }

    if (pattern.includes("*")) {
      const regex = new RegExp(pattern.replace(/\*/g, ".*"));
      return regex.test(file);
    }

    return file === pattern || file.startsWith(pattern + "/");
  }

  /**
   * Create annotated git tag
   */
  private async createAnnotatedTag(): Promise<void> {
    console.log("🏷️  Creating annotated git tag...");

    const tagName = `v${this.newVersion}`;
    const tagMessage = `Release ${this.newVersion}\n\nGenerated by intelligent release manager`;

    if (this.config.createAnnotatedTags) {
      await this.executeCommand(
        `git tag -a ${tagName} -m "${tagMessage}"`,
        `Creating annotated tag ${tagName}`,
      );
    } else {
      await this.executeCommand(
        `git tag ${tagName}`,
        `Creating lightweight tag ${tagName}`,
      );
    }

    this.tagName = tagName;
  }

  /**
   * Update package.json version
   */
  private async updatePackageJson(): Promise<void> {
    console.log("📦 Updating package.json version...");

    if (this.config.dryRun) {
      console.log(`🧪 Would update version to ${this.newVersion}`);
      return;
    }

    const packageJsonPath = "package.json";
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    packageJson.version = this.newVersion;
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }

  /**
   * Build project
   */
  private async buildProject(): Promise<void> {
    console.log("🔨 Building project...");

    if (this.config.buildCommand) {
      await this.executeCommand(this.config.buildCommand, "Building project");
    }
  }

  /**
   * Generate changelog file
   */
  private async generateChangelogFile(): Promise<void> {
    console.log("📄 Generating changelog file...");

    this.changelog = this.generateChangelog();

    if (this.config.changelogCommand) {
      await this.executeCommand(
        this.config.changelogCommand,
        "Generating changelog with changelogen",
      );
    } else {
      // Append to existing CHANGELOG.md
      const changelogPath = "CHANGELOG.md";
      let existingContent = "";

      if (existsSync(changelogPath)) {
        existingContent = readFileSync(changelogPath, "utf8");
      }

      const newContent = this.changelog + "\n" + existingContent;
      writeFileSync(changelogPath, newContent);
    }
  }

  /**
   * Commit version-affected files
   */
  private async commitChanges(): Promise<void> {
    console.log("💾 Committing version-affected files...");

    const affectedFiles = this.getVersionAffectedFiles();
    const commitMessage = this.generateCommitMessage();

    if (affectedFiles.length > 0) {
      // Add affected files
      await this.executeCommand(
        `git add ${affectedFiles.join(" ")}`,
        `Adding ${affectedFiles.length} version-affected files`,
      );

      // Commit with generated message
      await this.executeCommand(
        `git commit -m "${commitMessage}"`,
        "Committing changes with generated message",
      );
    } else {
      console.log("ℹ️  No version-affected files found");
    }
  }

  /**
   * Push changes to remote
   */
  private async pushChanges(): Promise<void> {
    console.log("🚀 Pushing changes to remote...");

    const pushCommand = this.config.pushTags
      ? `git push origin ${this.config.branch} --follow-tags`
      : `git push origin ${this.config.branch}`;

    await this.executeCommand(pushCommand, "Pushing changes to remote");
  }

  /**
   * Validate release prerequisites
   */
  private async validatePrerequisites(): Promise<void> {
    console.log("✅ Validating release prerequisites...");

    // Check if we're in a git repository
    try {
      await this.executeCommand(
        "git rev-parse --is-inside-work-tree",
        "Checking git repository",
        { silent: true },
      );
    } catch {
      throw new Error("Not in a git repository");
    }

    // Check for uncommitted changes (unless forced)
    const { stdout: statusOutput } = await this.executeCommand(
      "git status --porcelain",
      "Checking for uncommitted changes",
      { silent: true },
    );

    if (statusOutput.trim() && !this.config.force) {
      throw new Error(
        "There are uncommitted changes. Use --force to override or commit them first.",
      );
    }

    // Get current version from package.json
    try {
      const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
      this.currentVersion = packageJson.version;
      console.log(`📍 Current version: ${this.currentVersion}`);
    } catch {
      throw new Error("Could not read package.json version");
    }

    // Check for existing tags
    const { stdout: tagOutput } = await this.executeCommand(
      "git tag --list",
      "Checking existing tags",
      { silent: true },
    );
    const latestTag = tagOutput.trim().split("\n").pop()?.trim();

    if (latestTag) {
      console.log(`🏷️  Latest tag: ${latestTag}`);
    }
  }

  /**
   * Main release orchestration method
   */
  public async runRelease(): Promise<void> {
    console.log("🚀 Starting Intelligent Release Process...");
    console.log("=".repeat(60));

    try {
      // Step 1: Validate prerequisites
      await this.validatePrerequisites();

      // Step 2: Analyze commits
      if (this.config.analyzeCommits) {
        await this.analyzeCommits();
      }

      // Step 3: Calculate new version
      this.newVersion = this.calculateNewVersion();
      console.log(`🎯 New version: ${this.newVersion}`);

      // Step 4: Build project
      await this.buildProject();

      // Step 5: Generate changelog
      await this.generateChangelogFile();

      // Step 6: Update package.json
      await this.updatePackageJson();

      // Step 7: Commit changes
      await this.commitChanges();

      // Step 8: Create tag
      await this.createAnnotatedTag();

      // Step 9: Push changes
      await this.pushChanges();

      // Summary
      console.log("\n🎉 Release completed successfully!");
      console.log("=".repeat(60));
      console.log(`📦 Version: ${this.currentVersion} → ${this.newVersion}`);
      console.log(`🏷️  Tag: ${this.tagName}`);
      console.log(`📝 Changelog: Generated and committed`);
      console.log(`🚀 Pushed: Changes and tags to remote`);
    } catch (error) {
      console.error("\n💥 Release process failed!");
      console.error(
        `Reason: ${error instanceof Error ? error.message : "Unknown error"}`,
      );

      if (this.config.dryRun) {
        console.log("\n🧪 This was a dry run - no actual changes were made");
      }

      process.exit(1);
    }
  }
}

/**
 * Parse command line arguments
 */
function parseArguments(): ReleaseConfig {
  const args = process.argv.slice(2);

  return {
    dryRun: args.includes("--dry-run") || args.includes("-d"),
    force: args.includes("--force") || args.includes("-f"),
    preRelease:
      getArgValue(args, "--pre-release") || getArgValue(args, "--prerelease"),
    commitMessage: getArgValue(args, "--message") || getArgValue(args, "-m"),
    files: args.filter(arg => !arg.startsWith("-")).slice(1),
    buildCommand: getArgValue(args, "--build") || "bun run build",
    changelogCommand: getArgValue(args, "--changelog") || "bun run changelog",
    pushTags: !args.includes("--no-tags"),
    createAnnotatedTags: !args.includes("--lightweight"),
    analyzeCommits: !args.includes("--no-analyze"),
    generateFileMessages: !args.includes("--no-file-messages"),
    versionIncrement:
      (getArgValue(args, "--increment") as
        | "major"
        | "minor"
        | "patch"
        | "prerelease"
        | "auto") || "auto",
    remote: getArgValue(args, "--remote") || "origin",
    branch: getArgValue(args, "--branch") || "main",
  };
}

/**
 * Get value for a command line argument
 */
function getArgValue(args: string[], flag: string): string | null {
  const index = args.indexOf(flag);
  if (index !== -1 && index + 1 < args.length) {
    const value = args[index + 1];
    if (value && !value.startsWith("-")) {
      return value;
    }
  }
  return null;
}

/**
 * Show help information
 */
function showHelp(): void {
  console.log(`
🚀 Intelligent Release Manager

Usage: bun run scripts/release.ts [options]

Options:
  -d, --dry-run           Show what would be done without making changes
  -f, --force             Continue even if there are validation errors
  -m, --message <msg>     Custom commit message
  --pre-release <type>    Create pre-release version (alpha, beta, rc)
  --increment <type>      Force version increment (major, minor, patch, prerelease)
  --build <command>       Custom build command (default: "bun run build")
  --changelog <command>   Custom changelog command (default: "bun run changelog")
  --remote <remote>       Git remote name (default: "origin")
  --branch <branch>       Git branch name (default: "main")
  --no-tags              Don't push tags
  --lightweight          Create lightweight tags instead of annotated
  --no-analyze           Skip commit analysis
  --no-file-messages     Don't generate commit messages from file changes
  -h, --help             Show this help message

Examples:
  # Basic release
  bun run scripts/release.ts

  # Dry run to see what would happen
  bun run scripts/release.ts --dry-run

  # Force release with custom message
  bun run scripts/release.ts --force --message "Custom release message"

  # Create pre-release
  bun run scripts/release.ts --pre-release alpha

  # Force major version increment
  bun run scripts/release.ts --increment major
`);
}

// Main execution
if (require.main === module) {
  const args = process.argv;

  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    process.exit(0);
  }

  const config = parseArguments();
  const releaseManager = new ReleaseManager(config);

  releaseManager.runRelease().catch(error => {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Fatal error:", errorMessage);
    process.exit(1);
  });
}

export {
  ReleaseManager,
  type ReleaseConfig,
  type SemanticVersion,
  type ConventionalCommit,
  type GitCommit,
};
