import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { PassoOnboardingInfo } from '@/types/onboarding'

interface WizardPrimeirosPassosProps {
  aberto: boolean
  aoFechar: () => void
  aoDispensar: () => void
  passos: PassoOnboardingInfo[]
  totalConcluidos: number
  percentualConcluido: number
}

export function WizardPrimeirosPassos({
  aberto,
  aoFechar,
  aoDispensar,
  passos,
  totalConcluidos,
  percentualConcluido,
}: WizardPrimeirosPassosProps) {
  const navigate = useNavigate()
  // Passo ativo no carrossel/navegação interna do wizard (0, 1 ou 2)
  // Inicia apontando para o primeiro passo pendente
  const primeiroPendenteIdx = passos.findIndex((p) => !p.concluido)
  const [passoAtivoIdx, setPassoAtivoIdx] = useState<number>(
    primeiroPendenteIdx >= 0 ? primeiroPendenteIdx : 0,
  )

  const passoAtual = passos[passoAtivoIdx] || passos[0]

  const handleIrParaPasso = (rota: string) => {
    aoFechar()
    navigate(rota)
  }

  return (
    <Dialog open={aberto} onOpenChange={(open) => !open && aoFechar()}>
      <DialogContent className="max-w-2xl bg-[#07132B] text-white border border-[#D4AF37]/40 shadow-2xl p-0 overflow-hidden rounded-2xl">
        {/* Glow decorativo de fundo Diamond Group */}
        <div
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#D4AF37]/15 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#2ECC71]/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative p-6 sm:p-8 space-y-6">
          {/* TOPO: BADGE + TÍTULO */}
          <DialogHeader className="text-left space-y-2">
            <div className="flex items-center justify-between gap-4">
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest text-[#D4AF37] bg-[#D4AF37]/15 border border-[#D4AF37]/30">
                Primeiros Passos • Contabilidade 5.0
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {totalConcluidos} de {passos.length} concluídos ({percentualConcluido}%)
              </span>
            </div>

            <DialogTitle className="font-heading font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              Bem-vindo ao Diamond Group
            </DialogTitle>

            <DialogDescription className="text-slate-300 text-sm leading-relaxed">
              Preparamos uma jornada guiada em 3 passos para configurar sua empresa, mapear riscos
              tributários e calcular seu enquadramento na Reforma Tributária. Você pode pular a
              qualquer momento e navegar livremente pelo app.
            </DialogDescription>
          </DialogHeader>

          {/* BARRA DE PROGRESSO */}
          <div className="space-y-1.5">
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#D4AF37] to-[#2ECC71] transition-all duration-300 rounded-full"
                style={{ width: `${percentualConcluido}%` }}
              />
            </div>
          </div>

          {/* NAVEGAÇÃO DOS 3 PASSOS (TABS SUPERIORES) */}
          <div className="grid grid-cols-3 gap-2">
            {passos.map((p, idx) => {
              const isAtivo = idx === passoAtivoIdx
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPassoAtivoIdx(idx)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isAtivo
                      ? 'bg-white/15 border-[#D4AF37] shadow-sm'
                      : p.concluido
                        ? 'bg-emerald-950/40 border-emerald-500/40 hover:bg-white/10'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                      Passo 0{p.numero}
                    </span>
                    {p.concluido ? (
                      <span className="text-[10px] font-bold text-[#2ECC71]">Concluído</span>
                    ) : (
                      <span className="text-[10px] text-slate-400">{p.tempoEstimado}</span>
                    )}
                  </div>
                  <div className="font-heading font-bold text-xs sm:text-sm text-white line-clamp-1">
                    {p.titulo}
                  </div>
                </button>
              )
            })}
          </div>

          {/* CONTEÚDO EM DESTAQUE DO PASSO SELECIONADO */}
          <div className="p-5 rounded-2xl bg-white/[0.06] border border-white/15 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider block">
                  Etapa 0{passoAtual.numero} • {passoAtual.subtitulo}
                </span>
                <h3 className="font-heading font-bold text-lg text-white mt-0.5">
                  {passoAtual.titulo}
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-slate-200 shrink-0">
                Estimativa: {passoAtual.tempoEstimado}
              </span>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">{passoAtual.descricao}</p>

            {/* Dica contextual de cada etapa */}
            {passoAtual.id === 'empresa' && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
                <strong className="text-white">Dica:</strong> Com CNPJ e faturamento informados,
                todos os módulos da Calculadora e da Trilha 360° serão preenchidos automaticamente.
              </div>
            )}
            {passoAtual.id === 'diagnostico' && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
                <strong className="text-white">Importante:</strong> A Trilha 360° percorre 6 etapas
                guiadas (Apresentação, Configurações, Autoavaliação, Transição, Comparação e
                Enquadramento).
              </div>
            )}
            {passoAtual.id === 'calculadora' && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
                <strong className="text-white">Simulação 2026–2033:</strong> Projeção detalhada sob
                a LC 214/2025 com split payment, crédito amplo e comparativo com Simples Nacional.
              </div>
            )}

            {/* Ação principal do passo */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <Button
                type="button"
                onClick={() => handleIrParaPasso(passoAtual.rota)}
                className="font-heading font-bold text-sm bg-[#D4AF37] text-[#07132B] hover:bg-[#c49f2e] transition-colors py-2.5 px-6 rounded-xl"
              >
                {passoAtual.labelBotao}
              </Button>

              <div className="flex items-center gap-2 justify-end">
                {passoAtivoIdx > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPassoAtivoIdx((prev) => Math.max(0, prev - 1))}
                    className="text-xs border-white/20 text-white bg-transparent hover:bg-white/10"
                  >
                    Passo Anterior
                  </Button>
                )}
                {passoAtivoIdx < passos.length - 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setPassoAtivoIdx((prev) => Math.min(passos.length - 1, prev + 1))
                    }
                    className="text-xs border-white/20 text-white bg-transparent hover:bg-white/10"
                  >
                    Próximo Passo
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* RODAPÉ DO WIZARD: NÃO BLOQUEANTE, PERMITE PULAR */}
          <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <span>Você pode fechar e retomar este guia no painel inicial a qualquer momento.</span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={aoFechar}
                className="hover:text-white transition-colors underline underline-offset-2"
              >
                Explorar o app livremente
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={aoDispensar}
                className="hover:text-amber-300 transition-colors"
                title="Não exibir este modal novamente no login (o checklist persistente continuará disponível no painel)"
              >
                Pular por enquanto
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
