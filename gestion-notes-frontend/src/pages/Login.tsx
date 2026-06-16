import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-toastify'
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  BookOpen,
  UserCircle2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import heroImage from '../assets/hero.png'

// ─── Schéma ──────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

type LoginForm = z.infer<typeof loginSchema>

// ─── Redirection par rôle ────────────────────────────────────────────────────

const roleRedirect: Record<string, string> = {
  ROLE_SUPER_ADMIN: '/admin/dashboard',
  ROLE_ADMIN:       '/admin/dashboard',
  ROLE_ENSEIGNANT:  '/enseignant/dashboard',
  ROLE_ETUDIANT:    '/etudiant/dashboard',
}

// ─── Raccourcis comptes de test ───────────────────────────────────────────────

const QUICK_LOGINS = [
  {
    label: 'Admin',
    email: 'admin@univ.mg',
    password: 'Admin@1234',
    icon: ShieldCheck,
    color: '#065f46',
    bg: '#d1fae5',
  },
  {
    label: 'Super Admin',
    email: 'superadmin@univ.mg',
    password: 'Super@1234',
    icon: ShieldCheck,
    color: '#7c3aed',
    bg: '#ede9fe',
  },
  {
    label: 'Enseignant',
    email: 'enseignant@univ.mg',
    password: 'Ens@1234',
    icon: BookOpen,
    color: '#1e40af',
    bg: '#dbeafe',
  },
  {
    label: 'Étudiant',
    email: 'toky@univ.mg',
    password: 'Etu@1234',
    icon: UserCircle2,
    color: '#92400e',
    bg: '#fef3c7',
  },
]

// ─── Styles ───────────────────────────────────────────────────────────────────

const ENI_GREEN = '#065f46'
const ENI_DARK  = '#064e3b'

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  card: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    width: '100%',
    maxWidth: '880px',
    minHeight: '560px',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 24px 64px rgba(0,0,0,0.14)',
  },
  left: {
    background: ENI_DARK,
    padding: '2.5rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  right: {
    backgroundColor: '#ffffff',
    padding: '2.5rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  heroImg: {
    width: '100%',
    height: '180px',
    objectFit: 'cover',
    borderRadius: '10px',
    opacity: 0.88,
    marginBottom: '1.5rem',
    border: '0.5px solid rgba(255,255,255,0.1)',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '2rem',
  },
  logoBox: {
    width: '36px',
    height: '36px',
    backgroundColor: 'white',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badge: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#6ee7b7',
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
  },
  leftTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: 'white',
    margin: '0 0 0.35rem',
  },
  leftSub: {
    fontSize: '12px',
    color: '#6ee7b7',
    margin: '0 0 1.25rem',
    lineHeight: 1.6,
  },
  featureRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  featureText: {
    fontSize: '12px',
    color: '#a7f3d0',
  },
  copyright: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.25)',
    margin: 0,
  },
  rightTitle: {
    fontSize: '22px',
    fontWeight: 600,
    color: '#111827',
    margin: '0 0 0.25rem',
  },
  rightSub: {
    fontSize: '13px',
    color: '#6b7280',
    margin: '0 0 2rem',
  },
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    color: '#6b7280',
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    marginBottom: '6px',
  },
  inputWrap: {
    position: 'relative' as const,
    marginBottom: '1.25rem',
  },
  input: {
    width: '100%',
    padding: '10px 12px 10px 38px',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#111827',
    backgroundColor: '#f9fafb',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s, background 0.15s',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  inputIcon: {
    position: 'absolute' as const,
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
    pointerEvents: 'none' as const,
  },
  eyeBtn: {
    position: 'absolute' as const,
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#9ca3af',
    padding: 0,
    display: 'flex',
  },
  errMsg: {
    color: '#ef4444',
    fontSize: '12px',
    marginTop: '4px',
  },
  submitBtn: {
    width: '100%',
    padding: '11px',
    backgroundColor: ENI_GREEN,
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '1.5rem',
    transition: 'background 0.2s',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '1rem',
  },
  divLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#e5e7eb',
  },
  divText: {
    fontSize: '11px',
    color: '#9ca3af',
    whiteSpace: 'nowrap' as const,
  },
  quickGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    gap: '6px',
  },
  quickBtn: {
    padding: '8px 6px',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
    transition: 'border-color 0.15s, background 0.15s',
  },
  quickLabel: {
    fontSize: '11px',
    color: '#374151',
    fontWeight: 500,
  },
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function Login() {
  const { login } = useAuth()
  const navigate   = useNavigate()
  const [isLoading, setIsLoading]     = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  // ── Connexion ──────────────────────────────────────────────────────────────

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      await login({ email: data.email, password: data.password })
      toast.success('Connexion réussie !')

      // Lire les rôles depuis localStorage (persistés par AuthContext)
      const stored = localStorage.getItem('eni_user')
      const savedUser = stored ? JSON.parse(stored) : null
      const roles: string[] = savedUser?.roles ?? []

      // Redirection selon premier rôle trouvé
      for (const [role, path] of Object.entries(roleRedirect)) {
        if (roles.includes(role)) {
          navigate(path)
          return
        }
      }
      // Fallback
      navigate('/admin/dashboard')
    } catch (err: unknown) {
      const error = err as { message?: string; response?: { data?: { message?: string } } }
      toast.error(
        error.response?.data?.message ??
        error.message ??
        'Identifiants incorrects'
      )
    } finally {
      setIsLoading(false)
    }
  }

  // ── Raccourci rôle ─────────────────────────────────────────────────────────

  const fillQuick = (email: string, password: string) => {
    setValue('email', email)
    setValue('password', password)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={S.page}>
      <div style={S.card}>

        {/* ── Panneau gauche ─────────────────────────── */}
        <div style={S.left}>
          {/* Cercles décoratifs */}
          <div style={{
            position: 'absolute', top: '-70px', right: '-70px',
            width: '240px', height: '240px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.03)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-50px', left: '-50px',
            width: '200px', height: '200px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.03)',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Logo */}
            <div style={S.logoRow}>
              <div style={S.logoBox}>
                <GraduationCap size={20} color={ENI_DARK} />
              </div>
              <span style={S.badge}>ENI Madagascar</span>
            </div>

            {/* Image école */}
            <img
              src={heroImage}
              alt="Campus ENI"
              style={S.heroImg}
            />

            {/* Titre + desc */}
            <h2 style={S.leftTitle}>École Nationale d'Informatique</h2>
            <p style={S.leftSub}>
              Plateforme de gestion académique — notes, délibérations et relevés en ligne.
            </p>

            {/* Features */}
            {[
              'Saisie et suivi des notes par matière',
              'Délibérations automatisées et relevés PDF',
              'Accès sécurisé et personnalisé par rôle',
            ].map(f => (
              <div key={f} style={S.featureRow}>
                <CheckCircle2 size={13} color="#34d399" style={{ flexShrink: 0 }} />
                <span style={S.featureText}>{f}</span>
              </div>
            ))}
          </div>

          <p style={S.copyright}>© 2026 ENI — Tous droits réservés</p>
        </div>

        {/* ── Panneau droit ──────────────────────────── */}
        <div style={S.right}>
          <h1 style={S.rightTitle}>Connexion</h1>
          <p style={S.rightSub}>Accédez à votre espace personnel</p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>

            {/* Email */}
            <label style={S.label}>Adresse email</label>
            <div style={S.inputWrap}>
              <Mail size={15} style={S.inputIcon} />
              <input
                {...register('email')}
                type="email"
                placeholder="exemple@eni.mg"
                style={{
                  ...S.input,
                  ...(errors.email ? S.inputError : {}),
                }}
                onFocus={e => { e.target.style.borderColor = ENI_GREEN; e.target.style.backgroundColor = '#fff' }}
                onBlur={e  => { e.target.style.borderColor = errors.email ? '#ef4444' : '#e5e7eb'; e.target.style.backgroundColor = '#f9fafb' }}
              />
              {errors.email && <p style={S.errMsg}>{errors.email.message}</p>}
            </div>

            {/* Mot de passe */}
            <label style={S.label}>Mot de passe</label>
            <div style={{ ...S.inputWrap, marginBottom: '1.75rem' }}>
              <Lock size={15} style={S.inputIcon} />
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                style={{
                  ...S.input,
                  paddingRight: '38px',
                  ...(errors.password ? S.inputError : {}),
                }}
                onFocus={e => { e.target.style.borderColor = ENI_GREEN; e.target.style.backgroundColor = '#fff' }}
                onBlur={e  => { e.target.style.borderColor = errors.password ? '#ef4444' : '#e5e7eb'; e.target.style.backgroundColor = '#f9fafb' }}
              />
              <button
                type="button"
                style={S.eyeBtn}
                onClick={() => setShowPassword(p => !p)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword
                  ? <EyeOff size={15} />
                  : <Eye size={15} />}
              </button>
              {errors.password && <p style={S.errMsg}>{errors.password.message}</p>}
            </div>

            {/* Bouton */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                ...S.submitBtn,
                backgroundColor: isLoading ? '#6ee7b7' : ENI_GREEN,
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Connexion…</>
                : 'Se connecter'}
            </button>
          </form>

          {/* Raccourcis démo */}
          <div style={S.divider}>
            <div style={S.divLine} />
            <span style={S.divText}>Comptes de démonstration</span>
            <div style={S.divLine} />
          </div>

          <div style={S.quickGrid}>
            {QUICK_LOGINS.map(({ label, email, password, icon: Icon, color, bg }) => (
              <button
                key={label}
                type="button"
                style={S.quickBtn}
                onClick={() => fillQuick(email, password)}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = color
                  ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = bg
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb'
                  ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
                }}
                title={`Se connecter en tant que ${label} (${email})`}
              >
                <Icon size={16} color={color} />
                <span style={{ ...S.quickLabel, color }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @media (max-width: 640px) {
          .login-grid { grid-template-columns: 1fr !important; }
          .login-left { display: none !important; }
        }
      `}</style>
    </div>
  )
}