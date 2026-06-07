import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Spinner from '../components/ui/Spinner'

import Login        from '../pages/Login'
import Register     from '../pages/Register'
import Bodega       from '../pages/Bodega'
import WineDetail   from '../pages/WineDetail'
import Scan         from '../pages/Scan'
import Catas        from '../pages/Catas'
import NuevaCata    from '../pages/NuevaCata'
import TastingDetail from '../pages/TastingDetail'
import Sommelier    from '../pages/Sommelier'
import Stats        from '../pages/Stats'

function ProtectedRoute() {
  const { session, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center" style={{ background: '#1A0A0E' }}>
        <Spinner />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/bodega" replace /> },

  { path: '/login',    element: <Login /> },
  { path: '/register', element: <Register /> },

  {
    element: <ProtectedRoute />,
    children: [
      { path: '/bodega',       element: <Bodega /> },
      { path: '/bodega/:id',   element: <WineDetail /> },
      { path: '/scan',         element: <Scan /> },
      { path: '/catas',        element: <Catas /> },
      { path: '/catas/nueva',  element: <NuevaCata /> },
      { path: '/catas/:id',    element: <TastingDetail /> },
      { path: '/sommelier',    element: <Sommelier /> },
      { path: '/stats',        element: <Stats /> },
    ],
  },
])
