import api from '../axios'
import { toArray } from './utils'

export interface Enseignant {
  id: number
  nom: string
  prenom: string
  nomComplet: string
  matricule: string
  email: string
  grade: string
  specialite: string
  statut: string
  dateEmbauche: string
  nbMatieresActives: number
  matieres?: {
    id: number
    nom: string
    code: string
    semestre: { id: number; nom: string }
    isActive: boolean
  }[]
}

export interface EnseignantPayload {
  nom: string
  prenom: string
  email: string
  matricule: string
  grade?: string
  specialite?: string
  statut?: string
  dateEmbauche?: string
  password?: string
}

export const enseignantService = {
  list: () =>
    api.get('/api/enseignants').then(r => toArray<Enseignant>(r.data)),

  me: () =>
    api.get<{ success: boolean; data: Enseignant }>('/api/enseignants/me').then(r => r.data),

  show: (id: number) =>
    api.get<Enseignant>(`/api/enseignants/${id}`).then(r => r.data),

  create: (payload: EnseignantPayload) =>
    api.post<Enseignant>('/api/enseignants', payload).then(r => r.data),

  update: (id: number, payload: Partial<EnseignantPayload>) =>
    api.put<Enseignant>(`/api/enseignants/${id}`, payload).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/api/enseignants/${id}`),
}