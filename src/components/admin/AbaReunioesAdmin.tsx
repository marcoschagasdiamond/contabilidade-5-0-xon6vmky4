import React, { useState, useEffect } from 'react'
import type { ReuniaoRecord, StatusReuniao } from '@/types/reunioes'
import {
  atualizarStatusReuniao,
  obterConfiguracaoAgenda,
  salvarConfiguracaoAgenda,
} from '@/services/reunioes'

interface AbaReunioesAdminProps {
  reunioes: ReuniaoRecord[]
  isLoading: boolean
  onAtualizar: () => void
  onFeedback: (feedback: { tipo: 'sucesso' | 'erro'; mensagem: string } | null) => void
}

const OPCOES_HORARIOS_DISPONIVEIS = [
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
]

const DIAS_SEMANA_OPCOES = [
  { id: 1, label: 'Segunda-feira' },
  { id: 2, label: 'Terça-feira' },
  { id: 3, label: 'Quarta-feira' },
  { id: 4, label: 'Quinta-feira' },
  { id: 5, label: 'Sexta-feira' },
  { id: 6, label: 'Sábado' },
]

export function AbaReunioesAdmin({
  reunioes,
  isLoading,
  onAtualizar,
  onFeedback,
}: AbaReunioesAdminProps) {
  // Filtros de reuniões
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [filtroData, setFiltroData] = useState<string>('')

  // Edição rápida de status
  const [reuniaoSelecionada, setReuniaoSelecionada] = useState<ReuniaoRecord | null>(null)
  const [novoStatus, setNovoStatus] = useState<StatusReuniao>('agendada')
  const [respostaEspecialista, setRespostaEspecialista] = useState('')
  const [canceladoMotivo, setCanceladoMotivo] = useState('')
  const [salvandoStatus, setSalvandoStatus] = useState(false)

  // Configuração da agenda do especialista
  const [modalConfigAberto, setModalConfigAberto] = useState(false)
  const [configAtivo, setConfigAtivo] = useState(true)
  const [diasSelecionados, setDiasSelecionados] = useState<number[]>([1, 2, 3, 4, 5])
  const [horariosSelecionados, setHorariosSelecionados] = useState<string[]>([
    '09:00',
    '10:00',
    '11:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
  ])
  const [duracaoMinutos, setDuracaoMinutos] = useState<number>(50)
  const [salvandoConfig, setSalvandoConfig] = useState(false)

  // Carregar configurações da agenda ao montar
  useEffect(() => {
    async function carregarConfig() {
      try {
        const conf = await obterConfiguracaoAgenda()
        if (conf) {
          setConfigAtivo(conf.ativo !== false)
          if (conf.dias_semana_json) {
            const parsed =
              typeof conf.dias_semana_json === 'string'
                ? JSON.parse(conf.dias_semana_json)
                : conf.dias_semana_json
            if (Array.isArray(parsed)) setDiasSelecionados(parsed)
          }
          if (conf.horarios_disponiveis_json) {
            const parsedH =
              typeof conf.horarios_disponiveis_json === 'string'
                ? JSON.parse(conf.horarios_disponiveis_json)
                : conf.horarios_disponiveis_json
            if (Array.isArray(parsedH)) setHorariosSelecionados(parsedH)
          }
          if (conf.duracao_minutos) {
            setDuracaoMinutos(conf.duracao_minutos)
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar configuracao agenda admin:', err)
      }
    }
    carregarConfig()
  }, [])

  // Filtragem
  const reunioesFiltradas = reunioes.filter((r) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      r.cliente_nome?.toLowerCase().includes(term) ||
      r.cliente_email?.toLowerCase().includes(term) ||
      r.empresa?.toLowerCase().includes(term) ||
      r.assunto?.toLowerCase().includes(term) ||
      r.horario?.includes(term) ||
      r.data?.includes(term)

    const matchesStatus = filtroStatus === 'todos' || r.status === filtroStatus
    const matchesData = !filtroData || r.data === filtroData

    return matchesSearch && matchesStatus && matchesData
  })

  // Estatísticas rápidas
  const totalAgendadas = reunioes.filter((r) => r.status === 'agendada').length
  const totalRealizadas = reunioes.filter((r) => r.status === 'realizada').length
  const totalCanceladas = reunioes.filter((r) => r.status === 'cancelada').length

  const abrirModalGerenciar = (r: ReuniaoRecord) => {
    setReuniaoSelecionada(r)
    setNovoStatus(r.status)
    setRespostaEspecialista(r.resposta_especialista || '')
    setCanceladoMotivo(r.cancelado_motivo || '')
  }

  const handleSalvarGerenciamento = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reuniaoSelecionada) return
    setSalvandoStatus(true)
    try {
      await atualizarStatusReuniao(reuniaoSelecionada.id, novoStatus, {
        respostaEspecialista: respostaEspecialista.trim(),
        canceladoMotivo: canceladoMotivo.trim(),
      })
      onFeedback({
        tipo: 'sucesso',
        mensagem: `Reunião de "${reuniaoSelecionada.cliente_nome}" atualizada para "${novoStatus}".`,
      })
      setReuniaoSelecionada(null)
      onAtualizar()
    } catch (err: any) {
      console.error('Erro ao atualizar reunião:', err)
      onFeedback({
        tipo: 'erro',
        mensagem: err?.message || 'Não foi possível atualizar o status da reunião.',
      })
    } finally {
      setSalvandoStatus(false)
    }
  }

  const handleSalvarConfigAgenda = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvandoConfig(true)
    try {
      await salvarConfiguracaoAgenda({
        diasSemana: diasSelecionados,
        horarios: horariosSelecionados,
        duracaoMinutos,
        ativo: configAtivo,
      })
      onFeedback({
        tipo: 'sucesso',
        mensagem: 'Configuração da agenda do especialista salva com sucesso.',
      })
      setModalConfigAberto(false)
    } catch (err: any) {
      console.error('Erro ao salvar configuração da agenda:', err)
      onFeedback({
        tipo: 'erro',
        mensagem: err?.message || 'Erro ao salvar configuração da agenda.',
      })
    } finally {
      setSalvandoConfig(false)
    }
  }

  const alternarDia = (id: number) => {
    setDiasSelecionados((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id].sort(),
    )
  }

  const alternarHorario = (h: string) => {
    setHorariosSelecionados((prev) =>
      prev.includes(h) ? prev.filter((item) => item !== h) : [...prev, h].sort(),
    )
  }

  return (
    <div className="space-y-6">
      {/* HEADER DA ABA + CARDS DE RESUMO (DIAMOND GROUP, SEM ÍCONES) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase block">
            Total de Reuniões
          </span>
          <p className="font-heading font-extrabold text-3xl text-slate-900 mt-1">
            {reunioes.length}
          </p>
          <span className="text-[11px] text-slate-500 font-medium">Marcadas no portal</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase block">
            Próximas Agendadas
          </span>
          <p className="font-heading font-extrabold text-3xl text-[#145A32] mt-1">
            {totalAgendadas}
          </p>
          <span className="text-[11px] text-emerald-700 font-medium">Aguardando atendimento</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase block">Realizadas</span>
          <p className="font-heading font-extrabold text-3xl text-blue-700 mt-1">
            {totalRealizadas}
          </p>
          <span className="text-[11px] text-blue-600 font-medium">Consultorias concluídas</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase block">
              Agenda do Especialista
            </span>
            <span
              className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                configAtivo ? 'bg-emerald-100 text-[#145A32]' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {configAtivo ? 'Ativa & Recebendo Reservas' : 'Pausada'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setModalConfigAberto(true)}
            className="mt-3 w-full py-2 px-3 rounded-xl font-heading font-bold text-xs bg-[#07132B] text-[#D4AF37] hover:brightness-110 transition-all text-center"
          >
            Configurar Janelas de Horário
          </button>
        </div>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder="Buscar por cliente, empresa, e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#07132B]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="todos">Todos os Status</option>
            <option value="agendada">Agendada</option>
            <option value="reagendada">Reagendada</option>
            <option value="realizada">Realizada</option>
            <option value="cancelada">Cancelada</option>
          </select>

          <input
            type="date"
            value={filtroData}
            onChange={(e) => setFiltroData(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
            title="Filtrar por data específica"
          />

          {filtroData && (
            <button
              type="button"
              onClick={() => setFiltroData('')}
              className="text-xs px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
            >
              Limpar Data
            </button>
          )}

          <button
            type="button"
            onClick={onAtualizar}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Atualizar
          </button>
        </div>
      </div>

      {/* TABELA DE REUNIÕES */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs sm:text-sm animate-pulse">
            Carregando reuniões cadastradas no backend...
          </div>
        ) : reunioesFiltradas.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs sm:text-sm">
            Nenhuma reunião encontrada com os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                  <th className="py-3 px-4">Data & Horário</th>
                  <th className="py-3 px-4">Cliente / Solicitante</th>
                  <th className="py-3 px-4">Empresa</th>
                  <th className="py-3 px-4">Pauta / Assunto</th>
                  <th className="py-3 px-4">Origem</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reunioesFiltradas.map((r) => {
                  const statusColors: Record<StatusReuniao, string> = {
                    agendada: 'bg-emerald-100 text-[#145A32]',
                    reagendada: 'bg-amber-100 text-amber-800',
                    realizada: 'bg-blue-100 text-blue-800',
                    cancelada: 'bg-rose-100 text-rose-800',
                  }

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <strong className="font-heading font-extrabold text-slate-900 block">
                          {r.horario}
                        </strong>
                        <span className="text-xs text-slate-500 block">{r.data}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <strong className="text-slate-900 block font-semibold">
                          {r.cliente_nome}
                        </strong>
                        <span className="text-xs text-slate-500 block">{r.cliente_email}</span>
                        {r.cliente_telefone && (
                          <span className="text-[11px] text-slate-400 block">
                            {r.cliente_telefone}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-800">{r.empresa || '—'}</td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="text-xs font-semibold text-slate-900 block line-clamp-1">
                          {r.assunto}
                        </span>
                        {r.observacao && (
                          <span className="text-[11px] text-slate-500 block line-clamp-1">
                            {r.observacao}
                          </span>
                        )}
                        {r.resposta_especialista && (
                          <span className="text-[11px] text-[#07132B] font-semibold block mt-0.5">
                            Retorno: {r.resposta_especialista}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-500 capitalize">
                        {r.origem_contexto || 'Portal'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                            statusColors[r.status] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => abrirModalGerenciar(r)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#07132B] text-[#D4AF37] hover:brightness-110 transition-all shadow-sm"
                        >
                          Gerenciar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE GERENCIAMENTO DE STATUS DA REUNIÃO */}
      {reuniaoSelecionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider block">
                  Gestão da Reunião
                </span>
                <h3 className="text-xl font-heading font-extrabold text-slate-900">
                  {reuniaoSelecionada.cliente_nome}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReuniaoSelecionada(null)}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Fechar
              </button>
            </div>

            <div className="text-xs p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <p>
                <strong>Data & Horário:</strong> {reuniaoSelecionada.data} às{' '}
                {reuniaoSelecionada.horario}
              </p>
              <p>
                <strong>Empresa:</strong> {reuniaoSelecionada.empresa || 'Não informada'}
              </p>
              <p>
                <strong>Assunto:</strong> {reuniaoSelecionada.assunto}
              </p>
              {reuniaoSelecionada.observacao && (
                <p>
                  <strong>Obs do cliente:</strong> {reuniaoSelecionada.observacao}
                </p>
              )}
            </div>

            <form onSubmit={handleSalvarGerenciamento} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Status da Reunião
                </label>
                <select
                  value={novoStatus}
                  onChange={(e) => setNovoStatus(e.target.value as StatusReuniao)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-800 bg-white"
                >
                  <option value="agendada">Agendada (Confirmada)</option>
                  <option value="reagendada">Reagendada</option>
                  <option value="realizada">Realizada (Concluída)</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Instruções / Resposta do Especialista para o Cliente
                </label>
                <textarea
                  rows={3}
                  value={respostaEspecialista}
                  onChange={(e) => setRespostaEspecialista(e.target.value)}
                  placeholder="Ex: Link do Google Meet enviado, documentos fiscais validados..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#07132B]"
                />
              </div>

              {novoStatus === 'cancelada' && (
                <div>
                  <label className="text-xs font-bold text-rose-700 block mb-1">
                    Motivo do Cancelamento
                  </label>
                  <input
                    type="text"
                    value={canceladoMotivo}
                    onChange={(e) => setCanceladoMotivo(e.target.value)}
                    placeholder="Descreva o motivo do cancelamento..."
                    className="w-full px-3 py-2 rounded-xl border border-rose-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReuniaoSelecionada(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoStatus}
                  className="px-5 py-2.5 rounded-xl text-xs font-heading font-bold bg-[#07132B] text-[#D4AF37] hover:brightness-110 shadow-md"
                >
                  {salvandoStatus ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIGURAÇÃO DA AGENDA DO ESCRITÓRIO */}
      {modalConfigAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider block">
                  Regras do Escritório
                </span>
                <h3 className="text-xl font-heading font-extrabold text-slate-900">
                  Configuração da Agenda Diamond
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalConfigAberto(false)}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleSalvarConfigAgenda} className="space-y-6">
              {/* STATUS ATIVO / INATIVO */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <strong className="text-sm font-heading font-extrabold text-slate-900 block">
                    Disponibilidade Geral da Agenda
                  </strong>
                  <span className="text-xs text-slate-500">
                    Se desativada, os clientes não poderão reservar novos horários.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setConfigAtivo(!configAtivo)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    configAtivo ? 'bg-[#145A32] text-white' : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {configAtivo ? 'Ativa' : 'Pausada'}
                </button>
              </div>

              {/* DIAS DA SEMANA HABILITADOS */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Dias da Semana Disponíveis para Agendamento
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DIAS_SEMANA_OPCOES.map((d) => {
                    const ativo = diasSelecionados.includes(d.id)
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => alternarDia(d.id)}
                        className={`p-2.5 rounded-xl text-xs font-bold border text-left transition-all ${
                          ativo
                            ? 'bg-[#07132B] text-[#D4AF37] border-[#D4AF37]'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {d.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* JANELAS DE HORÁRIOS */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Janelas de Horários Oferecidas
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {OPCOES_HORARIOS_DISPONIVEIS.map((h) => {
                    const ativo = horariosSelecionados.includes(h)
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => alternarHorario(h)}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all ${
                          ativo
                            ? 'bg-[#145A32] text-white border-[#2ECC71]'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {h}
                      </button>
                    )
                  })}
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Clique para marcar ou desmarcar os horários que o especialista atende.
                </p>
              </div>

              {/* DURAÇÃO */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Duração Estimada da Reunião (minutos)
                </label>
                <input
                  type="number"
                  min={15}
                  max={120}
                  value={duracaoMinutos}
                  onChange={(e) => setDuracaoMinutos(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalConfigAberto(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoConfig}
                  className="px-5 py-2.5 rounded-xl text-xs font-heading font-bold bg-[#07132B] text-[#D4AF37] hover:brightness-110 shadow-md"
                >
                  {salvandoConfig ? 'Salvando...' : 'Salvar Configuração'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
