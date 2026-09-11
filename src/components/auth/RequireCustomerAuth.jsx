import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { readToken } from '../../api/auth.js'

export default function RequireCustomerAuth({
  redirectTo = '/login',
  message = 'Please log in to continue with your order.',
}) {
  const { user } = useAuth()
  const location = useLocation()
  const token = readToken()

  if (!token && !user) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{
          from: `${location.pathname}${location.search}`,
          message,
        }}
      />
    )
  }

  return <Outlet />
}
