// src/routes/AppRoutes.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Layout
import Layout from '../components/layout/Layout'

// Auth
import Login    from '../pages/Login'
import NotFound from '../pages/NotFound'

// Admin
import AdminDashboard from '../pages/admin/Dashboard'
import Matieres       from '../pages/admin/Matieres'
import Annees         from '../pages/admin/Annees'
import Filieres       from '../pages/admin/Filieres'
import Etudiants      from '../pages/admin/Etudiants'
import Enseignants    from '../pages/admin/Enseignants'
import Deliberations  from '../pages/admin/Deliberations'
import Statistiques   from '../pages/admin/Statistiques'
import Audit          from '../pages/admin/Audit'

// Enseignant
import EnseignantDashboard from '../pages/enseignant/Dashboard'
import MesMatieres         from '../pages/enseignant/MesMatieres'
import SaisieNotes         from '../pages/enseignant/SaisieNotes'
import Historique          from '../pages/enseignant/Historique'

// Étudiant
import EtudiantDashboard from '../pages/etudiant/Dashboard'
import MesNotes          from '../pages/etudiant/MesNotes'
import MesReleves        from '../pages/etudiant/MesReleves'
import MesReclamations   from '../pages/etudiant/MesReclamations'

// ─── ProtectedRoute ───────────────────────────────────────────────────────────

interface ProtectedRouteProps {
  children: React.ReactNode
  roles?: string[]
}

function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, hasRole, isLoading } = useAuth()

  // Attendre la restauration de session avant de rediriger
  if (isLoading) return null

  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (roles && roles.length > 0 && !roles.some(r => hasRole(r))) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// ─── Routes ───────────────────────────────────────────────────────────────────

const ADMIN_ROLES = ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public */}
        <Route path="/"      element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* Admin */}
        <Route path="/admin" element={
          <ProtectedRoute roles={ADMIN_ROLES}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index                element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"     element={<AdminDashboard />} />
          <Route path="matieres"      element={<Matieres />} />
          <Route path="annees"        element={<Annees />} />
          <Route path="filieres"      element={<Filieres />} />
          <Route path="etudiants"     element={<Etudiants />} />
          <Route path="enseignants"   element={<Enseignants />} />
          <Route path="deliberations" element={<Deliberations />} />
          <Route path="statistiques"  element={<Statistiques />} />
          <Route path="audit"         element={<Audit />} />
        </Route>

        {/* Enseignant */}
        <Route path="/enseignant" element={
          <ProtectedRoute roles={['ROLE_ENSEIGNANT']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index                element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"     element={<EnseignantDashboard />} />
          <Route path="mes-matieres"  element={<MesMatieres />} />
          <Route path="saisie-notes"  element={<SaisieNotes />} />
          <Route path="historique"    element={<Historique />} />
        </Route>

        {/* Étudiant */}
        <Route path="/etudiant" element={
          <ProtectedRoute roles={['ROLE_ETUDIANT']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index                   element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"        element={<EtudiantDashboard />} />
          <Route path="mes-notes"        element={<MesNotes />} />
          <Route path="mes-releves"      element={<MesReleves />} />
          <Route path="mes-reclamations" element={<MesReclamations />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  )
}