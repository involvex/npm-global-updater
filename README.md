# npm-global-updater

A powerful command-line tool for managing and updating globally installed npm packages. Built with TypeScript and designed for developers who need efficient package management across their development environment.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000?logo=bun&logoColor=white)](https://bun.sh/)

## ✨ Features

- **📦 List Global Packages**: View all globally installed packages from any package manager
- **🔎 Update Check**: Scan all global packages and show what has updates available (`check`)
- **🔄 Update Individual Packages**: Update specific packages to their latest versions
- **🚀 Bulk Update All**: Update all global packages at once
- **🔍 Check Latest Version**: View the latest version of any package
- **📤 Export Packages**: Export your global package list to `txt`, `json`, `csv`, or `list` formats
- **📥 Import Packages**: Restore a package list from an exported file and install everything globally
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

# Check which packages have updates available
bun run dev check

# Update a specific package
bun run dev update prettier

# Update all global packages
bun run dev updateall

# Export your global packages
bun run dev export-packages json

# Restore packages from an export
bun run dev import packages.json

# Show help
bun run dev help
```

#### Using the Built Binary

```bash
# After building
npm-updater ls
npm-updater check
npm-updater update prettier
npm-updater updateall
npm-updater export-packages json
npm-updater import packages.json
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

### `npm-updater ls` — List Global Packages

Lists all globally installed packages with their current versions.

```bash
npm-updater ls                    # npm (default)
npm-updater --pm pnpm ls          # pnpm
npm-updater list                  # alias
```

---

### `npm-updater check` — Check for Updates ⭐ New

Scans all globally installed packages and shows which ones have updates available in a columnar table.

```bash
npm-updater check
npm-updater --pm pnpm check
```

**Example Output:**

```
🔍 Checking global packages for updates (npm)...
================================================================================
Found 3 packages with updates available:

Package                       Manager   Current        Latest
--------------------------------------------------------------------------------
prettier                      npm       3.1.0          3.4.2
typescript                    npm       5.3.2          5.8.2
eslint                        npm       8.55.0         9.22.0

================================================================================
Summary: 3/50 packages can be updated.
```

---

### `npm-updater update <package>` — Update Individual Package

Updates a specific package to its latest version.

```bash
npm-updater update prettier
npm-updater --pm pnpm update prettier
```

---

### `npm-updater updateall` — Update All Packages

Scans and updates all global packages. Supports special versions (nightly, dev, preview).

```bash
npm-updater updateall
npm-updater --pm pnpm updateall
```

---

### `npm-updater export-packages [format]` — Export Packages ⭐ Improved

Exports your global package list to a file. Supports four formats:

| Format | Description                                   |
| ------ | --------------------------------------------- |
| `txt`  | Detailed human-readable report (default)      |
| `json` | Full metadata, importable by `import` command |
| `csv`  | Spreadsheet-friendly CSV                      |
| `list` | Simple `name@version` per line                |

```bash
npm-updater export-packages json
npm-updater export-packages csv --output my-packages.csv
npm-updater export-packages txt --timestamp
npm-updater export-packages list --output restore.list
```

---

### `npm-updater import <file>` — Import & Install Packages ⭐ New

Reads an exported package list and installs all packages globally. Great for restoring a dev environment or migrating to a new machine.

Supported file types:

- **`.json`** — from `export-packages json`
- **`.txt` / `.list`** — `name@version` plain text format

```bash
npm-updater import packages.json
npm-updater import packages.list
```

**Example Output:**

```
📥 Starting import from: packages.json
============================================================
📦 Found 3 packages to import...
🚀 Installing prettier@3.4.2 using npm...
🚀 Installing typescript@5.8.2 using npm...
🚀 Installing eslint@9.22.0 using npm...

============================================================
✅ Import completed successfully!
📦 Total packages installed: 3
```

---

### `npm-updater latestversion <package>` — Check Latest Version

Displays the latest available version of any package.

```bash
npm-updater latestversion prettier
```

---

### `npm-updater version` — Show Version

```bash
npm-updater version   # or -v / --version
```

### `npm-updater help` — Show Help

```bash
npm-updater help   # or -h / --help
```

## 🛠️ Development

### Project Structure

```
npm-global-updater/
├── src/
│   ├── index.ts              # Main entry point & CLI router
│   ├── commands/
│   │   ├── ls.ts             # List packages
│   │   ├── check.ts          # Check for updates (NEW)
│   │   ├── update.ts         # Update individual package
│   │   ├── updateall.ts      # Update all packages
│   │   ├── export.ts         # Export command handler
│   │   ├── import.ts         # Import command handler (NEW)
│   │   ├── latestversion.ts  # Check latest version
│   │   ├── alerts.ts         # Alert system commands
│   │   ├── config.ts         # Configuration menu
│   │   ├── version.ts        # Version command
│   │   └── about.ts          # About command
│   ├── export/
│   │   └── exportManager.ts  # Export logic (txt/json/csv/list)
│   ├── import/
│   │   └── importManager.ts  # Import & install logic (NEW)
│   ├── database/
│   │   └── packageTracker.ts # Package tracking
│   ├── config/
│   │   └── configManager.ts  # Configuration management
│   ├── monitoring/           # Monitoring & alert system
│   ├── notifications/        # Notification delivery
│   └── utils/
│       ├── packageManager.ts # PM abstraction layer
│       └── logo.ts           # ASCII logo
├── bin/
│   └── npm-updater.js        # Built binary
├── tests/                    # Test suite
├── package.json
├── tsconfig.json
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
