import api from './axios';
import type { ApiResponse, AuthTokens, LoginCredentials, User } from '../types';

export const authApi = {
  login: (credentials: LoginCredentials) =>
    api.post<ApiResponse<AuthTokens>>('/auth/login', credentials),

  me: () =>
    api.get<ApiResponse<User>>('/auth/me'),

  logout: () =>
    api.post('/auth/logout'),
};