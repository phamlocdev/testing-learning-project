import { http, HttpResponse } from 'msw';
import { MOCK_ACCESS_TOKEN, MOCK_USER_ID } from './fake-jwt';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const handlers = [
  http.post(`${API_BASE_URL}/auth/login`, () => {
    return HttpResponse.json({ accessToken: MOCK_ACCESS_TOKEN }, { status: 200 });
  }),

  http.post(`${API_BASE_URL}/auth/register`, async ({ request }) => {
    const body = (await request.json()) as { email: string };

    return HttpResponse.json({ id: MOCK_USER_ID, email: body.email }, { status: 201 });
  }),

  http.post(`${API_BASE_URL}/tasks`, async ({ request }) => {
    const body = (await request.json()) as { title: string };

    return HttpResponse.json(
      { id: 'mock-task-id', title: body.title, ownerId: MOCK_USER_ID, done: false },
      { status: 201 },
    );
  }),

  http.get(`${API_BASE_URL}/tasks`, () => {
    return HttpResponse.json([], { status: 200 });
  }),

  http.patch(`${API_BASE_URL}/tasks/:id`, async ({ request, params }) => {
    const body = (await request.json()) as { done: boolean };

    return HttpResponse.json(
      { id: params.id, title: 'mock task', ownerId: MOCK_USER_ID, done: body.done },
      { status: 200 },
    );
  }),
];
