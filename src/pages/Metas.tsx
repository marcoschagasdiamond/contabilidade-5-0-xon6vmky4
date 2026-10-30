import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  carregarDashboardMetas,
  salvarMetaMensal,
  obterMesAnoAtualIso,
  formatarMesAnoExtenso,
} from '@/services/crmMetas'
import type { DashboardMetasResultado, ItemIndicadorMeta, SalvarMetaInput } from '@/types/crmMetas'
import { ModalDefinirMetas } from '@/components/crm/ModalDefinirMetas'

function formatarValorIndicador(val: number, unidade: 'qtd' | 'moeda'): string {
  if (unidade === 'moeda') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val || 0)
  }
  return new Intl.NumberFormat('pt-BR').format(val || 0)
}

export default function Metas() {
  const { user, isMaster, isAdmin } = useAuth()
  const isMasterOrAdmin = isMaster || isAdmin

  const [mesAnoSelecionado, setMesAnoSelecionado] = useState<string>(obterMesAnoAtualIso())
  const [dados, setDados] = useState<DashboardMetasResultado | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [modalMetasAberto, setModalMetasAberto] = useState(false)
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

  const carregarMetas = useCallback(async () => {
    setCarregando(true)
    try {
      const res = await carregarDashboardMetas({ mesAno: mesAnoSelecionado })
      setDados(res)
    } catch (err: any) {
      console.error('Erro ao carregar dashboard de metas:', err)
      setFeedback({
        tipo: 'erro',
        texto: err?.message || 'Erro ao carregar dados do dashboard de metas.',
      })
    } finally {
      setCarregando(false)
    }
  }, [mesAnoSelecionado])

  useEffect(() => {
    carregarMetas()
  }, [carregarMetas])

  const navegarMes = (delta: number) => {
    const [anoStr, mesStr] = mesAnoSelecionado.split('-')
    let ano = parseInt(anoStr, 10)
    let mes = parseInt(mesStr, 10) + delta

    if (mes > 12) {
      mes = 1
      ano += 1
    } else if (mes < 1) {
      mes = 12
      ano -= 1
    }

    const novoMesAno = `${ano}-${String(mes).padStart(2, '0')}`
    setMesAnoSelecionado(novoMesAno)
  }

  const handleSalvarMetas = async (input: SalvarMetaInput) => {
    await salvarMetaMensal(input)
    setFeedback({
      tipo: 'sucesso',
      texto: `Metas de ${formatarMesAnoExtenso(input.mes_ano)} salvas com sucesso!`,
    })
    await carregarMetas()
  }

  // Cores de estado do indicador (SEM ÍCONES, padrão Diamond)
  const obterBadgeEstado = (estado: ItemIndicadorMeta['estado']) => {
    switch (estado) {
      case 'atingida':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
            Meta Atingida
          </span>
        )
      case 'em_progresso':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 font-mono">
            Em Progresso
          </span>
        )
      case 'abaixo':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
            Abaixo da Meta
          </span>
        )
    }
  }

  const obterCorBarra = (estado: ItemIndicadorMeta['estado']) => {
    switch (estado) {
      case 'atingida':
        return 'bg-gradient-to-r from-emerald-500 to-emerald-400'
      case 'em_progresso':
        return 'bg-gradient-to-r from-[#D4AF37] to-amber-400'
      case 'abaixo':
      default:
        return 'bg-gradient-to-r from-amber-500 to-rose-400'
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* TOPO DIAMOND GROUP */}
      <div className="bg-[#07132B] text-white pt-10 pb-12 px-4 sm:px-6 lg:px-8 border-b-2 border-[#D4AF37] relative overflow-hidden">
        <div
          className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 left-0 w-80 h-80 bg-[#2ECC71]/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 font-mono">
                  FASE 4 • GESTÃO DE PERFORMANCE
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  {isMasterOrAdmin ? 'Visão Consolidada Master/Admin' : 'Carteira do Analista'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-black text-white">
                Dashboard de Metas Comerciais
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 max-w-3xl leading-relaxed">
                Acompanhamento automático em tempo real: captação de clientes, receita da carteira,
                créditos recuperados e diagnósticos concluídos construído sobre os dados do CRM.
              </p>
            </div>

            {/* Ações do Topo */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                to="/crm"
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/15 border border-white/20 transition-all text-center"
              >
                Voltar ao CRM
              </Link>
              <button
                type="button"
                onClick={() => setModalMetasAberto(true)}
                className="px-5 py-2.5 rounded-xl font-heading font-black text-xs text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-lg transition-all hover:-translate-y-0.5"
              >
                Definir / Editar Metas
              </button>
            </div>
          </div>

          {/* BARRA DO SELETOR DE PERÍODO */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navegarMes(-1)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-200 transition-colors"
                title="Mês anterior"
              >
                ← Mês Anterior
              </button>

              <span className="font-heading font-bold text-base sm:text-lg text-[#D4AF37] px-2">
                {dados?.mesAnoRotulo || formatarMesAnoExtenso(mesAnoSelecionado)}
              </span>

              <button
                type="button"
                onClick={() => navegarMes(1)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-200 transition-colors"
                title="Próximo mês"
              >
                Próximo Mês →
              </button>

              {mesAnoSelecionado !== obterMesAnoAtualIso() && (
                <button
                  type="button"
                  onClick={() => setMesAnoSelecionado(obterMesAnoAtualIso())}
                  className="ml-2 text-xs px-2.5 py-1 rounded-md bg-[#2ECC71]/20 text-[#2ECC71] border border-[#2ECC71]/40 font-bold"
                >
                  Voltar ao Mês Atual
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-[#2ECC71] animate-pulse" />
              <span>
                {isMasterOrAdmin
                  ? `${dados?.totalCarteiras || 1} carteira(s) consolidadas`
                  : `Analista: ${user?.name || user?.email}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {feedback && (
          <div
            className={`p-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between border ${
              feedback.tipo === 'sucesso'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            <span>{feedback.texto}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-xs opacity-75 hover:opacity-100 font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {carregando ? (
          <div className="p-16 text-center text-slate-400 font-medium text-sm animate-pulse bg-white rounded-2xl border border-slate-200 shadow-sm">
            Apurando indicadores em tempo real das coleções do CRM, Recuperador e Diagnósticos...
          </div>
        ) : !dados ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm">
            Nenhum dado encontrado para o período selecionado.
          </div>
        ) : (
          <>
            {/* DESTAQUE DO RESUMO DO MÊS E GAP MAIS CRÍTICO */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Card Resumo de Atingimento */}
              <div className="lg:col-span-2 p-6 sm:p-7 rounded-2xl bg-[#07132B] text-white border-2 border-[#D4AF37]/50 shadow-xl relative overflow-hidden flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-[#D4AF37]">
                      Balanço Geral de Metas
                    </span>
                    <span className="text-xs text-slate-300 font-mono">
                      Média: {dados.resumoAtingimentoGeral.percentualMedio}%
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-heading font-black text-white">
                    Desempenho Comercial de {dados.mesAnoRotulo}
                  </h2>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                    Os 4 indicadores abaixo são extraídos automaticamente das fichas comerciais do
                    CRM, apurações do Recuperador de Créditos e finalizações da trilha 360°, sem
                    necessidade de digitação manual de resultados.
                  </p>
                </div>

                <div className="pt-6 grid grid-cols-3 gap-3 border-t border-white/10 mt-4">
                  <div className="p-3 rounded-xl bg-white/5 border border-emerald-500/30 text-center">
                    <span className="text-[11px] uppercase tracking-wide text-emerald-400 font-bold block">
                      Atingidas
                    </span>
                    <span className="font-heading font-black text-2xl text-white">
                      {dados.resumoAtingimentoGeral.totalAtingidas} / 4
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-[#D4AF37]/30 text-center">
                    <span className="text-[11px] uppercase tracking-wide text-[#D4AF37] font-bold block">
                      Em Progresso
                    </span>
                    <span className="font-heading font-black text-2xl text-white">
                      {dados.resumoAtingimentoGeral.totalEmProgresso} / 4
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-amber-500/30 text-center">
                    <span className="text-[11px] uppercase tracking-wide text-amber-400 font-bold block">
                      Abaixo
                    </span>
                    <span className="font-heading font-black text-2xl text-white">
                      {dados.resumoAtingimentoGeral.totalAbaixo} / 4
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Destaque: Mais Distante da Meta (Gap mais Crítico) */}
              <div className="p-6 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-md flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[11px] font-mono font-black uppercase tracking-wider text-amber-800 bg-amber-200/80 px-2.5 py-0.5 rounded-full inline-block">
                    Ponto de Atenção • Maior Gap
                  </span>
                  <h3 className="font-heading font-extrabold text-lg text-slate-900">
                    {dados.indicadorMaisDistante.titulo}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Este é o indicador com maior distância da meta estabelecida para o mês.
                  </p>
                </div>

                <div className="my-4 p-4 rounded-xl bg-white border border-amber-200 space-y-2">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-slate-500 font-medium">Realizado:</span>
                    <strong className="text-slate-900 font-mono font-bold">
                      {formatarValorIndicador(
                        dados.indicadorMaisDistante.realizado,
                        dados.indicadorMaisDistante.unidade,
                      )}
                    </strong>
                  </div>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-slate-500 font-medium">Meta:</span>
                    <strong className="text-slate-900 font-mono font-bold">
                      {formatarValorIndicador(
                        dados.indicadorMaisDistante.meta,
                        dados.indicadorMaisDistante.unidade,
                      )}
                    </strong>
                  </div>
                  <div className="flex justify-between items-baseline text-xs pt-1 border-t border-slate-100">
                    <span className="text-amber-800 font-bold">Faltam:</span>
                    <strong className="text-amber-900 font-mono font-extrabold">
                      {formatarValorIndicador(
                        dados.indicadorMaisDistante.gapParaMeta,
                        dados.indicadorMaisDistante.unidade,
                      )}
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setModalMetasAberto(true)}
                  className="w-full py-2.5 px-3 rounded-xl font-heading font-bold text-xs bg-[#07132B] text-[#D4AF37] hover:brightness-110 transition-all text-center"
                >
                  Ajustar Planejamento
                </button>
              </div>
            </div>

            {/* OS 4 INDICADORES REAIS (CARDS EM GRADE) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-heading font-bold text-slate-900">
                    Indicadores da Fase 4
                  </h2>
                  <p className="text-xs text-slate-500">
                    Progresso real calculado automaticamente dos dados existentes
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400">Período: {dados.mesAno}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.values(dados.indicadores).map((ind) => {
                  const clampPct = Math.min(100, Math.max(0, ind.percentual))

                  return (
                    <div
                      key={ind.id}
                      className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                    >
                      {/* Topo do Card */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">
                            Indicador
                          </span>
                          {obterBadgeEstado(ind.estado)}
                        </div>
                        <h3 className="font-heading font-extrabold text-xl text-slate-900">
                          {ind.titulo}
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed">{ind.descricao}</p>
                      </div>

                      {/* Valores: Realizado vs Meta */}
                      <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <div>
                          <span className="text-[11px] font-semibold text-slate-500 uppercase block">
                            Realizado
                          </span>
                          <span className="font-heading font-extrabold text-2xl text-slate-900 font-mono block mt-0.5">
                            {formatarValorIndicador(ind.realizado, ind.unidade)}
                          </span>
                          <span className="text-[10px] text-slate-400">Apurado no CRM</span>
                        </div>

                        <div>
                          <span className="text-[11px] font-semibold text-slate-500 uppercase block">
                            Meta
                          </span>
                          <span className="font-heading font-bold text-2xl text-slate-700 font-mono block mt-0.5">
                            {formatarValorIndicador(ind.meta, ind.unidade)}
                          </span>
                          <span className="text-[10px] text-slate-400">Planejado</span>
                        </div>
                      </div>

                      {/* Barra de Progresso e Percentual */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-600">Atingimento da Meta</span>
                          <span className="font-mono font-extrabold text-sm text-slate-900">
                            {ind.percentual}%
                          </span>
                        </div>

                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${obterCorBarra(
                              ind.estado,
                            )}`}
                            style={{ width: `${clampPct}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>
                            {ind.diferenca >= 0 ? (
                              <strong className="text-emerald-700 font-medium">
                                +{formatarValorIndicador(ind.diferenca, ind.unidade)} acima da meta
                              </strong>
                            ) : (
                              <span className="text-amber-700 font-medium">
                                Faltam {formatarValorIndicador(ind.gapParaMeta, ind.unidade)}
                              </span>
                            )}
                          </span>

                          <button
                            type="button"
                            onClick={() => setModalMetasAberto(true)}
                            className="text-[#07132B] hover:text-[#D4AF37] font-bold text-xs underline"
                          >
                            Editar Meta
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ATALHOS RÁPIDOS & FLUXO COMERCIAL */}
            <div className="p-6 rounded-2xl bg-[#07132B] text-white border border-[#D4AF37]/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[11px] font-mono text-[#D4AF37] font-bold uppercase tracking-wider block">
                  Ação Integrada da Carteira
                </span>
                <h4 className="font-heading font-bold text-lg text-white">
                  Deseja prospectar ou atualizar fichas comerciais?
                </h4>
                <p className="text-xs text-slate-300">
                  Acesse o painel do CRM para registrar interações, adicionar empresas ou agendar
                  reuniões com clientes.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/crm"
                  className="px-5 py-3 rounded-xl font-heading font-black text-xs text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] transition-all shadow-md"
                >
                  Abrir Painel do CRM
                </Link>
                <Link
                  to="/agendamento"
                  className="px-5 py-3 rounded-xl font-heading font-bold text-xs text-white bg-white/10 hover:bg-white/15 border border-white/20 transition-all"
                >
                  Agenda de Reuniões
                </Link>
              </div>
            </div>
          </>
        )}
      </div>

      {/* MODAL PARA DEFINIÇÃO/EDIÇÃO DAS METAS */}
      <ModalDefinirMetas
        aberto={modalMetasAberto}
        aoFechar={() => setModalMetasAberto(false)}
        mesAno={mesAnoSelecionado}
        mesAnoRotulo={dados?.mesAnoRotulo || formatarMesAnoExtenso(mesAnoSelecionado)}
        metaAtual={dados?.metaRecord || null}
        aoSalvar={handleSalvarMetas}
        isVisaoConsolidada={dados?.isVisaoConsolidada || false}
      />
    </div>
  )
}
