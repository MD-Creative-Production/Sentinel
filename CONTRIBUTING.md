# Contributing to Sentinel

Thank you for your interest in contributing to Sentinel! This guide will help you get started and ensure a smooth contribution process.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Branching Strategy](#branching-strategy)
- [Commit Conventions](#commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Code Review Process](#code-review-process)
- [Reporting Issues](#reporting-issues)
- [Community](#community)

---

## Code of Conduct

Please read and follow our [Code of Conduct](./CODE_OF_CONDUCT.md). We are committed to providing a welcoming and inclusive experience for everyone.

---

## Getting Started

### Prerequisites

- **Node.js** v20 or later
- **pnpm** (recommended) or npm
- **PostgreSQL** 15+
- **Git**

### Setup

1. **Fork the repository** on GitHub.

2. **Clone your fork locally:**

   ```bash
   git clone https://github.com/<your-username>/Sentinel.git
   cd Sentinel
   ```

3. **Install dependencies:**

   ```bash
   npm install
   ```

4. **Set up environment variables:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your local database credentials and any API keys you need.

5. **Run database migrations:**

   ```bash
   npx prisma migrate dev
   ```

6. **Start the development server:**

   ```bash
   pnpm dev
   ```

---

## Development Workflow

1. **Pick an issue** — Browse [open issues](https://github.com/sentinel-security-productions/Sentinel/issues) and look for issues labeled `good first issue` or `help wanted`. Comment on the issue to let others know you're working on it.

2. **Create a branch** from `main` following our [branching strategy](#branching-strategy).

3. **Make your changes** — Write clean, well-documented code that follows our coding standards.

4. **Write or update tests** — Ensure your changes are covered by tests.

5. **Run checks locally:**

   ```bash
   npm run lint     # Run linting
   npm test         # Run tests
   npm run build    # Verify the build succeeds
   ```

6. **Commit your changes** following our [commit conventions](#commit-conventions).

7. **Push and open a Pull Request** following our [PR process](#pull-request-process).

---

## Branching Strategy

We use a **feature-branch** workflow based off `main`.

### Branch Naming

| Prefix      | Purpose                   | Example                         |
| ----------- | ------------------------- | ------------------------------- |
| `feat/`     | New features              | `feat/mempool-alert-engine`     |
| `fix/`      | Bug fixes                 | `fix/discord-webhook-timeout`   |
| `docs/`     | Documentation only        | `docs/api-reference`            |
| `refactor/` | Code refactoring          | `refactor/notification-service` |
| `test/`     | Adding or updating tests  | `test/watchlist-module`         |
| `chore/`    | Tooling, CI, dependencies | `chore/update-prisma-schema`    |

### Rules

- **Always branch off `main`.** Never commit directly to `main`.
- **Keep branches focused.** One branch = one feature or fix.
- **Rebase regularly** to stay up to date with `main`:

  ```bash
  git fetch origin
  git rebase origin/main
  ```

- **Delete branches** after merging.

---

## Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/) to keep the history clean and enable automated changelogs.

### Format

```
<type>(<scope>): <short description>

[optional body]

[optional footer(s)]
```

### Types

| Type       | Description                              |
| ---------- | ---------------------------------------- |
| `feat`     | A new feature                            |
| `fix`      | A bug fix                                |
| `docs`     | Documentation changes                    |
| `style`    | Code style changes (formatting, etc.)    |
| `refactor` | Code refactoring without behavior change |
| `test`     | Adding or correcting tests               |
| `chore`    | Build process, CI, or tooling changes    |

### Examples

```
feat(alerts): add Discord webhook notification support

fix(mempool): handle malformed transaction data gracefully

docs(readme): add architecture overview section
```

---

## Pull Request Process

### Before Opening a PR

- [ ] Your branch is up to date with `main`
- [ ] All tests pass locally (`pnpm test`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)
- [ ] New code has test coverage
- [ ] Documentation is updated if applicable

### Opening a PR

1. **Push your branch** to your fork.

2. **Open a Pull Request** against `main` on the upstream repository.

3. **Fill out the PR description:**
   - **What** does this PR do?
   - **Why** is this change needed?
   - **How** was it implemented?
   - Link the related issue(s) using `Closes #<issue-number>`.

4. **Keep PRs small and focused.** A PR should address a single concern. If you have multiple unrelated changes, open separate PRs.

5. **Add screenshots or recordings** for UI changes.

### PR Title

PR titles should follow the same [Conventional Commits](https://www.conventionalcommits.org/) format as commit messages:

```
feat(alerts): add Telegram notification provider
```

### After Opening

- Respond to review feedback promptly.
- Push additional commits to address feedback (don't force-push during review).
- Once approved, a maintainer will merge your PR.

---

## Code Review Process

All pull requests require **at least one approving review** from a maintainer before merging.

### For Contributors

- Be open to feedback — reviews are about the code, not about you.
- Explain your reasoning if you disagree with a suggestion.
- Mark conversations as resolved once addressed.

### For Reviewers

- Be respectful and constructive in feedback.
- Focus on:
  - **Correctness** — Does the code do what it claims?
  - **Testing** — Are edge cases covered?
  - **Security** — Are there any vulnerability concerns?
  - **Performance** — Are there any obvious performance issues?
  - **Readability** — Is the code clear and well-documented?
- Use GitHub's review features: `Comment`, `Approve`, or `Request Changes`.
- Approve once all feedback is addressed.

---

## Reporting Issues

### Bug Reports

Use the [Bug Report template](https://github.com/sentinel-security-productions/Sentinel/issues/new?template=bug_report.yml) and include:

- A clear, descriptive title
- Steps to reproduce
- Expected vs. actual behavior
- Environment details (OS, Node.js version, etc.)
- Relevant logs or screenshots

### Feature Requests

Use the [Feature Request template](https://github.com/sentinel-security-productions/Sentinel/issues/new?template=feature_report.yml) and include:

- The problem you're trying to solve
- Your proposed solution
- Alternatives considered

### Security Vulnerabilities

**Do not open a public issue for security vulnerabilities.** Please follow our [Security Policy](./SECURITY.md) for responsible disclosure.

---

## Community

- **GitHub Discussions** — Ask questions and share ideas.
- **Discord** — Join our community server (link in README).
- **Issues** — Track bugs and feature requests.

---

Thank you for helping make Sentinel better! 🛡️
