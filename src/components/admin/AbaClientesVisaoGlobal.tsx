import React, { useState, useEffect } from 'react'
import type { ClienteGlobalItem } from '@/types/master'
import { formatarMoeda } from '@/lib/calculadoraUtils'
import { ModalExcluirClienteGlobal } from '@/components/admin/ModalExcluirClienteGlobal'
import { FunilVendasKanban } from '@/components/admin/FunilVendasKanban'
import { listarResumoTarefasPendentes } from '@/services/crm'
import type { CrmTarefa, EstagioFunilCrm } from '@/types/crm'
import { useAuth } from '@/context/AuthContext'

interface AbaClientesVisaoGlobalProps {
  clientes: ClienteGlobalItem[]
  isLoading: boolean
  onSelecionarCliente: (cliente: ClienteGlobalItem) => void
  onAtualizar: () => void
  onFeedback?: (feedback: { tipo: 'sucesso' | 'erro'; mensagem: string } | null) => void
  onClienteAtualizado?: (
    clienteId: string,
    novoEstagio: EstagioFunilCrm,
    origem: 'clientes' | 'clientes_empresas',
  ) => void
}

export function AbaClientesVisaoGlobal({
  clientes,
  isLoading,
  onSelecionarCliente,
  onAtualizar,
  onFeedback,
  onClienteAtualizado,
}: AbaClientesVisaoGlobalProps) {
  const { user } = useAuth()
  const [subAba, setSubAba] = useState<'lista' | 'funil'>('lista')
  const [busca, setBusca] = useState('')
  const [filtroOrigem, setFiltroOrigem] = useState<'todos' | 'analista' | 'direto'>('todos')
  const [filtroSegmento, setFiltroSegmento] = useState('todos')
  const [filtroRegime, setFiltroRegime] = useState('todos')
  const [filtroEstagio, setFiltroEstagio] = useState<string>('todos')
  const [clienteParaExcluir, setClienteParaExcluir] = useState<ClienteGlobalItem | null>(null)

  // Resumo discreto de tarefas no topo
  const [resumoTarefas, setResumoTarefas] = useState<{
    totalPendentes: number
    totalVencidas: number
    tarefas: CrmTarefa[]
  }>({ totalPendentes: 0, totalVencidas: 0, tarefas: [] })
  const [exibirModalTarefasResumo, setExibirModalTarefasResumo] = useState(false)

  const carregarResumoTarefas = async () => {
    try {
      const res = await listarResumoTarefasPendentes(user?.id)
      setResumoTarefas(res)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    carregarResumoTarefas()
  }, [user?.id])

  const clientesFiltrados = clientes.filter((c) => {
    const termo = busca.toLowerCase().trim()
    const matchBusca =
      !termo ||
      c.nome?.toLowerCase().includes(termo) ||
      c.empresa?.toLowerCase().includes(termo) ||
      c.cnpj_cpf?.toLowerCase().includes(termo) ||
      c.email?.toLowerCase().includes(termo) ||
      c.analista_nome?.toLowerCase().includes(termo) ||
      c.analista_email?.toLowerCase().includes(termo) ||
      c.cidade?.toLowerCase().includes(termo)

    const matchOrigem =
      filtroOrigem === 'todos' ||
      (filtroOrigem === 'analista' && c.origem_tipo === 'analista') ||
      (filtroOrigem === 'direto' && c.origem_tipo === 'direto')

    const matchSegmento =
      filtroSegmento === 'todos' || c.segmento?.toLowerCase() === filtroSegmento.toLowerCase()

    const matchRegime =
      filtroRegime === 'todos' || c.regime_atual?.toLowerCase() === filtroRegime.toLowerCase()

    const matchEstagio = filtroEstagio === 'todos' || (c.estagio_funil || 'lead') === filtroEstagio

    return matchBusca && matchOrigem && matchSegmento && matchRegime && matchEstagio
  })

  // Métricas rápidas da visão global
  const totalGeral = clientes.length
  const totalAnalistas = clientes.filter((c) => c.origem_tipo === 'analista').length
  const totalDiretos = clientes.filter((c) => c.origem_tipo === 'direto').length
  const totalDiagnosticos = clientes.reduce((acc, c) => acc + c.total_diagnosticos, 0)
  const totalSimulacoes = clientes.reduce((acc, c) => acc + c.total_simulacoes, 0)

  return (
    <div className="space-y-6">
      {/* RESUMO DISCRETO DE TAREFAS PENDENTES DO USUÁRIO LOGADO NO TOPO */}
      <div className="bg-[#07132B] text-white p-3.5 rounded-2xl border border-[#D4AF37]/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
          <span className="text-xs text-slate-300">
            Você tem{' '}
            <strong className="text-[#D4AF37] font-bold">
              {resumoTarefas.totalPendentes}{' '}
              {resumoTarefas.totalPendentes === 1 ? 'tarefa pendente' : 'tarefas pendentes'}
            </strong>{' '}
            no CRM
            {resumoTarefas.totalVencidas > 0 ? (
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white">
                {resumoTarefas.totalVencidas} vencida(s)
              </span>
            ) : null}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {resumoTarefas.totalPendentes > 0 && (
            <button
              type="button"
              onClick={() => setExibirModalTarefasResumo(true)}
              className="px-3 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#07132B] text-xs font-bold transition-colors"
            >
              Ver Minhas Tarefas
            </button>
          )}
          <button
            type="button"
            onClick={carregarResumoTarefas}
            className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white font-medium transition-colors"
            title="Atualizar tarefas"
          >
            Atualizar
          </button>
        </div>
      </div>

      {/* CONTROLE DE SUB-ABAS: LISTA | FUNIL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubAba('lista')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-heading font-bold transition-all ${
              subAba === 'lista'
                ? 'bg-[#07132B] text-[#D4AF37] shadow-sm ring-1 ring-[#D4AF37]/50'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Visão em Lista
            <span
              className={`ml-2 text-xs px-2 py-0.5 rounded-full font-bold ${
                subAba === 'lista' ? 'bg-[#D4AF37] text-[#07132B]' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {clientes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubAba('funil')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-heading font-bold transition-all ${
              subAba === 'funil'
                ? 'bg-[#07132B] text-[#D4AF37] shadow-sm ring-1 ring-[#D4AF37]/50'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Funil de Vendas (Kanban)
            <span
              className={`ml-2 text-xs px-2 py-0.5 rounded-full font-bold ${
                subAba === 'funil' ? 'bg-[#D4AF37] text-[#07132B]' : 'bg-slate-100 text-slate-700'
              }`}
            >
              5 estágios
            </span>
          </button>
        </div>

        <div className="text-xs text-slate-500">
          {subAba === 'lista'
            ? 'Visualização tabular com busca global, filtros detalhados e histórico.'
            : 'Mova os clientes entre as etapas do funil comercial com drag & drop.'}
        </div>
      </div>

      {/* SE SUB-ABA FOR FUNIL, EXIBE O KANBAN */}
      {subAba === 'funil' && (
        <FunilVendasKanban
          clientes={clientes}
          onSelecionarCliente={onSelecionarCliente}
          onClienteAtualizado={(clienteId, novoEstagio, origem) => {
            if (onClienteAtualizado) {
              onClienteAtualizado(clienteId, novoEstagio, origem)
            }
          }}
          onFeedback={onFeedback}
        />
      )}

      {/* SE SUB-ABA FOR LISTA, EXIBE TABELA COMPLETA COM FILTROS */}
      {subAba === 'lista' && (
        <>
          {/* KPI CARDS - ESTILO DIAMOND (NAVY #07132B / OURO #D4AF37) SEM ÍCONES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-[#07132B] text-white p-5 rounded-2xl border border-[#D4AF37]/30 shadow-md">
              <span className="text-[11px] uppercase tracking-wider text-[#D4AF37] font-semibold block">
                Base Global
              </span>
              <p className="font-heading font-extrabold text-3xl text-white mt-1">{totalGeral}</p>
              <span className="text-[11px] text-slate-300 mt-1 block">Todos os clientes</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
                Via Analistas
              </span>
              <p className="font-heading font-extrabold text-3xl text-slate-900 mt-1">
                {totalAnalistas}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {totalGeral > 0
                  ? `${Math.round((totalAnalistas / totalGeral) * 100)}% da base`
                  : '0%'}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
                Cadastros Diretos
              </span>
              <p className="font-heading font-extrabold text-3xl text-slate-900 mt-1">
                {totalDiretos}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {totalGeral > 0
                  ? `${Math.round((totalDiretos / totalGeral) * 100)}% da base`
                  : '0%'}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
                Diagnósticos
              </span>
              <p className="font-heading font-extrabold text-3xl text-[#07132B] mt-1">
                {totalDiagnosticos}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">Laudos gerados</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
                Simulações
              </span>
              <p className="font-heading font-extrabold text-3xl text-[#D4AF37] mt-1">
                {totalSimulacoes}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">Cálculos IBS/CBS</span>
            </div>
          </div>

          {/* FILTROS E BUSCA */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="w-full lg:w-96">
              <input
                type="text"
                placeholder="Buscar por cliente, CNPJ, e-mail ou analista responsável..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium">Origem:</span>
                <select
                  value={filtroOrigem}
                  onChange={(e) => setFiltroOrigem(e.target.value as any)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white"
                >
                  <option value="todos">Todas as Origens</option>
                  <option value="analista">Via Analista / Carteira</option>
                  <option value="direto">Cadastro Direto no Site</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium">Segmento:</span>
                <select
                  value={filtroSegmento}
                  onChange={(e) => setFiltroSegmento(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white"
                >
                  <option value="todos">Todos os Segmentos</option>
                  <option value="Comércio">Comércio</option>
                  <option value="Serviços">Serviços</option>
                  <option value="Indústria">Indústria</option>
                  <option value="Saúde">Saúde</option>
                  <option value="Educação">Educação</option>
                  <option value="Agro">Agro</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Tecnologia">Tecnologia</option>
                  <option value="Construção Civil">Construção Civil</option>
                  <option value="Bares e Restaurantes">Bares e Restaurantes</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium">Regime:</span>
                <select
                  value={filtroRegime}
                  onChange={(e) => setFiltroRegime(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white"
                >
                  <option value="todos">Todos os Regimes</option>
                  <option value="Simples Nacional">Simples Nacional</option>
                  <option value="Lucro Presumido">Lucro Presumido</option>
                  <option value="Lucro Real">Lucro Real</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium">Estágio Funil:</span>
                <select
                  value={filtroEstagio}
                  onChange={(e) => setFiltroEstagio(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white"
                >
                  <option value="todos">Todos os Estágios</option>
                  <option value="lead">Lead</option>
                  <option value="diagnostico">Diagnóstico</option>
                  <option value="proposta">Proposta</option>
                  <option value="cliente_ativo">Cliente Ativo</option>
                  <option value="descartado">Descartado</option>
                </select>
              </div>

              <button
                type="button"
                onClick={onAtualizar}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                Atualizar
              </button>
            </div>
          </div>

          {/* TABELA DE CLIENTES COM ORIGEM */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                Carregando base global de clientes...
              </div>
            ) : clientesFiltrados.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <p className="font-semibold text-slate-700 text-base">Nenhum cliente encontrado</p>
                <p className="text-xs text-slate-500 mt-1">
                  Refine os termos da busca por analista, nome ou CNPJ.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#07132B] text-white font-semibold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-5">Cliente / Empresa</th>
                      <th className="py-3.5 px-5">Origem & Analista Responsável</th>
                      <th className="py-3.5 px-5">Estágio Funil (CRM)</th>
                      <th className="py-3.5 px-5">Segmento & UF</th>
                      <th className="py-3.5 px-5">Regime Atual</th>
                      <th className="py-3.5 px-5 text-center">Diagnósticos</th>
                      <th className="py-3.5 px-5 text-center">Simulações</th>
                      <th className="py-3.5 px-5 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {clientesFiltrados.map((item) => {
                      const estagio = item.estagio_funil || 'lead'
                      const estagioRotulo =
                        estagio === 'lead'
                          ? 'Lead'
                          : estagio === 'diagnostico'
                            ? 'Diagnóstico'
                            : estagio === 'proposta'
                              ? 'Proposta'
                              : estagio === 'cliente_ativo'
                                ? 'Cliente Ativo'
                                : 'Descartado'

                      return (
                        <tr
                          key={`${item.collection_origem}_${item.id}`}
                          onClick={() => onSelecionarCliente(item)}
                          className="hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <td className="py-4 px-5">
                            <div className="font-bold text-slate-900">
                              {item.nome || item.empresa}
                            </div>
                            <div className="text-xs font-mono text-slate-500">
                              CNPJ/CPF: {item.cnpj_cpf || 'Não informado'}
                            </div>
                            {item.email && (
                              <div className="text-xs text-slate-500 mt-0.5">{item.email}</div>
                            )}
                          </td>

                          <td className="py-4 px-5">
                            {item.origem_tipo === 'analista' ? (
                              <div>
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#07132B] text-[#D4AF37] border border-[#D4AF37]/40">
                                  Analista Parceiro
                                </span>
                                <div className="text-xs font-semibold text-slate-800 mt-1">
                                  {item.analista_nome}
                                </div>
                                {item.analista_email && (
                                  <div className="text-[11px] text-slate-500">
                                    {item.analista_email}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                                  Cadastro Direto no Site
                                </span>
                                <div className="text-xs text-slate-500 mt-1">
                                  Sem analista vinculado (Portal Direto)
                                </div>
                              </div>
                            )}
                          </td>

                          <td className="py-4 px-5">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                                estagio === 'cliente_ativo'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : estagio === 'proposta'
                                    ? 'bg-[#D4AF37]/20 text-[#07132B] border-[#D4AF37]'
                                    : estagio === 'diagnostico'
                                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                                      : estagio === 'descartado'
                                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                                        : 'bg-slate-100 text-slate-700 border-slate-300'
                              }`}
                            >
                              {estagioRotulo}
                            </span>
                          </td>

                          <td className="py-4 px-5">
                            <div className="text-xs font-semibold text-slate-800">
                              {item.segmento}
                            </div>
                            <div className="text-xs text-slate-500">
                              {item.cidade ? `${item.cidade} / ` : ''}
                              {item.uf}
                            </div>
                          </td>

                          <td className="py-4 px-5">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                item.regime_atual === 'Simples Nacional'
                                  ? 'bg-emerald-100 text-[#145A32]'
                                  : item.regime_atual === 'Lucro Presumido'
                                    ? 'bg-amber-100 text-amber-900'
                                    : 'bg-blue-100 text-blue-900'
                              }`}
                            >
                              {item.regime_atual}
                            </span>
                            {item.faturamento_mensal && item.faturamento_mensal > 0 && (
                              <div className="text-[11px] text-slate-500 mt-1">
                                Fat: {formatarMoeda(item.faturamento_mensal)}/mês
                              </div>
                            )}
                          </td>

                          <td className="py-4 px-5 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                item.total_diagnosticos > 0
                                  ? 'bg-[#07132B] text-white'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {item.total_diagnosticos}
                            </span>
                          </td>

                          <td className="py-4 px-5 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                item.total_simulacoes > 0
                                  ? 'bg-[#D4AF37]/20 text-[#07132B] border border-[#D4AF37]'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {item.total_simulacoes}
                            </span>
                          </td>

                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onSelecionarCliente(item)
                                }}
                                className="px-3 py-1.5 rounded-lg bg-[#07132B] hover:bg-[#07132B]/90 text-white text-xs font-semibold transition-colors"
                              >
                                Ver Detalhes
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setClienteParaExcluir(item)
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors"
                                title="Excluir cliente e dados vinculados"
                              >
                                Excluir Cliente
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* MODAL DISCRETO DE VISUALIZAÇÃO DAS MINHAS TAREFAS PENDENTES */}
      {exibirModalTarefasResumo && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <div>
                <h3 className="font-heading font-extrabold text-lg text-[#07132B]">
                  Minhas Tarefas Pendentes no CRM
                </h3>
                <span className="text-xs text-slate-500">
                  Total de {resumoTarefas.totalPendentes} tarefa(s) pendente(s)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setExibirModalTarefasResumo(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-2.5">
              {resumoTarefas.tarefas.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Nenhuma tarefa pendente atribuída a você no momento.
                </div>
              ) : (
                resumoTarefas.tarefas.map((t) => {
                  const hojeStr = new Date().toISOString().slice(0, 10)
                  const isVencida = !!t.prazo && t.prazo.slice(0, 10) < hojeStr
                  const prazoFmt = t.prazo
                    ? new Date(t.prazo).toLocaleDateString('pt-BR')
                    : 'Sem prazo'

                  return (
                    <div
                      key={t.id}
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                        isVencida ? 'bg-rose-50 border-rose-300' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{t.titulo}</span>
                        {isVencida ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white">
                            Vencida ({prazoFmt})
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">Prazo: {prazoFmt}</span>
                        )}
                      </div>
                      {t.descricao && <p className="text-slate-600">{t.descricao}</p>}
                    </div>
                  )
                })
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-150">
              <button
                type="button"
                onClick={() => setExibirModalTarefasResumo(false)}
                className="px-4 py-2 rounded-xl bg-[#07132B] text-white text-xs font-bold hover:bg-[#07132B]/90"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <ModalExcluirClienteGlobal
        open={!!clienteParaExcluir}
        onOpenChange={(open) => {
          if (!open) setClienteParaExcluir(null)
        }}
        cliente={clienteParaExcluir}
        onSucesso={(msg) => {
          setClienteParaExcluir(null)
          onAtualizar()
          if (onFeedback) {
            onFeedback({ tipo: 'sucesso', mensagem: msg })
          }
        }}
        onErro={(msg) => {
          if (onFeedback) {
            onFeedback({ tipo: 'erro', mensagem: msg })
          }
        }}
      />
    </div>
  )
}
