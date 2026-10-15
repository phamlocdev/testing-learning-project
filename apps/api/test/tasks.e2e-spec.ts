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

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    process.env.DATABASE_URL = container.getConnectionUri();

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
    it('creates a task and returns it', async () => {
      const response = await request(app.getHttpServer())
        .post('/tasks')
        .send({ title: 'Write report', ownerId: 'user-A' })
        .expect(201);

      expect(response.body).toMatchObject({
        title: 'Write report',
        ownerId: 'user-A',
        done: false,
      });
      expect(response.body.id).toEqual(expect.any(String));
    });

    it('returns Conflict when a task with the same title already exists for this owner', async () => {
      await request(app.getHttpServer())
        .post('/tasks')
        .send({ title: 'Duplicate title', ownerId: 'user-B' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/tasks')
        .send({ title: 'Duplicate title', ownerId: 'user-B' })
        .expect(409);
    });
  });

  describe('GET /tasks', () => {
    it('lists only the tasks belonging to the given owner', async () => {
      await request(app.getHttpServer())
        .post('/tasks')
        .send({ title: 'Task for user-C 1', ownerId: 'user-C' })
        .expect(201);
      await request(app.getHttpServer())
        .post('/tasks')
        .send({ title: 'Task for user-C 2', ownerId: 'user-C' })
        .expect(201);
      await request(app.getHttpServer())
        .post('/tasks')
        .send({ title: 'Task for user-D', ownerId: 'user-D' })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/tasks')
        .query({ ownerId: 'user-C' })
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(
        response.body.every((task: { ownerId: string }) => task.ownerId === 'user-C'),
      ).toBe(true);
    });
  });

  describe('GET /tasks/:id', () => {
    it('returns the task when it exists', async () => {
      const created = await request(app.getHttpServer())
        .post('/tasks')
        .send({ title: 'Task to fetch', ownerId: 'user-E' })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get(`/tasks/${created.body.id}`)
        .expect(200);

      expect(response.body).toEqual(created.body);
    });

    it('returns Not Found when the task does not exist', async () => {
      await request(app.getHttpServer())
        .get('/tasks/does-not-exist')
        .expect(404);
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('deletes the task when the requester is the owner', async () => {
      const created = await request(app.getHttpServer())
        .post('/tasks')
        .send({ title: 'Task to delete', ownerId: 'user-F' })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/tasks/${created.body.id}`)
        .query({ requesterId: 'user-F' })
        .expect(204);

      await request(app.getHttpServer())
        .get(`/tasks/${created.body.id}`)
        .expect(404);
    });

    it('returns Forbidden when the requester is not the owner', async () => {
      const created = await request(app.getHttpServer())
        .post('/tasks')
        .send({ title: 'Task not owned by requester', ownerId: 'user-G' })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/tasks/${created.body.id}`)
        .query({ requesterId: 'user-H' })
        .expect(403);
    });

    it('returns Not Found when the task does not exist', async () => {
      await request(app.getHttpServer())
        .delete('/tasks/does-not-exist')
        .query({ requesterId: 'user-A' })
        .expect(404);
    });
  });
});
