import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useDadosEmpresa } from '@/context/DadosEmpresaContext'
import pb from '@/lib/pocketbase/client'
import {
  consultarDisponibilidadeDia,
  criarAgendamentoReuniao,
  listarMinhasReunioes,
  cancelarReuniao,
} from '@/services/reunioes'
import type { ReuniaoRecord, DisponibilidadeAgendaDia } from '@/types/reunioes'

const NOMES_DIAS = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
]

const NOMES_MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

function formatarDataIso(data: Date): string {
  const y = data.getFullYear()
  const m = String(data.getMonth() + 1).padStart(2, '0')
  const d = String(data.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseDataIso(iso?: string | null): Date | null {
  if (!iso || typeof iso !== 'string') return null
  const partes = iso.split('-').map(Number)
  if (partes.length < 3 || partes.some(isNaN)) return null
  const [y, m, d] = partes
  const data = new Date(y, m - 1, d)
  return isNaN(data.getTime()) ? null : data
}

interface AgendamentoReuniaoProps {
  onVoltar?: () => void
  embedded?: boolean
}

export default function AgendamentoReuniao({
  onVoltar,
  embedded = false,
}: AgendamentoReuniaoProps = {}) {
  const { user, isAuthenticated } = useAuth()
  const { dadosEmpresa } = useDadosEmpresa()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const assuntoParam = searchParams.get('assunto') || ''
  const origemParam = searchParams.get('origem') || 'portal_cliente'

  // Lista de 14 dias futuros úteis
  const diasSugeridos = useMemo(() => {
    const lista: { dataIso: string; labelDia: string; labelSemana: string; diaSemana: number }[] =
      []
    const hoje = new Date()

    let count = 0
    let offset = 1 // começa a partir de amanhã
    while (count < 14) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + offset)
      const diaSemana = d.getDay()
      // Ignora domingo (0) e sábado (6) por padrão
      if (diaSemana !== 0 && diaSemana !== 6) {
        lista.push({
          dataIso: formatarDataIso(d),
          labelDia: `${d.getDate()} de ${NOMES_MESES[d.getMonth()].slice(0, 3)}`,
          labelSemana: NOMES_DIAS[diaSemana],
          diaSemana,
        })
        count++
      }
      offset++
    }
    return lista
  }, [])

  const [dataSelecionada, setDataSelecionada] = useState<string>(
    diasSugeridos[0]?.dataIso || formatarDataIso(new Date()),
  )
  const [horarioSelecionado, setHorarioSelecionado] = useState<string>('')
  const [disponibilidade, setDisponibilidade] = useState<DisponibilidadeAgendaDia | null>(null)
  const [carregandoDisponibilidade, setCarregandoDisponibilidade] = useState(false)

  // Formulário
  const [nome, setNome] = useState(user?.name || dadosEmpresa?.nomeContato || '')
  const [email, setEmail] = useState(user?.email || dadosEmpresa?.email || '')
  const [telefone, setTelefone] = useState(dadosEmpresa?.telefone || '')
  const [empresa, setEmpresa] = useState(dadosEmpresa?.nomeEmpresa || '')
  const [assunto, setAssunto] = useState(
    assuntoParam || 'Apresentação de Parecer Tributário & Alinhamento Estratégico',
  )
  const [observacao, setObservacao] = useState('')

  // Estados de envio
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reuniaoCriada, setReuniaoCriada] = useState<ReuniaoRecord | null>(null)
  const [erroAgendamento, setErroAgendamento] = useState<string | null>(null)

  // Minhas reuniões anteriores
  const [minhasReunioes, setMinhasReunioes] = useState<ReuniaoRecord[]>([])
  const [carregandoReunioes, setCarregandoReunioes] = useState(false)
  const [cancelandoId, setCancelandoId] = useState<string | null>(null)
  const [feedbackCancelamento, setFeedbackCancelamento] = useState<string | null>(null)

  // Atualiza disponibilidade ao trocar a data
  useEffect(() => {
    let cancel = false

    async function carregarSlots() {
      if (!dataSelecionada) return
      setCarregandoDisponibilidade(true)
      setHorarioSelecionado('')
      try {
        const resp = await consultarDisponibilidadeDia(dataSelecionada)
        if (!cancel) {
          setDisponibilidade(resp)
        }
      } catch (err) {
        console.error('Erro ao consultar disponibilidade:', err)
      } finally {
        if (!cancel) {
          setCarregandoDisponibilidade(false)
        }
      }
    }

    carregarSlots()
    return () => {
      cancel = true
    }
  }, [dataSelecionada])

  // Carregar histórico de reuniões do usuário
  const fetchMinhasReunioes = async () => {
    if (!isAuthenticated) return
    setCarregandoReunioes(true)
    try {
      const records = await listarMinhasReunioes()
      setMinhasReunioes(records)
    } catch (err) {
      console.warn('Erro ao listar reuniões do usuário:', err)
    } finally {
      setCarregandoReunioes(false)
    }
  }

  useEffect(() => {
    fetchMinhasReunioes()
  }, [isAuthenticated])

  // Submissão do agendamento
  const handleAgendar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErroAgendamento(null)

    if (!isAuthenticated) {
      navigate('/login?redirect=/agendamento')
      return
    }

    if (!dataSelecionada || !horarioSelecionado) {
      setErroAgendamento('Por favor, selecione uma data e um horário disponível.')
      return
    }

    if (!nome.trim() || !email.trim() || !assunto.trim()) {
      setErroAgendamento('Por favor, preencha os campos obrigatórios (nome, e-mail e assunto).')
      return
    }

    setIsSubmitting(true)
    try {
      const nova = await criarAgendamentoReuniao({
        cliente_nome: nome,
        cliente_email: email,
        cliente_telefone: telefone,
        empresa: empresa,
        data: dataSelecionada,
        horario: horarioSelecionado,
        assunto: assunto,
        observacao: observacao,
        origem_contexto: origemParam,
      })

      // Salva também na coleção leads com o tipo_solicitacao identificado
      try {
        await pb.collection('leads').create({
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          telefone: telefone.trim() || '(Não informado)',
          empresa: empresa.trim() || 'Não informada',
          segmento: 'Serviços',
          funcionarios: '1–5',
          mensagem: `[Agendamento de Reunião] Data: ${dataSelecionada} às ${horarioSelecionado}. Assunto: ${assunto}. Obs: ${observacao || 'Nenhuma'}`,
          tipo_solicitacao: 'agendamento',
        })
      } catch (leadErr) {
        console.warn('Registro espelho em leads (agendamento):', leadErr)
      }

      setReuniaoCriada(nova)
      fetchMinhasReunioes()
      // Atualizar disponibilidade do dia para refletir o slot ocupado
      consultarDisponibilidadeDia(dataSelecionada)
        .then(setDisponibilidade)
        .catch(() => {})
    } catch (err: any) {
      console.error('Erro ao agendar reunião:', err)
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Não foi possível confirmar o agendamento. Verifique se o horário já não foi reservado.'
      setErroAgendamento(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelar = async (reuniaoId: string) => {
    if (!window.confirm('Tem certeza de que deseja cancelar esta reunião?')) return
    setCancelandoId(reuniaoId)
    try {
      await cancelarReuniao(reuniaoId, 'Cancelado pelo cliente no portal')
      setFeedbackCancelamento('Reunião cancelada com sucesso.')
      fetchMinhasReunioes()
      if (dataSelecionada) {
        consultarDisponibilidadeDia(dataSelecionada)
          .then(setDisponibilidade)
          .catch(() => {})
      }
      setTimeout(() => setFeedbackCancelamento(null), 5000)
    } catch (err) {
      console.error('Erro ao cancelar reunião:', err)
      setFeedbackCancelamento('Erro ao cancelar reunião. Tente novamente.')
      setTimeout(() => setFeedbackCancelamento(null), 5000)
    } finally {
      setCancelandoId(null)
    }
  }

  return (
    <div className={embedded ? 'w-full py-2' : 'min-h-screen bg-[#07132B]/5 py-12 px-4 sm:px-6'}>
      <div className={embedded ? 'max-w-5xl mx-auto space-y-6' : 'max-w-5xl mx-auto space-y-8'}>
        {/* CABEÇALHO PADRÃO DIAMOND GROUP (SEM ÍCONES) */}
        <div className="rounded-3xl bg-gradient-to-br from-[#07132B] via-[#0E2442] to-[#14345C] text-white p-6 sm:p-10 border border-[#D4AF37]/30 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 uppercase tracking-wider">
                CONSULTORIA EXECUTIVA DIAMOND GROUP
              </div>
              {onVoltar && (
                <button
                  type="button"
                  onClick={onVoltar}
                  aria-label="Voltar para a escolha de opções"
                  className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] border border-[#07132B]/10 shadow-sm transition-all duration-150 hover:-translate-y-0.5 cursor-pointer"
                >
                  Voltar
                </button>
              )}
            </div>
            <h1 className="text-2xl sm:text-4xl font-heading font-extrabold text-white tracking-tight leading-tight">
              Agendamento de Reunião com Especialista
            </h1>
            <p className="mt-3 text-slate-300 text-xs sm:text-base max-w-3xl leading-relaxed">
              Reserve um horário reservado com a liderança técnica da Contabilidade 5.0 para
              apresentação de laudo tributário, enquadramento na Reforma ou alinhamento de
              estratégias consultivas.
            </p>

            <div className="mt-5 pt-5 border-t border-white/10 flex flex-wrap gap-4 sm:gap-6 text-xs text-slate-300 font-medium">
              <span>Duração estimada: 50 minutos</span>
              <span>•</span>
              <span>Atendimento exclusivo e individual</span>
              <span>•</span>
              <span>Pauta direcionada às metas da sua empresa</span>
            </div>
          </div>
        </div>

        {/* FEEDBACK DE CANCELAMENTO OU ERRO GERAL */}
        {feedbackCancelamento && (
          <div className="p-4 rounded-2xl bg-amber-50 text-amber-900 border border-amber-300 text-xs sm:text-sm font-semibold flex items-center justify-between">
            <span>{feedbackCancelamento}</span>
            <button
              type="button"
              onClick={() => setFeedbackCancelamento(null)}
              className="text-xs px-2 py-1 rounded bg-black/5 hover:bg-black/10 font-bold"
            >
              Fechar
            </button>
          </div>
        )}

        {/* CASO A REUNIÃO ACABE DE SER CRIADA COM SUCESSO */}
        {reuniaoCriada && (
          <div className="rounded-3xl bg-white p-8 sm:p-10 border-2 border-[#2ECC71] shadow-2xl space-y-6 animate-fade-in">
            <div className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-[#145A32] text-xs font-bold uppercase tracking-wider">
              CONFIRMAÇÃO DE AGENDAMENTO
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900">
              Reunião Confirmada com Sucesso!
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed max-w-2xl">
              Seu horário está garantido na agenda do especialista. Nossa equipe técnica recebeu os
              dados da sua solicitação e já iniciou a preparação do material para o seu alinhamento.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm">
              <div>
                <span className="text-slate-500 uppercase font-semibold text-[11px] block">
                  Data & Horário
                </span>
                <strong className="text-slate-900 font-heading text-base block mt-0.5">
                  {parseDataIso(reuniaoCriada?.data)?.toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  }) ||
                    reuniaoCriada?.data ||
                    'Data a definir'}{' '}
                  {reuniaoCriada?.horario ? `às ${reuniaoCriada.horario}` : ''}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold text-[11px] block">
                  Status
                </span>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#145A32] text-white">
                  {String(reuniaoCriada?.status || 'agendada').toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold text-[11px] block">
                  Solicitante
                </span>
                <p className="text-slate-900 font-semibold mt-0.5">
                  {reuniaoCriada?.cliente_nome || nome || 'Não informado'}
                  {reuniaoCriada?.cliente_email || email
                    ? ` (${reuniaoCriada?.cliente_email || email})`
                    : ''}
                </p>
                {(reuniaoCriada?.empresa || empresa) && (
                  <p className="text-slate-600 text-xs">
                    Empresa: {reuniaoCriada?.empresa || empresa}
                  </p>
                )}
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold text-[11px] block">
                  Pauta / Assunto
                </span>
                <p className="text-slate-900 font-semibold mt-0.5">
                  {reuniaoCriada?.assunto || assunto || 'Reunião de Alinhamento'}
                </p>
                {(reuniaoCriada?.observacao || observacao) && (
                  <p className="text-slate-600 text-xs mt-1">
                    Obs: {reuniaoCriada?.observacao || observacao}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setReuniaoCriada(null)
                  setHorarioSelecionado('')
                }}
                className="px-6 py-3 rounded-xl font-bold text-xs sm:text-sm bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Agendar Outro Horário
              </button>

              <Link
                to="/diagnostico/relatorio"
                className="px-6 py-3 rounded-xl font-bold text-xs sm:text-sm bg-[#07132B] text-[#D4AF37] hover:brightness-110 shadow-md transition-all"
              >
                Voltar ao Relatório Consolidado
              </Link>
            </div>
          </div>
        )}

        {/* FORMULÁRIO DE SELEÇÃO E AGENDAMENTO */}
        {!reuniaoCriada && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* COLUNA ESQUERDA: CALENDÁRIO / SELEÇÃO DE DATA E HORÁRIO */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div>
                <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider block">
                  Passo 1
                </span>
                <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900">
                  Escolha a Data Disponível
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Selecione uma data para consultar os horários vagos com o especialista.
                </p>
              </div>

              {/* LISTA DE DIAS SUGERIDOS */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {diasSugeridos.map((d) => {
                  const isSelected = dataSelecionada === d.dataIso
                  return (
                    <button
                      key={d.dataIso}
                      type="button"
                      onClick={() => setDataSelecionada(d.dataIso)}
                      className={`p-3 rounded-2xl text-left border transition-all ${
                        isSelected
                          ? 'bg-[#07132B] text-white border-[#D4AF37] shadow-md ring-2 ring-[#D4AF37]/50'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      <span
                        className={`text-[11px] font-bold block ${
                          isSelected ? 'text-[#D4AF37]' : 'text-slate-500'
                        }`}
                      >
                        {d.labelSemana}
                      </span>
                      <strong className="text-sm font-heading font-extrabold block mt-0.5">
                        {d.labelDia}
                      </strong>
                    </button>
                  )
                })}
              </div>

              {/* SELEÇÃO DE HORÁRIOS */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider block">
                      Passo 2
                    </span>
                    <h3 className="text-base sm:text-lg font-heading font-extrabold text-slate-900">
                      Horários Disponíveis em{' '}
                      {parseDataIso(dataSelecionada)?.toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                      }) ||
                        dataSelecionada ||
                        'Data selecionada'}
                    </h3>
                  </div>
                  {carregandoDisponibilidade && (
                    <span className="text-xs text-slate-500 animate-pulse font-medium">
                      Verificando agenda...
                    </span>
                  )}
                </div>

                {disponibilidade && !disponibilidade.disponivel && (
                  <div className="p-4 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs">
                    {disponibilidade.motivo || 'Agenda não disponível nesta data.'}
                  </div>
                )}

                {disponibilidade && disponibilidade.disponivel && (
                  <>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                      {(disponibilidade.horariosConfigurados || []).map((h) => {
                        const isOcupado = (disponibilidade.horariosOcupados || []).includes(h)
                        const isSelected = horarioSelecionado === h

                        return (
                          <button
                            key={h}
                            type="button"
                            disabled={isOcupado}
                            onClick={() => setHorarioSelecionado(h)}
                            className={`py-3 px-2 rounded-xl text-center text-xs font-bold border transition-all ${
                              isOcupado
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                                : isSelected
                                  ? 'bg-[#145A32] text-white border-[#2ECC71] shadow-md ring-2 ring-[#2ECC71]/40'
                                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 hover:border-slate-400'
                            }`}
                            title={isOcupado ? 'Horário já reservado por outro cliente' : 'Livre'}
                          >
                            <span className="block text-sm">{h}</span>
                            <span
                              className={`text-[10px] block mt-0.5 ${
                                isOcupado
                                  ? 'text-slate-400'
                                  : isSelected
                                    ? 'text-emerald-200'
                                    : 'text-emerald-700'
                              }`}
                            >
                              {isOcupado ? 'Ocupado' : 'Disponível'}
                            </span>
                          </button>
                        )
                      })}
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-2">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                        Livre
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
                        Ocupado (recusa reserva duplicada)
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* COLUNA DIREITA: FORMULÁRIO DE CONFIRMAÇÃO DO CLIENTE */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div>
                <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider block">
                  Passo 3
                </span>
                <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900">
                  Dados do Agendamento
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Confirme seus dados para receber o link de acesso da reunião.
                </p>
              </div>

              {/* CARD RESUMO DA ESCOLHA */}
              <div className="p-4 rounded-2xl bg-[#07132B] text-white space-y-2 border border-[#D4AF37]/30">
                <span className="text-[11px] text-[#D4AF37] font-bold uppercase tracking-wider block">
                  Horário Selecionado
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-200">
                    {parseDataIso(dataSelecionada)?.toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    }) ||
                      dataSelecionada ||
                      'Data a definir'}
                  </span>
                  <strong className="text-lg font-heading text-[#D4AF37]">
                    {horarioSelecionado || 'Selecione um horário'}
                  </strong>
                </div>
              </div>

              {erroAgendamento && (
                <div className="p-4 rounded-xl bg-rose-50 text-rose-900 border border-rose-200 text-xs font-semibold">
                  {erroAgendamento}
                </div>
              )}

              <form onSubmit={handleAgendar} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#07132B]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    E-mail Corporativo *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@empresa.com.br"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#07132B]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Telefone / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#07132B]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Empresa</label>
                    <input
                      type="text"
                      value={empresa}
                      onChange={(e) => setEmpresa(e.target.value)}
                      placeholder="Nome da sua empresa"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#07132B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Assunto Principal *
                  </label>
                  <select
                    value={assunto}
                    onChange={(e) => setAssunto(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#07132B] bg-white font-medium"
                  >
                    <option value="Apresentação de Parecer Tributário & Alinhamento Estratégico">
                      Apresentação de Parecer Tributário & Alinhamento Estratégico
                    </option>
                    <option value="Validação da Matriz de 7 Riscos 360°">
                      Validação da Matriz de 7 Riscos 360°
                    </option>
                    <option value="Planejamento de Transição Reforma Tributária (IBS/CBS)">
                      Planejamento de Transição Reforma Tributária (IBS/CBS)
                    </option>
                    <option value="Auditoria e Recuperação de Créditos Tributários">
                      Auditoria e Recuperação de Créditos Tributários
                    </option>
                    <option value="Contabilidade Digital Consultiva & BPO 5.0">
                      Contabilidade Digital Consultiva & BPO 5.0
                    </option>
                    <option value="Outro assunto estratégico">Outro assunto estratégico</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Observações / Objetivos Específicos
                  </label>
                  <textarea
                    rows={3}
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    placeholder="Descreva pontos específicos que deseja abordar na reunião..."
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#07132B]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !horarioSelecionado}
                  className={`w-full py-3.5 px-6 rounded-xl font-heading font-extrabold text-sm transition-all shadow-md ${
                    !horarioSelecionado || isSubmitting
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-[#07132B] text-[#D4AF37] hover:brightness-110 shadow-[#07132B]/20 cursor-pointer'
                  }`}
                >
                  {isSubmitting
                    ? 'Confirmando Agendamento...'
                    : horarioSelecionado
                      ? `Confirmar Reunião às ${horarioSelecionado}`
                      : 'Selecione um Horário Acima'}
                </button>

                {onVoltar && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={onVoltar}
                      aria-label="Voltar para a escolha de opções"
                      className="text-xs font-bold text-[#07132B] hover:text-[#D4AF37] underline decoration-1 underline-offset-4 transition-colors cursor-pointer py-1"
                    >
                      Voltar
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* HISTÓRICO DE REUNIÕES DO USUÁRIO */}
        {isAuthenticated && minhasReunioes.length > 0 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider block">
                  Meus Agendamentos
                </span>
                <h3 className="text-xl font-heading font-extrabold text-slate-900">
                  Histórico de Reuniões Agendadas
                </h3>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-slate-100 text-slate-700">
                {minhasReunioes.length} registro(s)
              </span>
            </div>

            {carregandoReunioes ? (
              <p className="text-xs text-slate-400">Carregando seus agendamentos...</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {minhasReunioes.map((r) => {
                  const statusVal = r?.status || 'agendada'
                  const cancelada = statusVal === 'cancelada'
                  const realizada = statusVal === 'realizada'

                  return (
                    <div
                      key={r?.id || Math.random().toString()}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-900 font-heading text-sm">
                            {r?.assunto || 'Reunião com Especialista'}
                          </strong>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              cancelada
                                ? 'bg-rose-100 text-rose-800'
                                : realizada
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-emerald-100 text-[#145A32]'
                            }`}
                          >
                            {statusVal}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Data:{' '}
                          <span className="font-semibold text-slate-800">
                            {parseDataIso(r?.data)?.toLocaleDateString('pt-BR') ||
                              r?.data ||
                              'Data a definir'}{' '}
                            {r?.horario ? `às ${r.horario}` : ''}
                          </span>
                          {r?.empresa && <span> • Empresa: {r.empresa}</span>}
                        </p>
                        {r?.resposta_especialista && (
                          <div className="text-xs text-[#07132B] font-medium bg-amber-50/80 p-2 rounded-lg border border-amber-200 mt-1">
                            Mensagem do especialista: {r.resposta_especialista}
                          </div>
                        )}
                        {r?.cancelado_motivo && (
                          <p className="text-xs text-rose-600">Motivo: {r.cancelado_motivo}</p>
                        )}
                      </div>

                      {!cancelada && !realizada && r?.id && (
                        <button
                          type="button"
                          disabled={cancelandoId === r.id}
                          onClick={() => handleCancelar(r.id)}
                          className="self-start sm:self-center px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                        >
                          {cancelandoId === r.id ? 'Cancelando...' : 'Cancelar Reunião'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
