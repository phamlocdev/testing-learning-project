import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';

const apiRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

describe('Auth (e2e)', () => {
  let container: StartedPostgreSqlContainer;
  let app: INestApplication<App>;

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

  describe('POST /auth/register', () => {
    it('creates a new user and does not return the password hash', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'alice@example.com', password: 'correct-password' })
        .expect(201);

      expect(response.body).toEqual({
        id: expect.any(String),
        email: 'alice@example.com',
      });
      expect(response.body.passwordHash).toBeUndefined();
    });

    it('returns Conflict when the email is already registered', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'bob@example.com', password: 'correct-password' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'bob@example.com', password: 'another-password' })
        .expect(409);
    });
  });

  describe('POST /auth/login', () => {
    it('returns an access token for correct credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'carol@example.com', password: 'correct-password' })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'carol@example.com', password: 'correct-password' })
        .expect(200);

      expect(response.body.accessToken).toEqual(expect.any(String));
    });

    it('returns Unauthorized for a wrong password', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'dave@example.com', password: 'correct-password' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'dave@example.com', password: 'wrong-password' })
        .expect(401);
    });

    it('returns Unauthorized for an email that is not registered', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'missing@example.com', password: 'whatever' })
        .expect(401);
    });
  });
});
