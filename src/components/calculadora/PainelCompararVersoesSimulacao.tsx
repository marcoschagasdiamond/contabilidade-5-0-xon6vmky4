import React, { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  compararDoisEstadosSimulacao,
  extrairEstadoAtualParaComparacao,
  formatarDataHistorico,
  reconstruirEstadoSimulacaoNoEvento,
} from '@/services/historicoSimulacoes'
import type {
  EstadoReconstruidoSimulacao,
  HistoricoSimulacaoRegistro,
  TipoEventoHistorico,
} from '@/types/historicoSimulacoes'

interface PainelCompararVersoesSimulacaoProps {
  registros: HistoricoSimulacaoRegistro[]
  simulacaoNome?: string
  empresa?: string
  tipoSimulacao?: 'calculadora' | 'recuperador'
  dadosSimulacaoAtual?: {
    nome?: string
    empresa?: string
    cnpj?: string
    parametros?: any
    resultados?: any
    regime?: string
    faturamentoMensal?: number
    aliquotaEfetiva?: number
    economiaAnual?: number
    totalRecuperavelIntegral?: number
    totalRecuperavelConservador?: number
  } | null
  onVoltarParaLinhaTempo: () => void
}

function getBadgeEventoMini(tipo?: TipoEventoHistorico) {
  switch (tipo) {
    case 'criacao':
      return (
        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
          Criação
        </span>
      )
    case 'renomeacao':
      return (
        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300">
          Renomeação
        </span>
      )
    case 'edicao_parametros':
      return (
        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-[#07132B] text-[#D4AF37] border border-[#D4AF37]/50">
          Parâmetros
        </span>
      )
    case 'exclusao':
      return (
        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-300">
          Exclusão
        </span>
      )
    default:
      return (
        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-700">
          Ponto Histórico
        </span>
      )
  }
}

export function PainelCompararVersoesSimulacao({
  registros,
  simulacaoNome,
  empresa,
  tipoSimulacao = 'calculadora',
  dadosSimulacaoAtual,
  onVoltarParaLinhaTempo,
}: PainelCompararVersoesSimulacaoProps) {
  // Modo de comparação: 'evento_vs_atual' ou 'dois_eventos'
  const [modoComparacao, setModoComparacao] = useState<'evento_vs_atual' | 'dois_eventos'>(
    'evento_vs_atual',
  )

  // Eventos cronológicos ordenados (do mais antigo ao mais recente)
  const eventosCronologicos = useMemo(() => {
    return [...registros].sort(
      (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime(),
    )
  }, [registros])

  // Evento A selecionado (padrão: o evento mais antigo / criação, ou penúltimo)
  const [eventoAId, setEventoAId] = useState<string>(() => {
    if (registros.length === 0) return ''
    // Tenta pegar o evento de criação ou o primeiro do histórico
    const criacao = eventosCronologicos.find((e) => e.tipo_evento === 'criacao')
    return criacao?.id || eventosCronologicos[0]?.id || ''
  })

  // Evento B selecionado (para o modo dois eventos: padrão é o último evento registrado)
  const [eventoBId, setEventoBId] = useState<string>(() => {
    if (registros.length <= 1) return ''
    return eventosCronologicos[eventosCronologicos.length - 1]?.id || ''
  })

  // Filtro de exibição dos campos da tabela: 'todos' ou 'apenas_alterados'
  const [filtroDiferencas, setFiltroDiferencas] = useState<'apenas_alterados' | 'todos'>(
    'apenas_alterados',
  )

  // Estado atual extraído
  const estadoAtual = useMemo<EstadoReconstruidoSimulacao>(() => {
    // Snapshot básico a partir dos dados do último registro ou props
    const ultimoRegistro = eventosCronologicos[eventosCronologicos.length - 1]
    const snapshotBase: Record<string, any> = ultimoRegistro?.snapshot_novo_json || {}

    return extrairEstadoAtualParaComparacao({
      nome: dadosSimulacaoAtual?.nome || simulacaoNome || ultimoRegistro?.simulacao_nome,
      empresa: dadosSimulacaoAtual?.empresa || empresa || ultimoRegistro?.empresa,
      cnpj: dadosSimulacaoAtual?.cnpj || ultimoRegistro?.cnpj,
      tipoSimulacao,
      dadosCalculadora:
        tipoSimulacao === 'calculadora'
          ? {
              parametros: dadosSimulacaoAtual?.parametros,
              resultados: dadosSimulacaoAtual?.resultados,
            }
          : undefined,
      dadosRecuperador:
        tipoSimulacao === 'recuperador'
          ? {
              parametros: dadosSimulacaoAtual?.parametros,
              resultados: dadosSimulacaoAtual?.resultados,
            }
          : undefined,
      snapshotAtual: {
        ...snapshotBase,
        regime: dadosSimulacaoAtual?.regime || snapshotBase.regime,
        faturamentoMensal: dadosSimulacaoAtual?.faturamentoMensal ?? snapshotBase.faturamentoMensal,
        aliquotaEfetiva: dadosSimulacaoAtual?.aliquotaEfetiva ?? snapshotBase.aliquotaEfetiva,
        economiaAnual: dadosSimulacaoAtual?.economiaAnual ?? snapshotBase.economiaAnual,
        totalRecuperavelIntegral:
          dadosSimulacaoAtual?.totalRecuperavelIntegral ?? snapshotBase.totalRecuperavelIntegral,
        totalRecuperavelConservador:
          dadosSimulacaoAtual?.totalRecuperavelConservador ??
          snapshotBase.totalRecuperavelConservador,
      },
    })
  }, [dadosSimulacaoAtual, simulacaoNome, empresa, tipoSimulacao, eventosCronologicos])

  // Estado A reconstruído no evento escolhido
  const estadoA = useMemo<EstadoReconstruidoSimulacao>(() => {
    if (!eventoAId || registros.length === 0) {
      return { campos: {} }
    }
    const resumoAtual: Record<string, any> = {}
    for (const [k, v] of Object.entries(estadoAtual.campos)) {
      resumoAtual[k] = v.valor
    }
    return reconstruirEstadoSimulacaoNoEvento(registros, eventoAId, resumoAtual)
  }, [registros, eventoAId, estadoAtual])

  // Estado B (pode ser o estado Atual ou um segundo evento histórico)
  const estadoB = useMemo<EstadoReconstruidoSimulacao>(() => {
    if (modoComparacao === 'evento_vs_atual') {
      return estadoAtual
    }
    if (!eventoBId || registros.length === 0) {
      return { campos: {} }
    }
    const resumoAtual: Record<string, any> = {}
    for (const [k, v] of Object.entries(estadoAtual.campos)) {
      resumoAtual[k] = v.valor
    }
    return reconstruirEstadoSimulacaoNoEvento(registros, eventoBId, resumoAtual)
  }, [modoComparacao, eventoBId, registros, estadoAtual])

  // Comparação entre Estado A e Estado B
  const resultadoComparacao = useMemo(() => {
    return compararDoisEstadosSimulacao(estadoA, estadoB)
  }, [estadoA, estadoB])

  const camposParaExibir = useMemo(() => {
    if (filtroDiferencas === 'apenas_alterados') {
      return resultadoComparacao.camposTotais.filter((c) => c.mudou)
    }
    return resultadoComparacao.camposTotais
  }, [resultadoComparacao, filtroDiferencas])

  const registroAEncontrado = registros.find((r) => r.id === eventoAId)
  const registroBEncontrado = registros.find((r) => r.id === eventoBId)

  return (
    <div className="flex flex-col h-full overflow-hidden text-xs">
      {/* Barra de Seleção de Modo e Controles */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 shrink-0 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">
              Modo de Comparação:
            </span>
            <button
              type="button"
              onClick={() => setModoComparacao('evento_vs_atual')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                modoComparacao === 'evento_vs_atual'
                  ? 'bg-[#07132B] text-[#D4AF37] shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Evento Histórico vs. Estado Atual
            </button>
            <button
              type="button"
              onClick={() => setModoComparacao('dois_eventos')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                modoComparacao === 'dois_eventos'
                  ? 'bg-[#07132B] text-[#D4AF37] shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Entre Dois Eventos Históricos
            </button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onVoltarParaLinhaTempo}
            className="text-xs text-slate-600 hover:text-[#07132B] hover:bg-slate-200 h-7"
          >
            ← Voltar para Linha do Tempo
          </Button>
        </div>

        {/* Seletores de Eventos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80">
          {/* Seletor Evento A */}
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Ponto de Referência A (Histórico)
              </span>
              {registroAEncontrado && getBadgeEventoMini(registroAEncontrado.tipo_evento)}
            </div>

            <Select value={eventoAId} onValueChange={setEventoAId}>
              <SelectTrigger className="w-full h-8 text-xs bg-slate-50 border-slate-200">
                <SelectValue placeholder="Selecione um evento..." />
              </SelectTrigger>
              <SelectContent>
                {eventosCronologicos.map((ev, idx) => (
                  <SelectItem key={ev.id || idx} value={ev.id} className="text-xs">
                    {formatarDataHistorico(ev.created)} — {ev.descricao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {registroAEncontrado && (
              <div className="text-[10px] text-slate-500 flex flex-wrap items-center justify-between gap-1 pt-1">
                <span>
                  Autor: <strong>{registroAEncontrado.autor_nome || 'Usuário'}</strong>
                </span>
                <span>Data: {formatarDataHistorico(registroAEncontrado.created)}</span>
              </div>
            )}
          </div>

          {/* Seletor Evento B ou Estado Atual */}
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {modoComparacao === 'evento_vs_atual'
                  ? 'Ponto de Comparação B (Estado Atual)'
                  : 'Ponto de Comparação B (Histórico)'}
              </span>
              {modoComparacao === 'evento_vs_atual' ? (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-[#07132B]/10 text-[#07132B] border border-[#07132B]/20">
                  Estado Atual
                </span>
              ) : (
                registroBEncontrado && getBadgeEventoMini(registroBEncontrado.tipo_evento)
              )}
            </div>

            {modoComparacao === 'evento_vs_atual' ? (
              <div className="h-8 px-2.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-900 flex items-center justify-between text-xs font-semibold">
                <span className="truncate">Estado Mais Recente da Simulação (em vigor)</span>
                <Badge
                  variant="outline"
                  className="border-emerald-300 text-emerald-800 text-[9px] bg-white"
                >
                  Versão Atual
                </Badge>
              </div>
            ) : (
              <Select value={eventoBId} onValueChange={setEventoBId}>
                <SelectTrigger className="w-full h-8 text-xs bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Selecione o segundo evento..." />
                </SelectTrigger>
                <SelectContent>
                  {eventosCronologicos.map((ev, idx) => (
                    <SelectItem
                      key={ev.id || idx}
                      value={ev.id}
                      disabled={ev.id === eventoAId}
                      className="text-xs"
                    >
                      {formatarDataHistorico(ev.created)} — {ev.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="text-[10px] text-slate-500 flex flex-wrap items-center justify-between gap-1 pt-1">
              {modoComparacao === 'evento_vs_atual' ? (
                <>
                  <span>
                    Simulação: <strong>{simulacaoNome || 'Ativa'}</strong>
                  </span>
                  <span>Última versão salva</span>
                </>
              ) : (
                registroBEncontrado && (
                  <>
                    <span>
                      Autor: <strong>{registroBEncontrado.autor_nome || 'Usuário'}</strong>
                    </span>
                    <span>Data: {formatarDataHistorico(registroBEncontrado.created)}</span>
                  </>
                )
              )}
            </div>
          </div>
        </div>

        {/* Resumo de Diferenças e Filtro */}
        <div className="bg-[#07132B]/5 border border-[#D4AF37]/30 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
            <span className="text-slate-700 font-medium">
              {resultadoComparacao.diffs.length === 0 ? (
                <strong className="text-emerald-800">
                  Nenhuma diferença de parâmetros entre os dois pontos selecionados.
                </strong>
              ) : (
                <span>
                  Foram identificadas{' '}
                  <strong className="text-[#07132B]">
                    {resultadoComparacao.diffs.length}{' '}
                    {resultadoComparacao.diffs.length === 1
                      ? 'alteração de parâmetro'
                      : 'alterações de parâmetros'}
                  </strong>{' '}
                  entre os dois momentos.
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-slate-500 font-semibold text-[11px]">Exibir:</span>
            <button
              type="button"
              onClick={() => setFiltroDiferencas('apenas_alterados')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                filtroDiferencas === 'apenas_alterados'
                  ? 'bg-[#07132B] text-[#D4AF37]'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Apenas Alterados ({resultadoComparacao.diffs.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroDiferencas('todos')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                filtroDiferencas === 'todos'
                  ? 'bg-[#07132B] text-[#D4AF37]'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Todos os Parâmetros ({resultadoComparacao.camposTotais.length})
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de Diff De → Para (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {camposParaExibir.length === 0 ? (
          <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="font-semibold text-slate-700 text-sm">
              Nenhum campo com alteração para exibir
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Alterne o filtro para &quot;Todos os Parâmetros&quot; ou escolha outro evento
              histórico para comparar.
            </p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#07132B] text-white text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="p-3 border-b border-[#D4AF37]/30 w-[35%]">
                      Parâmetro / Indicador
                    </th>
                    <th className="p-3 border-b border-[#D4AF37]/30 w-[32%] text-slate-200">
                      Ponto A (Anterior)
                    </th>
                    <th className="p-3 border-b border-[#D4AF37]/30 w-[33%] text-[#D4AF37]">
                      {modoComparacao === 'evento_vs_atual'
                        ? 'Ponto B (Estado Atual)'
                        : 'Ponto B (Mais Recente)'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {camposParaExibir.map((item, idx) => {
                    return (
                      <tr
                        key={item.campo || idx}
                        className={`transition-colors ${
                          item.mudou
                            ? 'bg-amber-50/40 hover:bg-amber-50/80'
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            {item.mudou && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0" />
                            )}
                            <span className="font-semibold text-slate-800">{item.rotulo}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                            {item.campo}
                          </span>
                        </td>

                        {/* Valor Ponto A */}
                        <td className="p-3 font-mono">
                          <span
                            className={
                              item.mudou
                                ? 'text-slate-600 line-through bg-rose-50 px-1 py-0.5 rounded border border-rose-200/50'
                                : 'text-slate-600'
                            }
                          >
                            {item.valorAFormatado}
                          </span>
                        </td>

                        {/* Valor Ponto B */}
                        <td className="p-3 font-mono">
                          <span
                            className={
                              item.mudou
                                ? 'font-bold text-[#07132B] bg-[#D4AF37]/15 px-1.5 py-0.5 rounded border border-[#D4AF37]/30'
                                : 'text-slate-700 font-medium'
                            }
                          >
                            {item.valorBFormatado}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Informações adicionais do estado comparado */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2">
          <span>
            Padrão de rastreabilidade <strong>Diamond Group</strong>: os snapshots e diffs refletem
            exatamente a evolução dos dados gravados na coleção auditável e imutável.
          </span>
          <span className="text-slate-400 text-[10px]">
            {resultadoComparacao.camposIguais.length} parâmetro(s) idêntico(s)
          </span>
        </div>
      </div>
    </div>
  )
}
