# Flight Alert project instructions

## Required context

- Before planning, editing, reviewing, or testing this project, read `project-spec.md` completely.
- Treat `project-spec.md` as the living description of the current system, not as a standalone user request or a list of commands to execute.
- The current user request defines the task. If it conflicts with the specification or the repository, inspect the implementation and explain the conflict instead of silently guessing.
- When a change materially affects functionality, architecture, data, environment variables, deployment, testing, or known limitations, update `project-spec.md` in the same task.

## Project guardrails

- Preserve the mobile-first PWA experience and verify user-facing changes in Playwright's `mobile-chromium` project when relevant.
- Keep authorization enforced in both application logic and Supabase RLS. Add database changes as new, idempotent migrations; do not rewrite migrations that have already been applied.
- Keep secrets server-only. Never print, commit, or expose values from `.env.local` or `.env.test.local`.
- For implementation work, run validation proportional to the change and report what passed, what failed, and what could not be tested.
