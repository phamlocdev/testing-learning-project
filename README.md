# testing-learning-projects

[![CI](https://github.com/phamlocdev/testing-learning-project/actions/workflows/ci.yml/badge.svg)](https://github.com/phamlocdev/testing-learning-project/actions/workflows/ci.yml)

Repo học tập cá nhân về testing (Unit → Integration → E2E → CI) trên một dự án hands-on
("Mini Task Manager": NestJS API + Next.js client-side + PostgreSQL). Xem `CLAUDE.md` cho đầy đủ
bối cảnh và learning path, `PROGRESS.md` cho tiến độ chi tiết theo từng milestone.

## Cấu trúc

- `apps/api` — NestJS API (auth + CRUD task), Vitest + Supertest + Testcontainers
- `apps/web` — Next.js client-side (SPA-like, gọi thẳng `apps/api`), Vitest + React Testing
  Library + MSW
- `apps/e2e` — Playwright, chạy cả 2 app thật

## Test & coverage

```bash
pnpm --filter api test        # unit test
pnpm --filter api test:e2e    # integration test (Testcontainers Postgres)
pnpm --filter api test:cov    # unit test + coverage report
pnpm --filter web test        # unit + integration test (MSW)
pnpm --filter web test:cov    # unit + integration test + coverage report
pnpm --filter e2e test        # E2E (Playwright, cần 2 dev server + Postgres chạy sẵn)
```

Coverage report (`test:cov`) in ra % Statements/Branches/Functions/Lines ngay trong terminal
(Vitest + `@vitest/coverage-v8`) và cũng chạy tự động trong CI (`unit-test-api`/`test-web`) để
log luôn trong mỗi lần chạy — không đặt threshold bắt buộc, vì mục tiêu learning path này là
hiểu testing chứ không phải ép coverage 100% (xem `CLAUDE.md`/`PROGRESS.md` Stage 0).

## CI

`.github/workflows/ci.yml` chạy trên mỗi push/PR vào `main`/`dev`: unit test (api + web, kèm
coverage), integration test API (Testcontainers), E2E Playwright (Postgres service container
thật).
