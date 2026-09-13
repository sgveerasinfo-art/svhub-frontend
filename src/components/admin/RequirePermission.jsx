import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { hasPermission } from '../../utils/adminPermissions.js'

export default function RequirePermission({ permission, fallback = '/admin' }) {
  const { user } = useAuth()

  if (!hasPermission(user, permission)) {
    return <Navigate to={fallback} replace />
  }

  return <Outlet />
}
