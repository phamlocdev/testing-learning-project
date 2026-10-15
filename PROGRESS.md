# Learning Progress

> Checklist tiến độ cho learning path testing. Claude Code agent: đọc file này đầu mỗi session,
> tiếp tục từ milestone đầu tiên chưa tick (`[ ]`). Sau khi hoàn thành milestone, tick và thêm
> log entry bên dưới trước khi kết thúc session. Xem `CLAUDE.md` cho context đầy đủ của repo.

**Stage hiện tại:** Stage 2 — Integration Testing (hoàn thành, chờ xác nhận chuyển Stage 3)
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
- [x] Next.js: unit test component `TaskItem` (trạng thái done/pending)
- [x] Next.js: unit test 1 custom hook validate form

## Stage 2 — Integration Testing
- [x] Setup Testcontainers cho PostgreSQL trong backend test suite
- [x] Viết integration test cho `POST /tasks` bằng Supertest (request thật → assert response +
      query DB thật trong container để verify)
- [x] Setup MSW cho frontend test suite
- [x] Integration test flow "submit form tạo task → gọi API → hiển thị task mới" với MSW mock
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

### 2026-10-15 (TasksController CRUD + Supertest integration test)
- **Quyết định đổi hướng so với milestone gốc (chỉ `POST /tasks`):** user đặt câu hỏi tại sao
  cần cả `prisma-task.repository.e2e-spec.ts` (test tầng repository riêng) lẫn Supertest test
  tầng HTTP — nhận ra `TaskRepository` không có business logic riêng (logic nằm ở
  `TaskService`, đã unit test ở Stage 1), nên giữ cả 2 tầng test là trùng lặp coverage không
  cần thiết. User chọn: xoá file repository-level test, build **đủ 4 endpoint CRUD**
  (POST/GET list/GET detail/DELETE) vì nghĩ rằng client thật sẽ cần dùng cả 4 trong tương lai,
  và dùng Supertest cover toàn bộ qua đường HTTP thật (tự nhiên cover luôn cả 4 method của
  repository, không cần test tầng repository riêng nữa).
- Mở rộng `TaskRepository` (thêm `findAllByOwner`), `PrismaTaskRepository`, `TaskService`
  (thêm `getTask` ném `NotFoundException` nếu không tồn tại, `listTasks` trả tasks theo
  owner) + unit test tương ứng trong `tasks.service.spec.ts` (mock/stub quen thuộc từ Stage 1).
- Viết `TasksController` (`POST /tasks`, `GET /tasks?ownerId=`, `GET /tasks/:id`,
  `DELETE /tasks/:id?requesterId=`) + `TasksModule` (wiring `PrismaTaskRepository` làm
  implementation thật của `TaskRepository` qua DI token), import vào `AppModule`. Exception
  nghiệp vụ (`ConflictException`/`NotFoundException`/`ForbiddenException`) tự động map sang
  đúng HTTP status (409/404/403) nhờ NestJS exception filter mặc định, không cần code thêm.
- **Sự cố kỹ thuật phát sinh khi wiring qua NestJS DI (đã xử lý):** `PrismaService` ban đầu
  nhận `connectionString: string` qua constructor param để test có thể trỏ DB động — nhưng khi
  để NestJS tự dựng qua DI (`TasksModule` → `AppModule`) thay vì gọi `new PrismaService(...)`
  thủ công như ở file test cũ, NestJS cố resolve param đó như 1 injection token và lỗi (kiểu
  nguyên thủy `string` không phải provider token hợp lệ). Sửa: bỏ constructor param, đọc thẳng
  `process.env.DATABASE_URL` bên trong constructor; test set biến môi trường này **trước khi**
  gọi `Test.createTestingModule({ imports: [AppModule] }).compile()`.
- Xoá `prisma-task.repository.e2e-spec.ts`, thay bằng
  `apps/api/test/tasks.e2e-spec.ts`: dựng Nest app đầy đủ (`AppModule`) + Testcontainers
  Postgres thật, test qua Supertest cho cả 4 endpoint — tạo task, 409 khi trùng title/owner,
  list đúng task theo owner, lấy chi tiết + 404 khi không tồn tại, xoá + 404 sau khi xoá +
  403 khi không phải owner.
- Verify: `pnpm --filter api test` (unit) → 9/9 pass (thêm 3 test case cho `getTask`/
  `listTasks`), `pnpm --filter api test:e2e` → 9/9 pass (8 test case HTTP mới + 1 app e2e có
  sẵn), không còn container Postgres nào sót lại sau khi chạy xong.
- **Fix phát sinh sau khi IDE báo lỗi build (đã xử lý):**
  1. `isolatedModules` + `emitDecoratorMetadata`: `CreateTaskDto`/`Task` chỉ là type (interface)
     nhưng được dùng trong tham số decorator (`@Body()`/`@Param()`) — TypeScript không emit
     được runtime metadata cho type-only import thường, phải đổi sang `import type`.
  2. `nest build` dùng `tsconfig.build.json` với `rootDir: "./src"`, nhưng Prisma Client lúc
     đầu generate ra `apps/api/generated/prisma` (ngoài `src/`) → lỗi TS6059. Đổi
     `output` trong `schema.prisma` thành `../src/generated/prisma`, cập nhật `.gitignore`
     tương ứng.
  3. Lộ ra bug thật khi sửa (2): path import trong `prisma.service.ts` bị lệch 1 cấp
     (`../../generated/prisma/client.js` phải sửa thành `../generated/prisma/client.js`).
  - Verify lại: `pnpm --filter api build` sạch, `pnpm --filter api lint` pass, unit 9/9 +
    integration 9/9 vẫn pass sau các fix.
- **Stage 2 backend hoàn thành 2/2 milestone.** Next milestone: Setup MSW cho frontend test
  suite.

### 2026-10-15 (Env setup cho local dev — không thuộc checklist nhưng cần để chạy `start:dev`)
- **Lý do:** chạy thử `pnpm --filter api start:dev` thật (ngoài test suite) bị
  `PrismaClientKnownRequestError: ECONNREFUSED` — vì `main.ts` chưa load `.env` nên
  `process.env.DATABASE_URL` là `undefined` lúc runtime (test suite không bị ảnh hưởng vì tự
  set biến này thủ công trước khi compile module).
- Cài `dotenv`, thêm `import 'dotenv/config';` làm dòng đầu tiên `apps/api/src/main.ts`
  (phải đứng trước mọi import khác để biến môi trường có sẵn khi NestJS khởi tạo provider).
- Thêm `PORT=3001` vào `.env` của `apps/api` (đổi khỏi mặc định 3000 vì `apps/web` dev server
  của Next.js cũng mặc định dùng cổng 3000 — tránh xung đột).
- Tạo `.env.example` (commit vào git) cho cả `apps/api` và `apps/web`, làm template cho
  `.env`/`.env.local` thật (gitignored). `apps/web/.gitignore` sẵn có pattern `.env*` quét luôn
  cả `.env.example` — đã thêm dòng `!.env.example` để exception file này được track.
  `apps/web/.env.local` thêm `NEXT_PUBLIC_API_URL` trỏ sang `apps/api` (dùng cho milestone MSW
  sắp tới, tránh hardcode base URL khi viết API client).
- Thêm `docker-compose.yml` ở root — Postgres **bền** (persistent qua volume) riêng cho local
  dev, khác hẳn Testcontainers (ephemeral, chỉ sống trong lúc chạy test). Chạy
  `docker compose up -d` 1 lần, dữ liệu giữ nguyên qua các lần restart.
- Verify: `docker compose up -d` → `prisma migrate deploy` → `pnpm --filter api start:dev` →
  `POST /tasks` qua `curl` trả về task thật, lưu đúng vào Postgres dev. Unit (9/9) + integration
  (9/9) test vẫn pass sau khi thêm `dotenv` dependency.

### 2026-10-15 (MSW setup + integration test flow tạo task — hoàn thành Stage 2)
- Cài `msw`. Viết `apps/web/src/mocks/handlers.ts` (mock `POST {API_BASE_URL}/tasks` trả về
  task giả) + `apps/web/src/mocks/server.ts` (`setupServer` từ `msw/node`), wire vào
  `vitest.setup.ts` (`server.listen`/`resetHandlers`/`close` qua `beforeAll`/`afterEach`/
  `afterAll`) — network boundary giữa web và NestJS API được mock hoàn toàn trong test, không
  gọi ra ngoài thật.
- Viết `apps/web/src/lib/api/tasks.ts`: `createTask()` gọi `fetch` thẳng tới NestJS API (đúng
  kiến trúc client-side thuần đã chốt trong `CLAUDE.md`, không qua Route Handler/Server
  Action), đọc base URL từ `NEXT_PUBLIC_API_URL` (fallback `http://localhost:3001` để test
  chạy được mà không cần load `.env.local` vào Vitest).
- Viết `CreateTaskForm` (tái dùng `useTaskTitleForm` từ Stage 1 để validate title) và
  `TaskList` (giữ state danh sách task, render `TaskItem` cho mỗi task) — đúng tinh thần
  "nhiều unit phối hợp thật trong trình duyệt ảo" của integration test frontend.
- Viết `TaskList.spec.tsx`: 3 test case cho flow "submit form tạo task → gọi API (MSW
  intercept) → hiển thị task mới trong list", input tự clear sau khi tạo, và validate lỗi
  (title rỗng) không gọi API/không thêm task vào list.
- Verify: `pnpm --filter web test` → 13/13 pass (4 TaskItem + 6 hook + 3 integration mới).
- **Stage 2 hoàn thành toàn bộ 4/4 milestone** (2 backend + 2 frontend). Chờ user xác nhận
  trước khi chuyển sang Stage 3 — E2E Testing (Playwright).

### 2026-10-15 (Testcontainers Postgres setup — Stage 2 bắt đầu)
- Chọn **Prisma** làm query layer cho `TaskRepository` (quyết định cùng user, có cân nhắc
  `pg` raw SQL / TypeORM nhưng user ưu tiên Prisma).
- **Sự cố khi cài đặt, đã xử lý:** package `prisma` (CLI) có dist-tag `latest` trỏ vào bản
  **release candidate 8.0.0-rc.22** (sản phẩm "Prisma Platform" mới — Composer/Compute/cloud
  hosting, không phải ORM self-hosted cổ điển), gây mismatch major với `@prisma/client` (bản
  stable `7.10.0`, dist-tag `prev`). Đã pin cả 2 package về đúng `7.10.0` (stable, khớp nhau).
  **Lưu ý cho tương lai:** khi thêm dependency Prisma, luôn kiểm tra dist-tag thật
  (`npm view prisma dist-tags`) thay vì tin `^latest`, vì Prisma đang trong giai đoạn chuyển
  sang kiến trúc Platform mới và đẩy bản RC lên `latest` sớm.
- `prisma init` (bản 7.10.0 không preview feature) tự động cài thêm ~60 file "agent skill"
  (tài liệu cho AI agent, hợp lệ nhưng không cần) vào `.claude/skills/`, `.windsurf/skills/`,
  `.agents/skills/` + `skills-lock.json` — đã xoá, dùng flag `--no-skills` lần sau nếu init lại.
- Prisma 7 **bắt buộc driver adapter** (không còn Rust query engine ngầm định như Prisma
  5/6) — cài thêm `@prisma/adapter-pg` + `pg`. `PrismaService` (`apps/api/src/prisma/`) nhận
  `connectionString` qua constructor, dùng `new PrismaPg({ connectionString })` — đây chính là
  điểm mấu chốt giúp test trỏ PrismaClient vào Postgres động của Testcontainers thay vì URL cố
  định trong `.env`.
- Định nghĩa `model Task` trong `prisma/schema.prisma` (khớp entity `Task` hiện có), tạo
  migration đầu tiên (`prisma/migrations/20261015025151_init`) bằng cách dựng tạm 1 container
  Postgres qua `docker run` (không phải Testcontainers — chỉ để generate SQL migration 1 lần),
  chạy `prisma migrate dev --name init`, rồi xoá container tạm.
- Viết `PrismaTaskRepository` (`apps/api/src/tasks/prisma-task.repository.ts`) implement đúng
  `TaskRepository` abstract class bằng Prisma Client thật.
- Cài `@testcontainers/postgresql`. Viết
  `apps/api/test/prisma-task.repository.e2e-spec.ts`: `beforeAll` dựng
  `PostgreSqlContainer('postgres:16-alpine')` qua Testcontainers, chạy `prisma migrate deploy`
  (shell ra qua `execSync`, trỏ `DATABASE_URL` vào connection string của container) để áp
  schema thật, rồi mới chạy 4 test case CRUD thật (create+findById, findByTitleAndOwner tìm
  thấy/không thấy, delete) qua Prisma Client nói chuyện với Postgres thật trong container.
  `afterAll` disconnect + stop container — verify không còn container nào sót lại sau khi
  test xong.
- **Lưu ý cài đặt trên Windows:** cài `prisma`, `@testcontainers/postgresql` kéo theo vài
  native build script (`esbuild`, `@prisma/engines`, `ssh2`, `cpu-features`, `protobufjs`) bị
  pnpm chặn mặc định — approve qua `allowBuilds` trong `pnpm-workspace.yaml` (không dùng
  `pnpm approve-builds` vì cần TTY tương tác, không chạy được trong agent). `ssh2`'s optional
  native crypto binding build fail do thiếu Visual Studio Build Tools — không sao vì
  Testcontainers chỉ cần ssh2 khi tunnel Docker qua SSH, không áp dụng cho Docker Desktop local.
- Verify: `pnpm --filter api test:e2e` → 5/5 pass (4 integration test mới + 1 app e2e có sẵn),
  `pnpm --filter api test` (unit) vẫn 6/6 pass.
- Next milestone: viết `TasksController` + `TasksModule` wiring `PrismaTaskRepository`, rồi
  integration test `POST /tasks` bằng Supertest (request thật qua HTTP → assert response +
  query DB thật trong container để verify).

## Log

### 2026-10-15 (custom hook validate form unit test — hoàn thành Stage 1)
- Viết `apps/web/src/hooks/useTaskTitleForm.ts`: hook validate title của form tạo task
  (required, không cho whitespace-only nhờ `trim()`), trả về `{ title, error, setTitle,
  validate }`; `setTitle` tự clear error cũ ngay khi user gõ lại.
- Viết `useTaskTitleForm.spec.ts`: 6 test case dùng `renderHook` + `act` từ
  `@testing-library/react` — state khởi tạo, cập nhật title, validate empty/whitespace-only
  (fail + set error), validate hợp lệ (pass + clear error), và error tự clear khi gõ lại.
- Verify: `pnpm --filter web test` → 10/10 pass (4 TaskItem + 6 hook mới).
- **Stage 1 — Unit Testing hoàn thành toàn bộ 6/6 milestone** (3 backend + 3 frontend). Chờ
  user xác nhận đã vững trước khi chuyển sang Stage 2 — Integration Testing (Testcontainers
  Postgres cho backend, MSW cho frontend).

### 2026-10-15 (TaskItem component unit test)
- Tạo `apps/web/src/types/task.ts`: type `Task` phía frontend, độc lập với entity `Task` của
  `apps/api` (repo không share code giữa 2 app theo quyết định flat structure trong
  `CLAUDE.md`).
- Viết `apps/web/src/components/TaskItem.tsx`: hiển thị title + checkbox phản ánh `task.done`
  (checked/unchecked), style `textDecoration: line-through` khi done, gọi
  `onToggleDone?.(task.id)` khi checkbox đổi trạng thái.
- Viết `TaskItem.spec.tsx`: 4 test case theo hành vi user thấy được (test qua
  `getByText`/`getByRole('checkbox')`, không test implementation detail như CSS class nội
  bộ) — render đúng title, checkbox unchecked khi pending, checked khi done, và
  `@testing-library/user-event` click checkbox gọi đúng `onToggleDone` với task id.
- Verify: `pnpm --filter web test` → 4/4 pass.
- Next milestone: unit test 1 custom hook validate form.

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
