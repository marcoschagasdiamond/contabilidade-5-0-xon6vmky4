import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { carregarFichaAgregadaCrm, atualizarCrmCliente, excluirInteracaoCrm } from '@/services/crm'
import type { CrmFichaAgregada, StatusComercialCrm, CrmInteracaoRecord } from '@/types/crm'
import { STATUS_COMERCIAIS_CRM } from '@/types/crm'
import { ModalRegistrarInteracao } from '@/components/crm/ModalRegistrarInteracao'
import { ModalConvidarCliente } from '@/components/clientes/ModalConvidarCliente'
import { AbaHistoricoCadastral } from '@/components/crm/AbaHistoricoCadastral'
import { ModalMontarRelatorioCrm } from '@/components/crm/ModalMontarRelatorioCrm'
import { listarAuditoriaDadosEmpresa } from '@/services/historicoDadosEmpresa'
import {
  listarRelatoriosPersonalizados,
  excluirRelatorioPersonalizado,
} from '@/services/relatoriosPersonalizados'
import { gerarRelatorioPersonalizadoPDF } from '@/lib/pdfRelatorioPersonalizado'
import type { HistoricoDadosEmpresaRegistro } from '@/types/historicoDadosEmpresa'
import type { RelatorioPersonalizadoRecord } from '@/types/relatorioPersonalizado'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

type AbaCrm =
  | 'resumo'
  | 'relatorios'
  | 'diagnosticos'
  | 'simulacoes'
  | 'creditos'
  | 'reunioes'
  | 'interacoes'
  | 'historico_cadastral'

export default function FichaClienteCrm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, nivelAcesso, isAdmin, isMaster } = useAuth()
  const { toast } = useToast()

  // Bloqueio de empresário
  useEffect(() => {
    if (nivelAcesso === 'empresario' || (user as any)?.perfil === 'empresario') {
      toast({
        title: 'Acesso Restrito',
        description: 'Empresários não têm acesso à ficha do CRM.',
        variant: 'destructive',
      })
      navigate('/dados-empresa', { replace: true })
    }
  }, [nivelAcesso, user, navigate, toast])

  const [ficha, setFicha] = useState<CrmFichaAgregada | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [abaAtiva, setAbaAtiva] = useState<AbaCrm>('resumo')
  const [historicoCadastral, setHistoricoCadastral] = useState<HistoricoDadosEmpresaRegistro[]>([])
  const [carregandoHistoricoCadastral, setCarregandoHistoricoCadastral] = useState(false)
  const [relatoriosCliente, setRelatoriosCliente] = useState<RelatorioPersonalizadoRecord[]>([])
  const [carregandoRelatorios, setCarregandoRelatorios] = useState(false)

  // Modais
  const [modalInteracaoAberta, setModalInteracaoAberta] = useState(false)
  const [modalConviteAberta, setModalConviteAberta] = useState(false)
  const [modalMontarRelatorioAberta, setModalMontarRelatorioAberta] = useState(false)

  // Edição rápida de campos do Resumo
  const [editandoResumo, setEditandoResumo] = useState(false)
  const [salvandoResumo, setSalvandoResumo] = useState(false)
  const [formStatus, setFormStatus] = useState<StatusComercialCrm>('Prospect')
  const [formValor, setFormValor] = useState('')
  const [formOrigem, setFormOrigem] = useState('')
  const [formDataEntrada, setFormDataEntrada] = useState('')
  const [formObs, setFormObs] = useState('')

  // Carregar ficha completa
  const carregarFicha = async () => {
    if (!id) return
    setCarregando(true)
    try {
      const data = await carregarFichaAgregadaCrm(id)
      if (!data) {
        toast({
          title: 'Ficha não encontrada',
          description: 'A ficha comercial solicitada não existe ou foi excluída.',
          variant: 'destructive',
        })
        navigate('/crm')
        return
      }

      setFicha(data)
      setFormStatus(data.crmCliente.status_comercial)

      // Carrega auditoria cadastral da empresa vinculada
      if (data.empresa?.id || data.crmCliente.id) {
        setCarregandoHistoricoCadastral(true)
        listarAuditoriaDadosEmpresa({
          empresaId: data.empresa?.id,
          clienteId: data.crmCliente.id,
        })
          .then((hist) => setHistoricoCadastral(hist))
          .catch((e) => console.warn('Erro ao carregar auditoria cadastral da ficha:', e))
          .finally(() => setCarregandoHistoricoCadastral(false))
      }
      setFormValor(
        data.crmCliente.valor_mensal_servico ? String(data.crmCliente.valor_mensal_servico) : '',
      )
      setFormOrigem(data.crmCliente.origem_contato || '')
      setFormDataEntrada(data.crmCliente.data_entrada || '')
      setFormObs(data.crmCliente.observacoes || '')

      // Carrega relatórios personalizados deste cliente no CRM
      setCarregandoRelatorios(true)
      listarRelatoriosPersonalizados({
        crmClienteId: data.crmCliente.id,
        clienteId: data.crmCliente.id,
      })
        .then((rels) => setRelatoriosCliente(rels))
        .catch((e) => console.warn('Erro ao carregar relatórios do cliente:', e))
        .finally(() => setCarregandoRelatorios(false))
    } catch (err: any) {
      console.error('Erro ao carregar ficha do CRM:', err)
      toast({
        title: 'Erro ao carregar ficha',
        description: err?.message || 'Falha ao buscar dados integrados do cliente.',
        variant: 'destructive',
      })
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarFicha()
  }, [id])

  // Salvar alterações rápidas no Resumo
  const handleSalvarResumo = async () => {
    if (!id) return
    setSalvandoResumo(true)
    try {
      const valorNum = formValor ? parseFloat(formValor.replace(',', '.')) : 0
      const atualizado = await atualizarCrmCliente(id, {
        status_comercial: formStatus,
        valor_mensal_servico: isNaN(valorNum) ? 0 : valorNum,
        origem_contato: formOrigem.trim(),
        data_entrada: formDataEntrada || undefined,
        observacoes: formObs.trim(),
      })

      setFicha((prev) => (prev ? { ...prev, crmCliente: atualizado } : null))
      setEditandoResumo(false)
      toast({
        title: 'Ficha Comercial Atualizada',
        description: 'Informações comerciais salvas com sucesso.',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar ficha',
        description: err?.message || 'Falha ao salvar alterações.',
        variant: 'destructive',
      })
    } finally {
      setSalvandoResumo(false)
    }
  }

  // Mudança direta de status comercial (atalho no cabeçalho)
  const handleMudarStatusDireto = async (novoStatus: StatusComercialCrm) => {
    if (!id || !ficha) return
    try {
      const atualizado = await atualizarCrmCliente(id, {
        status_comercial: novoStatus,
      })
      setFicha((prev) => (prev ? { ...prev, crmCliente: atualizado } : null))
      setFormStatus(novoStatus)
      toast({
        title: 'Status Comercial Atualizado',
        description: `Cliente alterado para "${novoStatus}".`,
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao mudar status',
        description: err?.message || 'Falha ao atualizar status.',
        variant: 'destructive',
      })
    }
  }

  const handleExcluirInteracao = async (interacaoId: string) => {
    if (!confirm('Deseja excluir esta interação da timeline?')) return
    try {
      await excluirInteracaoCrm(interacaoId)
      setFicha((prev) =>
        prev
          ? {
              ...prev,
              interacoes: prev.interacoes.filter((i) => i.id !== interacaoId),
            }
          : null,
      )
      toast({ title: 'Interação excluída' })
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir interação',
        description: err?.message,
        variant: 'destructive',
      })
    }
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <div className="text-sm font-bold text-slate-700">
            Carregando ficha comercial do cliente...
          </div>
          <p className="text-xs text-slate-500">
            Cruzando diagnósticos, simulações e reuniões automaticamente
          </p>
        </div>
      </div>
    )
  }

  if (!ficha) return null

  const emp = ficha.empresa
  const cli = ficha.crmCliente
  const analista = (cli as any).expand?.analista_responsavel

  const statusConfig = STATUS_COMERCIAIS_CRM.find((s) => s.id === cli.status_comercial)

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* NAVEGAÇÃO SUPERIOR / VOLTAR */}
        <div className="flex items-center justify-between">
          <Link
            to="/crm"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#07132B] transition-colors"
          >
            ← Voltar para a Carteira do CRM
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              ID da Ficha:
            </span>
            <code className="text-[11px] font-mono bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md">
              {cli.id}
            </code>
          </div>
        </div>

        {/* CABEÇALHO DA FICHA COMERCIAL */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#07132B] text-[#D4AF37]">
                  Ficha do Cliente • CRM
                </span>
                <Badge
                  variant="outline"
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    statusConfig?.corBadge || 'bg-slate-100 text-slate-800'
                  }`}
                >
                  Status: {cli.status_comercial}
                </Badge>
                {emp?.regime_atual && (
                  <span className="text-xs bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full font-semibold">
                    {emp.regime_atual}
                  </span>
                )}
              </div>

              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#07132B]">
                {emp?.nome_empresa || 'Empresa em Prospecção Comercial'}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-medium">
                {emp?.cnpj && (
                  <span>
                    CNPJ: <strong className="text-slate-900 font-mono">{emp.cnpj}</strong>
                  </span>
                )}
                {emp?.nome_contato && (
                  <span>
                    Contato: <strong className="text-slate-900">{emp.nome_contato}</strong>
                  </span>
                )}
                {emp?.email && (
                  <span>
                    E-mail: <strong className="text-slate-900">{emp.email}</strong>
                  </span>
                )}
                {emp?.telefone && (
                  <span>
                    Tel: <strong className="text-slate-900">{emp.telefone}</strong>
                  </span>
                )}
                {(isAdmin || isMaster) && analista && (
                  <span>
                    Analista:{' '}
                    <strong className="text-slate-900">{analista.name || analista.email}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* AÇÕES RÁPIDAS NO HEADER */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0">
              {/* SELETOR RÁPIDO DE STATUS COMERCIAL */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 pl-2">
                  Mover:
                </span>
                {(
                  ['Prospect', 'Onboarding', 'Ativo', 'Inativo', 'Perdido'] as StatusComercialCrm[]
                ).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleMudarStatusDireto(st)}
                    className={`text-xs px-2.5 py-1 rounded-xl font-bold transition-all ${
                      cli.status_comercial === st
                        ? 'bg-[#07132B] text-[#D4AF37] shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* BOTÃO MONTAR RELATÓRIO PERSONALIZADO (NOVA AÇÃO CRM) */}
              <Button
                onClick={() => setModalMontarRelatorioAberta(true)}
                className="bg-[#D4AF37] hover:bg-[#b89528] text-[#07132B] font-bold text-xs px-4 py-2 rounded-xl shadow-sm"
              >
                Montar Relatório Personalizado
              </Button>

              {/* BOTÃO DE INTERAÇÃO RÁPIDA */}
              <Button
                onClick={() => setModalInteracaoAberta(true)}
                className="bg-[#07132B] hover:bg-[#0d2249] text-[#D4AF37] font-bold text-xs px-4 py-2 rounded-xl shadow-sm"
              >
                + Registrar Interação
              </Button>

              {/* BOTÃO DE CONVIDAR EMPRESÁRIO */}
              <Button
                variant="outline"
                onClick={() => setModalConviteAberta(true)}
                className="border-slate-300 text-slate-800 font-bold text-xs px-4 py-2 rounded-xl hover:bg-slate-50"
              >
                Convidar Empresário
              </Button>
            </div>
          </div>

          {/* INDICADORES DO CLIENTE (ALIMENTAÇÃO AUTOMÁTICA) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Trilha 360° Concluída
              </span>
              <span
                className={`text-lg font-black mt-0.5 inline-block ${
                  ficha.temDiagnosticoConcluido ? 'text-emerald-700' : 'text-slate-500'
                }`}
              >
                {ficha.temDiagnosticoConcluido ? 'Sim (Disponível)' : 'Pendente / Não iniciada'}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {ficha.diagnosticos.length} diagnósticos na base
              </span>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Calculadora IBS/CBS
              </span>
              <span className="text-lg font-black text-[#07132B] mt-0.5 inline-block">
                {ficha.simulacoesCalculadora.length}{' '}
                {ficha.simulacoesCalculadora.length === 1 ? 'simulação' : 'simulações'}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Economia anual: R${' '}
                {ficha.totalEconomiaAnualCalculadora.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Créditos em Recuperação
              </span>
              <span className="text-lg font-black text-emerald-800 mt-0.5 inline-block">
                {ficha.totalCreditosRecuperador > 0
                  ? ficha.totalCreditosRecuperador.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })
                  : 'R$ 0,00'}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {ficha.simulacoesRecuperador.length} levantamentos realizados
              </span>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Valor Mensal Contratado
              </span>
              <span className="text-lg font-black text-[#07132B] mt-0.5 inline-block">
                {(cli.valor_mensal_servico || 0).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {cli.data_entrada
                  ? `Entrada em ${new Date(cli.data_entrada).toLocaleDateString('pt-BR')}`
                  : 'Data de entrada a definir'}
              </span>
            </div>
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="bg-white border border-slate-200 rounded-3xl p-1.5 shadow-sm overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max">
            {[
              { id: 'resumo', label: 'Resumo & Comercial' },
              {
                id: 'relatorios',
                label: `Relatórios Personalizados (${relatoriosCliente.length})`,
              },
              {
                id: 'diagnosticos',
                label: `Diagnósticos 360° (${ficha.diagnosticos.length})`,
              },
              {
                id: 'simulacoes',
                label: `Simulações IBS/CBS (${ficha.simulacoesCalculadora.length})`,
              },
              {
                id: 'creditos',
                label: `Créditos Tributários (${ficha.simulacoesRecuperador.length})`,
              },
              { id: 'reunioes', label: `Reuniões (${ficha.reunioes.length})` },
              {
                id: 'interacoes',
                label: `Timeline & Interações (${ficha.interacoes.length})`,
              },
              {
                id: 'historico_cadastral',
                label: `Rastro Cadastral (${historicoCadastral.length})`,
              },
            ].map((aba) => (
              <button
                key={aba.id}
                onClick={() => setAbaAtiva(aba.id as AbaCrm)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  abaAtiva === aba.id
                    ? 'bg-[#07132B] text-[#D4AF37] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {aba.label}
              </button>
            ))}
          </div>
        </div>

        {/* CONTEÚDO DAS ABAS */}

        {/* ABA 1: RESUMO & COMERCIAL */}
        {abaAtiva === 'resumo' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* COLUNA ESQUERDA: DADOS COMERCIAIS */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="font-heading font-extrabold text-lg text-[#07132B]">
                    Informações Comerciais da Ficha
                  </h2>
                  <p className="text-xs text-slate-500">
                    Status, honorários mensais acordados, canal de origem e notas estratégicas.
                  </p>
                </div>
                {!editandoResumo ? (
                  <Button
                    variant="outline"
                    onClick={() => setEditandoResumo(true)}
                    className="text-xs font-bold border-slate-300 text-slate-700 rounded-xl"
                  >
                    Editar Dados Comerciais
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setEditandoResumo(false)}
                      disabled={salvandoResumo}
                      className="text-xs font-bold text-slate-600"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSalvarResumo}
                      disabled={salvandoResumo}
                      className="bg-[#07132B] text-[#D4AF37] hover:bg-[#0d2249] text-xs font-bold px-4 rounded-xl"
                    >
                      {salvandoResumo ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                )}
              </div>

              {!editandoResumo ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Status Comercial
                    </span>
                    <span className="text-sm font-extrabold text-[#07132B] mt-1 block">
                      {cli.status_comercial}
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Valor Mensal do Serviço
                    </span>
                    <span className="text-sm font-extrabold text-[#07132B] mt-1 block">
                      {(cli.valor_mensal_servico || 0).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Origem do Contato
                    </span>
                    <span className="text-xs font-bold text-slate-800 mt-1 block">
                      {cli.origem_contato || 'Não informada'}
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Data de Entrada / Início
                    </span>
                    <span className="text-xs font-bold text-slate-800 mt-1 block">
                      {cli.data_entrada
                        ? new Date(cli.data_entrada).toLocaleDateString('pt-BR')
                        : 'Não informada'}
                    </span>
                  </div>

                  <div className="sm:col-span-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Observações Estratégicas
                    </span>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {cli.observacoes || 'Nenhuma observação cadastrada para este cliente.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700">Status Comercial</Label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as StatusComercialCrm)}
                        className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-white"
                      >
                        <option value="Prospect">Prospect</option>
                        <option value="Onboarding">Onboarding</option>
                        <option value="Ativo">Ativo</option>
                        <option value="Inativo">Inativo</option>
                        <option value="Perdido">Perdido</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700">Valor Mensal (R$)</Label>
                      <Input
                        value={formValor}
                        onChange={(e) => setFormValor(e.target.value)}
                        placeholder="Ex: 2500"
                        className="text-xs h-9 rounded-xl border-slate-300"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700">Origem do Contato</Label>
                      <Input
                        value={formOrigem}
                        onChange={(e) => setFormOrigem(e.target.value)}
                        placeholder="Ex: Indicação, Tráfego Pago"
                        className="text-xs h-9 rounded-xl border-slate-300"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700">Data de Entrada</Label>
                      <Input
                        type="date"
                        value={formDataEntrada}
                        onChange={(e) => setFormDataEntrada(e.target.value)}
                        className="text-xs h-9 rounded-xl border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700">
                      Observações Estratégicas
                    </Label>
                    <Textarea
                      rows={4}
                      value={formObs}
                      onChange={(e) => setFormObs(e.target.value)}
                      className="text-xs rounded-xl border-slate-300 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* ÚLTIMAS INTERAÇÕES NA ABA RESUMO */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-heading font-extrabold text-sm text-[#07132B]">
                    Últimas Interações Registradas
                  </h3>
                  <Button
                    onClick={() => setModalInteracaoAberta(true)}
                    className="bg-[#07132B] hover:bg-[#0d2249] text-[#D4AF37] text-xs font-bold px-3 py-1.5 rounded-xl"
                  >
                    + Interação Rápida
                  </Button>
                </div>

                {ficha.interacoes.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3">
                    Nenhuma interação registrada ainda. Use o botão acima para documentar a primeira
                    conversa com o cliente.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {ficha.interacoes.slice(0, 3).map((inter) => (
                      <div
                        key={inter.id}
                        className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col gap-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold uppercase tracking-wider text-[10px] text-slate-600 bg-slate-200 px-2 py-0.5 rounded-md">
                            {inter.tipo} • {new Date(inter.data).toLocaleDateString('pt-BR')}
                          </span>
                          {inter.proximo_passo && (
                            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              Próximo Passo: {inter.proximo_passo}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-800 mt-1 leading-relaxed">{inter.resumo}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* COLUNA DIREITA: DADOS CADASTRAIS DA EMPRESA */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-heading font-extrabold text-base text-[#07132B]">
                  Dados Cadastrais da Empresa
                </h3>
                <p className="text-[11px] text-slate-500">
                  Integrados automaticamente com a tabela clientes_empresas.
                </p>
              </div>

              {emp ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Razão Social / Nome
                    </span>
                    <span className="font-bold text-slate-900 block mt-0.5">
                      {emp.nome_empresa}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      CNPJ
                    </span>
                    <span className="font-mono font-bold text-slate-900 block mt-0.5">
                      {emp.cnpj || 'Não informado'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Contato Principal
                    </span>
                    <span className="font-medium text-slate-800 block mt-0.5">
                      {emp.nome_contato || 'Não informado'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      E-mail
                    </span>
                    <span className="text-slate-700 block mt-0.5">
                      {emp.email || 'Não informado'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Telefone
                    </span>
                    <span className="text-slate-700 block mt-0.5">
                      {emp.telefone || 'Não informado'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Localização
                    </span>
                    <span className="text-slate-700 block mt-0.5">
                      {emp.cidade ? `${emp.cidade} / ${emp.uf}` : 'Não informada'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Segmento
                    </span>
                    <span className="text-slate-700 block mt-0.5">
                      {emp.segmento || 'Não informado'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-500 space-y-2">
                  <p>
                    Esta ficha comercial ainda não está associada a um registro na tabela
                    clientes_empresas.
                  </p>
                </div>
              )}

              {/* CONVITE DO EMPRESÁRIO */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#07132B] block">
                  Acesso do Empresário
                </span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Envie um convite exclusivo para que o empresário acesse a plataforma, preencha os
                  dados e acompanhe as entregas.
                </p>
                <Button
                  onClick={() => setModalConviteAberta(true)}
                  className="w-full bg-[#07132B] hover:bg-[#0d2249] text-[#D4AF37] font-bold text-xs py-2 rounded-xl"
                >
                  Convidar Empresário Agora
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ABA 2: RELATÓRIOS PERSONALIZADOS DO CLIENTE */}
        {abaAtiva === 'relatorios' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-heading font-extrabold text-lg text-[#07132B]">
                  Relatórios Personalizados Montados para este Cliente
                </h2>
                <p className="text-xs text-slate-500">
                  Dossiês técnicos customizados, dados de envio e histórico de compartilhamento.
                </p>
              </div>
              <Button
                onClick={() => setModalMontarRelatorioAberta(true)}
                className="bg-[#D4AF37] hover:bg-[#b89528] text-[#07132B] font-bold text-xs px-4 py-2 rounded-xl shadow-sm self-start sm:self-auto"
              >
                + Montar Novo Relatório
              </Button>
            </div>

            {carregandoRelatorios ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Carregando relatórios personalizados...
              </div>
            ) : relatoriosCliente.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                <p className="font-bold text-slate-700">
                  Nenhum relatório personalizado gerado para este cliente ainda.
                </p>
                <p className="max-w-md mx-auto text-[11px] text-slate-500">
                  Clique no botão "Montar Relatório Personalizado" para selecionar análises, seções
                  e enviar ao cliente por e-mail ou baixar o PDF.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relatoriosCliente.map((rel) => {
                  const dataFormatada = new Date(rel.created).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  const modulos = rel.analises_incluidas || []

                  return (
                    <div
                      key={rel.id}
                      className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-3 text-xs"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-slate-900 text-sm line-clamp-1">
                            {rel.nome}
                          </h3>
                          <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                            {dataFormatada}
                          </span>
                        </div>

                        {/* Canal de envio / Histórico */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {rel.canal_envio === 'gmail' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Enviado via Gmail {rel.enviado_para ? `(${rel.enviado_para})` : ''}
                            </span>
                          )}
                          {rel.canal_envio === 'download_pdf' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800">
                              Baixado em PDF
                            </span>
                          )}
                          {rel.canal_envio === 'link_compartilhado' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
                              Link Compartilhado
                            </span>
                          )}
                          {!rel.canal_envio && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700">
                              Gerado no CRM
                            </span>
                          )}
                        </div>

                        {/* Módulos incluídos */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {modulos.includes('calculadora') && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white border border-slate-200 text-slate-700">
                              IBS/CBS
                            </span>
                          )}
                          {modulos.includes('recuperador') && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white border border-slate-200 text-slate-700">
                              Créditos
                            </span>
                          )}
                          {modulos.includes('diagnostico') && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white border border-slate-200 text-slate-700">
                              Diagnóstico 360°
                            </span>
                          )}
                        </div>

                        {rel.observacoes && (
                          <p className="text-slate-600 italic line-clamp-2 pt-1 text-[11px]">
                            "{rel.observacoes}"
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                        <Button
                          size="sm"
                          onClick={() => {
                            const cfg = rel.configuracao
                            gerarRelatorioPersonalizadoPDF({
                              configuracao: cfg,
                              empresa: rel.empresa_nome || emp?.nome_empresa || 'Empresa',
                              cnpj: rel.cnpj || emp?.cnpj,
                              dadosEmpresa: cfg.snapshotDadosEmpresa || null,
                              simulacaoCalculadora: cfg.snapshotCalculadora || null,
                              simulacaoRecuperador: cfg.snapshotRecuperador || null,
                              diagnostico360: cfg.snapshotDiagnostico || null,
                            })
                            toast({
                              title: 'Download Iniciado',
                              description: `Baixando relatório "${rel.nome}".`,
                            })
                          }}
                          className="bg-[#07132B] hover:bg-[#0d2249] text-[#D4AF37] font-bold text-xs h-8 px-3 rounded-xl"
                        >
                          Baixar Novamente
                        </Button>

                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm(`Deseja excluir o relatório "${rel.nome}"?`)) return
                            await excluirRelatorioPersonalizado(rel.id)
                            setRelatoriosCliente((prev) => prev.filter((r) => r.id !== rel.id))
                            toast({ title: 'Relatório excluído' })
                          }}
                          className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ABA 2: DIAGNÓSTICOS 360° */}
        {abaAtiva === 'diagnosticos' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="font-heading font-extrabold text-lg text-[#07132B]">
                  Trilha de Diagnóstico 360° do Cliente
                </h2>
                <p className="text-xs text-slate-500">
                  Dados puxados automaticamente da coleção <code>diagnosticos</code> vinculados a
                  esta empresa.
                </p>
              </div>
              <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                {ficha.diagnosticos.length} registros encontrados
              </span>
            </div>

            {ficha.diagnosticos.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Nenhum diagnóstico registrado ainda para esta empresa. O cliente ou analista pode
                iniciar a trilha 360° no portal.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ficha.diagnosticos.map((diag) => (
                  <div
                    key={diag.id}
                    className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[#07132B] text-[#D4AF37] px-2 py-0.5 rounded-md">
                        Diagnóstico #{diag.id.slice(0, 8)}
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        {new Date(diag.created).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="font-bold text-slate-900 text-sm">
                        {diag.empresa || emp?.nome_empresa || 'Empresa'}
                      </div>
                      <div className="text-slate-600">
                        Regime Atual: <strong>{diag.regime_atual || 'N/D'}</strong> • Recomendado:{' '}
                        <strong className="text-emerald-700">
                          {diag.regime_recomendado || 'Em apuração'}
                        </strong>
                      </div>
                      {diag.faturamento_mensal ? (
                        <div className="text-slate-600">
                          Faturamento Mensal:{' '}
                          <strong>
                            {diag.faturamento_mensal.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </strong>
                        </div>
                      ) : null}
                    </div>

                    {diag.conclusao_analitica && (
                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                        <span className="font-bold text-[10px] uppercase tracking-wider text-slate-500 block mb-1">
                          Conclusão Analítica
                        </span>
                        {diag.conclusao_analitica}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA 3: SIMULAÇÕES CALCULADORA IBS/CBS */}
        {abaAtiva === 'simulacoes' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="font-heading font-extrabold text-lg text-[#07132B]">
                  Simulações da Calculadora IBS/CBS
                </h2>
                <p className="text-xs text-slate-500">
                  Cenários tributários sob a LC 214/2025 e EC 132/2023 salvos para este cliente.
                </p>
              </div>
              <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                {ficha.simulacoesCalculadora.length} simulações
              </span>
            </div>

            {ficha.simulacoesCalculadora.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Nenhuma simulação da Calculadora IBS/CBS salva para esta empresa até o momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ficha.simulacoesCalculadora.map((sim) => (
                  <div
                    key={sim.id}
                    className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{sim.nome}</span>
                      <span className="text-slate-500 text-[11px]">
                        {new Date(sim.created).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-3 bg-white rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Regime Recomendado
                        </span>
                        <span className="font-bold text-emerald-700 block mt-0.5">
                          {sim.regime_recomendado || 'Não definido'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Economia Anual
                        </span>
                        <span className="font-bold text-[#07132B] block mt-0.5">
                          {(sim.economia_anual || 0).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA 4: CRÉDITOS TRIBUTÁRIOS (RECUPERADOR) */}
        {abaAtiva === 'creditos' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="font-heading font-extrabold text-lg text-[#07132B]">
                  Levantamento de Créditos Tributários
                </h2>
                <p className="text-xs text-slate-500">
                  Oportunidades mapeadas pelo módulo Recuperador de Créditos.
                </p>
              </div>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                Total Integral: R${' '}
                {ficha.totalCreditosRecuperador.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            {ficha.simulacoesRecuperador.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Nenhum levantamento do Recuperador de Créditos cadastrado para esta empresa.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ficha.simulacoesRecuperador.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{rec.nome}</span>
                      <span className="text-slate-500 text-[11px]">
                        {new Date(rec.created).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-3 bg-white rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Total Integral
                        </span>
                        <span className="font-bold text-emerald-700 block mt-0.5">
                          {(rec.total_recuperavel_integral || 0).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Total Conservador
                        </span>
                        <span className="font-bold text-slate-800 block mt-0.5">
                          {(rec.total_recuperavel_conservador || 0).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA 5: REUNIÕES AGENDADAS */}
        {abaAtiva === 'reunioes' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="font-heading font-extrabold text-lg text-[#07132B]">
                  Reuniões Agendadas com o Cliente
                </h2>
                <p className="text-xs text-slate-500">
                  Puxadas automaticamente da coleção <code>reunioes</code>.
                </p>
              </div>
              <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                {ficha.reunioes.length} agendadas
              </span>
            </div>

            {ficha.reunioes.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Nenhuma reunião agendada na base para esta empresa.
              </div>
            ) : (
              <div className="space-y-3">
                {ficha.reunioes.map((reu) => (
                  <div
                    key={reu.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-slate-900">
                        {reu.assunto || 'Reunião de Alinhamento Comercial'}
                      </div>
                      <div className="text-slate-600">
                        Data: <strong>{new Date(reu.data).toLocaleDateString('pt-BR')}</strong> às{' '}
                        <strong>{reu.horario}</strong>
                        {reu.cliente_email ? ` • Contato: ${reu.cliente_email}` : ''}
                      </div>
                      {reu.observacao && (
                        <p className="text-slate-500 text-[11px] mt-1">{reu.observacao}</p>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs font-bold self-start sm:self-center"
                    >
                      Status: {reu.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA 6: TIMELINE & INTERAÇÕES */}
        {abaAtiva === 'interacoes' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-heading font-extrabold text-lg text-[#07132B]">
                  Linha do Tempo de Interações Comerciais
                </h2>
                <p className="text-xs text-slate-500">
                  Histórico de WhatsApp, telefonemas, reuniões e alinhamentos com próximo passo
                  definido.
                </p>
              </div>
              <Button
                onClick={() => setModalInteracaoAberta(true)}
                className="bg-[#07132B] hover:bg-[#0d2249] text-[#D4AF37] font-bold text-xs px-4 py-2 rounded-xl shadow-sm self-start sm:self-auto"
              >
                + Registrar Interação
              </Button>
            </div>

            {ficha.interacoes.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Nenhuma interação registrada ainda. Clique no botão acima para adicionar a primeira.
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-200 ml-3 sm:ml-4 pl-4 sm:pl-6 space-y-6">
                {ficha.interacoes.map((inter) => (
                  <div key={inter.id} className="relative group">
                    {/* Marcador na linha */}
                    <div className="absolute -left-[23px] sm:-left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-[#07132B] border-2 border-white" />

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-2 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold uppercase tracking-wider text-[10px] text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/50 px-2 py-0.5 rounded-md">
                            {inter.tipo}
                          </span>
                          <span className="font-bold text-slate-900">
                            {new Date(inter.data).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleExcluirInteracao(inter.id)}
                          className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          Excluir
                        </button>
                      </div>

                      <p className="text-slate-800 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                        {inter.resumo}
                      </p>

                      {inter.proximo_passo && (
                        <div className="mt-2 p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between gap-2 text-xs">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                              Próximo Passo / Compromisso
                            </span>
                            <span className="font-semibold text-amber-950 block mt-0.5">
                              {inter.proximo_passo}
                            </span>
                          </div>
                          {inter.data_proximo_passo && (
                            <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-1 rounded-lg">
                              Até {new Date(inter.data_proximo_passo).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA 7: RASTRO CADASTRAL (AUDITORIA IMUTÁVEL DE DADOS DA EMPRESA) */}
        {abaAtiva === 'historico_cadastral' && (
          <AbaHistoricoCadastral
            historico={historicoCadastral}
            carregando={carregandoHistoricoCadastral}
            onAtualizar={() => {
              if (ficha?.empresa?.id || ficha?.crmCliente.id) {
                setCarregandoHistoricoCadastral(true)
                listarAuditoriaDadosEmpresa({
                  empresaId: ficha.empresa?.id,
                  clienteId: ficha.crmCliente.id,
                })
                  .then((hist) => setHistoricoCadastral(hist))
                  .finally(() => setCarregandoHistoricoCadastral(false))
              }
            }}
          />
        )}
      </div>

      {/* MODAL DE REGISTRAR INTERAÇÃO */}
      <ModalRegistrarInteracao
        aberto={modalInteracaoAberta}
        aoFechar={() => setModalInteracaoAberta(false)}
        crmClienteId={cli.id}
        aoSalvarSucesso={(nova) => {
          setFicha((prev) => (prev ? { ...prev, interacoes: [nova, ...prev.interacoes] } : null))
        }}
      />

      {/* MODAL DE CONVIDAR CLIENTE (REAPROVEITADO) */}
      <ModalConvidarCliente
        aberto={modalConviteAberta}
        aoFechar={() => setModalConviteAberta(false)}
        aoConviteEnviado={() => {
          toast({
            title: 'Convite Enviado!',
            description: 'O empresário recebeu o convite com link de cadastro exclusivo.',
          })
        }}
      />

      {/* MODAL MONTAR RELATÓRIO CRM */}
      <ModalMontarRelatorioCrm
        aberto={modalMontarRelatorioAberta}
        aoFechar={() => setModalMontarRelatorioAberta(false)}
        ficha={ficha}
        aoRelatorioEnviadoOuCriado={() => {
          carregarFicha()
        }}
      />
    </div>
  )
}
