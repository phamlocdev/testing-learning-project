# Learning Progress

> Checklist tiến độ cho learning path testing. Claude Code agent: đọc file này đầu mỗi session,
> tiếp tục từ milestone đầu tiên chưa tick (`[ ]`). Sau khi hoàn thành milestone, tick và thêm
> log entry bên dưới trước khi kết thúc session. Xem `CLAUDE.md` cho context đầy đủ của repo.

**Stage hiện tại:** Stage 4 — Automation & CI
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
- [x] Setup Playwright trong repo
- [x] Viết kịch bản E2E: đăng nhập → tạo task → đánh dấu done → logout (chạy FE+BE local)

## Stage 4 — Automation & CI
- [x] Viết GitHub Actions workflow chạy unit test (api + web)
- [x] Thêm job integration test (Testcontainers/Docker-in-Docker trên GitHub runner)
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

### 2026-10-15 (Fix bug: refresh trang bị văng về /login dù đã đăng nhập — bổ sung sau Stage 4 milestone 1)
- **Bug phát hiện qua testing thủ công (user báo):** sau khi login/register thành công, điều
  hướng đúng về `/` — nhưng F5 refresh thật lại bị bắn ngược về `/login` dù token vẫn còn hợp lệ
  trong `localStorage`.
- **Nguyên nhân:** race condition giữa 2 `useEffect`. `AuthProvider` (cha) đọc token từ
  `localStorage` trong `useEffect` riêng (vì `localStorage` chỉ truy cập được client-side, không
  đọc được lúc khởi tạo state trên server render). `Home` (`app/page.tsx`, con) cũng có
  `useEffect` check `if (!token) router.replace('/login')`. React chạy effect của **con trước
  cha** trong cùng 1 commit → lúc `Home` check, `token` vẫn là `null` (giá trị khởi tạo), chưa
  kịp hydrate từ `localStorage` → redirect nhầm trước khi `AuthProvider` kịp set token thật.
- **Fix:** thêm cờ `isInitialized` vào `AuthContext` (set `true` trong `finally` của effect đọc
  `localStorage`, dù tìm thấy token hay không). `Home` chỉ redirect khi `isInitialized === true
  && !token`, và render `null` (chờ) khi chưa `isInitialized` — tránh flash nội dung sai trước
  khi auth state ổn định.
- **Lưu ý:** unit test (RTL) không bắt được bug này vì không mô phỏng đúng thứ tự effect
  cha/con khi có flow routing + hydrate từ `localStorage` thật qua F5 — phải verify bằng tay
  trên browser thật mới thấy. Verify: `pnpm --filter web test` vẫn 20/20 pass (không regression),
  test thủ công trên browser xác nhận refresh giữ nguyên trạng thái đăng nhập.

### 2026-10-15 (Register page riêng + React Hook Form/Zod validation — bổ sung sau Stage 3)
- **Theo yêu cầu user:** tách `/login` và `/register` thành route riêng (trước đó gộp hết vào
  `/`), thêm trang đăng ký thật (trước đó bỏ qua vì kịch bản Stage 3 không cần), và chuyển
  validate form từ tay (`useState` + check thủ công) sang **React Hook Form + Zod**.
- Thêm `AuthContext.register()` (gọi `POST /auth/register` rồi tự động `login()`),
  `lib/validation/auth-schemas.ts` (Zod schema `loginSchema`/`registerSchema`, có
  `confirmPassword` + `.refine()` check khớp password, `password.min(8)`).
- `app/login/page.tsx`, `app/register/page.tsx` (route riêng, dùng chung `AuthPageLayout`).
  `app/page.tsx` (`/`) giờ redirect client-side sang `/login` nếu chưa có token
  (`useEffect` + `router.replace`) — đúng kiểu SPA-like, không dùng middleware/server redirect.
- `LoginForm`/`RegisterForm` viết lại dùng `useForm` + `zodResolver`, lỗi field hiển thị qua
  `errors.<field>.message` (vẫn giữ `role="alert"` để test không đổi query pattern).
- **3 bug/lesson phát hiện khi viết E2E test cho flow mới (đều đã xử lý):**
  1. Playwright's `getByLabel` mặc định match theo **substring**, khác với RTL (match
     exact) — `'Password'` khớp nhầm luôn `'Confirm password'`. Phải dùng
     `{ exact: true }` khi 2 label có quan hệ substring với nhau trên cùng 1 trang.
  2. Chạy Playwright đa luồng (`workers` mặc định > 1) khi nhiều test file share
     **chung 1** `next dev` + `nest start --watch` (qua `webServer` trong config) gây
     flaky do `next dev` compile-on-demand không chịu tải tốt dưới nhiều browser session
     đồng thời. Fix: set `workers: 1` trong `playwright.config.ts` — đánh đổi chấp nhận
     được ở quy mô học tập (vài test, không phải CI-scale).
  3. Next.js App Router tự chèn 1 `<div role="alert">` ẩn vào mọi trang (route announcer
     cho accessibility) — `getByRole('alert')` của Playwright khớp nhầm cả nó lẫn alert
     lỗi thật của mình (strict mode violation báo "resolved to 2 elements"). Fix: dùng
     `getByText(<nội dung lỗi>)` cụ thể thay vì role chung chung khi test E2E thật (RTL
     không bị ảnh hưởng vì không render runtime thật của Next, chỉ JSX thuần).
  4. (Nhỏ, không phải bug) nhầm matcher `toHaveTextContent` (jest-dom/RTL) sang Playwright
     — Playwright dùng `toContainText`/`toHaveText`. Hai hệ sinh thái test có API tương tự
     nhưng không hoán đổi được, dễ nhầm khi chuyển qua lại giữa unit test (RTL) và E2E
     test (Playwright) trong cùng 1 buổi code.
- Viết thêm `RegisterForm.spec.tsx` (4 test: đăng ký thành công, email trùng, password
  không khớp, password quá ngắn), 2 test case mới cho `LoginForm.spec.tsx` (email sai định
  dạng). Thêm `register.spec.ts` (Playwright, 3 test: điều hướng login↔register qua link,
  đăng ký thành công, đăng ký email trùng).
- Verify: web unit 20/20, web build sạch, Playwright 4/4 pass ổn định qua nhiều lần chạy liên
  tiếp, api unit 17/17 (không đổi).

### 2026-10-15 (Build auth + toggle-done, kịch bản E2E đầy đủ — hoàn thành Stage 3)
- **Quyết định cùng user:** để viết được kịch bản E2E đầy đủ, build đủ auth cơ bản + toggle-done
  thay vì đơn giản hoá kịch bản hay dùng auth giả — theo đúng quy trình feature + test đã dùng
  xuyên suốt learning path.

**Backend — toggle-done:**
- Thêm `setDone(id, done)` vào `TaskRepository`/`PrismaTaskRepository`, `setTaskDone()` vào
  `TaskService` (check ownership giống `deleteTask`, ném `NotFoundException`/`ForbiddenException`).
- Thêm `PATCH /tasks/:id` vào `TasksController`. Unit test (3 case) + integration test (3 case).

**Backend — auth:**
- Thêm `model User` vào `prisma/schema.prisma` (migration `add_user`), `UserRepository`/
  `PrismaUserRepository` theo đúng port-adapter pattern đã dùng cho `Task`.
- Cài `bcryptjs` (pure JS, tránh native build fail như `ssh2`/`cpu-features` trên Windows đã
  gặp) + `@nestjs/jwt`. `AuthService.register()` hash password (bcrypt, 10 salt rounds),
  `login()` verify password + ký JWT (`sub`, `email`, hết hạn 1h). Unit test dùng
  `JwtModule.register({ secret: 'test-secret' })` thật (không mock JWT) + mock `UserRepository`.
- `JwtAuthGuard` tự viết thủ công (đọc header `Authorization: Bearer`, verify qua
  `JwtService.verifyAsync`, gắn `request.user`) — **không dùng `@nestjs/passport`** để giảm
  dependency surface, đủ cho mục đích học (không cần multi-strategy auth).
- `AuthController` (`POST /auth/register`, `POST /auth/login`), `CurrentUser` decorator lấy
  user từ request. Thêm `JWT_SECRET` vào `.env`/`.env.example`.
- **Refactor `TasksController`:** áp `@UseGuards(JwtAuthGuard)` ở class, bỏ `ownerId`/
  `requesterId` khỏi DTO body — lấy thẳng từ `@CurrentUser()` (JWT), không còn tin client gửi
  owner tuỳ ý. Viết lại toàn bộ `tasks.e2e-spec.ts` (register+login user thật qua API trong mỗi
  test, đính JWT vào header) + `auth.e2e-spec.ts` mới (register/login flow, 409 trùng email,
  401 sai password).
- Verify: unit 17/17, integration 18/18 (3 file: app/auth/tasks), lint + build sạch.

**Frontend — auth + toggle-done UI:**
- `lib/api/auth.ts` (`loginUser`), `lib/auth/decode-jwt.ts` (decode payload JWT thuần, không
  verify — server đã verify, client chỉ cần đọc claim để hiển thị), `AuthContext` (lưu token
  vào `localStorage`, derive `user` từ token, expose `login`/`logout`).
- **Quyết định kiến trúc:** `TaskList`/`CreateTaskForm` nhận `token` qua **prop tường minh**
  thay vì tự đọc `useAuth()` bên trong — giữ nguyên dễ test như thiết kế cũ (không cần bọc
  `AuthProvider` giả trong mỗi test component), đúng tinh thần tách UI con khỏi global state.
  Không build trang đăng ký (register) UI vì kịch bản Stage 3 không cần — user test E2E được
  seed thẳng qua API, giống thực tế hay làm (test data setup qua API, không qua UI cho phần
  không phải trọng tâm kịch bản).
- `lib/api/tasks.ts` đổi sang nhận `token` + gọi qua `authedFetch` (helper gắn header
  `Authorization`), thêm `listTasks()`/`setTaskDone()`. `TaskList` giờ fetch task thật lúc
  mount (`useEffect`) thay vì chỉ tích luỹ từ create, và wire `onToggleDone` gọi API thật.
- `LoginForm` + `page.tsx` hiển thị `LoginForm` hoặc `TaskList` tuỳ `user` từ `AuthContext`,
  thêm nút "Log out". `AuthProvider` wrap toàn app trong `layout.tsx`.
- **Bug phát hiện khi viết test (đã xử lý):** `localStorage` không tự reset giữa các test case
  trong cùng 1 file (jsdom giữ nguyên `window` qua suốt file) — test login thành công ở case 1
  làm case 2 đọc nhầm token cũ. Fix: `afterEach` trong `vitest.setup.ts` tự `localStorage.clear()`
  cho mọi test suite, không riêng gì auth.
- Cập nhật MSW handlers: thêm `POST /auth/login` (trả JWT giả tự chế qua `createFakeJwt()`,
  base64url-encode payload, không cần ký thật vì `decodeJwtPayload` chỉ đọc không verify),
  `GET /tasks` (trả `[]`), `PATCH /tasks/:id`.
- Viết `LoginForm.spec.tsx` (2 test: login thành công → `AuthContext` expose đúng user; login
  sai → hiển thị lỗi). Cập nhật `TaskList.spec.tsx` dùng `token` thay `ownerId`.
- Verify: `pnpm --filter web test` → 15/15 pass, build Next.js sạch.

**E2E — kịch bản đầy đủ:**
- Xoá `create-task.spec.ts` (smoke test cũ), thay bằng `login-and-manage-task.spec.ts`: seed
  user qua API trực tiếp (`fetch` tới `/auth/register`, không qua UI — đăng ký không phải
  trọng tâm kịch bản này), rồi Playwright lái UI thật: điền form login → tạo task → click
  checkbox đánh dấu done → click "Log out" → assert quay lại màn login.
- Verify: `npx playwright test` → pass ổn định 2 lần liên tiếp, không flaky.
- **Stage 3 — E2E Testing hoàn thành toàn bộ 2/2 milestone.** Toàn bộ regression suite xanh:
  api unit 17/17, api integration 18/18, web unit 15/15, Playwright E2E pass, lint + build cả
  2 app sạch. Chờ user xác nhận trước khi chuyển Stage 4 — Automation & CI.

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

### 2026-10-15 (Setup Playwright — Stage 3 bắt đầu)
- **Quyết định cấu trúc cùng user:** đặt Playwright ở package riêng `apps/e2e` (không thuộc
  `api` hay `web`) vì nó test cả 2 app chạy cùng lúc — khớp pattern `apps/*` sẵn có, không cần
  thêm Turborepo/Nx.
- **Gap đã nhận diện nhưng chưa xử lý (có chủ đích):** kịch bản E2E đầy đủ trong `CLAUDE.md`
  ("đăng nhập → tạo task → đánh dấu done → logout") cần **auth** và **toggle-done endpoint**
  — cả 2 đều chưa tồn tại ở backend lẫn frontend. User chọn "để Stage 3 tự xử lý lúc đến nơi"
  thay vì thêm milestone bridge ngay bây giờ. Milestone "Setup Playwright" vì vậy chỉ cần
  verify tooling hoạt động qua 1 flow đã có sẵn đầy đủ (tạo task), không phải kịch bản đầy đủ.
- Cài `@playwright/test@1.64.1` (kiểm tra dist-tag thật trước khi cài, theo đúng bài học từ sự
  cố Prisma RC ở Stage 2) + `npx playwright install chromium --with-deps`. pnpm tự thêm
  `minimumReleaseAgeExclude` vào `pnpm-workspace.yaml` cho các package Playwright (chính sách
  supply-chain mặc định của pnpm: chặn package publish quá gần đây).
- Viết `apps/e2e/playwright.config.ts`: `webServer` khởi động **cả 2** dev server
  (`pnpm --filter api start:dev` + `pnpm --filter web dev`) tự động khi chạy test, `cwd` phải
  trỏ về root repo (không phải `apps/e2e`) vì lệnh dùng `pnpm --filter`.
- **Gắn `TaskList` thật vào `apps/web/src/app/page.tsx`** (trước đó vẫn là trang mặc định của
  `create-next-app`, `TaskList`/`CreateTaskForm` mới chỉ tồn tại trong test Vitest+RTL, chưa có
  route thật nào render chúng).
- **Bug phát hiện khi render qua Next.js thật (đã xử lý):** `TaskList.tsx`/`CreateTaskForm.tsx`
  dùng `useState`/hook nhưng thiếu `'use client'` — Vitest+RTL không phân biệt Server/Client
  Component nên không bắt được lỗi này ở Stage 1/2, chỉ lộ ra khi gắn vào `app/page.tsx` thật
  (Server Component mặc định của App Router). Đã thêm `'use client'` vào cả 2 file.
  **Bài học:** unit/integration test qua RTL không thay thế được việc chạy app thật — đây
  chính xác là giá trị của Stage 3 E2E (test cả stack thật, bắt được lỗi integration giữa các
  tầng mà test ở mức thấp hơn không thấy).
- **Bug thứ 2 phát hiện (đã xử lý):** `POST /tasks` từ trình duyệt thật (`localhost:3000`) gọi
  sang API thật (`localhost:3001`) bị chặn do **CORS** — `apps/api/src/main.ts` chưa gọi
  `app.enableCors()`. Test suite Stage 2 (Supertest) không bắt được lỗi này vì Supertest gọi
  thẳng vào HTTP server, không đi qua cơ chế same-origin policy của trình duyệt.
- Viết `apps/e2e/tests/create-task.spec.ts`: mở trang thật, điền + submit form, assert task
  mới hiển thị — chạy qua **toàn bộ stack thật** (Next.js dev server + NestJS dev server +
  Postgres dev qua `docker-compose`), không mock gì cả. Dùng `Date.now()` trong title để tránh
  conflict 409 giữa các lần chạy test (Postgres dev persist dữ liệu qua volume, khác
  Testcontainers ephemeral).
- Verify: `npx playwright test` (trong `apps/e2e`) → pass 2 lần liên tiếp, không flaky.
- Next milestone: viết kịch bản E2E đầy đủ "đăng nhập → tạo task → đánh dấu done → logout" —
  cần build thêm auth + toggle-done trước (xem gap đã ghi ở trên).

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

### 2026-10-15 (Đổi tên job unit-test-web → test-web trong CI)
- **User hỏi:** vì sao không có job `integration-test-web` tương ứng `integration-test-api`?
- **Giải thích:** frontend không tách lệnh test riêng theo tầng như backend (`test` vs
  `test:e2e`) vì integration test frontend (Stage 2, vd `TaskList.spec.tsx`/
  `LoginForm.spec.tsx` — mock network qua MSW) không cần DB/Docker thật, cùng chạy qua Vitest,
  cùng đuôi file `*.spec.tsx` như unit test thuần (`TaskItem.spec.tsx`). Nên job
  `unit-test-web` cũ (chạy `pnpm --filter web test`) thực ra đã bao phủ cả unit lẫn integration
  test frontend — chỉ là tên gọi gây hiểu nhầm.
- Đổi tên job trong `.github/workflows/ci.yml` từ `unit-test-web` → `test-web` cho đúng bản chất
  (không tách job, vì không có lý do kỹ thuật để tách — khác hẳn backend phải tách vì
  integration test cần Testcontainers nặng/chậm hơn).

### 2026-10-15 (Thêm job integration test vào CI)
- Thêm job `integration-test-api` vào `.github/workflows/ci.yml`: giống hệt cấu trúc job
  `unit-test-api` (checkout → pnpm/action-setup → setup-node → install), chỉ khác lệnh cuối
  đổi sang `pnpm --filter api test:e2e`.
- **Lưu ý khái niệm quan trọng (khác với giả định ban đầu trong `CLAUDE.md`):** GitHub-hosted
  `ubuntu-latest` runner **đã có sẵn Docker daemon chạy natively trên host** (không phải
  nested-virtualization "Docker-in-Docker" thật sự cần cấu hình thêm) — Testcontainers chỉ cần
  nói chuyện thẳng với Docker socket có sẵn của host, không cần service container hay step setup
  Docker riêng. Vì vậy milestone này không cần thêm config gì ngoài việc đổi lệnh test, khác với
  suy nghĩ ban đầu rằng cần xử lý Docker-in-Docker phức tạp.
- Không cần secret/env nào thêm: test suite tự set `DATABASE_URL` trỏ vào Postgres container ephemeral
  do Testcontainers dựng runtime, và tự set `JWT_SECRET` riêng cho test — không đọc `.env`.
- Verify local (mô phỏng đúng lệnh CI sẽ chạy): `pnpm --filter api test:e2e` → 18/18 pass
  (3 file: app/auth/tasks e2e-spec), không container nào sót lại sau khi chạy xong.
- Next milestone: thêm job E2E Playwright trên CI.

### 2026-10-15 (GitHub Actions workflow cho unit test — Stage 4 bắt đầu)
- User xác nhận Stage 3 đã vững, chuyển sang Stage 4 — Automation & CI.
- Tạo `.github/workflows/ci.yml`: 2 job riêng `unit-test-api`/`unit-test-web`, trigger trên
  `push`/`pull_request` cho cả nhánh `main` lẫn `dev` (user có quy trình `feature → dev → main`,
  muốn CI chạy cả khi PR/push vào `dev`, không chỉ `main`). Mỗi job: `actions/checkout` →
  `pnpm/action-setup` →
  `actions/setup-node@v4` (Node 24, `cache: pnpm`) → `pnpm install --frozen-lockfile` →
  `pnpm --filter <api|web> test`.
- **Lý do tách job + chỉ chạy unit test ở milestone này:** unit test (Stage 1) không cần DB/
  network thật (api mock `TaskRepository`, web mock network qua MSW) nên chạy được ngay trên
  GitHub-hosted runner, không cần Docker. Integration test (Testcontainers) và E2E (Playwright)
  cần runner support Docker-in-Docker, để milestone riêng xử lý sau.
- Verify local (mô phỏng CI): `pnpm install --frozen-lockfile` rồi `pnpm --filter api test` →
  17/17 pass, `pnpm --filter web test` → 20/20 pass. (Build fail của `cpu-features`/`ssh2` lúc
  install là lỗi native addon tối ưu tuỳ chọn trên Windows, đã biết từ Stage 2, không ảnh hưởng
  test — GitHub-hosted runner dùng Ubuntu nên các addon optional này thường build được, không
  vấn đề gì tới workflow.)
- Next milestone: thêm job integration test (Testcontainers/Docker-in-Docker trên GitHub
  runner).
- **Bug phát hiện khi verify thật trên GitHub Actions (đã xử lý):** push thử lên GitHub, cả 2
  job fail ngay ở bước `pnpm/action-setup@v4` — `Error: No pnpm version is specified`. Nguyên
  nhân: repo không có `package.json` ở root (chỉ có `pnpm-workspace.yaml` + app con), nên
  action không tìm được field `packageManager` để biết version pnpm nào cần cài (field này chỉ
  tồn tại trong `apps/web/package.json`, action chỉ đọc ở root). **Bài học:** verify CI bằng
  cách chạy lệnh tương đương ở local (`pnpm install --frozen-lockfile` rồi `pnpm test`) không
  đủ — không bắt được lỗi về cách GitHub Action tự detect version tool, phải push thật lên
  Actions tab mới thấy. Fix: khai báo tường minh `with: version: 12.11.2` ở cả 2 bước
  `pnpm/action-setup@v4` thay vì dựa vào auto-detect.

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
