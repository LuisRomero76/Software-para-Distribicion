import { request } from '../lib/http';

export interface AuthResponse {
  token: string;
  email: string;
  nombre: string;
  apellido: string;
  admin_id: number;
  telefono: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface IAuthService {
  login(input: LoginInput): Promise<AuthResponse>;
}

export class AuthService implements IAuthService {
  async login(input: LoginInput): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }
}
