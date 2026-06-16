import api from '../axios'
import { toArray } from './utils'

export interface Matiere {
  id: number
  code: string
  nom: string
  coefficient: number
  filiere?: { id: number; nom: string; code: string }
  niveau?: { id: number; nom: string }
  semestre?: { id: number; nom: string }
  enseignant?: { id: number; nomComplet: string }
}

export interface MatierePayload {
  code: string
  nom: string
  coefficient: number
  filiereId?: number
  niveauId?: number
  semestreId?: number
  enseignantId?: number
}

export const matiereService = {
  list: (params?: Record<string, string | number>) =>
    api.get('/api/matieres', { params }).then(r => toArray<Matiere>(r.data)),

  show: (id: number) =>
    api.get<Matiere>(`/api/matieres/${id}`).then(r => r.data),

  create: (payload: MatierePayload) =>
    api.post<Matiere>('/api/matieres', payload).then(r => r.data),

  update: (id: number, payload: Partial<MatierePayload>) =>
    api.put<Matiere>(`/api/matieres/${id}`, payload).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/api/matieres/${id}`),
}