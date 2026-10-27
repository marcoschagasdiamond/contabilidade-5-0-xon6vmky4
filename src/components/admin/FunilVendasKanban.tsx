import React, { useState } from 'react'
import type { ClienteGlobalItem } from '@/types/master'
import { ESTAGIOS_FUNIL_CRM, type EstagioFunilCrm } from '@/types/crm'
import { atualizarEstagioFunilCliente } from '@/services/crm'

interface FunilVendasKanbanProps {
  clientes: ClienteGlobalItem[]
  onSelecionarCliente: (cliente: ClienteGlobalItem) => void
  onClienteAtualizado: (
    clienteId: string,
    novoEstagio: EstagioFunilCrm,
    origem: 'clientes' | 'clientes_empresas',
  ) => void
  onFeedback?: (feedback: { tipo: 'sucesso' | 'erro'; mensagem: string } | null) => void
}

export function FunilVendasKanban({
  clientes,
  onSelecionarCliente,
  onClienteAtualizado,
  onFeedback,
}: FunilVendasKanbanProps) {
  const [draggedClienteId, setDraggedClienteId] = useState<string | null>(null)
  const [dragOverEstagio, setDragOverEstagio] = useState<EstagioFunilCrm | null>(null)
  const [salvandoId, setSalvandoId] = useState<string | null>(null)

  const moverEstagio = async (cliente: ClienteGlobalItem, novoEstagio: EstagioFunilCrm) => {
    if (cliente.estagio_funil === novoEstagio) return

    setSalvandoId(cliente.id)
    try {
      await atualizarEstagioFunilCliente({
        clienteId: cliente.id,
        collectionOrigem: cliente.collection_origem,
        estagio: novoEstagio,
      })

      onClienteAtualizado(cliente.id, novoEstagio, cliente.collection_origem)

      if (onFeedback) {
        const estagioObj = ESTAGIOS_FUNIL_CRM.find((e) => e.id === novoEstagio)
        onFeedback({
          tipo: 'sucesso',
          mensagem: `Cliente "${cliente.nome || cliente.empresa}" movido para o estágio "${estagioObj?.rotulo || novoEstagio}".`,
        })
      }
    } catch (err) {
      console.error('Erro ao mover cliente no funil:', err)
      if (onFeedback) {
        onFeedback({
          tipo: 'erro',
          mensagem: 'Não foi possível mover o cliente. Verifique sua conexão e permissões.',
        })
      }
    } finally {
      setSalvandoId(null)
      setDraggedClienteId(null)
      setDragOverEstagio(null)
    }
  }

  const handleDragStart = (e: React.DragEvent, cliente: ClienteGlobalItem) => {
    e.dataTransfer.setData('text/plain', cliente.id)
    e.dataTransfer.effectAllowed = 'move'
    setDraggedClienteId(cliente.id)
  }

  const handleDragOver = (e: React.DragEvent, estagio: EstagioFunilCrm) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverEstagio !== estagio) {
      setDragOverEstagio(estagio)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, estagioDestino: EstagioFunilCrm) => {
    e.preventDefault()
    setDragOverEstagio(null)
    const clienteId = e.dataTransfer.getData('text/plain') || draggedClienteId
    if (!clienteId) return

    const cliente = clientes.find((c) => c.id === clienteId)
    if (!cliente) return

    await moverEstagio(cliente, estagioDestino)
  }

  return (
    <div className="space-y-4">
      {/* CABEÇALHO DO FUNIL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
        <div>
          <h3 className="font-heading font-extrabold text-lg text-[#07132B]">
            Funil de Conversão & Gestão Comercial
          </h3>
          <p className="text-xs text-slate-500">
            Arraste os cartões entre as colunas ou use o seletor rápido no card para atualizar o
            estágio do cliente em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total no Funil:
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#07132B] text-[#D4AF37] border border-[#D4AF37]/30">
            {clientes.length} clientes
          </span>
        </div>
      </div>

      {/* GRADE KANBAN COM 5 COLUNAS HORIZONTAIS */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 items-start overflow-x-auto pb-4">
        {ESTAGIOS_FUNIL_CRM.map((coluna) => {
          const clientesDaColuna = clientes.filter((c) => (c.estagio_funil || 'lead') === coluna.id)

          const isOver = dragOverEstagio === coluna.id

          return (
            <div
              key={coluna.id}
              onDragOver={(e) => handleDragOver(e, coluna.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, coluna.id)}
              className={`rounded-2xl border transition-all duration-200 flex flex-col min-h-[520px] bg-slate-50/70 ${
                isOver
                  ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/50 bg-[#D4AF37]/5'
                  : 'border-slate-200 shadow-sm'
              }`}
            >
              {/* CABEÇALHO DA COLUNA */}
              <div
                className={`p-3.5 rounded-t-2xl border-b border-slate-200 flex items-center justify-between ${coluna.corHeaderBg}`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-extrabold text-sm tracking-tight">
                      {coluna.rotulo}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/90 text-slate-900 shadow-2xs">
                      {clientesDaColuna.length}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-600 block mt-0.5">
                    {coluna.subtitulo}
                  </span>
                </div>
              </div>

              {/* LISTA DE CARTÕES */}
              <div className="p-2.5 flex-1 space-y-2.5 overflow-y-auto max-h-[700px]">
                {clientesDaColuna.length === 0 ? (
                  <div className="h-32 rounded-xl border border-dashed border-slate-200 flex items-center justify-center p-4 text-center">
                    <span className="text-[11px] text-slate-400">Nenhum cliente neste estágio</span>
                  </div>
                ) : (
                  clientesDaColuna.map((cliente) => {
                    const isSalvando = salvandoId === cliente.id
                    const isDragging = draggedClienteId === cliente.id

                    return (
                      <div
                        key={`${cliente.collection_origem}_${cliente.id}`}
                        draggable={!isSalvando}
                        onDragStart={(e) => handleDragStart(e, cliente)}
                        onDragEnd={() => {
                          setDraggedClienteId(null)
                          setDragOverEstagio(null)
                        }}
                        onClick={() => onSelecionarCliente(cliente)}
                        className={`bg-white rounded-xl p-3.5 border transition-all duration-150 cursor-grab active:cursor-grabbing hover:shadow-md ${
                          isDragging
                            ? 'opacity-40 border-[#D4AF37]'
                            : 'border-slate-200 hover:border-[#D4AF37]/50'
                        }`}
                      >
                        {/* IDENTIFICAÇÃO DO CLIENTE */}
                        <div className="flex items-start justify-between gap-1 mb-1.5">
                          <h4 className="font-heading font-bold text-xs text-slate-900 line-clamp-1">
                            {cliente.nome || cliente.empresa}
                          </h4>
                          <span
                            className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                              cliente.origem_tipo === 'analista'
                                ? 'bg-[#07132B] text-[#D4AF37]'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {cliente.origem_tipo === 'analista' ? 'Analista' : 'Direto'}
                          </span>
                        </div>

                        {/* SUB-DADOS */}
                        <div className="text-[11px] text-slate-500 font-mono mb-2">
                          {cliente.cnpj_cpf || 'Sem CNPJ'}
                        </div>

                        {/* BADGES DO CLIENTE (DIAGNÓSTICOS E SIMULAÇÕES) */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                          {cliente.total_diagnosticos > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#07132B] text-white">
                              Diag. 360° ({cliente.total_diagnosticos})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-400">
                              Sem Diag.
                            </span>
                          )}

                          {cliente.total_simulacoes > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37]/20 text-[#07132B] border border-[#D4AF37]/60">
                              Simulações ({cliente.total_simulacoes})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-400">
                              Sem Simulações
                            </span>
                          )}
                        </div>

                        {/* DETALHE DA ORIGEM */}
                        <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-150 mb-2.5">
                          <span className="text-[10px] text-slate-400 block">Origem:</span>
                          <span className="font-semibold text-slate-800 line-clamp-1">
                            {cliente.origem_tipo === 'analista'
                              ? cliente.analista_nome || 'Analista Parceiro'
                              : 'Cadastro Direto no Site'}
                          </span>
                        </div>

                        {/* CONTROLE RÁPIDO: SELETOR DE ESTÁGIO (FALLBACK MOBILE / SEM DRAG) */}
                        <div
                          className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-[10px] text-slate-500 font-medium">
                            Mover estágio:
                          </span>
                          <select
                            disabled={isSalvando}
                            value={cliente.estagio_funil || 'lead'}
                            onChange={(e) =>
                              moverEstagio(cliente, e.target.value as EstagioFunilCrm)
                            }
                            className="text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg px-2 py-1 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                          >
                            {ESTAGIOS_FUNIL_CRM.map((e) => (
                              <option key={e.id} value={e.id}>
                                {e.rotulo}
                              </option>
                            ))}
                          </select>
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
    </div>
  )
}
