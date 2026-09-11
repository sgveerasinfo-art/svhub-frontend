import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDDN5ax4wfg0TvgHmrAf_-EhzEnmsKm2a4',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'sv-hub-8de4c.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'sv-hub-8de4c',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'sv-hub-8de4c.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '766325265226',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:766325265226:web:38ece601aa69fe4d8927b3',
}

const configured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
)

const app = configured ? initializeApp(firebaseConfig) : null
const auth = app ? getAuth(app) : null

export function isFirebaseConfigured() {
  return Boolean(auth)
}

export function getFirebaseAuth() {
  return auth
}

export function createGoogleProvider() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  return provider
}
