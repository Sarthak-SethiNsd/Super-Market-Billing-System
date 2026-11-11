export type Role = 'STAFF' | 'ADMIN';

export interface UserSession {
  authenticated: boolean;
  role: Role;
  canAdmin: boolean;
  username?: string;
  expiresAt?: number;
}

export interface UnlockResponse {
  token: string;
  role: Role;
  expiresInSeconds: number;
}
