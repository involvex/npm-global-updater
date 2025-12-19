# npm-global-updater

A powerful command-line tool for managing and updating globally installed npm packages. Built with TypeScript and designed for developers who need efficient package management across their development environment.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000?logo=bun&logoColor=white)](https://bun.sh/)

## ✨ Features

- **📦 List Global Packages**: View all globally installed packages from any package manager
- **🔄 Update Individual Packages**: Update specific packages to their latest versions
- **🚀 Bulk Update All**: Update all global packages at once
- **🔍 Check Latest Version**: View the latest version of any package
- **🌙 Special Version Support**: Automatically detects and updates nightly, dev, and preview versions
- **📊 Version Comparison**: Compares current versions with latest available versions
- **⚡ Multi-Package Manager Support**: Works with npm, pnpm, Yarn, and Bun
- **🎯 Package Manager Selection**: Use `--pm` flag to specify your preferred package manager
- **⚡ Fast & Efficient**: Built with Bun for optimal performance
- **🛡️ Type Safe**: Full TypeScript support with strict type checking
- **🎯 Error Handling**: Robust error handling with clear feedback

## 🚀 Quick Start

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/involvex/npm-global-updater.git
cd npm-global-updater
```

2. **Install dependencies:**

```bash
bun install
```

3. **Build the project:**

```bash
bun run build
```

4. **Install globally (optional):**

```bash
bun link
```

### Usage

#### Using Bun (Development)

```bash
# List all global packages
bun run dev ls

# Update a specific package
bun run dev update prettier

# Check latest version of a package
bun run dev latestversion prettier

# Update all global packages
bun run dev updateall

# Show version
bun run dev version

# Show help
bun run dev help
```

#### Using the Built Binary

```bash
# After building
npm-updater ls
npm-updater update prettier
npm-updater latestversion prettier
npm-updater updateall
npm-updater version
npm-updater help
```

#### Multi-Package Manager Support

```bash
# Using npm (default)
npm-updater ls
npm-updater update prettier
npm-updater updateall

# Using pnpm
npm-updater --pm pnpm ls
npm-updater --pm pnpm update prettier
npm-updater --pm pnpm updateall

# Using Yarn
npm-updater --pm yarn ls
npm-updater --pm yarn update prettier
npm-updater --pm yarn updateall

# Using Bun
npm-updater --pm bun ls
npm-updater --pm bun update prettier
npm-updater --pm bun updateall
```

#### NPX Usage

```bash
# Install and run via npx
npx @involvex/npm-global-updater@latest ls
npx @involvex/npm-global-updater@latest --pm pnpm update prettier
npx @involvex/npm-global-updater@latest --pm yarn updateall
```

## 📖 Command Reference

### `npm-updater [--pm <package-manager>] ls` - List Global Packages

Lists all globally installed packages with their current versions using the specified package manager.

```bash
npm-updater ls                    # Use npm (default)
npm-updater --pm pnpm ls          # Use pnpm
npm-updater --pm yarn ls          # Use Yarn
npm-updater --pm bun ls           # Use Bun
# or
npm-updater list                  # Use npm (default)
```

**Output:**

```
/usr/local/lib/node_modules
├── prettier@3.1.0
├── typescript@5.3.2
├── eslint@8.55.0
└── ...
```

### `npm-updater [--pm <package-manager>] update <package-name>` - Update Individual Package

Updates a specific package to its latest version using the specified package manager.

```bash
npm-updater update prettier                    # Use npm (default)
npm-updater --pm pnpm update prettier          # Use pnpm
npm-updater --pm yarn update prettier          # Use Yarn
npm-updater --pm bun update prettier           # Use Bun
```

**Features:**

- Updates to the latest stable version by default
- Provides clear success/error feedback
- Shows the update progress

**Example Output:**

```
Updating prettier...
changed 1 package in 1s
prettier has been updated successfully!
```

### `npm-updater [--pm <package-manager>] latestversion <package-name>` - Check Latest Version

Displays the latest available version of any package using the specified package manager.

```bash
npm-updater latestversion prettier                 # Use npm (default)
npm-updater --pm pnpm latestversion prettier       # Use pnpm
npm-updater --pm yarn latestversion prettier       # Use Yarn
npm-updater --pm bun latestversion prettier        # Use Bun
```

**Features:**

- Queries the npm registry for the latest version
- Works for any npm package
- Quick version checking without installation

**Example Output:**

```
Fetching latest version of prettier...
Latest version of prettier: 3.1.1
```

### `npm-updater [--pm <package-manager>] updateall` - Update All Packages

Scans all global packages and updates them to their latest versions using the specified package manager.

```bash
npm-updater updateall                          # Use npm (default)
npm-updater --pm pnpm updateall                # Use pnpm
npm-updater --pm yarn updateall                # Use Yarn
npm-updater --pm bun updateall                 # Use Bun
```

**Features:**

- Automatically detects all global packages
- Compares versions with npm registry
- Updates packages sequentially to avoid conflicts
- Supports special versions (nightly, dev, preview)
- Provides detailed progress feedback

**Example Output:**

```
Checking for globally installed npm packages...
Found 50 globally installed packages
Checking for available updates...

prettier: 3.1.0 -> 3.1.1
typescript: 5.3.2 -> 5.3.3
eslint: 8.55.0 -> 8.56.0

Starting updates for 3 packages...
Updating prettier to 3.1.1...
✅ prettier updated successfully!
Updating typescript to 5.3.3...
✅ typescript updated successfully!
🎉 All updates completed!
```

### Special Version Support

The `updateall` command automatically detects and can update to special versions:

- **Nightly builds**: `@nightly` tag versions
- **Development builds**: `@dev` tag versions
- **Preview builds**: `@preview` tag versions

```bash
# Example output showing special versions
special-package: 2.0.0 -> 2.1.0-nightly
experimental-tool: 1.5.0 -> 1.6.0-dev
```

### `npm-updater version` - Show Version

Displays the current version of npm-global-updater.

```bash
npm-updater version
# or
npm-updater --version
# or
npm-updater -v
```

### `npm-updater help` - Show Help

Displays usage information and available commands.

```bash
npm-updater help
# or
npm-updater --help
# or
npm-updater -h
```

## 🛠️ Development

### Project Structure

```
npm-global-updater/
├── src/
│   ├── index.ts              # Main entry point
│   └── commands/
│       ├── ls.ts            # List packages command
│       ├── update.ts        # Update individual package
│       ├── updateall.ts     # Update all packages
│       ├── latestversion.ts # Check latest version command
│       ├── version.ts       # Version command
│       └── help.ts          # Help command
├── bin/
│   └── npm-updater.js       # Built binary
├── package.json
├── tsconfig.json
├── bunfig.toml
└── README.md
```

### Available Scripts

```bash
# Development
bun run dev              # Run in development mode
bun run build            # Build the project
bun run start            # Run the built binary

# Code Quality
bun run lint             # Run ESLint
bun run lint:fix         # Fix ESLint issues
bun run format           # Format with Prettier
bun run format:check     # Check Prettier formatting
bun run typecheck        # TypeScript type checking

# Pre-build (automatically runs before build)
bun run prebuild         # Runs format, lint:fix, and typecheck
```

### Development Setup

1. **Install Bun** (if not already installed):

```bash
curl -fsSL https://bun.sh/install | bash
```

2. **Clone and setup**:

```bash
git clone <repository-url>
cd npm-global-updater
bun install
```

3. **Start development**:

```bash
bun run dev ls           # Test individual commands
bun run dev updateall    # Test bulk updates
```

### Building for Production

```bash
bun run build           # Builds to bin/npm-updater.js
npm-updater <command>   # Use the built binary
```

## 🔧 Configuration

### Environment Variables

No environment variables required. The tool works out of the box with standard npm configurations.

### npm Configuration

Ensure your npm is properly configured:

```bash
npm config get prefix    # Should show your global packages location
npm config list          # View current npm configuration
```

## 🐛 Troubleshooting

### Common Issues

**Issue: "Permission denied" when updating packages**

```bash
# Solution: Use sudo or fix npm permissions
sudo npm-updater update <package>
# Or fix npm permissions:
sudo chown -R $(whoami) ~/.npm
```

**Issue: "Command not found" after building**

```bash
# Solution: Ensure the binary is in your PATH
export PATH="$PATH:$(pwd)/bin"
npm-updater <command>
```

**Issue: TypeScript compilation errors**

```bash
# Solution: Run type checking
bun run typecheck
# Fix any type errors before building
```

**Issue: ESLint warnings**

```bash
# Solution: Fix linting issues
bun run lint:fix
```

### Debug Mode

For debugging, you can run the commands directly with Bun:

```bash
bun run src/index.ts ls
bun run src/index.ts update <package>
bun run src/index.ts updateall
```

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Run tests and linting**:
   ```bash
   bun run prebuild  # Runs format, lint, and typecheck
   ```
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript strict mode requirements
- Maintain code coverage and add tests for new features
- Use meaningful commit messages
- Update documentation for new features
- Ensure all linting and formatting checks pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Bun](https://bun.sh/) - The fast JavaScript runtime
- Uses [TypeScript](https://www.typescriptlang.org/) for type safety
- Leverages [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/) for code quality

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/involvex/npm-global-updater/issues)
- **Discussions**: [GitHub Discussions](https://github.com/involvex/npm-global-updater/discussions)
- **Documentation**: This README and inline code documentation

---

**Happy updating! 🚀**
