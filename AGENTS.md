# Repository Guidelines

## Project Structure & Module Organization
- `App.tsx` and `index.tsx` are the main entry points for the React app.
- UI building blocks live in `components/` (e.g., `components/Dashboard.tsx`, `components/Sidebar.tsx`).
- Shared utilities and types are in `utils.ts` and `types.ts`.
- Styling is configured via `index.css`, `tailwind.config.cjs`, and `postcss.config.cjs`.
- Static assets are served from `public/`.
- Deployment configuration is in `netlify/` and `netlify.toml`.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: start the Vite dev server.
- `npm run build`: create a production build.
- `npm run preview`: locally preview the production build.

## Coding Style & Naming Conventions
- Language: TypeScript with React (Vite).
- Indentation: 2 spaces (match existing TSX formatting).
- Component files use PascalCase (e.g., `UploadSection.tsx`).
- Utilities and shared types use camelCase file names (e.g., `utils.ts`, `types.ts`).
- Tailwind CSS is the primary styling approach; keep styles close to components.

## Testing Guidelines
- No automated test framework is configured yet.
- If you add tests, document the runner and add scripts in `package.json`.

## Commit & Pull Request Guidelines
- Commit messages follow a Conventional Commits pattern (e.g., `feat: ...`, `fix: ...`, `refactor: ...`).
- PRs should include: a short summary, key changes, and any UI screenshots when relevant.
- Link related issues or tasks when available.

## Security & Configuration Tips
- Local secrets live in `.env.local`; set `GEMINI_API_KEY` before running the app.
- Avoid committing credentials or API keys.
