import React, { useRef, useState } from 'react'
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
import { ModalExportarDadosSimulacao } from '@/components/calculadora/ModalExportarDadosSimulacao'
import { ModalGerarPdf, type ResponsavelTecnicoDados } from '@/components/calculadora/ModalGerarPdf'
import {
  ModalImportarFaturamento,
  type DadosFaturamentoImportados,
} from '@/components/calculadora/ModalImportarFaturamento'
import { gerarRelatorioComparativoPDF } from '@/lib/pdfSimulacaoCalculadora'
import {
  isTipoAtividadeLegado,
  LABELS_RAMOS_LEGADOS,
  normalizarTipoAtividade,
} from '@/types/calculadoraIbsCbs'
import { FreemiumBadge } from '@/components/freemium/FreemiumBadge'
import { PaywallModal } from '@/components/freemium/PaywallModal'
import { SeletorClienteAtivo } from '@/components/clientes/SeletorClienteAtivo'
import { useClienteAtivo } from '@/context/ClienteAtivoContext'
import { Share2, X } from 'lucide-react'
import AvisoNotasFiscaisReais from '@/components/calculadora/AvisoNotasFiscaisReais'
import type { ResumoComprasNotasReais } from '@/services/notasFiscais'
import Modulo1Configuracoes from '@/components/calculadora/Modulo1Configuracoes'
import Modulo2CalculadoraSimples from '@/components/calculadora/Modulo2CalculadoraSimples'
import Modulo3ComparativoRegimes from '@/components/calculadora/Modulo3ComparativoRegimes'
import Modulo4SimuladorCreditos from '@/components/calculadora/Modulo4SimuladorCreditos'
import Modulo5TransicaoCronograma from '@/components/calculadora/Modulo5TransicaoCronograma'
import Modulo6Dashboard from '@/components/calculadora/Modulo6Dashboard'
import ModuloDesoneracao from '@/components/calculadora/ModuloDesoneracao'

type ModuloId =
  | 'modulo1'
  | 'modulo2'
  | 'modulo3'
  | 'modulo4'
  | 'modulo5'
  | 'modulo6'
  | 'desoneracao'

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
  {
    id: 'desoneracao',
    numero: '★',
    titulo: 'Simulação de Desoneração',
    subtitulo: 'Folha (CPRB) & Exportação',
    icon: Sparkles,
  },
]

function CalculadoraConteudo() {
  const [moduloAtivo, setModuloAtivo] = useState<ModuloId>('modulo6') // Inicia no Dashboard ou Módulo 1
  const {
    resultadoDashboard,
    obterSnapshotParametros,
    obterSnapshotResultados,
    restaurarSimulacao,
    restaurarDadosEmpresaNoModulo,
    parametroRadarTemporario,
    aplicarAliquotaRadarTemporaria,
    limparParametroRadarTemporario,
  } = useCalculadoraIbsCbs()
  const { user, isPremium, podeSimular, simulacoesUsadas, simulacoesRestantes } = useAuth()
  const { clienteAtivo } = useClienteAtivo()
  const { toast } = useToast()

  // Estados de simulações
  const [modalSalvarAberto, setModalSalvarAberto] = useState(false)
  const [modalCompararAberto, setModalCompararAberto] = useState(false)
  const [modalCompartilharAberto, setModalCompartilharAberto] = useState(false)
  const [modalPdfAtualAberto, setModalPdfAtualAberto] = useState(false)
  const [modalPdfComparativoAberto, setModalPdfComparativoAberto] = useState(false)
  const [modalExportarDadosAberto, setModalExportarDadosAberto] = useState(false)
  const [modalImportarFaturamentoAberto, setModalImportarFaturamentoAberto] = useState(false)
  // Fonte da base de compras: notas fiscais reais (notas_fiscais) vs estimativa interna.
  // Persistida em localStorage para sobreviver a salvar → recarregar (mesma sessão do usuário).
  const [fonteComprasNotasReais, setFonteComprasNotasReais] =
    useState<ResumoComprasNotasReais | null>(() => {
      try {
        const raw = localStorage.getItem('c50_fonte_compras_notas_reais')
        return raw ? (JSON.parse(raw) as ResumoComprasNotasReais) : null
      } catch {
        return null
      }
    })

  React.useEffect(() => {
    try {
      if (fonteComprasNotasReais) {
        localStorage.setItem(
          'c50_fonte_compras_notas_reais',
          JSON.stringify(fonteComprasNotasReais),
        )
      } else {
        localStorage.removeItem('c50_fonte_compras_notas_reais')
      }
    } catch {
      // localStorage indisponível: o indicador apenas não persiste
    }
  }, [fonteComprasNotasReais])
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

  // Leitura dos parâmetros temporários do Radar de Alertas (?aplicar=&aliquota=&ano=)
  // Depende de funções estáveis do provider (useCallback) — o efeito não roda a cada render.
  const aplicarAliquotaRadarTemporariaRef = useRef(aplicarAliquotaRadarTemporaria)
  const limparParametroRadarTemporarioRef = useRef(limparParametroRadarTemporario)
  const toastRef = useRef(toast)
  React.useEffect(() => {
    aplicarAliquotaRadarTemporariaRef.current = aplicarAliquotaRadarTemporaria
    limparParametroRadarTemporarioRef.current = limparParametroRadarTemporario
    toastRef.current = toast
  })

  React.useEffect(() => {
    const aplicar = searchParams.get('aplicar')
    const aliquotaRaw = searchParams.get('aliquota')
    const anoRaw = searchParams.get('ano')

    if (aplicar || aliquotaRaw) {
      const aliqNum = parseFloat(String(aliquotaRaw || '11.3468').replace(',', '.'))
      const anoNum = parseInt(String(anoRaw || '2027'), 10) || 2027
      const aplicarTipo = String(aplicar || 'cbs').toLowerCase()

      aplicarAliquotaRadarTemporariaRef.current(aplicarTipo, aliqNum, anoNum)

      toastRef.current({
        title: 'Alíquota do Radar Aplicada',
        description: `Alíquota temporária de ${aliqNum.toFixed(4).replace('.', ',')}% (${aplicarTipo.toUpperCase()}) aplicada para o ano ${anoNum}.`,
      })
    }
  }, [searchParams])

  // Cleanup ao desmontar a página: restaura automaticamente os valores oficiais da LC 214/2025.
  // Array de dependências vazio + ref: a cleanup roda SOMENTE na desmontagem real da página,
  // nunca a cada render (causa raiz do "Maximum update depth exceeded").
  React.useEffect(() => {
    return () => {
      limparParametroRadarTemporarioRef.current()
    }
  }, [])

  const handleDescartarAliquotaRadar = () => {
    limparParametroRadarTemporario()
    // Remove os parâmetros da URL sem recarregar
    const novosParams = new URLSearchParams(searchParams)
    novosParams.delete('aplicar')
    novosParams.delete('aliquota')
    novosParams.delete('ano')
    setSearchParams(novosParams, { replace: true })
    toast({
      title: 'Alíquota Oficial Restaurada',
      description: 'Valores oficiais da LC 214/2025 foram restabelecidos na Calculadora.',
    })
  }

  React.useEffect(() => {
    const rawParam = searchParams.get('simulacao')
    if (rawParam) {
      // 1. Tenta carregar por ID salvo (da nuvem ou local)
      const tentarPorId = async (id: string) => {
        try {
          const { obterSimulacaoPorId } = await import('@/services/simulacoesCalculadora')
          const encontrada = await obterSimulacaoPorId(id)
          if (encontrada && encontrada.parametros) {
            handleCarregarSimulacao(encontrada)
            setSimulacaoCarregadaViaLink(true)
            setEmpresaLink(encontrada.empresa || encontrada.nome)
            return true
          }
        } catch {
          /* ignorado */
        }
        return false
      }

      tentarPorId(rawParam).then((sucesso) => {
        if (!sucesso) {
          // 2. Se não for ID, tenta decodificar parâmetros direto da URL (link compartilhado base64)
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
              // Cenário compartilhado substitui os parâmetros: a fonte volta a ser a estimativa
              setFonteComprasNotasReais(null)
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
      })
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
      // Cenário restaurado substitui os parâmetros: a fonte volta a ser a estimativa interna
      setFonteComprasNotasReais(null)
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

  // "Usar notas fiscais reais": ajusta a base de compras da simulação atual pelos valores
  // importados em /dados-empresa, pelo MESMO caminho do ModalImportarFaturamento
  // (restaurarSimulacao com snapshot + updates). Nenhuma fórmula fiscal é alterada.
  const aplicarNotasFiscaisReais = (resumo: ResumoComprasNotasReais) => {
    const params = obterSnapshotParametros()
    const faturamento = params.faturamentoMensal ?? 0
    if (faturamento <= 0) {
      // Sem faturamento informado não há como derivar a base de compras: nada é alterado
      // e a fonte continua marcada como estimada (aviso permanece apenas informativo).
      toast({
        title: 'Informe o faturamento mensal primeiro',
        description: `As notas importadas somam ${resumo.comprasMensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês em compras, mas o faturamento mensal está em zero — preencha-o no Módulo 3 para calcular o percentual.`,
        variant: 'destructive',
      })
      return
    }

    const pctCalculado = Math.min(100, Math.round((resumo.comprasMensal / faturamento) * 100))

    restaurarSimulacao({
      ...params,
      percentualComprasVendasComparativo: pctCalculado,
      percentualComprasVendasSimples: pctCalculado,
      percentualComprasVendas: pctCalculado,
      config: {
        ...params.config,
        percentualComprasVendas: pctCalculado,
      },
    })

    setFonteComprasNotasReais(resumo)
    toast({
      title: 'Notas fiscais reais aplicadas!',
      description: `Base de compras ajustada para ${pctCalculado}% do faturamento (${resumo.quantidadeNotas} nota(s), média ${resumo.comprasMensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês).`,
    })
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
        empresa: clienteAtivo ? clienteAtivo.nome : params.empresa,
        cnpj: clienteAtivo ? clienteAtivo.cnpj_cpf : params.cnpj,
        clienteNome: clienteAtivo ? clienteAtivo.nome : undefined,
        responsavelTecnico: dadosTecnico,
        observacoesContador: dadosTecnico.observacoes,
      })

      toast({
        title: 'Relatório PDF gerado!',
        description: 'O download com os resultados dos 6 módulos foi iniciado com sucesso.',
      })
      setModalPdfAtualAberto(false)

      // Ao concluir a análise com emissão do relatório PDF, reverte os dados locais para o cadastro mestre
      restaurarDadosEmpresaNoModulo(2)
      restaurarDadosEmpresaNoModulo(3)
      restaurarDadosEmpresaNoModulo(4)
      restaurarDadosEmpresaNoModulo(5)
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
        clienteNome: clienteAtivo ? clienteAtivo.nome : undefined,
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
        subtitulo="Simulador completo da Reforma Tributária (EC 132/2023 e LC 214/2025) em 6 módulos integrados: alíquotas do IVA Dual, apuração unitária, comparativo de regimes, créditos, cronograma 2026–2033 e dashboard executivo."
        mostrarVoltar={true}
        mostrarDiagnosticoBtn={false}
      />

      {/* SELETOR CLIENTE ATIVO NO TOPO DA CALCULADORA */}
      <div className="bg-[#07132B] border-b border-[#D4AF37]/20 py-2.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <SeletorClienteAtivo labelCustomizado="Carteira • Cliente Ativo na Calculadora:" />
        </div>
      </div>

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
            {/* BOTÕES DE AÇÃO RÁPIDA: IMPORTAR FATURAMENTO, EXPORTAR DADOS, SALVAR, COMPARTILHAR E BAIXAR PDF */}
            <div className="flex flex-wrap items-center gap-2 ml-auto">
              <FreemiumBadge tipo="simulacao" />
              <button
                type="button"
                onClick={() => setModalImportarFaturamentoAberto(true)}
                className="px-3 py-1 rounded-lg bg-[#07132B] hover:bg-[#122347] text-[#D4AF37] border border-[#D4AF37] font-extrabold transition-all shadow-sm cursor-pointer"
                title="Importar receita a partir de planilha CSV/XLSX ou Google Sheets"
              >
                <span>Importar faturamento</span>
              </button>
              <button
                type="button"
                onClick={() => setModalExportarDadosAberto(true)}
                className="px-3 py-1 rounded-lg bg-[#07132B] hover:bg-[#122347] text-white border border-[#D4AF37] font-extrabold transition-all shadow-sm cursor-pointer"
                title="Exportar planilha (CSV/Excel) e dados da simulação atual"
              >
                <span>Exportar dados</span>
              </button>{' '}
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

      {/* BANNER INFORMATIVO: ALÍQUOTA APLICADA DO RADAR TRIBUTÁRIO */}
      {parametroRadarTemporario && (
        <div className="bg-gradient-to-r from-[#07132B] via-[#0D1D3A] to-[#07132B] text-white border-b-2 border-[#D4AF37] py-3 px-4 sm:px-6 shadow-md animate-fade-in">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start sm:items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-pulse shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-[#D4AF37] uppercase tracking-wider text-[11px]">
                    Radar Tributário Ativo
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                    {parametroRadarTemporario.aplicar.toUpperCase()}:{' '}
                    {parametroRadarTemporario.aliquota.toFixed(4).replace('.', ',')}% (Fase{' '}
                    {parametroRadarTemporario.ano})
                  </span>
                </div>
                <p className="text-slate-200 text-xs mt-0.5 font-medium">
                  Alíquota aplicada do Radar Tributário: referência TCU (proposta) — editável. O
                  valor oficial da LC 214/2025 permanece intacto.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleDescartarAliquotaRadar}
                className="px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#c49f2e] text-[#07132B] font-extrabold text-xs transition-colors shadow-sm cursor-pointer"
                title="Descartar e restaurar a alíquota oficial imediatamente"
              >
                Restaurar Alíquota Oficial LC 214
              </button>
            </div>
          </div>
        </div>
      )}

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
              className="relative p-3 rounded-xl bg-gradient-to-br from-[#07132B] via-[#0E2442] to-[#14345C] text-white flex items-center gap-3 hover:from-[#0D1D3A] hover:via-[#14345C] hover:to-[#1a3f70] border-2 border-[#D4AF37] shadow-lg shadow-[#07132B]/20 transition-all hover:scale-[1.01] active:scale-[0.99] group ring-2 ring-[#D4AF37]/30"
              title="Acessar e calibrar os Dados da Empresa (Fonte Mestra)"
            >
              {/* ÍCONE COM PONTO PULSANTE */}
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#F3E5AB] via-[#D4AF37] to-[#AA820A] text-[#07132B] flex items-center justify-center font-bold shadow-md group-hover:scale-105 transition-transform">
                  <Building2 className="w-5 h-5 text-[#07132B] shrink-0" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 pointer-events-none">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#D4AF37]" />
                </span>
              </div>

              {/* TEXTO E BADGE */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black tracking-wide text-white group-hover:text-[#F3E5AB] transition-colors truncate">
                    Dados da Empresa
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#D4AF37] text-[#07132B] shrink-0 shadow-xs leading-none">
                    Fonte Mestra
                  </span>
                </div>
                <span className="text-[11px] text-[#D4AF37] font-semibold block truncate mt-0.5">
                  Base cadastral e fiscal
                </span>
              </div>

              {/* SETA DE AÇÃO */}
              <div className="w-6 h-6 rounded-md bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center shrink-0 group-hover:bg-[#D4AF37] group-hover:text-[#07132B] transition-colors">
                <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37] group-hover:text-[#07132B] group-hover:translate-x-0.5 transition-transform" />
              </div>
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
            {moduloAtivo === 'modulo1' && (
              <Modulo1Configuracoes
                onNavegarModulo={(id) => setModuloAtivo(id)}
                avisoNotasFiscais={
                  <AvisoNotasFiscaisReais
                    fonteAplicada={fonteComprasNotasReais}
                    onAplicar={aplicarNotasFiscaisReais}
                    onRemover={() => setFonteComprasNotasReais(null)}
                  />
                }
              />
            )}
            {moduloAtivo === 'modulo2' && (
              <Modulo2CalculadoraSimples
                onNavegarModulo={(id) => setModuloAtivo(id)}
                onSalvarSimulacao={handleTentarSalvarSimulacao}
                onBaixarPdf={handleBaixarPdfAtual}
                onExportarDados={() => setModalExportarDadosAberto(true)}
                onImportarFaturamento={() => setModalImportarFaturamentoAberto(true)}
                gerandoPdf={gerandoPdf}
                avisoNotasFiscais={
                  <AvisoNotasFiscaisReais
                    fonteAplicada={fonteComprasNotasReais}
                    onAplicar={aplicarNotasFiscaisReais}
                    onRemover={() => setFonteComprasNotasReais(null)}
                  />
                }
              />
            )}
            {moduloAtivo === 'modulo3' && (
              <Modulo3ComparativoRegimes
                onNavegarModulo={(id) => setModuloAtivo(id)}
                onSalvarSimulacao={handleTentarSalvarSimulacao}
                onBaixarPdf={handleBaixarPdfAtual}
                onExportarDados={() => setModalExportarDadosAberto(true)}
                gerandoPdf={gerandoPdf}
              />
            )}
            {moduloAtivo === 'modulo4' && (
              <Modulo4SimuladorCreditos
                onNavegarModulo={(id) => setModuloAtivo(id)}
                onSalvarSimulacao={handleTentarSalvarSimulacao}
                onBaixarPdf={handleBaixarPdfAtual}
                onExportarDados={() => setModalExportarDadosAberto(true)}
                gerandoPdf={gerandoPdf}
              />
            )}
            {moduloAtivo === 'modulo5' && (
              <Modulo5TransicaoCronograma
                onNavegarModulo={(id) => setModuloAtivo(id)}
                onSalvarSimulacao={handleTentarSalvarSimulacao}
                onBaixarPdf={handleBaixarPdfAtual}
                onExportarDados={() => setModalExportarDadosAberto(true)}
                gerandoPdf={gerandoPdf}
              />
            )}
            {moduloAtivo === 'modulo6' && (
              <Modulo6Dashboard
                simulacoesComparar={simulacoesParaComparar}
                onAbrirPdfComparativo={() => setModalPdfComparativoAberto(true)}
                onNavegarModulo={(id) => setModuloAtivo(id)}
                onSalvarSimulacao={handleTentarSalvarSimulacao}
                onBaixarPdf={handleBaixarPdfAtual}
                onExportarDados={() => setModalExportarDadosAberto(true)}
                onImportarFaturamento={() => setModalImportarFaturamentoAberto(true)}
                gerandoPdf={gerandoPdf}
              />
            )}
            {moduloAtivo === 'desoneracao' && (
              <ModuloDesoneracao
                onNavegarModulo={(id) => setModuloAtivo(id)}
                onSalvarSimulacao={handleTentarSalvarSimulacao}
                onBaixarPdf={handleBaixarPdfAtual}
                onExportarDados={() => setModalExportarDadosAberto(true)}
                gerandoPdf={gerandoPdf}
              />
            )}

            {/* AVISO LEGAL E PREMISSAS */}
            <div className="mt-12 p-5 rounded-2xl bg-slate-100/80 border border-slate-200 text-slate-600 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#07132B] text-sm">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                Aviso Legal e Premissas de Simulação
              </div>
              <div className="space-y-1.5 text-xs text-slate-600 leading-relaxed">
                <p>
                  • Estimativas técnicas fundamentadas na EC nº 132/2023, na LC nº 214/2025 e na
                  alíquota de referência de 26,50% do Ministério da Fazenda.
                </p>
                <p>
                  • As alíquotas finais dependem de fixação pelo Comitê Gestor do IBS e Senado
                  Federal durante a transição 2026–2033.
                </p>
                <p className="text-slate-500">
                  • Ferramenta com finalidade analítica e consultiva; não substitui o planejamento
                  contábil individualizado.
                </p>
              </div>
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

      {/* MODAL EXPORTAR DADOS DA SIMULAÇÃO ATUAL */}
      <ModalExportarDadosSimulacao
        open={modalExportarDadosAberto}
        onOpenChange={setModalExportarDadosAberto}
        dadosSimulacao={{
          nomeSimulacao: 'Simulação Atual em Tela',
          empresa: clienteAtivo?.nome,
          cnpj: clienteAtivo?.cnpj_cpf,
          parametros: obterSnapshotParametros(),
          resultados: obterSnapshotResultados(),
        }}
      />

      {/* MODAL IMPORTAR FATURAMENTO DA SIMULAÇÃO ATUAL */}
      <ModalImportarFaturamento
        open={modalImportarFaturamentoAberto}
        onOpenChange={setModalImportarFaturamentoAberto}
        onConfirmarImportacao={(dados: DadosFaturamentoImportados) => {
          const params = obterSnapshotParametros()
          const pctCalculado =
            dados.comprasMensal !== undefined && dados.faturamentoMensal > 0
              ? Math.min(100, Math.round((dados.comprasMensal / dados.faturamentoMensal) * 100))
              : undefined

          const updates: Partial<typeof params> = {
            faturamentoMensal: dados.faturamentoMensal,
            ...(pctCalculado !== undefined
              ? {
                  percentualComprasVendasComparativo: pctCalculado,
                  percentualComprasVendasSimples: pctCalculado,
                  percentualComprasVendas: pctCalculado,
                  config: {
                    ...params.config,
                    faturamentoMensal: dados.faturamentoMensal,
                    percentualComprasVendas: pctCalculado,
                  },
                }
              : {
                  config: {
                    ...params.config,
                    faturamentoMensal: dados.faturamentoMensal,
                  },
                }),
          }

          restaurarSimulacao({
            ...params,
            ...updates,
          })
        }}
        valoresAtuais={{
          faturamentoMensal: obterSnapshotParametros().faturamentoMensal ?? 0,
          comprasMensal:
            (obterSnapshotParametros().faturamentoMensal ?? 0) *
            ((obterSnapshotParametros().percentualComprasVendasComparativo ??
              obterSnapshotParametros().percentualComprasVendas ??
              obterSnapshotParametros().config?.percentualComprasVendas ??
              0) /
              100),
        }}
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
