# partner

- `frontend/` React components and CSS for the partner pages. Routes stay in `src/app/partner`.
- `backend/` server actions and server-only logic.
- `database/` code that reads or writes the store (`@/modules/shared/database/store`).

Do not import `web` or the other dashboard from here (ESLint enforces it). Shared code goes in `src/modules/shared`. See `docs/PROJECT-STRUCTURE.md`.
