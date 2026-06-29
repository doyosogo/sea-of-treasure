# Contributing

Sea of Treasure is a browser game with a React/Vite frontend and an Express/Prisma backend scaffold. Contributions should keep gameplay stable unless a change is explicitly requested.

## Project Structure

- `src/` - frontend app, pages, hooks, context, styles, and game data
- `server/` - backend API, Prisma schema, tests, and deployment files
- `docs/` - API docs, deployment notes, backend testing notes, and project status docs
- `.github/` - CI, issue templates, PR template, and dependency automation

## Coding Conventions

- Use the existing code style in each area of the repo.
- Keep edits focused and avoid unrelated refactors.
- Prefer small, readable functions over large one-off blocks.
- Do not change gameplay balance or backend behavior unless the task explicitly requires it.

## Branching

- Create a short-lived branch for each change.
- Use clear branch names such as `feature/profile-page` or `fix/save-tests`.
- Rebase or merge the latest main branch before opening a pull request if needed.

## Testing

- Run `npm run build` from the repository root before submitting frontend changes.
- Run backend tests with `cd server && npm test` when backend code changes.
- Use `npm run test:coverage` in `server/` when you need broader backend verification.

## Pull Requests

1. Open a branch from the latest main branch.
2. Make the change in the smallest sensible scope.
3. Run the relevant build and test commands.
4. Fill in the pull request template with a clear summary and test notes.
5. Link related issues or docs where relevant.

## Documentation

Update docs when behavior, setup, or operational steps change. Keep the README and the `docs/` folder aligned with the current codebase.
