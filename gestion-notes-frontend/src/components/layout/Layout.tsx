// src/components/layout/Layout.tsx
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f9fafb', overflow: 'hidden' }}>

      {/* Sidebar fixe */}
      <Sidebar />

      {/* Contenu principal */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

        {/* Header */}
        <Header />

        {/* Page */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </main>

      </div>
    </div>
  )
}