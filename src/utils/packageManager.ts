// Package Manager Utility Module
// Supports npm, pnpm, yarn, and bun for global package management

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export interface PackageManagerConfig {
  name: PackageManager;
  displayName: string;
  listCommand: string;
  listJsonCommand: string;
  installCommand: (packageName: string, version?: string) => string;
  viewCommand: (packageName: string, version?: string) => string;
}

// Package manager configurations
export const PACKAGE_MANAGERS: Record<PackageManager, PackageManagerConfig> = {
  npm: {
    name: "npm",
    displayName: "npm",
    listCommand: "npm list -g",
    listJsonCommand: "npm ls -g --json",
    installCommand: (packageName: string, version?: string) =>
      `npm install -g ${version ? `${packageName}@${version}` : `${packageName}@latest`}`,
    viewCommand: (packageName: string, version?: string) =>
      `npm view ${packageName}${version ? `@${version}` : ""} version`,
  },
  pnpm: {
    name: "pnpm",
    displayName: "pnpm",
    listCommand: "pnpm list -g",
    listJsonCommand: "pnpm list -g --json",
    installCommand: (packageName: string, version?: string) =>
      `pnpm add -g ${version ? `${packageName}@${version}` : `${packageName}@latest`}`,
    viewCommand: (packageName: string, version?: string) =>
      `pnpm view ${packageName}${version ? `@${version}` : ""} version`,
  },
  yarn: {
    name: "yarn",
    displayName: "Yarn",
    listCommand: "yarn global list",
    listJsonCommand: "yarn global list --json",
    installCommand: (packageName: string, version?: string) =>
      `yarn global add ${version ? `${packageName}@${version}` : `${packageName}@latest`}`,
    viewCommand: (packageName: string, version?: string) =>
      `yarn info ${packageName}${version ? `@${version}` : ""} version`,
  },
  bun: {
    name: "bun",
    displayName: "Bun",
    listCommand: "bun list -g",
    listJsonCommand: "bun list -g --json",
    installCommand: (packageName: string, version?: string) =>
      `bun add -g ${version ? `${packageName}@${version}` : `${packageName}@latest`}`,
    viewCommand: (packageName: string, version?: string) =>
      `bun info ${packageName}${version ? `@${version}` : ""} version`,
  },
};

const SUPPORTED_PACKAGE_MANAGERS: PackageManager[] = [
  "npm",
  "pnpm",
  "yarn",
  "bun",
];

export function validatePackageManager(pm: string): PackageManager {
  if (!SUPPORTED_PACKAGE_MANAGERS.includes(pm as PackageManager)) {
    throw new Error(
      `Unsupported package manager: ${pm}. Supported managers: ${SUPPORTED_PACKAGE_MANAGERS.join(", ")}`,
    );
  }
  return pm as PackageManager;
}

export function getPackageManager(pm?: string): PackageManager {
  return validatePackageManager(pm || "npm");
}

export function getPackageManagerConfig(
  pm: PackageManager,
): PackageManagerConfig {
  return PACKAGE_MANAGERS[pm];
}

export function formatPackageManagerList(): string {
  return SUPPORTED_PACKAGE_MANAGERS.join(", ");
}
