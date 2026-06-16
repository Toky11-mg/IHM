// src/api/axios.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

// ─── Instance principale ──────────────────────────────────────────────────────

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
  },
  timeout: 10000,
})

// ─── Intercepteur requête — injection JWT ────────────────────────────────────

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('eni_token')
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

// ─── Intercepteur réponse — gestion 401 ──────────────────────────────────────

api.interceptors.response.use(
  response => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide → nettoyer et rediriger
      localStorage.removeItem('eni_token')
      localStorage.removeItem('eni_user')
      delete api.defaults.headers.common['Authorization']

      // Rediriger uniquement si pas déjà sur /login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api