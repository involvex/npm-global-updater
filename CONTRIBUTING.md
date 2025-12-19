# Contributing to npm-global-updater

Thank you for your interest in contributing to npm-global-updater! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Guidelines](#coding-guidelines)
- [Commit Conventions](#commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Building and Releasing](#building-and-releasing)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

This project adheres to the principles of open collaboration and respect. Please be professional and courteous in all interactions.

## Getting Started

### Prerequisites

- **Bun**: This project uses Bun as the package manager and runtime. Install it from [bun.sh](https://bun.sh/)
- **Node.js**: Version 18 or higher
- **Git**: For version control

### Quick Setup

1. Fork the repository on GitHub
2. Clone your fork:

   ```bash
   git clone https://github.com/YOUR_USERNAME/npm-global-updater.git
   cd npm-global-updater
   ```

3. Install dependencies:

   ```bash
   bun install
   ```

4. Verify the setup:
   ```bash
   bun run dev --help
   ```

## Development Setup

### Available Scripts

The project uses several npm scripts managed by Bun:

```bash
# Development
bun run dev              # Run in development mode
bun run build            # Build the project
bun run start            # Run the built binary

# Code Quality
bun run lint             # Run ESLint
bun run lint:fix         # Fix ESLint issues automatically
bun run format           # Format with Prettier
bun run format:check     # Check Prettier formatting
bun run typecheck        # TypeScript type checking

# Pre-build (automatically runs before build)
bun run prebuild         # Runs format, lint:fix, and typecheck

# Release
bun run changelog        # Generate changelog
bun run release          # Release new version
```

### Development Workflow

1. **Create a feature branch**:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the [coding guidelines](#coding-guidelines)

3. **Test your changes**:

   ```bash
   # Test individual commands
   bun run dev ls
   bun run dev update <package>
   bun run dev updateall

   # Run code quality checks
   bun run prebuild
   ```

4. **Build the project** to ensure everything works:
   ```bash
   bun run build
   ```

## Project Structure

```
npm-global-updater/
├── src/
│   ├── index.ts              # Main entry point
│   ├── commands/             # Command implementations
│   │   ├── ls.ts            # List packages command
│   │   ├── update.ts        # Update individual package
│   │   ├── updateall.ts     # Update all packages
│   │   ├── latestversion.ts # Check latest version
│   │   ├── version.ts       # Version command
│   │   ├── about.ts         # About command
│   │   └── help.ts          # Help command
│   └── utils/
│       └── packageManager.ts # Package manager utilities
├── bin/
│   └── npm-updater.js       # Built binary output
├── scripts/
│   └── release.ts           # Release script
├── docs/                    # Documentation
├── .github/
│   └── workflows/           # GitHub Actions
├── package.json
├── tsconfig.json
├── eslint.config.ts
├── .prettierrc.yaml
├── changelogen.toml         # Changelog configuration
└── README.md
```

## Coding Guidelines

### TypeScript

- **Strict Mode**: The project uses TypeScript strict mode. Ensure all code follows strict typing rules
- **Type Safety**: Avoid `any` types and prefer explicit type definitions
- **ESNext**: Use modern TypeScript features and ESNext syntax

### Code Style

- **Formatter**: Prettier is used for code formatting
- **Linting**: ESLint with TypeScript configuration enforces code quality
- **Line Length**: Maximum 80 characters per line
- **Indentation**: 2 spaces, no tabs
- **Semicolons**: Always use semicolons
- **Quotes**: Use double quotes
- **Trailing Commas**: Use trailing commas where possible

### Best Practices

1. **Function Design**: Keep functions focused and single-purpose
2. **Error Handling**: Use proper error handling with meaningful messages
3. **Type Definitions**: Define interfaces for all data structures
4. **Comments**: Add JSDoc comments for public APIs and complex logic
5. **Constants**: Use uppercase for constants
6. **Variable Names**: Use camelCase for variables and functions

### Code Quality Checks

Before submitting a PR, ensure all checks pass:

```bash
# Format code
bun run format

# Fix linting issues
bun run lint:fix

# Type check
bun run typecheck

# Run all checks (used in CI)
bun run prebuild
```

## Commit Conventions

We use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Build process or auxiliary tool changes

### Examples

```bash
feat(commands): add support for checking latest package versions

fix(updateall): handle packages with special version tags properly

docs(readme): update installation instructions for Windows users

style: fix indentation in packageManager.ts

refactor(utils): extract common version comparison logic
```

## Pull Request Process

### Before Submitting

1. **Ensure all tests pass**:

   ```bash
   bun run prebuild
   ```

2. **Test your changes** with real scenarios:

   ```bash
   # Test individual commands
   bun run dev ls
   bun run dev update <package-name>
   bun run dev updateall

   # Test with different package managers
   bun run dev --pm pnpm ls
   bun run dev --pm yarn update <package>
   ```

3. **Update documentation** if you've made user-facing changes

4. **Update CHANGELOG.md** if your changes are significant

### PR Requirements

1. **Descriptive Title**: Clearly describe what the PR does
2. **Detailed Description**: Explain the changes and why they're needed
3. **Link Related Issues**: Reference any related GitHub issues
4. **Screenshots/Demos**: Include screenshots or GIFs for UI changes
5. **Tests**: Ensure your changes don't break existing functionality

### PR Template

When creating a PR, use this template:

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Tests pass locally
- [ ] Manual testing completed
- [ ] Tested with different package managers

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
```

### Review Process

1. **Automated Checks**: CI will run linting, formatting, and type checking
2. **Code Review**: Maintainers will review for code quality and design
3. **Testing**: Changes will be tested in different environments
4. **Approval**: At least one maintainer approval required
5. **Merge**: Squash and merge preferred

## Testing

### Manual Testing

Test your changes thoroughly:

```bash
# Test individual commands
bun run dev ls                           # List packages
bun run dev update <package>             # Update specific package
bun run dev latestversion <package>      # Check latest version
bun run dev updateall                    # Update all packages

# Test with different package managers
bun run dev --pm pnpm ls
bun run dev --pm yarn update <package>
bun run dev --pm bun updateall

# Test help and version commands
bun run dev --help
bun run dev version
```

### Test Packages

Use these packages for testing:

```bash
# Safe packages to test with
bun run dev update prettier              # Popular package
bun run dev update typescript            # TypeScript compiler
bun run dev update eslint                # Linting tool

# Check latest versions
bun run dev latestversion react          # Popular library
bun run dev latestversion vue            # Another popular library
```

## Building and Releasing

### Building

```bash
# Standard build
bun run build

# Portable build (includes dependencies)
bun run build:portable

# Test the built binary
bun run start
```

### Release Process

1. **Update version** in `package.json`
2. **Generate changelog**:
   ```bash
   bun run changelog
   ```
3. **Create release PR** with updated version and changelog
4. **Tag release** after merge to main branch
5. **GitHub Actions** automatically publishes to npm

## Issue Reporting

### Bug Reports

When reporting bugs, include:

1. **Clear Title**: Describe the issue concisely
2. **Environment**:
   - OS and version
   - Node.js/Bun version
   - npm-global-updater version
3. **Steps to Reproduce**: Detailed reproduction steps
4. **Expected Behavior**: What should happen
5. **Actual Behavior**: What actually happens
6. **Error Messages**: Complete error output
7. **Additional Context**: Screenshots, logs, etc.

### Feature Requests

For new features:

1. **Problem Statement**: What problem does this solve?
2. **Proposed Solution**: How should this work?
3. **Alternatives**: What other solutions have you considered?
4. **Additional Context**: Any other relevant information

### Issue Template

```markdown
## Bug Description

Clear description of the bug

## Environment

- OS: [e.g., macOS 13.0]
- Node.js: [e.g., v18.17.0]
- Bun: [e.g., v1.0.0]
- npm-global-updater: [e.g., v0.0.12]

## Steps to Reproduce

1. Run command...
2. See error

## Expected Behavior

What should happen

## Actual Behavior

What actually happens

## Error Output
```

Complete error message here

```

## Additional Context
Any other relevant information
```

## Questions?

If you have questions about contributing:

1. **Check existing issues** and discussions
2. **Search documentation** in README.md
3. **Open a discussion** for general questions
4. **Ask in issues** for specific problems

## Recognition

Contributors will be recognized in:

- CHANGELOG.md for significant contributions
- README.md for major contributors
- GitHub contributors page

Thank you for contributing to npm-global-updater! 🚀
