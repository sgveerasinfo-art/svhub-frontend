import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { readToken } from '../../api/auth.js'
import { hasAdminAccess } from '../../utils/adminAuth.js'

export default function RequireAdmin() {
  const { user } = useAuth()
  const location = useLocation()
  const token = readToken()

  if (!token || !user || !hasAdminAccess(user)) {
    return <Navigate to="/admin/login" replace state={{ from: `${location.pathname}${location.search}` }} />
  }

  return <Outlet />
}
