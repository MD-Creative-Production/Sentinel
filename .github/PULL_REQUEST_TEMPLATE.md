## Description

<!-- Provide a brief description of your changes -->

## Type of Change

<!-- Mark the relevant option with an "x" -->

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update

## Related Issues

<!-- Link related issues using # -->

Fixes #
Related to #

## Changes Made

<!-- List the specific changes you made -->

-

## Testing

<!-- Describe the tests you've run and how to reproduce them -->

- [ ] I have tested these changes locally
- [ ] Tests pass locally (`npm run test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Code is formatted (`npm run format`)
- [ ] TypeScript builds successfully (`npm run build`)

## Checklist

<!-- Ensure all items are checked before submitting -->

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings or errors
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests passed with my changes

## Screenshots (if applicable)

<!-- Add screenshots for UI changes -->

## Additional Context

<!-- Add any other context about the PR -->

## 📝 Description

Implements an extensible API versioning engine supporting **URI Path Strategy** (`/api/v1/`), **Custom HTTP Header Strategy** (`X-API-Version: 2`), and a global fallback mechanism. Decouples version resolution from controller logic using the **Strategy Pattern** and enforces RFC 8594-compliant `Deprecation` and `Sunset` headers for legacy routes.

Fixes #92

---

## 🛠️ Type of Change

- [x] **New Feature** (non-breaking change adding functionality)
- [x] **Refactoring / Architecture** (internal pattern enhancement)
- [x] **Documentation & Specs** (API versioning standards)

---

## 🧪 How Has This Been Tested?

### 1. Manual Verification Matrix

Verified using `curl` against local server execution:

- **URI Path Resolution (`v2`):**
  ```bash
  curl -i http://localhost:3000/api/v2/resources
  # Expected: HTTP 200 | Header: X-Resolved-API-Version: v2
  ```
