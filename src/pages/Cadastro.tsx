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
import { validarTokenConvite, aceitarConviteCliente } from '@/services/planos'

export default function Cadastro() {
  const CHAVE_RASCUNHO = 'contabilidade50_rascunho_dados_empresa'

  const [nome, setNome] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const salvo = localStorage.getItem(CHAVE_RASCUNHO)
        if (salvo) {
          const parsed = JSON.parse(salvo)
          return parsed.nomeContato || ''
        }
      } catch {
        /* ignore */
      }
    }
    return ''
  })
  const [email, setEmail] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const salvo = localStorage.getItem(CHAVE_RASCUNHO)
        if (salvo) {
          const parsed = JSON.parse(salvo)
          return parsed.email || ''
        }
      } catch {
        /* ignore */
      }
    }
    return ''
  })
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [perfil, setPerfil] = useState<PerfilUsuario>('contador')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Estado do convite recebido via URL (?convite=TOKEN)
  const [dadosConvite, setDadosConvite] = useState<{
    id: string
    email: string
    cliente_id?: string
    cliente_nome?: string
    status: string
    analista_id: string
    analista_nome: string
    nivel_convite?: 'admin' | 'analista' | 'empresario'
  } | null>(null)
  const [validandoConvite, setValidandoConvite] = useState(false)

  const { signup, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  // Auto-save rascunho com debounce (nomeContato e email)
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const timer = setTimeout(() => {
      try {
        const salvo = localStorage.getItem(CHAVE_RASCUNHO)
        const parsed = salvo ? JSON.parse(salvo) : {}
        if (nome || email) {
          localStorage.setItem(
            CHAVE_RASCUNHO,
            JSON.stringify({ ...parsed, nomeContato: nome, email: email }),
          )
        }
      } catch (err) {
        console.warn('Erro ao salvar rascunho de cadastro:', err)
      }
    }, 600)
    return () => clearTimeout(timer)
  }, [nome, email])

  const tokenConvite = searchParams.get('convite')
  const emailParam = searchParams.get('email')
  const nivelParam = searchParams.get('nivel')

  // Se houver token de convite na URL, valida no backend e pré-configura o perfil correto
  React.useEffect(() => {
    if (tokenConvite) {
      setValidandoConvite(true)
      validarTokenConvite(tokenConvite)
        .then((dados) => {
          if (dados) {
            setDadosConvite(dados)
            const nivelEfetivo = dados.nivel_convite || nivelParam
            if (nivelEfetivo === 'admin' || nivelEfetivo === 'analista') {
              setPerfil('contador')
            } else {
              setPerfil('empresario')
            }
            if (dados.email) {
              setEmail(dados.email)
            }
          }
        })
        .finally(() => {
          setValidandoConvite(false)
        })
    } else if (emailParam) {
      setEmail(emailParam)
    }
  }, [tokenConvite, emailParam, nivelParam])

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
      // Determina perfil final conforme o convite
      let perfilFinal: PerfilUsuario = perfil
      if (dadosConvite?.nivel_convite) {
        perfilFinal =
          dadosConvite.nivel_convite === 'admin' || dadosConvite.nivel_convite === 'analista'
            ? 'contador'
            : 'empresario'
      }

      await signup(nome, email, password, passwordConfirm, perfilFinal)

      // Limpa rascunho ao submeter com sucesso
      try {
        localStorage.removeItem(CHAVE_RASCUNHO)
      } catch {
        /* ignore */
      }

      // Se cadastrou via convite, chama aceitarConviteCliente para atualizar status, vínculos e nível
      if (tokenConvite) {
        try {
          await aceitarConviteCliente(tokenConvite)
        } catch (conviteErr) {
          console.warn('Erro ao atualizar status do convite:', conviteErr)
        }
      }

      // Destino inteligente
      // Regra: Analista no primeiro acesso vai para o formulário de escritório /dados-escritorio
      // Empresário vai direto para /minha-conta (NUNCA vê esse formulário)
      const target =
        destination ||
        (dadosConvite?.nivel_convite === 'admin'
          ? '/admin'
          : perfilFinal === 'empresario'
            ? '/minha-conta'
            : '/dados-escritorio')
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

          {/* Alerta de Convite Válido (quando acessado via ?convite=...) */}
          {dadosConvite && (
            <div className="mb-6 p-4 bg-gradient-to-br from-[#07132B] to-[#0d2249] text-white rounded-2xl border border-[#D4AF37] shadow-md space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">
                  Convite Oficial Diamond Group
                </span>
                <span className="text-[10px] font-bold bg-[#D4AF37] text-[#07132B] px-2 py-0.5 rounded uppercase">
                  Nível {dadosConvite.nivel_convite || 'Empresário'}
                </span>
              </div>
              <p className="leading-relaxed text-slate-200">
                Você foi convidado por <strong>{dadosConvite.analista_nome}</strong>
                {dadosConvite.cliente_nome
                  ? ` para acessar os dados da empresa ${dadosConvite.cliente_nome}`
                  : ''}
                .
              </p>
              <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 text-[11px] text-slate-300">
                Sua conta será criada no nível{' '}
                <strong>
                  {dadosConvite.nivel_convite === 'admin'
                    ? 'Administrador'
                    : dadosConvite.nivel_convite === 'analista'
                      ? 'Analista & Parceiro'
                      : 'Empresário / Cliente'}
                </strong>
                .
              </div>
            </div>
          )}
          {/* Benefícios rápidos */}
          {!dadosConvite && (
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
          )}

          {error && (
            <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-[#E74C3C] flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Pergunta: Você é analista ou empresário? (SEM ÍCONES) */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Perfil de Acesso *
                </label>
                {dadosConvite && (
                  <span className="text-[10px] font-bold text-[#D4AF37] bg-[#07132B] px-2 py-0.5 rounded">
                    Fixo pelo Convite
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 mb-3">
                {dadosConvite
                  ? 'Como você foi convidado por um analista, seu perfil de acesso é Empresário.'
                  : 'Personalizamos sua área de trabalho e ferramentas de acordo com a sua atuação.'}
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={!!dadosConvite}
                  onClick={() => setPerfil('contador')}
                  className={`py-3 px-3 rounded-xl text-left border transition-all text-xs font-heading ${
                    perfil === 'contador'
                      ? 'bg-[#07132B] text-white border-[#D4AF37] shadow-sm ring-1 ring-[#D4AF37]'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                >
                  <span className="block font-bold text-sm">Analista</span>
                  <span
                    className={`block text-[11px] mt-0.5 ${
                      perfil === 'contador' ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    Carteira, clientes e ferramentas completas
                  </span>
                </button>

                <button
                  type="button"
                  disabled={!!dadosConvite}
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
                    Espaço do tomador de decisão (restrito à empresa)
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
