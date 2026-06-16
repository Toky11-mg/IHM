import api from '../axios'
import { toArray } from './utils'

export interface AuditLog {
  id: number
  utilisateur: string
  role: string
  action: string
  ressource: string
  detail: string
  ip: string
  date: string
}

export const auditService = {
  list: (params?: Record<string, string | number>) =>
    api.get('/api/audit-logs', { params }).then(r => toArray<AuditLog>(r.data)),
}