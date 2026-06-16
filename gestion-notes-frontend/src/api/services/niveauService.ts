import api from '../axios'
import { toArray } from './utils'

export interface Niveau {
  id: number
  nom: string
  filiere?: { id: number; nom: string }
}

export interface NiveauPayload {
  nom: string
  filiereId?: number
}

export const niveauService = {
  list: () =>
    api.get('/api/niveaux').then(r => toArray<Niveau>(r.data)),

  show: (id: number) =>
    api.get<Niveau>(`/api/niveaux/${id}`).then(r => r.data),

  create: (payload: NiveauPayload) =>
    api.post<Niveau>('/api/niveaux', payload).then(r => r.data),

  update: (id: number, payload: Partial<NiveauPayload>) =>
    api.put<Niveau>(`/api/niveaux/${id}`, payload).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/api/niveaux/${id}`),
}