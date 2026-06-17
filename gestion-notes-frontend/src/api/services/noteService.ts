import api from '../axios'
import { toArray } from './utils'

export interface Note {
  id: number
  matiere: string | { id: number; nom: string; code: string }
  code: string
  noteCc: string | null
  noteExamen: string | null
  noteFinale: string | null
  mention: string | null
  isValidee: boolean
  semestre: string | { id: number; nom: string }
  etudiant?: { id: number; nomComplet: string; matricule: string }
}



export interface NotePayload {
  etudiantId: number
  matiereId: number
  semestreId: number
  noteCc?: number
  noteExamen?: number
}

export const noteService = {
  list: (params?: Record<string, string | number>) =>
    api.get('/api/notes', { params }).then(r => toArray<Note>(r.data)),

  me: () =>
    api.get('/api/notes/me').then(r => toArray<Note>(r.data)),

  show: (id: number) =>
    api.get<Note>(`/api/notes/${id}`).then(r => r.data),

  create: (payload: NotePayload) =>
    api.post<Note>('/api/notes', payload).then(r => r.data),

  update: (id: number, payload: Partial<NotePayload>) =>
    api.put<Note>(`/api/notes/${id}`, payload).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/api/notes/${id}`),
}