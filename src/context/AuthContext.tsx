import React, { createContext, useContext, useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

interface AuthContextType {
  user: RecordModel | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, pass: string) => Promise<void>
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

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
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
