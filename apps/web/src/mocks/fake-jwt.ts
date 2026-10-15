export const MOCK_USER_ID = 'mock-user-id';
export const MOCK_USER_EMAIL = 'user@example.com';

export function createFakeJwt(payload: Record<string, unknown>): string {
  const base64url = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');

  return `${base64url({ alg: 'none' })}.${base64url(payload)}.signature`;
}

export const MOCK_ACCESS_TOKEN = createFakeJwt({ sub: MOCK_USER_ID, email: MOCK_USER_EMAIL });
