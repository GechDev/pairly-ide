
# Pairly — Engineering Instructions

## Product
Build Pairly, a collaborative coding and AI-assisted development
workspace. Treat docs/Pairly_SRS.md as the functional source of truth.

## Engineering rules
- Inspect the existing repository before making changes.
- Follow the approved architecture and existing conventions.
- Use TypeScript with strict type checking.
- Keep features small, modular, and testable.
- Never implement unrelated features without approval.
- Do not replace libraries or restructure the project without
  explaining why and obtaining approval.
- Validate all untrusted input on the server.
- Enforce room membership and permissions on the server.
- Never expose secrets or place private keys in client code.
- Never execute user code inside the main web application.
- AI-generated code changes must be reviewable before application.
- Do not claim tests pass unless you actually ran them.

## Required workflow for every task
1. Read the relevant SRS requirements.
2. Inspect affected files and dependencies.
3. Write a short implementation plan.
4. Implement only the agreed scope.
5. Add or update automated tests.
6. Run formatting, lint, type checking, and relevant tests.
7. Review the diff for regressions and security issues.
8. Report changed files, commands run, results, and remaining risks.
9. Leave unrelated changes untouched.

## Completion criteria
A task is complete only when its acceptance criteria pass,
its tests pass, and its documentation is updated where needed.
