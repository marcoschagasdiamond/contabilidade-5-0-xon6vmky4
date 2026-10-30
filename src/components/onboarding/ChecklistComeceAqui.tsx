import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import type { PassoOnboardingInfo } from '@/types/onboarding'

interface ChecklistComeceAquiProps {
  passos: PassoOnboardingInfo[]
  totalConcluidos: number
  totalPassos: number
  percentualConcluido: number
  todosPassosConcluidos: boolean
  recolhido: boolean
  aoAlternarRecolhido: () => void
  aoReabrirWizard?: () => void
  aoMarcarPasso?: (id: any, concluido: boolean) => void
}

export function ChecklistComeceAqui({
  passos,
  totalConcluidos,
  totalPassos,
  percentualConcluido,
  todosPassosConcluidos,
  recolhido,
  aoAlternarRecolhido,
  aoReabrirWizard,
}: ChecklistComeceAquiProps) {
  // Se todos os passos estiverem 100% concluídos:
  // Mostra um banner de sucesso discreto que permite recolher ou reabrir
  if (todosPassosConcluidos) {
    if (recolhido) {
      return (
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2ECC71]" />
            <span className="font-heading font-bold text-emerald-200">
              Primeiros passos concluídos com sucesso (3 de 3)
            </span>
          </div>
          <div className="flex items-center gap-3">
            {aoReabrirWizard && (
              <button
                type="button"
                onClick={aoReabrirWizard}
                className="text-[#D4AF37] hover:underline font-semibold"
              >
                Rever Guia
              </button>
            )}
            <button
              type="button"
              onClick={aoAlternarRecolhido}
              className="text-slate-300 hover:text-white underline underline-offset-2"
            >
              Expandir Detalhes
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="relative rounded-2xl bg-gradient-to-br from-[#07132B] via-[#0b1e3f] to-[#0A1A13] text-white border-2 border-emerald-500/40 p-6 sm:p-7 shadow-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-900/40 border border-emerald-400/40 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#2ECC71]" />
              Ativação Concluída • Parabéns
            </div>
            <h2 className="font-heading font-extrabold text-xl text-white">
              Sua empresa está 100% configurada
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              Você completou os Dados da Empresa, o Diagnóstico 360° e a Simulação na Calculadora
              IBS/CBS.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {aoReabrirWizard && (
              <Button
                type="button"
                onClick={aoReabrirWizard}
                className="text-xs font-bold bg-[#D4AF37] text-[#07132B] hover:bg-[#c49f2e] rounded-xl py-2 px-4"
              >
                Rever Wizard
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={aoAlternarRecolhido}
              className="text-xs border-white/20 text-slate-200 bg-white/5 hover:bg-white/10 rounded-xl"
            >
              Minimizar
            </Button>
          </div>
        </div>

        {/* Resumo dos 3 itens concluídos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          {passos.map((p) => (
            <Link
              key={p.id}
              to={p.rota}
              className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-400/50 hover:bg-white/10 transition-all text-left block"
            >
              <div className="flex items-center justify-between text-[11px] text-[#2ECC71] font-bold mb-1">
                <span>Passo 0{p.numero}</span>
                <span>Concluído</span>
              </div>
              <div className="font-heading font-bold text-xs text-white line-clamp-1">
                {p.titulo}
              </div>
              <span className="text-[11px] text-slate-400 block mt-1 hover:underline">
                Acessar tela →
              </span>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  // ESTADO RECOLHIDO (com passos pendentes):
  if (recolhido) {
    return (
      <div className="bg-[#07132B] border border-[#D4AF37]/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white text-xs shadow-md">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/15 border border-[#D4AF37]/30">
            Comece por aqui
          </span>
          <span className="font-heading font-bold text-sm text-white">
            Ativação da Conta ({totalConcluidos} de {totalPassos} passos)
          </span>
          <span className="text-slate-400 font-mono hidden md:inline">
            • {percentualConcluido}% concluído
          </span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {aoReabrirWizard && (
            <button
              type="button"
              onClick={aoReabrirWizard}
              className="text-[#D4AF37] hover:underline font-semibold"
            >
              Abrir Wizard
            </button>
          )}
          <button
            type="button"
            onClick={aoAlternarRecolhido}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors"
          >
            Expandir Checklist
          </button>
        </div>
      </div>
    )
  }

  // ESTADO PADRÃO EXPANDIDO (Checklist persistente no painel):
  return (
    <div className="relative rounded-2xl bg-gradient-to-br from-[#07132B] via-[#0d2249] to-[#0A1A13] text-white border-2 border-[#D4AF37]/50 p-6 sm:p-7 shadow-2xl overflow-hidden">
      {/* Glow decorativo de fundo */}
      <div
        className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#D4AF37]/15 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative space-y-6">
        {/* CABEÇALHO DO CARD */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/15 border border-[#D4AF37]/30 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
              Comece por aqui • Primeiros Passos
            </div>
            <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-white tracking-tight">
              Ativação da sua empresa no Contabilidade 5.0
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Complete os 3 passos recomendados para habilitar todas as análises personalizadas da
              sua conta. Você pode usar o app livremente a qualquer momento.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            {aoReabrirWizard && (
              <Button
                type="button"
                onClick={aoReabrirWizard}
                className="text-xs font-bold bg-[#D4AF37] text-[#07132B] hover:bg-[#c49f2e] rounded-xl py-2 px-4 shadow-sm"
              >
                Abrir Wizard Guiado
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={aoAlternarRecolhido}
              className="text-xs border-white/20 text-slate-300 bg-white/5 hover:bg-white/10 rounded-xl"
              title="Recolher este card temporariamente"
            >
              Minimizar
            </Button>
          </div>
        </div>

        {/* BARRA DE PROGRESSO COM PORCENTAGEM */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">
              Progresso da ativação: <strong className="text-white">{totalConcluidos}</strong> de{' '}
              <strong className="text-white">{totalPassos}</strong> passos concluídos
            </span>
            <span className="font-mono font-bold text-[#D4AF37]">{percentualConcluido}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#D4AF37] to-[#2ECC71] transition-all duration-300 rounded-full"
              style={{ width: `${percentualConcluido}%` }}
            />
          </div>
        </div>

        {/* GRID DOS 3 PASSOS COM CTAS REAIS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {passos.map((passo) => {
            const isConcluido = passo.concluido
            const isLiberado = passo.liberado

            return (
              <div
                key={passo.id}
                className={`relative p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isConcluido
                    ? 'bg-emerald-950/30 border-emerald-500/40'
                    : isLiberado
                      ? 'bg-white/[0.07] border-[#D4AF37]/40 shadow-sm hover:border-[#D4AF37]'
                      : 'bg-white/[0.03] border-white/10 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                      Passo 0{passo.numero}
                    </span>
                    {isConcluido ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2ECC71]/20 text-[#2ECC71] border border-[#2ECC71]/40">
                        Concluído
                      </span>
                    ) : isLiberado ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                        Pendente
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-slate-400">
                        Próximo
                      </span>
                    )}
                  </div>

                  <h3 className="font-heading font-bold text-base text-white mb-1">
                    {passo.titulo}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed mb-4">{passo.descricao}</p>
                </div>

                <div className="pt-2 border-t border-white/10 mt-auto flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {passo.tempoEstimado}
                  </span>

                  <Link
                    to={passo.rota}
                    className={`inline-flex items-center justify-center py-2 px-3.5 rounded-xl text-xs font-heading font-bold transition-all text-center ${
                      isConcluido
                        ? 'bg-white/10 text-slate-200 hover:bg-white/20'
                        : 'bg-[#D4AF37] text-[#07132B] hover:bg-[#c49f2e] shadow-md'
                    }`}
                  >
                    {passo.labelBotao}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* NOTA DE NAVEGAÇÃO LIVRE */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 border-t border-white/10">
          <span>
            Navegação totalmente livre: você pode acessar qualquer relatório, simulação ou
            agendamento sem restrição.
          </span>
          <Link to="/servicos" className="text-[#D4AF37] hover:underline underline-offset-2">
            Explorar catálogo completo de serviços
          </Link>
        </div>
      </div>
    </div>
  )
}
