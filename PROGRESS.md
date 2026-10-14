# Learning Progress

> Checklist tiến độ cho learning path testing. Claude Code agent: đọc file này đầu mỗi session,
> tiếp tục từ milestone đầu tiên chưa tick (`[ ]`). Sau khi hoàn thành milestone, tick và thêm
> log entry bên dưới trước khi kết thúc session. Xem `CLAUDE.md` cho context đầy đủ của repo.

**Stage hiện tại:** Stage 0 — Tư duy nền tảng
**Cập nhật lần cuối:** 2026-10-14

---

## Stage 0 — Tư duy nền tảng (không code)
- [ ] Hiểu Testing Pyramid + tỷ lệ 70/20/10
- [ ] Hiểu Test Double: mock/stub/spy/fake, phân biệt được khi nào dùng loại nào
- [ ] Hiểu AAA pattern
- [ ] Hiểu vì sao coverage 100% không phải mục tiêu
- [ ] Hiểu flaky test là gì, tác hại
- [ ] Đọc qua khái niệm Testing Trophy (Kent C. Dodds)

## Stage 1 — Unit Testing
- [ ] Scaffold `apps/api` (NestJS, pnpm) và `apps/web` (Next.js client-side, pnpm)
- [ ] NestJS: viết `TaskService` với rule nghiệp vụ (chống trùng tên, chỉ owner xoá được)
- [ ] NestJS: unit test `TaskService` bằng Jest, mock `TaskRepository` qua `overrideProvider`
- [ ] Next.js: setup Vitest + React Testing Library
- [ ] Next.js: unit test component `TaskItem` (trạng thái done/pending)
- [ ] Next.js: unit test 1 custom hook validate form

## Stage 2 — Integration Testing
- [ ] Setup Testcontainers cho PostgreSQL trong backend test suite
- [ ] Viết integration test cho `POST /tasks` bằng Supertest (request thật → assert response +
      query DB thật trong container để verify)
- [ ] Setup MSW cho frontend test suite
- [ ] Integration test flow "submit form tạo task → gọi API → hiển thị task mới" với MSW mock
      NestJS endpoint

## Stage 3 — E2E Testing
- [ ] Setup Playwright trong repo
- [ ] Viết kịch bản E2E: đăng nhập → tạo task → đánh dấu done → logout (chạy FE+BE local)

## Stage 4 — Automation & CI
- [ ] Viết GitHub Actions workflow chạy unit test (api + web)
- [ ] Thêm job integration test (Testcontainers/Docker-in-Docker trên GitHub runner)
- [ ] Thêm job E2E Playwright trên CI
- [ ] Setup coverage report + badge trong README

## Stage 5 — Deploy + Production Smoke Test
- [ ] Deploy `apps/web` lên Vercel (free tier)
- [ ] Deploy `apps/api` lên Render (free tier)
- [ ] Setup Postgres production trên Neon hoặc Supabase (free tier)
- [ ] Viết Playwright smoke test nhắm vào URL production

## Stage 6 — Nâng cao (tuỳ chọn)
- [ ] Test data factories (`@faker-js/faker`)
- [ ] Contract testing (Pact)
- [ ] Mutation testing (Stryker)
- [ ] Visual regression (Playwright screenshot)
- [ ] Load test (k6)

---

## Log

### 2026-10-14
- Chốt learning path đầy đủ (6 stages) cùng user qua trao đổi với Claude.
- Quyết định kỹ thuật đã chốt: `apps/api` + `apps/web` (không Turborepo/Nx), pnpm, PostgreSQL
  qua Testcontainers ở Stage 2 backend, Next.js chỉ client-side (không route handler/server
  action), Playwright production smoke test ở Stage 5.
- Tạo `CLAUDE.md` + `PROGRESS.md`, khởi tạo git repo. Chưa scaffold code `apps/api`/`apps/web`
  — việc này sẽ là milestone đầu tiên của Stage 1 ở session học tiếp theo.
