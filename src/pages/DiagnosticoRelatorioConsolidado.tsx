import React, { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useClienteAtivo } from '@/context/ClienteAtivoContext'
import { useDadosEmpresa } from '@/context/DadosEmpresaContext'
import { SeletorClienteAtivo } from '@/components/clientes/SeletorClienteAtivo'
import TrilhaDiagnosticoNav from '@/components/diagnosticos/TrilhaDiagnosticoNav'
import {
  getDiagnosticos,
  getDiagnosticosPorCliente,
  type DiagnosticoRecord,
} from '@/services/diagnosticos'
import { formatarCNPJ } from '@/lib/cnpj'
import { formatarMoeda } from '@/lib/calculadoraUtils'
import { URL_SISTEMA_ANALISE_FINANCEIRA } from '@/lib/configSistemasExternos'
import { AvisoOrientativo } from '@/components/common/AvisoOrientativo'
import { SecaoFornecedoresConsolidado } from '@/components/diagnosticos/SecaoFornecedoresConsolidado'
import { QuadroMudancasPerfilConsolidado } from '@/components/diagnosticos/QuadroMudancasPerfilConsolidado'
import {
  exportarPdfEtapaConfiguracoes,
  exportarPdfEtapaAutoavaliacao,
  exportarPdfEtapaTransicao,
  exportarPdfEtapaRegimes,
  exportarPdfRelatorioConsolidado,
  type DadosRelatorioConsolidado,
} from '@/lib/pdfRelatoriosDiagnosticos'
import { gerarRelatorioDiagnosticoPDF } from '@/lib/pdfRelatorio'
import {
  executarDiagnosticoTributario,
  type DadosEntradaDiagnostico,
  type SegmentoEmpresa,
} from '@/lib/regimes'
import { useToast } from '@/hooks/use-toast'
import {
  listarHistoricoRelatoriosPorCliente,
  registrarVersaoRelatorio,
  excluirVersaoRelatorio,
  type HistoricoRelatorioRecord,
} from '@/services/historicoRelatorios'

export default function DiagnosticoRelatorioConsolidado() {
  const [searchParams] = useSearchParams()
  const abaUrl = searchParams.get('aba') || 'consolidado'

  const { toast } = useToast()
  const navigate = useNavigate()
  const { clienteAtivo, clienteAtivoId, limparClienteAtivo } = useClienteAtivo()
  const { dadosEmpresa, temDadosSalvos, limpar: limparDadosEmpresaContext } = useDadosEmpresa()

  const [carregando, setCarregando] = useState(true)
  const [todosDiagnosticos, setTodosDiagnosticos] = useState<DiagnosticoRecord[]>([])
  const [historicoVersoes, setHistoricoVersoes] = useState<HistoricoRelatorioRecord[]>([])
  const [carregandoHistorico, setCarregandoHistorico] = useState(false)
  const [versaoSelecionada, setVersaoSelecionada] = useState<HistoricoRelatorioRecord | null>(null)
  const [salvandoSnapshotManual, setSalvandoSnapshotManual] = useState(false)
  const [sucessoSnapshotMsg, setSucessoSnapshotMsg] = useState<string | null>(null)

  const [abaAtiva, setAbaAtiva] = useState<
    | 'consolidado'
    | 'historico'
    | 'configuracoes'
    | 'autoavaliacao'
    | 'transicao'
    | 'regimes'
    | 'enquadramento'
    | 'fornecedores'
  >(abaUrl as any)

  // Sincroniza aba se mudar na URL
  useEffect(() => {
    if (abaUrl) {
      setAbaAtiva(abaUrl as any)
    }
  }, [abaUrl])

  // Carrega os diagnósticos do cliente ativo ou gerais
  useEffect(() => {
    let montado = true
    const carregar = async () => {
      setCarregando(true)
      try {
        if (clienteAtivoId) {
          const list = await getDiagnosticosPorCliente(clienteAtivoId)
          if (montado) setTodosDiagnosticos(list)
        } else {
          const list = await getDiagnosticos()
          if (montado) setTodosDiagnosticos(list)
        }
      } catch (err) {
        console.error('Erro ao buscar diagnósticos para o relatório:', err)
      } finally {
        if (montado) setCarregando(false)
      }
    }
    carregar()
    return () => {
      montado = false
    }
  }, [clienteAtivoId])

  // Carrega histórico de versões sempre que o cliente mudar
  useEffect(() => {
    let montado = true
    const carregarHistorico = async () => {
      setCarregandoHistorico(true)
      try {
        const versoes = await listarHistoricoRelatoriosPorCliente(clienteAtivoId || undefined)
        if (montado) {
          setHistoricoVersoes(versoes)
          if (versoes.length > 0 && !versaoSelecionada) {
            setVersaoSelecionada(versoes[0])
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar histórico de versões:', err)
      } finally {
        if (montado) setCarregandoHistorico(false)
      }
    }
    carregarHistorico()
    return () => {
      montado = false
    }
  }, [clienteAtivoId])

  // Separação dos registros de cada etapa para o cliente ativo ou geral
  const diagAutoavaliacao = useMemo(() => {
    return todosDiagnosticos.find((d) => d.tipo_diagnostico === '360') || null
  }, [todosDiagnosticos])

  const diagTransicao = useMemo(() => {
    return todosDiagnosticos.find((d) => d.tipo_diagnostico === 'transicao') || null
  }, [todosDiagnosticos])

  const diagRegimes = useMemo(() => {
    return todosDiagnosticos.find((d) => d.tipo_diagnostico === 'regimes') || null
  }, [todosDiagnosticos])

  const diagEnquadramento = useMemo(() => {
    return (
      todosDiagnosticos.find(
        (d) => d.tipo_diagnostico === 'enquadramento' || !d.tipo_diagnostico,
      ) || null
    )
  }, [todosDiagnosticos])

  // Nome do cliente e da empresa
  const nomeClienteExibir = clienteAtivo?.nome || undefined
  const nomeEmpresaExibir =
    dadosEmpresa?.nomeEmpresa ||
    clienteAtivo?.nome ||
    diagEnquadramento?.empresa ||
    'Empresa do Cliente Ativo'

  // Handlers de PDF
  const handleBaixarConsolidado = () => {
    exportarPdfRelatorioConsolidado({
      clienteNome: nomeClienteExibir,
      dadosEmpresa: temDadosSalvos ? dadosEmpresa : null,
      diagnosticoAutoavaliacao: diagAutoavaliacao,
      diagnosticoTransicao: diagTransicao,
      diagnosticoRegimes: diagRegimes,
      diagnosticoEnquadramento: diagEnquadramento,
    })
  }

  const handleBaixarConfiguracoes = () => {
    exportarPdfEtapaConfiguracoes(temDadosSalvos ? dadosEmpresa : null, nomeClienteExibir)
  }

  const handleBaixarAutoavaliacao = () => {
    exportarPdfEtapaAutoavaliacao(diagAutoavaliacao, nomeClienteExibir, nomeEmpresaExibir)
  }

  const handleBaixarTransicao = () => {
    exportarPdfEtapaTransicao(diagTransicao, nomeClienteExibir, nomeEmpresaExibir)
  }

  const handleBaixarRegimes = () => {
    exportarPdfEtapaRegimes(diagRegimes, nomeClienteExibir, nomeEmpresaExibir)
  }

  const [gerandoParecerEnquadramento, setGerandoParecerEnquadramento] = useState(false)

  const handleBaixarParecerEnquadramento = () => {
    if (!diagEnquadramento) return

    setGerandoParecerEnquadramento(true)
    try {
      const cfg = diagEnquadramento.configuracoes_diagnostico_json || {}
      const detRef = diagEnquadramento.detalhes_reforma_json || {}

      const nomeContatoFinal =
        cfg.nome_contato ||
        dadosEmpresa?.nomeContato ||
        diagEnquadramento.nome ||
        nomeClienteExibir ||
        'Não informado'

      const emailFinal = dadosEmpresa?.email || diagEnquadramento.email || ''
      const telefoneFinal = dadosEmpresa?.telefone || diagEnquadramento.telefone || ''
      const empresaFinal =
        cfg.razao_social ||
        dadosEmpresa?.nomeEmpresa ||
        diagEnquadramento.empresa ||
        nomeEmpresaExibir

      const cnpjFinal = cfg.cnpj || dadosEmpresa?.cnpj || diagEnquadramento.cnpj || ''
      const segmentoFinal = (cfg.segmento ||
        dadosEmpresa?.segmento ||
        diagEnquadramento.segmento ||
        'Serviços') as SegmentoEmpresa

      const rbt12Final =
        diagEnquadramento.rbt12 ||
        (dadosEmpresa?.faturamentoMensal ? dadosEmpresa.faturamentoMensal * 12 : 600000)

      const folha12Final =
        diagEnquadramento.folha12 ||
        (dadosEmpresa?.folhaPagamentoMensal ? dadosEmpresa.folhaPagamentoMensal * 12 : 120000)

      const folhaMensalFinal =
        diagEnquadramento.folha_pagamento ||
        dadosEmpresa?.folhaPagamentoMensal ||
        Math.round(folha12Final / 12)

      const despesasCreditosFinal =
        diagEnquadramento.despesas_creditos || dadosEmpresa?.despesasComCreditosMensais || 0

      const percentualExportacaoFinal =
        diagEnquadramento.percentual_exportacao ?? dadosEmpresa?.percentualExportacao ?? 0

      const ufOrigemFinal =
        diagEnquadramento.uf_origem || cfg.uf_origem || dadosEmpresa?.ufOrigem || 'SP'

      const margemLucroFinal =
        diagEnquadramento.margem_lucro ?? dadosEmpresa?.margemLucroEstimada ?? 25

      const funcionariosFinal =
        diagEnquadramento.funcionarios || cfg.funcionarios || dadosEmpresa?.funcionarios || '1–5'

      const emissaoNfFinal =
        diagEnquadramento.emissao_nf || cfg.emissao_nf || dadosEmpresa?.emissaoNf || 'B2B'

      const atividadeMistaFinal =
        diagEnquadramento.atividade_mista ??
        cfg.atividade_mista ??
        (typeof dadosEmpresa?.atividadeMista === 'boolean'
          ? dadosEmpresa.atividadeMista
          : dadosEmpresa?.tipoAtividade === 'misto')

      const regimeAtualFinal =
        diagEnquadramento.regime_atual ||
        cfg.regime_atual ||
        dadosEmpresa?.regimeAtual ||
        'Simples Nacional'

      const cidadeFinal =
        diagEnquadramento.cidade || cfg.cidade || dadosEmpresa?.cidade || 'São Paulo - SP'

      const anoBaseFinal =
        diagEnquadramento.ano_base ||
        detRef.anoBase ||
        cfg.ano_base_transicao ||
        dadosEmpresa?.anoBaseTransicao ||
        2026

      const inputDiagnostico: DadosEntradaDiagnostico = {
        nome: nomeContatoFinal,
        email: emailFinal,
        telefone: telefoneFinal,
        empresa: empresaFinal,
        cnpj: cnpjFinal,
        segmento: segmentoFinal,
        rbt12: rbt12Final,
        folha12: folha12Final,
        folhaMensal: folhaMensalFinal,
        despesasCreditosMensais: despesasCreditosFinal,
        percentualExportacao: percentualExportacaoFinal,
        ufOrigem: ufOrigemFinal,
        margemLucro: margemLucroFinal,
        funcionarios: funcionariosFinal,
        emissaoNf: emissaoNfFinal,
        atividadeMista: atividadeMistaFinal,
        regimeAtual: regimeAtualFinal,
        cidade: cidadeFinal,
        anoBase: anoBaseFinal,
      }

      const resultado = executarDiagnosticoTributario(inputDiagnostico)

      gerarRelatorioDiagnosticoPDF({
        dados: inputDiagnostico,
        resultado,
      })

      toast({
        title: 'Parecer gerado com sucesso',
        description: 'O PDF do parecer completo foi baixado no seu navegador.',
      })
    } catch (err) {
      console.error('Erro ao gerar parecer completo em PDF:', err)
      toast({
        title: 'Erro ao gerar parecer',
        description: 'Ocorreu um problema ao gerar o PDF. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setGerandoParecerEnquadramento(false)
    }
  }

  // Snapshot manual da versão atual
  const handleGravarSnapshotAtual = async () => {
    setSalvandoSnapshotManual(true)
    try {
      const dadosAtuais: DadosRelatorioConsolidado = {
        clienteNome: nomeClienteExibir,
        dadosEmpresa: temDadosSalvos ? dadosEmpresa : null,
        diagnosticoAutoavaliacao: diagAutoavaliacao,
        diagnosticoTransicao: diagTransicao,
        diagnosticoRegimes: diagRegimes,
        diagnosticoEnquadramento: diagEnquadramento,
        dataEmissao: new Date().toLocaleDateString('pt-BR'),
      }

      const novo = await registrarVersaoRelatorio({
        cliente_id: clienteAtivoId || undefined,
        cliente_nome: nomeClienteExibir,
        empresa_nome: nomeEmpresaExibir,
        motivo_evento: 'Snapshot manual registrado no painel',
        dados_json: dadosAtuais,
      })

      setHistoricoVersoes((prev) => [novo, ...prev])
      setVersaoSelecionada(novo)
      setSucessoSnapshotMsg('Nova versão do relatório registrada com sucesso!')
      setTimeout(() => setSucessoSnapshotMsg(null), 4000)
    } catch (err) {
      console.error('Erro ao salvar snapshot manual:', err)
    } finally {
      setSalvandoSnapshotManual(false)
    }
  }

  // Exportar PDF de versão arquivada
  const handleBaixarVersaoHistorico = (item: HistoricoRelatorioRecord) => {
    exportarPdfRelatorioConsolidado(item.dados_json)
  }

  // Excluir versão
  const handleExcluirVersao = async (id: string) => {
    if (!window.confirm('Deseja excluir esta versão salva do histórico?')) return
    const ok = await excluirVersaoRelatorio(id)
    if (ok) {
      setHistoricoVersoes((prev) => prev.filter((it) => it.id !== id))
      if (versaoSelecionada?.id === id) {
        setVersaoSelecionada(null)
      }
    }
  }

  // Derivação de cores do semáforo da versão atual para comparativo com versões históricas
  const semaforoAtual = useMemo(() => {
    const scores = (diagAutoavaliacao?.dados_extra_json as any)?.scoresPorFrente || {}
    const mapa: Record<number, 'vermelho' | 'amarelo' | 'verde'> = {}
    for (let f = 1; f <= 7; f++) {
      const s = scores[f]?.scoreMedio
      if (typeof s === 'number') {
        mapa[f] = s >= 2.5 ? 'vermelho' : s >= 1.75 ? 'amarelo' : 'verde'
      }
    }
    return mapa
  }, [diagAutoavaliacao])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased pt-20 sm:pt-24 pb-20">
      {/* SELETOR CLIENTE ATIVO NO TOPO */}
      <div className="bg-[#07132B] border-b border-[#D4AF37]/20 py-2.5 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto">
          <SeletorClienteAtivo labelCustomizado="Carteira • Cliente Ativo no Relatório:" />
        </div>
      </div>

      {/* TRILHA DE NAVEGAÇÃO DOS DIAGNÓSTICOS */}
      <TrilhaDiagnosticoNav
        paginaAtual="relatorio"
        nomeEmpresa={nomeEmpresaExibir}
        temDadosSalvos={temDadosSalvos}
      />

      {/* HERO SECTION DO RELATÓRIO */}
      <section className="relative py-12 md:py-16 bg-gradient-to-r from-[#07132B] via-[#0A1A13] to-[#07132B] text-white border-b border-[#D4AF37]/30 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:24px_24px]"
          aria-hidden="true"
        />
        <div className="absolute top-1/4 right-10 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-[#2ECC71]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-xs font-bold text-[#D4AF37] uppercase tracking-wider backdrop-blur-md">
              <span className="font-mono text-xs text-[#D4AF37]">◆</span>
              <span>DOSSIÊ EXECUTIVO CONSOLIDADO • DIAMOND INTELLIGENCE</span>
            </div>

            <h1 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
              Relatório Consolidado do{' '}
              <span className="text-[#D4AF37]">Diagnóstico Tributário</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Dossiê completo por <strong className="text-white">Cliente Ativo</strong> reunindo as
              5 etapas da esteira diagnóstica. Visualize e imprima o relatório consolidado global ou
              os relatórios individuais de cada fase de forma independente.
            </p>

            {/* BARRA DA EMPRESA ATIVA */}
            <div className="inline-flex flex-wrap items-center gap-3 p-3 px-5 rounded-2xl bg-white/10 border border-white/15 text-xs text-slate-200 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="text-[#2ECC71] font-mono font-bold">CLIENTE / EMPRESA:</span>
                <span className="font-semibold text-white">{nomeEmpresaExibir}</span>
                {clienteAtivo?.nome && (
                  <span className="text-[#D4AF37] font-medium">({clienteAtivo.nome})</span>
                )}
              </div>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300">
                Segmento:{' '}
                <strong className="text-white">{dadosEmpresa?.segmento || 'Não informado'}</strong>
              </span>
              <span className="text-slate-500">•</span>
              <button
                type="button"
                onClick={handleBaixarConsolidado}
                className="text-[#D4AF37] hover:underline font-bold"
              >
                Exportar PDF Consolidado ↓
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CONTAINER PRINCIPAL */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* NAVEGAÇÃO POR ABAS: CONSOLIDADO + HISTÓRICO DE VERSÕES + 5 RELATÓRIOS INDIVIDUAIS */}
        <div className="bg-white rounded-2xl p-2 sm:p-2.5 border border-slate-200 shadow-sm flex flex-wrap gap-1.5">
          {[
            { id: 'consolidado' as const, label: 'Dossiê Consolidado Completo', badge: '5 Fases' },
            {
              id: 'historico' as const,
              label: 'Histórico de Versões',
              badge: `${historicoVersoes.length} versão(ões)`,
            },
            { id: 'configuracoes' as const, label: '01. Configurações', badge: 'Base' },
            { id: 'autoavaliacao' as const, label: '02. Autoavaliação 360°', badge: '7 Frentes' },
            { id: 'transicao' as const, label: '03. Transição Fiscal', badge: '2026–2033' },
            { id: 'regimes' as const, label: '04. Comparação Regimes', badge: 'Matriz 4' },
            { id: 'enquadramento' as const, label: '05. Enquadramento', badge: 'Parecer Final' },
            { id: 'fornecedores' as const, label: '06. Fornecedores', badge: 'LC 214/2025' },
          ].map((tab) => {
            const isAtiva = abaAtiva === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setAbaAtiva(tab.id)}
                className={`px-4 py-2.5 rounded-xl font-heading text-xs font-bold transition-all flex items-center gap-2 ${
                  isAtiva
                    ? 'bg-[#07132B] text-[#D4AF37] shadow-md border border-[#D4AF37]/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                    isAtiva ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-slate-200/70 text-slate-600'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            )
          })}
        </div>

        {/* ========================================================================= */}
        {/* ABA: HISTÓRICO DE VERSÕES DO RELATÓRIO POR CLIENTE */}
        {/* ========================================================================= */}
        {abaAtiva === 'historico' && (
          <div className="space-y-8 animate-fade-in">
            {/* BARRA SUPERIOR DO HISTÓRICO */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-[#07132B] block">
                  Linha do Tempo & Snapshots Auditoriais
                </span>
                <h2 className="text-2xl font-heading font-black text-[#07132B]">
                  Histórico de Versões do Relatório
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Versões salvas automaticamente ao concluir etapas para o Cliente Ativo ou geradas
                  manualmente.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleGravarSnapshotAtual}
                  disabled={salvandoSnapshotManual}
                  className="px-5 py-2.5 rounded-xl font-heading font-bold text-xs text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-md transition-all text-center disabled:opacity-60"
                >
                  {salvandoSnapshotManual ? 'Registrando...' : 'Registrar Versão Agora'}
                </button>
              </div>
            </div>

            {sucessoSnapshotMsg && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
                <span>{sucessoSnapshotMsg}</span>
                <span className="text-emerald-600 font-mono text-[10px]">DIAMOND SNAPSHOT</span>
              </div>
            )}

            {carregandoHistorico ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold">
                  Carregando histórico de versões...
                </span>
              </div>
            ) : historicoVersoes.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#D4AF37] border border-amber-200/80 flex items-center justify-center mx-auto text-xl font-heading font-bold">
                  ◆
                </div>
                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-lg text-slate-800">
                    Nenhuma versão registrada ainda
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                    Cada vez que você salva ou conclui etapas para o{' '}
                    <strong className="text-slate-800">{nomeEmpresaExibir}</strong>, um snapshot com
                    as 5 etapas, data/hora e autor é arquivado aqui.
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleGravarSnapshotAtual}
                    disabled={salvandoSnapshotManual}
                    className="px-6 py-2.5 rounded-xl font-heading font-bold text-xs text-white bg-[#07132B] hover:bg-[#0c1f44] shadow-md transition-all"
                  >
                    Gerar Primeira Versão Agora
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* LISTA DAS VERSÕES SALVAS (LADO ESQUERDO) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-heading font-bold uppercase tracking-wider text-slate-600">
                      Versões Arquivadas ({historicoVersoes.length})
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Mais recente primeiro
                    </span>
                  </div>

                  <div className="space-y-3">
                    {historicoVersoes.map((versao, idx) => {
                      const isSel = versaoSelecionada?.id === versao.id
                      const dataFormatada = versao.created
                        ? new Date(versao.created).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Data não informada'

                      const resumo = (versao.resumo_json as any) || {}
                      const frentes: Record<number, string> = resumo.frentesCores || {}

                      return (
                        <div
                          key={versao.id || idx}
                          onClick={() => setVersaoSelecionada(versao)}
                          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative ${
                            isSel
                              ? 'bg-white border-[#D4AF37] shadow-lg ring-2 ring-[#D4AF37]/30'
                              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#07132B] text-[#D4AF37]">
                                  #{historicoVersoes.length - idx}
                                </span>
                                {idx === 0 && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                                    Mais Recente
                                  </span>
                                )}
                              </div>
                              <h4 className="font-heading font-bold text-sm text-[#07132B]">
                                {versao.versao_rotulo || `Versão de ${dataFormatada}`}
                              </h4>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Gerado por:{' '}
                                <strong className="text-slate-700">
                                  {versao.gerado_por || 'Analista'}
                                </strong>{' '}
                                • {dataFormatada}
                              </p>
                              {versao.motivo_evento && (
                                <p className="text-[10px] text-slate-400 italic mt-0.5">
                                  Evento: {versao.motivo_evento}
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (versao.id) handleExcluirVersao(versao.id)
                              }}
                              className="text-slate-400 hover:text-rose-600 text-xs px-2 py-1 rounded transition-colors"
                              title="Excluir versão do histórico"
                            >
                              ✕
                            </button>
                          </div>

                          {/* Mini indicadores de etapas e semáforo */}
                          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className="text-[11px] text-slate-600">
                              Etapas:{' '}
                              <strong className="text-[#07132B]">
                                {resumo.etapasConcluidas ?? 0}/5
                              </strong>
                            </span>

                            {/* Semáforo das 7 frentes em bolinhas */}
                            <div
                              className="flex items-center gap-1"
                              title="Semáforo das 7 frentes nesta versão"
                            >
                              {[1, 2, 3, 4, 5, 6, 7].map((f) => {
                                const cor = frentes[f]
                                return (
                                  <span
                                    key={f}
                                    className={`w-2.5 h-2.5 rounded-full ${
                                      cor === 'vermelho'
                                        ? 'bg-rose-500'
                                        : cor === 'amarelo'
                                          ? 'bg-amber-400'
                                          : cor === 'verde'
                                            ? 'bg-emerald-500'
                                            : 'bg-slate-200'
                                    }`}
                                  />
                                )
                              })}
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleBaixarVersaoHistorico(versao)
                              }}
                              className="text-[11px] font-bold text-[#07132B] hover:text-[#D4AF37] underline"
                            >
                              Baixar PDF ↓
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* DETALHE / VISUALIZADOR DA VERSÃO SELECIONADA (LADO DIREITO) */}
                <div className="lg:col-span-7 space-y-6">
                  {versaoSelecionada ? (
                    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6">
                      {/* HEADER DO DETALHE */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-[#D4AF37] uppercase tracking-wider block">
                            Visualizando Snapshot Arquivado
                          </span>
                          <h3 className="text-xl font-heading font-black text-[#07132B]">
                            {versaoSelecionada.versao_rotulo || 'Detalhes da Versão'}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Autor:{' '}
                            <strong className="text-slate-800">
                              {versaoSelecionada.gerado_por || 'Analista'}
                            </strong>{' '}
                            •{' '}
                            {versaoSelecionada.created
                              ? new Date(versaoSelecionada.created).toLocaleString('pt-BR')
                              : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleBaixarVersaoHistorico(versaoSelecionada)}
                            className="px-4 py-2 rounded-xl text-xs font-heading font-bold text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-sm transition-all"
                          >
                            Exportar PDF desta Versão ↓
                          </button>
                        </div>
                      </div>

                      {/* QUADRO COMPARATIVO DAS 7 FRENTES (ESTA VERSÃO vs VERSÃO ATUAL) */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-xs font-heading font-extrabold text-[#07132B] uppercase tracking-wider">
                            Comparativo Semáforo das 7 Frentes (Versão Arquivada vs Atual)
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Mudanças de controle
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          {[
                            { f: 1, nome: '1. Financeiro & Crédito' },
                            { f: 2, nome: '2. Investimentos & Wealth' },
                            { f: 3, nome: '3. Societário & Parcerias — Risco Hub' },
                            { f: 4, nome: '4. Fiscal & Contábil' },
                            { f: 5, nome: '5. Tributário' },
                            { f: 6, nome: '6. Jurídico' },
                            { f: 7, nome: '7. Operacional, Humano & Cultura' },
                          ].map((item) => {
                            const corVersao = (versaoSelecionada.resumo_json as any)
                              ?.frentesCores?.[item.f]
                            const corAtual = semaforoAtual[item.f]
                            const mudou = corVersao && corAtual && corVersao !== corAtual

                            const corPill = (c?: 'vermelho' | 'amarelo' | 'verde') =>
                              c === 'vermelho'
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : c === 'amarelo'
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : c === 'verde'
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : 'bg-slate-100 text-slate-500 border-slate-200'

                            return (
                              <div
                                key={item.f}
                                className={`p-2.5 rounded-xl bg-white border flex items-center justify-between gap-2 ${
                                  mudou
                                    ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]/40'
                                    : 'border-slate-200'
                                }`}
                              >
                                <span className="font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-none">
                                  {item.nome}
                                </span>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[10px] text-slate-400">Versão:</span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${corPill(corVersao)}`}
                                  >
                                    {corVersao ? corVersao.toUpperCase() : 'N/A'}
                                  </span>

                                  <span className="text-slate-400 text-xs">→</span>

                                  <span className="text-[10px] text-slate-400">Atual:</span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${corPill(corAtual)}`}
                                  >
                                    {corAtual ? corAtual.toUpperCase() : 'N/A'}
                                  </span>

                                  {mudou && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#D4AF37]/20 text-[#07132B]">
                                      Alterou
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* CONTEÚDO SALVO DA VERSÃO (AS 5 ETAPAS ARQUIVADAS) */}
                      <div className="space-y-4 text-xs">
                        {/* 01 Configurações salvas */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                          <span className="font-bold text-[#07132B] uppercase text-[11px] block">
                            01. Configurações Gravadas no Snapshot:
                          </span>
                          {versaoSelecionada.dados_json.dadosEmpresa ? (
                            <div className="grid grid-cols-2 gap-2 text-slate-700">
                              <p>
                                • Empresa:{' '}
                                <strong>
                                  {versaoSelecionada.dados_json.dadosEmpresa.nomeEmpresa}
                                </strong>
                              </p>
                              <p>
                                • CNPJ:{' '}
                                <strong>
                                  {versaoSelecionada.dados_json.dadosEmpresa.cnpj
                                    ? formatarCNPJ(versaoSelecionada.dados_json.dadosEmpresa.cnpj)
                                    : '—'}
                                </strong>
                              </p>
                              <p>
                                • Segmento:{' '}
                                <strong>
                                  {versaoSelecionada.dados_json.dadosEmpresa.segmento}
                                </strong>
                              </p>
                              <p>
                                • Regime Atual:{' '}
                                <strong>
                                  {versaoSelecionada.dados_json.dadosEmpresa.regimeAtual}
                                </strong>
                              </p>
                            </div>
                          ) : (
                            <p className="text-slate-400 italic">
                              Etapa não estava preenchida neste snapshot.
                            </p>
                          )}
                        </div>

                        {/* 02 Autoavaliação salva */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                          <span className="font-bold text-[#07132B] uppercase text-[11px] block">
                            02. Autoavaliação das 7 Frentes no Snapshot:
                          </span>
                          {versaoSelecionada.dados_json.diagnosticoAutoavaliacao
                            ?.dados_extra_json ? (
                            <div className="space-y-1">
                              <p className="font-semibold text-slate-800">
                                Perfil:{' '}
                                {
                                  versaoSelecionada.dados_json.diagnosticoAutoavaliacao
                                    .dados_extra_json.resumo?.perfil
                                }
                              </p>
                              <p className="text-slate-600">
                                Semáforo:{' '}
                                {versaoSelecionada.dados_json.diagnosticoAutoavaliacao
                                  .dados_extra_json.resumo?.totalCriticos || 0}{' '}
                                Críticos |{' '}
                                {versaoSelecionada.dados_json.diagnosticoAutoavaliacao
                                  .dados_extra_json.resumo?.totalAlertas || 0}{' '}
                                Alertas |{' '}
                                {versaoSelecionada.dados_json.diagnosticoAutoavaliacao
                                  .dados_extra_json.resumo?.totalControlados || 0}{' '}
                                Controlados
                              </p>
                            </div>
                          ) : (
                            <p className="text-slate-400 italic">
                              Autoavaliação não concluída neste snapshot.
                            </p>
                          )}
                        </div>

                        {/* 03 Transição Fiscal salva */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                          <span className="font-bold text-[#07132B] uppercase text-[11px] block">
                            03. Transição Fiscal no Snapshot:
                          </span>
                          {versaoSelecionada.dados_json.diagnosticoTransicao?.dados_extra_json ? (
                            <div className="space-y-1">
                              <p className="font-semibold text-slate-800">
                                Farol:{' '}
                                {
                                  versaoSelecionada.dados_json.diagnosticoTransicao.dados_extra_json
                                    .laudo?.farol
                                }
                              </p>
                              <p className="text-slate-600">
                                Solução:{' '}
                                {
                                  versaoSelecionada.dados_json.diagnosticoTransicao.dados_extra_json
                                    .laudo?.servicoRecomendado
                                }
                              </p>
                            </div>
                          ) : (
                            <p className="text-slate-400 italic">
                              Transição Fiscal não concluída neste snapshot.
                            </p>
                          )}
                        </div>

                        {/* 04 & 05 Comparação e Enquadramento salvos */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                          <span className="font-bold text-[#07132B] uppercase text-[11px] block">
                            04 & 05. Comparação de Regime & Enquadramento no Snapshot:
                          </span>
                          {versaoSelecionada.dados_json.diagnosticoEnquadramento ||
                          versaoSelecionada.dados_json.diagnosticoRegimes ? (
                            <div className="space-y-1">
                              <p className="font-semibold text-slate-800">
                                Recomendado:{' '}
                                {(
                                  versaoSelecionada.dados_json.diagnosticoEnquadramento ||
                                  versaoSelecionada.dados_json.diagnosticoRegimes
                                )?.sistema_recomendado_novo ||
                                  (
                                    versaoSelecionada.dados_json.diagnosticoEnquadramento ||
                                    versaoSelecionada.dados_json.diagnosticoRegimes
                                  )?.regime_recomendado}
                              </p>
                              <p className="text-emerald-700 font-bold">
                                Economia Anual Estimada:{' '}
                                {formatarMoeda(
                                  (
                                    versaoSelecionada.dados_json.diagnosticoEnquadramento ||
                                    versaoSelecionada.dados_json.diagnosticoRegimes
                                  )?.economia_anual_novo ||
                                    (
                                      versaoSelecionada.dados_json.diagnosticoEnquadramento ||
                                      versaoSelecionada.dados_json.diagnosticoRegimes
                                    )?.economia_anual ||
                                    0,
                                )}{' '}
                                / ano
                              </p>
                            </div>
                          ) : (
                            <p className="text-slate-400 italic">
                              Enquadramento não concluído neste snapshot.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
                      Selecione uma versão à esquerda para visualizar seu conteúdo salvo.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA: DOSSIÊ CONSOLIDADO (TODAS AS SEÇÕES COM AVISO DE ETAPA NÃO CONCLUÍDA) */}
        {/* ========================================================================= */}
        {abaAtiva === 'consolidado' && (
          <div className="space-y-8 animate-fade-in">
            {/* BARRA SUPERIOR DO CONSOLIDADO COM BOTÃO PDF */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-[#07132B] block">
                  Visão Integrada de Inteligência Corporativa
                </span>
                <h2 className="text-2xl font-heading font-black text-[#07132B]">
                  Dossiê Tributário Consolidado
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Reúne os dados das 5 fases. Seções não preenchidas exibem aviso sem bloquear a
                  análise.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleBaixarConsolidado}
                  className="px-6 py-3 rounded-xl font-heading font-black text-xs sm:text-sm text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-md transition-all text-center"
                >
                  Baixar Relatório Consolidado em PDF
                </button>
              </div>
            </div>

            {/* QUADRO: MUDANÇAS PARA O SEU PERFIL (LEGISLAÇÃO CONTEXTUAL & RADAR) */}
            <QuadroMudancasPerfilConsolidado
              segmento={dadosEmpresa.segmento}
              regimeAtual={dadosEmpresa.regimeAtual}
              perfilNf={dadosEmpresa.emissaoNf}
              atividadeMista={dadosEmpresa.atividadeMista}
              temDadosSalvos={temDadosSalvos}
            />

            {/* SEÇÃO 1: CONFIGURAÇÕES */}
            <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-slate-200 shadow-md space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold uppercase bg-[#07132B] text-[#D4AF37] border border-[#D4AF37]/30">
                    ETAPA 01
                  </span>
                  <h3 className="text-xl font-heading font-extrabold text-[#07132B]">
                    1. Dados das Configurações
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleBaixarConfiguracoes}
                    className="text-xs font-bold text-slate-600 hover:text-[#07132B] underline"
                  >
                    Gerar PDF Individual
                  </button>
                  <Link
                    to="/diagnostico-configuracoes"
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-[#07132B] hover:bg-slate-200 transition-colors"
                  >
                    Revisar etapa 01 →
                  </Link>
                </div>
              </div>

              {temDadosSalvos ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 uppercase font-semibold block text-[10px]">
                      Razão Social
                    </span>
                    <strong className="text-slate-800 text-sm">{dadosEmpresa.nomeEmpresa}</strong>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 uppercase font-semibold block text-[10px]">
                      CNPJ
                    </span>
                    <strong className="text-slate-800 text-sm font-mono">
                      {dadosEmpresa.cnpj ? formatarCNPJ(dadosEmpresa.cnpj) : 'Não informado'}
                    </strong>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 uppercase font-semibold block text-[10px]">
                      Contato & Responsável
                    </span>
                    <strong className="text-slate-800 text-sm">
                      {dadosEmpresa.nomeContato || '—'}
                    </strong>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 uppercase font-semibold block text-[10px]">
                      UF & Cidade
                    </span>
                    <strong className="text-slate-800 text-sm">
                      {dadosEmpresa.ufOrigem} / {dadosEmpresa.cidade}
                    </strong>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 uppercase font-semibold block text-[10px]">
                      Segmento Homologado
                    </span>
                    <strong className="text-slate-800 text-sm">{dadosEmpresa.segmento}</strong>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 uppercase font-semibold block text-[10px]">
                      Regime Atual
                    </span>
                    <strong className="text-slate-800 text-sm">{dadosEmpresa.regimeAtual}</strong>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 uppercase font-semibold block text-[10px]">
                      Colaboradores
                    </span>
                    <strong className="text-slate-800 text-sm">{dadosEmpresa.funcionarios}</strong>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 uppercase font-semibold block text-[10px]">
                      Perfil de Notas Fiscais
                    </span>
                    <strong className="text-slate-800 text-sm">{dadosEmpresa.emissaoNf}</strong>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 uppercase font-semibold block text-[10px]">
                      Atividade Mista
                    </span>
                    <strong className="text-slate-800 text-sm">
                      {dadosEmpresa.atividadeMista
                        ? `Sim (${dadosEmpresa.proporcaoServicoMisto ?? 50}% Serviços)`
                        : 'Não (Atividade Pura)'}
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <strong className="text-amber-900 block font-bold text-sm">
                      Etapa não concluída
                    </strong>
                    <p className="text-amber-700 mt-0.5">
                      Os parâmetros da empresa ainda não foram cadastrados nas Configurações.
                    </p>
                  </div>
                  <Link
                    to="/diagnostico-configuracoes"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#07132B] text-[#D4AF37] hover:bg-[#0c1f44] transition-all self-start sm:self-auto"
                  >
                    Preencher Configurações →
                  </Link>
                </div>
              )}
            </div>

            {/* SEÇÃO 2: AUTOAVALIAÇÃO DAS 7 FRENTES */}
            <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-slate-200 shadow-md space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold uppercase bg-[#07132B] text-[#2ECC71] border border-[#2ECC71]/40">
                    ETAPA 02
                  </span>
                  <h3 className="text-xl font-heading font-extrabold text-[#07132B]">
                    2. Autoavaliação das 7 Frentes (Matriz Semáforo & Plano 30-60-90)
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleBaixarAutoavaliacao}
                    className="text-xs font-bold text-slate-600 hover:text-[#07132B] underline"
                  >
                    Gerar PDF Individual
                  </button>
                  <Link
                    to="/diagnostico-autoavaliacao"
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-[#07132B] hover:bg-slate-200 transition-colors"
                  >
                    Revisar etapa 02 →
                  </Link>
                </div>
              </div>

              {diagAutoavaliacao?.dados_extra_json ? (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-[#07132B] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[11px] font-mono text-[#D4AF37] uppercase font-bold block">
                        Classificação Global Diamond
                      </span>
                      <strong className="text-lg font-heading text-white">
                        {diagAutoavaliacao.dados_extra_json.resumo?.perfil ||
                          'Mapeamento Concluído'}
                      </strong>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-400/30">
                        {diagAutoavaliacao.dados_extra_json.resumo?.totalCriticos || 0} Crítico(s)
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                        {diagAutoavaliacao.dados_extra_json.resumo?.totalAlertas || 0} Alerta(s)
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#145A32] text-[#2ECC71] border border-[#2ECC71]/40">
                        {diagAutoavaliacao.dados_extra_json.resumo?.totalControlados || 0}{' '}
                        Controlado(s)
                      </span>
                    </div>
                  </div>

                  {/* ALERTA DE ATENÇÃO NA FRENTE FINANCEIRO & CRÉDITO */}
                  {(semaforoAtual[1] === 'vermelho' || semaforoAtual[1] === 'amarelo') && (
                    <div className="p-4 sm:p-5 rounded-xl bg-amber-50/90 border border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-amber-200 text-amber-900 border border-amber-300">
                            Frente 1 em Atenção •{' '}
                            {semaforoAtual[1] === 'vermelho' ? 'Crítico' : 'Alerta'}
                          </span>
                          <span className="text-slate-500 font-semibold">
                            • Financeiro & Crédito
                          </span>
                        </div>
                        <p className="text-slate-800 font-medium">
                          Detectada pressão de capital de giro ou capacidade de pagamento mensal.
                          Recomendado executar a auditoria aprofundada de balanço e DRE no sistema
                          externo.
                        </p>
                      </div>
                      <a
                        href={URL_SISTEMA_ANALISE_FINANCEIRA}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 rounded-xl font-heading font-bold text-xs text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-sm transition-all whitespace-nowrap shrink-0"
                      >
                        Análise Financeira Completa
                      </a>
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-slate-800 uppercase text-[11px] block font-bold">
                        Plano de Ação 30-60-90 Estruturado:
                      </strong>
                      <span className="text-[11px] text-slate-500">Marcos 30, 60 e 90 dias</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-white rounded-lg border border-slate-200 flex flex-col justify-between gap-2">
                        <div>
                          <span className="text-[11px] font-bold text-[#D4AF37] block">
                            1. 30 Dias
                          </span>
                          <p className="text-slate-600 mt-0.5">Liquidez Rápida, Crédito & Caixa</p>
                        </div>
                        {(semaforoAtual[1] === 'vermelho' ||
                          semaforoAtual[1] === 'amarelo' ||
                          !diagAutoavaliacao) && (
                          <a
                            href={URL_SISTEMA_ANALISE_FINANCEIRA}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-full px-2.5 py-1.5 rounded-md font-heading font-bold text-[10px] text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-sm transition-all text-center"
                          >
                            Análise Financeira Completa
                          </a>
                        )}
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-slate-200">
                        <span className="text-[11px] font-bold text-[#2ECC71] block">
                          2. 60 Dias
                        </span>
                        <p className="text-slate-600 mt-0.5">Societário, Parcerias & Governança</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-slate-200">
                        <span className="text-[11px] font-bold text-blue-500 block">
                          3. 90 Dias
                        </span>
                        <p className="text-slate-600 mt-0.5">
                          Transição Tributária, POPs & Cultura
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* NOTA ORIENTATIVA NA AUTOAVALIAÇÃO DAS 7 FRENTES */}
                  <AvisoOrientativo variante="curta" tema="claro" />
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <strong className="text-amber-900 block font-bold text-sm">
                      Etapa não concluída
                    </strong>
                    <p className="text-amber-700 mt-0.5">
                      A autoavaliação interativa nas 7 frentes (14 perguntas) ainda não foi
                      realizada.
                    </p>
                  </div>
                  <Link
                    to="/diagnostico-autoavaliacao"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#07132B] text-[#D4AF37] hover:bg-[#0c1f44] transition-all self-start sm:self-auto"
                  >
                    Iniciar Autoavaliação →
                  </Link>
                </div>
              )}
            </div>

            {/* SEÇÃO 3: TRANSIÇÃO FISCAL */}
            <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-slate-200 shadow-md space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold uppercase bg-[#07132B] text-[#F59E0B] border border-[#F59E0B]/40">
                    ETAPA 03
                  </span>
                  <h3 className="text-xl font-heading font-extrabold text-[#07132B]">
                    3. Diagnóstico de Transição Fiscal (Reforma 2026–2033)
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleBaixarTransicao}
                    className="text-xs font-bold text-slate-600 hover:text-[#07132B] underline"
                  >
                    Gerar PDF Individual
                  </button>
                  <Link
                    to="/diagnostico-transicao"
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-[#07132B] hover:bg-slate-200 transition-colors"
                  >
                    Revisar etapa 03 →
                  </Link>
                </div>
              </div>

              {diagTransicao?.dados_extra_json ? (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-slate-400 uppercase font-semibold text-[10px] block">
                        Farol de Urgência da Transição
                      </span>
                      <strong className="text-slate-900 text-sm">
                        {diagTransicao.dados_extra_json.laudo?.farol || 'Urgência Identificada'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase font-semibold text-[10px] block">
                        Solução Técnica Recomendada
                      </span>
                      <strong className="text-[#07132B] text-sm">
                        {diagTransicao.dados_extra_json.laudo?.servicoRecomendado ||
                          'Workshop e Adequação Fiscal'}
                      </strong>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 uppercase block">
                      Prioridades nos Próximos 90 Dias:
                    </span>
                    <ul className="space-y-1.5 text-slate-600">
                      {(
                        diagTransicao.dados_extra_json.laudo?.prioridades || [
                          'Adequar cadastro de mercadorias e serviços às novas regras da CBS/IBS.',
                          'Revisar contratos de fornecedores para prever impactos de Split Payment.',
                          'Auditar a cadeia produtiva para identificar créditos amplos no regime regular.',
                        ]
                      ).map((p: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[#D4AF37] font-bold">•</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* NOTA ORIENTATIVA NO PAINEL DA TRANSIÇÃO */}
                  <AvisoOrientativo variante="curta" tema="claro" />
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <strong className="text-amber-900 block font-bold text-sm">
                      Etapa não concluída
                    </strong>
                    <p className="text-amber-700 mt-0.5">
                      O roteiro de 40 minutos da Transição Fiscal ainda não foi concluído.
                    </p>
                  </div>
                  <Link
                    to="/diagnostico-transicao"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#07132B] text-[#D4AF37] hover:bg-[#0c1f44] transition-all self-start sm:self-auto"
                  >
                    Iniciar Transição Fiscal →
                  </Link>
                </div>
              )}
            </div>

            {/* SEÇÃO 4: COMPARAÇÃO DE REGIME */}
            <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-slate-200 shadow-md space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold uppercase bg-[#07132B] text-[#3B82F6] border border-[#3B82F6]/40">
                    ETAPA 04
                  </span>
                  <h3 className="text-xl font-heading font-extrabold text-[#07132B]">
                    4. Comparação de Regime (Matriz dos 4 Regimes)
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleBaixarRegimes}
                    className="text-xs font-bold text-slate-600 hover:text-[#07132B] underline"
                  >
                    Gerar PDF Individual
                  </button>
                  <Link
                    to="/diagnostico-regimes"
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-[#07132B] hover:bg-slate-200 transition-colors"
                  >
                    Revisar etapa 04 →
                  </Link>
                </div>
              </div>

              {diagRegimes ? (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-slate-400 uppercase font-semibold text-[10px] block">
                        Regime Recomendado na Comparação
                      </span>
                      <strong className="text-lg font-heading text-[#07132B]">
                        {diagRegimes.sistema_recomendado_novo || diagRegimes.regime_recomendado}
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-400 uppercase font-semibold text-[10px] block">
                        Economia Anual Estimada
                      </span>
                      <strong className="text-lg font-heading text-emerald-600">
                        {formatarMoeda(
                          diagRegimes.economia_anual_novo || diagRegimes.economia_anual || 0,
                        )}{' '}
                        / ano
                      </strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-slate-400 text-[10px] uppercase block font-semibold">
                        Simples Nacional
                      </span>
                      <strong className="text-slate-800 text-sm">
                        {formatarMoeda(diagRegimes.carga_simples_novo || diagRegimes.carga_simples)}
                      </strong>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-slate-400 text-[10px] uppercase block font-semibold">
                        Lucro Presumido
                      </span>
                      <strong className="text-slate-800 text-sm">
                        {formatarMoeda(
                          diagRegimes.carga_presumido_novo || diagRegimes.carga_presumido,
                        )}
                      </strong>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-slate-400 text-[10px] uppercase block font-semibold">
                        Lucro Real
                      </span>
                      <strong className="text-slate-800 text-sm">
                        {formatarMoeda(diagRegimes.carga_real_novo || diagRegimes.carga_real)}
                      </strong>
                    </div>
                  </div>

                  {/* NOTA ORIENTATIVA NO PAINEL DE COMPARAÇÃO DE REGIME */}
                  <AvisoOrientativo variante="curta" tema="claro" />
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <strong className="text-amber-900 block font-bold text-sm">
                      Etapa não concluída
                    </strong>
                    <p className="text-amber-700 mt-0.5">
                      A comparação matemática dos 4 regimes societários ainda não foi gerada.
                    </p>
                  </div>
                  <Link
                    to="/diagnostico-regimes"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#07132B] text-[#D4AF37] hover:bg-[#0c1f44] transition-all self-start sm:self-auto"
                  >
                    Iniciar Comparação de Regimes →
                  </Link>
                </div>
              )}
            </div>

            {/* SEÇÃO 5: ENQUADRAMENTO COMPLETO */}
            <div className="bg-white rounded-[24px] p-6 sm:p-8 border-2 border-[#10B981]/40 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold uppercase bg-[#07132B] text-[#10B981] border border-[#10B981]/40">
                    ETAPA 05 (FINAL)
                  </span>
                  <h3 className="text-xl font-heading font-extrabold text-[#07132B]">
                    5. Parecer do Enquadramento Completo & Novo Código Tributário
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    to="/diagnostico"
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#07132B] text-[#D4AF37] hover:bg-[#0c1f44] transition-colors border border-[#D4AF37]/30"
                  >
                    Refazer Enquadramento no Simulador
                  </Link>
                </div>
              </div>

              {diagEnquadramento ? (
                <div className="space-y-4 text-xs">
                  <div className="p-5 rounded-2xl bg-[#07132B] text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[11px] font-mono text-[#2ECC71] uppercase font-bold">
                        Regime Recomendado na Reforma (Ano {diagEnquadramento.ano_base || 2026})
                      </span>
                      <h4 className="text-2xl font-heading font-black text-white">
                        {diagEnquadramento.sistema_recomendado_novo ||
                          diagEnquadramento.regime_recomendado}
                      </h4>
                      <p className="text-slate-300 text-xs">
                        Base legal: EC 132/2023 e LC 214/2025.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white/10 border border-white/15 text-center shrink-0">
                      <span className="text-[10px] text-slate-300 uppercase block">
                        Economia Estimada vs 2º Colocado
                      </span>
                      <strong className="text-xl font-heading text-[#2ECC71] block">
                        {formatarMoeda(
                          diagEnquadramento.economia_anual_novo ||
                            diagEnquadramento.economia_anual ||
                            0,
                        )}
                      </strong>
                      <span className="text-[10px] text-slate-400">por ano em caixa livre</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 text-[10px] uppercase block">RBT12</span>
                      <strong className="text-slate-800">
                        {formatarMoeda(diagEnquadramento.rbt12)}
                      </strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 text-[10px] uppercase block">Folha 12m</span>
                      <strong className="text-slate-800">
                        {formatarMoeda(diagEnquadramento.folha12)}
                      </strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 text-[10px] uppercase block">Margem</span>
                      <strong className="text-slate-800">{diagEnquadramento.margem_lucro}%</strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 text-[10px] uppercase block">Ano-Base</span>
                      <strong className="text-slate-800">
                        {diagEnquadramento.ano_base || 2026}
                      </strong>
                    </div>
                  </div>

                  {/* NOTA ORIENTATIVA NO PAINEL DE ENQUADRAMENTO COMPLETO */}
                  <AvisoOrientativo variante="curta" tema="claro" />
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <strong className="text-amber-900 block font-bold text-sm">
                      Etapa não concluída
                    </strong>
                    <p className="text-amber-700 mt-0.5">
                      O diagnóstico de enquadramento completo com ranking e parecer ainda não foi
                      executado.
                    </p>
                  </div>
                  <Link
                    to="/diagnostico"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#07132B] text-[#D4AF37] hover:bg-[#0c1f44] transition-all self-start sm:self-auto"
                  >
                    Iniciar Enquadramento →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABAS INDIVIDUAIS: CADA ETAPA TEM SEU RELATÓRIO INDIVIDUAL VISUALIZÁVEL E IMPRIMÍVEL */}
        {/* ========================================================================= */}
        {abaAtiva === 'configuracoes' && (
          <div className="bg-white rounded-[24px] p-6 sm:p-10 border border-slate-200 shadow-xl space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold uppercase bg-[#07132B] text-[#D4AF37] border border-[#D4AF37]/30 inline-block mb-1">
                  RELATÓRIO INDIVIDUAL • ETAPA 01
                </span>
                <h2 className="text-2xl font-heading font-black text-[#07132B]">
                  Configurações e Parâmetros Base
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleBaixarConfiguracoes}
                  className="px-5 py-2.5 rounded-xl font-heading font-black text-xs text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-md transition-all"
                >
                  Baixar PDF da Etapa ↓
                </button>
                <Link
                  to="/diagnostico-configuracoes"
                  className="px-4 py-2.5 rounded-xl font-heading font-bold text-xs bg-slate-100 text-[#07132B] hover:bg-slate-200"
                >
                  Revisar Formulário →
                </Link>
              </div>
            </div>

            {temDadosSalvos ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 uppercase text-xs font-bold block">Empresa</span>
                  <p className="font-bold text-slate-800 text-base">{dadosEmpresa.nomeEmpresa}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 uppercase text-xs font-bold block">CNPJ</span>
                  <p className="font-bold text-slate-800 text-base font-mono">
                    {dadosEmpresa.cnpj ? formatarCNPJ(dadosEmpresa.cnpj) : 'Não informado'}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 uppercase text-xs font-bold block">Contato</span>
                  <p className="font-bold text-slate-800">{dadosEmpresa.nomeContato || '—'}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 uppercase text-xs font-bold block">
                    Localização
                  </span>
                  <p className="font-bold text-slate-800">
                    {dadosEmpresa.ufOrigem} — {dadosEmpresa.cidade}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 uppercase text-xs font-bold block">Segmento</span>
                  <p className="font-bold text-slate-800">{dadosEmpresa.segmento}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 uppercase text-xs font-bold block">
                    Regime Atual
                  </span>
                  <p className="font-bold text-slate-800">{dadosEmpresa.regimeAtual}</p>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-amber-50 rounded-2xl border border-amber-200">
                <strong className="text-amber-900 font-bold block text-base mb-1">
                  Etapa não concluída
                </strong>
                <p className="text-amber-700 text-xs max-w-md mx-auto mb-4">
                  Cadastre os parâmetros operacionais da empresa para liberar este relatório.
                </p>
                <Link
                  to="/diagnostico-configuracoes"
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#07132B] text-[#D4AF37]"
                >
                  Preencher Configurações
                </Link>
              </div>
            )}
          </div>
        )}

        {abaAtiva === 'autoavaliacao' && (
          <div className="bg-white rounded-[24px] p-6 sm:p-10 border border-slate-200 shadow-xl space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold uppercase bg-[#07132B] text-[#2ECC71] border border-[#2ECC71]/40 inline-block mb-1">
                  RELATÓRIO INDIVIDUAL • ETAPA 02
                </span>
                <h2 className="text-2xl font-heading font-black text-[#07132B]">
                  Autoavaliação das 7 Frentes Estruturais
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleBaixarAutoavaliacao}
                  className="px-5 py-2.5 rounded-xl font-heading font-black text-xs text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-md transition-all"
                >
                  Baixar PDF da Etapa ↓
                </button>
                <Link
                  to="/diagnostico-autoavaliacao"
                  className="px-4 py-2.5 rounded-xl font-heading font-bold text-xs bg-slate-100 text-[#07132B] hover:bg-slate-200"
                >
                  Revisar Perguntas →
                </Link>
              </div>
            </div>

            {diagAutoavaliacao?.dados_extra_json ? (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-[#07132B] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-mono text-[#D4AF37] uppercase font-bold block">
                      Perfil Geral de Risco
                    </span>
                    <strong className="text-xl font-heading text-white">
                      {diagAutoavaliacao.dados_extra_json.resumo?.perfil}
                    </strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300">
                      {diagAutoavaliacao.dados_extra_json.resumo?.totalCriticos} Críticos
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300">
                      {diagAutoavaliacao.dados_extra_json.resumo?.totalAlertas} Alertas
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#145A32] text-[#2ECC71]">
                      {diagAutoavaliacao.dados_extra_json.resumo?.totalControlados} Controlados
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800 uppercase block">
                      Plano de Ação 30-60-90
                    </span>
                    {(semaforoAtual[1] === 'vermelho' || semaforoAtual[1] === 'amarelo') && (
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                        Frente Financeiro & Crédito em Atenção
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Priorização de ações imediatas de liquidez e caixa em 30 dias, regularização
                    societária e contratos em 60 dias, e adequação ao novo sistema tributário em 90
                    dias.
                  </p>
                  {(semaforoAtual[1] === 'vermelho' || semaforoAtual[1] === 'amarelo') && (
                    <div className="pt-2 flex items-center justify-between gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <p className="text-[11px] text-amber-950 font-medium">
                        Aprofunde a avaliação dos balanços e índices de endividamento da empresa no
                        sistema parceiro:
                      </p>
                      <a
                        href={URL_SISTEMA_ANALISE_FINANCEIRA}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-4 py-2 rounded-lg font-heading font-bold text-xs text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-sm transition-all whitespace-nowrap shrink-0"
                      >
                        Análise Financeira Completa
                      </a>
                    </div>
                  )}
                </div>

                {/* NOTA ORIENTATIVA NO RELATÓRIO INDIVIDUAL DA ETAPA 02 */}
                <AvisoOrientativo variante="curta" tema="claro" />
              </div>
            ) : (
              <div className="p-8 text-center bg-amber-50 rounded-2xl border border-amber-200">
                <strong className="text-amber-900 font-bold block text-base mb-1">
                  Etapa não concluída
                </strong>
                <p className="text-amber-700 text-xs max-w-md mx-auto mb-4">
                  Preencha as 14 perguntas da autoavaliação para emitir este relatório individual.
                </p>
                <Link
                  to="/diagnostico-autoavaliacao"
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#07132B] text-[#D4AF37]"
                >
                  Iniciar Autoavaliação
                </Link>
              </div>
            )}
          </div>
        )}

        {abaAtiva === 'transicao' && (
          <div className="bg-white rounded-[24px] p-6 sm:p-10 border border-slate-200 shadow-xl space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold uppercase bg-[#07132B] text-[#F59E0B] border border-[#F59E0B]/40 inline-block mb-1">
                  RELATÓRIO INDIVIDUAL • ETAPA 03
                </span>
                <h2 className="text-2xl font-heading font-black text-[#07132B]">
                  Diagnóstico de Transição Fiscal
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleBaixarTransicao}
                  className="px-5 py-2.5 rounded-xl font-heading font-black text-xs text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-md transition-all"
                >
                  Baixar PDF da Etapa ↓
                </button>
                <Link
                  to="/diagnostico-transicao"
                  className="px-4 py-2.5 rounded-xl font-heading font-bold text-xs bg-slate-100 text-[#07132B] hover:bg-slate-200"
                >
                  Revisar Roteiro →
                </Link>
              </div>
            </div>

            {diagTransicao?.dados_extra_json ? (
              <div className="space-y-4 text-xs">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[10px] block">
                      Farol
                    </span>
                    <strong className="text-base font-bold text-slate-800">
                      {diagTransicao.dados_extra_json.laudo?.farol}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[10px] block">
                      Solução Recomendada
                    </span>
                    <strong className="text-base font-bold text-[#07132B]">
                      {diagTransicao.dados_extra_json.laudo?.servicoRecomendado}
                    </strong>
                  </div>
                </div>

                {/* NOTA ORIENTATIVA NO RELATÓRIO INDIVIDUAL DA ETAPA 03 */}
                <AvisoOrientativo variante="curta" tema="claro" />
              </div>
            ) : (
              <div className="p-8 text-center bg-amber-50 rounded-2xl border border-amber-200">
                <strong className="text-amber-900 font-bold block text-base mb-1">
                  Etapa não concluída
                </strong>
                <p className="text-amber-700 text-xs max-w-md mx-auto mb-4">
                  Responda aos dois blocos do roteiro de 40 minutos para gerar este laudo.
                </p>
                <Link
                  to="/diagnostico-transicao"
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#07132B] text-[#D4AF37]"
                >
                  Iniciar Transição Fiscal
                </Link>
              </div>
            )}
          </div>
        )}

        {abaAtiva === 'regimes' && (
          <div className="bg-white rounded-[24px] p-6 sm:p-10 border border-slate-200 shadow-xl space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold uppercase bg-[#07132B] text-[#3B82F6] border border-[#3B82F6]/40 inline-block mb-1">
                  RELATÓRIO INDIVIDUAL • ETAPA 04
                </span>
                <h2 className="text-2xl font-heading font-black text-[#07132B]">
                  Comparação dos 4 Regimes Societários
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleBaixarRegimes}
                  className="px-5 py-2.5 rounded-xl font-heading font-black text-xs text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-md transition-all"
                >
                  Baixar PDF da Etapa ↓
                </button>
                <Link
                  to="/diagnostico-regimes"
                  className="px-4 py-2.5 rounded-xl font-heading font-bold text-xs bg-slate-100 text-[#07132B] hover:bg-slate-200"
                >
                  Revisar Comparador →
                </Link>
              </div>
            </div>

            {diagRegimes ? (
              <div className="space-y-4 text-xs">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[10px] block">
                      Recomendação
                    </span>
                    <strong className="text-lg font-heading text-slate-800">
                      {diagRegimes.sistema_recomendado_novo || diagRegimes.regime_recomendado}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[10px] block">
                      Economia
                    </span>
                    <strong className="text-lg font-heading text-emerald-600">
                      {formatarMoeda(
                        diagRegimes.economia_anual_novo || diagRegimes.economia_anual || 0,
                      )}{' '}
                      / ano
                    </strong>
                  </div>
                </div>

                {/* NOTA ORIENTATIVA NO RELATÓRIO INDIVIDUAL DA ETAPA 04 */}
                <AvisoOrientativo variante="curta" tema="claro" />
              </div>
            ) : (
              <div className="p-8 text-center bg-amber-50 rounded-2xl border border-amber-200">
                <strong className="text-amber-900 font-bold block text-base mb-1">
                  Etapa não concluída
                </strong>
                <p className="text-amber-700 text-xs max-w-md mx-auto mb-4">
                  Execute o comparador dos 4 regimes societários para emitir este relatório
                  individual.
                </p>
                <Link
                  to="/diagnostico-regimes"
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#07132B] text-[#D4AF37]"
                >
                  Iniciar Comparação de Regimes
                </Link>
              </div>
            )}
          </div>
        )}

        {abaAtiva === 'enquadramento' && (
          <div className="bg-white rounded-[24px] p-6 sm:p-10 border border-slate-200 shadow-xl space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold uppercase bg-[#07132B] text-[#10B981] border border-[#10B981]/40 inline-block mb-1">
                  RELATÓRIO INDIVIDUAL • ETAPA 05
                </span>
                <h2 className="text-2xl font-heading font-black text-[#07132B]">
                  Enquadramento Tributário Completo
                </h2>
              </div>
              <div className="flex items-center gap-3">
                {Boolean(diagEnquadramento) && (
                  <button
                    type="button"
                    onClick={handleBaixarParecerEnquadramento}
                    disabled={gerandoParecerEnquadramento}
                    className="px-5 py-2.5 rounded-xl font-heading font-black text-xs text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-md transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {gerandoParecerEnquadramento
                      ? 'Gerando Parecer...'
                      : 'Baixar Parecer Completo (PDF)'}
                  </button>
                )}
                <Link
                  to="/diagnostico"
                  className="px-4 py-2.5 rounded-xl font-heading font-bold text-xs bg-slate-100 text-[#07132B] hover:bg-slate-200 border border-slate-300 transition-colors"
                >
                  Refazer Enquadramento no Simulador
                </Link>
              </div>
            </div>

            {diagEnquadramento ? (
              <div className="space-y-4">
                <div className="p-6 rounded-2xl bg-[#07132B] text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-mono text-[#2ECC71] uppercase font-bold block">
                      Regime Recomendado na Reforma
                    </span>
                    <strong className="text-2xl font-heading text-white">
                      {diagEnquadramento.sistema_recomendado_novo ||
                        diagEnquadramento.regime_recomendado}
                    </strong>
                    <p className="text-xs text-slate-300 mt-1">
                      Ano-base {diagEnquadramento.ano_base || 2026} sob a EC 132/2023.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-300 uppercase block">Economia Anual</span>
                    <strong className="text-2xl font-heading text-[#2ECC71]">
                      {formatarMoeda(
                        diagEnquadramento.economia_anual_novo ||
                          diagEnquadramento.economia_anual ||
                          0,
                      )}
                    </strong>
                  </div>
                </div>

                {/* NOTA ORIENTATIVA NO RELATÓRIO INDIVIDUAL DA ETAPA 05 */}
                <AvisoOrientativo variante="curta" tema="claro" />
              </div>
            ) : (
              <div className="p-8 text-center bg-amber-50 rounded-2xl border border-amber-200">
                <strong className="text-amber-900 font-bold block text-base mb-1">
                  Etapa não concluída
                </strong>
                <p className="text-amber-700 text-xs max-w-md mx-auto mb-4">
                  Finalize o simulador na página /diagnostico para gerar o parecer completo e
                  ranking de regimes.
                </p>
                <Link
                  to="/diagnostico"
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#07132B] text-[#D4AF37]"
                >
                  Iniciar Enquadramento
                </Link>
              </div>
            )}
          </div>
        )}

        {abaAtiva === 'fornecedores' && (
          <SecaoFornecedoresConsolidado
            clienteAtivoId={clienteAtivoId}
            dadosEmpresa={temDadosSalvos ? dadosEmpresa : null}
          />
        )}
      </div>

      {/* AVISO LEGAL COMPLETO NO FECHAMENTO DO RELATÓRIO CONSOLIDADO */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 mt-12 mb-6">
        <AvisoOrientativo variante="completa" tema="claro" />
      </div>

      {/* QUADRO: FAZER OUTRO DIAGNÓSTICO (DIAMOND GROUP: NAVY #07132B, DOURADO #D4AF37, SEM ÍCONES NO BOTÃO) */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 my-16">
        <div className="relative rounded-2xl bg-gradient-to-br from-[#07132B] via-[#0E2442] to-[#14345C] text-white p-8 sm:p-12 border border-[#D4AF37]/30 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 mb-3 uppercase tracking-wider">
                DIAGNOSTICADOR EXECUTIVO DIAMOND
              </div>
              <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-white leading-tight">
                Fazer Outro Diagnóstico
              </h3>
              <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
                Inicie uma nova análise diagnóstica completa 360°, avalie os 7 riscos estratégicos
                ou simule novos cenários para a sua empresa.
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link
                to="/agendamento?origem=relatorio_consolidado&assunto=Apresentação+do+Dossiê+Consolidado"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl font-bold text-xs sm:text-sm text-[#07132B] bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] hover:brightness-110 shadow-lg shadow-[#D4AF37]/20 transition-all hover:scale-105 cursor-pointer text-center"
              >
                Agendar Reunião com Especialista
              </Link>
              <Link
                to="/diagnostico-360"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-white/10 hover:bg-white/20 border border-[#D4AF37]/40 shadow-md transition-all text-center"
                title="Novo diagnóstico com os dados cadastrais da empresa atual pré-preenchidos"
              >
                Diagnóstico da mesma empresa
              </Link>
              <button
                type="button"
                onClick={() => {
                  limparDadosEmpresaContext()
                  limparClienteAtivo()
                  toast({
                    title: 'Dados cadastrais redefinidos',
                    description:
                      'Iniciando diagnóstico para uma nova empresa com campos em branco. Os históricos anteriores permanecem salvos.',
                  })
                  navigate('/diagnostico-configuracoes')
                }}
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl font-bold text-xs sm:text-sm text-[#D4AF37] bg-[#07132B] hover:bg-[#0c224c] border border-[#D4AF37] shadow-md transition-all hover:scale-105 cursor-pointer text-center"
                title="Limpar etapa 01/Dados da Empresa e preencher nova empresa do zero (históricos preservados)"
              >
                Diagnóstico de outra empresa
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
