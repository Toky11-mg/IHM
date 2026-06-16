// src/api/services/statistiqueService.ts
import api from '../axios'

export interface StatGlobale {
  nbEtudiants: number
  nbEnseignants: number
  nbMatieres: number
  nbFilieres: number
  tauxReussite: number
  moyenneGenerale: number
  notesSaisiesPct: number
  nbDeliberations: number
}

export const statistiqueService = {
  global: (params?: Record<string, string | number>) =>
    api.get<StatGlobale>('/api/statistiques', { params }).then(r => r.data),
}