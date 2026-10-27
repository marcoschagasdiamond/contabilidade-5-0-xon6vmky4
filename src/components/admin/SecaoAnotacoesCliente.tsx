import React, { useState, useEffect } from 'react'
import type { CrmAnotacao } from '@/types/crm'
import { listarAnotacoesCliente, criarAnotacaoCliente, excluirAnotacao } from '@/services/crm'
import { useAuth } from '@/context/AuthContext'

interface SecaoAnotacoesClienteProps {
  clienteId: string
  collectionOrigem?: 'clientes' | 'clientes_empresas'
  onFeedback?: (feedback: { tipo: 'sucesso' | 'erro'; mensagem: string } | null) => void
}

export function SecaoAnotacoesCliente({
  clienteId,
  collectionOrigem = 'clientes',
  onFeedback,
}: SecaoAnotacoesClienteProps) {
  const { user, isMaster, isAdmin } = useAuth()
  const [anotacoes, setAnotacoes] = useState<CrmAnotacao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [novoTexto, setNovoTexto] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [excluindoId, setExcluindoId] = useState<string | null>(null)

  const carregar = async () => {
    if (!clienteId) return
    setCarregando(true)
    try {
      const lista = await listarAnotacoesCliente({ clienteId, collectionOrigem })
      setAnotacoes(lista)
    } catch (err) {
      console.error('Erro ao carregar anotações:', err)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [clienteId, collectionOrigem])

  const handleAdicionar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!novoTexto.trim() || salvando) return

    setSalvando(true)
    try {
      const criada = await criarAnotacaoCliente({
        clienteId,
        collectionOrigem,
        texto: novoTexto.trim(),
      })
      setAnotacoes((prev) => [criada, ...prev])
      setNovoTexto('')
      if (onFeedback) {
        onFeedback({ tipo: 'sucesso', mensagem: 'Anotação registrada com sucesso.' })
      }
    } catch (err) {
      console.error('Erro ao salvar anotação:', err)
      if (onFeedback) {
        onFeedback({
          tipo: 'erro',
          mensagem: 'Não foi possível salvar a anotação. Verifique os dados e permissões.',
        })
      }
    } finally {
      setSalvando(false)
    }
  }

  const handleExcluir = async (anotacao: CrmAnotacao) => {
    const podeExcluir = isMaster || isAdmin || anotacao.autor === user?.id
    if (!podeExcluir) {
      if (onFeedback) {
        onFeedback({
          tipo: 'erro',
          mensagem: 'Você só pode excluir anotações criadas por você.',
        })
      }
      return
    }

    setExcluindoId(anotacao.id)
    try {
      await excluirAnotacao(anotacao.id)
      setAnotacoes((prev) => prev.filter((a) => a.id !== anotacao.id))
      if (onFeedback) {
        onFeedback({ tipo: 'sucesso', mensagem: 'Anotação excluída com sucesso.' })
      }
    } catch (err) {
      console.error('Erro ao excluir anotação:', err)
      if (onFeedback) {
        onFeedback({
          tipo: 'erro',
          mensagem: 'Não foi possível excluir a anotação.',
        })
      }
    } finally {
      setExcluindoId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-150 pb-2">
        <div>
          <h4 className="font-heading font-bold text-sm text-[#07132B]">
            Anotações & Histórico de Interações
          </h4>
          <span className="text-[11px] text-slate-500">
            Registro cronológico de conversas, negociações e alinhamentos deste cliente
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#07132B] text-[#D4AF37]">
          {anotacoes.length} {anotacoes.length === 1 ? 'anotação' : 'anotações'}
        </span>
      </div>

      {/* FORMULÁRIO PARA NOVA ANOTAÇÃO */}
      <form onSubmit={handleAdicionar} className="space-y-2">
        <textarea
          rows={3}
          value={novoTexto}
          onChange={(e) => setNovoTexto(e.target.value)}
          placeholder="Escreva uma nova anotação sobre o cliente (ex.: contato via WhatsApp, proposta enviada, data de reunião)..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 resize-y"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!novoTexto.trim() || salvando}
            className="px-4 py-2 rounded-xl bg-[#07132B] hover:bg-[#07132B]/90 text-white text-xs font-bold transition-colors disabled:opacity-50"
          >
            {salvando ? 'Salvando...' : 'Adicionar Anotação'}
          </button>
        </div>
      </form>

      {/* LISTA CRONOLÓGICA DE ANOTAÇÕES */}
      <div className="space-y-3 pt-2">
        {carregando ? (
          <div className="p-6 text-center text-xs text-slate-400">Carregando anotações...</div>
        ) : anotacoes.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500">
            Nenhuma anotação registrada ainda para este cliente. Utilize o campo acima para
            adicionar a primeira.
          </div>
        ) : (
          anotacoes.map((item) => {
            const podeExcluir = isMaster || isAdmin || item.autor === user?.id
            const dataFmt = item.created
              ? new Date(item.created).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Data não informada'

            return (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{item.autor_nome || 'Usuário'}</span>
                    <span className="text-[10px] text-slate-400">• {dataFmt}</span>
                  </div>

                  {podeExcluir && (
                    <button
                      type="button"
                      disabled={excluindoId === item.id}
                      onClick={() => handleExcluir(item)}
                      className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold transition-colors disabled:opacity-50"
                      title="Excluir esta anotação"
                    >
                      {excluindoId === item.id ? 'Excluindo...' : 'Excluir'}
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {item.texto}
                </p>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
