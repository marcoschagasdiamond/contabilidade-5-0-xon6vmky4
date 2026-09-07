import React, { useEffect, useState } from 'react'
import {
  Users,
  Building,
  Mail,
  Phone,
  Calendar,
  Layers,
  Search,
  Trash2,
  RefreshCw,
  LogOut,
  UserCheck,
  TrendingUp,
  Download,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getLeads, deleteLead, type LeadRecord } from '@/services/leads'
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

export default function Admin() {
  const { user, logout } = useAuth()
  const [leads, setLeads] = useState<LeadRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSegment, setFilterSegment] = useState('todos')
  const [leadToDelete, setLeadToDelete] = useState<LeadRecord | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null)

  const fetchLeads = async () => {
    setIsLoading(true)
    try {
      const data = await getLeads()
      setLeads(data)
    } catch (err) {
      console.error('Erro ao carregar leads:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
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

  const handleDeleteConfirm = async () => {
    if (!leadToDelete) return
    setIsDeleting(true)
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
      setIsDeleting(false)
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

  // Exportar para CSV
  const handleExportCSV = () => {
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

  return (
    <div className="pt-24 pb-20 bg-slate-50 min-h-screen">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        {/* TOP BAR DO PAINEL */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2ECC71] animate-pulse"></span>
              <span className="text-xs uppercase tracking-wider font-semibold text-[#145A32]">
                Painel Administrativo • Tempo Real Ativo
              </span>
            </div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight mt-1">
              Gestão de Leads Capturados
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Logado como{' '}
              <strong className="text-slate-800">{user?.email || 'Administrador'}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchLeads}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors"
              title="Recarregar dados"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleExportCSV}
              disabled={leads.length === 0}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
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

        {/* METRICS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase">Total de Leads</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#145A32] flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="font-heading font-extrabold text-3xl text-slate-900">{leads.length}</p>
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

        {/* FILTROS E BUSCA */}
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
              <option value="Tecnologia">Tecnologia</option>
              <option value="Varejo">Varejo</option>
              <option value="Indústria">Indústria</option>
              <option value="Serviços">Serviços</option>
              <option value="Agronegócio">Agronegócio</option>
              <option value="Sociedade de Profissionais">Sociedade de Profissionais</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
        </div>

        {/* TABELA DE LEADS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {isLoading ? (
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

      {/* DIÁLOGO CONFIRMAÇÃO DE EXCLUSÃO */}
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
                disabled={isDeleting}
                onClick={() => setLeadToDelete(null)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="bg-[#E74C3C] hover:bg-red-700 text-white rounded-xl"
              >
                {isDeleting ? 'Excluindo...' : 'Excluir Lead'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
