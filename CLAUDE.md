# testing-learning-projects

## Mục đích repo

Đây là repo học tập cá nhân của một Software Engineer (không phải Test Engineer/QA) để học
testing từ cơ bản đến production-grade: Unit test, Integration test, E2E test, Automation (CI).
Người học đã vững Next.js và NestJS, nên learning path tập trung 100% vào kỹ năng testing,
không dạy lại framework cơ bản.

**Ranh giới vai trò quan trọng:** luôn giữ scope ở mức SWE — viết/maintain unit, integration,
e2e automation script, CI pipeline. KHÔNG lấn sang: test case management, manual/exploratory
testing, test plan documents — đó là việc của QA, ngoài phạm vi learning path này.

## Dự án hands-on xuyên suốt: "Mini Task Manager"

- Backend: NestJS API (auth + CRUD task)
- Frontend: Next.js — **chỉ đóng vai trò client-side (SPA-like)**, gọi thẳng NestJS API qua
  fetch/axios. KHÔNG dùng Next.js Route Handlers, KHÔNG dùng Server Actions. Toàn bộ server-side
  logic nằm ở NestJS.
- Database: PostgreSQL

## Quyết định cấu trúc repo (đã chốt cùng user)

- Cấu trúc: `apps/api` (NestJS) + `apps/web` (Next.js) — flat, không dùng Turborepo/Nx (lý do:
  mục tiêu là học testing, không phải học monorepo tooling; lợi ích cache/orchestration của
  Turborepo/Nx không đáng kể ở quy mô 2 app không share code).
- Package manager: **pnpm** (pnpm workspace đơn giản, không cần tool monorepo riêng).
- Git: đã `git init` ngay từ giai đoạn tracking-file, trước cả khi scaffold code. Lịch sử commit
  cũng đóng vai trò một dạng progress log bổ sung cho `PROGRESS.md`.
- `apps/api` (NestJS 12, Vitest + Supertest sẵn trong devDependencies) và `apps/web`
  (Next.js 16 App Router, React 19, Tailwind 4, ESLint) đã được scaffold và gộp vào 1 pnpm
  workspace duy nhất ở root (`pnpm-workspace.yaml`, 1 lockfile chung, không có node_modules/
  lockfile riêng trong từng app). Chạy test: `pnpm --filter api test`, lint web:
  `pnpm --filter web lint`.

## Cách Claude Code agent nên hành xử trong các session tiếp theo

1. Luôn đọc `PROGRESS.md` trước để biết đang ở Stage nào, milestone nào đã xong.
2. Tiếp tục đúng từ milestone đầu tiên CHƯA tick trong `PROGRESS.md` — không nhảy cóc, không
   lặp lại phần đã xong trừ khi user yêu cầu ôn lại.
3. Dạy + code cùng user theo kiểu hands-on: giải thích ngắn gọn khái niệm trước, sau đó cùng
   viết code thật trong repo (không chỉ show snippet trong chat).
4. Sau khi một milestone hoàn thành, **cập nhật `PROGRESS.md` ngay lập tức, không đợi user
   nhắc**: tick checkbox của milestone đó, và gộp thêm log entry (hoặc update log entry của
   ngày hiện tại) khi có cột mốc đáng chú ý trong session. Áp dụng cho cả milestone code
   (test chạy pass, setup xong) LẪN milestone lý thuyết (Stage 0: mỗi khi user trả lời đúng
   câu hỏi Q&A về 1 khái niệm, tick checkbox khái niệm đó ngay, không chờ hết cả Stage 0 hay
   chờ user yêu cầu).
5. Trước khi chuyển sang Stage kế tiếp, xác nhận lại với user rằng Stage hiện tại đã đủ vững
   (không bắt buộc 100% hoàn hảo, nhưng checklist chính phải pass).
6. Khi user bắt đầu session mới và nói kiểu "tiếp tục học đi" mà không nói rõ stage nào — mặc
   định tiếp tục từ milestone đầu tiên chưa tick trong `PROGRESS.md`.

## Learning Path đã chốt

### Stage 0 — Tư duy nền tảng (không code)
- Testing Pyramid (Unit nhiều/nhanh/rẻ → Integration vừa → E2E ít/chậm/đắt), tỷ lệ gợi ý ~70/20/10
- Test Double: mock/stub/spy/fake
- AAA pattern (Arrange-Act-Assert)
- Test coverage: vì sao không nên target 100%
- Flaky test là gì, vì sao nguy hiểm
- Testing Trophy (Kent C. Dodds) — góc nhìn hiện đại hơn cho full-stack dev

### Stage 1 — Unit Testing
- Backend (NestJS, **Vitest** — lưu ý: `@nestjs/cli` bản hiện tại scaffold mặc định Vitest,
  không phải Jest như tài liệu NestJS cũ hay nói; test script vẫn tương thích gần như 1:1 vì
  dùng chung API `describe/it/expect`): unit test service layer (business logic thuần),
  mock dependency bằng `Test.createTestingModule` + `overrideProvider`
  - Hands-on: `TaskService` với rule "không tạo task trùng tên", "chỉ owner mới xoá được task"
- Frontend (Next.js, Vitest + React Testing Library): test theo hành vi user thấy được, không
  test implementation detail
  - Hands-on: test component `TaskItem` (hiển thị trạng thái done/pending), test 1 custom hook
    validate form

### Stage 2 — Integration Testing
- Backend: Supertest + NestJS `TestingModule`, DB thật là **PostgreSQL qua Testcontainers**
  (dùng Docker thật trên máy user, không dùng SQLite in-memory) — test full flow
  controller → service → DB
  - Hands-on: test `POST /tasks` — request thật, assert response + assert DB có record mới
    (query trực tiếp DB trong Testcontainer để verify)
- Frontend: vì Next.js chỉ là client-side thuần (không route handler/server action), integration
  test ở đây nghĩa là test nhiều unit phối hợp thật trong trình duyệt ảo (component + hook +
  API client) với network boundary được mock bằng **MSW**, giả lập response thật của NestJS API
  - Hands-on: test flow "submit form tạo task → gọi API → hiển thị task mới trong list" với
    MSW intercept request tới NestJS endpoint

### Stage 3 — E2E Testing
- Công cụ: Playwright (chạy cả FE + BE thật trên máy local)
- Locator strategy ưu tiên `getByRole`/`getByText`, test data setup/teardown
- Hands-on: kịch bản "đăng nhập → tạo task → đánh dấu done → logout" chạy trên app thật

### Stage 4 — Automation & CI
- GitHub Actions: workflow chạy unit test, integration test (service Postgres hoặc
  Testcontainers trong CI runner — cần Docker-in-Docker support của GitHub-hosted runner),
  e2e Playwright
- Coverage report (Vitest/Jest `--coverage`), badge "build passing" trong README

### Stage 5 — Deploy + Production Smoke Test
- Deploy `apps/web` lên **Vercel** free tier, `apps/api` lên **Render** free tier,
  Postgres production lên **Neon** hoặc **Supabase** free tier
- Viết thêm 1 Playwright test **nhắm thẳng vào URL production** (smoke test) — xác nhận app
  thật hoạt động sau khi deploy, kỹ năng rất thực tế trong công việc thật

### Stage 6 — Nâng cao (tuỳ chọn, chọn lọc theo nhu cầu thực tế)
- Test data factories (`@faker-js/faker`)
- Contract testing (Pact) — khi FE/BE tách team
- Mutation testing (Stryker) — kiểm tra test suite có thực sự bắt được bug không
- Visual regression (Playwright screenshot testing)
- Load test (k6)

## Xem tiến độ chi tiết

Xem `PROGRESS.md` để biết milestone nào đã xong, đang làm, log theo ngày.
