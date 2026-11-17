export type Role = 'CUSTOMER' | 'STAFF';

export interface UserSession {
  authenticated: boolean;
  role: Role;
  canAdmin?: boolean; // deprecated alias for isStaff
  username?: string;
  expiresAt?: number;
}

export interface UnlockResponse {
  token: string;
  role: Role;
  expiresInSeconds: number;
}
