import React, { createContext, useContext, useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

interface AuthContextType {
  user: RecordModel | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  isPremium: boolean
  plano: 'gratuito' | 'premium'
  simulacoesUsadas: number
  diagnosticosUsados: number
  simulacoesRestantes: number
  diagnosticosRestantes: number
  podeSimular: boolean
  podeDiagnosticar: boolean
  podeBaixarPdfDiagnostico: boolean
  recarregarUsuario: () => Promise<void>
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

  const recarregarUsuario = async () => {
    if (!pb.authStore.record?.id) return
    try {
      const updated = await pb.collection('users').getOne(pb.authStore.record.id)
      setUser(updated)
      pb.authStore.save(pb.authStore.token, updated)
    } catch (err) {
      console.warn('Erro ao recarregar dados do usuário:', err)
    }
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
    setToken(null)
  }

  const isAdmin =
    (user as any)?.role === 'admin' || user?.email === 'marcoschagasdiamond@icloud.com'

  const isPremium =
    isAdmin || (user as any)?.is_premium === true || (user as any)?.plano === 'premium'

  const plano: 'gratuito' | 'premium' = isPremium ? 'premium' : 'gratuito'

  // Contadores de uso
  const simulacoesUsadas =
    (user as any)?.simulacoes_usadas ??
    (typeof window !== 'undefined'
      ? parseInt(localStorage.getItem('c50_simulacoes_usadas') || '0', 10)
      : 0)
  const diagnosticosUsados =
    (user as any)?.diagnosticos_usados ??
    (typeof window !== 'undefined'
      ? parseInt(localStorage.getItem('c50_diagnosticos_usados') || '0', 10)
      : 0)

  const simulacoesRestantes = isPremium ? 999 : Math.max(0, 3 - simulacoesUsadas)
  const diagnosticosRestantes = isPremium ? 999 : Math.max(0, 1 - diagnosticosUsados)

  const podeSimular = isPremium || simulacoesUsadas < 3
  const podeDiagnosticar = isPremium || diagnosticosUsados < 1
  const podeBaixarPdfDiagnostico = isPremium

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        isAdmin,
        isPremium,
        plano,
        simulacoesUsadas,
        diagnosticosUsados,
        simulacoesRestantes,
        diagnosticosRestantes,
        podeSimular,
        podeDiagnosticar,
        podeBaixarPdfDiagnostico,
        recarregarUsuario,
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
