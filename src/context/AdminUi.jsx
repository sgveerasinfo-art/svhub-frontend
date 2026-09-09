import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

const AdminUiContext = createContext(null)

export function AdminUiProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [confirmState, setConfirmState] = useState(null)
  const confirmRef = useRef(null)

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback((tone, message) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    setToasts((current) => [...current.slice(-3), { id, tone, message }])
    window.setTimeout(() => dismissToast(id), 3200)
  }, [dismissToast])

  const toast = useMemo(
    () => ({
      success: (message) => pushToast('success', message),
      error: (message) => pushToast('error', message),
      info: (message) => pushToast('info', message),
    }),
    [pushToast],
  )

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      confirmRef.current = resolve
      setConfirmState({
        title: 'Please confirm',
        message: '',
        confirmLabel: 'Confirm',
        cancelLabel: 'Cancel',
        danger: false,
        ...options,
      })
    })
  }, [])

  const settleConfirm = useCallback((result) => {
    confirmRef.current?.(result)
    confirmRef.current = null
    setConfirmState(null)
  }, [])

  const value = useMemo(
    () => ({ toast, confirm, toasts, dismissToast, confirmState, settleConfirm }),
    [toast, confirm, toasts, dismissToast, confirmState, settleConfirm],
  )

  return <AdminUiContext.Provider value={value}>{children}</AdminUiContext.Provider>
}

export function useAdminUi() {
  const context = useContext(AdminUiContext)
  if (!context) throw new Error('useAdminUi must be used within AdminUiProvider')
  return context
}

export function usePagedList(items, pageSize = 8, resetKey = '') {
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [resetKey])

  const total = items.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1)
  const current = Math.min(page, pageCount)
  const start = (current - 1) * pageSize

  return {
    page: current,
    setPage,
    pageCount,
    total,
    from: total ? start + 1 : 0,
    to: Math.min(start + pageSize, total),
    items: items.slice(start, start + pageSize),
  }
}
