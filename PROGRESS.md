# Learning Progress

> Checklist tiến độ cho learning path testing. Claude Code agent: đọc file này đầu mỗi session,
> tiếp tục từ milestone đầu tiên chưa tick (`[ ]`). Sau khi hoàn thành milestone, tick và thêm
> log entry bên dưới trước khi kết thúc session. Xem `CLAUDE.md` cho context đầy đủ của repo.

**Stage hiện tại:** Stage 1 — Unit Testing
**Cập nhật lần cuối:** 2026-10-15

---

## Stage 0 — Tư duy nền tảng (không code)
- [x] Hiểu Testing Pyramid + tỷ lệ 70/20/10
- [x] Hiểu Test Double: mock/stub/spy/fake, phân biệt được khi nào dùng loại nào
- [x] Hiểu AAA pattern
- [x] Hiểu vì sao coverage 100% không phải mục tiêu
- [x] Hiểu flaky test là gì, tác hại
- [x] Đọc qua khái niệm Testing Trophy (Kent C. Dodds)

## Stage 1 — Unit Testing
- [x] Scaffold `apps/api` (NestJS, pnpm) và `apps/web` (Next.js client-side, pnpm)
- [x] NestJS: viết `TaskService` với rule nghiệp vụ (chống trùng tên, chỉ owner xoá được)
- [x] NestJS: unit test `TaskService` bằng Vitest, mock `TaskRepository` qua `useValue` (stub)
- [x] Next.js: setup Vitest + React Testing Library
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

### 2026-10-15 (Vitest + RTL setup cho apps/web)
- Cài `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`,
  `@testing-library/jest-dom`, `@testing-library/user-event`, `@vitest/coverage-v8` vào
  `apps/web` (devDependencies).
- Tạo `apps/web/vitest.config.mts` (environment `jsdom`, `tsconfigPaths` resolve alias `@/*`
  giống style `apps/api/vitest.config.ts`, `globals: true`, include `src/**/*.spec.{ts,tsx}`).
  Dùng đuôi `.mts` để tránh warning ESM-in-CJS (web chưa có `"type": "module"` trong
  `package.json`, khác api).
- Tạo `apps/web/vitest.setup.ts` import `@testing-library/jest-dom/vitest` (matcher
  `toBeInTheDocument` v.v.).
- Thêm script `test`/`test:watch`/`test:cov` vào `apps/web/package.json`.
- Verify bằng 1 sanity test tạm (render `<p>hello</p>`, assert `toBeInTheDocument`) → pass,
  sau đó xoá vì không phải test case thật của app.
- Next milestone: unit test component `TaskItem` (trạng thái done/pending) — cần viết component
  này trước vì `apps/web/src/app` hiện chỉ có page mặc định từ `create-next-app`.

### 2026-10-15 (TaskService unit test)
- Viết `TaskService` (`apps/api/src/tasks/`): entity `Task`, abstract `TaskRepository` (DI token,
  chưa có implementation thật — Stage 2 mới cài Postgres), `createTask` (chống trùng title
  trong phạm vi cùng 1 owner, throw `ConflictException`), `deleteTask` (throw `NotFoundException`
  nếu task không tồn tại, `ForbiddenException` nếu requester không phải owner).
- Viết `tasks.service.spec.ts`: 5 test case mới (2 cho createTask, 3 cho deleteTask), dùng
  `Test.createTestingModule` + `useValue` stub cho `TaskRepository` (đúng là stub, không phải
  mock, vì chỉ control giá trị trả về — có 1 chỗ dùng `toHaveBeenCalledWith`/`not.toHaveBeenCalled`
  để verify side-effect, đó là phần mang tính "mock" của cùng 1 object double).
- Verify: `pnpm --filter api test` → 6/6 pass (bao gồm 1 stub test mặc định cũ).
- Next milestone: Next.js — setup Vitest + React Testing Library.

### 2026-10-15 (scaffold)
- Cài pnpm global (npm i -g pnpm, v12.11.2) vì máy chưa có sẵn.
- Scaffold `apps/api` bằng `@nestjs/cli` (NestJS 12). **Lưu ý quan trọng:** bản CLI hiện tại
  mặc định dùng **Vitest**, không phải Jest — đã cập nhật `CLAUDE.md` phản ánh đúng thực tế
  này. `@nestjs/testing` + `supertest` đã có sẵn trong devDependencies, sẵn sàng cho Stage 2.
- Scaffold `apps/web` bằng `create-next-app` (Next.js 16, React 19, App Router, Tailwind 4,
  ESLint, src dir, import alias `@/*`).
- Gộp 2 app vào 1 pnpm workspace duy nhất ở root (xoá node_modules/lockfile lẻ trong từng app,
  `pnpm install` lại từ root) — 1 lockfile chung.
- Verify: `pnpm --filter api test` pass (1/1, stub test mặc định), `pnpm --filter web lint`
  pass không lỗi.
- Next milestone: viết `TaskService` (NestJS) với rule nghiệp vụ thật + unit test.

### 2026-10-15 (tiếp)
- **Stage 0 hoàn thành toàn bộ** (6/6 khái niệm) qua Q&A: Testing Pyramid, Test Double
  (phân biệt rõ stub vs mock), AAA pattern (hiểu đúng lý do bọc Act trong arrow function —
  để expect tự kiểm soát việc gọi hàm và bắt exception, không liên quan timing/async), coverage
  100% không phải mục tiêu (giới thiệu Mutation Testing/Stryker làm thước đo khách quan hơn),
  Flaky test (hiểu auto-waiting của Playwright giảm flaky do timing), Testing Trophy (xác nhận
  learning path này nghiêng Testing Trophy — ưu tiên đầu tư integration test, khớp với thiết kế
  Stage 2 dùng Testcontainers Postgres + MSW network boundary).
- Chuyển sang Stage 1 — Unit Testing. Milestone đầu tiên: scaffold `apps/api` (NestJS) +
  `apps/web` (Next.js client-side) bằng pnpm.

### 2026-10-15
- Inspect project thật `internship` (client Next.js + server NestJS/DynamoDB): xác nhận chưa
  có testing/CI nào, đánh giá là ứng viên tốt để áp dụng learning path sau khi vững ở
  Mini Task Manager (lưu ý: DB là DynamoDB, không phải Postgres — Stage 2 integration test
  khi áp dụng vào đây cần đổi Testcontainers Postgres → DynamoDB Local/aws-sdk-client-mock).
- Stage 0 Q&A: đã học xong Testing Pyramid (ví dụ áp dụng: race condition trừ stock nên test
  ở tầng integration vì cần DB thật xử lý concurrency, mock không tạo ra race condition được)
  và Test Double (phân biệt được stub vs mock: stub chỉ control giá trị trả về, mock còn
  assert cách hàm được gọi).

### 2026-10-14
- Chốt learning path đầy đủ (6 stages) cùng user qua trao đổi với Claude.
- Quyết định kỹ thuật đã chốt: `apps/api` + `apps/web` (không Turborepo/Nx), pnpm, PostgreSQL
  qua Testcontainers ở Stage 2 backend, Next.js chỉ client-side (không route handler/server
  action), Playwright production smoke test ở Stage 5.
- Tạo `CLAUDE.md` + `PROGRESS.md`, khởi tạo git repo. Chưa scaffold code `apps/api`/`apps/web`
  — việc này sẽ là milestone đầu tiên của Stage 1 ở session học tiếp theo.
