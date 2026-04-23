# AGENTS.md
Agent guide for `/home/system/home_stack`.

This repository is a FastAPI + React/Vite full-stack app with Docker-based local integration.
Use this as the default operating guide for coding agents working here.

## Rule Sources
- No `.cursor/rules/` directory was found.
- No `.cursorrules` file was found.
- No `.github/copilot-instructions.md` file was found.
- If any of those files are added later, treat them as higher-priority instructions.

## Repository Layout
- `backend/`: FastAPI app, SQLModel models, Alembic migrations, pytest suite, backend scripts.
- `frontend/`: React 19 + TypeScript + Vite app, Chakra UI, TanStack Router, TanStack Query, Playwright tests.
- `ai_stack/`: AI inference backends (llamacpp, ollama, speaches, vllm).
- `esphome/`: ESPHome configuration for IoT devices.
- `glance/`: Glance dashboard configuration.
- `notebooks/`: Jupyter notebooks for AI/ML experiments (Gemma, Qwen, Whisper, Pydantic AI).
- `scripts/`: top-level Docker and integration scripts.
- `hooks/`: Copier project generation hooks.
- `.github/`: GitHub workflows, issue/discussion templates, dependabot config.
- `docker-compose*.yml`: Docker Compose configurations (base, override, traefik).
- `makefile`: Make commands for common tasks.
- `frontend/src/client/`: generated OpenAPI client; avoid manual edits.
- `frontend/src/routeTree.gen.ts`: generated route tree; do not hand-edit.

## Toolchains
- Python: `uv`, Python `>=3.10,<4.0`.
- Node: `.nvmrc` pins Node `20`; frontend uses `npm`.
- Backend quality tools: `ruff`, `mypy`, `pytest`, `coverage`.
- Frontend quality tools: `biome`, `playwright`.

## Setup

### Backend
Run from `backend/`:

```bash
uv sync
source .venv/bin/activate
```

### Frontend
Run from `frontend/`:

```bash
nvm use   # or fnm use
npm install
```

### Full stack
From repo root:

```bash
docker compose up -d --wait backend
```

Use Docker when you need PostgreSQL, backend container behavior, or Playwright prerequisites.

## Build Commands

### Frontend
- Dev server: `cd frontend && npm run dev`
- Production build: `cd frontend && npm run build`
- Preview built app: `cd frontend && npm run preview`

### Backend
- No dedicated local build beyond dependency sync.
- Containerized dev server: `docker compose watch`
- Inside the backend container: `fastapi run --reload app/main.py`

### Docker / stack
- Full Docker build script: `./scripts/build.sh`
- Full Docker build via Compose: `docker compose build`

## Lint / Format / Typecheck

### Frontend
- Lint and auto-apply fixes: `cd frontend && npm run lint`
- Format generated client: `cd frontend && npx biome format --write ./src/client`
- Typecheck via build: `cd frontend && npm run build`

Notes:
- `frontend/biome.json` enables import organization.
- Biome uses spaces, double quotes, and no semicolons.
- `npm run lint` applies unsafe fixes; do not treat it as read-only.

### Backend
- Lint + typecheck + format check: `cd backend && bash scripts/lint.sh`
- Auto-fix + format: `cd backend && bash scripts/format.sh`
- Direct commands:
  - `cd backend && ruff check app`
  - `cd backend && ruff format app --check`
  - `cd backend && mypy app`

Notes:
- Mypy is strict.
- Ruff excludes `alembic` and sorts imports.

## Test Commands

### Backend
- Full backend/integration flow from repo root: `bash ./scripts/test.sh`
- If the stack is already up: `docker compose exec backend bash scripts/tests-start.sh`
- Local backend test script: `cd backend && bash scripts/test.sh`
- Direct pytest with coverage: `cd backend && coverage run --source=app -m pytest`

### Run a single backend test
- By file: `cd backend && pytest app/tests/api/routes/test_users.py`
- By file and test name: `cd backend && pytest app/tests/api/routes/test_users.py -k test_get_users_superuser_me`
- By node id: `cd backend && pytest app/tests/api/routes/test_users.py::test_get_users_superuser_me`
- In Docker with passthrough args: `docker compose exec backend bash scripts/tests-start.sh app/tests/api/routes/test_users.py -k test_get_users_superuser_me`

Prefer direct `pytest` for fast iteration and `scripts/tests-start.sh` when Dockerized behavior matters.

### Frontend / Playwright
- Start backend stack first: `docker compose up -d --wait backend`
- Full suite: `cd frontend && npx playwright test`
- UI mode: `cd frontend && npx playwright test --ui`

### Run a single frontend test
- Single file: `cd frontend && npx playwright test tests/login.spec.ts`
- Single test by title: `cd frontend && npx playwright test tests/login.spec.ts --grep "login"`
- Single browser project: `cd frontend && npx playwright test tests/login.spec.ts --project=chromium`

## Code Generation
- Regenerate frontend API client from backend OpenAPI: `./scripts/generate-client.sh`
- Manual client generation: `cd frontend && npm run generate-client`
- After backend API schema changes, regenerate `frontend/src/client/` and review the diff.

## Backend Style Guidelines
- Follow Ruff formatting/imports first; avoid style-only churn beyond touched code.
- Use 4-space indentation and Black/Ruff-compatible formatting.
- Prefer absolute imports from `app...` over relative imports.
- Group imports as standard library, third-party, then local `app` imports.
- Prefer built-in generics and PEP 604 unions in new code (`list[str]`, `User | None`).
- Keep type hints on public functions; strict mypy makes vague typing snowball quickly.
- Use `Any` sparingly and only at integration boundaries.
- Prefer small helpers over long route handlers.
- Keep business logic in `crud.py`, helpers, or dedicated modules instead of bloating route files.
- Validate request/response shapes with Pydantic or SQLModel models rather than ad hoc dict shaping.
- Use dependency injection (`Depends`, `SessionDep`, `CurrentUser`) for shared resources.
- Raise `HTTPException` with explicit status codes and stable `detail` messages.
- Commit SQLModel changes explicitly with `session.add(...)`, `session.commit()`, and `session.refresh(...)` when needed.
- Keep route docstrings brief and action-oriented.
- Tests use plain pytest functions named `test_*`; mirror existing naming.

## Frontend Style Guidelines
- Let Biome control formatting; normalize touched legacy files when practical.
- Prefer functional React components and hooks.
- Prefer TypeScript types on props, query results, and form payloads.
- Avoid `any`; use generated API types from `@/client` when available.
- Use the `@/` path alias for imports from `src/`.
- Keep imports organized; Biome will reorder them.
- Use double quotes and omit semicolons.
- Keep route definitions next to page components with `createFileRoute(...)`.
- Prefer route-local schemas/helpers unless broadly reused.
- Use TanStack Query for server state and invalidation instead of manual fetch state.
- Keep auth token reads/writes consistent with the existing `localStorage` flow.
- Prefer Chakra UI primitives and existing wrappers in `frontend/src/components/ui/`.
- Reuse existing hooks like `useAuth` and `useCustomToast` before adding abstractions.
- Surface async errors through shared helpers such as `handleError` and the toast flow.
- For forms, follow the existing `react-hook-form` pattern and validation helpers in `frontend/src/utils.ts`.

## Naming Conventions
- Python: `snake_case` for functions/variables/modules, `PascalCase` for classes, `UPPER_SNAKE_CASE` for constants.
- React components: `PascalCase` filenames and component names.
- Hooks: `useSomething`.
- Backend tests: `test_*.py`.
- Frontend tests: `*.spec.ts`; setup files use `*.setup.ts`.

## Error Handling Guidance
- Preserve user-visible API error messages unless there is a clear improvement reason.
- Prefer guard clauses over deeply nested conditionals.
- In backend routes, map expected failures to 4xx and upstream/service failures to 5xx or `503`.
- In frontend UI flows, surface errors through the existing toast/error helper patterns.
- Avoid bare `except` blocks; catch specific exceptions.

## Agent Working Agreements
- Check for generated files before editing; prefer source-of-truth files.
- Do not hand-edit generated client code unless the task explicitly requires it.
- When changing backend endpoints or schemas, consider whether `./scripts/generate-client.sh` should be run.
- Favor the smallest coherent change that matches surrounding conventions.
