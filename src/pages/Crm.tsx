import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { listarCrmClientes, excluirCrmCliente } from '@/services/crm'
import { listarClientesEmpresas, type ClienteEmpresaRecord } from '@/services/clientesEmpresas'
import pb from '@/lib/pocketbase/client'
import type { CrmClienteRecord, StatusComercialCrm } from '@/types/crm'
import { STATUS_COMERCIAIS_CRM } from '@/types/crm'
import { ModalNovaFichaCrm } from '@/components/crm/ModalNovaFichaCrm'
import {
  listarLeadsPipeline,
  atualizarEstagioPipelineLead,
  adicionarInteracaoLead,
} from '@/services/pipelineLeads'
import type { LeadProcessado, EstagioPipelineLead, TipoInteracaoLead } from '@/types/pipelineLead'
import { PipelineLeadsKanban } from '@/components/crm/PipelineLeadsKanban'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

interface ResumoCruzadoCliente {
  temDiagnostico: boolean
  totalCreditos: number
}

export default function Crm() {
  const { user, nivelAcesso, isAdmin, isMaster } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  // Permissão: se for empresário, redireciona para painel empresarial
  useEffect(() => {
    if (nivelAcesso === 'empresario' || (user as any)?.perfil === 'empresario') {
      toast({
        title: 'Acesso Restrito',
        description: 'O CRM é exclusivo para Analistas e Gestores da Diamond Group.',
        variant: 'destructive',
      })
      navigate('/dados-empresa', { replace: true })
    }
  }, [nivelAcesso, user, navigate, toast])

  const [abaPrincipal, setAbaPrincipal] = useState<'pipeline_leads' | 'carteira_clientes'>(
    'pipeline_leads',
  )
  const [leadsPipeline, setLeadsPipeline] = useState<LeadProcessado[]>([])
  const [carregandoLeads, setCarregandoLeads] = useState(true)

  const [fichas, setFichas] = useState<CrmClienteRecord[]>([])
  const [empresas, setEmpresas] = useState<ClienteEmpresaRecord[]>([])
  const [cruzamentos, setCruzamentos] = useState<Record<string, ResumoCruzadoCliente>>({})
  const [carregando, setCarregando] = useState(true)
  const [modalNovaFichaAberta, setModalNovaFichaAberta] = useState(false)

  // Filtros
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState<string>('todos')

  // Carregar dados
  const carregarDados = async () => {
    setCarregando(true)
    try {
      const [listaFichas, listaEmpresas] = await Promise.all([
        listarCrmClientes(),
        listarClientesEmpresas(),
      ])
      setFichas(listaFichas)
      setEmpresas(listaEmpresas)

      // Carregar prévia de cruzamentos (diagnósticos concluídos e créditos em recuperação)
      // Agrupados por empresa_id ou user_id
      try {
        const [diagRecords, recRecords] = await Promise.all([
          pb
            .collection('diagnosticos')
            .getFullList<{ id: string; user_id: string; cnpj?: string }>({
              fields: 'id,user_id,cnpj',
            }),
          pb.collection('simulacoes_recuperador').getFullList<{
            id: string
            user_id: string
            cnpj?: string
            total_recuperavel_integral?: number
          }>({
            fields: 'id,user_id,cnpj,total_recuperavel_integral',
          }),
        ])

        const mapa: Record<string, ResumoCruzadoCliente> = {}

        listaFichas.forEach((f) => {
          const emp =
            (f as any).expand?.empresa_id || listaEmpresas.find((e) => e.id === f.empresa_id)
          const userId = emp?.user_id
          const cnpjLimpo = emp?.cnpj?.replace(/\D/g, '')

          const temDiag = diagRecords.some(
            (d) =>
              (userId && d.user_id === userId) ||
              (cnpjLimpo && d.cnpj && d.cnpj.replace(/\D/g, '').includes(cnpjLimpo)),
          )

          const creditos = recRecords
            .filter(
              (r) =>
                (userId && r.user_id === userId) ||
                (cnpjLimpo && r.cnpj && r.cnpj.replace(/\D/g, '').includes(cnpjLimpo)),
            )
            .reduce((acc, r) => acc + (r.total_recuperavel_integral || 0), 0)

          mapa[f.id] = {
            temDiagnostico: temDiag,
            totalCreditos: creditos,
          }
        })

        setCruzamentos(mapa)
      } catch (crossErr) {
        console.warn('Erro ao carregar cruzamento prévio:', crossErr)
      }
    } catch (err: any) {
      console.error('Erro ao carregar CRM:', err)
      toast({
        title: 'Erro ao carregar CRM',
        description: err?.message || 'Falha ao buscar clientes da carteira.',
        variant: 'destructive',
      })
    } finally {
      setCarregando(false)
    }
  }

  const carregarLeads = async () => {
    setCarregandoLeads(true)
    try {
      const lista = await listarLeadsPipeline()
      setLeadsPipeline(lista)
    } catch (err: any) {
      console.error('Erro ao carregar leads do pipeline:', err)
      toast({
        title: 'Erro ao carregar leads',
        description: err?.message || 'Falha ao buscar pipeline de leads.',
        variant: 'destructive',
      })
    } finally {
      setCarregandoLeads(false)
    }
  }

  useEffect(() => {
    carregarDados()
    carregarLeads()
  }, [])

  const handleMudarEstagioLead = async (leadId: string, novoEstagio: EstagioPipelineLead) => {
    try {
      const userName = user?.name || user?.email || 'Analista'
      await atualizarEstagioPipelineLead(leadId, novoEstagio, undefined, userName)
      // Atualiza localmente
      setLeadsPipeline((prev) =>
        prev.map((item) =>
          item.id === leadId ? { ...item, estagio_pipeline: novoEstagio } : item,
        ),
      )
      toast({
        title: 'Estágio Atualizado',
        description: `Lead movido com sucesso no funil.`,
      })
      // Recarrega lista completa em background para recalcular métricas e histórico
      carregarLeads()
    } catch (err: any) {
      toast({
        title: 'Erro ao mover lead',
        description: err?.message || 'Falha ao salvar novo estágio do lead.',
        variant: 'destructive',
      })
    }
  }

  const handleAdicionarInteracaoLead = async (
    leadId: string,
    dados: {
      tipo: TipoInteracaoLead
      descricao: string
      proximoPasso?: string
      dataProximoPasso?: string
    },
  ) => {
    try {
      const userName = user?.name || user?.email || 'Analista'
      await adicionarInteracaoLead({
        leadId,
        tipo: dados.tipo,
        descricao: dados.descricao,
        proximoPasso: dados.proximoPasso,
        dataProximoPasso: dados.dataProximoPasso,
        autorNome: userName,
        autorId: user?.id,
      })
      toast({
        title: 'Interação Registrada',
        description: 'A timeline do lead foi atualizada com sucesso.',
      })
      await carregarLeads()
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar interação',
        description: err?.message || 'Não foi possível gravar a interação.',
        variant: 'destructive',
      })
      throw err
    }
  }

  // Mapa de empresas para lookup rápido
  const empresasMap = useMemo(() => {
    const map = new Map<string, ClienteEmpresaRecord>()
    empresas.forEach((e) => map.set(e.id, e))
    return map
  }, [empresas])

  // Filtragem
  const fichasFiltradas = useMemo(() => {
    return fichas.filter((f) => {
      const emp =
        (f as any).expand?.empresa_id || (f.empresa_id ? empresasMap.get(f.empresa_id) : null)
      const nomeEmpresa = emp?.nome_empresa?.toLowerCase() || ''
      const cnpj = emp?.cnpj || ''
      const contato = emp?.nome_contato?.toLowerCase() || ''
      const analistaNome = (f as any).expand?.analista_responsavel?.name?.toLowerCase() || ''

      const matchBusca =
        !busca.trim() ||
        nomeEmpresa.includes(busca.toLowerCase()) ||
        cnpj.includes(busca) ||
        contato.includes(busca.toLowerCase()) ||
        analistaNome.includes(busca.toLowerCase()) ||
        (f.origem_contato && f.origem_contato.toLowerCase().includes(busca.toLowerCase()))

      const matchStatus = statusFiltro === 'todos' || f.status_comercial === statusFiltro

      return matchBusca && matchStatus
    })
  }, [fichas, empresasMap, busca, statusFiltro])

  // Métricas de Cabeçalho
  const metricas = useMemo(() => {
    const total = fichas.length
    const ativos = fichas.filter((f) => f.status_comercial === 'Ativo').length
    const onboarding = fichas.filter((f) => f.status_comercial === 'Onboarding').length
    const prospects = fichas.filter((f) => f.status_comercial === 'Prospect').length
    const mrrTotal = fichas
      .filter((f) => f.status_comercial === 'Ativo')
      .reduce((acc, f) => acc + (f.valor_mensal_servico || 0), 0)

    return { total, ativos, onboarding, prospects, mrrTotal }
  }, [fichas])

  const handleExcluir = async (fId: string, nomeCli: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (!confirm(`Tem certeza que deseja remover a ficha comercial de "${nomeCli}" do CRM?`)) {
      return
    }

    try {
      await excluirCrmCliente(fId)
      setFichas((prev) => prev.filter((item) => item.id !== fId))
      toast({
        title: 'Ficha Removida',
        description: 'A ficha comercial foi excluída com sucesso.',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir',
        description: err?.message || 'Falha ao excluir registro.',
        variant: 'destructive',
      })
    }
  }

  const getStatusBadge = (status: StatusComercialCrm) => {
    const conf = STATUS_COMERCIAIS_CRM.find((s) => s.id === status)
    return (
      <Badge
        variant="outline"
        className={`font-semibold text-[11px] px-2.5 py-0.5 rounded-full ${
          conf?.corBadge || 'bg-slate-100 text-slate-800'
        }`}
      >
        {status}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER DA PÁGINA */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#07132B] text-[#D4AF37]">
                  Fase 3 • CRM & Gestão
                </span>
                {(isAdmin || isMaster) && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    Visão Geral (Todas as Carteiras)
                  </span>
                )}
                {!isAdmin && !isMaster && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                    Sua Carteira de Analista
                  </span>
                )}
              </div>
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#07132B]">
                CRM Comercial & Pipeline de Leads
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-3xl">
                Acompanhe os leads qualificados em pipeline kanban (novo → contato feito → reunião →
                cliente), interações com timeline e histórico completo da carteira comercial.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {abaPrincipal === 'carteira_clientes' && (
                <Button
                  onClick={() => setModalNovaFichaAberta(true)}
                  className="bg-[#07132B] hover:bg-[#0d2249] text-[#D4AF37] font-bold text-xs sm:text-sm px-5 py-2.5 rounded-2xl shadow-md transition-all"
                >
                  + Nova Ficha Comercial
                </Button>
              )}
            </div>
          </div>

          {/* SELETOR DE ABAS PRINCIPAIS: PIPELINE DE LEADS vs CARTEIRA COMERCIAL */}
          <div className="flex items-center gap-2 mt-6 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAbaPrincipal('pipeline_leads')}
              className={`text-xs sm:text-sm font-extrabold px-4 py-2.5 rounded-2xl transition-all border ${
                abaPrincipal === 'pipeline_leads'
                  ? 'bg-[#07132B] text-[#D4AF37] border-[#07132B] shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              Pipeline de Leads ({leadsPipeline.length})
            </button>
            <button
              type="button"
              onClick={() => setAbaPrincipal('carteira_clientes')}
              className={`text-xs sm:text-sm font-extrabold px-4 py-2.5 rounded-2xl transition-all border ${
                abaPrincipal === 'carteira_clientes'
                  ? 'bg-[#07132B] text-[#D4AF37] border-[#07132B] shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              Carteira Comercial de Clientes ({fichas.length})
            </button>
          </div>

          {/* CARDS DE RESUMO (KPIs) - PADRÃO DIAMOND SEM ÍCONES */}
          {abaPrincipal === 'pipeline_leads' ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-100">
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total de Leads
                </div>
                <div className="text-2xl font-black text-[#07132B] mt-1">
                  {leadsPipeline.length}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Captados em todos os canais</div>
              </div>

              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
                  Novos Leads
                </div>
                <div className="text-2xl font-black text-blue-900 mt-1">
                  {leadsPipeline.filter((l) => l.estagio_pipeline === 'novo').length}
                </div>
                <div className="text-[11px] text-blue-700 mt-0.5">Aguardando 1º contato</div>
              </div>

              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                  Em Negociação
                </div>
                <div className="text-2xl font-black text-amber-900 mt-1">
                  {
                    leadsPipeline.filter(
                      (l) =>
                        l.estagio_pipeline === 'contato_feito' || l.estagio_pipeline === 'reuniao',
                    ).length
                  }
                </div>
                <div className="text-[11px] text-amber-700 mt-0.5">Contato ou reunião</div>
              </div>

              <div className="bg-rose-50/80 border border-rose-300 rounded-2xl p-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-rose-800 flex items-center justify-between">
                  <span>Quentes Esquecidos</span>
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                </div>
                <div className="text-2xl font-black text-rose-950 mt-1">
                  {leadsPipeline.filter((l) => l.isQuenteEsquecido).length}
                </div>
                <div className="text-[11px] text-rose-800 mt-0.5">
                  Score alto sem contato recente
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-100">
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total na Carteira
                </div>
                <div className="text-2xl font-black text-[#07132B] mt-1">{metricas.total}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Empresas em gestão</div>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  Clientes Ativos
                </div>
                <div className="text-2xl font-black text-emerald-900 mt-1">{metricas.ativos}</div>
                <div className="text-[11px] text-emerald-700 mt-0.5">Contratos em operação</div>
              </div>

              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
                  Em Onboarding / Implantação
                </div>
                <div className="text-2xl font-black text-blue-900 mt-1">{metricas.onboarding}</div>
                <div className="text-[11px] text-blue-700 mt-0.5">Integração inicial</div>
              </div>

              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                  Receita Recorrente (MRR Ativo)
                </div>
                <div className="text-2xl font-black text-[#07132B] mt-1">
                  {metricas.mrrTotal.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </div>
                <div className="text-[11px] text-amber-800 mt-0.5">Base contratada / mês</div>
              </div>
            </div>
          )}
        </div>

        {/* CONTEÚDO DA ABA SELECIONADA */}
        {abaPrincipal === 'pipeline_leads' ? (
          <PipelineLeadsKanban
            leads={leadsPipeline}
            loading={carregandoLeads}
            onMudarEstagio={handleMudarEstagioLead}
            onAdicionarInteracao={handleAdicionarInteracaoLead}
            onRecarregar={carregarLeads}
          />
        ) : (
          <>
            <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="flex-1 max-w-md">
                <Input
                  placeholder="Buscar por empresa, CNPJ, contato ou analista..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="text-xs h-10 rounded-xl border-slate-300"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Status:
                </span>
                {['todos', 'Prospect', 'Onboarding', 'Ativo', 'Inativo', 'Perdido'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFiltro(st)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all ${
                      statusFiltro === st
                        ? 'bg-[#07132B] text-[#D4AF37] shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'todos' ? 'Todos os Status' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* TABELA DE CARTEIRA DO CRM */}
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-heading font-extrabold text-base text-[#07132B]">
                  Carteira Comercial ({fichasFiltradas.length}{' '}
                  {fichasFiltradas.length === 1 ? 'cliente' : 'clientes'})
                </h2>
                <span className="text-xs text-slate-500">
                  Clique em qualquer linha para abrir a Ficha Completa
                </span>
              </div>

              {carregando ? (
                <div className="p-12 text-center text-slate-500 text-xs font-bold">
                  Carregando dados da carteira do CRM...
                </div>
              ) : fichasFiltradas.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <p className="text-sm font-bold text-slate-700">
                    Nenhum cliente comercial encontrado.
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {fichas.length === 0
                      ? 'Você ainda não possui fichas criadas no CRM. Clique em "+ Nova Ficha Comercial" para vincular uma empresa ou cadastrar um novo prospect.'
                      : 'Nenhum resultado corresponde aos filtros selecionados acima.'}
                  </p>
                  {fichas.length === 0 && (
                    <Button
                      onClick={() => setModalNovaFichaAberta(true)}
                      className="bg-[#07132B] hover:bg-[#0d2249] text-[#D4AF37] text-xs font-bold px-4 py-2 rounded-xl mt-2"
                    >
                      Criar Primeira Ficha Comercial
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3.5 px-4 sm:px-6">Empresa & Contato</th>
                        <th className="py-3.5 px-3">Regime Atual</th>
                        <th className="py-3.5 px-3">Status Comercial</th>
                        <th className="py-3.5 px-3 text-center">Diagnóstico 360°</th>
                        <th className="py-3.5 px-3 text-right">Créditos em Recuperação</th>
                        <th className="py-3.5 px-3 text-right">Valor Mensal</th>
                        {(isAdmin || isMaster) && <th className="py-3.5 px-3">Analista</th>}
                        <th className="py-3.5 px-4 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {fichasFiltradas.map((ficha) => {
                        const emp =
                          (ficha as any).expand?.empresa_id ||
                          (ficha.empresa_id ? empresasMap.get(ficha.empresa_id) : null)
                        const analista = (ficha as any).expand?.analista_responsavel
                        const cruzamento = cruzamentos[ficha.id] || {
                          temDiagnostico: false,
                          totalCreditos: 0,
                        }

                        const nomeEmpresa = emp?.nome_empresa || 'Empresa em Prospecção'
                        const cnpj = emp?.cnpj || 'Sem CNPJ informado'
                        const regime = emp?.regime_atual || 'Não Informado'
                        const valorMensal = (ficha.valor_mensal_servico || 0).toLocaleString(
                          'pt-BR',
                          {
                            style: 'currency',
                            currency: 'BRL',
                          },
                        )

                        return (
                          <tr
                            key={ficha.id}
                            onClick={() => navigate(`/crm/cliente/${ficha.id}`)}
                            className="hover:bg-amber-50/40 transition-colors cursor-pointer group"
                          >
                            <td className="py-4 px-4 sm:px-6">
                              <div className="font-bold text-slate-900 group-hover:text-[#07132B]">
                                {nomeEmpresa}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                {cnpj} {emp?.nome_contato ? `• ${emp.nome_contato}` : ''}
                              </div>
                              {ficha.origem_contato && (
                                <span className="inline-block mt-1 text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                  Origem: {ficha.origem_contato}
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-3 text-slate-700 font-medium">
                              <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded-md text-[11px]">
                                {regime}
                              </span>
                            </td>

                            <td className="py-4 px-3">{getStatusBadge(ficha.status_comercial)}</td>

                            <td className="py-4 px-3 text-center">
                              {cruzamento.temDiagnostico ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  Sim (Concluído)
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                  Não iniciado
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-3 text-right font-bold text-slate-900">
                              {cruzamento.totalCreditos > 0 ? (
                                <span className="text-emerald-700">
                                  {cruzamento.totalCreditos.toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  })}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-normal">R$ 0,00</span>
                              )}
                            </td>

                            <td className="py-4 px-3 text-right font-extrabold text-[#07132B]">
                              {valorMensal}
                            </td>

                            {(isAdmin || isMaster) && (
                              <td className="py-4 px-3 text-slate-600 text-[11px]">
                                {analista?.name || analista?.email || 'Não atribuído'}
                              </td>
                            )}

                            <td className="py-4 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <Link
                                  to={`/crm/cliente/${ficha.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#07132B] text-[#D4AF37] hover:bg-[#0d2249] transition-all"
                                >
                                  Abrir Ficha
                                </Link>
                                <button
                                  type="button"
                                  onClick={(e) => handleExcluir(ficha.id, nomeEmpresa, e)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors text-xs"
                                  title="Excluir Ficha do CRM"
                                >
                                  Remover
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
      </div>

      {/* MODAL DE NOVA FICHA COMERCIAL */}
      <ModalNovaFichaCrm
        aberto={modalNovaFichaAberta}
        aoFechar={() => setModalNovaFichaAberta(false)}
        empresasDisponiveis={empresas}
        aoSalvarSucesso={(novo) => {
          setFichas((prev) => [novo, ...prev])
          carregarDados()
        }}
      />
    </div>
  )
}
