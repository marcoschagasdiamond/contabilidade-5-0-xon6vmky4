import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { resolverClientePorIdOuEmpresa, excluirCliente } from '@/services/clientes'
import {
  listarSimulacoesPorCliente,
  listarSimulacoes,
  vincularSimulacaoACliente,
} from '@/services/simulacoesCalculadora'
import {
  listarSimulacoesRecuperadorPorCliente,
  listarSimulacoesRecuperador,
  vincularSimulacaoRecuperadorACliente,
} from '@/services/simulacoesRecuperador'
import type { SimulacaoRecuperador } from '@/types/recuperadorCreditos'
import {
  getDiagnosticosPorCliente,
  getDiagnosticos,
  vincularDiagnosticoACliente,
  deleteDiagnostico,
  excluirEtapaDiagnosticoPorCliente,
  excluirDiagnosticoCompletoPorCliente,
  type DiagnosticoRecord,
  type EtapaDiagnosticoIdentificador,
} from '@/services/diagnosticos'
import {
  listarConversasPorCliente,
  excluirConversaAssistente,
  type ConversaAssistente,
} from '@/services/conversasAssistente'
import { useClienteAtivo } from '@/context/ClienteAtivoContext'
import { ModalCliente } from '@/components/clientes/ModalCliente'
import {
  ModalConvidarCliente,
  ListaConvitesPendentes,
} from '@/components/clientes/ModalConvidarCliente'
import { listarConvitesAnalista, ConviteCliente } from '@/services/planos'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatarMoeda } from '@/lib/calculadoraUtils'
import { useToast } from '@/hooks/use-toast'
import type { Cliente } from '@/types/cliente'
import type { SimulacaoCalculadora } from '@/types/simulacaoCalculadora'

/**
 * Página de Detalhe do Cliente (/clientes/:id)
 * Requisitos:
 * 1) Dados cadastrais e fiscais do cliente.
 * 2) Histórico com simulações salvas, diagnósticos feitos e conversas arquivadas do Assistente.
 * 3) Links diretos para abrir cada simulação ou diagnóstico.
 * 4) Terceira aba "Conversas do Assistente" com visualização em leitura e atalho para reabrir no Dashboard.
 * 5) Opção de vincular simulações/diagnósticos existentes que estejam sem vínculo.
 * 6) Botão para definir como "Cliente Ativo" na Calculadora e Diagnósticos.
 * Visual: Padrão Diamond Group (#07132B e #D4AF37).
 * Regra: SEM ÍCONES — texto, badges e marcadores de status.
 * Resolução de id: o :id da URL pode ser o id do cliente OU o id da empresa
 * (clientes_empresas) — ambos resolvem para o mesmo cliente da carteira do
 * usuário logado; id que não pertence ao usuário segue mostrando o aviso.
 */
export default function DetalheCliente() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { clienteAtivoId, selecionarClienteAtivo, limparClienteAtivo, recarregarClientes } =
    useClienteAtivo()

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [modalEditarAberto, setModalEditarAberto] = useState(false)

  // Histórico
  const [simulacoes, setSimulacoes] = useState<SimulacaoCalculadora[]>([])
  const [recuperadorSims, setRecuperadorSims] = useState<SimulacaoRecuperador[]>([])
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoRecord[]>([])
  const [conversas, setConversas] = useState<ConversaAssistente[]>([])

  // Modal para vincular simulações/diagnósticos existentes
  const [modalVincularAberto, setModalVincularAberto] = useState(false)
  const [todasSimulacoes, setTodasSimulacoes] = useState<SimulacaoCalculadora[]>([])
  const [todosRecuperador, setTodosRecuperador] = useState<SimulacaoRecuperador[]>([])
  const [todosDiagnosticos, setTodosDiagnosticos] = useState<DiagnosticoRecord[]>([])
  const [abaHistorico, setAbaHistorico] = useState<
    'simulacoes' | 'recuperador' | 'diagnosticos' | 'conversas'
  >('simulacoes')

  // Modal de leitura detalhada de conversa arquivada
  const [conversaVisualizando, setConversaVisualizando] = useState<ConversaAssistente | null>(null)

  const [modalConviteAberto, setModalConviteAberto] = useState(false)
  const [convitesDoCliente, setConvitesDoCliente] = useState<ConviteCliente[]>([])

  // Estado para exclusão individual de etapa da trilha
  const [etapaParaExcluir, setEtapaParaExcluir] = useState<{
    identificador: EtapaDiagnosticoIdentificador
    numero: string
    titulo: string
    descricao: string
    rotaRefazer: string
    possuiDados: boolean
    diagnosticoId?: string
  } | null>(null)
  const [isExcluindoEtapa, setIsExcluindoEtapa] = useState(false)

  // Estado para exclusão completa da trilha do cliente
  const [modalExcluirTrilhaCompleta, setModalExcluirTrilhaCompleta] = useState(false)
  const [isExcluindoTrilhaCompleta, setIsExcluindoTrilhaCompleta] = useState(false)

  // Feedback de exclusão
  const [feedbackMensagem, setFeedbackMensagem] = useState<{
    tipo: 'sucesso' | 'erro'
    texto: string
  } | null>(null)

  // Ids que representam este cliente: o :id da URL (que pode ser o id da
  // empresa em clientes_empresas) e o id canônico do cliente resolvido.
  const idsDoCliente = React.useMemo(() => {
    const set = new Set<string>()
    if (id) set.add(id)
    if (cliente?.id) set.add(cliente.id)
    if (cliente?.empresa_id) set.add(cliente.empresa_id)
    return Array.from(set)
  }, [id, cliente?.id, cliente?.empresa_id])

  // Id canônico para GRAVAR vínculos: sempre o id do cliente resolvido, para
  // que a página volte a encontrá-lo tanto via id de cliente quanto via id de
  // empresa na URL.
  const idCanonico = cliente?.id || id || ''

  const isAtivo = !!clienteAtivoId && idsDoCliente.includes(clienteAtivoId)

  // Busca um histórico em várias chaves possíveis (id de cliente e de empresa),
  // mesclando por id para não duplicar registros.
  const carregarHistoricoPorIds = async <T extends { id: string }>(
    chaves: string[],
    fn: (chave: string) => Promise<T[]>,
  ): Promise<T[]> => {
    const resultados = await Promise.all(chaves.map((chave) => fn(chave).catch(() => [] as T[])))
    const mapa = new Map<string, T>()
    resultados.flat().forEach((item) => mapa.set(item.id, item))
    return Array.from(mapa.values())
  }

  const carregarConvitesDoCliente = React.useCallback(async () => {
    const chave = cliente?.id || id
    if (!chave) return
    try {
      const records = await listarConvitesAnalista(chave)
      setConvitesDoCliente(records)
    } catch (e) {
      console.warn('Erro ao carregar convites do cliente:', e)
    }
  }, [id, cliente?.id])

  const carregarDados = async () => {
    if (!id) return
    try {
      setCarregando(true)
      // O :id da URL pode ser tanto o id do cliente (coleção clientes) quanto o
      // id da empresa correspondente (clientes_empresas) — a carteira lista os
      // dois formatos. Resolver unificado evita "cliente não encontrado" para
      // cliente existente da carteira.
      const cli = await resolverClientePorIdOuEmpresa(id)
      setCliente(cli)

      if (cli) {
        // O histórico pode estar vinculado ao id do cliente OU ao id da empresa
        // (ambos já foram usados ao gravar vínculos) — busca nas duas chaves.
        const chaves = Array.from(new Set([id, cli.id, cli.empresa_id].filter(Boolean) as string[]))
        const [sims, recups, diags, convs] = await Promise.all([
          carregarHistoricoPorIds(chaves, listarSimulacoesPorCliente),
          carregarHistoricoPorIds(chaves, listarSimulacoesRecuperadorPorCliente),
          carregarHistoricoPorIds(chaves, getDiagnosticosPorCliente),
          carregarHistoricoPorIds(chaves, listarConversasPorCliente),
        ])
        setSimulacoes(sims)
        setRecuperadorSims(recups)
        setDiagnosticos(diags)
        setConversas(convs)
      }
    } catch (err) {
      console.error('Erro ao carregar dados do cliente:', err)
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar as informações do cliente.',
        variant: 'destructive',
      })
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [id])

  // Convites dependem do cliente resolvido (id canônico)
  useEffect(() => {
    carregarConvitesDoCliente()
  }, [carregarConvitesDoCliente])

  const abrirModalVincular = async () => {
    try {
      const [todasS, todosR, todosD] = await Promise.all([
        listarSimulacoes(),
        listarSimulacoesRecuperador(),
        getDiagnosticos(),
      ])
      // Filtra apenas as que não pertencem a este cliente (especialmente as sem cliente)
      const chaves = new Set(idsDoCliente)
      setTodasSimulacoes(todasS.filter((s) => !chaves.has(s.cliente_id || '')))
      setTodosRecuperador(todosR.filter((r) => !chaves.has(r.cliente_id || '')))
      setTodosDiagnosticos(todosD.filter((d) => !chaves.has(d.cliente_id || '')))
      setModalVincularAberto(true)
    } catch (err) {
      console.error('Erro ao abrir lista para vinculação:', err)
    }
  }

  const handleVincularRecuperador = async (recupId: string) => {
    if (!idCanonico) return
    const ok = await vincularSimulacaoRecuperadorACliente(recupId, idCanonico)
    if (ok) {
      toast({
        title: 'Análise de Créditos vinculada',
        description: 'O levantamento foi associado a este cliente.',
      })
      carregarDados()
      setTodosRecuperador((prev) => prev.filter((r) => r.id !== recupId))
    }
  }

  const handleDesvincularRecuperador = async (recupId: string) => {
    const ok = await vincularSimulacaoRecuperadorACliente(recupId, null)
    if (ok) {
      toast({
        title: 'Análise desvinculada',
        description: 'O levantamento foi desvinculado deste cliente.',
      })
      carregarDados()
    }
  }

  const handleVincularSimulacao = async (simId: string) => {
    if (!idCanonico) return
    const ok = await vincularSimulacaoACliente(simId, idCanonico)
    if (ok) {
      toast({
        title: 'Simulação vinculada',
        description: 'A simulação foi associada a este cliente.',
      })
      carregarDados()
      setTodasSimulacoes((prev) => prev.filter((s) => s.id !== simId))
    }
  }

  const handleDesvincularSimulacao = async (simId: string) => {
    const ok = await vincularSimulacaoACliente(simId, null)
    if (ok) {
      toast({
        title: 'Simulação desvinculada',
        description: 'A simulação foi desvinculada deste cliente.',
      })
      carregarDados()
    }
  }

  const handleVincularDiagnostico = async (diagId: string) => {
    if (!idCanonico) return
    try {
      await vincularDiagnosticoACliente(diagId, idCanonico)
      toast({
        title: 'Diagnóstico vinculado',
        description: 'O diagnóstico foi associado a este cliente.',
      })
      carregarDados()
      setTodosDiagnosticos((prev) => prev.filter((d) => d.id !== diagId))
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível vincular o diagnóstico.',
        variant: 'destructive',
      })
    }
  }

  const handleDesvincularDiagnostico = async (diagId: string) => {
    try {
      await vincularDiagnosticoACliente(diagId, null)
      toast({
        title: 'Diagnóstico desvinculado',
        description: 'O diagnóstico foi desvinculado deste cliente.',
      })
      carregarDados()
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível desvincular.',
        variant: 'destructive',
      })
    }
  }

  const handleExcluirConversa = async (conversaId: string) => {
    if (!window.confirm('Deseja realmente remover esta conversa arquivada?')) return
    try {
      await excluirConversaAssistente(conversaId)
      toast({
        title: 'Conversa removida',
        description: 'O registro da conversa foi excluído com sucesso.',
      })
      if (conversaVisualizando?.id === conversaId) {
        setConversaVisualizando(null)
      }
      setConversas((prev) => prev.filter((c) => c.id !== conversaId))
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a conversa.',
        variant: 'destructive',
      })
    }
  }

  // Executa exclusão de uma etapa individual (Configurações, Autoavaliação, Transição, Comparação ou Enquadramento)
  const handleConfirmarExcluirEtapa = async () => {
    if (!etapaParaExcluir || !idCanonico) return
    setIsExcluindoEtapa(true)
    try {
      const { identificador, titulo, diagnosticoId } = etapaParaExcluir

      // Se temos o ID direto do diagnóstico, excluímos diretamente
      if (diagnosticoId) {
        await deleteDiagnostico(diagnosticoId)
      } else {
        await excluirEtapaDiagnosticoPorCliente(idCanonico, identificador)
      }

      // Se foi a etapa de configurações e o cliente for o ativo, limpa dados locais da empresa
      if (identificador === 'configuracoes' && isAtivo) {
        try {
          const { limparDadosEmpresa } = await import('@/types/dadosEmpresa')
          limparDadosEmpresa()
        } catch (e) {
          console.warn('Erro ao limpar localStorage de dados da empresa:', e)
        }
      }

      // Atualiza listagem local de diagnósticos do cliente
      await carregarDados()

      setFeedbackMensagem({
        tipo: 'sucesso',
        texto: `Etapa "${titulo}" excluída com sucesso. Os dados desta fase foram removidos.`,
      })
      setEtapaParaExcluir(null)
      setTimeout(() => setFeedbackMensagem(null), 6000)
    } catch (err) {
      console.error('Erro ao excluir etapa do diagnóstico:', err)
      setFeedbackMensagem({
        tipo: 'erro',
        texto: 'Não foi possível excluir a etapa. Tente novamente.',
      })
      setTimeout(() => setFeedbackMensagem(null), 6000)
    } finally {
      setIsExcluindoEtapa(false)
    }
  }

  // Executa exclusão da trilha completa (todas as etapas + relatórios)
  const handleConfirmarExcluirTrilhaCompleta = async () => {
    if (!id || !cliente) return
    setIsExcluindoTrilhaCompleta(true)
    try {
      const resultado = await excluirDiagnosticoCompletoPorCliente({
        clienteId: idCanonico,
        empresaNome: cliente.nome,
        clienteNome: cliente.nome,
      })

      if (isAtivo) {
        try {
          const { limparDadosEmpresa } = await import('@/types/dadosEmpresa')
          limparDadosEmpresa()
        } catch (e) {
          console.warn('Erro ao limpar localStorage de dados da empresa:', e)
        }
      }

      await carregarDados()

      setFeedbackMensagem({
        tipo: 'sucesso',
        texto: `Trilha completa de diagnósticos excluída com sucesso (${resultado.totalDiagnosticosExcluidos} registros de etapas e ${resultado.totalRelatoriosExcluidos} versões do relatório removidos).`,
      })
      setModalExcluirTrilhaCompleta(false)
      setTimeout(() => setFeedbackMensagem(null), 6000)
    } catch (err) {
      console.error('Erro ao excluir trilha completa:', err)
      setFeedbackMensagem({
        tipo: 'erro',
        texto: 'Erro ao excluir a trilha completa do cliente.',
      })
      setTimeout(() => setFeedbackMensagem(null), 6000)
    } finally {
      setIsExcluindoTrilhaCompleta(false)
    }
  }

  const handleReabrirNoDashboard = () => {
    if (!cliente) return
    selecionarClienteAtivo(cliente.id)
    navigate('/calculadora-ibs-cbs#assistente-analise-container')
  }

  const handleExcluirCliente = async () => {
    if (!cliente) return
    if (
      !window.confirm(
        `Tem certeza que deseja excluir "${cliente.nome}" da carteira? As simulações e diagnósticos permanecerão salvos, mas ficarão desvinculados.`,
      )
    ) {
      return
    }

    try {
      await excluirCliente(cliente.id)
      if (clienteAtivoId === cliente.id) {
        limparClienteAtivo()
      }
      await recarregarClientes()
      toast({
        title: 'Cliente excluído',
        description: 'Cliente removido da carteira com sucesso.',
      })
      navigate('/clientes')
    } catch (err) {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o cliente.',
        variant: 'destructive',
      })
    }
  }

  const formatarData = (iso?: string) => {
    if (!iso) return '—'
    try {
      return new Date(iso).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-slate-50 pt-28 pb-20 text-center text-slate-500 text-sm">
        <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Carregando detalhes do cliente...
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="min-h-screen bg-slate-50 pt-28 pb-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#07132B]">Cliente não encontrado</h2>
        <p className="text-xs text-slate-500">O cliente solicitado não existe ou foi removido.</p>
        <Link to="/clientes">
          <Button variant="outline" size="sm" className="text-xs">
            ← Voltar para Carteira de Clientes
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased pt-20 sm:pt-24 pb-20">
      {/* HEADER DO CLIENTE */}
      <section className="relative py-10 sm:py-12 bg-gradient-to-r from-[#07132B] via-[#0A1A13] to-[#07132B] text-white border-b border-[#D4AF37]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 mb-3">
            <Link
              to="/clientes"
              className="text-xs text-slate-400 hover:text-[#D4AF37] transition-colors"
            >
              ← Carteira de Clientes
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-xs text-[#D4AF37] font-semibold">Detalhes & Histórico</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${isAtivo ? 'bg-[#D4AF37] animate-pulse' : 'bg-slate-400'}`}
                />
                <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
                  Cliente da Carteira {isAtivo ? '• ATUALMENTE ATIVO' : ''}
                </span>
              </div>
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight">
                {cliente.nome}
              </h1>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge className="bg-[#D4AF37] text-[#07132B] font-bold text-xs">
                  {cliente.regime_atual}
                </Badge>
                <Badge variant="outline" className="border-white/20 text-slate-300 text-xs">
                  {cliente.segmento}
                </Badge>
                <Badge variant="outline" className="border-[#D4AF37]/40 text-[#D4AF37] text-xs">
                  UF: {cliente.uf}
                </Badge>
                <span className="text-xs font-mono text-slate-300 ml-1">
                  CNPJ/CPF: {cliente.cnpj_cpf}
                </span>
              </div>
            </div>

            {/* AÇÕES NO HEADER */}
            <div className="flex flex-wrap items-center gap-3">
              {isAtivo ? (
                <Button
                  type="button"
                  onClick={() => limparClienteAtivo()}
                  variant="outline"
                  className="bg-amber-100/10 border-[#D4AF37] text-[#D4AF37] hover:bg-amber-100/20 font-bold text-xs"
                >
                  Desmarcar Ativo
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => {
                    selecionarClienteAtivo(cliente.id)
                    toast({
                      title: 'Cliente Ativo Definido',
                      description: `"${cliente.nome}" é agora o cliente ativo nas simulações e diagnósticos.`,
                    })
                  }}
                  className="bg-[#D4AF37] text-[#07132B] hover:bg-[#c49f2e] font-bold text-xs"
                >
                  Tornar Cliente Ativo
                </Button>
              )}

              <Button
                type="button"
                onClick={() => setModalConviteAberto(true)}
                className="bg-transparent border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 font-bold text-xs"
              >
                Convidar Cliente
              </Button>

              <Button
                type="button"
                onClick={() => setModalEditarAberto(true)}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 text-xs"
              >
                Editar Cadastro
              </Button>

              <Button
                type="button"
                onClick={handleExcluirCliente}
                variant="outline"
                className="border-red-500/40 text-red-300 hover:bg-red-500/20 text-xs"
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* CONVITES DO CLIENTE (SE HOUVER) */}
        {convitesDoCliente.length > 0 && (
          <ListaConvitesPendentes
            convites={convitesDoCliente}
            aoReenviarSucesso={() => carregarConvitesDoCliente()}
          />
        )}

        {/* CARD DE INFORMAÇÕES DE CADASTRO */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#07132B]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#07132B]">
                Ficha Cadastral e Parâmetros Fiscais
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Cadastrado em: {formatarData(cliente.created)}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Razão Social / Nome:</span>
              <strong className="text-slate-800 text-sm block font-heading">{cliente.nome}</strong>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">CNPJ / CPF:</span>
              <strong className="text-slate-800 font-mono text-sm block">{cliente.cnpj_cpf}</strong>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Regime Tributário Atual:</span>
              <strong className="text-[#07132B] font-semibold text-sm block">
                {cliente.regime_atual}
              </strong>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Segmento / Ramo:</span>
              <strong className="text-slate-800 text-sm block">{cliente.segmento}</strong>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">UF da Operação:</span>
              <strong className="text-slate-800 text-sm block">{cliente.uf}</strong>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">E-mail:</span>
              <span className="text-slate-700 block">{cliente.email || 'Não informado'}</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Telefone:</span>
              <span className="text-slate-700 block">{cliente.telefone || 'Não informado'}</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Última Atualização:</span>
              <span className="text-slate-700 block">{formatarData(cliente.updated)}</span>
            </div>
          </div>
        </div>

        {/* ATALHOS RÁPIDOS DE SIMULAÇÃO/DIAGNÓSTICO COM ESTE CLIENTE */}
        <div className="bg-gradient-to-r from-slate-900 to-[#07132B] text-white rounded-2xl p-6 border border-[#D4AF37]/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider">
              Ações Rápidas de Cálculo para este Cliente
            </span>
            <h3 className="text-base font-bold text-white">
              Executar nova análise vinculada a {cliente.nome}
            </h3>
            <p className="text-xs text-slate-300">
              Ao abrir a Calculadora ou Diagnóstico com este cliente ativo, os resultados e
              conversas do assistente serão associados automaticamente à carteira.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              onClick={() => {
                selecionarClienteAtivo(cliente.id)
                navigate('/recuperador-creditos')
              }}
              className="bg-[#2ECC71] text-[#07132B] hover:bg-[#27ae60] font-bold text-xs"
            >
              Recuperador de Créditos (60m)
            </Button>
            <Button
              type="button"
              onClick={() => {
                selecionarClienteAtivo(cliente.id)
                navigate('/calculadora-ibs-cbs')
              }}
              className="bg-[#D4AF37] text-[#07132B] hover:bg-[#c49f2e] font-bold text-xs"
            >
              Abrir Calculadora IBS/CBS
            </Button>
            <Button
              type="button"
              onClick={handleReabrirNoDashboard}
              variant="outline"
              className="border-[#D4AF37]/50 text-[#D4AF37] hover:bg-white/10 text-xs font-bold"
            >
              Consultar Assistente de Análise
            </Button>
            <Button
              type="button"
              onClick={() => {
                selecionarClienteAtivo(cliente.id)
                navigate('/diagnostico')
              }}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 text-xs"
            >
              Novo Diagnóstico Completo
            </Button>
          </div>
        </div>

        {/* HISTÓRICO DO CLIENTE (SIMULAÇÕES, DIAGNÓSTICOS E CONVERSAS DO ASSISTENTE) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Barra de Abas */}
          <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setAbaHistorico('simulacoes')}
                className={`text-xs px-4 py-2 rounded-xl font-bold transition-all ${
                  abaHistorico === 'simulacoes'
                    ? 'bg-[#07132B] text-[#D4AF37] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 bg-transparent'
                }`}
              >
                Simulações Calculadora ({simulacoes.length})
              </button>

              <button
                type="button"
                onClick={() => setAbaHistorico('recuperador')}
                className={`text-xs px-4 py-2 rounded-xl font-bold transition-all ${
                  abaHistorico === 'recuperador'
                    ? 'bg-[#07132B] text-[#2ECC71] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 bg-transparent'
                }`}
              >
                Recuperador de Créditos ({recuperadorSims.length})
              </button>

              <button
                type="button"
                onClick={() => setAbaHistorico('diagnosticos')}
                className={`text-xs px-4 py-2 rounded-xl font-bold transition-all ${
                  abaHistorico === 'diagnosticos'
                    ? 'bg-[#07132B] text-[#D4AF37] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 bg-transparent'
                }`}
              >
                Diagnósticos Tributários ({diagnosticos.length})
              </button>

              <button
                type="button"
                onClick={() => setAbaHistorico('conversas')}
                className={`text-xs px-4 py-2 rounded-xl font-bold transition-all ${
                  abaHistorico === 'conversas'
                    ? 'bg-[#07132B] text-[#D4AF37] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 bg-transparent'
                }`}
              >
                Conversas do Assistente ({conversas.length})
              </button>
            </div>

            {abaHistorico !== 'conversas' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={abrirModalVincular}
                className="text-xs border-[#D4AF37]/50 text-[#07132B] hover:bg-amber-50 font-semibold"
              >
                + Vincular Simulação / Diagnóstico Existente
              </Button>
            )}

            {abaHistorico === 'conversas' && (
              <Button
                type="button"
                size="sm"
                onClick={handleReabrirNoDashboard}
                className="text-xs bg-[#07132B] text-[#D4AF37] hover:bg-[#0c1f44] font-bold"
              >
                Nova Pergunta no Assistente →
              </Button>
            )}
          </div>

          {/* ABA 1: SIMULAÇÕES CALCULADORA IBS/CBS */}
          {abaHistorico === 'simulacoes' && (
            <div className="p-6">
              {simulacoes.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <span className="text-sm font-semibold text-slate-700 block">
                    Nenhuma simulação salva vinculada a este cliente
                  </span>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Faça uma simulação na Calculadora IBS/CBS com o cliente ativo selecionado, ou
                    vincule uma simulação salva anteriormente.
                  </p>
                  <div className="pt-2 flex justify-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        selecionarClienteAtivo(cliente.id)
                        navigate('/calculadora-ibs-cbs')
                      }}
                      className="bg-[#07132B] text-[#D4AF37] hover:bg-[#0B1E3F] text-xs font-bold"
                    >
                      Criar Simulação Agora
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={abrirModalVincular}
                      className="text-xs"
                    >
                      Vincular Existente
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {simulacoes.map((sim) => (
                    <div
                      key={sim.id}
                      className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl p-4.5 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                          <h4 className="text-sm font-bold text-[#07132B] truncate">{sim.nome}</h4>
                          <Badge
                            variant="outline"
                            className="text-[10px] border-slate-300 text-slate-600 uppercase"
                          >
                            {sim.origem}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span>
                            Data: <strong>{formatarData(sim.created)}</strong>
                          </span>
                          {sim.faturamento_mensal && (
                            <span>
                              Fat. Mensal: <strong>{formatarMoeda(sim.faturamento_mensal)}</strong>
                            </span>
                          )}
                          {sim.regime_recomendado && (
                            <span className="text-[#07132B]">
                              Recomendado: <strong>{sim.regime_recomendado}</strong>
                            </span>
                          )}
                          {sim.economia_anual !== undefined && sim.economia_anual > 0 && (
                            <span className="text-emerald-700 font-semibold">
                              Economia: +{formatarMoeda(sim.economia_anual)}/ano
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          to={`/calculadora-ibs-cbs?carregar=${sim.id}`}
                          className="text-xs font-bold bg-[#07132B] text-[#D4AF37] hover:bg-[#0B1E3F] px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Abrir na Calculadora →
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDesvincularSimulacao(sim.id)}
                          className="text-xs text-slate-500 hover:text-red-600 px-2.5 py-1.5 hover:bg-red-50 rounded-lg transition-colors"
                          title="Desvincular do cliente"
                        >
                          Desvincular
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ABA RECUPERADOR DE CRÉDITOS */}
          {abaHistorico === 'recuperador' && (
            <div className="p-6">
              {recuperadorSims.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <span className="text-sm font-semibold text-slate-700 block">
                    Nenhum levantamento de créditos salvo para este cliente
                  </span>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Acesse o Recuperador de Créditos com este cliente ativo para apurar os 60 meses
                    com correção SELIC das teses de PIS/COFINS e Folha/Previdenciário.
                  </p>
                  <div className="pt-2 flex justify-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        selecionarClienteAtivo(cliente.id)
                        navigate('/recuperador-creditos')
                      }}
                      className="bg-[#07132B] text-[#2ECC71] hover:bg-[#0B1E3F] text-xs font-bold"
                    >
                      Apurar Créditos Agora
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={abrirModalVincular}
                      className="text-xs"
                    >
                      Vincular Existente
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {recuperadorSims.map((sim) => (
                    <div
                      key={sim.id}
                      className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl p-4.5 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#2ECC71]" />
                          <h4 className="text-sm font-bold text-[#07132B] truncate">{sim.nome}</h4>
                          <Badge
                            variant="outline"
                            className="text-[10px] border-slate-300 text-slate-600 uppercase"
                          >
                            {sim.origem}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span>
                            Data: <strong>{formatarData(sim.created)}</strong>
                          </span>
                          <span className="text-emerald-700 font-bold font-mono">
                            Total Integral c/ SELIC: {formatarMoeda(sim.total_recuperavel_integral)}
                          </span>
                          <span className="text-[#07132B]">
                            Conservador: {formatarMoeda(sim.total_recuperavel_conservador)}
                          </span>
                          <span>PIS/COFINS: {formatarMoeda(sim.total_pis_cofins)}</span>
                          <span>Folha/INSS: {formatarMoeda(sim.total_folha)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          to="/recuperador-creditos"
                          onClick={() => selecionarClienteAtivo(cliente.id)}
                          className="text-xs font-bold bg-[#07132B] text-[#2ECC71] hover:bg-[#0B1E3F] px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Abrir no Recuperador →
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDesvincularRecuperador(sim.id)}
                          className="text-xs text-slate-500 hover:text-red-600 px-2.5 py-1.5 hover:bg-red-50 rounded-lg transition-colors"
                          title="Desvincular do cliente"
                        >
                          Desvincular
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ABA 2: DIAGNÓSTICOS FEITOS E GESTÃO DAS ETAPAS DA TRILHA */}
          {abaHistorico === 'diagnosticos' && (
            <div className="p-6 space-y-6">
              {/* FEEDBACK DE SUCESSO OU ERRO */}
              {feedbackMensagem && (
                <div
                  className={`p-4 rounded-xl border text-xs sm:text-sm font-medium flex items-center justify-between ${
                    feedbackMensagem.tipo === 'sucesso'
                      ? 'bg-emerald-50 text-[#07132B] border-emerald-300'
                      : 'bg-red-50 text-red-900 border-red-300'
                  }`}
                >
                  <span>{feedbackMensagem.texto}</span>
                  <button
                    type="button"
                    onClick={() => setFeedbackMensagem(null)}
                    className="text-xs font-bold uppercase underline tracking-wider ml-4 hover:opacity-75"
                  >
                    Fechar
                  </button>
                </div>
              )}

              {/* PAINEL DAS 5 ETAPAS DA TRILHA DE DIAGNÓSTICO DO CLIENTE */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-200">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]">
                      Trilha Diamond Group 5.0
                    </div>
                    <h3 className="text-base font-bold text-[#07132B]">
                      Etapas da Trilha de Diagnóstico Tributário
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Gerencie cada etapa individualmente para este cliente ou limpe etapas que
                      precisam ser recalculadas.
                    </p>
                  </div>
                  {diagnosticos.length > 0 && (
                    <Button
                      type="button"
                      onClick={() => setModalExcluirTrilhaCompleta(true)}
                      className="border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-900 text-xs font-bold shrink-0 self-start sm:self-center"
                    >
                      Excluir Trilha Completa
                    </Button>
                  )}
                </div>

                {/* Grade das 5 etapas da trilha com status e botão de exclusão individual */}
                {(() => {
                  const diagConfig = diagnosticos.find(
                    (d) =>
                      d.configuracoes_diagnostico_json &&
                      Object.keys(d.configuracoes_diagnostico_json).length > 0,
                  )
                  const diag360 = diagnosticos.find(
                    (d) => d.tipo_diagnostico === '360' || d.tipo_diagnostico === 'autoavaliacao',
                  )
                  const diagTransicao = diagnosticos.find((d) => d.tipo_diagnostico === 'transicao')
                  const diagRegimes = diagnosticos.find((d) => d.tipo_diagnostico === 'regimes')
                  const diagEnquadramento = diagnosticos.find(
                    (d) => d.tipo_diagnostico === 'enquadramento' || !d.tipo_diagnostico,
                  )

                  const etapasConfig: Array<{
                    identificador: EtapaDiagnosticoIdentificador
                    numero: string
                    titulo: string
                    descricao: string
                    rotaRefazer: string
                    possuiDados: boolean
                    diagnosticoId?: string
                  }> = [
                    {
                      identificador: 'configuracoes',
                      numero: '01',
                      titulo: 'Configurações Iniciais',
                      descricao:
                        'Cadastro fiscal base (segmento, faturamento, folha de pagamento e alíquotas)',
                      rotaRefazer: '/diagnostico/configuracoes',
                      possuiDados: !!diagConfig || diagnosticos.length > 0,
                      diagnosticoId: diagConfig?.id,
                    },
                    {
                      identificador: 'autoavaliacao',
                      numero: '02',
                      titulo: 'Autoavaliação 360°',
                      descricao:
                        'Matriz das 7 frentes de risco (vulnerabilidade, proteção e plano 30-60-90)',
                      rotaRefazer: '/diagnostico/autoavaliacao',
                      possuiDados: !!diag360,
                      diagnosticoId: diag360?.id,
                    },
                    {
                      identificador: 'transicao',
                      numero: '03',
                      titulo: 'Transição Fiscal',
                      descricao:
                        'Cronograma 2026–2033 (IBS/CBS), split payment e testes operacionais',
                      rotaRefazer: '/diagnostico/transicao',
                      possuiDados: !!diagTransicao,
                      diagnosticoId: diagTransicao?.id,
                    },
                    {
                      identificador: 'regimes',
                      numero: '04',
                      titulo: 'Comparação de Regime',
                      descricao:
                        'Comparativo Simples Nacional vs Presumido vs Lucro Real na Reforma',
                      rotaRefazer: '/diagnostico/regimes',
                      possuiDados: !!diagRegimes,
                      diagnosticoId: diagRegimes?.id,
                    },
                    {
                      identificador: 'enquadramento',
                      numero: '05',
                      titulo: 'Enquadramento & Pareceres',
                      descricao:
                        'Recomendação final, projeções de economia anual e parecer técnico',
                      rotaRefazer: '/diagnostico',
                      possuiDados: !!diagEnquadramento,
                      diagnosticoId: diagEnquadramento?.id,
                    },
                  ]

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                      {etapasConfig.map((et) => (
                        <div
                          key={et.identificador}
                          className={`rounded-xl p-3.5 border flex flex-col justify-between transition-colors ${
                            et.possuiDados
                              ? 'bg-white border-slate-300 shadow-xs'
                              : 'bg-slate-100/60 border-slate-200 border-dashed opacity-80'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[11px] font-bold text-[#D4AF37] tracking-wider">
                                ETAPA {et.numero}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  et.possuiDados
                                    ? 'bg-emerald-100 text-[#07132B]'
                                    : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {et.possuiDados ? 'Registrada' : 'Pendente'}
                              </span>
                            </div>
                            <h4 className="font-bold text-xs text-[#07132B] leading-tight mb-1">
                              {et.titulo}
                            </h4>
                            <p className="text-[11px] text-slate-500 leading-normal">
                              {et.descricao}
                            </p>
                          </div>

                          <div className="pt-3 mt-3 border-t border-slate-100 flex flex-col gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                selecionarClienteAtivo(cliente.id)
                                navigate(et.rotaRefazer)
                              }}
                              className="w-full text-center py-1 px-2 rounded-lg text-[11px] font-bold bg-[#07132B] text-[#D4AF37] hover:bg-[#0c1f44] transition-colors"
                            >
                              {et.possuiDados ? 'Abrir / Recalcular' : 'Executar Etapa'}
                            </button>

                            {et.possuiDados && (
                              <button
                                type="button"
                                onClick={() => setEtapaParaExcluir(et)}
                                className="w-full text-center py-1 px-2 rounded-lg text-[11px] font-semibold border border-red-200 text-red-700 hover:bg-red-50 transition-colors"
                              >
                                Excluir esta etapa
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>

              {/* LISTAGEM DOS REGISTROS SALVOS NO BANCO */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Histórico de Registros ({diagnosticos.length})
                  </h4>
                  <span className="text-xs text-slate-400">
                    {diagnosticos.length === 0
                      ? 'Nenhum registro individual'
                      : 'Cálculos salvos vinculados à conta'}
                  </span>
                </div>

                {diagnosticos.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 space-y-3">
                    <span className="text-sm font-semibold text-slate-700 block">
                      Nenhum diagnóstico registrado para este cliente
                    </span>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Realize diagnósticos com o cliente ativo selecionado para compor a trilha
                      tributária.
                    </p>
                    <div className="pt-2 flex justify-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          selecionarClienteAtivo(cliente.id)
                          navigate('/diagnostico')
                        }}
                        className="bg-[#07132B] text-[#D4AF37] hover:bg-[#0B1E3F] text-xs font-bold"
                      >
                        Iniciar Diagnóstico
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={abrirModalVincular}
                        className="text-xs"
                      >
                        Vincular Existente
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {diagnosticos.map((diag) => (
                      <div
                        key={diag.id}
                        className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl p-4 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-600" />
                            <h4 className="text-sm font-bold text-[#07132B]">
                              {diag.tipo_diagnostico === '360'
                                ? 'Etapa 02 • Autoavaliação 360°'
                                : diag.tipo_diagnostico === 'transicao'
                                  ? 'Etapa 03 • Transição Fiscal'
                                  : diag.tipo_diagnostico === 'regimes'
                                    ? 'Etapa 04 • Comparação de Regime'
                                    : diag.tipo_diagnostico === 'enquadramento'
                                      ? 'Etapa 05 • Enquadramento Completo'
                                      : 'Diagnóstico Tributário'}
                            </h4>
                            <Badge className="bg-[#07132B] text-[#D4AF37] text-[10px]">
                              {diag.regime_recomendado || 'Concluído'}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span>
                              Data: <strong>{formatarData(diag.created)}</strong>
                            </span>
                            {diag.empresa && (
                              <span>
                                Empresa: <strong>{diag.empresa}</strong>
                              </span>
                            )}
                            {diag.economia_estimada && diag.economia_estimada > 0 && (
                              <span className="text-emerald-700 font-semibold">
                                Economia: {formatarMoeda(diag.economia_estimada)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              selecionarClienteAtivo(cliente.id)
                              const rotaDestino =
                                diag.tipo_diagnostico === '360'
                                  ? '/diagnostico/relatorio?aba=autoavaliacao'
                                  : diag.tipo_diagnostico === 'transicao'
                                    ? '/diagnostico/relatorio?aba=transicao'
                                    : diag.tipo_diagnostico === 'regimes'
                                      ? '/diagnostico/relatorio?aba=regimes'
                                      : '/diagnostico/relatorio?aba=enquadramento'
                              navigate(rotaDestino)
                            }}
                            className="text-xs font-bold bg-[#07132B] text-[#D4AF37] hover:bg-[#0B1E3F] px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Ver Relatório →
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              selecionarClienteAtivo(cliente.id)
                              navigate('/diagnostico/relatorio')
                            }}
                            className="text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            Consolidado
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setEtapaParaExcluir({
                                identificador:
                                  diag.tipo_diagnostico === '360'
                                    ? 'autoavaliacao'
                                    : diag.tipo_diagnostico === 'transicao'
                                      ? 'transicao'
                                      : diag.tipo_diagnostico === 'regimes'
                                        ? 'regimes'
                                        : 'enquadramento',
                                numero:
                                  diag.tipo_diagnostico === '360'
                                    ? '02'
                                    : diag.tipo_diagnostico === 'transicao'
                                      ? '03'
                                      : diag.tipo_diagnostico === 'regimes'
                                        ? '04'
                                        : '05',
                                titulo:
                                  diag.tipo_diagnostico === '360'
                                    ? 'Autoavaliação 360°'
                                    : diag.tipo_diagnostico === 'transicao'
                                      ? 'Transição Fiscal'
                                      : diag.tipo_diagnostico === 'regimes'
                                        ? 'Comparação de Regime'
                                        : 'Enquadramento Completo',
                                descricao: `Registro criado em ${formatarData(diag.created)}`,
                                rotaRefazer: '/diagnostico',
                                possuiDados: true,
                                diagnosticoId: diag.id,
                              })
                            }
                            className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-200 transition-colors"
                            title="Excluir este registro"
                          >
                            Excluir Etapa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDesvincularDiagnostico(diag.id)}
                            className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Desvincular do cliente sem apagar o registro"
                          >
                            Desvincular
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ABA 3: CONVERSAS ARQUIVADAS DO ASSISTENTE DE ANÁLISE */}
          {abaHistorico === 'conversas' && (
            <div className="p-6">
              {conversas.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <span className="text-sm font-semibold text-slate-700 block">
                    Nenhuma conversa arquivada para este cliente
                  </span>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Ao utilizar o Assistente de Análise na Calculadora IBS/CBS com o cliente ativo
                    selecionado, os pareceres, perguntas e respostas serão arquivados aqui para você
                    reabrir no mês seguinte e verificar o que foi analisado.
                  </p>
                  <div className="pt-2 flex justify-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleReabrirNoDashboard}
                      className="bg-[#07132B] text-[#D4AF37] hover:bg-[#0B1E3F] text-xs font-bold"
                    >
                      Abrir Assistente com {cliente.nome}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {conversas.map((conv) => (
                    <div
                      key={conv.id}
                      className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl p-4.5 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#07132B]" />
                          <h4 className="text-sm font-bold text-[#07132B] truncate">
                            {conv.titulo}
                          </h4>
                          <Badge className="bg-[#07132B] text-[#D4AF37] text-[10px]">
                            {conv.mensagens?.length || 0} mensagens
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span>
                            Última atualização: <strong>{formatarData(conv.updated)}</strong>
                          </span>
                          <span>
                            Iniciada em: <strong>{formatarData(conv.created)}</strong>
                          </span>
                        </div>

                        {/* Preview da última mensagem */}
                        {conv.mensagens && conv.mensagens.length > 0 && (
                          <p className="text-xs text-slate-600 line-clamp-1 italic bg-white p-2 rounded border border-slate-200 max-w-2xl">
                            "{conv.mensagens[conv.mensagens.length - 1].texto}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setConversaVisualizando(conv)}
                          className="text-xs bg-[#07132B] text-[#D4AF37] hover:bg-[#0c1f44] font-bold h-8 px-3"
                        >
                          Ler Parecer Completo
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleReabrirNoDashboard}
                          className="text-xs border-[#D4AF37] text-[#07132B] hover:bg-amber-50 font-bold h-8 px-3"
                        >
                          Continuar Perguntando
                        </Button>
                        <button
                          type="button"
                          onClick={() => handleExcluirConversa(conv.id)}
                          className="text-xs text-slate-400 hover:text-red-600 px-2 py-1 hover:bg-red-50 rounded transition-colors"
                          title="Excluir do histórico"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE LEITURA COMPLETA DA CONVERSA ARQUIVADA */}
      {conversaVisualizando && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#07132B] text-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border-2 border-[#D4AF37]">
            <div className="p-5 border-b border-[#D4AF37]/30 bg-slate-900 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-[#D4AF37] text-[#07132B] font-bold text-[10px]">
                    Histórico Arquivado
                  </Badge>
                  <span className="text-xs text-slate-400">
                    {formatarData(conversaVisualizando.updated)}
                  </span>
                </div>
                <h3 className="font-heading font-extrabold text-base sm:text-lg text-white">
                  {conversaVisualizando.titulo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setConversaVisualizando(null)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 rounded"
              >
                Fechar [X]
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
              {conversaVisualizando.mensagens.map((msg, idx) => {
                const isUser = msg.papel === 'usuario'
                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    <span className="text-[10px] font-mono text-slate-400 px-1">
                      {isUser ? 'Pergunta do Analista' : 'Parecer do Assistente'} •{' '}
                      {formatarData(msg.data)}
                    </span>
                    <div
                      className={`max-w-[90%] rounded-2xl p-4 leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? 'bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-[#07132B] font-medium shadow'
                          : 'bg-slate-900 text-slate-100 border border-[#D4AF37]/30 shadow'
                      }`}
                    >
                      {msg.texto}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="p-4 bg-slate-900 border-t border-[#D4AF37]/30 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConversaVisualizando(null)}
                className="text-xs text-slate-300 border-white/20 hover:bg-white/10"
              >
                Fechar Visualização
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setConversaVisualizando(null)
                  handleReabrirNoDashboard()
                }}
                className="bg-[#D4AF37] hover:bg-[#c49f2e] text-[#07132B] font-bold text-xs h-8 px-4"
              >
                Abrir no Assistente e Continuar Análise →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONVITE */}
      <ModalConvidarCliente
        aberto={modalConviteAberto}
        aoFechar={() => setModalConviteAberto(false)}
        cliente={cliente}
        aoConviteEnviado={() => carregarConvitesDoCliente()}
      />

      {/* MODAL EDITAR CLIENTE */}
      <ModalCliente
        open={modalEditarAberto}
        onOpenChange={setModalEditarAberto}
        clienteParaEditar={cliente}
        onSalvoComSucesso={(cliAtualizado) => {
          setCliente(cliAtualizado)
          recarregarClientes()
        }}
      />

      {/* MODAL VINCULAR SIMULAÇÃO OU DIAGNÓSTICO EXISTENTE */}
      {modalVincularAberto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
                  <h3 className="font-bold text-base text-[#07132B]">
                    Vincular Registros Existentes a {cliente.nome}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Associe simulações e diagnósticos previamente salvos sem cliente à ficha deste
                  cliente.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalVincularAberto(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold px-2 py-1 rounded"
              >
                Fechar [X]
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Seção 1: Simulações sem vínculo ou de outros */}
              <div className="space-y-3">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                  Simulações da Calculadora ({todasSimulacoes.length} disponíveis)
                </span>
                {todasSimulacoes.length === 0 ? (
                  <p className="text-slate-400 italic">
                    Nenhuma simulação avulsa para vincular no momento.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {todasSimulacoes.map((sim) => (
                      <div
                        key={sim.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3"
                      >
                        <div>
                          <strong className="text-slate-800 block">{sim.nome}</strong>
                          <span className="text-[11px] text-slate-500">
                            {formatarData(sim.created)} • Fat:{' '}
                            {formatarMoeda(sim.faturamento_mensal || 0)}
                          </span>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleVincularSimulacao(sim.id)}
                          className="bg-[#07132B] hover:bg-[#0B1E3F] text-[#D4AF37] text-xs h-7 px-3"
                        >
                          Vincular a este cliente
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Seção 1.5: Recuperador de Créditos */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                  Análises do Recuperador de Créditos ({todosRecuperador.length} disponíveis)
                </span>
                {todosRecuperador.length === 0 ? (
                  <p className="text-slate-400 italic">
                    Nenhuma análise de recuperação avulsa para vincular no momento.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {todosRecuperador.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3"
                      >
                        <div>
                          <strong className="text-slate-800 block">{rec.nome}</strong>
                          <span className="text-[11px] text-slate-500">
                            {formatarData(rec.created)} • Total:{' '}
                            {formatarMoeda(rec.total_recuperavel_integral)}
                          </span>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleVincularRecuperador(rec.id)}
                          className="bg-[#07132B] hover:bg-[#0B1E3F] text-[#2ECC71] text-xs h-7 px-3 font-bold"
                        >
                          Vincular a este cliente
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Seção 2: Diagnósticos sem vínculo */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                  Diagnósticos Tributários ({todosDiagnosticos.length} disponíveis)
                </span>
                {todosDiagnosticos.length === 0 ? (
                  <p className="text-slate-400 italic">
                    Nenhum diagnóstico avulso para vincular no momento.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {todosDiagnosticos.map((diag) => (
                      <div
                        key={diag.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3"
                      >
                        <div>
                          <strong className="text-slate-800 block">
                            {diag.tipo_diagnostico || 'Diagnóstico'}
                          </strong>
                          <span className="text-[11px] text-slate-500">
                            {formatarData(diag.created)} • {diag.empresa || 'Sem nome'}
                          </span>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleVincularDiagnostico(diag.id)}
                          className="bg-[#07132B] hover:bg-[#0B1E3F] text-[#D4AF37] text-xs h-7 px-3"
                        >
                          Vincular a este cliente
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalVincularAberto(false)}
                className="text-xs"
              >
                Concluir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DIAMOND GROUP - EXCLUIR ETAPA INDIVIDUAL */}
      {etapaParaExcluir && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#07132B] text-slate-100 rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-[#D4AF37] space-y-4">
            <div>
              <div className="text-[11px] font-bold tracking-widest uppercase text-[#D4AF37] mb-1">
                Diamond Group • Excluir Etapa da Trilha
              </div>
              <h3 className="font-heading font-bold text-lg text-white">
                Confirmar exclusão da Etapa {etapaParaExcluir.numero}: {etapaParaExcluir.titulo}
              </h3>
            </div>

            <div className="text-xs text-slate-300 leading-relaxed space-y-2">
              <p>
                Tem certeza que deseja excluir os dados salvos da etapa{' '}
                <strong className="text-white font-semibold">{etapaParaExcluir.titulo}</strong> de{' '}
                <strong className="text-[#D4AF37]">{cliente.nome}</strong>?
              </p>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                {etapaParaExcluir.descricao}
              </div>
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-[11px] text-red-200 font-medium">
                Aviso: Esta ação é irreversível. O cálculo e os dados gravados desta etapa serão
                apagados e você poderá recalculá-la a qualquer momento.
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={isExcluindoEtapa}
                onClick={() => setEtapaParaExcluir(null)}
                className="rounded-xl border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={isExcluindoEtapa}
                onClick={handleConfirmarExcluirEtapa}
                className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs border border-red-500 shadow-md"
              >
                {isExcluindoEtapa ? 'Excluindo etapa...' : 'Confirmar Exclusão'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DIAMOND GROUP - EXCLUIR TRILHA COMPLETA DO CLIENTE */}
      {modalExcluirTrilhaCompleta && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#07132B] text-slate-100 rounded-2xl max-w-lg w-full p-6 shadow-2xl border-2 border-[#D4AF37] space-y-4">
            <div>
              <div className="text-[11px] font-bold tracking-widest uppercase text-[#D4AF37] mb-1">
                Diamond Group • Excluir Trilha Completa
              </div>
              <h3 className="font-heading font-bold text-xl text-white">
                Excluir Trilha Completa de Diagnósticos
              </h3>
            </div>

            <div className="text-xs text-slate-300 leading-relaxed space-y-3">
              <p>
                Você está prestes a apagar permanentemente todas as 5 etapas da trilha de
                diagnóstico tributário e os relatórios consolidados de{' '}
                <strong className="text-white font-semibold underline decoration-[#D4AF37]">
                  {cliente.nome}
                </strong>
                .
              </p>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-[11px]">
                <div className="text-[#D4AF37] font-bold uppercase tracking-wider text-[10px]">
                  Itens que serão removidos:
                </div>
                <div className="text-slate-300 space-y-1">
                  <div>• Etapa 01 - Configurações Iniciais</div>
                  <div>• Etapa 02 - Autoavaliação 360° (7 Frentes de Risco)</div>
                  <div>• Etapa 03 - Transição Fiscal (IBS/CBS 2026-2033)</div>
                  <div>• Etapa 04 - Comparação de Regime</div>
                  <div>• Etapa 05 - Enquadramento & Pareceres</div>
                  <div>• Versões salvas do Relatório Consolidado</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-[11px] text-red-200 font-medium">
                Ação Irreversível: Todos os cálculos e históricos deste cliente serão removidos. Os
                cadastros de simulações da calculadora e do recuperador permanecerão intactos.
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={isExcluindoTrilhaCompleta}
                onClick={() => setModalExcluirTrilhaCompleta(false)}
                className="rounded-xl border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={isExcluindoTrilhaCompleta}
                onClick={handleConfirmarExcluirTrilhaCompleta}
                className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs border border-red-500 shadow-lg"
              >
                {isExcluindoTrilhaCompleta ? 'Excluindo trilha...' : 'Excluir Trilha Completa'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
