import React from 'react'
import {
  Crown,
  CheckCircle2,
  Lock,
  MessageCircle,
  Mail,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  FileDown,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  getWhatsAppUpgradeUrl,
  getEmailUpgradeUrl,
  LIMITE_SIMULACOES_GRATUITO,
  LIMITE_DIAGNOSTICOS_GRATUITO,
} from '@/services/freemium'
import { useAuth } from '@/context/AuthContext'

export interface PaywallModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  motivo?: 'simulacao' | 'diagnostico' | 'pdf' | 'geral'
  tituloCustomizado?: string
  descricaoCustomizada?: string
}

export function PaywallModal({
  open,
  onOpenChange,
  motivo = 'geral',
  tituloCustomizado,
  descricaoCustomizada,
}: PaywallModalProps) {
  const { user, simulacoesUsadas, diagnosticosUsados } = useAuth()

  const titulo =
    tituloCustomizado ||
    (motivo === 'simulacao'
      ? 'Você atingiu o limite de simulações do Plano Gratuito'
      : motivo === 'diagnostico'
        ? 'Você atingiu o limite de diagnósticos do Plano Gratuito'
        : motivo === 'pdf'
          ? 'Download de Relatório em PDF exclusivo do Plano Premium'
          : 'Evolua para o Plano Premium Contabilidade 5.0')

  const descricao =
    descricaoCustomizada ||
    (motivo === 'simulacao'
      ? `O plano gratuito permite até ${LIMITE_SIMULACOES_GRATUITO} simulações na calculadora. Para simulações ilimitadas e exportações avançadas, fale com nosso time.`
      : motivo === 'diagnostico'
        ? `O plano gratuito contempla ${LIMITE_DIAGNOSTICOS_GRATUITO} diagnóstico preliminar. Para diagnósticos ilimitados em todas as empresas do seu portfólio, ative o Premium.`
        : motivo === 'pdf'
          ? 'A geração, download e impressão de dossiês tributários completos em PDF são recursos do Plano Premium liberados para clientes exclusivos.'
          : 'Aproveite simulações e diagnósticos ilimitados, relatórios completos em PDF e suporte prioritário.')

  const whatsappUrl = getWhatsAppUpgradeUrl(motivo, user?.name || user?.email)
  const emailUrl = getEmailUpgradeUrl(motivo, user?.email)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-[#07132B] text-white border border-[#D4AF37]/40 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <DialogHeader className="space-y-3 text-center sm:text-left">
          {/* Top Badge */}
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-bold uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5" />
              <span>Plano Premium Diamond</span>
            </div>
            {motivo === 'pdf' && (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-semibold">
                <Lock className="w-3 h-3" />
                <span>Recurso Bloqueado</span>
              </div>
            )}
          </div>

          <DialogTitle className="font-heading font-extrabold text-xl sm:text-2xl text-white tracking-tight leading-snug">
            {titulo}
          </DialogTitle>

          <DialogDescription className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            {descricao}
          </DialogDescription>
        </DialogHeader>

        {/* Status de uso atual */}
        <div className="my-2 p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <span className="text-slate-400 block text-[11px]">Seu consumo no Plano Gratuito:</span>
            <div className="flex items-center gap-4 text-slate-200">
              <span>
                Simulações:{' '}
                <strong className="text-[#D4AF37]">
                  {simulacoesUsadas} / {LIMITE_SIMULACOES_GRATUITO}
                </strong>
              </span>
              <span>•</span>
              <span>
                Diagnósticos:{' '}
                <strong className="text-[#2ECC71]">
                  {diagnosticosUsados} / {LIMITE_DIAGNOSTICOS_GRATUITO}
                </strong>
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-wider border border-slate-700">
            Gratuito
          </span>
        </div>

        {/* Benefícios do Premium */}
        <div className="space-y-2 py-2">
          <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider block">
            Vantagens liberadas no Plano Premium:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Simulações Ilimitadas</strong>
                <span className="text-slate-400 text-[11px]">
                  Crie e salve quantos cenários precisar
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Diagnósticos Ilimitados</strong>
                <span className="text-slate-400 text-[11px]">
                  360°, Transição, Regimes e Enquadramento
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Exportação e PDF Liberados</strong>
                <span className="text-slate-400 text-[11px]">
                  Download e impressão sem restrições
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Auditoria Tributária</strong>
                <span className="text-slate-400 text-[11px]">
                  Suporte direto de contadores sênior
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Como funciona o upgrade (cobrança manual aprovada pelo usuário: sem preço na tela, conversa direta) */}
        <div className="p-3 rounded-xl bg-[#2ECC71]/10 border border-[#2ECC71]/30 text-emerald-200 text-xs flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-[#2ECC71] shrink-0 mt-0.5" />
          <p className="leading-snug">
            <strong>Como funciona a liberação:</strong> Entre em contato conosco. Combinamos as
            condições ideais para o porte da sua empresa e ativamos seu acesso Premium diretamente
            no sistema.
          </p>
        </div>

        {/* Ações / Botões de Contato (WhatsApp e Email) */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 px-4 rounded-xl font-heading font-bold text-xs sm:text-sm text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-[0_4px_20px_rgba(46,204,113,0.35)] transition-all flex items-center justify-center gap-2 group text-center"
          >
            <MessageCircle className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
            <span>Falar no WhatsApp & Ativar Premium</span>
          </a>

          <a
            href={emailUrl}
            className="py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm text-slate-200 bg-white/10 hover:bg-white/20 border border-white/15 transition-all flex items-center justify-center gap-2 text-center"
          >
            <Mail className="w-4 h-4" />
            <span>Solicitar por E-mail</span>
          </a>
        </div>

        <div className="mt-2 text-center">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-[11px] text-slate-400 hover:text-slate-200 underline"
          >
            Continuar navegando no plano gratuito
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
