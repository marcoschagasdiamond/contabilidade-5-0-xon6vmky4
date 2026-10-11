import React, { createContext, useContext, useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

interface AuthContextType {
  user: RecordModel | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  login: (email: string, pass: string) => Promise<void>
  signup: (nome: string, email: string, pass: string, passConfirm: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<RecordModel | null>(pb.authStore.record)
  const [token, setToken] = useState<string | null>(pb.authStore.token)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initial sync
    setUser(pb.authStore.record)
    setToken(pb.authStore.token)
    setIsLoading(false)

    // Listen for auth store changes
    const unsubscribe = pb.authStore.onChange((newToken, newModel) => {
      setToken(newToken)
      setUser(newModel)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const login = async (email: string, pass: string) => {
    await pb.collection('users').authWithPassword(email, pass)
    setUser(pb.authStore.record)
    setToken(pb.authStore.token)
  }

  const signup = async (nome: string, email: string, pass: string, passConfirm: string) => {
    await pb.collection('users').create({
      name: nome.trim(),
      email: email.trim().toLowerCase(),
      password: pass,
      passwordConfirm: passConfirm,
    })
    // Auto-login após o cadastro
    await pb.collection('users').authWithPassword(email.trim().toLowerCase(), pass)
    setUser(pb.authStore.record)
    setToken(pb.authStore.token)
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
    setToken(null)
  }

  const isAdmin = user?.email === 'marcoschagasdiamond@icloud.com'

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        isAdmin,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
