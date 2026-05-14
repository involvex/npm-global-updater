# Agents.md - Development Guide for npm-global-updater

## Project Overview

**npm-global-updater** is a powerful TypeScript CLI tool for managing and updating globally installed npm packages. It abstracts common operations across multiple package managers (npm, pnpm, yarn, bun), providing a unified interface for developers.

## Technologies

- **Primary Runtime:** [Bun](https://bun.sh/) (used for development, testing, and building)
- **Core Technologies:** TypeScript, Bun, ESLint, Prettier
- **Package Structure:**
  - `src/index.ts`: Entry point for CLI argument parsing and command dispatching
  - `src/commands/`: Individual command logic (e.g., `ls.ts`, `updateall.ts`, `export.ts`)
  - `src/utils/packageManager.ts`: Abstraction layer for `npm`, `pnpm`, `yarn`, and `bun` commands
  - `src/config/`: Configuration management
  - `src/notifications/` & `src/monitoring/`: Alert system for package updates

## Useful Commands

### Development

- **Run a command directly:** `bun run dev <command> [args]` (e.g., `bun run dev ls`)
- **Debug mode:** `bun run dev:debug <command>`
- **Type checking:** `bun run typecheck`
- **Pre-build check:** `bun run prebuild` (runs format, lint:fix, and typecheck)

### Production Build

- **Build for Node.js:** `bun run build` (outputs to `bin/npm-updater.js`)
- **Build portable executable:** `bun run build:porteable` (outputs `bin/npm-updater.exe`)

### Testing & Linting

- **Run tests:** `bun test`
- **Linting:** `bun run lint` (uses ESLint flat config)
- **Format code:** `bun run format` (uses Prettier)

## Best Practices and Guidelines

### Coding Style

- **TypeScript Strictness:** The project uses `strict: true`. Always provide proper types and avoid `any`.
- **Functional Commands:** Commands in `src/commands/` should be exported as async functions (e.g., `runls`, `runupdateall`).
- **Package Manager Abstraction:** Never execute raw PM commands directly. Use `getPackageManagerConfig` from `src/utils/packageManager.ts` to get the appropriate command strings for the user's selected manager.

### Development Workflow

1.  **Format and Lint:** Always run `bun run prebuild` before committing to ensure code quality
2.  **Testing:** Add unit tests in the `tests/` directory for any new features or bug fixes. Use `bun test` to verify
3.  **Command Registration:** New commands must be added to the `switch` statement in `src/index.ts` and documented in the `showHelp` function

### File Naming

- Use `camelCase` for source files and directories (e.g., `packageTracker.ts`, `configManager.ts`)
- Command files in `src/commands/` should match the command name (e.g., `ls.ts`, `update.ts`)

## Key Dependencies

- `bun`: Runtime, test runner, and bundler
- `typescript-eslint`: Linting for TypeScript
- `console-clear`: Utility for clearing the terminal
- `jiti`: Runtime TypeScript execution (where needed)

## Code Structure Overview

The main entry point is `src/index.ts` which handles:
- CLI argument parsing and command dispatching
- Individual command logic in `src/commands/` for each feature (ls, updateall, export, etc.)
- Utilities in `src/utils/` for package management abstraction
- Configuration in `src/config/` for tool settings
- Database and monitoring in `src/database/` and `src/monitoring/` for package tracking

## Agent-Specific Guidelines

### Development Process

1. **Development Environment Setup:**
   - Install Bun: `curl -fsSL https://bun.sh/install | bash`
   - Clone and setup: `git clone <repository-url> && cd npm-global-updater && bun install`

2. **Running Tests:**
   ```bash
   bun test                # Run the test suite
   bun run lint             # Run ESLint
   bun run format           # Format with Prettier
   bun run typecheck        # TypeScript type checking
   ```

3. **Building for Production:**
   ```bash
   bun run build           # Builds to bin/npm-updater.js
   ```

4. **Development Commands:**
   - **List packages**: `bun run dev ls`
   - **Check for updates**: `b\n run dev check`
   - **Update packages**: `bun run dev updateall`

### Code Quality

- **Code Quality**: Run `bun run prebuild` (runs format, lint, and typecheck)
- **ESLint Configuration**: Use `.eslintrc.js` for linting rules
- **Prettier Configuration**: Use `.prettierrc` for code formatting

### Version Control

- **Git Hooks**: Use `pre-commit` hooks for code quality checks
- **Commits**: Follow conventional commit messages (e.g., `feat: add new feature`, `fix: resolve issue`)
- **Branching**: Use feature branches for new development: `git checkout -b feature/amazing-feature`

### Deployment

- **Building**: `bun run build` creates `bin/npm-updater.js`
- **Usage**: `npm-updater <command>` for production use

### Package Management

- **Package Managers**: Works with npm, pnpm, Yarn, and Bun
- **Configuration**: Use `--pm` flag to specify your preferred package manager
- **Examples**:
  ```bash
  npm-updater --pm pnpm check
  npm-updater --pm yarn updateall
  ```

### Error Handling

- **Permission Issues**: `sudo npm-updater update <package>` for "Permission denied" errors
- **TypeScript Errors**: Run `bun run typecheck` to fix any type errors

### Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Make** your changes
4. **Run** tests and linting: `bun run prebuild`
5. **Commit** your changes: `git commit -m 'Add amazing feature'`
6. **Push** to the branch: `git push origin feature/amazing-feature`
7. **Open** a Pull Request

### Additional Resources

- **Documentation**: This guide and inline code documentation
- **Issues**: [GitHub Issues](https://github.com/involvex/npm-global-updater/issues)
- **Discussions**: [GitHub Discussions](https://github.com/involvex/npm-global-updater/discussions)
- **Support**: For help with any issues, check the documentation or open an issue on GitHub

## Troubleshooting

- **Permission Issues**: If you get "Permission denied" when updating packages, use `sudo` or fix npm permissions with `sudo chown -R $(whoami) ~/.npm`
- **Command Not Found**: Ensure the binary is in your PATH with `export PATH="$PATH:$(pwd)/bin"`
- **TypeScript Issues**: For TypeScript compilation errors, run `bun run typecheck` to identify and fix any type errors
- **ESLint Warnings**: Fix with `bun run lint:fix`

## Debugging

For debugging, you can run the commands directly with Bun:
```bash
bun run src/index.ts ls
bun run src/index.ts update <package>
bun run src/index.ts updateall
```

## Configuration

Environment variables are not required. The tool works with standard npm configurations.

Ensure your npm is properly configured:
```bash
npm config get prefix    # Should show your global packages location
npm config list       # View current npm configuration
</content>