# Agent instructions (monorepo)

**This file** at the repo root is the short map for humans and agents. The detailed Cursor configuration lives under **`.cursor/`**.

## Rules

Project rules are in **`.cursor/rules/`**:

| File | How it applies |
|------|----------------|
| `frontend.mdc` | **`alwaysApply: true`** — loaded for the whole workspace (frontend architecture, TypeScript, TanStack, shadcn/ui, feature layout under `frontend/`). |
| `backend.mdc` | Scoped with **`globs: backend/**/*`** — Nest-oriented reminders when editing the Nest app. |

## Skills

Skills are under **`.cursor/skills/`**:

| Directory | Contents (examples) |
|-----------|---------------------|
| `frontend/` | e.g. **shadcn** (`SKILL.md` + rules/docs). |
| `backend/` | **nestjs-best-practices**, **terminalskills-skills-typeorm**. |
| `common/` | **caveman**, **caveman-commit**. |

Use Cursor’s skill UI (`/`) or **`@`** a **`SKILL.md`** path when you want that playbook in context.

## Backend NestJS — expanded rules

The full Nest guideline set ships with the skill **`.cursor/skills/backend/nestjs-best-practices/`**: **`SKILL.md`** plus **`rules/*.md`** per topic.

## Scripts

**`.cursor/scripts/`** holds **`build-agents.ts`** / **`build.sh`** / **`package.json`** for generating **`.cursor/agents/backend.md`** from Nest rule markdown (once **`metadata.json`** and rule input paths are wired in that script). Run from **`.cursor/scripts/`** per that folder’s **`package.json`** scripts.

## TanStack Intent

If you use **`@tanstack/intent`**, point skill discovery at **`.cursor/skills/`** (symlinks or Intent config as needed). There is no root **`agents/`** directory or **`.agents/skills`** tree in this repo by default.
