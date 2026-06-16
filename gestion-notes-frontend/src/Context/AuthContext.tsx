// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '../api/axios'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: number
  nom: string
  prenom: string
  email: string
  roles: string[]
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: { email: string; password: string }) => Promise<void>
  logout: () => void
  hasRole: (role: string) => boolean
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const STORAGE_TOKEN = 'eni_token'
const STORAGE_USER  = 'eni_user'

// ─── Décodage JWT ─────────────────────────────────────────────────────────────

function decodeJwt(token: string): { email?: string; roles?: string[] } {
  try {
    const payload = token.split('.')[1]
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded)
  } catch {
    return {}
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]           = useState<User | null>(null)
  const [token, setToken]         = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const _clearSession = () => {
    localStorage.removeItem(STORAGE_TOKEN)
    localStorage.removeItem(STORAGE_USER)
    delete api.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)
  }

  const _persist = (newToken: string, newUser: User) => {
    localStorage.setItem(STORAGE_TOKEN, newToken)
    localStorage.setItem(STORAGE_USER, JSON.stringify(newUser))
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
    setToken(newToken)
    setUser(newUser)
  }

  // ─── Restaurer session ──────────────────────────────────────────────────────

  useEffect(() => {
    const savedToken = localStorage.getItem(STORAGE_TOKEN)
    const savedUser  = localStorage.getItem(STORAGE_USER)
    if (savedToken && savedUser) {
      try {
        const parsed: User = JSON.parse(savedUser)
        setToken(savedToken)
        setUser(parsed)
        api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
      } catch {
        _clearSession()
      }
    }
    setIsLoading(false)
  }, [])

  // ─── Login ──────────────────────────────────────────────────────────────────

  const login = async (credentials: { email: string; password: string }): Promise<void> => {
    // 1. Token JWT Symfony → retourne juste { token }
    const res = await api.post<{ token: string }>('/api/auth/login', {
      email:    credentials.email,
      password: credentials.password,
    })
    const newToken = res.data.token

    // 2. Décoder JWT pour rôles immédiats
    const payload = decodeJwt(newToken)
    let newUser: User = {
      id:     0,
      nom:    '',
      prenom: '',
      email:  payload.email ?? credentials.email,
      roles:  payload.roles ?? [],
    }

    // 3. Enrichir avec /api/auth/me (nom, prenom, id)
    try {
      const meRes = await api.get<{ success: boolean; data: User }>('/api/auth/me', {
        headers: { Authorization: `Bearer ${newToken}` },
      })
      if (meRes.data.success && meRes.data.data) {
        newUser = {
          ...meRes.data.data,
          roles: meRes.data.data.roles?.length ? meRes.data.data.roles : newUser.roles,
        }
      }
    } catch {
      // /me échoué → user minimal du JWT suffit pour router
    }

    _persist(newToken, newUser)
  }

  // ─── Logout ─────────────────────────────────────────────────────────────────

  const logout = () => {
    try { api.post('/api/auth/logout') } catch { /* silencieux */ }
    _clearSession()
  }

  // ─── hasRole avec hiérarchie locale ─────────────────────────────────────────

  const hasRole = (role: string): boolean => {
    if (!user) return false
    if (user.roles.includes('ROLE_SUPER_ADMIN')) return true
    if (user.roles.includes('ROLE_ADMIN') && role !== 'ROLE_SUPER_ADMIN') return true
    return user.roles.includes(role)
  }

  return (
    <AuthContext.Provider value={{
      user, token,
      isAuthenticated: !!user && !!token,
      isLoading, login, logout, hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider')
  return ctx
}