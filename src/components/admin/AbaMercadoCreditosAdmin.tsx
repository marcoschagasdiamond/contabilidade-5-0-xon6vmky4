import React, { useState } from 'react'
import type { AnuncioCredito, PedidoInformacaoCredito } from '@/types/creditos'
import {
  atualizarStatusAnuncio,
  responderPedidoInformacao,
  arquivarPedidoInformacao,
} from '@/services/creditos'
import { ModalExcluirAnuncioCredito } from '@/components/admin/ModalExcluirAnuncioCredito'
import { formatarMoeda, formatarPorcentagem } from '@/lib/calculadoraUtils'

interface AbaMercadoCreditosAdminProps {
  anuncios: AnuncioCredito[]
  pedidos: PedidoInformacaoCredito[]
  isLoading: boolean
  adminId: string
  nivelAcesso?: string
  isMaster?: boolean
  onAtualizar: () => void
  onFeedback: (fb: { tipo: 'sucesso' | 'erro'; mensagem: string } | null) => void
}

export function AbaMercadoCreditosAdmin({
  anuncios,
  pedidos,
  isLoading,
  adminId,
  nivelAcesso = 'admin',
  isMaster = false,
  onAtualizar,
  onFeedback,
}: AbaMercadoCreditosAdminProps) {
  const [subAba, setSubAba] = useState<'anuncios' | 'pedidos'>('pedidos')
  const [pedidoRespondendo, setPedidoRespondendo] = useState<PedidoInformacaoCredito | null>(null)
  const [respostaTexto, setRespostaTexto] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [anuncioParaExcluir, setAnuncioParaExcluir] = useState<AnuncioCredito | null>(null)

  const ehMasterOuAdmin = isMaster || nivelAcesso === 'master' || nivelAcesso === 'admin'

  const pedidosPendentes = pedidos.filter((p) => p.status === 'pendente')

  const handleResponder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pedidoRespondendo || !respostaTexto.trim()) return

    setIsSubmitting(true)
    try {
      await responderPedidoInformacao(pedidoRespondendo.id, adminId, respostaTexto.trim())
      onFeedback({
        tipo: 'sucesso',
        mensagem:
          'Resposta enviada com sucesso! O solicitante receberá a notificação em seu painel.',
      })
      setPedidoRespondendo(null)
      setRespostaTexto('')
      onAtualizar()
    } catch (err: any) {
      console.error(err)
      onFeedback({
        tipo: 'erro',
        mensagem: err?.message || 'Falha ao enviar resposta.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleArquivar = async (pedidoId: string) => {
    try {
      await arquivarPedidoInformacao(pedidoId)
      onFeedback({ tipo: 'sucesso', mensagem: 'Pedido arquivado com sucesso.' })
      onAtualizar()
    } catch (err: any) {
      onFeedback({ tipo: 'erro', mensagem: 'Falha ao arquivar pedido.' })
    }
  }

  const handleAlterarStatusAnuncio = async (
    anuncioId: string,
    novoStatus: AnuncioCredito['status'],
  ) => {
    try {
      await atualizarStatusAnuncio(anuncioId, novoStatus)
      onFeedback({ tipo: 'sucesso', mensagem: `Status alterado para ${novoStatus}.` })
      onAtualizar()
    } catch (err: any) {
      onFeedback({ tipo: 'erro', mensagem: 'Falha ao atualizar status do anúncio.' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Sub-navegação: Fila de Pedidos vs Anúncios Completos */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubAba('pedidos')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              subAba === 'pedidos'
                ? 'bg-[#07132B] text-[#D4AF37] shadow-sm ring-2 ring-[#D4AF37]/50'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Fila de Pedidos de Informação ({pedidosPendentes.length} pendentes / {pedidos.length}{' '}
            total)
          </button>

          <button
            type="button"
            onClick={() => setSubAba('anuncios')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              subAba === 'anuncios'
                ? 'bg-[#07132B] text-[#D4AF37] shadow-sm ring-2 ring-[#D4AF37]/50'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Anúncios Completos ({anuncios.length})
          </button>
        </div>

        <button
          type="button"
          onClick={onAtualizar}
          className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700"
        >
          Atualizar Dados
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">
            Carregando dados da mesa de créditos...
          </p>
        </div>
      ) : subAba === 'pedidos' ? (
        /* ========================================================= */
        /* FILA DE PEDIDOS DE INFORMAÇÃO */
        /* ========================================================= */
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
            <strong>Fila de Intermediação Técnica:</strong> Os pedidos de informação abaixo foram
            enviados por usuários interessados nos anúncios do Mercado de Créditos. Responda
            diretamente nesta tela: a sua resposta interna será registrada e uma notificação chegará
            ao solicitante no portal.
          </div>

          {pedidos.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center text-slate-500 text-xs">
              Nenhum pedido de informação registrado até o momento.
            </div>
          ) : (
            <div className="space-y-4">
              {pedidos.map((ped) => {
                const anuncio = ped.expand?.anuncio_id
                const ehPendente = ped.status === 'pendente'

                return (
                  <div
                    key={ped.id}
                    className={`rounded-2xl bg-white border p-6 shadow-sm transition-all ${
                      ehPendente ? 'border-amber-300 ring-2 ring-amber-200/50' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              ehPendente
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                            }`}
                          >
                            {ped.status}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(ped.created).toLocaleDateString('pt-BR')} às{' '}
                            {new Date(ped.created).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <h3 className="font-heading font-bold text-base text-slate-900">
                          Solicitante: {ped.solicitante_nome} ({ped.solicitante_email}
                          {ped.solicitante_telefone ? ` • ${ped.solicitante_telefone}` : ''})
                        </h3>
                      </div>

                      {/* Dados resumidos do Anúncio Relacionado */}
                      {anuncio && (
                        <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 sm:text-right shrink-0">
                          <span className="font-bold text-slate-800 block">
                            {anuncio.operacao === 'venda'
                              ? anuncio.tipo_credito || 'Crédito'
                              : 'Interesse de Compra'}
                          </span>
                          <span className="text-slate-500">
                            {formatarMoeda(anuncio.valor_nominal)} • Deságio:{' '}
                            {formatarPorcentagem(anuncio.desagio_percentual)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Mensagem enviada pelo interessado */}
                    <div className="mb-4">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Mensagem do Solicitante:
                      </span>
                      <p className="text-xs sm:text-sm text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed italic">
                        "{ped.mensagem}"
                      </p>
                    </div>

                    {/* Resposta do Admin, se já respondido */}
                    {ped.resposta_admin && (
                      <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                        <span className="font-bold text-emerald-900 block mb-1">
                          Resposta Técnica Enviada em{' '}
                          {ped.respondido_em
                            ? new Date(ped.respondido_em).toLocaleDateString('pt-BR')
                            : ''}
                          :
                        </span>
                        <p className="text-emerald-950 leading-relaxed font-medium">
                          {ped.resposta_admin}
                        </p>
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      {ehPendente && (
                        <button
                          type="button"
                          onClick={() => {
                            setPedidoRespondendo(ped)
                            setRespostaTexto('')
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] transition-all shadow-sm"
                        >
                          Responder Solicitante
                        </button>
                      )}

                      {ped.status !== 'arquivado' && (
                        <button
                          type="button"
                          onClick={() => handleArquivar(ped.id)}
                          className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        >
                          Arquivar
                        </button>
                      )}

                      {/* Ação Excluir Anúncio na fila de pedidos: visível apenas para Master e Admin */}
                      {ehMasterOuAdmin && anuncio && (
                        <button
                          type="button"
                          onClick={() => setAnuncioParaExcluir(anuncio)}
                          className="px-3 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                          title="Excluir este anúncio do Mercado de Créditos"
                        >
                          Excluir anúncio
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* ========================================================= */
        /* ANÚNCIOS COMPLETOS COM DADOS SENSÍVEIS (VISÃO MASTER/ADMIN) */
        /* ========================================================= */
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#07132B] border border-[#D4AF37]/50 text-white text-xs leading-relaxed">
            <strong className="text-[#D4AF37] block mb-0.5">Visão Administrativa Restrita:</strong>
            Abaixo estão listados todos os anúncios com seus{' '}
            <strong>dados de contato completos e sensíveis</strong> (Nome, CNPJ/CPF, E-mail e
            Telefone do anunciante) para que os administradores possam realizar a checagem,
            validação pericial e intermediação da mesa.
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#07132B] text-white font-heading font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Operação</th>
                  <th className="py-3 px-4">Tipo / Finalidade</th>
                  <th className="py-3 px-4">Esfera & Local</th>
                  <th className="py-3 px-4">Valor & Deságio</th>
                  <th className="py-3 px-4 bg-[#0A1A2F] text-[#D4AF37]">
                    Dados Sensíveis do Anunciante
                  </th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {anuncios.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          item.operacao === 'venda'
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {item.operacao}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {item.operacao === 'venda' ? item.tipo_credito : item.finalidade}
                      {item.situacao && (
                        <span className="block text-[10px] text-slate-500 font-normal">
                          Situação: {item.situacao}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700 capitalize">
                      {item.esfera} {item.uf ? `(${item.uf})` : ''}
                      {item.municipio && (
                        <span className="block text-[10px] text-slate-500">{item.municipio}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">
                        {formatarMoeda(item.valor_nominal)}
                      </span>
                      <span className="text-[#07132B] font-bold text-[11px]">
                        Deságio: {formatarPorcentagem(item.desagio_percentual)}
                      </span>
                    </td>

                    {/* COLUNA DE DADOS SENSÍVEIS (VISÍVEL APENAS AQUI NO ADMIN) */}
                    <td className="py-3 px-4 bg-amber-50/40 border-x border-amber-100 font-medium">
                      <div className="space-y-0.5">
                        <strong className="text-slate-900 block">
                          {item.contato_nome || 'Não informado'}
                        </strong>
                        {item.contato_documento && (
                          <span className="text-[11px] text-slate-600 block">
                            Doc: {item.contato_documento}
                          </span>
                        )}
                        {item.contato_email && (
                          <span className="text-[11px] text-slate-600 block">
                            E-mail: {item.contato_email}
                          </span>
                        )}
                        {item.contato_telefone && (
                          <span className="text-[11px] text-slate-600 block">
                            Tel: {item.contato_telefone}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <select
                        value={item.status}
                        onChange={(e) => handleAlterarStatusAnuncio(item.id, e.target.value as any)}
                        className="px-2 py-1 rounded border border-slate-200 text-xs font-semibold bg-white"
                      >
                        <option value="ativo">Ativo</option>
                        <option value="pausado">Pausado</option>
                        <option value="negociado">Negociado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {ehMasterOuAdmin && (
                        <button
                          type="button"
                          onClick={() => setAnuncioParaExcluir(item)}
                          className="text-red-600 hover:text-red-800 font-bold px-2.5 py-1.5 rounded-lg hover:bg-red-50 text-xs border border-transparent hover:border-red-200 transition-all"
                          title="Excluir este anúncio do Mercado de Créditos"
                        >
                          Excluir anúncio
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE RESPOSTA INTERNA AO PEDIDO */}
      {pedidoRespondendo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#07132B] border border-[#D4AF37]/40 shadow-2xl text-white p-6 sm:p-7">
            <div className="flex items-start justify-between pb-3 border-b border-white/10 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] block">
                  Resposta Administrativa
                </span>
                <h3 className="font-heading font-extrabold text-base sm:text-lg text-white">
                  Responder Pedido de Informação
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPedidoRespondendo(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-xs mb-4 space-y-1">
              <div>
                <span className="text-slate-400">Solicitante:</span>{' '}
                <strong>{pedidoRespondendo.solicitante_nome}</strong> (
                {pedidoRespondendo.solicitante_email})
              </div>
              <div>
                <span className="text-slate-400">Dúvida enviada:</span>{' '}
                <span className="italic">"{pedidoRespondendo.mensagem}"</span>
              </div>
            </div>

            <form onSubmit={handleResponder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Texto da Resposta Técnica / Instruções *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Escreva a resposta que será exibida para o usuário solicitante em seu painel..."
                  value={respostaTexto}
                  onChange={(e) => setRespostaTexto(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1A2F] border border-white/15 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setPedidoRespondendo(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] transition-all shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Gravando...' : 'Salvar Resposta & Notificar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO PARA EXCLUSÃO DE ANÚNCIO (PADRÃO DIAMOND GROUP) */}
      <ModalExcluirAnuncioCredito
        open={!!anuncioParaExcluir}
        onOpenChange={(aberto) => {
          if (!aberto) setAnuncioParaExcluir(null)
        }}
        anuncio={anuncioParaExcluir}
        onSucesso={(msg) => {
          onFeedback({ tipo: 'sucesso', mensagem: msg })
          setAnuncioParaExcluir(null)
          onAtualizar()
        }}
        onErro={(msg) => {
          onFeedback({ tipo: 'erro', mensagem: msg })
        }}
      />
    </div>
  )
}
