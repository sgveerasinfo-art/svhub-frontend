import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import * as authApi from '../api/auth.js'
import { getFirebaseAuth } from '../lib/firebase.js'
import { mapFirebaseError, signInWithGooglePopup, signOutFirebase } from '../lib/googleAuth.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authApi.readSession())
  const exchanging = useRef(false)

  const applySession = useCallback((session) => {
    setUser(session)
    return session
  }, [])

  const exchangeGoogleToken = useCallback(
    async (idToken) => {
      const result = await authApi.loginWithGoogle(idToken)
      return applySession(result.user)
    },
    [applySession],
  )

  const login = useCallback(async (payload) => {
    const session = await authApi.login(payload)
    return applySession(session)
  }, [applySession])

  const loginWithGoogle = useCallback(async () => {
    exchanging.current = true
    try {
      const idToken = await signInWithGooglePopup()
      const result = await authApi.loginWithGoogle(idToken)
      applySession(result.user)
      return result
    } catch (error) {
      throw mapFirebaseError(error)
    } finally {
      exchanging.current = false
    }
  }, [applySession])

  const register = useCallback(async (payload) => {
    return authApi.register(payload)
  }, [])

  const requestReset = useCallback(async (email) => authApi.requestReset(email), [])

  const inspectResetToken = useCallback(async (token) => authApi.inspectResetToken(token), [])

  const resetPassword = useCallback(async (payload) => authApi.resetPassword(payload), [])

  const updateProfile = useCallback(
    async (payload) => applySession(await authApi.updateProfile(payload)),
    [applySession],
  )

  const logout = useCallback(async () => {
    authApi.logout()
    setUser(null)
    try {
      await signOutFirebase()
    } catch {
      // Local session is already cleared.
    }
  }, [])

  useEffect(() => {
    const auth = getFirebaseAuth()
    if (!auth) return undefined

    return onAuthStateChanged(auth, async (firebaseUser) => {
      const path = window.location.pathname
      const onAuthScreen =
        path === '/login' ||
        path === '/admin/login' ||
        path === '/register' ||
        path === '/forgot-password' ||
        path === '/reset-password'
      if (!firebaseUser || authApi.readToken() || exchanging.current || onAuthScreen) return

      exchanging.current = true
      try {
        const idToken = await firebaseUser.getIdToken()
        await exchangeGoogleToken(idToken)
      } catch {
        // Keep email/password sessions if Google restore fails.
      } finally {
        exchanging.current = false
      }
    })
  }, [exchangeGoogleToken])

  const value = useMemo(
    () => ({
      user,
      login,
      loginWithGoogle,
      register,
      requestReset,
      inspectResetToken,
      resetPassword,
      updateProfile,
      logout,
    }),
    [user, login, loginWithGoogle, register, requestReset, inspectResetToken, resetPassword, updateProfile, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
