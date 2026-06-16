import api from '../axios'
import { toArray } from './utils'

export interface Reclamation {
  id: number
  matiere: string
  codeMatiere: string
  semestre: string
  noteContestee: number
  motif: string
  description: string
  dateCreation: string
  dateTraitement?: string
  statut: 'en_attente' | 'en_cours' | 'traitee' | 'rejetee'
  reponse?: string
}

export interface ReclamationPayload {
  matiereId: number
  semestreId: number
  noteContestee: number
  motif: string
  description: string
}

export const reclamationService = {
  list: () =>
    api.get('/api/reclamations').then(r => toArray<Reclamation>(r.data)),

  me: () =>
    api.get('/api/reclamations/me').then(r => toArray<Reclamation>(r.data)),

  show: (id: number) =>
    api.get<Reclamation>(`/api/reclamations/${id}`).then(r => r.data),

  create: (payload: ReclamationPayload) =>
    api.post<Reclamation>('/api/reclamations', payload).then(r => r.data),

  traiter: (id: number, payload: { statut: string; reponse: string }) =>
    api.put<Reclamation>(`/api/reclamations/${id}/traiter`, payload).then(r => r.data),
}