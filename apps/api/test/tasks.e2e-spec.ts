import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('Tasks (e2e)', () => {
  let container: StartedPostgreSqlContainer;
  let app: INestApplication<App>;
  let nextUserId = 0;

  async function registerAndLogin(): Promise<{ token: string }> {
    const email = `user-${++nextUserId}-${Date.now()}@example.com`;
    const password = 'correct-password';

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    return { token: loginResponse.body.accessToken };
  }

  function authed(token: string) {
    return {
      post: (url: string) =>
        request(app.getHttpServer()).post(url).set('Authorization', `Bearer ${token}`),
      get: (url: string) =>
        request(app.getHttpServer()).get(url).set('Authorization', `Bearer ${token}`),
      patch: (url: string) =>
        request(app.getHttpServer()).patch(url).set('Authorization', `Bearer ${token}`),
      delete: (url: string) =>
        request(app.getHttpServer()).delete(url).set('Authorization', `Bearer ${token}`),
    };
  }

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    process.env.DATABASE_URL = container.getConnectionUri();
    process.env.JWT_SECRET = 'test-secret';

    execSync('npx prisma migrate deploy', {
      cwd: apiRoot,
      env: { ...process.env, DATABASE_URL: container.getConnectionUri() },
      stdio: 'inherit',
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 60_000);

  afterAll(async () => {
    await app.close();
    await container.stop();
  }, 30_000);

  describe('POST /tasks', () => {
    it('creates a task owned by the authenticated user', async () => {
      const { token } = await registerAndLogin();

      const response = await authed(token)
        .post('/tasks')
        .send({ title: 'Write report' })
        .expect(201);

      expect(response.body).toMatchObject({ title: 'Write report', done: false });
      expect(response.body.id).toEqual(expect.any(String));
      expect(response.body.ownerId).toEqual(expect.any(String));
    });

    it('returns Conflict when a task with the same title already exists for this owner', async () => {
      const { token } = await registerAndLogin();

      await authed(token).post('/tasks').send({ title: 'Duplicate title' }).expect(201);
      await authed(token).post('/tasks').send({ title: 'Duplicate title' }).expect(409);
    });

    it('returns Unauthorized without a bearer token', async () => {
      await request(app.getHttpServer())
        .post('/tasks')
        .send({ title: 'No auth' })
        .expect(401);
    });
  });

  describe('GET /tasks', () => {
    it('lists only the tasks belonging to the authenticated user', async () => {
      const { token: tokenC } = await registerAndLogin();
      const { token: tokenD } = await registerAndLogin();

      await authed(tokenC).post('/tasks').send({ title: 'Task for C 1' }).expect(201);
      await authed(tokenC).post('/tasks').send({ title: 'Task for C 2' }).expect(201);
      await authed(tokenD).post('/tasks').send({ title: 'Task for D' }).expect(201);

      const response = await authed(tokenC).get('/tasks').expect(200);

      expect(response.body).toHaveLength(2);
    });
  });

  describe('GET /tasks/:id', () => {
    it('returns the task when it exists', async () => {
      const { token } = await registerAndLogin();
      const created = await authed(token)
        .post('/tasks')
        .send({ title: 'Task to fetch' })
        .expect(201);

      const response = await authed(token)
        .get(`/tasks/${created.body.id}`)
        .expect(200);

      expect(response.body).toEqual(created.body);
    });

    it('returns Not Found when the task does not exist', async () => {
      const { token } = await registerAndLogin();

      await authed(token).get('/tasks/does-not-exist').expect(404);
    });
  });

  describe('PATCH /tasks/:id', () => {
    it('marks the task done when the requester is the owner', async () => {
      const { token } = await registerAndLogin();
      const created = await authed(token)
        .post('/tasks')
        .send({ title: 'Task to mark done' })
        .expect(201);

      const response = await authed(token)
        .patch(`/tasks/${created.body.id}`)
        .send({ done: true })
        .expect(200);

      expect(response.body).toMatchObject({ id: created.body.id, done: true });
    });

    it('returns Forbidden when the requester is not the owner', async () => {
      const { token: ownerToken } = await registerAndLogin();
      const { token: otherToken } = await registerAndLogin();
      const created = await authed(ownerToken)
        .post('/tasks')
        .send({ title: 'Task not owned by requester (patch)' })
        .expect(201);

      await authed(otherToken)
        .patch(`/tasks/${created.body.id}`)
        .send({ done: true })
        .expect(403);
    });

    it('returns Not Found when the task does not exist', async () => {
      const { token } = await registerAndLogin();

      await authed(token).patch('/tasks/does-not-exist').send({ done: true }).expect(404);
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('deletes the task when the requester is the owner', async () => {
      const { token } = await registerAndLogin();
      const created = await authed(token)
        .post('/tasks')
        .send({ title: 'Task to delete' })
        .expect(201);

      await authed(token).delete(`/tasks/${created.body.id}`).expect(204);
      await authed(token).get(`/tasks/${created.body.id}`).expect(404);
    });

    it('returns Forbidden when the requester is not the owner', async () => {
      const { token: ownerToken } = await registerAndLogin();
      const { token: otherToken } = await registerAndLogin();
      const created = await authed(ownerToken)
        .post('/tasks')
        .send({ title: 'Task not owned by requester' })
        .expect(201);

      await authed(otherToken).delete(`/tasks/${created.body.id}`).expect(403);
    });

    it('returns Not Found when the task does not exist', async () => {
      const { token } = await registerAndLogin();

      await authed(token).delete('/tasks/does-not-exist').expect(404);
    });
  });
});
