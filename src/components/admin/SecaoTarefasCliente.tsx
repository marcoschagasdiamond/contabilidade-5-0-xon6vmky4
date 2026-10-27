import React, { useState, useEffect } from 'react'
import type { CrmTarefa, StatusTarefaCrm } from '@/types/crm'
import type { UsuarioSistema } from '@/types/master'
import {
  listarTarefasCliente,
  criarTarefaCliente,
  atualizarStatusTarefa,
  excluirTarefa,
} from '@/services/crm'
import { listarTodosUsuarios } from '@/services/master'
import { useAuth } from '@/context/AuthContext'

interface SecaoTarefasClienteProps {
  clienteId: string
  collectionOrigem?: 'clientes' | 'clientes_empresas'
  onFeedback?: (feedback: { tipo: 'sucesso' | 'erro'; mensagem: string } | null) => void
  onTarefasAlteradas?: () => void
}

export function SecaoTarefasCliente({
  clienteId,
  collectionOrigem = 'clientes',
  onFeedback,
  onTarefasAlteradas,
}: SecaoTarefasClienteProps) {
  const { user, isMaster, isAdmin } = useAuth()
  const [tarefas, setTarefas] = useState<CrmTarefa[]>([])
  const [carregando, setCarregando] = useState(true)
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([])

  // Formulário de criação
  const [exibirForm, setExibirForm] = useState(false)
  const [novoTitulo, setNovoTitulo] = useState('')
  const [novaDescricao, setNovaDescricao] = useState('')
  const [novoPrazo, setNovoPrazo] = useState('')
  const [novoResponsavel, setNovoResponsavel] = useState(user?.id || '')
  const [salvando, setSalvando] = useState(false)
  const [acaoId, setAcaoId] = useState<string | null>(null)

  const hojeStr = new Date().toISOString().slice(0, 10)

  const carregarTarefas = async () => {
    if (!clienteId) return
    setCarregando(true)
    try {
      const lista = await listarTarefasCliente({ clienteId, collectionOrigem })
      setTarefas(lista)
    } catch (err) {
      console.error('Erro ao carregar tarefas:', err)
    } finally {
      setCarregando(false)
    }
  }

  const carregarUsuarios = async () => {
    try {
      const uList = await listarTodosUsuarios()
      setUsuarios(uList)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    carregarTarefas()
    carregarUsuarios()
  }, [clienteId, collectionOrigem])

  const handleCriarTarefa = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!novoTitulo.trim() || salvando) return

    setSalvando(true)
    try {
      const criada = await criarTarefaCliente({
        clienteId,
        collectionOrigem,
        titulo: novoTitulo.trim(),
        descricao: novaDescricao.trim(),
        prazo: novoPrazo || undefined,
        responsavelId: novoResponsavel || user?.id,
      })

      setTarefas((prev) => [criada, ...prev])
      setNovoTitulo('')
      setNovaDescricao('')
      setNovoPrazo('')
      setExibirForm(false)

      if (onFeedback) {
        onFeedback({ tipo: 'sucesso', mensagem: 'Tarefa cadastrada com sucesso.' })
      }
      if (onTarefasAlteradas) {
        onTarefasAlteradas()
      }
    } catch (err) {
      console.error('Erro ao criar tarefa:', err)
      if (onFeedback) {
        onFeedback({
          tipo: 'erro',
          mensagem: 'Não foi possível criar a tarefa. Verifique os dados.',
        })
      }
    } finally {
      setSalvando(false)
    }
  }

  const handleAlternarStatus = async (tarefa: CrmTarefa, novoStatus: StatusTarefaCrm) => {
    setAcaoId(tarefa.id)
    try {
      await atualizarStatusTarefa(tarefa.id, novoStatus)
      setTarefas((prev) => prev.map((t) => (t.id === tarefa.id ? { ...t, status: novoStatus } : t)))
      if (onFeedback) {
        const msg =
          novoStatus === 'concluida'
            ? 'Tarefa marcada como concluída.'
            : novoStatus === 'cancelada'
              ? 'Tarefa cancelada.'
              : 'Tarefa reaberta como pendente.'
        onFeedback({ tipo: 'sucesso', mensagem: msg })
      }
      if (onTarefasAlteradas) {
        onTarefasAlteradas()
      }
    } catch (err) {
      console.error('Erro ao atualizar status da tarefa:', err)
      if (onFeedback) {
        onFeedback({
          tipo: 'erro',
          mensagem: 'Não foi possível alterar o status da tarefa.',
        })
      }
    } finally {
      setAcaoId(null)
    }
  }

  const handleExcluirTarefa = async (tarefaId: string) => {
    setAcaoId(tarefaId)
    try {
      await excluirTarefa(tarefaId)
      setTarefas((prev) => prev.filter((t) => t.id !== tarefaId))
      if (onFeedback) {
        onFeedback({ tipo: 'sucesso', mensagem: 'Tarefa excluída com sucesso.' })
      }
      if (onTarefasAlteradas) {
        onTarefasAlteradas()
      }
    } catch (err) {
      console.error('Erro ao excluir tarefa:', err)
      if (onFeedback) {
        onFeedback({
          tipo: 'erro',
          mensagem: 'Não foi possível excluir a tarefa.',
        })
      }
    } finally {
      setAcaoId(null)
    }
  }

  const pendentes = tarefas.filter((t) => t.status === 'pendente')
  const concluidas = tarefas.filter((t) => t.status === 'concluida')

  return (
    <div className="space-y-4">
      {/* CABEÇALHO */}
      <div className="flex items-center justify-between border-b border-slate-150 pb-2">
        <div>
          <h4 className="font-heading font-bold text-sm text-[#07132B]">Tarefas & Compromissos</h4>
          <span className="text-[11px] text-slate-500">
            Acompanhamento de prazos, reuniões e pendências comerciais e operacionais
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#07132B] text-[#D4AF37]">
            {pendentes.length} {pendentes.length === 1 ? 'pendente' : 'pendentes'}
          </span>
          <button
            type="button"
            onClick={() => setExibirForm(!exibirForm)}
            className="px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#07132B] font-bold text-xs transition-colors"
          >
            {exibirForm ? 'Fechar Formulário' : 'Nova Tarefa'}
          </button>
        </div>
      </div>

      {/* FORMULÁRIO COLAPSÁVEL DE NOVA TAREFA */}
      {exibirForm && (
        <form
          onSubmit={handleCriarTarefa}
          className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
        >
          <div className="font-bold text-xs text-[#07132B]">Cadastrar Nova Tarefa</div>
          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
              Título da Tarefa *
            </label>
            <input
              type="text"
              required
              value={novoTitulo}
              onChange={(e) => setNovoTitulo(e.target.value)}
              placeholder="Ex.: Ligar para apresentar proposta de BPO, Enviar laudo revisado..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 bg-white"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
              Descrição / Observações (opcional)
            </label>
            <textarea
              rows={2}
              value={novaDescricao}
              onChange={(e) => setNovaDescricao(e.target.value)}
              placeholder="Detalhes adicionais, pauta da reunião ou instruções para o responsável..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 bg-white resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Prazo Limite
              </label>
              <input
                type="date"
                value={novoPrazo}
                onChange={(e) => setNovoPrazo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Responsável
              </label>
              <select
                value={novoResponsavel}
                onChange={(e) => setNovoResponsavel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 bg-white"
              >
                <option value={user?.id || ''}>
                  {user?.name || user?.email || 'Eu mesmo (usuário logado)'}
                </option>
                {usuarios
                  .filter((u) => u.id !== user?.id)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email} ({u.nivel_acesso})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setExibirForm(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!novoTitulo.trim() || salvando}
              className="px-4 py-1.5 rounded-lg bg-[#07132B] hover:bg-[#07132B]/90 text-white text-xs font-bold transition-colors disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Salvar Tarefa'}
            </button>
          </div>
        </form>
      )}

      {/* LISTAGEM DE TAREFAS */}
      <div className="space-y-3">
        {carregando ? (
          <div className="p-6 text-center text-xs text-slate-400">Carregando tarefas...</div>
        ) : tarefas.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500">
            Nenhuma tarefa cadastrada para este cliente. Clique em &quot;Nova Tarefa&quot; acima
            para registrar um compromisso.
          </div>
        ) : (
          tarefas.map((tarefa) => {
            const isVencida =
              tarefa.status === 'pendente' && !!tarefa.prazo && tarefa.prazo.slice(0, 10) < hojeStr

            const isProcessando = acaoId === tarefa.id
            const prazoFmt = tarefa.prazo
              ? new Date(tarefa.prazo).toLocaleDateString('pt-BR')
              : 'Sem prazo'

            return (
              <div
                key={tarefa.id}
                className={`p-3.5 rounded-xl border transition-all shadow-2xs ${
                  tarefa.status === 'concluida'
                    ? 'bg-slate-50/80 border-slate-200 opacity-80'
                    : isVencida
                      ? 'bg-rose-50/50 border-rose-300 ring-1 ring-rose-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xs font-bold ${
                          tarefa.status === 'concluida'
                            ? 'line-through text-slate-500'
                            : isVencida
                              ? 'text-rose-900'
                              : 'text-slate-900'
                        }`}
                      >
                        {tarefa.titulo}
                      </span>

                      {/* BADGE DE STATUS */}
                      {tarefa.status === 'concluida' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Concluída
                        </span>
                      ) : tarefa.status === 'cancelada' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                          Cancelada
                        </span>
                      ) : isVencida ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                          Atenção: Vencida ({prazoFmt})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                          Pendente
                        </span>
                      )}
                    </div>

                    {tarefa.descricao && (
                      <p className="text-xs text-slate-600 whitespace-pre-wrap">
                        {tarefa.descricao}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                      <span>
                        Prazo:{' '}
                        <strong
                          className={isVencida ? 'text-rose-700 font-bold' : 'text-slate-700'}
                        >
                          {prazoFmt}
                        </strong>
                      </span>
                      <span>
                        Responsável:{' '}
                        <strong className="text-slate-700">
                          {tarefa.responsavel_nome || 'Não definido'}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* AÇÕES DA TAREFA */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 pt-2 sm:pt-0">
                    {tarefa.status === 'pendente' && (
                      <button
                        type="button"
                        disabled={isProcessando}
                        onClick={() => handleAlternarStatus(tarefa, 'concluida')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors disabled:opacity-50"
                      >
                        Concluir
                      </button>
                    )}

                    {tarefa.status === 'concluida' && (
                      <button
                        type="button"
                        disabled={isProcessando}
                        onClick={() => handleAlternarStatus(tarefa, 'pendente')}
                        className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-semibold transition-colors disabled:opacity-50"
                      >
                        Reabrir
                      </button>
                    )}

                    {tarefa.status === 'pendente' && (
                      <button
                        type="button"
                        disabled={isProcessando}
                        onClick={() => handleAlternarStatus(tarefa, 'cancelada')}
                        className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-[11px] font-semibold transition-colors disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    )}

                    {(isMaster || isAdmin || tarefa.autor === user?.id) && (
                      <button
                        type="button"
                        disabled={isProcessando}
                        onClick={() => handleExcluirTarefa(tarefa.id)}
                        className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold transition-colors disabled:opacity-50"
                        title="Excluir tarefa"
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
