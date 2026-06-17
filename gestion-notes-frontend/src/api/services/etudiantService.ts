import api from '../axios'
import { toArray } from './utils'

export interface Etudiant {
  id: number
  nom: string
  prenom: string
  nomComplet: string
  matricule: string
  genre: string
  email: string
  statut: string
  dateNaissance: string
  age?: number
  lieuNaissance?: string
  nationalite: string
  telephone?: string
  photo?: string
  anneeEntree: number
  niveau: { id: number; nom: string }
  filiere: { id: number; nom: string }
  nbNotes?: number
  nbReclamations?: number
}

export interface EtudiantPayload {
  nom: string
  prenom: string
  email: string
  dateNaissance: string
  lieuNaissance: string
  nationalite: string
  genre: string
  niveauId?: number
  filiereId?: number
  anneeEntree?: number
  statut?: string
  telephone?: string
  password?: string
}

export const etudiantService = {
  list: () =>
    api.get('/api/etudiants').then(r => toArray<Etudiant>(r.data)),

  me: () =>
    api.get<{ success: boolean; data: Etudiant }>('/api/etudiants/me').then(r => r.data),

  show: (id: number) =>
    api.get<Etudiant>(`/api/etudiants/${id}`).then(r => r.data),

  create: (payload: EtudiantPayload) =>
    api.post<Etudiant>('/api/etudiants', payload).then(r => r.data),

  update: (id: number, payload: Partial<EtudiantPayload>) =>
    api.put<Etudiant>(`/api/etudiants/${id}`, payload).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/api/etudiants/${id}`),
}