import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Mail,
  Loader2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  ArrowLeft,
  MessageCircle,
  HelpCircle,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'

export default function RecuperarSenha() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [falhaSmtp, setFalhaSmtp] = useState(false)
  const [erroGeral, setErroGeral] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErroGeral(null)
    setFalhaSmtp(false)

    const emailLimpo = email.trim().toLowerCase()
    if (!emailLimpo) return

    setIsLoading(true)

    try {
      // Chamada nativa ao endpoint do PocketBase
      await pb.collection('users').requestPasswordReset(emailLimpo)
      // Sucesso na chamada do endpoint
      setSucesso(true)
    } catch (err: any) {
      console.warn('Erro ao solicitar recuperação de senha:', err)
      // PocketBase retorna status 400 ou erro de conexão quando SMTP falha ao disparar o e-mail
      // (ex: "Failed to send password reset email", SMTP connection refused, etc.)
      // Não expor erro técnico bruto: exibir mensagem amigável com suporte
      const status = err?.status || err?.statusCode || 0
      const errorMsg = String(err?.message || err?.data?.message || '')

      if (
        status === 400 ||
        status === 500 ||
        errorMsg.toLowerCase().includes('email') ||
        errorMsg.toLowerCase().includes('smtp') ||
        errorMsg.toLowerCase().includes('send') ||
        errorMsg.toLowerCase().includes('connect')
      ) {
        setFalhaSmtp(true)
      } else {
        setErroGeral(
          'Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente em alguns instantes.',
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
              <TrendingUp className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h1 className="font-heading font-bold text-2xl text-slate-900 tracking-tight">
              Recuperar Senha
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Informe seu e-mail cadastrado para enviarmos as instruções de redefinição
            </p>
          </div>

          {sucesso ? (
            /* Estado de Sucesso */
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-slate-700">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#2ECC71]/20 flex items-center justify-center text-[#145A32] shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-heading font-semibold text-sm text-[#0A1A13]">
                      Solicitação enviada!
                    </h3>
                    <p className="text-xs leading-relaxed text-slate-600">
                      Se este e-mail estiver cadastrado em nossa base, você receberá em instantes um
                      link seguro para redefinir a sua senha.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-600 space-y-2">
                <div className="flex items-center gap-2 font-medium text-slate-800">
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  <span>Não recebeu o e-mail?</span>
                </div>
                <ul className="list-disc list-inside space-y-1 pl-1 text-slate-500">
                  <li>Verifique sua pasta de Spam ou Lixo Eletrônico.</li>
                  <li>Certifique-se de que digitou o e-mail correto.</li>
                  <li>Aguarde até 5 minutos para a entrega da mensagem.</li>
                </ul>
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <Link
                  to="/login"
                  className="w-full py-3.5 px-4 rounded-xl font-heading font-semibold text-sm text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-md transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar para o Login</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setSucesso(false)
                    setEmail('')
                  }}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Tentar outro e-mail
                </button>
              </div>
            </div>
          ) : (
            /* Formulário */
            <div>
              {/* Alerta de Falha do Serviço de E-mail (ex: SMTP ainda não ativado) */}
              {falhaSmtp && (
                <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-slate-800 text-xs space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold text-amber-900">
                        Envio de e-mails temporariamente indisponível
                      </p>
                      <p className="text-slate-600 leading-relaxed">
                        O serviço automático de envio de e-mails está passando por manutenção ou
                        configuração. Fique tranquilo: nossa equipe de suporte pode ajudar você
                        imediatamente a recuperar seu acesso.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between gap-2">
                    <a
                      href="https://wa.me/551140028922?text=Ol%C3%A1!%20Preciso%20de%20ajuda%20para%20redefinir%20minha%20senha%20na%20Contabilidade%205.0."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-bold text-[#145A32] hover:text-[#2ECC71] transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Falar no WhatsApp</span>
                    </a>
                    <Link
                      to="/contato"
                      className="text-slate-600 hover:text-slate-900 underline font-medium"
                    >
                      Formulário de contato
                    </Link>
                  </div>
                </div>
              )}

              {erroGeral && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-[#E74C3C] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{erroGeral}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    E-mail Cadastrado
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

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-xl font-heading font-semibold text-sm text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-md transition-all duration-200 hover:-translate-y-0.5 btn-press flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#0A1A13]" />
                      <span>Enviando link...</span>
                    </>
                  ) : (
                    <>
                      <span>Enviar Link de Recuperação</span>
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
                  <span>Lembrou sua senha? Voltar ao login</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
