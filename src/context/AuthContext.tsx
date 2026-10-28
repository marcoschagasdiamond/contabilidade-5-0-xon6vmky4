import React, { createContext, useContext, useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export type PerfilUsuario = 'contador' | 'empresario'
export type NivelAcesso = 'master' | 'admin' | 'analista' | 'empresario'

/**
 * Remove do localStorage todas as chaves de cache e dados de sessão/cliente,
 * prevenindo vazamento de dados pós-logout para usuários deslogados.
 */
export function limparEstadoLocalSessao(): void {
  if (typeof window === 'undefined') return
  try {
    const chavesParaRemover = [
      'contabilidade5_dados_empresa',
      'contabilidade50_dados_empresa_v1',
      'contabilidade50_cliente_ativo_id_v1',
      'contabilidade50_simulacoes_v1',
      'contabilidade50_simulacoes_calculadora_v1',
      'c50_simulacoes_recuperador_v1',
      'contabilidade50_simulacoes_recuperador_v1',
      'contabilidade50_responsavel_tecnico',
      'contabilidade50_responsavel_tecnico_v1',
      'c50_simulacoes_usadas',
      'c50_diagnosticos_usados',
      'contabilidade50_aviso_migracao_dispensado',
      'contabilidade50_carteira_clientes_v1',
      'contabilidade50_conversas_assistente_local_v1',
      'contabilidade50_historico_relatorios_local',
      'c50_master_usuarios',
    ]

    chavesParaRemover.forEach((chave) => {
      try {
        localStorage.removeItem(chave)
      } catch (err) {
        console.warn(`Erro ao remover chave ${chave} do localStorage:`, err)
      }
    })

    // Remove preventivamente qualquer chave remanescente iniciada com contabilidade5 ou c50
    const totalKeys = localStorage.length
    const chavesGerais: string[] = []
    for (let i = 0; i < totalKeys; i++) {
      const k = localStorage.key(i)
      if (k && (k.startsWith('contabilidade5') || k.startsWith('c50_'))) {
        chavesGerais.push(k)
      }
    }
    chavesGerais.forEach((k) => {
      try {
        localStorage.removeItem(k)
      } catch {
        /* intentionally ignored */
      }
    })

    // Dispara evento para sincronizar componentes ouvintes
    window.dispatchEvent(new CustomEvent('contabilidade5_dados_empresa_updated', { detail: null }))
  } catch (err) {
    console.error('Erro ao executar limparEstadoLocalSessao:', err)
  }
}

interface AuthContextType {
  user: RecordModel | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  isMaster: boolean
  nivelAcesso: NivelAcesso
  permissoes: string[]
  temPermissao: (perm: string) => boolean
  isPremium: boolean
  perfil: PerfilUsuario
  isContador: boolean
  isEmpresario: boolean
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
  signup: (
    nome: string,
    email: string,
    pass: string,
    passConfirm: string,
    perfil?: PerfilUsuario,
  ) => Promise<void>
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

  const signup = async (
    nome: string,
    email: string,
    pass: string,
    passConfirm: string,
    perfilEscolhido: PerfilUsuario = 'contador',
  ) => {
    await pb.collection('users').create({
      name: nome.trim(),
      email: email.trim().toLowerCase(),
      password: pass,
      passwordConfirm: passConfirm,
      perfil: perfilEscolhido,
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
    limparEstadoLocalSessao()
    pb.authStore.clear()
    setUser(null)
    setToken(null)
  }

  const isEmailMarco = user?.email?.toLowerCase() === 'marcoschagasdiamond@icloud.com'
  const rawNivel = (user as any)?.nivel_acesso as NivelAcesso | undefined

  const isMaster = isEmailMarco || rawNivel === 'master'

  const isAdmin = isMaster || rawNivel === 'admin' || (user as any)?.role === 'admin'

  const nivelAcesso: NivelAcesso = isMaster
    ? 'master'
    : rawNivel === 'admin'
      ? 'admin'
      : (user as any)?.perfil === 'empresario' || rawNivel === 'empresario'
        ? 'empresario'
        : 'analista'

  let rawPermissoes = (user as any)?.permissoes_json
  if (typeof rawPermissoes === 'string') {
    try {
      rawPermissoes = JSON.parse(rawPermissoes)
    } catch (_) {
      rawPermissoes = []
    }
  }
  const permissoes: string[] = Array.isArray(rawPermissoes) ? rawPermissoes : []

  const temPermissao = (perm: string): boolean => {
    if (isMaster) return true
    if (permissoes.includes(perm)) return true
    return false
  }

  // Perfil: 'contador' ou 'empresario'. Se não preenchido ou vazio, padrão seguro é 'contador'
  const rawPerfil = (user as any)?.perfil
  const perfil: PerfilUsuario = rawPerfil === 'empresario' ? 'empresario' : 'contador'

  const isContador = perfil === 'contador'
  const isEmpresario = perfil === 'empresario'

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
        isMaster,
        nivelAcesso,
        permissoes,
        temPermissao,
        isPremium,
        perfil,
        isContador,
        isEmpresario,
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
