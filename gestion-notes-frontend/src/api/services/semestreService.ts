import api from '../axios'
import { toArray } from './utils'

export interface Semestre {
  id: number
  nom: string
  annee?: { id: number; libelle: string }
  statut?: string
}

export interface SemestrePayload {
  nom: string
  anneeId?: number
}

export const semestreService = {
  list: () =>
    api.get('/api/semestres').then(r => toArray<Semestre>(r.data)),

  show: (id: number) =>
    api.get<Semestre>(`/api/semestres/${id}`).then(r => r.data),

  create: (payload: SemestrePayload) =>
    api.post<Semestre>('/api/semestres', payload).then(r => r.data),

  update: (id: number, payload: Partial<SemestrePayload>) =>
    api.put<Semestre>(`/api/semestres/${id}`, payload).then(r => r.data),

  cloturer: (id: number) =>
    api.post(`/api/semestres/${id}/cloturer`),

  delete: (id: number) =>
    api.delete(`/api/semestres/${id}`),
}