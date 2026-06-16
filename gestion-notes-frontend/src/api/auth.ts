// src/api/auth.ts
import api from './axios'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LoginPayload {
  email: string
  password: string
}

// Symfony LexikJWT retourne SEULEMENT { token }
export interface LoginResponse {
  token: string
}

export interface MeResponse {
  success: boolean
  data: {
    id: number
    nom: string
    prenom: string
    email: string
    roles: string[]
  }
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

export const authApi = {

  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const res = await api.post<LoginResponse>('/api/auth/login', payload)
    return res.data // { token: "eyJ..." }
  },

  me: async (): Promise<MeResponse> => {
    const res = await api.get<MeResponse>('/api/auth/me') // ← /auth/me pas /me
    return res.data
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/api/auth/logout')
    } catch {
      // silencieux
    }
  },
}