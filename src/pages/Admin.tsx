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
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getLeads, deleteLead, type LeadRecord } from '@/services/leads'
import { getDiagnosticos, deleteDiagnostico, type DiagnosticoRecord } from '@/services/diagnosticos'
import { useRealtime } from '@/hooks/use-realtime'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type TabTipo = 'leads' | 'diagnosticos'

export default function Admin() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<TabTipo>('leads')

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
    fetchLeads()
    fetchDiagnosticos()
  }, [])

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
      item.telefone?.includes(term) ||
      item.segmento?.toLowerCase().includes(term)

    const matchesRegime =
      diagFilterRegime === 'todos' || item.regime_recomendado === diagFilterRegime

    const matchesSegmento =
      diagFilterSegmento === 'todos' ||
      item.segmento?.toLowerCase() === diagFilterSegmento.toLowerCase()

    return matchesSearch && matchesRegime && matchesSegmento
  })

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
      'Segmento',
      'RBT12',
      'Folha12',
      'MargemLucro',
      'RegimeRecomendado',
      'CargaSimples',
      'CargaPresumido',
      'CargaReal',
      'EconomiaAnual',
      'Data',
    ]
    const rows = diagnosticos.map((d) => [
      d.id,
      `"${d.nome || ''}"`,
      `"${d.email || ''}"`,
      `"${d.telefone || ''}"`,
      `"${d.empresa || ''}"`,
      `"${d.segmento || ''}"`,
      d.rbt12 || 0,
      d.folha12 || 0,
      d.margem_lucro || 0,
      `"${d.regime_recomendado || ''}"`,
      d.carga_simples || 0,
      d.carga_presumido || 0,
      d.carga_real || 0,
      d.economia_anual || 0,
      d.created ? new Date(d.created).toLocaleDateString('pt-BR') : '',
    ])
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
                fetchLeads()
                fetchDiagnosticos()
              }}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors"
              title="Recarregar dados"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoadingLeads || isLoadingDiagnosticos ? 'animate-spin' : ''}`}
              />
            </button>
            <button
              onClick={activeTab === 'leads' ? handleExportLeadsCSV : handleExportDiagCSV}
              disabled={activeTab === 'leads' ? leads.length === 0 : diagnosticos.length === 0}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Exportar CSV ({activeTab === 'leads' ? 'Leads' : 'Diagnósticos'})
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

        {/* NAVEGAÇÃO DE ABAS: LEADS vs. DIAGNÓSTICOS */}
        <div className="flex items-center gap-3 mb-6 border-b border-slate-200 pb-2">
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
                  placeholder="Buscar por nome, e-mail ou empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 input-focus-ring"
                />
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
                        <th className="py-4 px-6">RBT12 (Receita Bruta)</th>
                        <th className="py-4 px-6">Regime Sugerido</th>
                        <th className="py-4 px-6">Economia Est.</th>
                        <th className="py-4 px-6">Data</th>
                        <th className="py-4 px-6 text-right">Ações</th>
                      </tr>
                    </thead>
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
                            <div className="text-xs text-slate-500 mt-0.5">
                              {item.nome} • {item.telefone}
                            </div>
                          </td>

                          <td className="py-4 px-6">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                              {item.segmento}
                            </span>
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
                              Folha: R$ {item.folha12?.toLocaleString('pt-BR')} (
                              {item.rbt12 ? ((item.folha12 / item.rbt12) * 100).toFixed(1) : 0}%)
                            </div>
                          </td>

                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                item.regime_recomendado === 'Simples Nacional'
                                  ? 'bg-emerald-100 text-[#145A32]'
                                  : item.regime_recomendado === 'Lucro Presumido'
                                    ? 'bg-amber-100 text-amber-900'
                                    : 'bg-purple-100 text-purple-900'
                              }`}
                            >
                              <Sparkles className="w-3 h-3" />
                              {item.regime_recomendado}
                            </span>
                          </td>

                          <td className="py-4 px-6">
                            <span className="font-semibold text-[#145A32]">
                              R${' '}
                              {(item.economia_anual || 0).toLocaleString('pt-BR', {
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
                  {selectedDiag.regime_recomendado}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Calculado em{' '}
                {selectedDiag.created
                  ? new Date(selectedDiag.created).toLocaleString('pt-BR')
                  : '—'}
              </DialogDescription>
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
                    <span className="text-slate-500 block">Folha 12m:</span>
                    <strong className="text-slate-900">
                      R$ {selectedDiag.folha12?.toLocaleString('pt-BR')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Margem Líquida:</span>
                    <strong className="text-slate-900">{selectedDiag.margem_lucro}%</strong>
                  </div>
                </div>
              </div>

              {/* Comparativo das cargas anuais */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase block mb-1">
                  Carga Tributária Anual Estimada
                </span>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-700">Simples Nacional:</span>
                  <span className="font-bold text-slate-900">
                    {selectedDiag.carga_simples > 0
                      ? `R$ ${selectedDiag.carga_simples.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : 'Não elegível (> 4,8M)'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-700">Lucro Presumido:</span>
                  <span className="font-bold text-slate-900">
                    {selectedDiag.carga_presumido > 0
                      ? `R$ ${selectedDiag.carga_presumido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : 'Não elegível (> 78M)'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-700">Lucro Real:</span>
                  <span className="font-bold text-slate-900">
                    R${' '}
                    {selectedDiag.carga_real?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {selectedDiag.economia_anual && selectedDiag.economia_anual > 0 && (
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs text-[#145A32]">
                    <span className="font-bold">Economia anual estimada:</span>
                    <span className="font-extrabold text-sm text-[#145A32]">
                      R${' '}
                      {selectedDiag.economia_anual.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
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
