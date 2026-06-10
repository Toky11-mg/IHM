import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-6xl font-bold text-gray-300">404</h1>
      <p className="text-gray-500 mt-4 mb-8">Page introuvable</p>
      <button
        onClick={() => navigate(-1)}
        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
      >
        Retour
      </button>
    </div>
  )
}