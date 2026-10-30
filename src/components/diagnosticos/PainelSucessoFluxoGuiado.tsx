import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export interface PainelSucessoFluxoGuiadoProps {
  aberto: boolean
  onClose?: () => void
  titulo?: string
  mensagem?: string
  proximaEtapaNome: string
  proximaEtapaRota: string
  segundosAutoRedirect?: number
  etapaConcluidaNumero?: string
  etapaConcluidaNome?: string
  etapaFinal?: boolean
}

export function PainelSucessoFluxoGuiado({
  aberto,
  onClose,
  titulo = 'Etapa Salva com Sucesso!',
  mensagem,
  proximaEtapaNome = 'Hub de Diagnósticos',
  proximaEtapaRota = '/diagnosticos',
  segundosAutoRedirect = 5,
  etapaConcluidaNumero,
  etapaConcluidaNome,
  etapaFinal = false,
}: PainelSucessoFluxoGuiadoProps) {
  const navigate = useNavigate()
  const [segundosRestantes, setSegundosRestantes] = useState(segundosAutoRedirect)
  const [pausado, setPausado] = useState(false)

  useEffect(() => {
    if (!aberto) {
      setSegundosRestantes(segundosAutoRedirect)
      setPausado(false)
      return
    }

    if (pausado) return

    setSegundosRestantes(segundosAutoRedirect)

    const interval = setInterval(() => {
      setSegundosRestantes((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          navigate(proximaEtapaRota)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [aberto, pausado, proximaEtapaRota, segundosAutoRedirect, navigate])

  if (!aberto) return null

  const handleAvancarImediato = () => {
    navigate(proximaEtapaRota)
  }

  const handlePermanecer = () => {
    setPausado(true)
    if (onClose) {
      onClose()
    }
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="my-6 p-6 sm:p-8 rounded-[24px] bg-[#07132B] text-white border-2 border-[#D4AF37] shadow-2xl relative overflow-hidden animate-fade-in"
    >
      {/* Detalhes de luz de fundo Diamond */}
      <div
        className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-0 w-64 h-64 bg-[#2ECC71]/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 space-y-4">
        {/* Cabeçalho do Painel */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#2ECC71]/20 text-[#2ECC71] border border-[#2ECC71]/40 font-mono">
                {etapaFinal ? 'TRILHA DE DIAGNÓSTICOS CONCLUÍDA' : 'FLUXO GUIADO • ETAPA CONCLUÍDA'}
              </span>
              {etapaConcluidaNumero && (
                <span className="text-xs font-bold text-[#D4AF37]">
                  {etapaConcluidaNumero} {etapaConcluidaNome ? `• ${etapaConcluidaNome}` : ''}
                </span>
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-heading font-black text-white">{titulo}</h3>
          </div>

          {/* Contador regressivo visual */}
          {!pausado ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/15 text-xs text-slate-300 self-start sm:self-auto">
              <span className="text-slate-400">
                {etapaFinal ? 'Concluindo em:' : 'Avançando em:'}
              </span>
              <span className="font-mono font-black text-[#D4AF37] text-sm">
                {segundosRestantes}s
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic self-start sm:self-auto">
              {etapaFinal ? 'Retorno automático pausado' : 'Avanço automático pausado'}
            </span>
          )}
        </div>

        {/* Mensagem explicativa */}
        <p className="text-sm text-slate-200 leading-relaxed max-w-2xl">
          {mensagem ||
            'Seus dados foram sincronizados com sucesso. Você pode prosseguir imediatamente para a próxima etapa da esteira ou revisar as informações preenchidas.'}
        </p>

        {/* Barra de progresso do timer */}
        {!pausado && (
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#D4AF37] to-[#2ECC71] h-full transition-all duration-1000 ease-linear rounded-full"
              style={{
                width: `${(segundosRestantes / segundosAutoRedirect) * 100}%`,
              }}
            />
          </div>
        )}

        {/* Ações da Esteira: SEM ÍCONES, foco em tipografia */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">
          {etapaFinal ? (
            <>
              <Link
                to="/diagnostico/relatorio"
                className="px-7 py-3.5 rounded-xl font-heading font-black text-xs sm:text-sm text-[#07132B] bg-[#2ECC71] hover:bg-[#27ae60] shadow-lg transition-all duration-200 hover:-translate-y-0.5 text-center"
              >
                Ver Relatório Consolidado →
              </Link>

              <Link
                to="/metas"
                className="px-6 py-3.5 rounded-xl font-heading font-black text-xs sm:text-sm text-white bg-[#0D1D3A] hover:bg-[#122448] border border-[#D4AF37]/50 shadow-md transition-all duration-200 hover:-translate-y-0.5 text-center"
              >
                Dashboard de Metas (Fase 4)
              </Link>

              <button
                type="button"
                onClick={handleAvancarImediato}
                className="px-6 py-3.5 rounded-xl font-heading font-black text-xs sm:text-sm text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-md transition-all duration-200 hover:-translate-y-0.5 text-center"
              >
                Voltar ao Hub de Diagnósticos
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleAvancarImediato}
                className="px-7 py-3.5 rounded-xl font-heading font-black text-xs sm:text-sm text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-lg transition-all duration-200 hover:-translate-y-0.5 text-center"
              >
                Continuar → {proximaEtapaNome}
              </button>
              <Link
                to="/metas"
                className="px-5 py-3.5 rounded-xl font-heading font-bold text-xs text-[#D4AF37] hover:text-white bg-[#0D1D3A] hover:bg-[#122448] border border-[#D4AF37]/40 shadow-sm transition-all text-center"
              >
                Metas do Mês
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={handlePermanecer}
            className="px-5 py-3.5 rounded-xl font-heading font-semibold text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/15 transition-all text-center"
          >
            Permanecer nesta etapa
          </button>
        </div>
      </div>
    </div>
  )
}
