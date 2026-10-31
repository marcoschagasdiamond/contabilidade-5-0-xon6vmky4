import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useDadosEmpresa } from '@/context/DadosEmpresaContext'
import { useClienteAtivo } from '@/context/ClienteAtivoContext'
import { SeletorClienteAtivo } from '@/components/clientes/SeletorClienteAtivo'
import { listarSimulacoes } from '@/services/simulacoesCalculadora'
import { listarSimulacoesRecuperador } from '@/services/simulacoesRecuperador'
import { getDiagnosticos } from '@/services/diagnosticos'
import {
  listarRelatoriosPersonalizados,
  salvarRelatorioPersonalizado,
  renomearRelatorioPersonalizado,
  excluirRelatorioPersonalizado,
} from '@/services/relatoriosPersonalizados'
import { gerarRelatorioPersonalizadoPDF } from '@/lib/pdfRelatorioPersonalizado'
import { formatarCNPJ } from '@/lib/cnpj'
import type { SimulacaoCalculadora } from '@/types/simulacaoCalculadora'
import type { SimulacaoRecuperador } from '@/types/recuperadorCreditos'
import type { DiagnosticoRecord } from '@/services/diagnosticos'
import type {
  RelatorioPersonalizadoRecord,
  ConfiguracaoRelatorioPersonalizado,
  ModuloAnaliseTipo,
  SecaoCalculadoraTipo,
  SecaoRecuperadorTipo,
  SecaoDiagnosticoTipo,
  SecaoRelatorioTipo,
} from '@/types/relatorioPersonalizado'

export default function MeusRelatorios() {
  const { user, isEmpresario, isAdmin, isMaster } = useAuth()
  const { dadosEmpresa, temDadosSalvos, empresaVinculadaId } = useDadosEmpresa()
  const { clienteAtivo, clienteAtivoId } = useClienteAtivo()

  // Estados de carregamento e dados de origem
  const [carregandoDados, setCarregandoDados] = useState(true)
  const [simulacoesCalc, setSimulacoesCalc] = useState<SimulacaoCalculadora[]>([])
  const [simulacoesRecup, setSimulacoesRecup] = useState<SimulacaoRecuperador[]>([])
  const [diagnosticosLista, setDiagnosticosLista] = useState<DiagnosticoRecord[]>([])
  const [relatoriosSalvos, setRelatoriosSalvos] = useState<RelatorioPersonalizadoRecord[]>([])

  // Passo ativo do assistente de personalização: 1 = Análises, 2 = Seções, 3 = Título/Notas, 4 = Visualizar/Gerar
  const [passoAtivo, setPassoAtivo] = useState<1 | 2 | 3 | 4>(1)

  // Seleções do fluxo
  const [incluirCalc, setIncluirCalc] = useState(true)
  const [incluirRecup, setIncluirRecup] = useState(true)
  const [incluirDiag, setIncluirDiag] = useState(true)

  const [simulacaoCalcSelecionadaId, setSimulacaoCalcSelecionadaId] = useState<string>('')
  const [simulacaoRecupSelecionadaId, setSimulacaoRecupSelecionadaId] = useState<string>('')
  const [diagnosticoSelecionadoId, setDiagnosticoSelecionadoId] = useState<string>('')

  // Seções da Calculadora
  const [secoesCalc, setSecoesCalc] = useState<SecaoCalculadoraTipo[]>([
    'calc_resumo',
    'calc_comparativo',
    'calc_evolucao',
    'calc_split',
    'calc_creditos',
    'calc_passos',
  ])

  // Seções do Recuperador
  const [secoesRecup, setSecoesRecup] = useState<SecaoRecuperadorTipo[]>([
    'recup_resumo',
    'recup_tipos',
    'recup_ano_a_ano',
    'recup_passos',
  ])

  // Seções do Diagnóstico
  const [secoesDiag, setSecoesDiag] = useState<SecaoDiagnosticoTipo[]>([
    'diag_resumo',
    'diag_matriz_riscos',
    'diag_autoavaliacao',
    'diag_transicao',
    'diag_enquadramento',
  ])

  // Título e Observações livres
  const [tituloPersonalizado, setTituloPersonalizado] = useState('')
  const [observacoesPersonalizadas, setObservacoesPersonalizadas] = useState('')

  // Ações e feedbacks
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [salvandoRelatorio, setSalvandoRelatorio] = useState(false)
  const [feedbackSucesso, setFeedbackSucesso] = useState<string | null>(null)
  const [feedbackErro, setFeedbackErro] = useState<string | null>(null)

  // Modais de renomear e excluir
  const [relatorioParaRenomear, setRelatorioParaRenomear] =
    useState<RelatorioPersonalizadoRecord | null>(null)
  const [novoNomeTemp, setNovoNomeTemp] = useState('')
  const [relatorioParaExcluir, setRelatorioParaExcluir] =
    useState<RelatorioPersonalizadoRecord | null>(null)

  // Nome da Empresa e CNPJ (somente leitura cadastral do bloco 3)
  const nomeEmpresaOficial = useMemo(() => {
    return (
      clienteAtivo?.nome ||
      dadosEmpresa?.nomeEmpresa ||
      (user as any)?.nome_empresa ||
      (user as any)?.nome ||
      'Minha Empresa'
    )
  }, [clienteAtivo, dadosEmpresa, user])

  const cnpjOficial = useMemo(() => {
    return (
      clienteAtivo?.cnpj_cpf ||
      (clienteAtivo as any)?.cnpj ||
      dadosEmpresa?.cnpj ||
      (user as any)?.cnpj ||
      ''
    )
  }, [clienteAtivo, dadosEmpresa, user])

  // Carregar dados de análises e relatórios salvos
  const carregarTudo = useCallback(async () => {
    if (!user?.id) return
    setCarregandoDados(true)
    try {
      // 1. Simulações da Calculadora
      const calcs = isEmpresario
        ? await listarSimulacoes(user.id)
        : clienteAtivoId
          ? (await listarSimulacoes()).filter((s) => s.cliente_id === clienteAtivoId)
          : await listarSimulacoes()

      setSimulacoesCalc(calcs)
      if (calcs.length > 0 && !simulacaoCalcSelecionadaId) {
        setSimulacaoCalcSelecionadaId(calcs[0].id)
      }

      // 2. Simulações do Recuperador
      const recups = isEmpresario
        ? await listarSimulacoesRecuperador(user.id)
        : clienteAtivoId
          ? (await listarSimulacoesRecuperador()).filter((s) => s.cliente_id === clienteAtivoId)
          : await listarSimulacoesRecuperador()

      setSimulacoesRecup(recups)
      if (recups.length > 0 && !simulacaoRecupSelecionadaId) {
        setSimulacaoRecupSelecionadaId(recups[0].id)
      }

      // 3. Diagnósticos 360 / Enquadramento
      let diags: DiagnosticoRecord[] = []
      if (isEmpresario) {
        diags = await getDiagnosticos(`user_id = "${user.id}"`)
      } else if (clienteAtivoId) {
        diags = await getDiagnosticos(`cliente_id = "${clienteAtivoId}"`)
      } else {
        diags = await getDiagnosticos()
      }
      setDiagnosticosLista(diags)
      if (diags.length > 0 && !diagnosticoSelecionadoId) {
        setDiagnosticoSelecionadoId(diags[0].id)
      }

      // 4. Relatórios Personalizados Salvos
      const salvos = await listarRelatoriosPersonalizados({
        userId: isEmpresario ? user.id : undefined,
        clienteId: !isEmpresario && clienteAtivoId ? clienteAtivoId : undefined,
        empresaId: empresaVinculadaId || undefined,
      })
      setRelatoriosSalvos(salvos)

      // Ajusta checkboxes iniciais conforme disponibilidade
      setIncluirCalc(calcs.length > 0)
      setIncluirRecup(recups.length > 0)
      setIncluirDiag(diags.length > 0 || temDadosSalvos)
    } catch (err) {
      console.warn('[MeusRelatorios] Erro ao carregar dados:', err)
    } finally {
      setCarregandoDados(false)
    }
  }, [
    user?.id,
    isEmpresario,
    clienteAtivoId,
    empresaVinculadaId,
    temDadosSalvos,
    simulacaoCalcSelecionadaId,
    simulacaoRecupSelecionadaId,
    diagnosticoSelecionadoId,
  ])

  useEffect(() => {
    carregarTudo()
  }, [carregarTudo])

  // Objetos selecionados ativos
  const calcAtiva = useMemo(() => {
    return (
      simulacoesCalc.find((s) => s.id === simulacaoCalcSelecionadaId) || simulacoesCalc[0] || null
    )
  }, [simulacoesCalc, simulacaoCalcSelecionadaId])

  const recupAtivo = useMemo(() => {
    return (
      simulacoesRecup.find((s) => s.id === simulacaoRecupSelecionadaId) ||
      simulacoesRecup[0] ||
      null
    )
  }, [simulacoesRecup, simulacaoRecupSelecionadaId])

  const diagAtivo = useMemo(() => {
    return (
      diagnosticosLista.find((d) => d.id === diagnosticoSelecionadoId) ||
      diagnosticosLista[0] ||
      null
    )
  }, [diagnosticosLista, diagnosticoSelecionadoId])

  // Total de análises disponíveis
  const temCalculadora = simulacoesCalc.length > 0
  const temRecuperador = simulacoesRecup.length > 0
  const temDiagnostico = diagnosticosLista.length > 0 || temDadosSalvos
  const temAlgumaAnalise = temCalculadora || temRecuperador || temDiagnostico

  // Toggle de seções individuais
  const toggleSecaoCalc = (secao: SecaoCalculadoraTipo) => {
    setSecoesCalc((prev) =>
      prev.includes(secao) ? prev.filter((s) => s !== secao) : [...prev, secao],
    )
  }

  const toggleSecaoRecup = (secao: SecaoRecuperadorTipo) => {
    setSecoesRecup((prev) =>
      prev.includes(secao) ? prev.filter((s) => s !== secao) : [...prev, secao],
    )
  }

  const toggleSecaoDiag = (secao: SecaoDiagnosticoTipo) => {
    setSecoesDiag((prev) =>
      prev.includes(secao) ? prev.filter((s) => s !== secao) : [...prev, secao],
    )
  }

  // Montar configuração atual
  const montarConfiguracaoAtual = (): ConfiguracaoRelatorioPersonalizado => {
    const tituloFinal =
      tituloPersonalizado.trim().length > 0
        ? tituloPersonalizado.trim()
        : `Relatório Personalizado — ${nomeEmpresaOficial}`

    return {
      titulo: tituloFinal,
      subtitulo: 'Dossiê técnico consolidado com as análises selecionadas.',
      observacoes: observacoesPersonalizadas.trim(),
      incluirCalculadora: incluirCalc && temCalculadora,
      incluirRecuperador: incluirRecup && temRecuperador,
      incluirDiagnostico: incluirDiag && temDiagnostico,
      secoesCalculadora: secoesCalc,
      secoesRecuperador: secoesRecup,
      secoesDiagnostico: secoesDiag,
      idSimulacaoCalculadora: calcAtiva?.id || null,
      idSimulacaoRecuperador: recupAtivo?.id || null,
      idDiagnostico360: diagAtivo?.id || null,
      snapshotDadosEmpresa: temDadosSalvos ? dadosEmpresa : null,
      snapshotCalculadora: calcAtiva || null,
      snapshotRecuperador: recupAtivo || null,
      snapshotDiagnostico: diagAtivo || null,
    }
  }

  // Gerar PDF direto
  const handleGerarPdf = () => {
    if (!temAlgumaAnalise) {
      setFeedbackErro('Nenhuma análise preenchida disponível para gerar o relatório.')
      return
    }

    const cfg = montarConfiguracaoAtual()

    if (!cfg.incluirCalculadora && !cfg.incluirRecuperador && !cfg.incluirDiagnostico) {
      setFeedbackErro('Selecione pelo menos uma análise para incluir no relatório.')
      return
    }

    try {
      setGerandoPdf(true)
      gerarRelatorioPersonalizadoPDF({
        configuracao: cfg,
        empresa: nomeEmpresaOficial,
        cnpj: cnpjOficial,
        dadosEmpresa: temDadosSalvos ? dadosEmpresa : null,
        simulacaoCalculadora: calcAtiva,
        simulacaoRecuperador: recupAtivo,
        diagnostico360: diagAtivo,
      })
      setFeedbackSucesso('PDF personalizado gerado e baixado com sucesso!')
      setTimeout(() => setFeedbackSucesso(null), 4000)
    } catch (err) {
      console.error('[MeusRelatorios] Erro ao gerar PDF:', err)
      setFeedbackErro('Ocorreu um erro ao gerar o PDF. Verifique os dados selecionados.')
    } finally {
      setGerandoPdf(false)
    }
  }

  // Salvar relatório personalizado no PocketBase e gerar PDF
  const handleSalvarEGerar = async () => {
    if (!temAlgumaAnalise) {
      setFeedbackErro('Nenhuma análise disponível para salvar o relatório.')
      return
    }

    const cfg = montarConfiguracaoAtual()
    if (!cfg.incluirCalculadora && !cfg.incluirRecuperador && !cfg.incluirDiagnostico) {
      setFeedbackErro('Selecione pelo menos uma análise para incluir no relatório.')
      return
    }

    const analisesIncluidas: ModuloAnaliseTipo[] = []
    if (cfg.incluirCalculadora) analisesIncluidas.push('calculadora')
    if (cfg.incluirRecuperador) analisesIncluidas.push('recuperador')
    if (cfg.incluirDiagnostico) analisesIncluidas.push('diagnostico')

    const secoesSelecionadas: SecaoRelatorioTipo[] = [
      ...(cfg.incluirCalculadora ? cfg.secoesCalculadora : []),
      ...(cfg.incluirRecuperador ? cfg.secoesRecuperador : []),
      ...(cfg.incluirDiagnostico ? cfg.secoesDiagnostico : []),
    ]

    try {
      setSalvandoRelatorio(true)
      setFeedbackErro(null)

      const salvo = await salvarRelatorioPersonalizado({
        nome: cfg.titulo,
        empresa_nome: nomeEmpresaOficial,
        cnpj: cnpjOficial,
        cliente_id: clienteAtivoId || null,
        empresa_id: empresaVinculadaId || null,
        user_id: user?.id || null,
        analises_incluidas: analisesIncluidas,
        secoes_selecionadas: secoesSelecionadas,
        observacoes: cfg.observacoes,
        configuracao: cfg,
      })

      setRelatoriosSalvos((prev) => [salvo, ...prev.filter((r) => r.id !== salvo.id)])

      // Gera o PDF
      gerarRelatorioPersonalizadoPDF({
        configuracao: cfg,
        empresa: nomeEmpresaOficial,
        cnpj: cnpjOficial,
        dadosEmpresa: temDadosSalvos ? dadosEmpresa : null,
        simulacaoCalculadora: calcAtiva,
        simulacaoRecuperador: recupAtivo,
        diagnostico360: diagAtivo,
      })

      setFeedbackSucesso('Relatório personalizado salvo na sua lista e PDF baixado!')
      setTimeout(() => setFeedbackSucesso(null), 5000)
    } catch (err) {
      console.error('[MeusRelatorios] Erro ao salvar relatório:', err)
      setFeedbackErro(
        'Erro ao salvar o relatório no servidor. O PDF ainda pôde ser gerado localmente.',
      )
    } finally {
      setSalvandoRelatorio(false)
    }
  }

  // Baixar novamente um relatório salvo do histórico
  const handleBaixarRelatorioSalvo = (rel: RelatorioPersonalizadoRecord) => {
    try {
      setGerandoPdf(true)
      const cfg = rel.configuracao
      gerarRelatorioPersonalizadoPDF({
        configuracao: cfg,
        empresa: rel.empresa_nome || nomeEmpresaOficial,
        cnpj: rel.cnpj || cnpjOficial,
        dadosEmpresa: cfg.snapshotDadosEmpresa || (temDadosSalvos ? dadosEmpresa : null),
        simulacaoCalculadora: cfg.snapshotCalculadora || calcAtiva,
        simulacaoRecuperador: cfg.snapshotRecuperador || recupAtivo,
        diagnostico360: cfg.snapshotDiagnostico || diagAtivo,
      })
      setFeedbackSucesso(`PDF "${rel.nome}" baixado novamente com sucesso!`)
      setTimeout(() => setFeedbackSucesso(null), 4000)
    } catch (err) {
      console.error('[MeusRelatorios] Erro ao baixar novamente:', err)
      setFeedbackErro('Erro ao regenerar o PDF salvo.')
    } finally {
      setGerandoPdf(false)
    }
  }

  // Reabrir configuração de um relatório salvo no assistente
  const handleReabrirConfiguracao = (rel: RelatorioPersonalizadoRecord) => {
    const cfg = rel.configuracao
    setTituloPersonalizado(rel.nome || cfg.titulo || '')
    setObservacoesPersonalizadas(rel.observacoes || cfg.observacoes || '')
    setIncluirCalc(Boolean(cfg.incluirCalculadora))
    setIncluirRecup(Boolean(cfg.incluirRecuperador))
    setIncluirDiag(Boolean(cfg.incluirDiagnostico))
    if (cfg.secoesCalculadora) setSecoesCalc(cfg.secoesCalculadora)
    if (cfg.secoesRecuperador) setSecoesRecup(cfg.secoesRecuperador)
    if (cfg.secoesDiagnostico) setSecoesDiag(cfg.secoesDiagnostico)
    if (cfg.idSimulacaoCalculadora) setSimulacaoCalcSelecionadaId(cfg.idSimulacaoCalculadora)
    if (cfg.idSimulacaoRecuperador) setSimulacaoRecupSelecionadaId(cfg.idSimulacaoRecuperador)
    if (cfg.idDiagnostico360) setDiagnosticoSelecionadoId(cfg.idDiagnostico360)

    setPassoAtivo(2)
    setFeedbackSucesso(`Configurações de "${rel.nome}" carregadas no assistente.`)
    setTimeout(() => setFeedbackSucesso(null), 4000)
    window.scrollTo({ top: 300, behavior: 'smooth' })
  }

  // Renomear relatório
  const handleSalvarRenomear = async () => {
    if (!relatorioParaRenomear || !novoNomeTemp.trim()) return
    try {
      const atualizado = await renomearRelatorioPersonalizado(
        relatorioParaRenomear.id,
        novoNomeTemp.trim(),
      )
      setRelatoriosSalvos((prev) => prev.map((r) => (r.id === atualizado.id ? atualizado : r)))
      setRelatorioParaRenomear(null)
      setNovoNomeTemp('')
      setFeedbackSucesso('Relatório renomeado com sucesso!')
      setTimeout(() => setFeedbackSucesso(null), 3000)
    } catch (err) {
      console.error('[MeusRelatorios] Erro ao renomear:', err)
      setFeedbackErro('Não foi possível renomear o relatório.')
    }
  }

  // Excluir relatório
  const handleConfirmarExcluir = async () => {
    if (!relatorioParaExcluir) return
    try {
      const ok = await excluirRelatorioPersonalizado(relatorioParaExcluir.id)
      if (ok) {
        setRelatoriosSalvos((prev) => prev.filter((r) => r.id !== relatorioParaExcluir.id))
        setFeedbackSucesso(`Relatório "${relatorioParaExcluir.nome}" excluído com sucesso.`)
        setTimeout(() => setFeedbackSucesso(null), 3000)
      } else {
        setFeedbackErro('Erro ao excluir o relatório.')
      }
    } catch (err) {
      console.error('[MeusRelatorios] Erro ao excluir:', err)
      setFeedbackErro('Erro ao tentar excluir o relatório.')
    } finally {
      setRelatorioParaExcluir(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased pt-20 sm:pt-24 pb-24">
      {/* SELETOR CLIENTE ATIVO (PARA ANALISTAS / ADMIN / MASTER) */}
      {(!isEmpresario || isAdmin || isMaster) && (
        <div className="bg-[#07132B] border-b border-[#D4AF37]/20 py-2.5 px-4 sm:px-6">
          <div className="max-w-[1200px] mx-auto">
            <SeletorClienteAtivo labelCustomizado="Carteira • Cliente Ativo para Gerar Relatório Personalizado:" />
          </div>
        </div>
      )}

      {/* HERO DA PÁGINA (PADRÃO DIAMOND GROUP - SEM ÍCONES) */}
      <section className="relative py-10 md:py-14 bg-gradient-to-r from-[#07132B] via-[#0A1A13] to-[#07132B] text-white border-b border-[#D4AF37]/30 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:24px_24px]"
          aria-hidden="true"
        />

        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="max-w-3xl space-y-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-block px-3 py-1 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-mono">
                DIAMOND GROUP • INTELIGÊNCIA TRIBUTÁRIA
              </span>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/10 text-slate-200 border border-white/20">
                {isEmpresario ? 'Painel do Empresário' : 'Visão do Analista'}
              </span>
            </div>

            <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-white tracking-tight leading-tight">
              Meus Relatórios <span className="text-[#D4AF37]">Personalizáveis</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Monte dossiês executivos sob medida para{' '}
              <strong className="text-white">{nomeEmpresaOficial}</strong>. Escolha quais análises e
              seções técnicas incluir, adicione suas observações estratégicas e gere um PDF formal e
              consolidado com dados de identificação somente leitura e rodapé institucional.
            </p>
          </div>
        </div>
      </section>

      {/* IDENTIFICAÇÃO CADASTRAL SOMENTE LEITURA (BLOCO 3) */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 -mt-5 relative z-10">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#D4AF37]/30 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
                Dados Oficiais da Empresa (Somente Leitura do Cadastro)
              </span>
              <h2 className="font-heading font-bold text-base text-[#07132B]">
                {nomeEmpresaOficial}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono font-semibold">
                CNPJ: {cnpjOficial ? formatarCNPJ(cnpjOficial) : 'Não informado'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#07132B]/5 text-[#07132B] font-semibold">
                Regime: {dadosEmpresa?.regimeAtual || 'Simples Nacional'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#D4AF37]/15 text-[#856c17] font-semibold">
                Ano-Base: {dadosEmpresa?.anoBaseTransicao || 2026}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Nota de Governança: Os dados cadastrais da empresa acima são protegidos e emitidos
            fielmente no parecer em conformidade com o cadastro da plataforma.
          </p>
        </div>
      </div>

      {/* FEEDBACKS FLUTUANTES OU NO TOPO */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 mt-6">
        {feedbackSucesso && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm font-semibold shadow-sm">
            ✓ {feedbackSucesso}
          </div>
        )}
        {feedbackErro && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-sm font-semibold shadow-sm">
            ⚠ {feedbackErro}
          </div>
        )}
      </div>

      {/* CONTEÚDO PRINCIPAL: ESTADO VAZIO OU ASSISTENTE DE PERSONALIZAÇÃO */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-8">
        {carregandoDados ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-slate-200">
            <div className="inline-block px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-mono font-bold animate-pulse">
              Carregando análises e parâmetros da empresa...
            </div>
          </div>
        ) : !temAlgumaAnalise ? (
          /* ESTADO VAZIO COM CTAS GUIADOS (SEM ÍCONES) */
          <div className="p-8 sm:p-12 rounded-3xl bg-white border-2 border-dashed border-[#D4AF37]/40 shadow-sm text-center space-y-6">
            <div className="max-w-xl mx-auto space-y-2">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-800 border border-amber-300">
                Nenhuma Análise Disponível Ainda
              </span>
              <h2 className="font-heading font-extrabold text-2xl text-[#07132B]">
                Complete pelo menos uma análise para liberar o Relatório Personalizado
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Para que o empresário possa personalizar e emitir relatórios sob medida, é
                necessário calcular uma simulação da Calculadora IBS/CBS, executar uma apuração no
                Recuperador de Créditos ou iniciar o Diagnóstico 360°.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
              {/* Card 1: Calculadora IBS/CBS */}
              <div className="p-5 rounded-2xl bg-[#07132B]/5 border border-slate-200 hover:border-[#D4AF37]/60 transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
                    Módulo 1
                  </span>
                  <h3 className="font-heading font-bold text-base text-[#07132B]">
                    Calculadora IBS/CBS
                  </h3>
                  <p className="text-xs text-slate-600">
                    Projeção de carga tributária, comparativo com Simples/Presumido/Real e split
                    payment.
                  </p>
                </div>
                <Link
                  to="/calculadora-ibs-cbs"
                  className="w-full text-center py-2.5 px-4 rounded-xl bg-[#07132B] text-white hover:bg-[#0A1A13] text-xs font-bold transition-colors"
                >
                  Fazer Simulação IBS/CBS
                </Link>
              </div>

              {/* Card 2: Recuperador de Créditos */}
              <div className="p-5 rounded-2xl bg-[#07132B]/5 border border-slate-200 hover:border-[#D4AF37]/60 transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
                    Módulo 2
                  </span>
                  <h3 className="font-heading font-bold text-base text-[#07132B]">
                    Recuperador de Créditos
                  </h3>
                  <p className="text-xs text-slate-600">
                    Levantamento retroativo de 60 meses com correção monetária oficial SELIC.
                  </p>
                </div>
                <Link
                  to="/recuperador-creditos"
                  className="w-full text-center py-2.5 px-4 rounded-xl bg-[#07132B] text-white hover:bg-[#0A1A13] text-xs font-bold transition-colors"
                >
                  Auditar Créditos
                </Link>
              </div>

              {/* Card 3: Diagnóstico 360° */}
              <div className="p-5 rounded-2xl bg-[#07132B]/5 border border-slate-200 hover:border-[#D4AF37]/60 transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
                    Módulo 3
                  </span>
                  <h3 className="font-heading font-bold text-base text-[#07132B]">
                    Diagnóstico 360°
                  </h3>
                  <p className="text-xs text-slate-600">
                    Matriz de 7 frentes estruturais, roteiro de transição e enquadramento completo.
                  </p>
                </div>
                <Link
                  to="/diagnosticos"
                  className="w-full text-center py-2.5 px-4 rounded-xl bg-[#07132B] text-white hover:bg-[#0A1A13] text-xs font-bold transition-colors"
                >
                  Iniciar Diagnóstico 360°
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* ASSISTENTE DE PERSONALIZAÇÃO EM PASSOS SIMPLES */
          <div className="space-y-6">
            {/* TRILHA DE PASSOS GUIADA (SEM ÍCONES) */}
            <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { num: 1, label: '1. Escolher Análises' },
                  { num: 2, label: '2. Selecionar Seções' },
                  { num: 3, label: '3. Título & Notas' },
                  { num: 4, label: '4. Visualizar & Emitir' },
                ].map((step) => {
                  const isCur = passoAtivo === step.num
                  const isDone = passoAtivo > step.num
                  return (
                    <button
                      key={step.num}
                      type="button"
                      onClick={() => setPassoAtivo(step.num as any)}
                      className={`text-left p-3 rounded-xl transition-all border ${
                        isCur
                          ? 'bg-[#07132B] text-white border-[#D4AF37] shadow-sm'
                          : isDone
                            ? 'bg-slate-100 text-[#07132B] border-slate-300 font-semibold'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-[10px] font-mono uppercase tracking-wider block opacity-75">
                        Passo 0{step.num}
                      </span>
                      <span className="text-xs font-bold block truncate">{step.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* PASSO 1: ESCOLHER ANÁLISES */}
            {passoAtivo === 1 && (
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#D4AF37] font-bold block">
                    Passo 1 de 4
                  </span>
                  <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#07132B]">
                    Escolha quais análises entram no seu relatório
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Só ficam ativas para seleção as análises já realizadas para a empresa. Caso
                    alguma não esteja disponível, você pode realizá-la agora.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Card Análise 1: Calculadora IBS/CBS */}
                  <div
                    className={`p-5 rounded-2xl border transition-all ${
                      !temCalculadora
                        ? 'bg-slate-50 border-slate-200 opacity-80'
                        : incluirCalc
                          ? 'bg-emerald-50/40 border-emerald-400 shadow-sm'
                          : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="check-calc"
                          disabled={!temCalculadora}
                          checked={incluirCalc && temCalculadora}
                          onChange={(e) => setIncluirCalc(e.target.checked)}
                          className="mt-1 w-5 h-5 rounded border-slate-300 text-[#07132B] focus:ring-[#D4AF37] cursor-pointer disabled:cursor-not-allowed"
                        />
                        <div>
                          <label
                            htmlFor="check-calc"
                            className="font-heading font-bold text-base text-[#07132B] cursor-pointer"
                          >
                            Calculadora IBS/CBS (Reforma Tributária)
                          </label>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Carga tributária atual x novo sistema, cronograma 2026–2033, split
                            payment e créditos.
                          </p>

                          {temCalculadora ? (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold text-slate-600">
                                Cenário selecionado:
                              </span>
                              <select
                                value={simulacaoCalcSelecionadaId}
                                onChange={(e) => setSimulacaoCalcSelecionadaId(e.target.value)}
                                className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-[#07132B] focus:ring-1 focus:ring-[#D4AF37]"
                              >
                                {simulacoesCalc.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.nome} (Ano{' '}
                                    {c.parametros?.anoOperacao ||
                                      c.parametros?.anoTransicao ||
                                      2026}
                                    )
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div className="mt-2 text-xs font-medium text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 inline-block">
                              Não disponível — Nenhuma simulação da calculadora realizada ainda.
                            </div>
                          )}
                        </div>
                      </div>

                      {!temCalculadora && (
                        <Link
                          to="/calculadora-ibs-cbs"
                          className="px-3.5 py-2 rounded-xl bg-[#07132B] text-white hover:bg-[#0A1A13] text-xs font-bold text-center whitespace-nowrap"
                        >
                          Calcular IBS/CBS
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Card Análise 2: Recuperador de Créditos */}
                  <div
                    className={`p-5 rounded-2xl border transition-all ${
                      !temRecuperador
                        ? 'bg-slate-50 border-slate-200 opacity-80'
                        : incluirRecup
                          ? 'bg-emerald-50/40 border-emerald-400 shadow-sm'
                          : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="check-recup"
                          disabled={!temRecuperador}
                          checked={incluirRecup && temRecuperador}
                          onChange={(e) => setIncluirRecup(e.target.checked)}
                          className="mt-1 w-5 h-5 rounded border-slate-300 text-[#07132B] focus:ring-[#D4AF37] cursor-pointer disabled:cursor-not-allowed"
                        />
                        <div>
                          <label
                            htmlFor="check-recup"
                            className="font-heading font-bold text-base text-[#07132B] cursor-pointer"
                          >
                            Recuperador de Créditos Tributários
                          </label>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Levantamento administrativo retroativo de 60 meses, Selic acumulada e
                            créditos por tese.
                          </p>

                          {temRecuperador ? (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold text-slate-600">
                                Apuração selecionada:
                              </span>
                              <select
                                value={simulacaoRecupSelecionadaId}
                                onChange={(e) => setSimulacaoRecupSelecionadaId(e.target.value)}
                                className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-[#07132B] focus:ring-1 focus:ring-[#D4AF37]"
                              >
                                {simulacoesRecup.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.nome} (Total Selic: R${' '}
                                    {(r.total_recuperavel_integral || 0).toLocaleString('pt-BR')})
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div className="mt-2 text-xs font-medium text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 inline-block">
                              Não disponível — Nenhuma apuração do recuperador realizada ainda.
                            </div>
                          )}
                        </div>
                      </div>

                      {!temRecuperador && (
                        <Link
                          to="/recuperador-creditos"
                          className="px-3.5 py-2 rounded-xl bg-[#07132B] text-white hover:bg-[#0A1A13] text-xs font-bold text-center whitespace-nowrap"
                        >
                          Auditar Créditos
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Card Análise 3: Diagnóstico 360° */}
                  <div
                    className={`p-5 rounded-2xl border transition-all ${
                      !temDiagnostico
                        ? 'bg-slate-50 border-slate-200 opacity-80'
                        : incluirDiag
                          ? 'bg-emerald-50/40 border-emerald-400 shadow-sm'
                          : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="check-diag"
                          disabled={!temDiagnostico}
                          checked={incluirDiag && temDiagnostico}
                          onChange={(e) => setIncluirDiag(e.target.checked)}
                          className="mt-1 w-5 h-5 rounded border-slate-300 text-[#07132B] focus:ring-[#D4AF37] cursor-pointer disabled:cursor-not-allowed"
                        />
                        <div>
                          <label
                            htmlFor="check-diag"
                            className="font-heading font-bold text-base text-[#07132B] cursor-pointer"
                          >
                            Diagnóstico 360° & Governança Corporativa
                          </label>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Matriz Semáforo das 7 frentes estruturais, laudo de transição fiscal e
                            enquadramento.
                          </p>

                          {diagnosticosLista.length > 0 ? (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold text-slate-600">
                                Diagnóstico selecionado:
                              </span>
                              <select
                                value={diagnosticoSelecionadoId}
                                onChange={(e) => setDiagnosticoSelecionadoId(e.target.value)}
                                className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-[#07132B] focus:ring-1 focus:ring-[#D4AF37]"
                              >
                                {diagnosticosLista.map((d) => (
                                  <option key={d.id} value={d.id}>
                                    {d.tipo_diagnostico
                                      ? `Tipo: ${d.tipo_diagnostico}`
                                      : 'Diagnóstico Geral'}{' '}
                                    ({new Date(d.created).toLocaleDateString('pt-BR')})
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : temDadosSalvos ? (
                            <div className="mt-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 inline-block">
                              Disponível através dos Dados da Empresa e parâmetros cadastrados.
                            </div>
                          ) : (
                            <div className="mt-2 text-xs font-medium text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 inline-block">
                              Não disponível — Complete a trilha do Diagnóstico 360°.
                            </div>
                          )}
                        </div>
                      </div>

                      {!temDiagnostico && (
                        <Link
                          to="/diagnosticos"
                          className="px-3.5 py-2 rounded-xl bg-[#07132B] text-white hover:bg-[#0A1A13] text-xs font-bold text-center whitespace-nowrap"
                        >
                          Iniciar 360°
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">
                    Próxima etapa: Seleção de seções específicas de cada módulo.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (!incluirCalc && !incluirRecup && !incluirDiag) {
                        setFeedbackErro('Selecione pelo menos uma análise para avançar.')
                        return
                      }
                      setFeedbackErro(null)
                      setPassoAtivo(2)
                    }}
                    className="py-2.5 px-6 rounded-xl bg-[#07132B] text-[#D4AF37] hover:text-white hover:bg-[#0A1A13] text-xs font-bold transition-all shadow-sm"
                  >
                    Avançar para Seções →
                  </button>
                </div>
              </div>
            )}

            {/* PASSO 2: ESCOLHER SEÇÕES DE CADA ANÁLISE */}
            {passoAtivo === 2 && (
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#D4AF37] font-bold block">
                    Passo 2 de 4
                  </span>
                  <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#07132B]">
                    Escolha as seções de cada análise incluída
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Marque exatamente quais quadros, tabelas e pareceres você deseja no documento
                    final.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Seções Calculadora */}
                  {incluirCalc && temCalculadora && (
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-heading font-bold text-sm text-[#07132B] uppercase tracking-wider">
                          Seções da Calculadora IBS/CBS
                        </h3>
                        <span className="text-[11px] font-mono font-semibold text-slate-500">
                          {secoesCalc.length} selecionada(s)
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {[
                          { id: 'calc_resumo', label: 'Resumo Executivo da Calculadora' },
                          { id: 'calc_comparativo', label: 'Comparativo Atual x IBS/CBS (Cargas)' },
                          { id: 'calc_evolucao', label: 'Evolução da Transição 2026–2033' },
                          { id: 'calc_split', label: 'Quadro de Split Payment e Capital de Giro' },
                          { id: 'calc_creditos', label: 'Créditos Apropriáveis e Insumos' },
                          { id: 'calc_passos', label: 'Recomendações e Próximos Passos' },
                        ].map((sec) => (
                          <label
                            key={sec.id}
                            className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 cursor-pointer text-xs font-medium text-[#07132B]"
                          >
                            <input
                              type="checkbox"
                              checked={secoesCalc.includes(sec.id as any)}
                              onChange={() => toggleSecaoCalc(sec.id as any)}
                              className="w-4 h-4 rounded border-slate-300 text-[#07132B] focus:ring-[#D4AF37]"
                            />
                            <span>{sec.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Seções Recuperador */}
                  {incluirRecup && temRecuperador && (
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-heading font-bold text-sm text-[#07132B] uppercase tracking-wider">
                          Seções do Recuperador de Créditos
                        </h3>
                        <span className="text-[11px] font-mono font-semibold text-slate-500">
                          {secoesRecup.length} selecionada(s)
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {[
                          { id: 'recup_resumo', label: 'Resumo Executivo (Total com SELIC)' },
                          {
                            id: 'recup_tipos',
                            label: 'Créditos por Bloco (PIS/COFINS, Folha, IRPJ/CSLL)',
                          },
                          {
                            id: 'recup_ano_a_ano',
                            label: 'Quadro Histórico de Competências (60 Meses)',
                          },
                          {
                            id: 'recup_passos',
                            label: 'Procedimento Administrativo de Compensação',
                          },
                        ].map((sec) => (
                          <label
                            key={sec.id}
                            className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 cursor-pointer text-xs font-medium text-[#07132B]"
                          >
                            <input
                              type="checkbox"
                              checked={secoesRecup.includes(sec.id as any)}
                              onChange={() => toggleSecaoRecup(sec.id as any)}
                              className="w-4 h-4 rounded border-slate-300 text-[#07132B] focus:ring-[#D4AF37]"
                            />
                            <span>{sec.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Seções Diagnóstico */}
                  {incluirDiag && temDiagnostico && (
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-heading font-bold text-sm text-[#07132B] uppercase tracking-wider">
                          Seções do Diagnóstico 360°
                        </h3>
                        <span className="text-[11px] font-mono font-semibold text-slate-500">
                          {secoesDiag.length} selecionada(s)
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {[
                          { id: 'diag_resumo', label: 'Resumo e Enquadramento Recomendado' },
                          {
                            id: 'diag_matriz_riscos',
                            label: 'Matriz Semáforo das 7 Frentes de Risco',
                          },
                          { id: 'diag_autoavaliacao', label: 'Plano de Ação 30-60-90 Estruturado' },
                          { id: 'diag_transicao', label: 'Laudo de Transição Fiscal e ERP' },
                          {
                            id: 'diag_enquadramento',
                            label: 'Síntese de Governança e Enquadramento',
                          },
                        ].map((sec) => (
                          <label
                            key={sec.id}
                            className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 cursor-pointer text-xs font-medium text-[#07132B]"
                          >
                            <input
                              type="checkbox"
                              checked={secoesDiag.includes(sec.id as any)}
                              onChange={() => toggleSecaoDiag(sec.id as any)}
                              className="w-4 h-4 rounded border-slate-300 text-[#07132B] focus:ring-[#D4AF37]"
                            />
                            <span>{sec.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setPassoAtivo(1)}
                    className="py-2 px-4 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                  >
                    ← Voltar às Análises
                  </button>
                  <button
                    type="button"
                    onClick={() => setPassoAtivo(3)}
                    className="py-2.5 px-6 rounded-xl bg-[#07132B] text-[#D4AF37] hover:text-white hover:bg-[#0A1A13] text-xs font-bold transition-all shadow-sm"
                  >
                    Avançar para Título & Notas →
                  </button>
                </div>
              </div>
            )}

            {/* PASSO 3: TÍTULO PERSONALIZADO E OBSERVAÇÕES */}
            {passoAtivo === 3 && (
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#D4AF37] font-bold block">
                    Passo 3 de 4
                  </span>
                  <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#07132B]">
                    Título do Relatório e Notas do Empresário (Opcionais)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Personalize o nome de capa do dossiê e inclua diretrizes, observações ou
                    decisões de negócios que sairão impressas no documento oficial.
                  </p>
                </div>

                <div className="space-y-4 max-w-2xl">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#07132B] mb-1.5">
                      Título Personalizado do Documento
                    </label>
                    <input
                      type="text"
                      placeholder={`Ex: Planejamento Tributário Anual 2026 — ${nomeEmpresaOficial}`}
                      value={tituloPersonalizado}
                      onChange={(e) => setTituloPersonalizado(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-[#07132B]"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Se deixado em branco, será utilizado o padrão: "Relatório Personalizado —{' '}
                      {nomeEmpresaOficial}".
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#07132B] mb-1.5">
                      Observações, Notas ou Diretrizes Estratégicas
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Insira notas explicativas, premissas adotadas pela diretoria, decisões sobre split payment ou recomendações societárias..."
                      value={observacoesPersonalizadas}
                      onChange={(e) => setObservacoesPersonalizadas(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-[#07132B]"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Este texto livre será formatado em destaque na primeira página do dossiê
                      técnico.
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setPassoAtivo(2)}
                    className="py-2 px-4 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                  >
                    ← Voltar às Seções
                  </button>
                  <button
                    type="button"
                    onClick={() => setPassoAtivo(4)}
                    className="py-2.5 px-6 rounded-xl bg-[#07132B] text-[#D4AF37] hover:text-white hover:bg-[#0A1A13] text-xs font-bold transition-all shadow-sm"
                  >
                    Revisar & Gerar Relatório →
                  </button>
                </div>
              </div>
            )}

            {/* PASSO 4: VISUALIZAR RESUMO & EMITIR PDF */}
            {passoAtivo === 4 && (
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#D4AF37] font-bold block">
                    Passo 4 de 4 • Conclusão
                  </span>
                  <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#07132B]">
                    Revisão do Relatório e Emissão do PDF
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Confira a estrutura que será compilada no documento final.
                  </p>
                </div>

                {/* Resumo da Estrutura */}
                <div className="p-5 rounded-2xl bg-[#07132B] text-white border border-[#D4AF37]/30 space-y-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#D4AF37] font-bold block">
                      Título do Documento
                    </span>
                    <h3 className="font-heading font-extrabold text-lg text-white">
                      {tituloPersonalizado.trim() ||
                        `Relatório Personalizado — ${nomeEmpresaOficial}`}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Empresa: {nomeEmpresaOficial} | CNPJ:{' '}
                      {cnpjOficial ? formatarCNPJ(cnpjOficial) : '—'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-white/10 text-xs">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Calculadora IBS/CBS
                      </span>
                      <span className="font-bold text-white block mt-0.5">
                        {incluirCalc && temCalculadora
                          ? `${secoesCalc.length} seção(ões)`
                          : 'Não incluída'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Recuperador de Créditos
                      </span>
                      <span className="font-bold text-white block mt-0.5">
                        {incluirRecup && temRecuperador
                          ? `${secoesRecup.length} seção(ões)`
                          : 'Não incluído'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Diagnóstico 360°
                      </span>
                      <span className="font-bold text-white block mt-0.5">
                        {incluirDiag && temDiagnostico
                          ? `${secoesDiag.length} seção(ões)`
                          : 'Não incluído'}
                      </span>
                    </div>
                  </div>

                  {observacoesPersonalizadas.trim() && (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
                      <span className="text-[#D4AF37] font-bold block mb-1">
                        Notas do Empresário Incluídas:
                      </span>
                      <p className="text-slate-300 italic line-clamp-2">
                        "{observacoesPersonalizadas.trim()}"
                      </p>
                    </div>
                  )}
                </div>

                {/* CTAS DE AÇÃO */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setPassoAtivo(3)}
                    className="w-full sm:w-auto py-2.5 px-4 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                  >
                    ← Voltar ao Passo 3
                  </button>

                  <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                    <button
                      type="button"
                      disabled={gerandoPdf || salvandoRelatorio}
                      onClick={handleGerarPdf}
                      className="w-full sm:w-auto py-3 px-6 rounded-xl border border-[#07132B] text-[#07132B] hover:bg-slate-100 text-xs font-bold transition-all disabled:opacity-50"
                    >
                      {gerandoPdf ? 'Gerando...' : 'Baixar PDF Direto'}
                    </button>

                    <button
                      type="button"
                      disabled={gerandoPdf || salvandoRelatorio}
                      onClick={handleSalvarEGerar}
                      className="w-full sm:w-auto py-3 px-7 rounded-xl bg-[#07132B] text-[#D4AF37] hover:bg-[#0A1A13] hover:text-white text-xs font-bold transition-all shadow-md disabled:opacity-50"
                    >
                      {salvandoRelatorio
                        ? 'Salvando...'
                        : 'Salvar em "Meus Relatórios" & Baixar PDF'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LISTA "MEUS RELATÓRIOS SALVOS" (HISTÓRICO COM REABRIR, RENOMEAR, EXCLUIR, BAIXAR DE NOVO) */}
        <div className="space-y-4 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#D4AF37] font-bold block">
                Histórico de Emissões
              </span>
              <h2 className="font-heading font-extrabold text-xl text-[#07132B]">
                Relatórios Personalizados Salvos
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {relatoriosSalvos.length} relatório(s) arquivado(s)
            </span>
          </div>

          {relatoriosSalvos.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white border border-slate-200 text-slate-500 text-xs">
              Nenhum relatório personalizado salvo no histórico ainda. Personalize seu primeiro
              relatório acima e clique em "Salvar em Meus Relatórios".
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatoriosSalvos.map((rel) => {
                const dataFmt = new Date(rel.created).toLocaleDateString('pt-BR', {
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
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#D4AF37]/50 shadow-sm transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-heading font-bold text-base text-[#07132B] line-clamp-1">
                          {rel.nome}
                        </h3>
                        <span className="text-[10px] font-mono font-semibold text-slate-400 whitespace-nowrap">
                          {dataFmt}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="font-semibold text-slate-600">
                          Empresa: {rel.empresa_nome || '—'}
                        </span>
                        {rel.cnpj && (
                          <span className="text-slate-400">• CNPJ: {formatarCNPJ(rel.cnpj)}</span>
                        )}
                      </div>

                      {/* Badges de Análises incluídas */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {modulos.includes('calculadora') && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Calculadora IBS/CBS
                          </span>
                        )}
                        {modulos.includes('recuperador') && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Recuperador de Créditos
                          </span>
                        )}
                        {modulos.includes('diagnostico') && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Diagnóstico 360°
                          </span>
                        )}
                      </div>

                      {rel.observacoes && (
                        <p className="text-xs text-slate-600 line-clamp-2 italic pt-1">
                          "{rel.observacoes}"
                        </p>
                      )}
                    </div>

                    {/* Ações: Baixar de Novo, Reabrir, Renomear, Excluir */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleBaixarRelatorioSalvo(rel)}
                          className="px-3 py-1.5 rounded-lg bg-[#07132B] text-[#D4AF37] hover:text-white text-xs font-bold transition-colors"
                        >
                          Baixar PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReabrirConfiguracao(rel)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
                        >
                          Reabrir
                        </button>
                      </div>

                      <div className="flex items-center gap-1 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setRelatorioParaRenomear(rel)
                            setNovoNomeTemp(rel.nome)
                          }}
                          className="px-2 py-1 text-slate-500 hover:text-[#07132B] font-medium"
                        >
                          Renomear
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={() => setRelatorioParaExcluir(rel)}
                          className="px-2 py-1 text-rose-600 hover:text-rose-800 font-medium"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL RENOMEAR RELATÓRIO */}
      {relatorioParaRenomear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="font-heading font-extrabold text-lg text-[#07132B]">
              Renomear Relatório Personalizado
            </h3>
            <p className="text-xs text-slate-600">
              Digite o novo nome para identificar este relatório no seu histórico.
            </p>
            <input
              type="text"
              value={novoNomeTemp}
              onChange={(e) => setNovoNomeTemp(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-[#07132B] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRelatorioParaRenomear(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSalvarRenomear}
                className="px-4 py-2 rounded-xl bg-[#07132B] text-[#D4AF37] hover:text-white text-xs font-bold"
              >
                Salvar Novo Nome
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EXCLUIR RELATÓRIO */}
      {relatorioParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="font-heading font-extrabold text-lg text-rose-700">
              Excluir Relatório Personalizado?
            </h3>
            <p className="text-xs text-slate-600">
              Tem certeza de que deseja excluir o relatório{' '}
              <strong className="text-[#07132B]">"{relatorioParaExcluir.nome}"</strong>? Esta ação
              removerá o registro do histórico do servidor.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRelatorioParaExcluir(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarExcluir}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 text-xs font-bold"
              >
                Sim, Excluir Relatório
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
