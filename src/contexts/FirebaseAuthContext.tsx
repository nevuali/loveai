import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from 'firebase/auth'
import { firebaseAuth } from '../config/firebase'

interface FirebaseAuthContextType {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, displayName?: string) => Promise<User>
  signIn: (email: string, password: string) => Promise<User>
  signInWithGoogle: () => Promise<User>
  signOut: () => Promise<void>
  getIdToken: () => Promise<string | null>
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined)

// eslint-disable-next-line react-refresh/only-export-components
export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext)
  if (context === undefined) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider')
  }
  return context
}

interface FirebaseAuthProviderProps {
  children: ReactNode
}

export function FirebaseAuthProvider({ children }: FirebaseAuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
      console.log('🔥 Firebase Auth state changed:', user ? '✅ Authenticated' : '❌ Not authenticated')
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, displayName?: string) => {
    const user = await firebaseAuth.signUp(email, password, displayName)
    return user
  }

  const signIn = async (email: string, password: string) => {
    const user = await firebaseAuth.signIn(email, password)
    return user
  }

  const signInWithGoogle = async () => {
    const user = await firebaseAuth.signInWithGoogle()
    return user
  }

  const signOut = async () => {
    await firebaseAuth.signOut()
  }

  const getIdToken = async () => {
    return await firebaseAuth.getIdToken()
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    getIdToken
  }

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  )
} 