import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { listarHistoricoSimulacao, formatarDataHistorico } from '@/services/historicoSimulacoes'
import type {
  HistoricoSimulacaoRegistro,
  ItemAlteracaoCampo,
  TipoEventoHistorico,
} from '@/types/historicoSimulacoes'

interface ModalHistoricoSimulacaoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  simulacaoId: string | null
  simulacaoNome?: string
  empresa?: string
  tipoSimulacao?: 'calculadora' | 'recuperador'
  onCompararHistoricoComOutra?: () => void
}

function getBadgeEvento(tipo: TipoEventoHistorico) {
  switch (tipo) {
    case 'criacao':
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
          Criação
        </span>
      )
    case 'renomeacao':
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-amber-100 text-amber-900 border border-amber-300">
          Renomeação
        </span>
      )
    case 'edicao_parametros':
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[#07132B] text-[#D4AF37] border border-[#D4AF37]/50">
          Parâmetros Alterados
        </span>
      )
    case 'exclusao':
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-rose-100 text-rose-800 border border-rose-300">
          Exclusão
        </span>
      )
    default:
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-slate-100 text-slate-700">
          Registro
        </span>
      )
  }
}

export function ModalHistoricoSimulacao({
  open,
  onOpenChange,
  simulacaoId,
  simulacaoNome,
  empresa,
  tipoSimulacao = 'calculadora',
  onCompararHistoricoComOutra,
}: ModalHistoricoSimulacaoProps) {
  const [registros, setRegistros] = useState<HistoricoSimulacaoRegistro[]>([])
  const [carregando, setCarregando] = useState(false)
  const [filtroEvento, setFiltroEvento] = useState<string>('todos')

  useEffect(() => {
    if (open && simulacaoId) {
      setCarregando(true)
      listarHistoricoSimulacao(simulacaoId)
        .then((dados) => {
          setRegistros(dados)
        })
        .finally(() => {
          setCarregando(false)
        })
    } else {
      setRegistros([])
    }
  }, [open, simulacaoId])

  const registrosFiltrados = registros.filter((reg) => {
    if (filtroEvento === 'todos') return true
    return reg.tipo_evento === filtroEvento
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 border border-[#D4AF37]/30 bg-white shadow-2xl rounded-2xl overflow-hidden">
        {/* Cabeçalho Diamond Group (Navy/Dourado) */}
        <div className="bg-[#07132B] text-white p-5 border-b border-[#D4AF37]/30 relative">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start justify-between gap-4 relative">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest text-[#D4AF37] bg-[#D4AF37]/15 border border-[#D4AF37]/30 uppercase mb-2">
                AUDITORIA E RASTREABILIDADE
              </div>
              <DialogTitle className="text-lg sm:text-xl font-heading font-bold text-white tracking-tight">
                Histórico de Alterações da Simulação
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-300 mt-1">
                Linha do tempo cronológica com todas as modificações de parâmetros, renomeações e
                ações registradas nesta simulação.
              </DialogDescription>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-slate-400">Simulação: </span>
              <strong className="text-[#D4AF37]">{simulacaoNome || 'Sem título'}</strong>
              {empresa && (
                <span className="text-slate-300 ml-2">
                  • Empresa: <strong>{empresa}</strong>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-[#D4AF37]/40 text-[#D4AF37] text-[10px]">
                {tipoSimulacao === 'calculadora'
                  ? 'Calculadora IBS/CBS'
                  : 'Recuperador de Créditos'}
              </Badge>
              <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                Imutável
              </span>
            </div>
          </div>
        </div>

        {/* Barra de Filtro de Eventos */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold text-[11px]">Filtrar evento:</span>
            <button
              type="button"
              onClick={() => setFiltroEvento('todos')}
              className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                filtroEvento === 'todos'
                  ? 'bg-[#07132B] text-[#D4AF37]'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Todos ({registros.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroEvento('edicao_parametros')}
              className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                filtroEvento === 'edicao_parametros'
                  ? 'bg-[#07132B] text-[#D4AF37]'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Parâmetros
            </button>
            <button
              type="button"
              onClick={() => setFiltroEvento('renomeacao')}
              className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                filtroEvento === 'renomeacao'
                  ? 'bg-[#07132B] text-[#D4AF37]'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Renomeação
            </button>
            <button
              type="button"
              onClick={() => setFiltroEvento('criacao')}
              className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                filtroEvento === 'criacao'
                  ? 'bg-[#07132B] text-[#D4AF37]'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Criação
            </button>
          </div>

          <div className="text-[11px] text-slate-500">
            Total de {registrosFiltrados.length}{' '}
            {registrosFiltrados.length === 1 ? 'evento' : 'eventos'}
          </div>
        </div>

        {/* Linha do tempo dos eventos (Scrollable) */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {carregando ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <div className="inline-block w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-2" />
              <p>Carregando histórico auditável de alterações...</p>
            </div>
          ) : registrosFiltrados.length === 0 ? (
            <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="font-semibold text-slate-700 text-sm">Nenhum evento registrado ainda</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Quando a simulação for criada, renomeada ou tiver parâmetros e valores modificados,
                os detalhes de cada alteração aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#D4AF37]/30">
              {registrosFiltrados.map((item, idx) => {
                const temAlteracoes = item.alteracoes_json && item.alteracoes_json.length > 0
                return (
                  <div key={item.id || idx} className="relative group">
                    {/* Marcador na linha do tempo (Navy com borda dourada, sem ícone) */}
                    <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-[#07132B] border-2 border-[#D4AF37] ring-4 ring-white" />

                    {/* Card do evento */}
                    <div className="bg-slate-50 hover:bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-slate-200/80">
                        <div className="flex items-center gap-2">
                          {getBadgeEvento(item.tipo_evento)}
                          <strong className="text-xs font-bold text-[#07132B]">
                            {item.descricao}
                          </strong>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">
                          {formatarDataHistorico(item.created)}
                        </span>
                      </div>

                      {/* Informações do autor */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 mt-2">
                        <span>
                          Responsável:{' '}
                          <strong className="text-slate-700 font-semibold">
                            {item.autor_nome || 'Usuário do Sistema'}
                          </strong>
                          {item.autor_nivel && (
                            <span className="ml-1 text-[10px] uppercase font-bold text-slate-400">
                              ({item.autor_nivel})
                            </span>
                          )}
                        </span>
                        {item.origem && (
                          <span>
                            Armazenamento:{' '}
                            <strong className="text-slate-600">
                              {item.origem === 'nuvem' ? 'Nuvem' : 'Local'}
                            </strong>
                          </span>
                        )}
                      </div>

                      {/* Tabela de Diff De -> Para de Parâmetros */}
                      {temAlteracoes && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200">
                          <span className="text-[11px] font-bold text-[#07132B] uppercase tracking-wider block mb-2">
                            Campos alterados nesta versão:
                          </span>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                              <thead className="bg-[#07132B]/5 text-slate-700 text-[10px] uppercase font-bold">
                                <tr>
                                  <th className="p-2 border-b border-slate-200">
                                    Parâmetro / Campo
                                  </th>
                                  <th className="p-2 border-b border-slate-200">Valor Anterior</th>
                                  <th className="p-2 border-b border-slate-200">Novo Valor</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 bg-white text-[11px]">
                                {item.alteracoes_json!.map(
                                  (alt: ItemAlteracaoCampo, aIdx: number) => (
                                    <tr key={aIdx} className="hover:bg-slate-50/60">
                                      <td className="p-2 font-semibold text-slate-800">
                                        {alt.rotulo || alt.campo}
                                      </td>
                                      <td className="p-2 font-mono text-slate-500 line-through">
                                        {alt.valorAnteriorFormatado ||
                                          String(alt.valorAnterior ?? '-')}
                                      </td>
                                      <td className="p-2 font-mono font-bold text-[#07132B] bg-[#D4AF37]/10">
                                        {alt.valorNovoFormatado || String(alt.valorNovo ?? '-')}
                                      </td>
                                    </tr>
                                  ),
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Resumo do Snapshot no momento do evento */}
                      {item.snapshot_novo_json && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-[10px] text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                          {item.snapshot_novo_json.regime && (
                            <span>
                              Regime: <strong>{item.snapshot_novo_json.regime}</strong>
                            </span>
                          )}
                          {item.snapshot_novo_json.faturamentoMensal !== undefined && (
                            <span>
                              Faturamento:{' '}
                              <strong>
                                R${' '}
                                {item.snapshot_novo_json.faturamentoMensal.toLocaleString('pt-BR')}
                              </strong>
                            </span>
                          )}
                          {item.snapshot_novo_json.aliquotaEfetiva !== undefined && (
                            <span>
                              Alíq. Efetiva:{' '}
                              <strong>{item.snapshot_novo_json.aliquotaEfetiva.toFixed(2)}%</strong>
                            </span>
                          )}
                          {item.snapshot_novo_json.economiaAnual !== undefined && (
                            <span>
                              Economia Projetada:{' '}
                              <strong className="text-emerald-700">
                                R${' '}
                                {item.snapshot_novo_json.economiaAnual.toLocaleString('pt-BR', {
                                  maximumFractionDigits: 0,
                                })}
                              </strong>
                            </span>
                          )}
                          {item.snapshot_novo_json.totalRecuperavelIntegral !== undefined && (
                            <span>
                              Créditos Totais:{' '}
                              <strong className="text-emerald-700">
                                R${' '}
                                {item.snapshot_novo_json.totalRecuperavelIntegral.toLocaleString(
                                  'pt-BR',
                                  { maximumFractionDigits: 0 },
                                )}
                              </strong>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Rodapé Diamond */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <span className="text-[11px] text-slate-500">
            Registro com carimbo de tempo inviolável e rastreamento de usuário.
          </span>
          <div className="flex items-center gap-2">
            {onCompararHistoricoComOutra && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCompararHistoricoComOutra}
                className="text-xs bg-amber-50 text-[#07132B] border-[#D4AF37] hover:bg-amber-100 font-bold"
              >
                Comparar Histórico com Outra
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs bg-white text-slate-700 border-slate-300 font-semibold"
            >
              Fechar Histórico
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
