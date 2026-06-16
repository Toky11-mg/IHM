import api from '../axios'
import { toArray } from './utils'

export interface Deliberation {
  id: number
  semestre: string
  moyenneGenerale: string
  decision: string
  mentionGlobale: string
  isPublie: boolean
  filiere?: string
  niveau?: string
}

export const deliberationService = {
  list: (params?: Record<string, string | number>) =>
    api.get('/api/deliberations', { params }).then(r => toArray<Deliberation>(r.data)),

  me: () =>
    api.get('/api/deliberations/me').then(r => toArray<Deliberation>(r.data)),

  show: (id: number) =>
    api.get<Deliberation>(`/api/deliberations/${id}`).then(r => r.data),

  calculer: (payload: Record<string, unknown>) =>
    api.post<Deliberation>('/api/deliberations/calculer', payload).then(r => r.data),

  calculerSemestre: (payload: Record<string, unknown>) =>
    api.post('/api/deliberations/calculer-semestre', payload).then(r => toArray<Deliberation>(r.data)),

  publier: (id: number) =>
    api.post<Deliberation>(`/api/deliberations/${id}/publier`).then(r => r.data),
}