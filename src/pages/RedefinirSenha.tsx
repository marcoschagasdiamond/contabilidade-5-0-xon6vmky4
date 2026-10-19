import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Lock,
  Loader2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'

export default function RedefinirSenha() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // O PocketBase envia o token de redefinição no query param `token`
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [tokenInvalido, setTokenInvalido] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!token) {
      setTokenInvalido(true)
      return
    }

    if (password.length < 8) {
      setError('A nova senha deve ter no mínimo 8 caracteres.')
      return
    }

    if (password !== passwordConfirm) {
      setError('As senhas não coincidem. Digite novamente.')
      return
    }

    setIsLoading(true)

    try {
      // Chamada nativa ao endpoint do PocketBase: confirmPasswordReset(token, password, passwordConfirm)
      await pb.collection('users').confirmPasswordReset(token, password, passwordConfirm)

      // Redireciona para o login com mensagem de sucesso via navigation state
      navigate('/login', {
        replace: true,
        state: {
          senhaRedefinida: true,
          sucessoMensagem: 'Senha redefinida com sucesso! Faça login com a nova senha.',
        },
      })
    } catch (err: any) {
      console.warn('Erro ao confirmar redefinição de senha:', err)
      const msg = String(err?.message || err?.data?.message || '').toLowerCase()
      const status = err?.status || err?.statusCode || 0

      if (
        status === 400 ||
        status === 404 ||
        msg.includes('token') ||
        msg.includes('invalid') ||
        msg.includes('expired')
      ) {
        setTokenInvalido(true)
        setError(
          'O link de redefinição de senha é inválido ou já expirou. Por favor, solicite um novo link.',
        )
      } else {
        setError(
          err?.message ||
            'Não foi possível redefinir sua senha no momento. Tente novamente ou solicite um novo link.',
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-28 pb-16 flex items-center justify-center bg-slate-50 px-4 sm:px-6">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-[24px] p-8 border border-slate-200 shadow-xl">
          {/* Logo / Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#07132B] text-[#2ECC71] mb-4 shadow-md border border-white/10">
              <KeyRound className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h1 className="font-heading font-bold text-2xl text-slate-900 tracking-tight">
              Redefinir Senha
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Crie uma nova senha de acesso segura para sua conta
            </p>
          </div>

          {/* Estado de Token Ausente ou Inválido */}
          {!token || tokenInvalido ? (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-slate-800 space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-amber-900">
                      Link de recuperação inválido ou expirado
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      {!token
                        ? 'Nenhum código de segurança foi encontrado na URL. Utilize o link enviado ao seu e-mail ou solicite um novo.'
                        : 'Por razões de segurança, os links de redefinição possuem prazo de validade e só podem ser utilizados uma única vez.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Link
                  to="/recuperar-senha"
                  className="w-full py-3.5 px-4 rounded-xl font-heading font-semibold text-sm text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-md transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span>Solicitar novo link de recuperação</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </Link>

                <Link
                  to="/login"
                  className="w-full py-2.5 px-4 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar para o Login</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Formulário para digitação da nova senha */
            <div>
              {error && (
                <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-[#E74C3C] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Nova Senha (mínimo 8 dígitos) *
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
                    Confirmar Nova Senha *
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

                {/* Requisitos de senha */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2
                      className={`w-3.5 h-3.5 ${
                        password.length >= 8 ? 'text-[#2ECC71]' : 'text-slate-300'
                      }`}
                    />
                    <span className={password.length >= 8 ? 'text-slate-700 font-medium' : ''}>
                      Mínimo de 8 caracteres
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2
                      className={`w-3.5 h-3.5 ${
                        password && password === passwordConfirm
                          ? 'text-[#2ECC71]'
                          : 'text-slate-300'
                      }`}
                    />
                    <span
                      className={
                        password && password === passwordConfirm ? 'text-slate-700 font-medium' : ''
                      }
                    >
                      Senhas idênticas
                    </span>
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
                      <span>Salvando nova senha...</span>
                    </>
                  ) : (
                    <>
                      <span>Redefinir e Salvar Senha</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </form>

              {/* Voltar para o Login */}
              <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#145A32] hover:text-[#2ECC71] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar para o Login</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
