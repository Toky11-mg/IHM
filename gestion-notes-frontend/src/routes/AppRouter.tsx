import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/layout/Layout'

// Auth
import LoginPage from '../pages/Login'
import NotFound from '../pages/NotFound'

// Admin
import DashboardAdmin from '../pages/admin/Dashboard'
import EtudiantsPage from '../pages/admin/Etudiants'
import EnseignantsPage from '../pages/admin/Enseignants'
import FilieresPage from '../pages/admin/Filieres'
import MatieresPage from '../pages/admin/Matieres'
import AnneesPage from '../pages/admin/Annees'
import DeliberationsAdminPage from '../pages/admin/Deliberations'
import StatistiquesAdminPage from '../pages/admin/Statistiques'
import AuditPage from '../pages/admin/Audit'

// Enseignant
import DashboardEnseignant from '../pages/enseignant/Dashboard'
import MesMatieresPage from '../pages/enseignant/MesMatieres'
import SaisieNotesPage from '../pages/enseignant/SaisieNotes'
import HistoriquePage from '../pages/enseignant/Historique'

// Etudiant
import DashboardEtudiant from '../pages/etudiant/Dashboard'
import MesNotesPage from '../pages/etudiant/MesNotes'
import MesRelevesPage from '../pages/etudiant/MesReleves'
import MesReclamationsPage from '../pages/etudiant/MesReclamations'

// Responsable
import DashboardResponsable from '../pages/responsable/Dashboard'
import DeliberationsResponsablePage from '../pages/responsable/Deliberations'
import StatistiquesResponsablePage from '../pages/responsable/Statistiques'
import ClassementsPage from '../pages/responsable/Classements'

// Département
import DashboardDepartement from '../pages/departement/Dashboard'
import ResultatsPage from '../pages/departement/Resultats'
import StatistiquesDepartementPage from '../pages/departement/Statistiques'

// ProtectedRoute
const ProtectedRoute = ({
  children,
  roles,
}: {
  children: React.ReactNode
  roles: string[]
}) => {
  const { isAuthenticated, hasRole } = useAuth()

  if (!isAuthenticated()) return <Navigate to="/login" replace />
  if (roles.length > 0 && !roles.some(r => hasRole(r as never)))
    return <Navigate to="/login" replace />

  return <>{children}</>
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Admin */}
        <Route path="/admin" element={
          <ProtectedRoute roles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardAdmin />} />
          <Route path="etudiants" element={<EtudiantsPage />} />
          <Route path="enseignants" element={<EnseignantsPage />} />
          <Route path="filieres" element={<FilieresPage />} />
          <Route path="matieres" element={<MatieresPage />} />
          <Route path="annees" element={<AnneesPage />} />
          <Route path="deliberations" element={<DeliberationsAdminPage />} />
          <Route path="statistiques" element={<StatistiquesAdminPage />} />
          <Route path="audit" element={<AuditPage />} />
        </Route>

        {/* Enseignant */}
        <Route path="/enseignant" element={
          <ProtectedRoute roles={['ROLE_ENSEIGNANT']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardEnseignant />} />
          <Route path="matieres" element={<MesMatieresPage />} />
          <Route path="notes" element={<SaisieNotesPage />} />
          <Route path="historique" element={<HistoriquePage />} />
        </Route>

        {/* Etudiant */}
        <Route path="/etudiant" element={
          <ProtectedRoute roles={['ROLE_ETUDIANT']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardEtudiant />} />
          <Route path="notes" element={<MesNotesPage />} />
          <Route path="releves" element={<MesRelevesPage />} />
          <Route path="reclamations" element={<MesReclamationsPage />} />
        </Route>

        {/* Responsable */}
        <Route path="/responsable" element={
          <ProtectedRoute roles={['ROLE_RESPONSABLE_PEDAGOGIQUE']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardResponsable />} />
          <Route path="deliberations" element={<DeliberationsResponsablePage />} />
          <Route path="statistiques" element={<StatistiquesResponsablePage />} />
          <Route path="classements" element={<ClassementsPage />} />
        </Route>

        {/* Département */}
        <Route path="/departement" element={
          <ProtectedRoute roles={['ROLE_CHEF_DEPARTEMENT']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardDepartement />} />
          <Route path="resultats" element={<ResultatsPage />} />
          <Route path="statistiques" element={<StatistiquesDepartementPage />} />
        </Route>

        {/* Redirections */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}