// ============ RÉPONSES API ============
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  total?: number;
  errors?: Record<string, string>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  total: number;
  page?: number;
  limit?: number;
}

// ============ AUTH ============
export interface User {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  roles: string[];
  actif: boolean;
}

export interface AuthTokens {
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// ============ ETUDIANT ============
export interface Etudiant {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  email: string;
  telephone?: string;
  filiere: Filiere;
  niveau: Niveau;
  anneeUniversitaire: string;
  actif: boolean;
}

// ============ ENSEIGNANT ============
export interface Enseignant {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  grade: string;
  departement: string;
  matieres?: Matiere[];
  actif: boolean;
}

// ============ FILIERE ============
export interface Filiere {
  id: number;
  code: string;
  nom: string;
  description?: string;
  departement: string;
  niveaux?: Niveau[];
  actif: boolean;
}

// ============ NIVEAU ============
export interface Niveau {
  id: number;
  nom: string;
  code: string;
  filiere: Filiere;
  semestres?: Semestre[];
}

// ============ SEMESTRE ============
export interface Semestre {
  id: number;
  nom: string;
  code: string;
  niveau: Niveau;
  matieres?: Matiere[];
  dateDebut?: string;
  dateFin?: string;
}

// ============ MATIERE ============
export interface Matiere {
  id: number;
  code: string;
  nom: string;
  coefficient: number;
  credit: number;
  volumeHoraire: number;
  semestre: Semestre;
  enseignant?: Enseignant;
  type: 'cours' | 'td' | 'tp';
}

// ============ NOTE ============
export interface Note {
  id: number;
  etudiant: Etudiant;
  matiere: Matiere;
  noteCC?: number;
  noteExamen?: number;
  notefinale?: number;
  mention?: string;
  anneeUniversitaire: string;
  valide: boolean;
  createdAt: string;
  updatedAt?: string;
}

// ============ DELIBERATION ============
export interface Deliberation {
  id: number;
  titre: string;
  niveau: Niveau;
  semestre: Semestre;
  anneeUniversitaire: string;
  statut: 'brouillon' | 'en_cours' | 'validee' | 'publiee';
  dateDeliberation?: string;
  createdAt: string;
  resultats?: ResultatDeliberation[];
}

export interface ResultatDeliberation {
  etudiant: Etudiant;
  moyenne: number;
  mention: string;
  decision: 'admis' | 'ajourné' | 'rattrapage';
  rang?: number;
}

// ============ RECLAMATION ============
export interface Reclamation {
  id: number;
  etudiant: Etudiant;
  note: Note;
  motif: string;
  statut: 'en_attente' | 'en_cours' | 'resolue' | 'rejetee';
  reponse?: string;
  createdAt: string;
  updatedAt?: string;
}

// ============ STATISTIQUES ============
export interface Statistique {
  filiere?: string;
  niveau?: string;
  semestre?: string;
  anneeUniversitaire: string;
  totalEtudiants: number;
  totalAdmis: number;
  totalAjournes: number;
  totalRattrapage: number;
  tauxReussite: number;
  moyenneGenerale: number;
  meilleureMoyenne: number;
  moyenneLaPlusBasse: number;
}

// ============ ROLES ============
export type UserRole =
  | 'ROLE_SUPER_ADMIN'
  | 'ROLE_ADMIN'
  | 'ROLE_RESPONSABLE_PEDAGOGIQUE'
  | 'ROLE_CHEF_DEPARTEMENT'
  | 'ROLE_ENSEIGNANT'
  | 'ROLE_ETUDIANT';