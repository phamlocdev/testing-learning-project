import { http, HttpResponse } from 'msw';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const handlers = [
  http.post(`${API_BASE_URL}/tasks`, async ({ request }) => {
    const body = (await request.json()) as { title: string; ownerId: string };

    return HttpResponse.json(
      { id: 'mock-task-id', title: body.title, ownerId: body.ownerId, done: false },
      { status: 201 },
    );
  }),
];
