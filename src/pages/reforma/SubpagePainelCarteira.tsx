import React, { useState } from 'react'
import {
  Kanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Calendar,
  Filter,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import { DiamondHeader, DiamondFooterCTA } from '@/components/reforma/DiamondLayout'
import {
  ETAPAS_CARTEIRA,
  CLIENTES_EXEMPLO_CARTEIRA,
  ROTINA_MENSAL_SEMANAS,
  ClienteAcompanhamento,
} from '@/data/reformaTributariaData'

export default function SubpagePainelCarteira() {
  const [clientes, setClientes] = useState<ClienteAcompanhamento[]>(CLIENTES_EXEMPLO_CARTEIRA)
  const [filtroFarol, setFiltroFarol] = useState<string>('todos')
  const [novoClienteModal, setNovoClienteModal] = useState(false)

  // Formulário simples de novo cliente para gestão local
  const [novoNome, setNovoNome] = useState('')
  const [novoSegmento, setNovoSegmento] = useState('Comércio')
  const [novoRegime, setNovoRegime] = useState('Simples Nacional')
  const [novoFarol, setNovoFarol] = useState<'verde' | 'amarelo' | 'vermelho'>('amarelo')
  const [novaEtapa, setNovaEtapa] = useState('diagnosticado')

  const handleAvancarEtapa = (clienteId: string) => {
    setClientes((prev) =>
      prev.map((c) => {
        if (c.id !== clienteId) return c
        const etapas = [
          'diagnosticado',
          'sistema_ajustado',
          'equipe_treinada',
          'cliente_comunicado',
          'operando',
        ]
        const idxAtual = etapas.indexOf(c.etapaAtual)
        if (idxAtual < etapas.length - 1) {
          const prox = etapas[idxAtual + 1]
          return {
            ...c,
            etapaAtual: prox,
            farol: prox === 'operando' ? 'verde' : c.farol,
          }
        }
        return c
      }),
    )
  }

  const handleAlterarFarol = (clienteId: string, farol: 'verde' | 'amarelo' | 'vermelho') => {
    setClientes((prev) => prev.map((c) => (c.id === clienteId ? { ...c, farol } : c)))
  }

  const handleAdicionarCliente = (e: React.FormEvent) => {
    e.preventDefault()
    if (!novoNome.trim()) return

    const novo: ClienteAcompanhamento = {
      id: String(Date.now()),
      nomeEmpresa: novoNome,
      cnpj: '00.000.000/0001-00',
      segmento: novoSegmento,
      regime: novoRegime,
      etapaAtual: novaEtapa,
      farol: novoFarol,
      responsavel: 'Equipe Fiscal',
      proximaAcao: 'Mapeamento de sistemas e cálculo de impacto',
      prazo: '30 dias',
    }

    setClientes((prev) => [novo, ...prev])
    setNovoNome('')
    setNovoClienteModal(false)
  }

  const clientesFiltrados =
    filtroFarol === 'todos' ? clientes : clientes.filter((c) => c.farol === filtroFarol)

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <DiamondHeader
        badge="MÓDULO 8 • GESTÃO DA CARTEIRA"
        titulo="Painel de Controle da Carteira"
        subtitulo="Esteira contábil com as 5 etapas de acompanhamento do cliente, faróis de prioridade de risco e rotina mensal estruturada por semanas."
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* AS 5 ETAPAS DA ESTEIRA */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-10">
          <div className="flex items-center gap-2 text-xs font-bold text-[#07132B] uppercase tracking-wider mb-2">
            <Kanban className="w-4 h-4 text-[#D4AF37]" />
            Esteira de Adequação do Cliente
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-black text-[#07132B] mb-2">
            As 5 Etapas de Acompanhamento
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mb-6">
            Todo cliente da carteira passa por estas 5 fases até operar de forma autônoma e segura
            no novo modelo tributário:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {ETAPAS_CARTEIRA.map((etapa) => (
              <div
                key={etapa.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between"
              >
                <div>
                  <span className="w-6 h-6 rounded-full bg-[#07132B] text-[#D4AF37] font-bold text-xs flex items-center justify-center mb-2">
                    {etapa.numero}
                  </span>
                  <h3 className="font-heading font-bold text-sm text-[#07132B] mb-1">
                    {etapa.nome}
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                    {etapa.descricao}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-200/80 text-[10px] text-slate-700 font-semibold">
                  <strong>Ação:</strong> {etapa.acaoChave}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TABELA DE GESTÃO DA CARTEIRA COM FARÓIS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 mb-6">
            <div>
              <h3 className="text-xl font-heading font-black text-[#07132B]">
                Clientes em Acompanhamento ({clientesFiltrados.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Farol Vermelho = risco alto | Amarelo = travado no meio | Verde = em dia
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* FILTRO FAROL */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFiltroFarol('todos')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    filtroFarol === 'todos' ? 'bg-white shadow text-[#07132B]' : 'text-slate-600'
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroFarol('vermelho')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    filtroFarol === 'vermelho' ? 'bg-rose-600 text-white shadow' : 'text-rose-700'
                  }`}
                >
                  Vermelho
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroFarol('amarelo')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    filtroFarol === 'amarelo' ? 'bg-amber-500 text-white shadow' : 'text-amber-700'
                  }`}
                >
                  Amarelo
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroFarol('verde')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    filtroFarol === 'verde'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-emerald-700'
                  }`}
                >
                  Verde
                </button>
              </div>

              <button
                type="button"
                onClick={() => setNovoClienteModal(!novoClienteModal)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#07132B] hover:bg-[#1A365D] transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                Adicionar Cliente
              </button>
            </div>
          </div>

          {/* FORMULÁRIO DE ADIÇÃO RÁPIDA (COLLAPSIBLE) */}
          {novoClienteModal && (
            <form
              onSubmit={handleAdicionarCliente}
              className="p-5 rounded-xl bg-slate-50 border border-slate-200 mb-6 grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs"
            >
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Razão Social / Nome:</label>
                <input
                  type="text"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Ex: Comercial Silva Ltda"
                  required
                  className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Setor:</label>
                <select
                  value={novoSegmento}
                  onChange={(e) => setNovoSegmento(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                >
                  <option value="Comércio">Comércio</option>
                  <option value="Serviços">Serviços</option>
                  <option value="Indústria">Indústria</option>
                  <option value="Saúde">Saúde</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Tecnologia">Tecnologia</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Farol de Risco:</label>
                <select
                  value={novoFarol}
                  onChange={(e) => setNovoFarol(e.target.value as any)}
                  className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                >
                  <option value="vermelho">Vermelho (Alto)</option>
                  <option value="amarelo">Amarelo (Médio)</option>
                  <option value="verde">Verde (Em dia)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg font-bold text-xs bg-[#07132B] text-[#D4AF37] hover:bg-[#1A365D]"
                >
                  Salvar
                </button>
              </div>
            </form>
          )}

          {/* TABELA DE CLIENTES */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-3">Farol</th>
                  <th className="py-3 px-3">Cliente / CNPJ</th>
                  <th className="py-3 px-3">Setor & Regime</th>
                  <th className="py-3 px-3">Etapa Atual</th>
                  <th className="py-3 px-3">Próxima Ação & Prazo</th>
                  <th className="py-3 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientesFiltrados.map((cli) => {
                  const etapaObj = ETAPAS_CARTEIRA.find((e) => e.id === cli.etapaAtual)
                  return (
                    <tr key={cli.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* FAROL SELETOR */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            title="Mudar farol"
                            onClick={() =>
                              handleAlterarFarol(
                                cli.id,
                                cli.farol === 'vermelho'
                                  ? 'amarelo'
                                  : cli.farol === 'amarelo'
                                    ? 'verde'
                                    : 'vermelho',
                              )
                            }
                            className={`w-3.5 h-3.5 rounded-full cursor-pointer transition-transform hover:scale-125 ${
                              cli.farol === 'vermelho'
                                ? 'bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.6)]'
                                : cli.farol === 'amarelo'
                                  ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                                  : 'bg-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                            }`}
                          />
                          <span className="capitalize font-bold text-[10px] text-slate-600">
                            {cli.farol}
                          </span>
                        </div>
                      </td>

                      {/* CLIENTE */}
                      <td className="py-3.5 px-3">
                        <strong className="text-slate-900 block font-semibold text-xs">
                          {cli.nomeEmpresa}
                        </strong>
                        <span className="text-[10px] text-slate-400">{cli.cnpj}</span>
                      </td>

                      {/* SETOR */}
                      <td className="py-3.5 px-3">
                        <span className="text-slate-800 font-medium block">{cli.segmento}</span>
                        <span className="text-[10px] text-slate-500">{cli.regime}</span>
                      </td>

                      {/* ETAPA */}
                      <td className="py-3.5 px-3">
                        <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/30">
                          {etapaObj?.numero}. {etapaObj?.nome}
                        </span>
                      </td>

                      {/* PRÓXIMA AÇÃO */}
                      <td className="py-3.5 px-3 max-w-xs">
                        <span className="text-slate-700 block truncate" title={cli.proximaAcao}>
                          {cli.proximaAcao}
                        </span>
                        <span className="text-[10px] font-bold text-amber-800">
                          Prazo: {cli.prazo}
                        </span>
                      </td>

                      {/* BOTÃO AVANÇAR */}
                      <td className="py-3.5 px-3 text-right">
                        {cli.etapaAtual !== 'operando' ? (
                          <button
                            type="button"
                            onClick={() => handleAvancarEtapa(cli.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#07132B] hover:text-[#D4AF37] bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            Avançar
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Operando
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ROTINA MENSAL POR SEMANAS */}
        <div className="bg-[#07132B] text-white rounded-2xl p-6 sm:p-8 border border-[#D4AF37]/30 shadow-xl mb-12">
          <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-2">
            <Calendar className="w-4 h-4" />
            Metodologia Operacional Contínua
          </div>
          <h3 className="text-xl font-heading font-black text-white mb-2">
            Rotina Mensal da Reforma Dividida por Semanas
          </h3>
          <p className="text-xs text-slate-300 mb-6">
            Como os escritórios de alta performance organizam as competências mensais de IBS e CBS:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ROTINA_MENSAL_SEMANAS.map((sem) => (
              <div key={sem.semana} className="p-4 rounded-xl bg-white/5 border border-white/10">
                <span className="text-xs font-bold text-[#D4AF37] uppercase">{sem.semana}</span>
                <h4 className="font-heading font-bold text-sm text-white mt-1 mb-3">{sem.foco}</h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  {sem.tarefas.map((tar, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-[#D4AF37] font-bold">•</span>
                      <span className="leading-snug">{tar}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DiamondFooterCTA />
    </div>
  )
}
