import React, { useState, useMemo } from 'react'
import type { EstagioPipelineLead, LeadProcessado } from '@/types/pipelineLead'
import { ESTAGIOS_PIPELINE_LEAD } from '@/types/pipelineLead'
import {
  extrairUltimoEventoDiagnostico,
  formatarUltimoEventoDiagnosticoCurto,
  formatarValorCompacto,
} from '@/lib/pipelineLeadUtils'
import { AlertaLeadsQuentes } from './AlertaLeadsQuentes'
import { ModalFichaLeadPipeline } from './ModalFichaLeadPipeline'
import { EdicaoValorPotencialInline } from './EdicaoValorPotencialInline'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PipelineLeadsKanbanProps {
  leads: LeadProcessado[]
  loading: boolean
  onMudarEstagio: (leadId: string, novoEstagio: EstagioPipelineLead) => Promise<void>
  onAdicionarInteracao: (leadId: string, dados: any) => Promise<void>
  onAtualizarFaturamento?: (leadId: string, novoValor: number) => Promise<void>
  onRecarregar: () => void
}

export function PipelineLeadsKanban({
  leads,
  loading,
  onMudarEstagio,
  onAdicionarInteracao,
  onAtualizarFaturamento,
  onRecarregar,
}: PipelineLeadsKanbanProps) {
  const [busca, setBusca] = useState('')
  const [filtroFonte, setFiltroFonte] = useState('todas')
  const [filtroQuente, setFiltroQuente] = useState(false)
  const [leadSelecionado, setLeadSelecionado] = useState<LeadProcessado | null>(null)
  const [modalAberto, setModalAberto] = useState(false)

  // Filtragem e agrupamento com ordenação estrita por SCORE (maior para o menor)
  const colunas = useMemo(() => {
    const filtrados = leads.filter((lead) => {
      if (filtroQuente && !lead.isQuenteEsquecido) return false
      if (
        filtroFonte !== 'todas' &&
        !lead.fonte.toLowerCase().includes(filtroFonte.toLowerCase())
      ) {
        return false
      }
      if (busca.trim()) {
        const q = busca.toLowerCase()
        const matchNome = lead.nome.toLowerCase().includes(q)
        const matchEmpresa = lead.empresa.toLowerCase().includes(q)
        const matchEmail = lead.email.toLowerCase().includes(q)
        const matchTel = lead.telefone.includes(q)
        const matchCnpj = lead.cnpj ? lead.cnpj.includes(q) : false
        if (!matchNome && !matchEmpresa && !matchEmail && !matchTel && !matchCnpj) return false
      }
      return true
    })

    return ESTAGIOS_PIPELINE_LEAD.map((estagio) => {
      const leadsDaColuna = filtrados
        .filter((l) => l.estagio_pipeline === estagio.id)
        // Ordenação por score do maior para o menor (se empatar, desempata pela data mais recente)
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score
          const tA = a.created ? new Date(a.created).getTime() : 0
          const tB = b.created ? new Date(b.created).getTime() : 0
          return tB - tA
        })

      const valorPotencialEstagio = leadsDaColuna.reduce(
        (acc, item) => acc + (item.valorPotencial || 0),
        0,
      )

      return {
        ...estagio,
        leads: leadsDaColuna,
        valorPotencial: valorPotencialEstagio,
      }
    })
  }, [leads, filtroQuente, filtroFonte, busca])

  const totalLeadsFiltrados = useMemo(() => {
    return colunas.reduce((acc, c) => acc + c.leads.length, 0)
  }, [colunas])

  const valorPotencialGlobalVisivel = useMemo(() => {
    return colunas.reduce((acc, c) => acc + c.valorPotencial, 0)
  }, [colunas])

  const abrirFicha = (lead: LeadProcessado) => {
    setLeadSelecionado(lead)
    setModalAberto(true)
  }

  // Atualiza lead selecionado quando houver re-render
  const leadAtual = leadSelecionado
    ? leads.find((l) => l.id === leadSelecionado.id) || leadSelecionado
    : null

  const fontesUnicas = Array.from(new Set(leads.map((l) => l.fonte))).filter(Boolean)

  return (
    <div className="space-y-6">
      {/* ALERTA DE LEADS QUENTES ESQUECIDOS */}
      <AlertaLeadsQuentes
        leads={leads}
        onSelecionarLead={(lead) => {
          abrirFicha(lead)
        }}
      />

      {/* BARRA DE FILTROS E PESQUISA */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="w-full sm:w-64">
            <Input
              type="text"
              placeholder="Buscar por nome, empresa, e-mail..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="h-9 text-xs rounded-xl border-slate-200"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Origem:</span>
            <select
              value={filtroFonte}
              onChange={(e) => setFiltroFonte(e.target.value)}
              className="h-9 text-xs rounded-xl border border-slate-200 bg-white px-3 text-slate-700 font-medium"
            >
              <option value="todas">Todas as fontes</option>
              {fontesUnicas.map((fonte) => (
                <option key={fonte} value={fonte}>
                  {fonte}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setFiltroQuente(!filtroQuente)}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
              filtroQuente
                ? 'bg-rose-100 text-rose-800 border-rose-300 shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            🔥 Apenas Quentes Esquecidos ({leads.filter((l) => l.isQuenteEsquecido).length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">
            Total:{' '}
            <strong className="text-slate-800">
              {totalLeadsFiltrados} / {leads.length}
            </strong>
          </span>
          <span className="hidden sm:inline-block text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
            Pipeline:{' '}
            <strong className="text-[#07132B]">
              {formatarValorCompacto(valorPotencialGlobalVisivel)}
            </strong>
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={onRecarregar}
            disabled={loading}
            className="text-xs h-8 rounded-xl border-slate-200"
          >
            {loading ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </div>
      </div>

      {/* KANBAN DAS 4 COLUNAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {colunas.map((col) => {
          return (
            <div
              key={col.id}
              className="bg-slate-50/80 rounded-3xl p-3 border border-slate-200/80 flex flex-col min-h-[500px]"
            >
              {/* CABEÇALHO DA COLUNA COM VALOR POTENCIAL */}
              <div
                className={`p-3 rounded-2xl border ${col.corHeaderBg} mb-3 flex flex-col gap-2 shadow-2xs`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading font-extrabold text-xs sm:text-sm tracking-tight">
                      {col.rotulo}
                    </h3>
                    <p className="text-[10px] opacity-80 leading-tight">{col.subtitulo}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-black border ${col.corBadge}`}
                  >
                    {col.leads.length}
                  </span>
                </div>

                <div className="pt-2 border-t border-current/15 flex items-center justify-between text-[11px]">
                  <span className="font-bold opacity-75 uppercase tracking-wider text-[10px]">
                    Valor Potencial:
                  </span>
                  <span className="font-black font-heading text-xs sm:text-sm">
                    {formatarValorCompacto(col.valorPotencial)}
                  </span>
                </div>
              </div>

              {/* LISTA DE CARDS DE LEADS NA COLUNA (ORDENADOS POR SCORE) */}
              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[700px] pr-0.5">
                {col.leads.length === 0 ? (
                  <div className="text-center py-10 px-3 border border-dashed border-slate-200 rounded-2xl text-[11px] text-slate-400">
                    Nenhum lead nesta etapa
                  </div>
                ) : (
                  col.leads.map((lead) => {
                    const temAlerta = lead.isQuenteEsquecido
                    const diasParado = lead.diasParado ?? lead.diasSemInteracao ?? 0
                    const isParadoMuitoTempo =
                      diasParado >= 3 && lead.estagio_pipeline !== 'cliente'
                    const ultimoEventoDiag = extrairUltimoEventoDiagnostico(lead.interacoes)

                    return (
                      <div
                        key={lead.id}
                        className={`bg-white rounded-2xl p-3.5 border transition-all shadow-2xs hover:shadow-md cursor-pointer relative ${
                          temAlerta
                            ? 'border-rose-400 ring-2 ring-rose-300/40 bg-rose-50/20'
                            : isParadoMuitoTempo
                              ? 'border-amber-300 ring-1 ring-amber-200/60 bg-amber-50/15'
                              : 'border-slate-200/80 hover:border-[#D4AF37]/60'
                        }`}
                        onClick={() => abrirFicha(lead)}
                      >
                        {/* TAGS TOPO: SCORE E ORIGEM */}
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                              lead.score >= 50
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : lead.score >= 30
                                  ? 'bg-blue-100 text-blue-900 border-blue-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            Score: {lead.score} pts
                          </span>

                          <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                            {lead.fonte}
                          </span>
                        </div>

                        {/* ALERTAS: QUENTE ESQUECIDO OU TEMPO PARADO */}
                        {temAlerta ? (
                          <div className="mb-2 px-2 py-0.5 bg-rose-100 border border-rose-300 rounded-md text-[10px] font-extrabold text-rose-800 flex items-center justify-between">
                            <span>🔥 Lead Quente Esquecido</span>
                            <span>{lead.diasSemInteracao}d sem contato</span>
                          </div>
                        ) : isParadoMuitoTempo ? (
                          <div className="mb-2 px-2 py-0.5 bg-amber-100/90 border border-amber-300 rounded-md text-[10px] font-bold text-amber-900 flex items-center justify-between">
                            <span>⏳ Parado há {diasParado} dias</span>
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-700">
                              Atenção
                            </span>
                          </div>
                        ) : (
                          diasParado > 0 && (
                            <div className="mb-2 text-[10px] text-slate-400 font-medium flex items-center justify-between">
                              <span>Atividade recente:</span>
                              <span>{diasParado === 1 ? 'Ontem' : `${diasParado}d atrás`}</span>
                            </div>
                          )
                        )}

                        {/* INFO DO LEAD */}
                        <h4 className="font-heading font-extrabold text-xs sm:text-sm text-[#07132B] line-clamp-1">
                          {lead.nome}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-semibold line-clamp-1 mt-0.5">
                          {lead.empresa || 'Empresa não informada'}
                        </p>

                        {/* FATURAMENTO ESTIMADO DO LEAD (COM EDIÇÃO INLINE DIRETA NO CARD) */}
                        <div
                          className="mt-2 flex items-center justify-between text-[11px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Potencial:
                          </span>
                          {onAtualizarFaturamento ? (
                            <EdicaoValorPotencialInline
                              leadId={lead.id}
                              valorAtual={lead.valorPotencial || 0}
                              onSalvar={onAtualizarFaturamento}
                            />
                          ) : (
                            <span className="font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                              {lead.valorPotencial > 0
                                ? formatarValorCompacto(lead.valorPotencial)
                                : '—'}
                            </span>
                          )}
                        </div>

                        {/* ÚLTIMO EVENTO DE DIAGNÓSTICO (1 linha compacta) */}
                        {ultimoEventoDiag && (
                          <div
                            className="mt-2 px-2 py-1 rounded-md bg-[#07132B]/5 border border-[#D4AF37]/30 text-[10px] leading-snug text-slate-600"
                            title={ultimoEventoDiag.descricao}
                          >
                            <span className="font-extrabold text-[#07132B]">
                              📊 {formatarUltimoEventoDiagnosticoCurto(ultimoEventoDiag)}
                            </span>
                          </div>
                        )}

                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                          <span>
                            {lead.interacoes.length}{' '}
                            {lead.interacoes.length === 1 ? 'interação' : 'interações'}
                          </span>

                          {lead.telefone && (
                            <span className="text-slate-600 font-mono font-medium">
                              {lead.telefone}
                            </span>
                          )}
                        </div>

                        {/* MUDANÇA RÁPIDA DE ESTÁGIO */}
                        <div
                          className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            Mover:
                          </span>
                          <div className="flex gap-1">
                            {ESTAGIOS_PIPELINE_LEAD.map((destino) => {
                              if (destino.id === col.id) return null
                              return (
                                <button
                                  key={destino.id}
                                  type="button"
                                  title={`Mover para ${destino.rotulo}`}
                                  onClick={async (e) => {
                                    e.stopPropagation()
                                    await onMudarEstagio(lead.id, destino.id)
                                  }}
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-[#07132B] hover:text-[#D4AF37] text-slate-700 transition-colors"
                                >
                                  {destino.id === 'novo' && 'Novo'}
                                  {destino.id === 'contato_feito' && 'Contato'}
                                  {destino.id === 'reuniao' && 'Reunião'}
                                  {destino.id === 'cliente' && 'Cliente'}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* MODAL FICHA DO LEAD COM TIMELINE */}
      <ModalFichaLeadPipeline
        lead={leadAtual}
        open={modalAberto}
        onOpenChange={setModalAberto}
        onMudarEstagio={onMudarEstagio}
        onAdicionarInteracao={onAdicionarInteracao}
        onAtualizarFaturamento={onAtualizarFaturamento}
      />
    </div>
  )
}
