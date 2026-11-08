import React, { useState } from 'react'
import type { EstagioPipelineLead, LeadProcessado } from '@/types/pipelineLead'
import { ESTAGIOS_PIPELINE_LEAD } from '@/types/pipelineLead'
import { AlertaLeadsQuentes } from './AlertaLeadsQuentes'
import { ModalFichaLeadPipeline } from './ModalFichaLeadPipeline'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PipelineLeadsKanbanProps {
  leads: LeadProcessado[]
  loading: boolean
  onMudarEstagio: (leadId: string, novoEstagio: EstagioPipelineLead) => Promise<void>
  onAdicionarInteracao: (leadId: string, dados: any) => Promise<void>
  onRecarregar: () => void
}

export function PipelineLeadsKanban({
  leads,
  loading,
  onMudarEstagio,
  onAdicionarInteracao,
  onRecarregar,
}: PipelineLeadsKanbanProps) {
  const [busca, setBusca] = useState('')
  const [filtroFonte, setFiltroFonte] = useState('todas')
  const [filtroQuente, setFiltroQuente] = useState(false)
  const [leadSelecionado, setLeadSelecionado] = useState<LeadProcessado | null>(null)
  const [modalAberto, setModalAberto] = useState(false)

  // Filtragem
  const leadsFiltrados = leads.filter((lead) => {
    if (filtroQuente && !lead.isQuenteEsquecido) return false
    if (filtroFonte !== 'todas' && !lead.fonte.toLowerCase().includes(filtroFonte.toLowerCase())) {
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

  // Agrupamento por coluna
  const colunas = ESTAGIOS_PIPELINE_LEAD.map((estagio) => {
    const leadsColuna = leadsFiltrados.filter((l) => l.estagio_pipeline === estagio.id)
    return {
      ...estagio,
      leads: leadsColuna,
    }
  })

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
              {leadsFiltrados.length} / {leads.length}
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
              {/* CABEÇALHO DA COLUNA */}
              <div
                className={`p-3 rounded-2xl border ${col.corHeaderBg} mb-3 flex items-center justify-between shadow-2xs`}
              >
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

              {/* LISTA DE CARDS DE LEADS NA COLUNA */}
              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[700px] pr-0.5">
                {col.leads.length === 0 ? (
                  <div className="text-center py-10 px-3 border border-dashed border-slate-200 rounded-2xl text-[11px] text-slate-400">
                    Nenhum lead nesta etapa
                  </div>
                ) : (
                  col.leads.map((lead) => {
                    const temAlerta = lead.isQuenteEsquecido

                    return (
                      <div
                        key={lead.id}
                        className={`bg-white rounded-2xl p-3.5 border transition-all shadow-2xs hover:shadow-md cursor-pointer ${
                          temAlerta
                            ? 'border-rose-400 ring-2 ring-rose-300/40 bg-rose-50/20'
                            : 'border-slate-200/80 hover:border-[#D4AF37]/60'
                        }`}
                        onClick={() => abrirFicha(lead)}
                      >
                        {/* TAGS TOPO */}
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

                        {temAlerta && (
                          <div className="mb-2 px-2 py-0.5 bg-rose-100 border border-rose-300 rounded-md text-[10px] font-extrabold text-rose-800 flex items-center justify-between">
                            <span>🔥 Lead Quente Esquecido</span>
                            <span>{lead.diasSemInteracao}d</span>
                          </div>
                        )}

                        {/* INFO DO LEAD */}
                        <h4 className="font-heading font-extrabold text-xs sm:text-sm text-[#07132B] line-clamp-1">
                          {lead.nome}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-semibold line-clamp-1 mt-0.5">
                          {lead.empresa || 'Empresa não informada'}
                        </p>

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
      />
    </div>
  )
}
