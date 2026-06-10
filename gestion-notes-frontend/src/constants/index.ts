export const API_URL = 'http://127.0.0.1:8000/api'

export const ROLES = {
  SUPER_ADMIN: 'ROLE_SUPER_ADMIN',
  ADMIN: 'ROLE_ADMIN',
  RESPONSABLE: 'ROLE_RESPONSABLE_PEDAGOGIQUE',
  CHEF_DEPARTEMENT: 'ROLE_CHEF_DEPARTEMENT',
  ENSEIGNANT: 'ROLE_ENSEIGNANT',
  ETUDIANT: 'ROLE_ETUDIANT',
} as const

export const ROLE_LABELS: Record<string, string> = {
  ROLE_SUPER_ADMIN: 'Super Administrateur',
  ROLE_ADMIN: 'Administrateur',
  ROLE_RESPONSABLE_PEDAGOGIQUE: 'Responsable Pédagogique',
  ROLE_CHEF_DEPARTEMENT: 'Chef de Département',
  ROLE_ENSEIGNANT: 'Enseignant',
  ROLE_ETUDIANT: 'Étudiant',
}

export const MENTION_COLORS: Record<string, string> = {
  'Très Bien': 'text-green-600 bg-green-50',
  'Bien': 'text-blue-600 bg-blue-50',
  'Assez Bien': 'text-cyan-600 bg-cyan-50',
  'Passable': 'text-yellow-600 bg-yellow-50',
  'Insuffisant': 'text-red-600 bg-red-50',
}