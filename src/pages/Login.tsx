import React, { useState } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import {
  Lock,
  Mail,
  Loader2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Building2,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { login, isAuthenticated, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  // Helper para obter o destino de retorno (state ou query param ?redirect=...)
  const getDestination = (): string | null => {
    const fromState = (location.state as { from?: { pathname: string; search?: string } })?.from
    if (fromState) {
      return `${fromState.pathname}${fromState.search || ''}`
    }
    const redirectParam = searchParams.get('redirect')
    if (redirectParam && redirectParam.startsWith('/')) {
      return redirectParam
    }
    return null
  }

  const destination = getDestination()

  // Se já estiver logado, redireciona adequadamente
  React.useEffect(() => {
    if (isAuthenticated) {
      if (destination) {
        navigate(destination, { replace: true })
      } else if (isAdmin) {
        navigate('/admin', { replace: true })
      } else {
        navigate('/minha-conta', { replace: true })
      }
    }
  }, [isAuthenticated, isAdmin, navigate, destination])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await login(email.trim().toLowerCase(), password)
      if (destination) {
        navigate(destination, { replace: true })
      } else if (email.trim().toLowerCase() === 'marcoschagasdiamond@icloud.com') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/minha-conta', { replace: true })
      }
    } catch (err: unknown) {
      console.error('Falha no login:', err)
      setError('E-mail ou senha inválidos. Por favor, verifique suas credenciais.')
    } finally {
      setIsLoading(false)
    }
  }

  // Preencher credenciais de admin para teste rápido
  const preencherAdmin = () => {
    setEmail('marcoschagasdiamond@icloud.com')
    setPassword('M@c318180')
  }

  return (
    <div className="min-h-screen pt-28 pb-16 flex items-center justify-center bg-slate-50 px-4 sm:px-6">
      <div className="w-full max-w-md">
        {/* Card de Login */}
        <div className="bg-white rounded-[24px] p-8 border border-slate-200 shadow-xl">
          {/* Logo / Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#07132B] text-[#2ECC71] mb-4 shadow-md border border-white/10">
              <TrendingUp className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h1 className="font-heading font-bold text-2xl text-slate-900 tracking-tight">
              Acesse sua Conta
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Clientes e Administradores da Contabilidade 5.0
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-[#E74C3C] flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@empresa.com.br"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 input-focus-ring"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Senha
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 input-focus-ring"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl font-heading font-semibold text-sm text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-md transition-all duration-200 hover:-translate-y-0.5 btn-press flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#0A1A13]" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Entrar na Plataforma</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Atalho para Administrador */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">É o administrador?</span>
            <button
              type="button"
              onClick={preencherAdmin}
              className="font-medium text-[#145A32] hover:text-[#2ECC71] underline transition-colors"
            >
              Preencher credenciais do Admin
            </button>
          </div>

          {/* Link para Criar Conta */}
          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Ainda não tem conta de cliente?{' '}
              <Link
                to={
                  destination
                    ? `/cadastro?redirect=${encodeURIComponent(destination)}`
                    : '/cadastro'
                }
                state={location.state}
                className="font-bold text-[#145A32] hover:underline"
              >
                Cadastre-se gratuitamente
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
