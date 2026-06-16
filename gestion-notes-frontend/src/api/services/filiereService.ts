import api from '../axios'
import { toArray } from './utils'

export interface Filiere {
  id: number
  code: string
  nom: string
  description?: string
  niveaux?: { id: number; nom: string }[]
}

export interface FilierePayload {
  code: string
  nom: string
  description?: string
}

export const filiereService = {
  list: () =>
    api.get('/api/filieres').then(r => toArray<Filiere>(r.data)),

  show: (id: number) =>
    api.get<Filiere>(`/api/filieres/${id}`).then(r => r.data),

  create: (payload: FilierePayload) =>
    api.post<Filiere>('/api/filieres', payload).then(r => r.data),

  update: (id: number, payload: Partial<FilierePayload>) =>
    api.put<Filiere>(`/api/filieres/${id}`, payload).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/api/filieres/${id}`),
}