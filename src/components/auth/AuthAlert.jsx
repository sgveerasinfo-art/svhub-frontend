function AuthAlert({ children, tone = 'error' }) {
  if (!children) return null

  const modifier =
    tone === 'success'
      ? ' auth-alert--success'
      : tone === 'info'
        ? ' auth-alert--info'
        : ''

  return (
    <p
      className={`auth-alert${modifier}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {children}
    </p>
  )
}

export default AuthAlert
