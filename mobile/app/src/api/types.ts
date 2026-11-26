export type Role = 'admin' | 'customer_service';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends TokenPair {
  success: true;
  user: SessionUser;
}
