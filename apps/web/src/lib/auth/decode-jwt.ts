export interface JwtPayload {
  sub: string;
  email: string;
}

export function decodeJwtPayload(token: string): JwtPayload {
  const payloadSegment = token.split('.')[1];
  const base64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64));
}
