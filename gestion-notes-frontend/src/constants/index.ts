// src/constants/index.ts

export const ROLES = {
  ADMIN:       'ROLE_ADMIN',
  SUPER_ADMIN: 'ROLE_SUPER_ADMIN',
  ENSEIGNANT:  'ROLE_ENSEIGNANT',
  ETUDIANT:    'ROLE_ETUDIANT',
} as const

export type Role = typeof ROLES[keyof typeof ROLES]

export const ROLE_LABELS: Record<Role, string> = {
  ROLE_ADMIN:       'Administrateur',
  ROLE_SUPER_ADMIN: 'Super Administrateur',
  ROLE_ENSEIGNANT:  'Enseignant',
  ROLE_ETUDIANT:    'Étudiant',
}

export const ROLE_HOME: Record<Role, string> = {
  ROLE_ADMIN:       '/admin/dashboard',
  ROLE_SUPER_ADMIN: '/admin/dashboard',
  ROLE_ENSEIGNANT:  '/enseignant/dashboard',
  ROLE_ETUDIANT:    '/etudiant/dashboard',
}