import React, { useState } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import {
  Lock,
  Mail,
  User,
  Loader2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  ShieldCheck,
  Building2,
} from 'lucide-react'
import { useAuth, type PerfilUsuario } from '@/context/AuthContext'

export default function Cadastro() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [perfil, setPerfil] = useState<PerfilUsuario>('contador')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { signup, isAuthenticated } = useAuth()
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

  // Se já estiver logado, redireciona
  React.useEffect(() => {
    if (isAuthenticated) {
      const target = destination || '/minha-conta'
      navigate(target, { replace: true })
    }
  }, [isAuthenticated, navigate, destination])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.')
      return
    }

    if (password !== passwordConfirm) {
      setError('As senhas não coincidem. Digite novamente.')
      return
    }

    setIsLoading(true)

    try {
      await signup(nome, email, password, passwordConfirm, perfil)
      // Após cadastrar, direciona para o destino solicitado ou conforme perfil
      // Para contador: dados-empresa ou destino
      // Para empresário: minha-conta (ou destino se especificado)
      const target = destination || (perfil === 'empresario' ? '/minha-conta' : '/dados-empresa')
      navigate(target, { replace: true })
    } catch (err: any) {
      console.error('Falha no cadastro:', err)
      if (err?.data?.data?.email?.message) {
        setError('Este e-mail já está cadastrado. Tente fazer login ou use outro endereço.')
      } else {
        setError(
          err?.message ||
            'Não foi possível criar sua conta. Verifique os dados informados e tente novamente.',
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-28 pb-16 flex items-center justify-center bg-slate-50 px-4 sm:px-6">
      <div className="w-full max-w-md">
        {/* Card de Cadastro */}
        <div className="bg-white rounded-[24px] p-8 border border-slate-200 shadow-xl">
          {/* Logo / Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#07132B] text-[#D4AF37] mb-3 shadow-md border border-[#D4AF37]/30">
              <TrendingUp className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h1 className="font-heading font-bold text-2xl text-slate-900 tracking-tight">
              Criar Conta na Plataforma
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Acesso completo a diagnósticos, simulações e inteligência tributária IBS/CBS
            </p>
          </div>

          {/* Benefícios rápidos */}
          <div className="mb-6 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2ECC71] shrink-0" />
              <span>Dados salvos em nuvem vinculados à sua conta</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2ECC71] shrink-0" />
              <span>Acesso a diagnósticos e simulações da Reforma Tributária</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2ECC71] shrink-0" />
              <span>Atendimento consultivo personalizado pela equipe Diamond</span>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-[#E74C3C] flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Pergunta: Você é contador ou empresário? (SEM ÍCONES) */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Você é contador ou empresário? *
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Personalizamos sua área de trabalho e ferramentas de acordo com a sua atuação.
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPerfil('contador')}
                  className={`py-3 px-3 rounded-xl text-left border transition-all text-xs font-heading ${
                    perfil === 'contador'
                      ? 'bg-[#07132B] text-white border-[#D4AF37] shadow-sm ring-1 ring-[#D4AF37]'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="block font-bold text-sm">Contador</span>
                  <span
                    className={`block text-[11px] mt-0.5 ${
                      perfil === 'contador' ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    Gestão de carteira, clientes e ferramentas avançadas
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPerfil('empresario')}
                  className={`py-3 px-3 rounded-xl text-left border transition-all text-xs font-heading ${
                    perfil === 'empresario'
                      ? 'bg-[#07132B] text-white border-[#D4AF37] shadow-sm ring-1 ring-[#D4AF37]'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="block font-bold text-sm">Empresário (Cliente)</span>
                  <span
                    className={`block text-[11px] mt-0.5 ${
                      perfil === 'empresario' ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    Acompanhamento do seu negócio e seus diagnósticos
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="nome"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Seu Nome Completo *
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="nome"
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Carlos Eduardo Silva"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 input-focus-ring"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                E-mail Corporativo *
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="carlos@empresa.com.br"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 input-focus-ring"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Senha (mínimo 8 dígitos) *
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 input-focus-ring"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="passwordConfirm"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Confirmar Senha *
              </label>
              <div className="relative">
                <ShieldCheck className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="passwordConfirm"
                  type="password"
                  required
                  minLength={8}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 input-focus-ring"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl font-heading font-semibold text-sm text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-md transition-all duration-200 hover:-translate-y-0.5 btn-press flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#0A1A13]" />
                  <span>Criando conta...</span>
                </>
              ) : (
                <>
                  <span>Criar Minha Conta Gratuita</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Link para Login */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Já possui conta na plataforma?{' '}
              <Link
                to={destination ? `/login?redirect=${encodeURIComponent(destination)}` : '/login'}
                state={location.state}
                className="font-bold text-[#145A32] hover:underline"
              >
                Entrar agora
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
