import api from '../axios'
import { toArray } from './utils'

export interface Annee {
  id: number
  libelle: string
  dateDebut: string
  dateFin: string
  statut: 'active' | 'archivee' | 'en_preparation'
}

export interface AnneePayload {
  libelle: string
  dateDebut: string
  dateFin: string
  statut?: 'active' | 'archivee' | 'en_preparation'
}

export const anneeService = {
  list: () =>
    api.get('/api/annees').then(r => toArray<Annee>(r.data)),

  current: () =>
    api.get<Annee>('/api/annees/current').then(r => r.data),

  show: (id: number) =>
    api.get<Annee>(`/api/annees/${id}`).then(r => r.data),

  create: (payload: AnneePayload) =>
    api.post<Annee>('/api/annees', payload).then(r => r.data),

  update: (id: number, payload: Partial<AnneePayload>) =>
    api.put<Annee>(`/api/annees/${id}`, payload).then(r => r.data),

  activer: (id: number) =>
    api.put<Annee>(`/api/annees/${id}/activer`).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/api/annees/${id}`),
}