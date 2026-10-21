import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalculadoraProvider, useCalculadoraIbsCbs } from '@/context/CalculadoraIbsCbsContext'
import { DiamondHeader, DiamondFooterCTA } from '@/components/reforma/DiamondLayout'
import { Button } from '@/components/ui/button'
import {
  Building2,
  BookmarkPlus,
  FileDown,
  FolderOpen,
  Scale,
  Sparkles,
  CheckCircle2,
  Sliders,
  Calculator,
  Coins,
  Calendar,
  LayoutDashboard,
  ShieldAlert,
  ArrowRight,
  Info,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { listarSimulacoes } from '@/services/simulacoesCalculadora'
import { gerarRelatorioSimulacaoPDF } from '@/lib/pdfSimulacaoCalculadora'
import type { SimulacaoCalculadora } from '@/types/simulacaoCalculadora'
import { useSearchParams } from 'react-router-dom'
import { ModalSalvarSimulacao } from '@/components/calculadora/ModalSalvarSimulacao'
import { ModalCompararSimulacoes } from '@/components/calculadora/ModalCompararSimulacoes'
import { ListaSimulacoes } from '@/components/calculadora/ListaSimulacoes'
import {
  ModalCompartilharLink,
  decodificarParametrosDaUrl,
} from '@/components/calculadora/ModalCompartilharLink'
import { ModalGerarPdf, type ResponsavelTecnicoDados } from '@/components/calculadora/ModalGerarPdf'
import { gerarRelatorioComparativoPDF } from '@/lib/pdfSimulacaoCalculadora'
import {
  isTipoAtividadeLegado,
  LABELS_RAMOS_LEGADOS,
  normalizarTipoAtividade,
} from '@/types/calculadoraIbsCbs'
import { FreemiumBadge } from '@/components/freemium/FreemiumBadge'
import { PaywallModal } from '@/components/freemium/PaywallModal'
import { Share2, X } from 'lucide-react'
import Modulo1Configuracoes from '@/components/calculadora/Modulo1Configuracoes'
import Modulo2CalculadoraSimples from '@/components/calculadora/Modulo2CalculadoraSimples'
import Modulo3ComparativoRegimes from '@/components/calculadora/Modulo3ComparativoRegimes'
import Modulo4SimuladorCreditos from '@/components/calculadora/Modulo4SimuladorCreditos'
import Modulo5TransicaoCronograma from '@/components/calculadora/Modulo5TransicaoCronograma'
import Modulo6Dashboard from '@/components/calculadora/Modulo6Dashboard'

type ModuloId = 'modulo1' | 'modulo2' | 'modulo3' | 'modulo4' | 'modulo5' | 'modulo6'

interface NavItem {
  id: ModuloId
  numero: string
  titulo: string
  subtitulo: string
  icon: React.ComponentType<{ className?: string }>
}

const MODULOS_NAV: NavItem[] = [
  {
    id: 'modulo1',
    numero: '01',
    titulo: 'Configurações',
    subtitulo: 'Alíquotas e Regimes',
    icon: Sliders,
  },
  {
    id: 'modulo2',
    numero: '02',
    titulo: 'Calculadora Simples',
    subtitulo: 'Operação Unitária',
    icon: Calculator,
  },
  {
    id: 'modulo3',
    numero: '03',
    titulo: 'Comparativo Regimes',
    subtitulo: 'Real, Presumido, Simples e IVA',
    icon: Scale,
  },
  {
    id: 'modulo4',
    numero: '04',
    titulo: 'Simulador de Créditos',
    subtitulo: 'Antes versus Depois',
    icon: Coins,
  },
  {
    id: 'modulo5',
    numero: '05',
    titulo: 'Transição 2026-2033',
    subtitulo: 'Cronograma e Anos Críticos',
    icon: Calendar,
  },
  {
    id: 'modulo6',
    numero: '06',
    titulo: 'Dashboard Executivo',
    subtitulo: 'KPIs, Gráficos e Resumo',
    icon: LayoutDashboard,
  },
]

function CalculadoraConteudo() {
  const [moduloAtivo, setModuloAtivo] = useState<ModuloId>('modulo6') // Inicia no Dashboard ou Módulo 1
  const {
    resultadoDashboard,
    obterSnapshotParametros,
    obterSnapshotResultados,
    restaurarSimulacao,
  } = useCalculadoraIbsCbs()
  const { user, isPremium, podeSimular, simulacoesUsadas, simulacoesRestantes } = useAuth()
  const { toast } = useToast()

  // Estados de simulações
  const [modalSalvarAberto, setModalSalvarAberto] = useState(false)
  const [modalCompararAberto, setModalCompararAberto] = useState(false)
  const [modalCompartilharAberto, setModalCompartilharAberto] = useState(false)
  const [modalPdfAtualAberto, setModalPdfAtualAberto] = useState(false)
  const [modalPdfComparativoAberto, setModalPdfComparativoAberto] = useState(false)
  const [gerandoPdfComparativo, setGerandoPdfComparativo] = useState(false)
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [paywallSimulacaoAberto, setPaywallSimulacaoAberto] = useState(false)
  const [simulacoes, setSimulacoes] = useState<SimulacaoCalculadora[]>([])
  const [carregandoSimulacoes, setCarregandoSimulacoes] = useState(false)
  const [selecionadasComparar, setSelecionadasComparar] = useState<string[]>([])

  // Etapa 6: Detecção de link compartilhado via query string (?simulacao=...)
  const [searchParams, setSearchParams] = useSearchParams()
  const [simulacaoCarregadaViaLink, setSimulacaoCarregadaViaLink] = useState(false)
  const [empresaLink, setEmpresaLink] = useState<string>('')
  const [avisoRamoLegado, setAvisoRamoLegado] = useState<string | null>(null)

  React.useEffect(() => {
    const rawParam = searchParams.get('simulacao')
    if (rawParam) {
      try {
        const paramsRestaurados = decodificarParametrosDaUrl(rawParam)
        if (paramsRestaurados) {
          if (isTipoAtividadeLegado(paramsRestaurados.tipoAtividade)) {
            const ramoAntigo = LABELS_RAMOS_LEGADOS[paramsRestaurados.tipoAtividade]
            const novoRamo = normalizarTipoAtividade(paramsRestaurados.tipoAtividade)
            setAvisoRamoLegado(
              `O ramo "${ramoAntigo}" deste link compartilhado foi mapeado automaticamente para "${novoRamo.toUpperCase()}".`,
            )
          }
          restaurarSimulacao(paramsRestaurados)
          setSimulacaoCarregadaViaLink(true)
          setEmpresaLink(paramsRestaurados.empresa || 'Cenário Compartilhado')
          toast({
            title: 'Simulação Carregada via Link!',
            description:
              'Os parâmetros e cálculos compartilhados foram restaurados com sucesso na sua tela.',
          })
        }
      } catch (err) {
        console.error('Falha ao restaurar simulação da URL:', err)
      }
    }
  }, [searchParams])

  const fecharAvisoLink = () => {
    setSimulacaoCarregadaViaLink(false)
    setAvisoRamoLegado(null)
    searchParams.delete('simulacao')
    setSearchParams(searchParams, { replace: true })
  }

  // Carrega simulações do usuário ou locais
  const recarregarSimulacoes = async () => {
    try {
      setCarregandoSimulacoes(true)
      const lista = await listarSimulacoes(user?.id)
      setSimulacoes(lista)
    } finally {
      setCarregandoSimulacoes(false)
    }
  }

  React.useEffect(() => {
    recarregarSimulacoes()
  }, [user?.id])

  const handleToggleSelecionada = (id: string) => {
    setSelecionadasComparar((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id)
      }
      if (prev.length >= 3) {
        toast({
          title: 'Limite de comparação',
          description: 'Você pode comparar no máximo 3 cenários simultaneamente.',
        })
        return prev
      }
      return [...prev, id]
    })
  }

  const handleCarregarSimulacao = (sim: SimulacaoCalculadora) => {
    try {
      if (isTipoAtividadeLegado(sim.parametros.tipoAtividade)) {
        const ramoAntigo = LABELS_RAMOS_LEGADOS[sim.parametros.tipoAtividade]
        const novoRamo = normalizarTipoAtividade(sim.parametros.tipoAtividade)
        setAvisoRamoLegado(
          `A simulação "${sim.nome}" utilizava o ramo "${ramoAntigo}", migrado com segurança para "${novoRamo.toUpperCase()}".`,
        )
      } else {
        setAvisoRamoLegado(null)
      }
      restaurarSimulacao(sim.parametros)
      toast({
        title: 'Cenário restaurado!',
        description: `Todos os parâmetros de "${sim.nome}" foram carregados nos 6 módulos.`,
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao restaurar',
        description: err?.message || 'Falha ao aplicar parâmetros salvos.',
        variant: 'destructive',
      })
    }
  }

  const handleTentarSalvarSimulacao = () => {
    if (!podeSimular) {
      setPaywallSimulacaoAberto(true)
      return
    }
    setModalSalvarAberto(true)
  }

  const handleBaixarPdfAtual = () => {
    setModalPdfAtualAberto(true)
  }

  const handleConfirmarPdfAtual = (dadosTecnico: ResponsavelTecnicoDados) => {
    try {
      setGerandoPdf(true)
      const params = obterSnapshotParametros()
      const res = obterSnapshotResultados()

      gerarRelatorioSimulacaoPDF({
        nomeSimulacao: 'Simulação Vigente na Tela',
        parametros: params,
        resultados: res,
        empresa: params.empresa,
        cnpj: params.cnpj,
        responsavelTecnico: dadosTecnico,
        observacoesContador: dadosTecnico.observacoes,
      })

      toast({
        title: 'Relatório PDF gerado!',
        description: 'O download com os resultados dos 6 módulos foi iniciado com sucesso.',
      })
      setModalPdfAtualAberto(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao gerar relatório',
        description: err?.message || 'Não foi possível compilar o PDF.',
        variant: 'destructive',
      })
    } finally {
      setGerandoPdf(false)
    }
  }

  const simulacoesParaComparar = simulacoes.filter((s) => selecionadasComparar.includes(s.id))

  const handleConfirmarPdfComparativo = (dadosTecnico: ResponsavelTecnicoDados) => {
    try {
      setGerandoPdfComparativo(true)
      gerarRelatorioComparativoPDF({
        simulacoes: simulacoesParaComparar,
        responsavelTecnico: dadosTecnico,
        observacoesContador: dadosTecnico.observacoes,
      })
      toast({
        title: 'PDF Comparativo gerado!',
        description: `Dossiê comparativo com ${simulacoesParaComparar.length} cenários baixado com sucesso.`,
      })
      setModalPdfComparativoAberto(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao gerar PDF',
        description: err?.message || 'Falha ao compilar comparativo em PDF.',
        variant: 'destructive',
      })
    } finally {
      setGerandoPdfComparativo(false)
    }
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* HEADER DIAMOND */}
      <DiamondHeader
        badge="DIAMOND GROUP • MOTOR TRIBUTÁRIO 5.0"
        titulo="Calculadora IBS / CBS Integrada"
        subtitulo="Simulador completo da Reforma Tributária (EC 132/2023 e LC 214/2025) com 6 módulos conectados em tempo real: alíquotas do IVA Dual, apuração unitária, matriz comparativa de regimes, crédito financeiro irrestrito, cronograma de transição 2026-2033 e dashboard executivo."
        mostrarVoltar={true}
        mostrarDiagnosticoBtn={true}
      />

      {/* BARRA SUPERIOR DE KPI RÁPIDO */}
      <div className="bg-[#0A140F] text-white border-b border-[#D4AF37]/30 py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            <span className="font-bold text-slate-200">Motor Ativo:</span>
            <span className="text-[#D4AF37] font-semibold">
              CBS 8,80% + IBS 17,70% = 26,50% (Soma de Referência)
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <span className="hidden sm:inline">
              Regime Recomendado:{' '}
              <strong className="text-emerald-400 font-mono">
                {resultadoDashboard.regimeRecomendado}
              </strong>
            </span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:inline">
              Alíquota Efetiva Nova:{' '}
              <strong className="text-[#D4AF37] font-mono">
                {resultadoDashboard.aliquotaEfetivaNova.toFixed(2)}%
              </strong>
            </span>
            {/* BOTÕES DE AÇÃO RÁPIDA: SALVAR, COMPARTILHAR E BAIXAR PDF */}
            <div className="flex items-center gap-2 ml-auto">
              <FreemiumBadge tipo="simulacao" />
              <button
                type="button"
                onClick={() => setModalCompartilharAberto(true)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[#D4AF37] border border-[#D4AF37]/40 font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                title="Compartilhar simulação via link público direto (acesso livre)"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Compartilhar</span>
              </button>
              <button
                type="button"
                onClick={handleTentarSalvarSimulacao}
                className="px-2.5 py-1 rounded-lg bg-[#D4AF37] text-[#07132B] font-bold hover:bg-[#E5C158] transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Salvar Simulação</span>
              </button>
              <button
                type="button"
                onClick={handleBaixarPdfAtual}
                disabled={gerandoPdf}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>{gerandoPdf ? 'Gerando...' : 'Baixar PDF'}</span>
              </button>
            </div>{' '}
          </div>
        </div>
      </div>

      {/* ETAPA 6: BANNER SUTIL QUANDO CARREGADO VIA LINK COMPARTILHADO */}
      {simulacaoCarregadaViaLink && (
        <div className="bg-gradient-to-r from-emerald-900 via-[#07132B] to-emerald-950 text-white border-b border-emerald-500/40 py-2.5 px-4 sm:px-6 shadow-inner animate-fade-in">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-emerald-300">
                Simulação carregada via Link Compartilhado:
              </span>
              <span className="text-white font-semibold">"{empresaLink}"</span>
              <span className="hidden sm:inline text-slate-300">
                — você pode navegar pelos 6 módulos e salvar este cenário na sua conta a qualquer
                momento.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTentarSalvarSimulacao}
                className="px-2.5 py-1 rounded bg-[#D4AF37] text-[#07132B] font-bold hover:bg-[#E5C158] text-[11px] transition-colors"
              >
                Salvar na Minha Conta
              </button>
              <button
                type="button"
                onClick={fecharAvisoLink}
                className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                title="Fechar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BANNER AMIGÁVEL QUANDO SIMULAÇÃO OU LINK LEGADO CONTÉM RAMO MIGRADO */}
      {avisoRamoLegado && (
        <div className="bg-amber-500/15 border-b border-amber-500/40 text-amber-900 py-2.5 px-4 sm:px-6 animate-fade-in">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span className="font-semibold">{avisoRamoLegado}</span>
              <span className="hidden md:inline text-amber-800">
                (A calculadora foi simplificada para os 4 ramos principais: Serviço, Indústria,
                Comércio e Misto).
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAvisoRamoLegado(null)}
              className="p-1 rounded hover:bg-amber-500/20 text-amber-800"
              title="Dispensar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ÁREA PRINCIPAL COM MENU LATERAL E CONTEÚDO */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* MENU LATERAL / NAVEGAÇÃO DE ABAS */}
          <aside className="w-full lg:w-72 shrink-0 bg-white border border-slate-200 rounded-2xl p-3 shadow-md lg:sticky lg:top-24 space-y-3">
            {/* BOTÃO DE DESTAQUE: DADOS DA EMPRESA */}
            <Link
              to="/dados-empresa"
              className="p-3 rounded-xl bg-gradient-to-r from-[#07132B] to-[#122347] text-white flex items-center justify-between gap-2.5 hover:from-[#0D1D3A] hover:to-[#1a3363] border border-[#D4AF37]/40 shadow-sm transition-all group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#D4AF37] text-[#07132B] flex items-center justify-center shrink-0 font-bold group-hover:scale-105 transition-transform">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-[#D4AF37] block truncate">
                    Dados da Empresa
                  </span>
                  <span className="text-[10px] text-slate-300 block truncate">
                    Perfil Global Integrado
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#D4AF37] shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <div className="px-3 py-1.5 border-b border-slate-100">
              <span className="text-xs font-bold text-[#07132B] uppercase tracking-wider block">
                6 Módulos Interligados
              </span>
              <span className="text-[11px] text-slate-500">Alimentados pelo seu perfil</span>
            </div>

            <nav className="space-y-1.5 flex flex-col">
              {MODULOS_NAV.map((item) => {
                const Icon = item.icon
                const isActive = moduloAtivo === item.id

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setModuloAtivo(item.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 group ${
                      isActive
                        ? 'bg-[#07132B] text-white shadow-md'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? 'bg-[#D4AF37] text-[#07132B]'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-[#07132B]/10 group-hover:text-[#07132B]'
                      }`}
                    >
                      <Icon className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold truncate ${
                            isActive ? 'text-[#D4AF37]' : 'text-[#07132B]'
                          }`}
                        >
                          {item.titulo}
                        </span>
                        <span
                          className={`text-[10px] font-mono ${
                            isActive ? 'text-slate-400' : 'text-slate-400'
                          }`}
                        >
                          {item.numero}
                        </span>
                      </div>
                      <span
                        className={`text-[11px] block truncate mt-0.5 ${
                          isActive ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {item.subtitulo}
                      </span>
                    </div>
                  </button>
                )
              })}
            </nav>

            {/* LISTA LATERAL: MINHAS SIMULAÇÕES */}
            <div className="mt-4 pt-3 border-t border-slate-100 px-1">
              <ListaSimulacoes
                simulacoes={simulacoes}
                onCarregarSimulacao={handleCarregarSimulacao}
                onSimulacaoAtualizada={recarregarSimulacoes}
                selecionadasParaComparar={selecionadasComparar}
                onToggleSelecionada={handleToggleSelecionada}
                onAbrirComparador={() => setModalCompararAberto(true)}
                onAbrirPdfComparativo={() => setModalPdfComparativoAberto(true)}
              />
            </div>

            {/* Bloco de consumo Freemium */}
            <FreemiumBadge tipo="simulacao" variante="barra" className="mt-2" />

            <div className="pt-2 border-t border-slate-100 px-3 py-2 bg-slate-50/70 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#07132B]">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                Cenários Salvos
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Marque 2 ou 3 simulações na lista acima para comparar os regimes e economias lado a
                lado.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={selecionadasComparar.length < 2 || selecionadasComparar.length > 3}
                onClick={() => setModalPdfComparativoAberto(true)}
                className="w-full text-xs font-bold border-[#D4AF37] text-[#0A1A13] hover:bg-[#D4AF37]/10 disabled:opacity-40"
              >
                {selecionadasComparar.length >= 2 && selecionadasComparar.length <= 3
                  ? `Baixar PDF Comparativo (${selecionadasComparar.length})`
                  : 'Baixar PDF Comparativo'}
              </Button>
            </div>
          </aside>

          {/* ÁREA DE CONTEÚDO DO MÓDULO SELECIONADO */}
          <main className="flex-1 w-full min-w-0">
            {moduloAtivo === 'modulo1' && <Modulo1Configuracoes />}
            {moduloAtivo === 'modulo2' && <Modulo2CalculadoraSimples />}
            {moduloAtivo === 'modulo3' && <Modulo3ComparativoRegimes />}
            {moduloAtivo === 'modulo4' && <Modulo4SimuladorCreditos />}
            {moduloAtivo === 'modulo5' && <Modulo5TransicaoCronograma />}
            {moduloAtivo === 'modulo6' && (
              <Modulo6Dashboard
                simulacoesComparar={simulacoesParaComparar}
                onAbrirPdfComparativo={() => setModalPdfComparativoAberto(true)}
              />
            )}

            {/* AVISO LEGAL DE ESTIMATIVA CONFORME ESPECIFICAÇÃO */}
            <div className="mt-12 p-5 rounded-2xl bg-slate-100/80 border border-slate-200 text-slate-600 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#07132B] text-sm">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                Aviso Legal e Premissas de Simulação
              </div>
              <p className="leading-relaxed">
                As alíquotas e cálculos apresentados nesta calculadora são estimativas técnicas
                baseadas no texto promulgado da Emenda Constitucional nº 132/2023, nas disposições
                da Lei Complementar nº 214/2025 e nas notas técnicas do Ministério da Fazenda
                (alíquota padrão de referência de 26,50%). As alíquotas definitivas do IBS e da CBS
                estão sujeitas à fixação anual pelo Comitê Gestor do IBS (CGIBS) e pelo Senado
                Federal, bem como a legislações estaduais e municipais específicas durante o período
                de transição (2026–2033).
              </p>
              <p className="leading-relaxed text-slate-500">
                Esta simulação tem finalidade exclusivamente consultiva, analítica e educacional.
                Não substitui o planejamento tributário formal nem a auditoria contábil
                individualizada para sua empresa.
              </p>
            </div>
          </main>
        </div>
      </div>

      {/* FOOTER CTA DIAMOND */}
      <DiamondFooterCTA
        titulo="Quer validar o planejamento da sua empresa com nossos tributaristas?"
        subtitulo="Nossa equipe analisa seus balancetes, histórico de compras e parametrização fiscal para blindar seu caixa antes da entrada da CBS em 2027."
      />

      {/* MODAL SALVAR SIMULAÇÃO */}
      <ModalSalvarSimulacao
        open={modalSalvarAberto}
        onOpenChange={setModalSalvarAberto}
        parametros={obterSnapshotParametros()}
        resultados={obterSnapshotResultados()}
        onSalvoComSucesso={() => {
          recarregarSimulacoes()
        }}
      />

      {/* MODAL COMPARADOR LADO A LADO */}
      <ModalCompararSimulacoes
        open={modalCompararAberto}
        onOpenChange={setModalCompararAberto}
        simulacoes={simulacoesParaComparar}
        onCarregarSimulacao={handleCarregarSimulacao}
      />

      {/* MODAL COMPARTILHAR LINK */}
      <ModalCompartilharLink
        open={modalCompartilharAberto}
        onOpenChange={setModalCompartilharAberto}
        parametros={obterSnapshotParametros()}
      />

      {/* MODAL RESPONSÁVEL TÉCNICO PARA PDF DA SIMULAÇÃO ATUAL */}
      <ModalGerarPdf
        open={modalPdfAtualAberto}
        onOpenChange={setModalPdfAtualAberto}
        titulo="Emitir Relatório da Simulação Vigente"
        descricao="Preencha os dados do Responsável Técnico para inclusão no cabeçalho e parecer do dossiê."
        modo="individual"
        onConfirmar={handleConfirmarPdfAtual}
        gerando={gerandoPdf}
      />

      {/* MODAL RESPONSÁVEL TÉCNICO PARA PDF COMPARATIVO */}
      <ModalGerarPdf
        open={modalPdfComparativoAberto}
        onOpenChange={setModalPdfComparativoAberto}
        titulo={`Emitir PDF Comparativo (${simulacoesParaComparar.length} cenários)`}
        descricao="Preencha os dados do Responsável Técnico para assinar o dossiê comparativo oficial."
        modo="comparativo"
        onConfirmar={handleConfirmarPdfComparativo}
        gerando={gerandoPdfComparativo}
      />

      {/* PAYWALL MODAL QUANDO ATINGE O LIMITE DE SIMULAÇÕES */}
      <PaywallModal
        open={paywallSimulacaoAberto}
        onOpenChange={setPaywallSimulacaoAberto}
        motivo="simulacao"
      />
    </div>
  )
}

export default function CalculadoraIbsCbs() {
  return (
    <CalculadoraProvider>
      <CalculadoraConteudo />
    </CalculadoraProvider>
  )
}
