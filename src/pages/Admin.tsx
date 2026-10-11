import React, { useEffect, useState } from 'react'
import {
  Users,
  Building,
  Mail,
  Phone,
  Search,
  Trash2,
  RefreshCw,
  LogOut,
  TrendingUp,
  Download,
  AlertCircle,
  Calculator,
  Layers,
  Sparkles,
  DollarSign,
  Percent,
  Briefcase,
  Building2,
  FileSpreadsheet,
  CheckCircle2,
  MapPin,
  Calendar,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getLeads, deleteLead, type LeadRecord } from '@/services/leads'
import { getDiagnosticos, deleteDiagnostico, type DiagnosticoRecord } from '@/services/diagnosticos'
import {
  getTodosClientesEmpresas,
  deleteClienteEmpresa,
  type ClienteEmpresaRecord,
} from '@/services/clientesEmpresas'
import { useRealtime } from '@/hooks/use-realtime'
import { formatarMoeda } from '@/lib/calculadoraUtils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type TabTipo = 'clientes' | 'leads' | 'diagnosticos'

export default function Admin() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<TabTipo>('clientes')

  // Clientes Empresas
  const [clientes, setClientes] = useState<ClienteEmpresaRecord[]>([])
  const [isLoadingClientes, setIsLoadingClientes] = useState(true)
  const [clienteSearchTerm, setClienteSearchTerm] = useState('')
  const [clienteFilterSegmento, setClienteFilterSegmento] = useState('todos')
  const [clienteFilterRegime, setClienteFilterRegime] = useState('todos')
  const [clienteFilterUf, setClienteFilterUf] = useState('todos')
  const [clienteToDelete, setClienteToDelete] = useState<ClienteEmpresaRecord | null>(null)
  const [isDeletingCliente, setIsDeletingCliente] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<ClienteEmpresaRecord | null>(null)

  // Leads
  const [leads, setLeads] = useState<LeadRecord[]>([])
  const [isLoadingLeads, setIsLoadingLeads] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSegment, setFilterSegment] = useState('todos')
  const [leadToDelete, setLeadToDelete] = useState<LeadRecord | null>(null)
  const [isDeletingLead, setIsDeletingLead] = useState(false)
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null)

  // Diagnósticos
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoRecord[]>([])
  const [isLoadingDiagnosticos, setIsLoadingDiagnosticos] = useState(true)
  const [diagSearchTerm, setDiagSearchTerm] = useState('')
  const [diagFilterRegime, setDiagFilterRegime] = useState('todos')
  const [diagFilterSegmento, setDiagFilterSegmento] = useState('todos')
  const [diagToDelete, setDiagToDelete] = useState<DiagnosticoRecord | null>(null)
  const [isDeletingDiag, setIsDeletingDiag] = useState(false)
  const [selectedDiag, setSelectedDiag] = useState<DiagnosticoRecord | null>(null)

  const fetchClientes = async () => {
    setIsLoadingClientes(true)
    try {
      const data = await getTodosClientesEmpresas()
      setClientes(data)
    } catch (err) {
      console.error('Erro ao carregar clientes:', err)
    } finally {
      setIsLoadingClientes(false)
    }
  }

  const fetchLeads = async () => {
    setIsLoadingLeads(true)
    try {
      const data = await getLeads()
      setLeads(data)
    } catch (err) {
      console.error('Erro ao carregar leads:', err)
    } finally {
      setIsLoadingLeads(false)
    }
  }

  const fetchDiagnosticos = async () => {
    setIsLoadingDiagnosticos(true)
    try {
      const data = await getDiagnosticos()
      setDiagnosticos(data)
    } catch (err) {
      console.error('Erro ao carregar diagnósticos:', err)
    } finally {
      setIsLoadingDiagnosticos(false)
    }
  }

  useEffect(() => {
    fetchClientes()
    fetchLeads()
    fetchDiagnosticos()
  }, [])

  // Inscrição em tempo real na coleção 'clientes_empresas'
  useRealtime<ClienteEmpresaRecord>(
    'clientes_empresas',
    (e) => {
      if (e.action === 'create') {
        setClientes((prev) => [e.record, ...prev.filter((item) => item.id !== e.record.id)])
      } else if (e.action === 'update') {
        setClientes((prev) => prev.map((item) => (item.id === e.record.id ? e.record : item)))
      } else if (e.action === 'delete') {
        setClientes((prev) => prev.filter((item) => item.id !== e.record.id))
      }
    },
    true,
  )

  // Inscrição em tempo real na coleção 'leads'
  useRealtime<LeadRecord>(
    'leads',
    (e) => {
      if (e.action === 'create') {
        setLeads((prev) => [e.record, ...prev.filter((item) => item.id !== e.record.id)])
      } else if (e.action === 'update') {
        setLeads((prev) => prev.map((item) => (item.id === e.record.id ? e.record : item)))
      } else if (e.action === 'delete') {
        setLeads((prev) => prev.filter((item) => item.id !== e.record.id))
      }
    },
    true,
  )

  // Inscrição em tempo real na coleção 'diagnosticos'
  useRealtime<DiagnosticoRecord>(
    'diagnosticos',
    (e) => {
      if (e.action === 'create') {
        setDiagnosticos((prev) => [e.record, ...prev.filter((item) => item.id !== e.record.id)])
      } else if (e.action === 'update') {
        setDiagnosticos((prev) => prev.map((item) => (item.id === e.record.id ? e.record : item)))
      } else if (e.action === 'delete') {
        setDiagnosticos((prev) => prev.filter((item) => item.id !== e.record.id))
      }
    },
    true,
  )

  const handleDeleteLeadConfirm = async () => {
    if (!leadToDelete) return
    setIsDeletingLead(true)
    try {
      await deleteLead(leadToDelete.id)
      setLeads((prev) => prev.filter((l) => l.id !== leadToDelete.id))
      setLeadToDelete(null)
      if (selectedLead?.id === leadToDelete.id) {
        setSelectedLead(null)
      }
    } catch (err) {
      console.error('Erro ao excluir lead:', err)
    } finally {
      setIsDeletingLead(false)
    }
  }

  const handleDeleteDiagConfirm = async () => {
    if (!diagToDelete) return
    setIsDeletingDiag(true)
    try {
      await deleteDiagnostico(diagToDelete.id)
      setDiagnosticos((prev) => prev.filter((d) => d.id !== diagToDelete.id))
      setDiagToDelete(null)
      if (selectedDiag?.id === diagToDelete.id) {
        setSelectedDiag(null)
      }
    } catch (err) {
      console.error('Erro ao excluir diagnóstico:', err)
    } finally {
      setIsDeletingDiag(false)
    }
  }

  const handleDeleteClienteConfirm = async () => {
    if (!clienteToDelete?.id) return
    setIsDeletingCliente(true)
    try {
      await deleteClienteEmpresa(clienteToDelete.id)
      setClientes((prev) => prev.filter((c) => c.id !== clienteToDelete.id))
      setClienteToDelete(null)
      if (selectedCliente?.id === clienteToDelete.id) {
        setSelectedCliente(null)
      }
    } catch (err) {
      console.error('Erro ao excluir cliente:', err)
    } finally {
      setIsDeletingCliente(false)
    }
  }

  // Filtragem dos clientes
  const filteredClientes = clientes.filter((item) => {
    const term = clienteSearchTerm.toLowerCase()
    const matchesSearch =
      item.nome_contato?.toLowerCase().includes(term) ||
      item.nome_empresa?.toLowerCase().includes(term) ||
      item.email?.toLowerCase().includes(term) ||
      item.cnpj?.toLowerCase().includes(term) ||
      item.telefone?.includes(term) ||
      item.cidade?.toLowerCase().includes(term)

    const matchesSegmento =
      clienteFilterSegmento === 'todos' ||
      item.segmento?.toLowerCase() === clienteFilterSegmento.toLowerCase()

    const matchesRegime =
      clienteFilterRegime === 'todos' ||
      item.regime_atual?.toLowerCase() === clienteFilterRegime.toLowerCase()

    const matchesUf =
      clienteFilterUf === 'todos' || item.uf_origem?.toUpperCase() === clienteFilterUf.toUpperCase()

    return matchesSearch && matchesSegmento && matchesRegime && matchesUf
  })

  // Filtragem dos leads
  const filteredLeads = leads.filter((item) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      item.nome?.toLowerCase().includes(term) ||
      item.email?.toLowerCase().includes(term) ||
      item.empresa?.toLowerCase().includes(term) ||
      item.telefone?.includes(term)

    const matchesSegment =
      filterSegment === 'todos' || item.segmento?.toLowerCase() === filterSegment.toLowerCase()

    return matchesSearch && matchesSegment
  })

  // Filtragem dos diagnósticos
  const filteredDiagnosticos = diagnosticos.filter((item) => {
    const term = diagSearchTerm.toLowerCase()
    const matchesSearch =
      item.nome?.toLowerCase().includes(term) ||
      item.email?.toLowerCase().includes(term) ||
      item.empresa?.toLowerCase().includes(term) ||
      item.cnpj?.toLowerCase().includes(term) ||
      item.telefone?.includes(term) ||
      item.segmento?.toLowerCase().includes(term)

    const matchesRegime =
      diagFilterRegime === 'todos' || item.regime_recomendado === diagFilterRegime

    const matchesSegmento =
      diagFilterSegmento === 'todos' ||
      item.segmento?.toLowerCase() === diagFilterSegmento.toLowerCase()

    return matchesSearch && matchesRegime && matchesSegmento
  })

  // Exportar Clientes CSV
  const handleExportClientesCSV = () => {
    if (clientes.length === 0) return
    const headers = [
      'ID',
      'NomeContato',
      'NomeEmpresa',
      'CNPJ',
      'Email',
      'Telefone',
      'UF',
      'Cidade',
      'Segmento',
      'RegimeAtual',
      'Funcionarios',
      'EmissaoNF',
      'FaturamentoMensal',
      'FaturamentoAnual',
      'FolhaMensal',
      'MargemLucroEstimada',
      'DespesasCreditos',
      'PercentualExportacao',
      'AnoBaseTransicao',
      'DataCadastro',
    ]
    const rows = clientes.map((c) => {
      const fatMensal = c.faturamento_mensal || 0
      return [
        c.id,
        `"${c.nome_contato || ''}"`,
        `"${c.nome_empresa || ''}"`,
        `"${c.cnpj || ''}"`,
        `"${c.email || ''}"`,
        `"${c.telefone || ''}"`,
        `"${c.uf_origem || ''}"`,
        `"${c.cidade || ''}"`,
        `"${c.segmento || ''}"`,
        `"${c.regime_atual || ''}"`,
        `"${c.funcionarios || ''}"`,
        `"${c.emissao_nf || ''}"`,
        fatMensal,
        fatMensal * 12,
        c.folha_pagamento_mensal || 0,
        c.margem_lucro_estimada || 0,
        c.despesas_creditos_mensais || 0,
        c.percentual_exportacao || 0,
        c.ano_base_transicao || 2026,
        c.created ? new Date(c.created).toLocaleDateString('pt-BR') : '',
      ]
    })
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `clientes_empresas_contabilidade50_${new Date().toISOString().slice(0, 10)}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Exportar Leads CSV
  const handleExportLeadsCSV = () => {
    if (leads.length === 0) return
    const headers = [
      'ID',
      'Nome',
      'Email',
      'Telefone',
      'Empresa',
      'Segmento',
      'Funcionários',
      'Data',
    ]
    const rows = leads.map((l) => [
      l.id,
      `"${l.nome || ''}"`,
      `"${l.email || ''}"`,
      `"${l.telefone || ''}"`,
      `"${l.empresa || ''}"`,
      `"${l.segmento || ''}"`,
      `"${l.funcionarios || ''}"`,
      l.created ? new Date(l.created).toLocaleDateString('pt-BR') : '',
    ])
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `leads_contabilidade50_${new Date().toISOString().slice(0, 10)}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Exportar Diagnósticos CSV
  const handleExportDiagCSV = () => {
    if (diagnosticos.length === 0) return
    const headers = [
      'ID',
      'Nome',
      'Email',
      'Telefone',
      'Empresa',
      'CNPJ',
      'UF',
      'AliquotaICMS',
      'Cidade',
      'AliquotaISS',
      'Segmento',
      'RBT12',
      'Folha12',
      'FolhaMensal',
      'FatorR',
      'MargemLucro',
      'DespesasCreditosMensal',
      'PercentualExportacao',
      'AnoBaseReforma',
      'RegimeRecomendadoNovo',
      'RegimeRecomendadoAtual',
      'CargaSimplesNovo',
      'CargaPresumidoNovo',
      'CargaRealNovo',
      'EconomiaAnualNovo',
      'CargaSimplesAtual',
      'CargaPresumidoAtual',
      'CargaRealAtual',
      'EconomiaAnualAtual',
      'Data',
    ]
    const rows = diagnosticos.map((d) => {
      const folhaTotal = d.folha_pagamento ? d.folha_pagamento * 12 : d.folha12 || 0
      const fatorR = d.rbt12 && d.rbt12 > 0 ? ((folhaTotal / d.rbt12) * 100).toFixed(1) : '0'
      return [
        d.id,
        `"${d.nome || ''}"`,
        `"${d.email || ''}"`,
        `"${d.telefone || ''}"`,
        `"${d.empresa || ''}"`,
        `"${d.cnpj || ''}"`,
        `"${d.uf_origem || 'SP'}"`,
        d.aliquota_icms || 18.0,
        `"${d.cidade || ''}"`,
        d.aliquota_iss || 2.0,
        `"${d.segmento || ''}"`,
        d.rbt12 || 0,
        d.folha12 || 0,
        d.folha_pagamento || 0,
        `${fatorR}%`,
        d.margem_lucro || 0,
        d.despesas_creditos || 0,
        d.percentual_exportacao || 0,
        d.ano_base || 2026,
        `"${d.sistema_recomendado_novo || d.regime_recomendado || ''}"`,
        `"${d.sistema_recomendado_atual || d.regime_recomendado || ''}"`,
        d.carga_simples_novo || d.carga_simples || 0,
        d.carga_presumido_novo || d.carga_presumido || 0,
        d.carga_real_novo || d.carga_real || 0,
        d.economia_anual_novo || d.economia_anual || 0,
        d.carga_simples || 0,
        d.carga_presumido || 0,
        d.carga_real || 0,
        d.economia_anual || 0,
        d.created ? new Date(d.created).toLocaleDateString('pt-BR') : '',
      ]
    })
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `diagnosticos_contabilidade50_${new Date().toISOString().slice(0, 10)}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="pt-24 pb-20 bg-slate-50 min-h-screen">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        {/* TOP BAR DO PAINEL */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2ECC71] animate-pulse"></span>
              <span className="text-xs uppercase tracking-wider font-semibold text-[#145A32]">
                Painel Administrativo • Tempo Real Ativo
              </span>
            </div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight mt-1">
              Contabilidade 5.0 — Gestão Integrada
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Logado como{' '}
              <strong className="text-slate-800">{user?.email || 'Administrador'}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchClientes()
                fetchLeads()
                fetchDiagnosticos()
              }}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors"
              title="Recarregar dados"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoadingClientes || isLoadingLeads || isLoadingDiagnosticos ? 'animate-spin' : ''}`}
              />
            </button>
            <button
              onClick={
                activeTab === 'clientes'
                  ? handleExportClientesCSV
                  : activeTab === 'leads'
                    ? handleExportLeadsCSV
                    : handleExportDiagCSV
              }
              disabled={
                activeTab === 'clientes'
                  ? clientes.length === 0
                  : activeTab === 'leads'
                    ? leads.length === 0
                    : diagnosticos.length === 0
              }
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Exportar CSV (
              {activeTab === 'clientes'
                ? 'Clientes'
                : activeTab === 'leads'
                  ? 'Leads'
                  : 'Diagnósticos'}
              )
            </button>
            <button
              onClick={logout}
              className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-[#E74C3C] text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS: CLIENTES vs. LEADS vs. DIAGNÓSTICOS */}
        <div className="flex items-center gap-3 mb-6 border-b border-slate-200 pb-2 flex-wrap">
          <button
            onClick={() => setActiveTab('clientes')}
            className={`px-5 py-2.5 rounded-xl text-sm font-heading font-bold flex items-center gap-2 transition-all ${
              activeTab === 'clientes'
                ? 'bg-[#07132B] text-white shadow-sm ring-2 ring-[#D4AF37]/40'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-4 h-4 text-[#D4AF37]" />
            <span>Clientes & Empresas</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'clientes'
                  ? 'bg-[#D4AF37] text-[#07132B] font-bold'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {clientes.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('leads')}
            className={`px-5 py-2.5 rounded-xl text-sm font-heading font-bold flex items-center gap-2 transition-all ${
              activeTab === 'leads'
                ? 'bg-[#145A32] text-white shadow-sm ring-2 ring-[#2ECC71]/30'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Leads Capturados</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'leads'
                  ? 'bg-[#2ECC71] text-[#0A1A13]'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {leads.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('diagnosticos')}
            className={`px-5 py-2.5 rounded-xl text-sm font-heading font-bold flex items-center gap-2 transition-all ${
              activeTab === 'diagnosticos'
                ? 'bg-[#145A32] text-white shadow-sm ring-2 ring-[#2ECC71]/30'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Diagnósticos Tributários</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'diagnosticos'
                  ? 'bg-[#2ECC71] text-[#0A1A13]'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {diagnosticos.length}
            </span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* CONTEÚDO DA ABA 0: CLIENTES & EMPRESAS */}
        {/* ========================================================= */}
        {activeTab === 'clientes' && (
          <>
            {/* METRICS CARDS CLIENTES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase">
                    Total de Clientes
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-[#D4AF37] flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>
                <p className="font-heading font-extrabold text-3xl text-slate-900">
                  {clientes.length}
                </p>
                <span className="text-[11px] text-[#2ECC71] font-semibold mt-1 inline-block">
                  Contas cadastradas no portal
                </span>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase">
                    Faturamento Somado
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#145A32] flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <p className="font-heading font-extrabold text-2xl text-slate-900">
                  {formatarMoeda(clientes.reduce((acc, c) => acc + (c.faturamento_mensal || 0), 0))}
                </p>
                <span className="text-[11px] text-slate-400 mt-1 inline-block">
                  Receita mensal consolidada da carteira
                </span>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase">
                    Folha Somada
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <p className="font-heading font-extrabold text-2xl text-slate-900">
                  {formatarMoeda(
                    clientes.reduce((acc, c) => acc + (c.folha_pagamento_mensal || 0), 0),
                  )}
                </p>
                <span className="text-[11px] text-slate-400 mt-1 inline-block">
                  Folha mensal total informada
                </span>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase">
                    Simples Nacional
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <p className="font-heading font-extrabold text-3xl text-slate-900">
                  {clientes.filter((c) => c.regime_atual === 'Simples Nacional').length}
                </p>
                <span className="text-[11px] text-slate-400 mt-1 inline-block">
                  {clientes.length > 0
                    ? `${Math.round(
                        (clientes.filter((c) => c.regime_atual === 'Simples Nacional').length /
                          clientes.length) *
                          100,
                      )}% da base de clientes`
                    : '0%'}
                </span>
              </div>
            </div>

            {/* BUSCA E FILTROS DE CLIENTES */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm mb-6 flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="relative w-full lg:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por contato, empresa, CNPJ, e-mail ou cidade..."
                  value={clienteSearchTerm}
                  onChange={(e) => setClienteSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 input-focus-ring"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-medium">Segmento:</span>
                  <select
                    value={clienteFilterSegmento}
                    onChange={(e) => setClienteFilterSegmento(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white input-focus-ring"
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
                    value={clienteFilterRegime}
                    onChange={(e) => setClienteFilterRegime(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white input-focus-ring"
                  >
                    <option value="todos">Todos os Regimes</option>
                    <option value="Simples Nacional">Simples Nacional</option>
                    <option value="Lucro Presumido">Lucro Presumido</option>
                    <option value="Lucro Real">Lucro Real</option>
                    <option value="MEI">MEI</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-medium">UF:</span>
                  <select
                    value={clienteFilterUf}
                    onChange={(e) => setClienteFilterUf(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white input-focus-ring"
                  >
                    <option value="todos">Todas as UFs</option>
                    <option value="SP">SP</option>
                    <option value="RJ">RJ</option>
                    <option value="MG">MG</option>
                    <option value="PR">PR</option>
                    <option value="SC">SC</option>
                    <option value="RS">RS</option>
                    <option value="BA">BA</option>
                    <option value="GO">GO</option>
                    <option value="DF">DF</option>
                  </select>
                </div>
              </div>
            </div>

            {/* TABELA DE CLIENTES */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {isLoadingClientes ? (
                <div className="p-12 text-center text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#D4AF37]" />
                  <p className="text-sm">Carregando base de clientes...</p>
                </div>
              ) : filteredClientes.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p className="font-semibold text-slate-700">Nenhum cliente encontrado</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Os visitantes cadastrados pelo formulário de conta aparecerão aqui com todos os
                    dados salvos.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-4 px-6">Empresa & Contato</th>
                        <th className="py-4 px-6">Segmento & Local</th>
                        <th className="py-4 px-6">Faturamento & Folha</th>
                        <th className="py-4 px-6">Regime Atual</th>
                        <th className="py-4 px-6">Diagnósticos</th>
                        <th className="py-4 px-6">Data Cadastro</th>
                        <th className="py-4 px-6 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredClientes.map((item) => {
                        // Encontra diagnósticos vinculados por user_id, email ou CNPJ
                        const diagsVinculados = diagnosticos.filter(
                          (d) =>
                            (item.user_id && (d as any).user_id === item.user_id) ||
                            (item.email && d.email?.toLowerCase() === item.email.toLowerCase()) ||
                            (item.cnpj && d.cnpj && d.cnpj === item.cnpj),
                        )
                        const ultimoDiag = diagsVinculados[0]

                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                            onClick={() => setSelectedCliente(item)}
                          >
                            <td className="py-4 px-6">
                              <div className="font-bold text-slate-900 group-hover:text-[#145A32] transition-colors flex items-center gap-1.5">
                                <span>{item.nome_empresa}</span>
                              </div>
                              <div className="text-xs font-mono text-slate-500">
                                CNPJ: {item.cnpj || 'Não informado'}
                              </div>
                              <div className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                                <span>{item.nome_contato}</span>
                                <span>•</span>
                                <span>{item.email}</span>
                              </div>
                              <div className="text-xs text-slate-500">{item.telefone}</div>
                            </td>

                            <td className="py-4 px-6">
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#07132B]/5 text-[#07132B] border border-slate-200">
                                {item.segmento}
                              </span>
                              <div className="text-xs text-slate-600 mt-1 font-medium flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span>
                                  {item.cidade || 'São Paulo'} / {item.uf_origem || 'SP'}
                                </span>
                              </div>
                            </td>

                            <td className="py-4 px-6">
                              <div className="font-bold text-slate-900">
                                {formatarMoeda(item.faturamento_mensal || 0)}
                                <span className="text-[10px] font-normal text-slate-400">/mês</span>
                              </div>
                              <div className="text-[11px] text-slate-500">
                                Anual: {formatarMoeda((item.faturamento_mensal || 0) * 12)}
                              </div>
                              <div className="text-[11px] text-slate-600 mt-0.5">
                                Folha: {formatarMoeda(item.folha_pagamento_mensal || 0)}/mês
                              </div>
                            </td>

                            <td className="py-4 px-6">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  item.regime_atual === 'Simples Nacional'
                                    ? 'bg-emerald-100 text-[#145A32]'
                                    : item.regime_atual === 'Lucro Presumido'
                                      ? 'bg-amber-100 text-amber-900'
                                      : 'bg-purple-100 text-purple-900'
                                }`}
                              >
                                {item.regime_atual || 'Não inf.'}
                              </span>
                              {item.funcionarios && (
                                <div className="text-[11px] text-slate-500 mt-1">
                                  {item.funcionarios}
                                </div>
                              )}
                            </td>

                            <td className="py-4 px-6">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-800">
                                  {diagsVinculados.length}
                                </span>
                                <span className="text-xs text-slate-500">diagnóstico(s)</span>
                              </div>
                              {ultimoDiag && (
                                <div className="text-[11px] text-[#145A32] font-semibold mt-0.5">
                                  Recom.:{' '}
                                  {ultimoDiag.sistema_recomendado_novo ||
                                    ultimoDiag.regime_recomendado}
                                </div>
                              )}
                            </td>

                            <td className="py-4 px-6 text-xs text-slate-500">
                              {item.created
                                ? new Date(item.created).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                  })
                                : '—'}
                            </td>

                            <td
                              className="py-4 px-6 text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setSelectedCliente(item)}
                                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                                >
                                  Ver perfil
                                </button>
                                <button
                                  onClick={() => setClienteToDelete(item)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#E74C3C] hover:bg-red-50 transition-colors"
                                  title="Excluir cliente"
                                >
                                  <Trash2 className="w-4 h-4" />
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

        {/* ========================================================= */}
        {/* CONTEÚDO DA ABA 1: LEADS */}
        {/* ========================================================= */}
        {activeTab === 'leads' && (
          <>
            {/* METRICS CARDS LEADS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase">
                    Total de Leads
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#145A32] flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <p className="font-heading font-extrabold text-3xl text-slate-900">
                  {leads.length}
                </p>
                <span className="text-[11px] text-[#2ECC71] font-semibold mt-1 inline-block">
                  Atualizado em tempo real
                </span>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Tecnologia</span>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <p className="font-heading font-extrabold text-3xl text-slate-900">
                  {leads.filter((l) => l.segmento === 'Tecnologia').length}
                </p>
                <span className="text-[11px] text-slate-400 mt-1 inline-block">
                  {leads.length > 0
                    ? `${Math.round((leads.filter((l) => l.segmento === 'Tecnologia').length / leads.length) * 100)}% do total`
                    : '0%'}
                </span>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase">
                    Varejo & Serviços
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Building className="w-5 h-5" />
                  </div>
                </div>
                <p className="font-heading font-extrabold text-3xl text-slate-900">
                  {leads.filter((l) => l.segmento === 'Varejo' || l.segmento === 'Serviços').length}
                </p>
                <span className="text-[11px] text-slate-400 mt-1 inline-block">
                  Operações comerciais
                </span>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase">
                    Empresas 20+ func.
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Layers className="w-5 h-5" />
                  </div>
                </div>
                <p className="font-heading font-extrabold text-3xl text-slate-900">
                  {
                    leads.filter(
                      (l) =>
                        l.funcionarios === '21–50' ||
                        l.funcionarios === '51–200' ||
                        l.funcionarios === 'Mais de 200',
                    ).length
                  }
                </p>
                <span className="text-[11px] text-purple-600 font-semibold mt-1 inline-block">
                  Média e grande porte
                </span>
              </div>
            </div>

            {/* FILTROS E BUSCA LEADS */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nome, empresa, CNPJ ou telefone..."
                  value={diagSearchTerm}
                  onChange={(e) => setDiagSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 input-focus-ring"
                />{' '}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-xs text-slate-500 font-medium shrink-0">Segmento:</span>
                <select
                  value={filterSegment}
                  onChange={(e) => setFilterSegment(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 bg-white input-focus-ring w-full sm:w-auto"
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
            </div>

            {/* TABELA DE LEADS */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {isLoadingLeads ? (
                <div className="p-12 text-center text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#2ECC71]" />
                  <p className="text-sm">Carregando leads...</p>
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p className="font-semibold text-slate-700">Nenhum lead encontrado</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Tente ajustar os filtros ou aguarde novos cadastros através do site.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-4 px-6">Contato</th>
                        <th className="py-4 px-6">Empresa & Segmento</th>
                        <th className="py-4 px-6">Porte</th>
                        <th className="py-4 px-6">Data de Recebimento</th>
                        <th className="py-4 px-6 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredLeads.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                          onClick={() => setSelectedLead(item)}
                        >
                          <td className="py-4 px-6">
                            <div className="font-semibold text-slate-900 group-hover:text-[#145A32] transition-colors">
                              {item.nome}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3" />
                              <span>{item.email}</span>
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3" />
                              <span>{item.telefone}</span>
                            </div>
                          </td>

                          <td className="py-4 px-6">
                            <div className="font-semibold text-slate-800">{item.empresa}</div>
                            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-[#145A32] border border-emerald-200">
                              {item.segmento}
                            </span>
                          </td>

                          <td className="py-4 px-6">
                            <span className="text-xs text-slate-700 font-medium">
                              {item.funcionarios} func.
                            </span>
                          </td>

                          <td className="py-4 px-6 text-xs text-slate-500">
                            {item.created
                              ? new Date(item.created).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </td>

                          <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedLead(item)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                              >
                                Ver detalhes
                              </button>
                              <button
                                onClick={() => setLeadToDelete(item)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-[#E74C3C] hover:bg-red-50 transition-colors"
                                title="Excluir lead"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* CONTEÚDO DA ABA 2: DIAGNÓSTICOS TRIBUTÁRIOS */}
        {/* ========================================================= */}
        {activeTab === 'diagnosticos' && (
          <>
            {/* METRICS CARDS DIAGNÓSTICOS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase">
                    Total Diagnósticos
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#145A32] flex items-center justify-center">
                    <Calculator className="w-5 h-5" />
                  </div>
                </div>
                <p className="font-heading font-extrabold text-3xl text-slate-900">
                  {diagnosticos.length}
                </p>
                <span className="text-[11px] text-[#2ECC71] font-semibold mt-1 inline-block">
                  Simulações realizadas
                </span>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase">
                    Simples Nacional
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>
                <p className="font-heading font-extrabold text-3xl text-slate-900">
                  {diagnosticos.filter((d) => d.regime_recomendado === 'Simples Nacional').length}
                </p>
                <span className="text-[11px] text-slate-400 mt-1 inline-block">
                  {diagnosticos.length > 0
                    ? `${Math.round(
                        (diagnosticos.filter((d) => d.regime_recomendado === 'Simples Nacional')
                          .length /
                          diagnosticos.length) *
                          100,
                      )}% das recomendações`
                    : '0%'}
                </span>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase">
                    Lucro Presumido
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Building className="w-5 h-5" />
                  </div>
                </div>
                <p className="font-heading font-extrabold text-3xl text-slate-900">
                  {diagnosticos.filter((d) => d.regime_recomendado === 'Lucro Presumido').length}
                </p>
                <span className="text-[11px] text-slate-400 mt-1 inline-block">
                  Margem presumida favorável
                </span>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Lucro Real</span>
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <p className="font-heading font-extrabold text-3xl text-slate-900">
                  {diagnosticos.filter((d) => d.regime_recomendado === 'Lucro Real').length}
                </p>
                <span className="text-[11px] text-purple-600 font-semibold mt-1 inline-block">
                  Alta escala ou baixa margem
                </span>
              </div>
            </div>

            {/* FILTROS E BUSCA DIAGNÓSTICOS */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por empresa, nome ou e-mail..."
                  value={diagSearchTerm}
                  onChange={(e) => setDiagSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 input-focus-ring"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium shrink-0">Regime:</span>
                  <select
                    value={diagFilterRegime}
                    onChange={(e) => setDiagFilterRegime(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 bg-white input-focus-ring"
                  >
                    <option value="todos">Todos os Regimes</option>
                    <option value="Simples Nacional">Simples Nacional</option>
                    <option value="Lucro Presumido">Lucro Presumido</option>
                    <option value="Lucro Real">Lucro Real</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium shrink-0">Segmento:</span>
                  <select
                    value={diagFilterSegmento}
                    onChange={(e) => setDiagFilterSegmento(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 bg-white input-focus-ring"
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
              </div>
            </div>

            {/* TABELA DE DIAGNÓSTICOS */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {isLoadingDiagnosticos ? (
                <div className="p-12 text-center text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#2ECC71]" />
                  <p className="text-sm">Carregando diagnósticos tributários...</p>
                </div>
              ) : filteredDiagnosticos.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p className="font-semibold text-slate-700">Nenhum diagnóstico encontrado</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Simulações realizadas na página <strong>/diagnostico</strong> aparecerão
                    listadas aqui automaticamente.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-4 px-6">Empresa & Contato</th>
                        <th className="py-4 px-6">Segmento</th>
                        <th className="py-4 px-6">RBT12 (Receita)</th>
                        <th className="py-4 px-6">Novo Sistema (IBS/CBS)</th>
                        <th className="py-4 px-6">Sistema Atual</th>
                        <th className="py-4 px-6">Economia Est.</th>
                        <th className="py-4 px-6">Data</th>
                        <th className="py-4 px-6 text-right">Ações</th>
                      </tr>
                    </thead>{' '}
                    <tbody className="divide-y divide-slate-100">
                      {filteredDiagnosticos.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                          onClick={() => setSelectedDiag(item)}
                        >
                          <td className="py-4 px-6">
                            <div className="font-semibold text-slate-900 group-hover:text-[#145A32] transition-colors">
                              {item.empresa}
                            </div>
                            {item.cnpj && (
                              <div className="text-xs font-mono text-slate-600 mt-0.5">
                                CNPJ: {item.cnpj}
                              </div>
                            )}
                            <div className="text-xs text-slate-500 mt-0.5">
                              {item.nome} • {item.telefone}
                            </div>
                            {item.cidade && (
                              <div className="text-[11px] text-[#145A32] font-medium mt-0.5">
                                📍 {item.cidade}{' '}
                                {item.aliquota_iss ? `(ISS: ${item.aliquota_iss}%)` : ''}
                              </div>
                            )}
                          </td>

                          <td className="py-4 px-6">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                              {item.segmento}
                            </span>
                            {item.uf_origem && (
                              <div className="text-[10px] text-slate-500 mt-1 font-semibold">
                                UF: {item.uf_origem}{' '}
                                {item.aliquota_icms ? `(ICMS ${item.aliquota_icms}%)` : ''}
                              </div>
                            )}
                          </td>

                          <td className="py-4 px-6">
                            <div className="font-semibold text-slate-900">
                              R${' '}
                              {item.rbt12?.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {item.folha_pagamento ? (
                                <>Folha: R$ {item.folha_pagamento.toLocaleString('pt-BR')}/mês</>
                              ) : (
                                <>Folha 12m: R$ {item.folha12?.toLocaleString('pt-BR')}</>
                              )}
                              {item.rbt12
                                ? ` (Fator R: ${(((item.folha_pagamento ? item.folha_pagamento * 12 : item.folha12 || 0) / item.rbt12) * 100).toFixed(1)}%)`
                                : ''}
                            </div>
                            {item.despesas_creditos !== undefined && item.despesas_creditos > 0 && (
                              <div className="text-[10px] text-emerald-700 font-medium">
                                Créditos: R$ {item.despesas_creditos.toLocaleString('pt-BR')}/mês
                              </div>
                            )}
                            {item.percentual_exportacao !== undefined &&
                              item.percentual_exportacao > 0 && (
                                <div className="text-[10px] text-blue-600 font-medium">
                                  Exportação: {item.percentual_exportacao}%
                                </div>
                              )}
                          </td>

                          <td className="py-4 px-6">
                            <div className="flex flex-col gap-1">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold w-fit ${
                                  (item.sistema_recomendado_novo || item.regime_recomendado) ===
                                  'Simples Nacional'
                                    ? 'bg-emerald-100 text-[#145A32]'
                                    : (item.sistema_recomendado_novo || item.regime_recomendado) ===
                                        'Lucro Presumido'
                                      ? 'bg-amber-100 text-amber-900'
                                      : 'bg-purple-100 text-purple-900'
                                }`}
                              >
                                <Sparkles className="w-3 h-3" />
                                {item.sistema_recomendado_novo || item.regime_recomendado}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium">
                                Ano-Base: {item.ano_base || 2026}
                              </span>
                            </div>
                          </td>

                          <td className="py-4 px-6">
                            <span className="text-xs text-slate-700 font-medium">
                              {item.sistema_recomendado_atual || item.regime_recomendado}
                            </span>
                          </td>

                          <td className="py-4 px-6">
                            <span className="font-semibold text-[#145A32]">
                              R${' '}
                              {(
                                item.economia_anual_novo ||
                                item.economia_anual ||
                                0
                              ).toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                            <span className="text-[10px] text-slate-400 block">/ano</span>
                          </td>
                          <td className="py-4 px-6 text-xs text-slate-500">
                            {item.created
                              ? new Date(item.created).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </td>

                          <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedDiag(item)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                              >
                                Ver detalhes
                              </button>
                              <button
                                onClick={() => setDiagToDelete(item)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-[#E74C3C] hover:bg-red-50 transition-colors"
                                title="Excluir diagnóstico"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* MODAL DETALHES DO LEAD */}
      {selectedLead && (
        <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
          <DialogContent className="sm:max-w-lg bg-white rounded-2xl p-6 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-heading font-bold text-xl text-slate-900">
                Detalhes do Lead
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Recebido em{' '}
                {selectedLead.created
                  ? new Date(selectedLead.created).toLocaleString('pt-BR')
                  : '—'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-4 text-sm">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase block">Nome</span>
                  <span className="font-semibold text-slate-900">{selectedLead.nome}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase block">
                    Empresa
                  </span>
                  <span className="font-semibold text-slate-900">{selectedLead.empresa}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase block">
                    E-mail
                  </span>
                  <a
                    href={`mailto:${selectedLead.email}`}
                    className="text-[#145A32] underline hover:text-[#2ECC71]"
                  >
                    {selectedLead.email}
                  </a>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase block">
                    Telefone
                  </span>
                  <a
                    href={`https://wa.me/${selectedLead.telefone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#145A32] underline hover:text-[#2ECC71]"
                  >
                    {selectedLead.telefone}
                  </a>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase block">
                    Segmento
                  </span>
                  <span className="text-slate-800">{selectedLead.segmento}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase block">
                    Porte
                  </span>
                  <span className="text-slate-800">{selectedLead.funcionarios} colaboradores</span>
                </div>
              </div>

              {selectedLead.mensagem && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-400 uppercase block mb-1">
                    Mensagem do Lead
                  </span>
                  <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-wrap">
                    {selectedLead.mensagem}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedLead(null)}
                className="rounded-xl"
              >
                Fechar
              </Button>
              <a
                href={`https://wa.me/${selectedLead.telefone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60]"
              >
                Chamar no WhatsApp
              </a>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL DETALHES DO DIAGNÓSTICO */}
      {selectedDiag && (
        <Dialog open={!!selectedDiag} onOpenChange={(open) => !open && setSelectedDiag(null)}>
          <DialogContent className="sm:max-w-xl bg-white rounded-2xl p-6 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-heading font-bold text-xl text-slate-900 flex items-center justify-between">
                <span>Diagnóstico Tributário</span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-[#145A32]">
                  Novo: {selectedDiag.sistema_recomendado_novo || selectedDiag.regime_recomendado} (
                  {selectedDiag.ano_base || 2026})
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Calculado em{' '}
                {selectedDiag.created
                  ? new Date(selectedDiag.created).toLocaleString('pt-BR')
                  : '—'}{' '}
                • Sistema Atual:{' '}
                <strong>
                  {selectedDiag.sistema_recomendado_atual || selectedDiag.regime_recomendado}
                </strong>
              </DialogDescription>{' '}
            </DialogHeader>

            <div className="space-y-4 my-4 text-sm">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase block">
                    Empresa
                  </span>
                  <strong className="text-slate-900">{selectedDiag.empresa}</strong>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase block">CNPJ</span>
                  <strong className="text-slate-900 font-mono">
                    {selectedDiag.cnpj || 'Não informado'}
                  </strong>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase block">
                    Contato
                  </span>
                  <span className="text-slate-800">{selectedDiag.nome}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase block">
                    Segmento
                  </span>
                  <span className="text-slate-800">{selectedDiag.segmento}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase block">
                    WhatsApp
                  </span>
                  <a
                    href={`https://wa.me/${selectedDiag.telefone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#145A32] underline hover:text-[#2ECC71]"
                  >
                    {selectedDiag.telefone}
                  </a>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase block">
                    Cidade / UF
                  </span>
                  <span className="text-slate-800 font-medium">
                    {selectedDiag.cidade || 'Não informada'}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase block">
                    Alíquota ISS Aplicada
                  </span>
                  <span className="text-[#145A32] font-bold">
                    {selectedDiag.aliquota_iss ? `${selectedDiag.aliquota_iss}%` : '2,0% (padrão)'}
                  </span>
                </div>
              </div>

              {/* Parâmetros do cálculo */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-slate-400 uppercase block mb-2">
                  Parâmetros Informados
                </span>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block">RBT12:</span>
                    <strong className="text-slate-900">
                      R$ {selectedDiag.rbt12?.toLocaleString('pt-BR')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Folha Mensal:</span>
                    <strong className="text-slate-900">
                      {selectedDiag.folha_pagamento
                        ? `R$ ${selectedDiag.folha_pagamento.toLocaleString('pt-BR')}/mês`
                        : `R$ ${Math.round((selectedDiag.folha12 || 0) / 12).toLocaleString('pt-BR')}/mês`}
                    </strong>
                    <span className="text-[10px] text-slate-400 block">
                      12m: R${' '}
                      {(selectedDiag.folha_pagamento
                        ? selectedDiag.folha_pagamento * 12
                        : selectedDiag.folha12 || 0
                      ).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Fator R / Margem:</span>
                    <strong className="text-[#145A32]">
                      {selectedDiag.rbt12
                        ? `${(((selectedDiag.folha_pagamento ? selectedDiag.folha_pagamento * 12 : selectedDiag.folha12 || 0) / selectedDiag.rbt12) * 100).toFixed(1)}%`
                        : '0%'}
                    </strong>
                    <span className="text-[10px] text-slate-500 block">
                      Margem Lucro: {selectedDiag.margem_lucro}%
                    </span>
                  </div>
                </div>

                {/* Novos parâmetros Módulo 3 */}
                <div className="mt-3 pt-3 border-t border-slate-200/70 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block">UF de Origem:</span>
                    <strong className="text-slate-800">
                      {selectedDiag.uf_origem || 'SP'} ({selectedDiag.aliquota_icms || 18.0}% ICMS)
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Despesas c/ Créditos:</span>
                    <strong className="text-slate-800">
                      {selectedDiag.despesas_creditos
                        ? `R$ ${selectedDiag.despesas_creditos.toLocaleString('pt-BR')}/mês`
                        : 'R$ 0,00'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Exportação:</span>
                    <strong className="text-slate-800">
                      {selectedDiag.percentual_exportacao || 0}% da receita
                    </strong>
                  </div>
                </div>

                {/* Novos dados do diagnóstico */}
                <div className="mt-3 pt-3 border-t border-slate-200/70 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block">Regime Atual:</span>
                    <strong className="text-slate-800">
                      {selectedDiag.regime_atual || 'Não inf.'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Equipe:</span>
                    <strong className="text-slate-800">
                      {selectedDiag.funcionarios || 'Não inf.'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Emissão NF:</span>
                    <strong
                      className="text-slate-800 truncate block"
                      title={selectedDiag.emissao_nf}
                    >
                      {selectedDiag.emissao_nf
                        ? selectedDiag.emissao_nf.replace('Predominante para ', '')
                        : 'Não inf.'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Ativ. Mista:</span>
                    <strong className="text-slate-800">
                      {selectedDiag.atividade_mista ? 'Sim (Comércio+Serviço)' : 'Não'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Comparativo das cargas anuais (Novo Sistema vs Sistema Atual) */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                <div>
                  <span className="text-xs font-semibold text-[#145A32] uppercase block mb-1">
                    Novo Código Tributário (Ano-Base {selectedDiag.ano_base || 2026} · IBS / CBS)
                  </span>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-700">Simples Nacional (Novo):</span>
                    <span className="font-bold text-slate-900">
                      {(selectedDiag.carga_simples_novo || selectedDiag.carga_simples) > 0
                        ? `R$ ${(selectedDiag.carga_simples_novo || selectedDiag.carga_simples).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : 'Não elegível (> 4,8M)'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs mt-1">
                    <span className="font-medium text-slate-700">Lucro Presumido (Novo):</span>
                    <span className="font-bold text-slate-900">
                      {(selectedDiag.carga_presumido_novo || selectedDiag.carga_presumido) > 0
                        ? `R$ ${(selectedDiag.carga_presumido_novo || selectedDiag.carga_presumido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : 'Não elegível (> 78M)'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs mt-1">
                    <span className="font-medium text-slate-700">Lucro Real (Novo):</span>
                    <span className="font-bold text-slate-900">
                      R${' '}
                      {(selectedDiag.carga_real_novo || selectedDiag.carga_real)?.toLocaleString(
                        'pt-BR',
                        { minimumFractionDigits: 2 },
                      )}
                    </span>
                  </div>
                  {selectedDiag.economia_anual_novo || selectedDiag.economia_anual ? (
                    <div className="pt-1.5 mt-1.5 border-t border-slate-200 flex justify-between items-center text-xs text-[#145A32]">
                      <span className="font-bold">Economia Anual Projetada:</span>
                      <span className="font-extrabold text-sm text-[#145A32]">
                        R${' '}
                        {(
                          selectedDiag.economia_anual_novo ||
                          selectedDiag.economia_anual ||
                          0
                        ).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">
                    Sistema Atual (Para Comparação)
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600">
                    <div>
                      Simples: R${' '}
                      {selectedDiag.carga_simples?.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                    <div>
                      Presumido: R${' '}
                      {selectedDiag.carga_presumido?.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                    <div>
                      Real: R${' '}
                      {selectedDiag.carga_real?.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                </div>
                {/* Se houver ranking_json gravado */}
                {Array.isArray(selectedDiag.ranking_json) &&
                  selectedDiag.ranking_json.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase block mb-2">
                        Ranking Calculado dos 3 Regimes
                      </span>
                      <div className="space-y-1.5">
                        {selectedDiag.ranking_json.map((rk) => (
                          <div
                            key={rk.regime}
                            className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-white border border-slate-100"
                          >
                            <span className="font-medium text-slate-700">
                              #{rk.posicao} {rk.regime}
                            </span>
                            <span className="font-bold text-slate-900">
                              {rk.elegivel
                                ? `R$ ${rk.cargaAnual?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${rk.aliquotaEfetiva}%)`
                                : 'Inelegível'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedDiag(null)}
                className="rounded-xl"
              >
                Fechar
              </Button>
              <a
                href={`https://wa.me/${selectedDiag.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Olá ${selectedDiag.nome}! Recebemos seu diagnóstico tributário para a empresa ${selectedDiag.empresa} (regime sugerido: ${selectedDiag.regime_recomendado}). Podemos alinhar os próximos passos?`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60]"
              >
                Contatar no WhatsApp
              </a>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* DIÁLOGO CONFIRMAÇÃO DE EXCLUSÃO LEADS */}
      {leadToDelete && (
        <Dialog open={!!leadToDelete} onOpenChange={(open) => !open && setLeadToDelete(null)}>
          <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-heading font-bold text-lg text-slate-900">
                Confirmar exclusão
              </DialogTitle>
              <DialogDescription className="text-slate-600 text-sm mt-2">
                Tem certeza que deseja excluir o lead de{' '}
                <strong className="text-slate-900">{leadToDelete.nome}</strong> (
                {leadToDelete.empresa})? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                disabled={isDeletingLead}
                onClick={() => setLeadToDelete(null)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                disabled={isDeletingLead}
                onClick={handleDeleteLeadConfirm}
                className="bg-[#E74C3C] hover:bg-red-700 text-white rounded-xl"
              >
                {isDeletingLead ? 'Excluindo...' : 'Excluir Lead'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL DETALHES DO CLIENTE */}
      {selectedCliente && (
        <Dialog open={!!selectedCliente} onOpenChange={(open) => !open && setSelectedCliente(null)}>
          <DialogContent className="sm:max-w-2xl bg-white rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading font-bold text-xl text-slate-900 flex items-center justify-between">
                <span>Perfil Completo do Cliente</span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-[#145A32]">
                  {selectedCliente.regime_atual || 'Regime não inf.'}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Cadastrado em{' '}
                {selectedCliente.created
                  ? new Date(selectedCliente.created).toLocaleString('pt-BR')
                  : '—'}
                {selectedCliente.user_id && ` • ID do Usuário: ${selectedCliente.user_id}`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-4 text-sm">
              {/* BLOCO 1: DADOS CADASTRAIS & LOCALIZAÇÃO */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase block">
                    Razão / Empresa
                  </span>
                  <strong className="text-slate-900">{selectedCliente.nome_empresa}</strong>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase block">CNPJ</span>
                  <strong className="text-slate-900 font-mono">
                    {selectedCliente.cnpj || 'Não informado'}
                  </strong>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase block">
                    Nome do Contato
                  </span>
                  <span className="text-slate-800 font-medium">{selectedCliente.nome_contato}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase block">
                    E-mail
                  </span>
                  <a
                    href={`mailto:${selectedCliente.email}`}
                    className="text-[#145A32] underline hover:text-[#2ECC71] break-all"
                  >
                    {selectedCliente.email}
                  </a>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase block">
                    WhatsApp / Telefone
                  </span>
                  <a
                    href={`https://wa.me/${selectedCliente.telefone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#145A32] underline hover:text-[#2ECC71]"
                  >
                    {selectedCliente.telefone}
                  </a>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase block">
                    Cidade / UF
                  </span>
                  <span className="text-slate-800 font-medium">
                    {selectedCliente.cidade} / {selectedCliente.uf_origem}
                  </span>
                </div>
              </div>

              {/* BLOCO 2: DADOS OPERACIONAIS E FATURAMENTO */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-slate-400 uppercase block mb-3">
                  Parâmetros Financeiros & Tributários (Dados da Empresa)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Faturamento Mensal:</span>
                    <strong className="text-slate-900 text-sm">
                      {formatarMoeda(selectedCliente.faturamento_mensal || 0)}
                    </strong>
                    <span className="text-[10px] text-slate-400 block">
                      RBT12: {formatarMoeda((selectedCliente.faturamento_mensal || 0) * 12)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Folha Mensal:</span>
                    <strong className="text-slate-900 text-sm">
                      {formatarMoeda(selectedCliente.folha_pagamento_mensal || 0)}
                    </strong>
                    <span className="text-[10px] text-slate-400 block">
                      12m: {formatarMoeda((selectedCliente.folha_pagamento_mensal || 0) * 12)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Margem Estimada:</span>
                    <strong className="text-[#145A32] text-sm">
                      {selectedCliente.margem_lucro_estimada ?? 20}%
                    </strong>
                    <span className="text-[10px] text-slate-400 block">Lucro operacional</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Despesas c/ Créditos:</span>
                    <strong className="text-slate-900 text-sm">
                      {formatarMoeda(selectedCliente.despesas_creditos_mensais || 0)}
                    </strong>
                    <span className="text-[10px] text-slate-400 block">Para IBS/CBS</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200/70 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Segmento:</span>
                    <strong className="text-slate-800">{selectedCliente.segmento}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Equipe:</span>
                    <strong className="text-slate-800">
                      {selectedCliente.funcionarios || 'Não inf.'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Emissão NF:</span>
                    <strong className="text-slate-800">
                      {selectedCliente.emissao_nf || 'Predominante B2B'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Exportação:</span>
                    <strong className="text-slate-800">
                      {selectedCliente.percentual_exportacao || 0}%
                    </strong>
                  </div>
                </div>
              </div>

              {/* BLOCO 3: DIAGNÓSTICOS VINCULADOS */}
              {(() => {
                const diags = diagnosticos.filter(
                  (d) =>
                    (selectedCliente.user_id && (d as any).user_id === selectedCliente.user_id) ||
                    (selectedCliente.email &&
                      d.email?.toLowerCase() === selectedCliente.email.toLowerCase()) ||
                    (selectedCliente.cnpj && d.cnpj && d.cnpj === selectedCliente.cnpj),
                )
                return (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-400 uppercase">
                        Diagnósticos Vinculados ({diags.length})
                      </span>
                    </div>

                    {diags.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">
                        Nenhum diagnóstico vinculado até o momento.
                      </p>
                    ) : (
                      <div className="space-y-2 mt-2">
                        {diags.map((d) => (
                          <div
                            key={d.id}
                            className="p-3 rounded-lg bg-white border border-slate-200 text-xs flex items-center justify-between gap-3"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">
                                  {d.sistema_recomendado_novo || d.regime_recomendado}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-[#145A32] font-semibold">
                                  Economia:{' '}
                                  {formatarMoeda(d.economia_anual_novo || d.economia_anual || 0)}
                                  /ano
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Realizado em {new Date(d.created || '').toLocaleDateString(
                                  'pt-BR',
                                )}{' '}
                                • Ano-base {d.ano_base || 2026}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedCliente(null)
                                setSelectedDiag(d)
                              }}
                              className="px-2.5 py-1 rounded-md border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Ver diagnóstico
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedCliente(null)}
                className="rounded-xl"
              >
                Fechar
              </Button>
              <a
                href={`https://wa.me/${selectedCliente.telefone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60]"
              >
                Contato via WhatsApp
              </a>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* DIÁLOGO CONFIRMAÇÃO DE EXCLUSÃO CLIENTE */}
      {clienteToDelete && (
        <Dialog open={!!clienteToDelete} onOpenChange={(open) => !open && setClienteToDelete(null)}>
          <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-heading font-bold text-lg text-slate-900">
                Confirmar exclusão de cliente
              </DialogTitle>
              <DialogDescription className="text-slate-600 text-sm mt-2">
                Tem certeza que deseja excluir o cadastro da empresa{' '}
                <strong className="text-slate-900">{clienteToDelete.nome_empresa}</strong> (
                {clienteToDelete.nome_contato})? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                disabled={isDeletingCliente}
                onClick={() => setClienteToDelete(null)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                disabled={isDeletingCliente}
                onClick={handleDeleteClienteConfirm}
                className="bg-[#E74C3C] hover:bg-red-700 text-white rounded-xl"
              >
                {isDeletingCliente ? 'Excluindo...' : 'Excluir Cliente'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* DIÁLOGO CONFIRMAÇÃO DE EXCLUSÃO DIAGNÓSTICOS */}
      {diagToDelete && (
        <Dialog open={!!diagToDelete} onOpenChange={(open) => !open && setDiagToDelete(null)}>
          <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-heading font-bold text-lg text-slate-900">
                Confirmar exclusão do diagnóstico
              </DialogTitle>
              <DialogDescription className="text-slate-600 text-sm mt-2">
                Tem certeza que deseja excluir o diagnóstico da empresa{' '}
                <strong className="text-slate-900">{diagToDelete.empresa}</strong>? Esta ação não
                pode ser desfeita.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                disabled={isDeletingDiag}
                onClick={() => setDiagToDelete(null)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                disabled={isDeletingDiag}
                onClick={handleDeleteDiagConfirm}
                className="bg-[#E74C3C] hover:bg-red-700 text-white rounded-xl"
              >
                {isDeletingDiag ? 'Excluindo...' : 'Excluir Diagnóstico'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
