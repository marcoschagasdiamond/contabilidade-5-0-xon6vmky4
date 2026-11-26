import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from 'react'
import {
  ConfiguracoesGerais,
  CONFIGURACOES_PADRAO,
  RegimeDiferenciadoTipo,
  TipoAtividade,
  TipoAtividadePrincipal,
  normalizarTipoAtividade,
  CategoriaDespesaCredito,
  CATEGORIAS_CREDITO_PADRAO,
  SubatividadeServico,
  SubatividadeIndustria,
  SubatividadeComercio,
  SubatividadeAgronegocio,
  SubatividadeConstrucao,
  SubatividadeLocacao,
  SubatividadeFoodService,
  SUBATIVIDADES_SERVICO,
  SUBATIVIDADES_INDUSTRIA,
  SUBATIVIDADES_COMERCIO,
  SUBATIVIDADES_AGRONEGOCIO,
  SUBATIVIDADES_CONSTRUCAO,
  SUBATIVIDADES_LOCACAO,
  SUBATIVIDADES_FOOD_SERVICE,
  InfoSubatividade,
  AnoTransicaoIbsCbs,
  PresetSetorIbsCbs,
  OrigemCamposAliquota,
  GrupoPresetSetor,
  CRONOGRAMA_FASES_TRANSICAO,
  PRESETS_SETORES_LC214,
  obterGrupoRegimeOperacao,
  obterFaseTransicaoPorAno,
  LISTA_ANOS_TRANSICAO,
  TEXTO_FASE_TESTE_2026,
  isAno2026,
  isAno2026OuAtual,
  isAnoPosTransicao,
} from '@/types/calculadoraIbsCbs'

export { TEXTO_FASE_TESTE_2026, isAno2026, isAno2026OuAtual }
import { TABELAS_SIMPLES } from '@/lib/regimes'
import {
  calcularIbsCbsSimplesNacional,
  type ResultadoCalculoSimplesReforma,
  type AnoBaseSimulacao,
} from '@/lib/reformaTributaria'
import {
  obterAliquotasCreditoPorAno,
  obterAliquotaSimplesMediaEfectivaEm,
} from '@/lib/aliquotaSimplesMediaConfig'
import {
  carregarDadosEmpresa,
  salvarDadosEmpresa,
  existeDadosEmpresaSalvos,
  limparDadosEmpresa,
  DadosEmpresaPerfil,
  DADOS_EMPRESA_PADRAO,
  STORAGE_EVENT,
} from '@/types/dadosEmpresa'
import { FONTE_MESTRA_EVENTO } from '@/lib/fonteMestra'
import { useAuth } from '@/context/AuthContext'
import type {
  ParametrosSimulacaoCalculadora,
  ResultadosSimulacaoCalculadora,
} from '@/types/simulacaoCalculadora'
import {
  listarParametrosTributarios,
  listarNotificacoesTributarias,
  ParametroTributario,
  NotificacaoTributaria,
} from '@/services/radarTributario'
import {
  montarPayloadConfiguracoes,
  salvarConfiguracaoCalculadora,
  carregarConfiguracaoCalculadora,
  carregarConfiguracaoLocal,
  salvarConfiguracaoLocal,
  excluirConfiguracaoCalculadora,
  type PayloadConfiguracoesCalculadora,
} from '@/services/configuracoesCalculadora'
import { toast } from '@/hooks/use-toast'

// ============================================================
// Rascunho persistido da Calculadora IBS/CBS
// Sobrevive à navegação entre menus (o provider monta dentro da
// página e o estado em memória morre a cada rota). Guarda SOMENTE
// os campos de override local que, por design, não entram nos
// Dados da Empresa: preset/setor, alíquotas derivadas do preset,
// Regime Aplicado do Módulo 2 e os parâmetros da Fase 2.
// Nenhum cálculo é alterado: o rascunho apenas repõe o estado
// que o usuário deixou na última visita.
// ============================================================
const CHAVE_RASCUNHO_CALCULADORA = 'contabilidade50_rascunho_calculadora_v1'

interface RascunhoModulo2 {
  valorOperacao: number
  regimeOperacao: RegimeDiferenciadoTipo
  anoOperacao: AnoTransicaoIbsCbs
  percentualComprasVendasSimples: number
  // Espelho das flags de edição manual na hora da gravação: na restauração,
  // um campo que o usuário editou não é reapontado pela propagação do Módulo 1
  // (o restore do autosave das Configurações usa updateConfig, que propaga).
  editado: {
    valorOperacao: boolean
    regimeOperacao: boolean
    anoOperacao: boolean
    percentualCompras: boolean
  }
}

interface RascunhoModulo3 {
  faturamentoMensal: number
  tipoAtividade: TipoAtividade
  // Subatividade ativa por ramo (a ativa é a do tipoAtividade selecionado)
  subatividadeServico: SubatividadeServico
  subatividadeIndustria: SubatividadeIndustria
  subatividadeComercio: SubatividadeComercio
  subatividadeAgro: SubatividadeAgronegocio
  subatividadeConstrucao: SubatividadeConstrucao
  subatividadeLocacao: SubatividadeLocacao
  subatividadeFoodService: SubatividadeFoodService
  aliquotaImpostoSeletivo: number
  proporcaoServicoMisto: number
  percentualComprasVendasComparativo: number
  folhaPagamentoMensal: number
  margemLucroEstimada: number
  despesasComCreditosMensais: number
  percentualExportacao: number
  ufOrigem: string
  editado: {
    faturamento: boolean
    percentualCompras: boolean
    tipoAtividade: boolean
  }
}

interface RascunhoModulo4 {
  despesasCreditos: CategoriaDespesaCredito[]
}

interface RascunhoModulo5 {
  faturamentoAnualProjetado: number
  setorTransicao: TipoAtividade
  valorEstoqueVirada: number
  editado: {
    faturamento: boolean
    setor: boolean
  }
}

interface RascunhoCalculadora {
  identidade: {
    usuarioId: string
    cnpj: string
    nomeEmpresa: string
  }
  presetSetor: PresetSetorIbsCbs
  regimeOperacao: RegimeDiferenciadoTipo
  saudeEducacaoAliquota: number
  transporteAliquota: number
  cestaBasicaIsencao: number
  percentualComprasSemCredito: number
  saldoCredorAcumulado: number
  percentualVendasInterestaduais: number
  regimeEspecialAtual: import('@/types/dadosEmpresa').RegimeEspecialAtual
  perfilRetencaoSplit: import('@/types/dadosEmpresa').PerfilRetencaoSplit
  percentualRetencaoSplit: number
  etiquetasOrigem?: import('@/types/calculadoraIbsCbs').OrigemCamposAliquota
  // Ajuste da alíquota média do Simples (Módulo 1) — opcional (payloads antigos não o têm)
  ajusteAliquotaSimplesMedia?: import('@/lib/aliquotaSimplesMediaConfig').AjusteAliquotaSimplesMedia
  // Módulos 2 a 5: rascunhos opcionais (payloads antigos não os têm)
  modulo2?: RascunhoModulo2
  modulo3?: RascunhoModulo3
  modulo4?: RascunhoModulo4
  modulo5?: RascunhoModulo5
  salvoEm: string
}

function carregarRascunhoCalculadora(
  usuarioId: string,
  perfil: DadosEmpresaPerfil,
): RascunhoCalculadora | null {
  try {
    const raw = localStorage.getItem(CHAVE_RASCUNHO_CALCULADORA)
    if (!raw) return null
    const r = JSON.parse(raw) as RascunhoCalculadora
    if (!r || !r.identidade) return null
    // Só restaura para o MESMO usuário: troca de usuário => descarta.
    // A empresa (cnpj/nome) NÃO é mais critério de descarte: uma correção no
    // cadastro (ex.: CNPJ consertado em /dados-empresa) não pode apagar as
    // seleções que o usuário deixou na última visita. `perfil` permanece na
    // assinatura por compatibilidade com os chamadores.
    if (r.identidade.usuarioId !== usuarioId) return null
    return r
  } catch {
    return null
  }
}

interface CalculadoraContextType {
  // Módulo 1 - Configurações Gerais
  config: ConfiguracoesGerais
  updateConfig: (novas: Partial<ConfiguracoesGerais>) => void
  resetConfig: () => void
  aplicarAnoTransicao: (ano: AnoTransicaoIbsCbs) => void
  aplicarPresetSetor: (preset: PresetSetorIbsCbs) => void
  limparEtiquetaOrigem: (campo: keyof OrigemCamposAliquota) => void

  // Módulo 2 - Calculadora Simples
  valorOperacao: number
  setValorOperacao: (v: number) => void
  regimeOperacao: RegimeDiferenciadoTipo
  setRegimeOperacao: (r: RegimeDiferenciadoTipo) => void
  anoOperacao: AnoTransicaoIbsCbs
  setAnoOperacao: (ano: AnoTransicaoIbsCbs) => void
  percentualComprasVendasSimples: number
  setPercentualComprasVendasSimples: (p: number) => void

  // Módulo 3 - Comparativo por Regime
  faturamentoMensal: number
  setFaturamentoMensal: (v: number) => void
  tipoAtividade: TipoAtividade
  setTipoAtividade: (t: TipoAtividade) => void
  // Subatividades por ramo
  subatividadeServico: SubatividadeServico
  setSubatividadeServico: (s: SubatividadeServico) => void
  subatividadeIndustria: SubatividadeIndustria
  setSubatividadeIndustria: (s: SubatividadeIndustria) => void
  subatividadeComercio: SubatividadeComercio
  setSubatividadeComercio: (s: SubatividadeComercio) => void
  subatividadeAgro: SubatividadeAgronegocio
  setSubatividadeAgro: (s: SubatividadeAgronegocio) => void
  subatividadeConstrucao: SubatividadeConstrucao
  setSubatividadeConstrucao: (s: SubatividadeConstrucao) => void
  subatividadeLocacao: SubatividadeLocacao
  setSubatividadeLocacao: (s: SubatividadeLocacao) => void
  subatividadeFoodService: SubatividadeFoodService
  setSubatividadeFoodService: (s: SubatividadeFoodService) => void
  // Alíquota de Imposto Seletivo customizada (padrão 10%)
  aliquotaImpostoSeletivo: number
  setAliquotaImpostoSeletivo: (v: number) => void
  proporcaoServicoMisto: number // % serviço no misto (restante comércio)
  setProporcaoServicoMisto: (p: number) => void
  percentualComprasVendasComparativo: number
  setPercentualComprasVendasComparativo: (p: number) => void
  // Novos campos do Módulo 3
  folhaPagamentoMensal: number
  setFolhaPagamentoMensal: (v: number) => void
  margemLucroEstimada: number
  setMargemLucroEstimada: (v: number) => void
  despesasComCreditosMensais: number
  setDespesasComCreditosMensais: (v: number) => void
  percentualExportacao: number
  setPercentualExportacao: (v: number) => void
  ufOrigem: string
  setUfOrigem: (v: string) => void

  // Módulo 4 - Simulador de Créditos
  despesasCreditos: CategoriaDespesaCredito[]
  updateDespesaCredito: (id: string, updates: Partial<CategoriaDespesaCredito>) => void
  resetDespesasCreditos: () => void

  // Módulo 5 - Transição 2026 a 2033
  faturamentoAnualProjetado: number
  setFaturamentoAnualProjetado: (v: number) => void
  setorTransicao: TipoAtividade
  setSetorTransicao: (s: TipoAtividade) => void
  valorEstoqueVirada: number
  setValorEstoqueVirada: (v: number) => void

  // Etapa 4 - Split Payment
  taxaMensalCapitalGiro: number
  setTaxaMensalCapitalGiro: (v: number) => void
  diasAntecipacaoSplit: number
  setDiasAntecipacaoSplit: (v: number) => void

  // Módulo 6 - Filtros Dashboard
  periodoDashboard: 'mensal' | 'anual'
  setPeriodoDashboard: (p: 'mensal' | 'anual') => void
  regimeAtualFiltro: 'Lucro Real' | 'Lucro Presumido' | 'Simples Nacional'
  setRegimeAtualFiltro: (r: 'Lucro Real' | 'Lucro Presumido' | 'Simples Nacional') => void
  anoTransicaoDashboard: AnoTransicaoIbsCbs
  setAnoTransicaoDashboard: (ano: AnoTransicaoIbsCbs) => void

  // Parâmetros Fiscais Avançados (Fase 2) - Override local da Calculadora
  percentualComprasSemCredito: number
  setPercentualComprasSemCredito: (v: number) => void
  saldoCredorAcumulado: number
  setSaldoCredorAcumulado: (v: number) => void
  percentualVendasInterestaduais: number
  setPercentualVendasInterestaduais: (v: number) => void
  regimeEspecialAtual: import('@/types/dadosEmpresa').RegimeEspecialAtual
  setRegimeEspecialAtual: (r: import('@/types/dadosEmpresa').RegimeEspecialAtual) => void
  perfilRetencaoSplit: import('@/types/dadosEmpresa').PerfilRetencaoSplit
  setPerfilRetencaoSplit: (p: import('@/types/dadosEmpresa').PerfilRetencaoSplit) => void
  percentualRetencaoSplit: number
  setPercentualRetencaoSplit: (v: number) => void

  // Integração Dados da Empresa
  origemDadosEmpresa: boolean
  restaurarDadosEmpresaNoModulo: (modulo: 1 | 2 | 3 | 4 | 5 | 'split') => void

  // Composição detalhada por Itens / NCM (Fase 3)
  itensComposicao: import('@/lib/ncmCalculadora').ItemComposicaoCalculadora[]
  setItensComposicao: (
    itens:
      | import('@/lib/ncmCalculadora').ItemComposicaoCalculadora[]
      | ((
          prev: import('@/lib/ncmCalculadora').ItemComposicaoCalculadora[],
        ) => import('@/lib/ncmCalculadora').ItemComposicaoCalculadora[]),
  ) => void
  adicionarItemComposicao: (
    item: Omit<import('@/lib/ncmCalculadora').ItemComposicaoCalculadora, 'id'>,
  ) => void
  atualizarItemComposicao: (
    id: string,
    updates: Partial<import('@/lib/ncmCalculadora').ItemComposicaoCalculadora>,
  ) => void
  removerItemComposicao: (id: string) => void
  limparItensComposicao: () => void

  // Flags de controle de edição manual local nos módulos downstream
  editadoLocalmente: {
    modulo2AnoOperacao: boolean
    modulo2RegimeOperacao: boolean
    modulo2ValorOperacao: boolean
    modulo2PercentualCompras: boolean
    modulo3Faturamento: boolean
    modulo3PercentualCompras: boolean
    modulo3TipoAtividade: boolean
    modulo4Categorias: boolean
    modulo5Faturamento: boolean
    modulo5SetorTransicao: boolean
    dashboardRegimeAtual: boolean
    dashboardAnoTransicao: boolean
    dashboardSetor: boolean
    dashboardFaturamento: boolean
    dashboardPercentualCompras: boolean
    fase2Parametros: boolean
  }

  // Rastreamento de origem de campos propagados automaticamente do Módulo 1
  origensPropagadas: {
    modulo2AnoOperacao: boolean
    modulo2RegimeOperacao: boolean
    modulo2ValorOperacao: boolean
    modulo2PercentualCompras: boolean
    modulo3Faturamento: boolean
    modulo3PercentualCompras: boolean
    modulo3TipoAtividade: boolean
    modulo4Categorias: boolean
    modulo5Faturamento: boolean
    modulo5SetorTransicao: boolean
    dashboardRegimeAtual: boolean
    dashboardAnoTransicao: boolean
    dashboardSetor: boolean
    dashboardFaturamento: boolean
    dashboardPercentualCompras: boolean
  }

  // Limpeza Completa do Dashboard
  limparDashboard: () => void

  // Salvar / Restaurar Simulação Completa
  obterSnapshotParametros: () => ParametrosSimulacaoCalculadora
  obterSnapshotResultados: () => ResultadosSimulacaoCalculadora
  restaurarSimulacao: (parametros: ParametrosSimulacaoCalculadora) => void

  // Resultados calculados derivados
  resultadoSimples: {
    aliquotaCbsAplicada: number
    aliquotaIbsAplicada: number
    aliquotaTotalAplicada: number
    debitoCbs: number
    debitoIbs: number
    totalDebito: number
    valorCreditos: number
    valorARecolher: number
    aliquotaEfetiva: number
    valorTotalNotaFiscal: number
    anoOperacao: AnoTransicaoIbsCbs
    etiquetaLegalExibida: string
  }

  resultadoComparativo: {
    lucroReal: {
      pisOuCbs: number
      cofinsOuIbs: number
      ipiOuIcmsOuIss: number
      totalNominal: number
      creditos: number
      totalEfetivo: number
      aliquotaEfetiva: number
      detalheImpostos: string
    }
    lucroPresumido: {
      pisOuCbs: number
      cofinsOuIbs: number
      ipiOuIcmsOuIss: number
      totalNominal: number
      creditos: number
      totalEfetivo: number
      aliquotaEfetiva: number
      detalheImpostos: string
    }
    simplesNacional: {
      pisOuCbs: number
      cofinsOuIbs: number
      ipiOuIcmsOuIss: number
      totalNominal: number
      creditos: number
      totalEfetivo: number
      aliquotaEfetiva: number
      detalheImpostos: string
      faixaEncontrada: string
      fatorR: number
      anexoUtilizado: string
    }
    ibsCbs: {
      pisOuCbs: number // CBS
      cofinsOuIbs: number // IBS
      ipiOuIcmsOuIss: number // 0 (ou Imposto Seletivo se aplicável)
      impostoSeletivo: number
      totalNominal: number
      creditos: number
      totalEfetivo: number
      aliquotaEfetiva: number
      detalheImpostos: string
      reducaoAplicadaPercentual: number
    }
    // Ramo do Simples Nacional na Reforma Tributária (LC 214/2025)
    simplesReforma?: {
      dasAtualTotal: number
      aliquotaEfetivaAtual: number
      cbsNoDas: number
      aliquotaEfetivaCbsNoDas: number
      ibsPorFora: number
      aliquotaEfetivaIbsPorFora: number
      dasBaseRemanescente: number
      cenarioTransicaoTotal: number
      aliquotaEfetivaTransicao: number
      diferencaMensal: number
      economiaMensal: number
      economiaAnual: number
      variacaoPercentual: number
      rotuloCenarioAtual: string
      rotuloCbs: string
      rotuloIbs: string
      descricaoFase: string
      ano?: string | number
    }
    regimeMaisVantajoso: string
    piorCenario: string
    economiaVersusPior: number
    economiaPercentual: number
    dadosAdicionais: {
      fatorR: number
      fatorRPercent: number
      fatorRQualificaAnexoIII: boolean
      margemLucroEfetiva: number
      creditosDespesasReal: number
      creditosDespesasIbsCbs: number
      aliquotaIcmsAplicada: number
      origemIcms: string
      receitaExportacaoIsenta: number
      receitaTributavelInterna: number
      subatividadeAtivaNome: string
      presuncaoIrpjAplicada: number
      presuncaoCsllAplicada: number
      irpjCsllPresumidoEstimado: number
      irpjCsllRealEstimado: number
      sujeitoImpostoSeletivo: boolean
      isIcmsSubstituicaoTributaria: boolean
      impactosDidaticosSubatividade: string[]
    }
  }

  resultadoCreditos: {
    totalAntigo: number
    totalNovo: number
    adicionalGanho: number
    aumentoPercentual: number
    economiaAnual: number
    anoOperacao: AnoTransicaoIbsCbs
    aliquotaReferencia: number
    regimeOperacao: RegimeDiferenciadoTipo
    grupoRegime: GrupoPresetSetor
    isAliquotaZero: boolean
  }

  resultadoTransicao: Array<{
    ano: number | 'atual'
    fase: string
    aliquotaCbs: number
    aliquotaIbs: number
    statusIcms: string
    statusIss: string
    statusIpi: string
    statusPisCofins: string
    impostoEstimado: number
    aliquotaEfetivaTotal: number
    impostoCenarioAtual: number
    diferencaAno: number
    creditoEstoqueAno: number
    impostoComCreditoEstoque: number
    alertaCritico?: string
  }>

  // Etapa 3: Alertas dos Limites do Simples
  alertaLimitesSimples: {
    faturamentoAnualProjetado: number
    statusTeto: 'verde' | 'amarelo' | 'vermelho'
    statusSublimite: 'verde' | 'amarelo' | 'vermelho'
    tetoMaximo: number // 4.800.000
    sublimiteMaximo: number // 3.600.000
    margemRestanteTeto: number
    margemRestanteSublimite: number
    percentualAtingidoTeto: number
    percentualAtingidoSublimite: number
    mensagemTeto: string
    mensagemSublimite: string
    isHibrido: boolean // Entre 3.6M e 4.8M
    isDesenquadrado: boolean // > 4.8M
  }

  // Etapa 4: Impacto do Split Payment no Fluxo de Caixa
  resultadoSplitPayment: {
    retencaoMensalNota: number // CBS + IBS retidos no ato da nota fiscal
    recolhimentoAtualMensal: number // Guia DAS / DARF recolhida no dia 20 do mês seguinte
    diferencaFluxoCaixa: number
    taxaMensalCapital: number
    diasAntecipacao: number
    custoCapitalMensal: number
    custoCapitalAnual: number
    explicacaoSimples: string
  }

  // Etapa 5: Crédito Presumido de Estoque na Transição
  resultadoEstoque: {
    valorEstoqueVirada: number
    aliquotaCreditoPresumido: number
    creditoTotalEstoque: number
    economiaAno1: number
    explicacaoSimples: string
  }

  resultadoDashboard: {
    aliquotaEfetivaAtual: number
    aliquotaEfetivaNova: number
    economiaMensalProjetada: number
    economiaAnualProjetada: number
    regimeRecomendado: string
  }

  // Radar Tributário (Alíquotas oficiais salvas na coleção parametros_tributarios)
  parametrosRadar: ParametroTributario[]
  parametroCbsAtivo: ParametroTributario | null
  parametroIbsAtivo: ParametroTributario | null
  notificacoesRadar: NotificacaoTributaria[]
  carregandoRadar: boolean
  recarregarParametrosRadar: () => Promise<void>

  // Parâmetro Temporário do Radar de Alertas
  parametroRadarTemporario: { aplicar: string; aliquota: number; ano: number } | null
  aplicarAliquotaRadarTemporaria: (aplicar: string, aliquota: number, ano: number) => void
  limparParametroRadarTemporario: () => void

  // IBS/CBS (integração antecipada, FATIA 2): leitura INERTE dos valores do novo
  // sistema importados em /dados-empresa — disponíveis para uso futuro, sem
  // alterar nenhum cálculo, parâmetro default ou tese.
  ibsCbsImportados: {
    ibsDestacado?: number
    cbsDestacado?: number
    cstCClassTrib?: string
    creditoIbsCbsApurado?: number
    temDados: boolean
  }
}

const CalculadoraContext = createContext<CalculadoraContextType | undefined>(undefined)

export function CalculadoraProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  const usuarioIdAtual = user?.id ?? ''

  // Se deslogado, inicia rigorosamente com o perfil padrão/neutro (sem dados em cache de sessões anteriores)
  const perfilInicial = useMemo(
    () => (isAuthenticated ? carregarDadosEmpresa() : DADOS_EMPRESA_PADRAO),
    [isAuthenticated],
  )
  const [origemDadosEmpresa, setOrigemDadosEmpresa] = useState<boolean>(() =>
    isAuthenticated ? existeDadosEmpresaSalvos() : false,
  )

  // Refs do autosave das Configurações (Módulo 1) — declarados cedo porque
  // resetConfig e limparDashboard também precisam deles.
  const configAutosaveRef = useRef<{
    usuarioId: string
    payload: PayloadConfiguracoesCalculadora
  } | null>(null)
  const configPendenteRef = useRef(false)
  // Reset intencional (resetConfig/limparDashboard): faz o próximo ciclo do
  // efeito de autosave pular a gravação — senão o reset regravaria um autosave
  // com os padrões e recriaria o registro acabado de excluir na nuvem.
  const configPularAutosaveRef = useRef(false)

  // Rascunho da última sessão da calculadora (mesmo usuário + mesma empresa).
  // Lido UMA vez na montagem do provider; restaurado nos estados iniciais abaixo.
  const rascunhoInicial = useMemo(
    () =>
      isAuthenticated && usuarioIdAtual
        ? carregarRascunhoCalculadora(usuarioIdAtual, perfilInicial)
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isAuthenticated, usuarioIdAtual],
  )

  // IBS/CBS (integração antecipada, FATIA 2): leitura INERTE dos valores do novo
  // sistema importados em /dados-empresa. Apenas disponíveis para uso futuro —
  // nenhum cálculo, parâmetro default ou tese é alterado por eles.
  // Sem estado novo: o valor é lido quando o provider monta ou quando a Fonte
  // Mestra é salva (handleSync abaixo reexecuta e o consumer relê via contexto).
  const ibsCbsImportados = useMemo(
    () => ({
      ibsDestacado: perfilInicial.documentoFiscalImportado?.totaisFiscais?.ibsDestacado,
      cbsDestacado: perfilInicial.documentoFiscalImportado?.totaisFiscais?.cbsDestacado,
      cstCClassTrib: perfilInicial.documentoFiscalImportado?.totaisFiscais?.cstCClassTrib,
      creditoIbsCbsApurado:
        perfilInicial.documentoFiscalImportado?.totaisFiscais?.creditoIbsCbsApurado,
      temDados: !!(
        perfilInicial.documentoFiscalImportado?.totaisFiscais?.ibsDestacado ||
        perfilInicial.documentoFiscalImportado?.totaisFiscais?.cbsDestacado ||
        perfilInicial.documentoFiscalImportado?.totaisFiscais?.creditoIbsCbsApurado
      ),
    }),
    [perfilInicial],
  )
  // Exposto para uso futuro sem alterar cálculos (leitura inerte)
  void ibsCbsImportados

  // Radar Tributário: Alíquotas e Notificações lidas da coleção parametros_tributarios
  const [parametrosRadar, setParametrosRadar] = useState<ParametroTributario[]>([])
  const [notificacoesRadar, setNotificacoesRadar] = useState<NotificacaoTributaria[]>([])
  const [carregandoRadar, setCarregandoRadar] = useState<boolean>(true)
  const [parametroRadarTemporario, setParametroRadarTemporario] = useState<{
    aplicar: string
    aliquota: number
    ano: number
  } | null>(null)

  const recarregarParametrosRadar = useCallback(async () => {
    try {
      setCarregandoRadar(true)
      const [params, notifs] = await Promise.all([
        listarParametrosTributarios(),
        listarNotificacoesTributarias(),
      ])
      setParametrosRadar(params)
      setNotificacoesRadar(notifs)
    } catch (err) {
      console.warn('[Radar Context] Erro ao carregar parâmetros tributários:', err)
    } finally {
      setCarregandoRadar(false)
    }
  }, [])

  useEffect(() => {
    recarregarParametrosRadar()
  }, [recarregarParametrosRadar])

  // Parâmetros mais relevantes do Radar para o ano ativo (ex: 2027 CBS de 11,3468%)
  const parametroCbsAtivo = useMemo(() => {
    if (!parametrosRadar || parametrosRadar.length === 0) return null
    // Prioriza o ano selecionado no Dashboard / Módulo 1; se não houver, busca 2027
    const cbsAno = parametrosRadar.find((p) => p.tributo === 'CBS' && p.ano === 2027)
    return cbsAno || parametrosRadar.find((p) => p.tributo === 'CBS') || null
  }, [parametrosRadar])

  const parametroIbsAtivo = useMemo(() => {
    if (!parametrosRadar || parametrosRadar.length === 0) return null
    const ibsAno = parametrosRadar.find((p) => p.tributo === 'IBS' && p.ano === 2027)
    return ibsAno || parametrosRadar.find((p) => p.tributo === 'IBS') || null
  }, [parametrosRadar])

  // Módulo 1: Configurações Gerais
  const [config, setConfig] = useState<ConfiguracoesGerais>(() => {
    let regInicial: 'Lucro Real' | 'Lucro Presumido' | 'Simples Nacional' = 'Lucro Presumido'
    if (perfilInicial.regimeAtual?.includes('Real')) regInicial = 'Lucro Real'
    else if (perfilInicial.regimeAtual?.includes('Simples')) regInicial = 'Simples Nacional'

    const tipoAtividadeInicial = normalizarTipoAtividade(perfilInicial.tipoAtividade)

    return {
      ...CONFIGURACOES_PADRAO,
      // Rascunho da última visita (mesmo usuário + mesma empresa): repõe o preset
      // de setor e os parâmetros da Fase 2 exatamente como o usuário deixou.
      // Apenas repõe estado — nenhum cálculo ou default é alterado.
      ...(rascunhoInicial
        ? {
            presetSetor: rascunhoInicial.presetSetor,
            saudeEducacaoAliquota: rascunhoInicial.saudeEducacaoAliquota,
            transporteAliquota: rascunhoInicial.transporteAliquota,
            cestaBasicaIsencao: rascunhoInicial.cestaBasicaIsencao,
            percentualComprasSemCredito: rascunhoInicial.percentualComprasSemCredito,
            saldoCredorAcumulado: rascunhoInicial.saldoCredorAcumulado,
            percentualVendasInterestaduais: rascunhoInicial.percentualVendasInterestaduais,
            regimeEspecialAtual: rascunhoInicial.regimeEspecialAtual,
            perfilRetencaoSplit: rascunhoInicial.perfilRetencaoSplit,
            percentualRetencaoSplit: rascunhoInicial.percentualRetencaoSplit,
            ajusteAliquotaSimplesMedia: rascunhoInicial.ajusteAliquotaSimplesMedia,
            ...(rascunhoInicial.etiquetasOrigem
              ? { etiquetasOrigem: rascunhoInicial.etiquetasOrigem }
              : {}),
          }
        : {}),
      regimeAtualEmpresa: regInicial,
      faturamentoMensal: perfilInicial.faturamentoMensal || CONFIGURACOES_PADRAO.faturamentoMensal,
      percentualComprasVendas:
        perfilInicial.percentualComprasVendas ?? CONFIGURACOES_PADRAO.percentualComprasVendas,
      porcentagemComprasSimplesNacional:
        perfilInicial.porcentagemComprasSimplesNacional ??
        CONFIGURACOES_PADRAO.porcentagemComprasSimplesNacional,
      tipoAtividade: tipoAtividadeInicial,
      subatividadeServico: perfilInicial.subatividadeServico || 'servico_comum',
      subatividadeIndustria: perfilInicial.subatividadeIndustria || 'industria_comum',
      subatividadeComercio: perfilInicial.subatividadeComercio || 'varejo_comum',
      subatividadeAgro: 'producao_agricola_graos',
      subatividadeConstrucao: 'obras_edificacoes_ret',
      subatividadeLocacao: 'locacao_veiculos_maquinas',
      subatividadeFoodService: 'restaurante_a_la_carte_buffet',
      proporcaoServicoMisto: perfilInicial.proporcaoServicoMisto ?? 50,
      aliquotaImpostoSeletivo: 10,
      etiquetasOrigem:
        existeDadosEmpresaSalvos() && (perfilInicial.regimeAtual || perfilInicial.tipoAtividade)
          ? {
              ...CONFIGURACOES_PADRAO.etiquetasOrigem,
              ...(perfilInicial.regimeAtual
                ? { regimeAtualEmpresa: 'Preenchido a partir de Dados da Empresa (/dados-empresa)' }
                : {}),
              ...(perfilInicial.tipoAtividade
                ? { tipoAtividade: 'Preenchido a partir de Dados da Empresa (/dados-empresa)' }
                : {}),
            }
          : CONFIGURACOES_PADRAO.etiquetasOrigem,
    }
  })

  const updateConfig = useCallback((novas: Partial<ConfiguracoesGerais>) => {
    setConfig((prev) => {
      const next = { ...prev, ...novas }
      // Recalcular soma IVA Dual se CBS ou IBS mudar isoladamente sem passar totalIvaDual
      if (novas.cbsPadrao !== undefined || novas.ibsPadrao !== undefined) {
        if (novas.totalIvaDual === undefined) {
          next.totalIvaDual = Number((next.cbsPadrao + next.ibsPadrao).toFixed(2))
        }
      }
      // Se um campo foi editado manualmente pelo usuário, preserva/remove a etiqueta correspondente
      const camposVerificados: (keyof OrigemCamposAliquota)[] = [
        'cbsPadrao',
        'ibsPadrao',
        'totalIvaDual',
        'saudeEducacaoAliquota',
        'transporteAliquota',
        'cestaBasicaIsencao',
        'regimeAtualEmpresa',
        'tipoAtividade',
      ]
      let etiquetasAtualizadas = prev.etiquetasOrigem ? { ...prev.etiquetasOrigem } : {}
      camposVerificados.forEach((campo) => {
        if (novas[campo] !== undefined && !novas.etiquetasOrigem) {
          // Se o valor foi alterado diretamente sem passar novas etiquetas, remove a etiqueta daquele campo específico
          if (etiquetasAtualizadas[campo]) {
            delete etiquetasAtualizadas[campo]
          }
        }
      })
      if (!novas.etiquetasOrigem && prev.etiquetasOrigem) {
        next.etiquetasOrigem = etiquetasAtualizadas
      }
      return next
    })

    // PROPAGAÇÃO AUTOMÁTICA DO MÓDULO 1:
    // Se regimeAtualEmpresa for alterado no Módulo 1, propaga para regimeAtualFiltro e reseta flag downstream
    if (novas.regimeAtualEmpresa !== undefined) {
      setRegimeAtualFiltroState(novas.regimeAtualEmpresa)
      setEditadoLocalmente((prev) => ({
        ...prev,
        dashboardRegimeAtual: false,
      }))
    }

    // Se faturamentoMensal for alterado no Módulo 1, propaga para M2, M3, M5 e Dashboard.
    // Campos que o usuário editou manualmente (flag true, inclusive vinda do
    // rascunho restaurado) NÃO são sobrescritos pela propagação.
    if (novas.faturamentoMensal !== undefined) {
      const fat = novas.faturamentoMensal
      setEditadoLocalmente((prev) => {
        if (!prev.modulo2ValorOperacao) setValorOperacaoState(fat)
        if (!prev.modulo3Faturamento) setFaturamentoMensalState(fat)
        if (!prev.modulo5Faturamento) setFaturamentoAnualProjetadoState(fat * 12)
        return {
          ...prev,
          modulo2ValorOperacao: false,
          modulo3Faturamento: false,
          modulo5Faturamento: false,
          dashboardFaturamento: false,
        }
      })
    }

    // Se percentualComprasVendas for alterado no Módulo 1, propaga para M2, M3 e
    // Dashboard. Respeita flag de edição manual (inclusive vinda do rascunho).
    if (novas.percentualComprasVendas !== undefined) {
      const pct = novas.percentualComprasVendas
      setEditadoLocalmente((prev) => {
        if (!prev.modulo2PercentualCompras) setPercentualComprasVendasSimplesState(pct)
        if (!prev.modulo3PercentualCompras) setPercentualComprasVendasComparativoState(pct)
        return {
          ...prev,
          modulo2PercentualCompras: false,
          modulo3PercentualCompras: false,
          dashboardPercentualCompras: false,
        }
      })
    }

    // Se anoTransicao for alterado no Módulo 1, propaga para anoOperacao do M2 e anoTransicaoDashboard do M6
    if (novas.anoTransicao !== undefined) {
      setAnoOperacaoState(novas.anoTransicao)
      setAnoTransicaoDashboardState(novas.anoTransicao)
      setEditadoLocalmente((prev) => ({
        ...prev,
        modulo2AnoOperacao: false,
        dashboardAnoTransicao: false,
      }))
    }

    // Se presetSetor for alterado no Módulo 1, propaga para regimeOperacao do M2
    if (novas.presetSetor !== undefined) {
      const novoRegime: RegimeDiferenciadoTipo =
        novas.presetSetor === 'nenhum' ? 'padrao' : (novas.presetSetor as RegimeDiferenciadoTipo)
      setEditadoLocalmente((prev) => {
        if (!prev.modulo2RegimeOperacao) setRegimeOperacaoState(novoRegime)
        return {
          ...prev,
          modulo2RegimeOperacao: false,
        }
      })
    }

    // Se tipoAtividade (Ramo Principal) for alterado no Módulo 1, propaga para M3, M5 e
    // Dashboard. Respeita flags de edição manual (inclusive vindas do rascunho).
    if (novas.tipoAtividade !== undefined) {
      const normTipo = normalizarTipoAtividade(novas.tipoAtividade)
      setEditadoLocalmente((prev) => {
        if (!prev.modulo3TipoAtividade) setTipoAtividadeState(normTipo)
        if (!prev.modulo5SetorTransicao) setSetorTransicaoState(normTipo)
        return {
          ...prev,
          modulo3TipoAtividade: false,
          modulo5SetorTransicao: false,
          dashboardSetor: false,
        }
      })
    }

    // Propaga subatividades e detalhes do ramo se alterados no Módulo 1
    if (novas.subatividadeServico !== undefined) {
      setSubatividadeServico(novas.subatividadeServico)
    }
    if (novas.subatividadeIndustria !== undefined) {
      setSubatividadeIndustria(novas.subatividadeIndustria)
    }
    if (novas.subatividadeComercio !== undefined) {
      setSubatividadeComercio(novas.subatividadeComercio)
    }
    if (novas.subatividadeAgro !== undefined) {
      setSubatividadeAgro(novas.subatividadeAgro)
    }
    if (novas.subatividadeConstrucao !== undefined) {
      setSubatividadeConstrucao(novas.subatividadeConstrucao)
    }
    if (novas.subatividadeLocacao !== undefined) {
      setSubatividadeLocacao(novas.subatividadeLocacao)
    }
    if (novas.subatividadeFoodService !== undefined) {
      setSubatividadeFoodService(novas.subatividadeFoodService)
    }
    if (novas.proporcaoServicoMisto !== undefined) {
      setProporcaoServicoMisto(novas.proporcaoServicoMisto)
    }
    if (novas.aliquotaImpostoSeletivo !== undefined) {
      setAliquotaImpostoSeletivo(novas.aliquotaImpostoSeletivo)
    }
  }, [])

  const resetConfig = useCallback(() => {
    setConfig(CONFIGURACOES_PADRAO)
    // Reset intencional: descarta o autosave das Configurações (nuvem + local),
    // o rascunho da calculadora e qualquer gravação pendente, para que
    // seleções antigas não voltem ao trocar de menu ou recarregar a página
    // depois do reset (aceite 4).
    configAutosaveRef.current = null
    configPendenteRef.current = false
    configPularAutosaveRef.current = true
    valoresRascunhoRef.current = null
    rascunhoPendenteRef.current = false
    try {
      localStorage.removeItem(CHAVE_RASCUNHO_CALCULADORA)
    } catch {
      // localStorage indisponível: nada a remover
    }
    if (usuarioIdAtual) {
      void excluirConfiguracaoCalculadora(usuarioIdAtual)
    }
  }, [usuarioIdAtual])

  // Aplica alíquota temporária do Radar Tributário (ex.: proposta TCU CBS 11,3468% em 2027)
  const aplicarAliquotaRadarTemporaria = useCallback(
    (aplicar: string, aliquota: number, ano: number) => {
      const aplicarNorm = String(aplicar || 'cbs')
        .toLowerCase()
        .trim()
      const aliqNum = Number(aliquota) || 0
      const anoNum = Number(ano) || 2027

      setParametroRadarTemporario({
        aplicar: aplicarNorm,
        aliquota: aliqNum,
        ano: anoNum,
      })

      const dadosFaseAno =
        CRONOGRAMA_FASES_TRANSICAO[anoNum as AnoTransicaoIbsCbs] || CRONOGRAMA_FASES_TRANSICAO[2027]

      setConfig((prev) => {
        let novaCbs = prev.cbsPadrao
        let novoIbs = prev.ibsPadrao

        if (aplicarNorm.includes('ibs')) {
          novoIbs = aliqNum
        } else if (aplicarNorm.includes('iva') || aplicarNorm.includes('dual')) {
          // divide proporcional ou aplica como total
          novaCbs = Number((aliqNum * (8.8 / 26.5)).toFixed(4))
          novoIbs = Number((aliqNum * (17.7 / 26.5)).toFixed(4))
        } else {
          // default: CBS
          novaCbs = aliqNum
        }

        const totalIva = Number((novaCbs + novoIbs).toFixed(4))
        const etiquetaRadar = `Radar Tributário (Proposta TCU) · ${aliqNum}% (${aplicarNorm.toUpperCase()}) · fase ${anoNum}`

        const novasEtiquetas: OrigemCamposAliquota = {
          ...(prev.etiquetasOrigem || {}),
          cbsPadrao: aplicarNorm.includes('ibs')
            ? prev.etiquetasOrigem?.cbsPadrao || dadosFaseAno.etiquetaOrigem
            : etiquetaRadar,
          ibsPadrao: aplicarNorm.includes('ibs')
            ? etiquetaRadar
            : prev.etiquetasOrigem?.ibsPadrao || dadosFaseAno.etiquetaOrigem,
          totalIvaDual: etiquetaRadar,
        }

        return {
          ...prev,
          cbsPadrao: novaCbs,
          ibsPadrao: novoIbs,
          totalIvaDual: totalIva,
          anoTransicao:
            typeof anoNum === 'number' && anoNum in CRONOGRAMA_FASES_TRANSICAO
              ? (anoNum as AnoTransicaoIbsCbs)
              : prev.anoTransicao,
          etiquetasOrigem: novasEtiquetas,
        }
      })

      if (anoNum in CRONOGRAMA_FASES_TRANSICAO) {
        setAnoOperacaoState(anoNum as AnoTransicaoIbsCbs)
        setAnoTransicaoDashboardState(anoNum as AnoTransicaoIbsCbs)
        setEditadoLocalmente((prev) => ({
          ...prev,
          modulo2AnoOperacao: false,
          dashboardAnoTransicao: false,
        }))
      }
    },
    [],
  )

  // Limpa alíquota temporária e restaura valor oficial vigente da LC 214/2025 para o ano ativo
  const limparParametroRadarTemporario = useCallback(() => {
    // Estado funcional: a restauração só depende do estado atual (ano/etiquetas),
    // nunca de valores capturados no render — estável por renderização.
    setParametroRadarTemporario(null)
    setConfig((prev) => {
      const anoAtual = prev.anoTransicao || 2027
      const dadosFase = CRONOGRAMA_FASES_TRANSICAO[anoAtual] || CRONOGRAMA_FASES_TRANSICAO[2027]

      // Alíquotas oficiais da LC 214/2025 permanecem intactas no cronograma
      const cbsOficial = dadosFase.aliquotaCbs
      const ibsOficial = dadosFase.aliquotaIbs
      const totalOficial = Number((cbsOficial + ibsOficial).toFixed(2))

      const novasEtiquetas: OrigemCamposAliquota = {
        ...(prev.etiquetasOrigem || {}),
        cbsPadrao: dadosFase.etiquetaOrigem,
        ibsPadrao: dadosFase.etiquetaOrigem,
        totalIvaDual: dadosFase.etiquetaOrigem,
      }

      return {
        ...prev,
        cbsPadrao: cbsOficial,
        ibsPadrao: ibsOficial,
        totalIvaDual: totalOficial,
        etiquetasOrigem: novasEtiquetas,
      }
    })
  }, [])

  // Reseta em cascata todos os dados de entrada, cálculos e sincronizações
  const limparDashboard = useCallback(() => {
    // Limpa parâmetro temporário do Radar
    setParametroRadarTemporario(null)

    // 1. Reseta configurações gerais do Módulo 1 (alíquotas de referência, etc.)
    setConfig(CONFIGURACOES_PADRAO)
    setItensComposicao([])

    // 2. Módulo 2: Calculadora Simples
    setValorOperacaoState(0)
    setPercentualComprasVendasSimplesState(0)
    setRegimeOperacaoState('padrao')
    setAnoOperacaoState(2033)

    // 3. Módulo 3: Comparativo
    setFaturamentoMensalState(0)
    setPercentualComprasVendasComparativoState(0)
    setFolhaPagamentoMensal(0)
    setDespesasComCreditosMensais(0)
    setMargemLucroEstimada(20)
    setPercentualExportacao(0)
    setProporcaoServicoMisto(50)
    setAliquotaImpostoSeletivo(10)

    // 4. Módulo 4: Simulador de Créditos
    setDespesasCreditos(CATEGORIAS_CREDITO_PADRAO)

    // 5. Módulo 5: Transição e Estoque
    setFaturamentoAnualProjetadoState(0)
    setValorEstoqueVirada(0)

    // 6. Módulo 6: Dashboard filtros
    setPeriodoDashboard('mensal')
    setRegimeAtualFiltroState('Lucro Presumido')
    setAnoTransicaoDashboardState(2033)

    // 7. Flags de edição manual restauradas aos padrões
    setEditadoLocalmente({
      modulo2AnoOperacao: false,
      modulo2RegimeOperacao: false,
      modulo2ValorOperacao: false,
      modulo2PercentualCompras: false,
      modulo3Faturamento: false,
      modulo3PercentualCompras: false,
      modulo3TipoAtividade: false,
      modulo4Categorias: false,
      modulo5Faturamento: false,
      modulo5SetorTransicao: false,
      dashboardRegimeAtual: false,
      dashboardAnoTransicao: false,
      dashboardSetor: false,
      dashboardFaturamento: false,
      dashboardPercentualCompras: false,
      fase2Parametros: false,
    })

    // 8. Limpa os dados em localStorage através de limparDadosEmpresa()
    try {
      limparDadosEmpresa()
    } catch (err) {
      console.warn('[CalculadoraContext] Erro ao limpar dados empresa:', err)
    }
    setOrigemDadosEmpresa(false)

    // 9. Remove o rascunho persistido da calculadora (senão o preset/Fase 2
    //    apagados voltariam ao recarregar a página ou trocar de menu) e também
    //    o autosave das Configurações (senão as seleções antigas voltariam)
    valoresRascunhoRef.current = null
    rascunhoPendenteRef.current = false
    configAutosaveRef.current = null
    configPendenteRef.current = false
    configPularAutosaveRef.current = true
    try {
      localStorage.removeItem(CHAVE_RASCUNHO_CALCULADORA)
    } catch {
      // localStorage indisponível: nada a remover
    }
    if (usuarioIdAtual) {
      void excluirConfiguracaoCalculadora(usuarioIdAtual)
    }
  }, [usuarioIdAtual])

  const limparEtiquetaOrigem = useCallback((campo: keyof OrigemCamposAliquota) => {
    setConfig((prev) => {
      if (!prev.etiquetasOrigem || !prev.etiquetasOrigem[campo]) return prev
      const novaEtiqueta = { ...prev.etiquetasOrigem }
      delete novaEtiqueta[campo]
      return {
        ...prev,
        etiquetasOrigem: novaEtiqueta,
      }
    })
  }, [])

  // Preenchimento Assistido: Ano da transição ('atual' | 2026–2033)
  const aplicarAnoTransicao = useCallback(
    (ano: AnoTransicaoIbsCbs) => {
      const dadosAno = obterFaseTransicaoPorAno(ano)
      if (!dadosAno) return

      // Se tiver alíquota oficial na coleção parametros_tributarios para o ano selecionado, integra como valor oficial/proposto
      let cbsDinamica = dadosAno.aliquotaCbs
      let etiquetaCbsDinamica = dadosAno.etiquetaOrigem
      if (typeof ano === 'number' && parametrosRadar.length > 0) {
        const paramCbs = parametrosRadar.find((p) => p.ano === ano && p.tributo === 'CBS')
        if (paramCbs && paramCbs.aliquota) {
          cbsDinamica = paramCbs.aliquota
          etiquetaCbsDinamica = `${paramCbs.fonte} (${paramCbs.situacao}) · fase ${ano}`
        }
      }

      setConfig((prev) => {
        const cbs = cbsDinamica
        const ibs = dadosAno.aliquotaIbs
        const total = Number((cbs + ibs).toFixed(2))
        const etiquetaFase = etiquetaCbsDinamica

        // Se for ano atual (pré-reforma), alíquotas de IBS/CBS são 0%
        let saudeAliq = Number((total * 0.4).toFixed(2)) // redução 60%
        let transAliq = Number((total * 0.7).toFixed(2)) // redução 30%
        let cestaAliq = 0

        // Atualiza etiquetas de origem
        const novasEtiquetas: OrigemCamposAliquota = {
          ...(prev.etiquetasOrigem || {}),
          cbsPadrao: etiquetaFase,
          ibsPadrao: etiquetaFase,
          totalIvaDual: etiquetaFase,
        }

        // Se já estava com preset de setor, atualiza o rótulo dos regimes diferenciados combinando preset + fase do ano
        const presetAtivo = prev.presetSetor
        if (presetAtivo && presetAtivo !== 'nenhum') {
          const itemPreset = PRESETS_SETORES_LC214.find((p) => p.id === presetAtivo)
          if (itemPreset) {
            const etiquetaAno =
              ano === 'atual'
                ? `${itemPreset.titulo} · Sistema atual (pré-reforma)`
                : `${itemPreset.etiquetaOrigem} · fase ${ano}`
            if (itemPreset.grupo === 'reducao_60') {
              novasEtiquetas.saudeEducacaoAliquota = etiquetaAno
            } else if (itemPreset.grupo === 'reducao_30') {
              novasEtiquetas.transporteAliquota = etiquetaAno
            } else if (itemPreset.grupo === 'aliquota_zero') {
              novasEtiquetas.cestaBasicaIsencao = etiquetaAno
            } else if (itemPreset.id === 'padrao') {
              novasEtiquetas.totalIvaDual = etiquetaFase
            }
          }
        } else {
          // Sem preset específico, as faixas refletem a origem da fase selecionada
          novasEtiquetas.saudeEducacaoAliquota =
            ano === 'atual'
              ? 'Sistema atual (pré-reforma)'
              : `LC 214/2025 · redução 60% · fase ${ano}`
          novasEtiquetas.transporteAliquota =
            ano === 'atual'
              ? 'Sistema atual (pré-reforma)'
              : `LC 214/2025 · redução 30% · fase ${ano}`
          novasEtiquetas.cestaBasicaIsencao =
            ano === 'atual'
              ? 'Sistema atual (pré-reforma)'
              : `LC 214/2025 · alíquota zero · fase ${ano}`
        }

        return {
          ...prev,
          cbsPadrao: cbs,
          ibsPadrao: ibs,
          totalIvaDual: total,
          saudeEducacaoAliquota: saudeAliq,
          transporteAliquota: transAliq,
          cestaBasicaIsencao: cestaAliq,
          anoTransicao: ano,
          etiquetasOrigem: novasEtiquetas,
        }
      })

      // PROPAGAÇÃO AUTOMÁTICA AO MÓDULO 2 (Ano da Operação/Transição) E AO MÓDULO 6 (Dashboard)
      // Uma nova alteração no Módulo 1 repropaga o valor e redefine a flag de edição local
      setAnoOperacaoState(ano)
      setAnoTransicaoDashboardState(ano)
      setEditadoLocalmente((prev) => ({
        ...prev,
        modulo2AnoOperacao: false,
        dashboardAnoTransicao: false,
      }))
    },
    [parametrosRadar],
  )

  // Preenchimento Assistido: Preset por Setor (LC 214/2025)
  const aplicarPresetSetor = useCallback((preset: PresetSetorIbsCbs) => {
    if (preset === 'nenhum') {
      setConfig((prev) => ({
        ...prev,
        presetSetor: 'nenhum',
      }))
      // Propaga ao Módulo 2 também como 'padrao'
      setRegimeOperacaoState('padrao')
      setEditadoLocalmente((prev) => ({
        ...prev,
        modulo2RegimeOperacao: false,
      }))
      return
    }

    const itemPreset = PRESETS_SETORES_LC214.find((p) => p.id === preset)
    if (!itemPreset) return

    setConfig((prev) => {
      const totalRef = prev.totalIvaDual !== undefined ? prev.totalIvaDual : 26.5
      const ano = prev.anoTransicao || 2033
      const novasEtiquetas: OrigemCamposAliquota = {
        ...(prev.etiquetasOrigem || {}),
      }

      // Recalcular as alíquotas de regimes diferenciados baseado na alíquota do ano escolhido
      const saudeAliq = Number((totalRef * 0.4).toFixed(2)) // -60%
      const transAliq = Number((totalRef * 0.7).toFixed(2)) // -30%
      const cestaAliq = 0 // Alíquota zero

      // Rótulo completo com a base legal específica e fase do ano selecionado
      const etiquetaLegalComAno =
        ano === 'atual'
          ? `${itemPreset.titulo} · Sistema atual (pré-reforma)`
          : `${itemPreset.etiquetaOrigem} · fase ${ano}`

      if (itemPreset.grupo === 'reducao_60') {
        novasEtiquetas.saudeEducacaoAliquota = etiquetaLegalComAno
      } else if (itemPreset.grupo === 'reducao_30') {
        novasEtiquetas.transporteAliquota = etiquetaLegalComAno
      } else if (itemPreset.grupo === 'aliquota_zero') {
        novasEtiquetas.cestaBasicaIsencao = etiquetaLegalComAno
      } else if (itemPreset.id === 'padrao') {
        novasEtiquetas.totalIvaDual =
          prev.etiquetasOrigem?.totalIvaDual ||
          (ano === 'atual' ? 'Sistema atual (pré-reforma)' : `LC 214/2025 · fase ${ano}`)
      }

      return {
        ...prev,
        saudeEducacaoAliquota: saudeAliq,
        transporteAliquota: transAliq,
        cestaBasicaIsencao: cestaAliq,
        presetSetor: preset,
        etiquetasOrigem: novasEtiquetas,
      }
    })

    // PROPAGAÇÃO AUTOMÁTICA AO MÓDULO 2 (Regime Aplicado)
    // Uma nova alteração no Módulo 1 repropaga o valor e redefine a flag de edição local
    setRegimeOperacaoState(preset as RegimeDiferenciadoTipo)
    setEditadoLocalmente((prev) => ({
      ...prev,
      modulo2RegimeOperacao: false,
    }))
  }, [])

  // Flags para controle de edição manual local nos módulos downstream
  // Quando false, significa que o valor ainda é espelhado do Módulo 1 (ou foi atualizado por ele)
  // Hidratação do rascunho: flags 'editado' gravadas na última visita voltam como
  // estavam — um campo que o usuário editou no Módulo 2/3/5 NÃO é re-sobrescrito
  // pela propagação do Módulo 1 (updateConfig do restore da nuvem) nem pelo sync
  // da Fonte Mestra.
  const rascunhoM2 = rascunhoInicial?.modulo2
  const rascunhoM3 = rascunhoInicial?.modulo3
  const rascunhoM4 = rascunhoInicial?.modulo4
  const rascunhoM5 = rascunhoInicial?.modulo5
  const [editadoLocalmente, setEditadoLocalmente] = useState({
    modulo2AnoOperacao: rascunhoM2?.editado?.anoOperacao ?? false,
    modulo2RegimeOperacao: rascunhoM2?.editado?.regimeOperacao ?? false,
    modulo2ValorOperacao: rascunhoM2?.editado?.valorOperacao ?? false,
    modulo2PercentualCompras: rascunhoM2?.editado?.percentualCompras ?? false,
    modulo3Faturamento: rascunhoM3?.editado?.faturamento ?? false,
    modulo3PercentualCompras: rascunhoM3?.editado?.percentualCompras ?? false,
    modulo3TipoAtividade: rascunhoM3?.editado?.tipoAtividade ?? false,
    modulo4Categorias: false,
    modulo5Faturamento: rascunhoM5?.editado?.faturamento ?? false,
    modulo5SetorTransicao: rascunhoM5?.editado?.setor ?? false,
    dashboardRegimeAtual: false,
    dashboardAnoTransicao: false,
    dashboardSetor: false,
    dashboardFaturamento: false,
    dashboardPercentualCompras: false,
    fase2Parametros: false,
  })

  // Parâmetros Fiscais Avançados (Fase 2) - Override local da Calculadora com defaults neutros
  const [percentualComprasSemCredito, setPercentualComprasSemCreditoState] = useState<number>(
    () => config.percentualComprasSemCredito ?? perfilInicial.percentualComprasSemCredito ?? 0,
  )
  const setPercentualComprasSemCredito = useCallback((v: number) => {
    setEditadoLocalmente((prev) => ({ ...prev, fase2Parametros: true }))
    setPercentualComprasSemCreditoState(Math.max(0, Math.min(100, Number(v) || 0)))
  }, [])

  const [saldoCredorAcumulado, setSaldoCredorAcumuladoState] = useState<number>(
    () => config.saldoCredorAcumulado ?? perfilInicial.saldoCredorAcumulado ?? 0,
  )
  const setSaldoCredorAcumulado = useCallback((v: number) => {
    setEditadoLocalmente((prev) => ({ ...prev, fase2Parametros: true }))
    setSaldoCredorAcumuladoState(Math.max(0, Number(v) || 0))
  }, [])

  const [percentualVendasInterestaduais, setPercentualVendasInterestaduaisState] = useState<number>(
    () =>
      config.percentualVendasInterestaduais ?? perfilInicial.percentualVendasInterestaduais ?? 0,
  )
  const setPercentualVendasInterestaduais = useCallback((v: number) => {
    setEditadoLocalmente((prev) => ({ ...prev, fase2Parametros: true }))
    setPercentualVendasInterestaduaisState(Math.max(0, Math.min(100, Number(v) || 0)))
  }, [])

  const [regimeEspecialAtual, setRegimeEspecialAtualState] = useState<
    import('@/types/dadosEmpresa').RegimeEspecialAtual
  >(() => config.regimeEspecialAtual ?? perfilInicial.regimeEspecialAtual ?? 'nenhum')
  const setRegimeEspecialAtual = useCallback(
    (r: import('@/types/dadosEmpresa').RegimeEspecialAtual) => {
      setEditadoLocalmente((prev) => ({ ...prev, fase2Parametros: true }))
      setRegimeEspecialAtualState(r)
    },
    [],
  )

  const [perfilRetencaoSplit, setPerfilRetencaoSplitState] = useState<
    import('@/types/dadosEmpresa').PerfilRetencaoSplit
  >(() => config.perfilRetencaoSplit ?? perfilInicial.perfilRetencaoSplit ?? 'nao')
  const setPerfilRetencaoSplit = useCallback(
    (p: import('@/types/dadosEmpresa').PerfilRetencaoSplit) => {
      setEditadoLocalmente((prev) => ({ ...prev, fase2Parametros: true }))
      setPerfilRetencaoSplitState(p)
    },
    [],
  )

  const [percentualRetencaoSplit, setPercentualRetencaoSplitState] = useState<number>(
    () => config.percentualRetencaoSplit ?? perfilInicial.percentualRetencaoSplit ?? 0,
  )
  const setPercentualRetencaoSplit = useCallback((v: number) => {
    setEditadoLocalmente((prev) => ({ ...prev, fase2Parametros: true }))
    setPercentualRetencaoSplitState(Math.max(0, Math.min(100, Number(v) || 0)))
  }, [])

  // Módulo 2: Calculadora Simples (inicializado a partir dos Dados da Empresa / Módulo 1)
  const [valorOperacao, setValorOperacaoState] = useState<number>(
    () =>
      rascunhoM2?.valorOperacao ?? config.faturamentoMensal ?? perfilInicial.faturamentoMensal ?? 0,
  )
  const [regimeOperacao, setRegimeOperacaoState] = useState<RegimeDiferenciadoTipo>(() => {
    // Restaura o Regime Aplicado (Módulo 2) como o usuário deixou na última visita
    if (rascunhoM2?.regimeOperacao) return rascunhoM2.regimeOperacao
    if (rascunhoInicial?.regimeOperacao) return rascunhoInicial.regimeOperacao
    return config.presetSetor && config.presetSetor !== 'nenhum' ? config.presetSetor : 'padrao'
  })
  const [anoOperacao, setAnoOperacaoState] = useState<AnoTransicaoIbsCbs>(
    () => rascunhoM2?.anoOperacao ?? config.anoTransicao ?? 2033,
  )
  const [percentualComprasVendasSimples, setPercentualComprasVendasSimplesState] = useState<number>(
    () =>
      rascunhoM2?.percentualComprasVendasSimples ??
      config.percentualComprasVendas ??
      perfilInicial.percentualComprasVendas ??
      40,
  )

  // Setters instrumentados que marcam edição local
  const setValorOperacao = useCallback((v: number) => {
    setEditadoLocalmente((prev) => ({ ...prev, modulo2ValorOperacao: true }))
    setValorOperacaoState(v)
  }, [])
  const setRegimeOperacao = useCallback((r: RegimeDiferenciadoTipo) => {
    setEditadoLocalmente((prev) => ({ ...prev, modulo2RegimeOperacao: true }))
    setRegimeOperacaoState(r)
  }, [])
  const setAnoOperacao = useCallback((a: AnoTransicaoIbsCbs) => {
    setEditadoLocalmente((prev) => ({ ...prev, modulo2AnoOperacao: true }))
    setAnoOperacaoState(a)
  }, [])
  const setPercentualComprasVendasSimples = useCallback((p: number) => {
    setEditadoLocalmente((prev) => ({ ...prev, modulo2PercentualCompras: true }))
    setPercentualComprasVendasSimplesState(p)
  }, [])

  // ============================================================
  // Persistência automática do rascunho da calculadora
  // Grava com debounce APÓS mudanças de estado (nunca em render),
  // somente logado, sob a identidade usuário + empresa ativa.
  // Escrita direta em chave própria do localStorage — NÃO usa
  // salvarDadosEmpresa (não dispara eventos da Fonte Mestra nem
  // sobrescreve os Dados da Empresa), logo não há laços de sync.
  // Ao desmontar (troca de menu), a última versão pendente é gravada
  // SINCRONAMENTE a partir de refs — nada se perde no debounce.
  // ============================================================
  const rascunhoHidratadoRef = useRef(false)
  const rascunhoPendenteRef = useRef(false)
  const valoresRascunhoRef = useRef<RascunhoCalculadora | null>(null)
  // Espelho da autenticação para a gravação: no logout, o usuário vira null
  // antes do redirect desmontar a página — o flush não pode regravar o
  // rascunho depois que limparEstadoLocalSessao já o removeu.
  const autenticadoRef = useRef(isAuthenticated)
  useEffect(() => {
    autenticadoRef.current = isAuthenticated
  }, [isAuthenticated])

  useEffect(() => {
    if (!rascunhoHidratadoRef.current) {
      // Primeira execução = hidratação inicial: nada foi editado ainda
      rascunhoHidratadoRef.current = true
      return
    }
    if (!isAuthenticated || !usuarioIdAtual) return
    // Pulo pós-reset (resetConfig/limparDashboard): não regrava o autosave
    if (configPularAutosaveRef.current) {
      configPularAutosaveRef.current = false
      return
    }
    // Conta edições do usuário: guarda-corpo do restore em voo (ver abaixo)
    configEditSeqRef.current += 1

    // Mantém os valores mais recentes disponíveis para gravação (debounce e unmount)
    valoresRascunhoRef.current = {
      identidade: {
        usuarioId: usuarioIdAtual,
        cnpj: perfilInicial.cnpj || '',
        nomeEmpresa: perfilInicial.nomeEmpresa || '',
      },
      presetSetor: config.presetSetor ?? 'padrao',
      regimeOperacao,
      saudeEducacaoAliquota: config.saudeEducacaoAliquota,
      transporteAliquota: config.transporteAliquota,
      cestaBasicaIsencao: config.cestaBasicaIsencao,
      percentualComprasSemCredito,
      saldoCredorAcumulado,
      percentualVendasInterestaduais,
      regimeEspecialAtual,
      perfilRetencaoSplit,
      percentualRetencaoSplit,
      etiquetasOrigem: config.etiquetasOrigem,
      ajusteAliquotaSimplesMedia: config.ajusteAliquotaSimplesMedia,
      // Módulos 2 a 5: repõe os dados que o usuário deixou na última visita
      modulo2: {
        valorOperacao,
        regimeOperacao,
        anoOperacao,
        percentualComprasVendasSimples,
        editado: {
          valorOperacao: editadoLocalmente.modulo2ValorOperacao,
          regimeOperacao: editadoLocalmente.modulo2RegimeOperacao,
          anoOperacao: editadoLocalmente.modulo2AnoOperacao,
          percentualCompras: editadoLocalmente.modulo2PercentualCompras,
        },
      },
      modulo3: {
        faturamentoMensal,
        tipoAtividade,
        subatividadeServico,
        subatividadeIndustria,
        subatividadeComercio,
        subatividadeAgro,
        subatividadeConstrucao,
        subatividadeLocacao,
        subatividadeFoodService,
        aliquotaImpostoSeletivo,
        proporcaoServicoMisto,
        percentualComprasVendasComparativo,
        folhaPagamentoMensal,
        margemLucroEstimada,
        despesasComCreditosMensais,
        percentualExportacao,
        ufOrigem,
        editado: {
          faturamento: editadoLocalmente.modulo3Faturamento,
          percentualCompras: editadoLocalmente.modulo3PercentualCompras,
          tipoAtividade: editadoLocalmente.modulo3TipoAtividade,
        },
      },
      modulo4: {
        despesasCreditos,
      },
      modulo5: {
        faturamentoAnualProjetado,
        setorTransicao,
        valorEstoqueVirada,
        editado: {
          faturamento: editadoLocalmente.modulo5Faturamento,
          setor: editadoLocalmente.modulo5SetorTransicao,
        },
      },
      salvoEm: new Date().toISOString(),
    }
    rascunhoPendenteRef.current = true

    // Autosave das Configurações (Módulo 1): payload dedicado com identidade,
    // gravado na nuvem (simulacoes_calculadora, registro marcador) com
    // debounce próprio (~700ms). Fallback local por usuário se a nuvem falhar.
    configAutosaveRef.current = {
      usuarioId: usuarioIdAtual,
      payload: montarPayloadConfiguracoes(config, {
        cnpj: perfilInicial.cnpj || '',
        nomeEmpresa: perfilInicial.nomeEmpresa || '',
      }),
    }
    configPendenteRef.current = true

    const gravarRascunho = () => {
      rascunhoPendenteRef.current = false
      try {
        if (valoresRascunhoRef.current && autenticadoRef.current) {
          localStorage.setItem(
            CHAVE_RASCUNHO_CALCULADORA,
            JSON.stringify(valoresRascunhoRef.current),
          )
        }
      } catch {
        // localStorage indisponível/cheio: a calculadora segue funcionando sem rascunho
      }
    }
    // Gravação das Configurações. `porDescarte` = flush de unmount (troca de
    // menu antes do debounce): grava o fallback local SINCRONAMENTE a partir
    // da ref (garantia) e dispara a nuvem sem bloquear o descarregamento.
    const gravarConfiguracoes = (porDescarte: boolean) => {
      configPendenteRef.current = false
      const pendente = configAutosaveRef.current
      if (!pendente || !autenticadoRef.current) return
      if (porDescarte) {
        salvarConfiguracaoLocal(pendente.usuarioId, pendente.payload)
      }
      void (async () => {
        const ok = await salvarConfiguracaoCalculadora(pendente.usuarioId, pendente.payload)
        if (!ok && !porDescarte) {
          const salvoLocal = salvarConfiguracaoLocal(pendente.usuarioId, pendente.payload)
          if (salvoLocal) {
            toast({
              title: 'Configurações salvas neste dispositivo',
              description:
                'A nuvem não respondeu agora — suas seleções da Calculadora ficam guardadas localmente.',
            })
          }
        }
      })()
    }
    const timer = window.setTimeout(gravarRascunho, 600)
    const timerConfig = window.setTimeout(() => gravarConfiguracoes(false), 700)
    return () => {
      // Cancela o debounce; se havia rascunho pendente (troca de menu antes
      // do tempo do debounce), grava SINCRONAMENTE a partir da ref.
      window.clearTimeout(timer)
      gravarRascunho()
      // Autosave das Configurações: mesmo padrão — flush síncrono por ref
      window.clearTimeout(timerConfig)
      if (configPendenteRef.current) {
        gravarConfiguracoes(true)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    config,
    regimeOperacao,
    percentualComprasSemCredito,
    saldoCredorAcumulado,
    percentualVendasInterestaduais,
    regimeEspecialAtual,
    perfilRetencaoSplit,
    percentualRetencaoSplit,
    isAuthenticated,
    usuarioIdAtual,
    perfilInicial,
  ])

  // ============================================================
  // Restore ÚNICO das Configurações salvas (Módulo 1)
  // Mesmo padrão do rascunhoHidratadoRef: guarda de execução única por ref.
  // Busca o autosave (nuvem primeiro, fallback local por usuário) UMA vez por
  // montagem do provider e re-aplica via updateConfig — que cuida da mescla
  // em config E da propagação para M2/M3/M5/Dashboard e dos estados soltos
  // (aliquotaImpostoSeletivo, subatividades, proporcaoServicoMisto etc.).
  // ============================================================
  const restauracaoConcluidaRef = useRef(false)
  // Sequência de edições do usuário nas Configurações (incrementada no efeito
  // de autosave). Se o usuário editou enquanto o restore buscava a nuvem, a
  // edição mais recente vence e o restore é descartado.
  const configEditSeqRef = useRef(0)
  useEffect(() => {
    if (restauracaoConcluidaRef.current) return
    if (!isAuthenticated || !usuarioIdAtual) return
    restauracaoConcluidaRef.current = true
    let descartado = false
    const seqNaPartida = configEditSeqRef.current
    void (async () => {
      const daNuvem = await carregarConfiguracaoCalculadora(usuarioIdAtual)
      if (descartado) return
      if (configEditSeqRef.current !== seqNaPartida) return
      const payload = daNuvem || carregarConfiguracaoLocal(usuarioIdAtual)
      if (!payload || !payload.config) return
      // Campos ausentes em payloads antigos NÃO podem virar undefined no
      // estado (zeraria selects do Módulo 1): filtra antes de mesclar.
      const campos = Object.fromEntries(
        Object.entries(payload.config).filter(([, v]) => v !== undefined),
      ) as Partial<ConfiguracoesGerais>
      if (Object.keys(campos).length === 0) return
      updateConfig(campos)
    })()
    return () => {
      descartado = true
      // Reabre o restore para a próxima execução do efeito (login de outro
      // usuário, remontagem do StrictMode): a ref persiste entre montagens.
      restauracaoConcluidaRef.current = false
    }
  }, [isAuthenticated, usuarioIdAtual, updateConfig])

  // Módulo 3: Comparativo por Regime (inicializado a partir do rascunho / Dados da Empresa / Módulo 1)
  const [faturamentoMensal, setFaturamentoMensalState] = useState<number>(
    () =>
      rascunhoM3?.faturamentoMensal ??
      config.faturamentoMensal ??
      perfilInicial.faturamentoMensal ??
      0,
  )
  const setFaturamentoMensal = useCallback((v: number) => {
    setEditadoLocalmente((prev) => ({
      ...prev,
      modulo3Faturamento: true,
      dashboardFaturamento: true,
    }))
    setFaturamentoMensalState(v)
  }, [])
  const [tipoAtividade, setTipoAtividadeState] = useState<TipoAtividadePrincipal>(() =>
    rascunhoM3
      ? normalizarTipoAtividade(rascunhoM3.tipoAtividade)
      : normalizarTipoAtividade(perfilInicial.tipoAtividade),
  )

  const setTipoAtividade = useCallback((novoTipo: TipoAtividade) => {
    setEditadoLocalmente((prev) => ({
      ...prev,
      modulo3TipoAtividade: true,
      dashboardSetor: true,
    }))
    setTipoAtividadeState(normalizarTipoAtividade(novoTipo))
  }, [])
  // Subatividades por ramo
  const [subatividadeServico, setSubatividadeServico] = useState<SubatividadeServico>(
    () => rascunhoM3?.subatividadeServico || perfilInicial.subatividadeServico || 'servico_comum',
  )
  const [subatividadeIndustria, setSubatividadeIndustria] = useState<SubatividadeIndustria>(
    () =>
      rascunhoM3?.subatividadeIndustria || perfilInicial.subatividadeIndustria || 'industria_comum',
  )
  const [subatividadeComercio, setSubatividadeComercio] = useState<SubatividadeComercio>(
    () => rascunhoM3?.subatividadeComercio || perfilInicial.subatividadeComercio || 'varejo_comum',
  )
  const [subatividadeAgro, setSubatividadeAgro] = useState<SubatividadeAgronegocio>(
    () => rascunhoM3?.subatividadeAgro || 'producao_agricola_graos',
  )
  const [subatividadeConstrucao, setSubatividadeConstrucao] = useState<SubatividadeConstrucao>(
    () => rascunhoM3?.subatividadeConstrucao || 'obras_edificacoes_ret',
  )
  const [subatividadeLocacao, setSubatividadeLocacao] = useState<SubatividadeLocacao>(
    () => rascunhoM3?.subatividadeLocacao || 'locacao_veiculos_maquinas',
  )
  const [subatividadeFoodService, setSubatividadeFoodService] = useState<SubatividadeFoodService>(
    () => rascunhoM3?.subatividadeFoodService || 'restaurante_a_la_carte_buffet',
  )
  const [aliquotaImpostoSeletivo, setAliquotaImpostoSeletivo] = useState<number>(
    () => rascunhoM3?.aliquotaImpostoSeletivo ?? 10,
  )

  const [proporcaoServicoMisto, setProporcaoServicoMisto] = useState<number>(
    () => rascunhoM3?.proporcaoServicoMisto ?? perfilInicial.proporcaoServicoMisto ?? 50,
  )
  const [percentualComprasVendasComparativo, setPercentualComprasVendasComparativoState] =
    useState<number>(
      () =>
        rascunhoM3?.percentualComprasVendasComparativo ??
        config.percentualComprasVendas ??
        perfilInicial.percentualComprasVendas ??
        0,
    )
  const setPercentualComprasVendasComparativo = useCallback((p: number) => {
    setEditadoLocalmente((prev) => ({
      ...prev,
      modulo3PercentualCompras: true,
      dashboardPercentualCompras: true,
    }))
    setPercentualComprasVendasComparativoState(p)
  }, [])
  // Campos refinados do Módulo 3
  const [folhaPagamentoMensal, setFolhaPagamentoMensal] = useState<number>(
    () => rascunhoM3?.folhaPagamentoMensal ?? perfilInicial.folhaPagamentoMensal ?? 0,
  )
  const [margemLucroEstimada, setMargemLucroEstimada] = useState<number>(
    () => rascunhoM3?.margemLucroEstimada ?? perfilInicial.margemLucroEstimada ?? 20,
  ) // %
  const [despesasComCreditosMensais, setDespesasComCreditosMensais] = useState<number>(
    () => rascunhoM3?.despesasComCreditosMensais ?? perfilInicial.despesasComCreditosMensais ?? 0,
  )
  const [percentualExportacao, setPercentualExportacao] = useState<number>(
    () => rascunhoM3?.percentualExportacao ?? perfilInicial.percentualExportacao ?? 0,
  )
  const [ufOrigem, setUfOrigem] = useState<string>(
    () => rascunhoM3?.ufOrigem || perfilInicial.ufOrigem || 'SP',
  )

  // Módulo 4: Simulador de Créditos (proporcionaliza categorias quando houver perfil)
  const gerarCategoriasIniciais = (): CategoriaDespesaCredito[] => {
    const despesaPerfil = perfilInicial.despesasComCreditosMensais || 0
    if (!despesaPerfil) {
      return CATEGORIAS_CREDITO_PADRAO
    }
    // Soma total dos valores mensais padrão das 18 categorias
    const somaPadrao = CATEGORIAS_CREDITO_PADRAO.reduce((acc, c) => acc + c.valorMensal, 0) || 1
    const proporcao = despesaPerfil / somaPadrao
    return CATEGORIAS_CREDITO_PADRAO.map((item) => ({
      ...item,
      valorMensal: Math.round(item.valorMensal * proporcao),
    }))
  }

  // Composição detalhada por Itens / Insumos com NCM (Fase 3)
  const [itensComposicao, setItensComposicao] = useState<
    import('@/lib/ncmCalculadora').ItemComposicaoCalculadora[]
  >(() => config.itensComposicao || [])

  const adicionarItemComposicao = useCallback(
    (item: Omit<import('@/lib/ncmCalculadora').ItemComposicaoCalculadora, 'id'>) => {
      const novo: import('@/lib/ncmCalculadora').ItemComposicaoCalculadora = {
        ...item,
        id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      }
      setItensComposicao((prev) => [...prev, novo])
    },
    [],
  )

  const atualizarItemComposicao = useCallback(
    (id: string, updates: Partial<import('@/lib/ncmCalculadora').ItemComposicaoCalculadora>) => {
      setItensComposicao((prev) => prev.map((it) => (it.id === id ? { ...it, ...updates } : it)))
    },
    [],
  )

  const removerItemComposicao = useCallback((id: string) => {
    setItensComposicao((prev) => prev.filter((it) => it.id !== id))
  }, [])

  const limparItensComposicao = useCallback(() => {
    setItensComposicao([])
  }, [])

  const [despesasCreditos, setDespesasCreditos] = useState<CategoriaDespesaCredito[]>(() =>
    // Restaura as categorias editadas pelo usuário na última visita (rascunho
    // do Módulo 4); sem rascunho, deriva proporcionalmente dos Dados da Empresa.
    rascunhoM4?.despesasCreditos?.length ? rascunhoM4.despesasCreditos : gerarCategoriasIniciais(),
  )

  const updateDespesaCredito = useCallback(
    (id: string, updates: Partial<CategoriaDespesaCredito>) => {
      setEditadoLocalmente((prev) => ({ ...prev, modulo4Categorias: true }))
      setDespesasCreditos((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
      )
    },
    [],
  )

  const resetDespesasCreditos = useCallback(() => {
    setEditadoLocalmente((prev) => ({ ...prev, modulo4Categorias: false }))
    setDespesasCreditos(CATEGORIAS_CREDITO_PADRAO)
  }, [])

  // Módulo 5: Transição (faturamento anual = faturamentoMensal * 12)
  const [faturamentoAnualProjetado, setFaturamentoAnualProjetadoState] = useState<number>(
    () =>
      rascunhoM5?.faturamentoAnualProjetado ??
      (config.faturamentoMensal || perfilInicial.faturamentoMensal || 0) * 12,
  )
  const setFaturamentoAnualProjetado = useCallback((v: number) => {
    setEditadoLocalmente((prev) => ({ ...prev, modulo5Faturamento: true }))
    setFaturamentoAnualProjetadoState(v)
  }, [])
  const [setorTransicao, setSetorTransicaoState] = useState<TipoAtividadePrincipal>(() =>
    rascunhoM5
      ? normalizarTipoAtividade(rascunhoM5.setorTransicao)
      : normalizarTipoAtividade(perfilInicial.tipoAtividade),
  )

  const setSetorTransicao = useCallback((novoSector: TipoAtividade) => {
    setEditadoLocalmente((prev) => ({
      ...prev,
      modulo5SetorTransicao: true,
      dashboardSetor: true,
    }))
    setSetorTransicaoState(normalizarTipoAtividade(novoSector))
  }, [])
  // Etapa 5: Valor do estoque na virada (padrão estimado em ~1 a 2 meses de compras da empresa)
  const [valorEstoqueVirada, setValorEstoqueVirada] = useState<number>(() => {
    if (rascunhoM5?.valorEstoqueVirada !== undefined) return rascunhoM5.valorEstoqueVirada
    const isServico = normalizarTipoAtividade(perfilInicial.tipoAtividade) === 'servico'
    if (isServico) return 0
    const fat = perfilInicial.faturamentoMensal || 0
    const pct = (perfilInicial.percentualComprasVendas ?? 0) / 100
    // Estimativa inicial: 1,5 meses de compras
    return Math.round(fat * pct * 1.5)
  })

  // Etapa 4: Split Payment parâmetros
  const [taxaMensalCapitalGiro, setTaxaMensalCapitalGiro] = useState<number>(1.0) // 1.0% a.m. (CDI aproximado)
  const [diasAntecipacaoSplit, setDiasAntecipacaoSplit] = useState<number>(30) // ~30 dias entre nota e guia dia 20

  // Módulo 6: Dashboard filtros
  const [periodoDashboard, setPeriodoDashboard] = useState<'mensal' | 'anual'>('mensal')
  const [regimeAtualFiltro, setRegimeAtualFiltroState] = useState<
    'Lucro Real' | 'Lucro Presumido' | 'Simples Nacional'
  >(() => {
    if (config.regimeAtualEmpresa) return config.regimeAtualEmpresa
    if (perfilInicial.regimeAtual?.includes('Real')) return 'Lucro Real'
    if (perfilInicial.regimeAtual?.includes('Simples')) return 'Simples Nacional'
    return 'Lucro Presumido'
  })

  const setRegimeAtualFiltro = useCallback(
    (r: 'Lucro Real' | 'Lucro Presumido' | 'Simples Nacional') => {
      setEditadoLocalmente((prev) => ({ ...prev, dashboardRegimeAtual: true }))
      setRegimeAtualFiltroState(r)
    },
    [],
  )

  const [anoTransicaoDashboard, setAnoTransicaoDashboardState] = useState<AnoTransicaoIbsCbs>(
    () => config.anoTransicao || 2033,
  )

  const setAnoTransicaoDashboard = useCallback((ano: AnoTransicaoIbsCbs) => {
    setEditadoLocalmente((prev) => ({ ...prev, dashboardAnoTransicao: true }))
    setAnoTransicaoDashboardState(ano)
  }, [])

  // Listener para sincronização automática se o usuário salvar dados em outra aba ou na página /dados-empresa
  React.useEffect(() => {
    const handleSync = () => {
      if (!isAuthenticated) {
        setOrigemDadosEmpresa(false)
        return
      }
      const p = carregarDadosEmpresa()
      setOrigemDadosEmpresa(existeDadosEmpresaSalvos())
    }
    const handleFonteMestra = () => {
      handleSync()
      // Se não houver edições manuais locais nos módulos, propaga os novos valores mestres automaticamente
      const p = carregarDadosEmpresa()
      if (existeDadosEmpresaSalvos()) {
        // Módulo 2: se não editado manualmente, sincroniza faturamento
        setEditadoLocalmente((prev) => {
          if (!prev.modulo2ValorOperacao && p.faturamentoMensal) {
            setValorOperacaoState(p.faturamentoMensal)
          }
          if (!prev.modulo2PercentualCompras && p.percentualComprasVendas !== undefined) {
            setPercentualComprasVendasSimplesState(p.percentualComprasVendas)
          }
          // Módulo 3: se não editado manualmente, sincroniza
          if (!prev.modulo3Faturamento && p.faturamentoMensal) {
            setFaturamentoMensalState(p.faturamentoMensal)
          }
          if (!prev.modulo3PercentualCompras && p.percentualComprasVendas !== undefined) {
            setPercentualComprasVendasComparativoState(p.percentualComprasVendas)
          }
          if (!prev.modulo3TipoAtividade && p.tipoAtividade) {
            setTipoAtividadeState(normalizarTipoAtividade(p.tipoAtividade))
          }
          return prev
        })
      }
    }

    window.addEventListener(STORAGE_EVENT, handleSync)
    window.addEventListener(FONTE_MESTRA_EVENTO, handleFonteMestra)
    return () => {
      window.removeEventListener(STORAGE_EVENT, handleSync)
      window.removeEventListener(FONTE_MESTRA_EVENTO, handleFonteMestra)
    }
  }, [isAuthenticated])

  // Função para obter o snapshot dos parâmetros de entrada atuais
  const obterSnapshotParametros = useCallback((): ParametrosSimulacaoCalculadora => {
    const perfil = isAuthenticated ? carregarDadosEmpresa() : DADOS_EMPRESA_PADRAO
    return {
      config: {
        ...config,
        itensComposicao,
      },
      itensComposicao,
      anoTransicao: config.anoTransicao,
      presetSetor: config.presetSetor,
      valorOperacao,
      regimeOperacao,
      anoOperacao,
      percentualComprasVendasSimples,
      faturamentoMensal,
      tipoAtividade,
      subatividadeServico,
      subatividadeIndustria,
      subatividadeComercio,
      subatividadeAgro,
      subatividadeConstrucao,
      subatividadeLocacao,
      subatividadeFoodService,
      aliquotaImpostoSeletivo,
      proporcaoServicoMisto,
      percentualComprasVendasComparativo,
      percentualComprasVendas: config.percentualComprasVendas ?? percentualComprasVendasComparativo,
      porcentagemComprasSimplesNacional: config.porcentagemComprasSimplesNacional ?? 0,
      percentualComprasSemCredito,
      saldoCredorAcumulado,
      percentualVendasInterestaduais,
      regimeEspecialAtual,
      perfilRetencaoSplit,
      percentualRetencaoSplit,
      folhaPagamentoMensal,
      margemLucroEstimada,
      despesasComCreditosMensais,
      percentualExportacao,
      ufOrigem,
      despesasCreditos,
      faturamentoAnualProjetado,
      setorTransicao,
      valorEstoqueVirada,
      taxaMensalCapitalGiro,
      diasAntecipacaoSplit,
      periodoDashboard,
      regimeAtualFiltro,
      anoTransicaoDashboard,
      empresa: isAuthenticated ? perfil.nomeEmpresa : '',
      cnpj: isAuthenticated ? perfil.cnpj : '',
      nomeContato: isAuthenticated ? perfil.nomeContato : '',
      configuracoesDiagnostico: {
        regimeAtual: perfil.regimeAtual || config.regimeAtualEmpresa || regimeAtualFiltro,
        segmento: perfil.segmento,
        atividadeMista: perfil.atividadeMista ?? config.tipoAtividade === 'misto',
        proporcaoServicoMisto: perfil.proporcaoServicoMisto ?? config.proporcaoServicoMisto,
        anoBaseTransicao:
          perfil.anoBaseTransicao ||
          (typeof config.anoTransicao === 'number' ? config.anoTransicao : 2026),
        ufOrigem: perfil.ufOrigem || ufOrigem,
        cidade: perfil.cidade,
        funcionarios: perfil.funcionarios,
        emissaoNf: perfil.emissaoNf,
        perfilInsumosAliquotaCheia: perfil.perfilInsumosAliquotaCheia,
        perfilInsumosMonofasicos: perfil.perfilInsumosMonofasicos,
        perfilInsumosAliquotaReduzida: perfil.perfilInsumosAliquotaReduzida,
        presencaMonofasicos: perfil.presencaMonofasicos,
        categoriasMonofasicos: perfil.categoriasMonofasicos,
        insumosEnergeticos: perfil.insumosEnergeticos,
        intangiveisRoyalties: perfil.intangiveisRoyalties,
        imobilizadoUltimos5Anos: perfil.imobilizadoUltimos5Anos,
        porcentagemComprasSimplesNacional:
          perfil.porcentagemComprasSimplesNacional ?? config.porcentagemComprasSimplesNacional,
      },
    }
  }, [
    config,
    itensComposicao,
    valorOperacao,
    regimeOperacao,
    anoOperacao,
    percentualComprasVendasSimples,
    faturamentoMensal,
    tipoAtividade,
    subatividadeServico,
    subatividadeIndustria,
    subatividadeComercio,
    subatividadeAgro,
    subatividadeConstrucao,
    subatividadeLocacao,
    subatividadeFoodService,
    aliquotaImpostoSeletivo,
    proporcaoServicoMisto,
    percentualComprasVendasComparativo,
    folhaPagamentoMensal,
    margemLucroEstimada,
    despesasComCreditosMensais,
    percentualExportacao,
    ufOrigem,
    despesasCreditos,
    faturamentoAnualProjetado,
    setorTransicao,
    valorEstoqueVirada,
    taxaMensalCapitalGiro,
    diasAntecipacaoSplit,
    periodoDashboard,
    regimeAtualFiltro,
    anoTransicaoDashboard,
    percentualComprasSemCredito,
    saldoCredorAcumulado,
    percentualVendasInterestaduais,
    regimeEspecialAtual,
    perfilRetencaoSplit,
    percentualRetencaoSplit,
    isAuthenticated,
  ])

  // Função para restaurar integralmente o estado da calculadora a partir de uma simulação salva
  const restaurarSimulacao = useCallback((p: ParametrosSimulacaoCalculadora) => {
    // Ao restaurar uma simulação salva, limpa eventual parâmetro temporário ativo do Radar
    setParametroRadarTemporario(null)
    if (p.config) {
      // Compatibilidade retroativa com simulações antigas que não tinham anoTransicao ou presetSetor
      const tipoAtivRestaurado = normalizarTipoAtividade(p.tipoAtividade || p.config.tipoAtividade)
      const configRestaurada: ConfiguracoesGerais = {
        ...CONFIGURACOES_PADRAO,
        ...p.config,
        tipoAtividade: tipoAtivRestaurado,
        subatividadeServico: p.subatividadeServico || p.config.subatividadeServico,
        subatividadeIndustria: p.subatividadeIndustria || p.config.subatividadeIndustria,
        subatividadeComercio: p.subatividadeComercio || p.config.subatividadeComercio,
        subatividadeAgro: (p as any).subatividadeAgro || p.config.subatividadeAgro,
        subatividadeConstrucao:
          (p as any).subatividadeConstrucao || p.config.subatividadeConstrucao,
        subatividadeLocacao: (p as any).subatividadeLocacao || p.config.subatividadeLocacao,
        subatividadeFoodService:
          (p as any).subatividadeFoodService || p.config.subatividadeFoodService,
        proporcaoServicoMisto: p.proporcaoServicoMisto ?? p.config.proporcaoServicoMisto,
        aliquotaImpostoSeletivo: p.aliquotaImpostoSeletivo ?? p.config.aliquotaImpostoSeletivo,
        porcentagemComprasSimplesNacional:
          p.porcentagemComprasSimplesNacional ??
          p.config.porcentagemComprasSimplesNacional ??
          p.configuracoesDiagnostico?.porcentagemComprasSimplesNacional ??
          0,
        anoTransicao: p.anoTransicao || p.config.anoTransicao,
        presetSetor: (p.presetSetor || p.config.presetSetor) as PresetSetorIbsCbs | undefined,
        etiquetasOrigem: p.config.etiquetasOrigem,
        itensComposicao: p.itensComposicao || p.config.itensComposicao || [],
      }
      setConfig(configRestaurada)
      if (p.itensComposicao && Array.isArray(p.itensComposicao)) {
        setItensComposicao(p.itensComposicao)
      } else if (p.config.itensComposicao && Array.isArray(p.config.itensComposicao)) {
        setItensComposicao(p.config.itensComposicao)
      }
    } else if (p.tipoAtividade) {
      const tipoAtivRestaurado = normalizarTipoAtividade(p.tipoAtividade)
      setConfig((prev) => ({
        ...prev,
        tipoAtividade: tipoAtivRestaurado,
        subatividadeServico: p.subatividadeServico || prev.subatividadeServico,
        subatividadeIndustria: p.subatividadeIndustria || prev.subatividadeIndustria,
        subatividadeComercio: p.subatividadeComercio || prev.subatividadeComercio,
        subatividadeAgro: (p as any).subatividadeAgro || prev.subatividadeAgro,
        subatividadeConstrucao: (p as any).subatividadeConstrucao || prev.subatividadeConstrucao,
        subatividadeLocacao: (p as any).subatividadeLocacao || prev.subatividadeLocacao,
        subatividadeFoodService: (p as any).subatividadeFoodService || prev.subatividadeFoodService,
        proporcaoServicoMisto: p.proporcaoServicoMisto ?? prev.proporcaoServicoMisto,
        aliquotaImpostoSeletivo: p.aliquotaImpostoSeletivo ?? prev.aliquotaImpostoSeletivo,
        porcentagemComprasSimplesNacional:
          p.porcentagemComprasSimplesNacional ??
          p.configuracoesDiagnostico?.porcentagemComprasSimplesNacional ??
          prev.porcentagemComprasSimplesNacional ??
          0,
      }))
    }
    if (p.valorOperacao !== undefined) setValorOperacao(p.valorOperacao)
    if (p.regimeOperacao) {
      // Normalização garantindo compatibilidade com opções antigas e novas
      const regNormalizado = p.regimeOperacao as RegimeDiferenciadoTipo
      setRegimeOperacao(regNormalizado)
    }
    if (p.anoOperacao !== undefined) {
      setAnoOperacao(p.anoOperacao)
    } else if (p.anoTransicao !== undefined) {
      // Fallback para simulações antigas
      setAnoOperacao(p.anoTransicao)
    }
    if (p.percentualComprasVendasSimples !== undefined) {
      setPercentualComprasVendasSimples(p.percentualComprasVendasSimples)
    } else if (p.percentualComprasVendas !== undefined) {
      setPercentualComprasVendasSimples(p.percentualComprasVendas)
    }

    if (p.faturamentoMensal !== undefined) setFaturamentoMensal(p.faturamentoMensal)
    if (p.tipoAtividade) {
      // Fallback gracioso automático para simulações ou links antigos
      setTipoAtividade(normalizarTipoAtividade(p.tipoAtividade))
    }
    if (p.subatividadeServico) setSubatividadeServico(p.subatividadeServico)
    if (p.subatividadeIndustria) setSubatividadeIndustria(p.subatividadeIndustria)
    if (p.subatividadeComercio) setSubatividadeComercio(p.subatividadeComercio)
    if ((p as any).subatividadeAgro) setSubatividadeAgro((p as any).subatividadeAgro)
    if ((p as any).subatividadeConstrucao)
      setSubatividadeConstrucao((p as any).subatividadeConstrucao)
    if ((p as any).subatividadeLocacao) setSubatividadeLocacao((p as any).subatividadeLocacao)
    if ((p as any).subatividadeFoodService)
      setSubatividadeFoodService((p as any).subatividadeFoodService)
    if (p.aliquotaImpostoSeletivo !== undefined)
      setAliquotaImpostoSeletivo(p.aliquotaImpostoSeletivo)
    if (p.proporcaoServicoMisto !== undefined) setProporcaoServicoMisto(p.proporcaoServicoMisto)
    if (p.percentualComprasVendasComparativo !== undefined) {
      setPercentualComprasVendasComparativo(p.percentualComprasVendasComparativo)
    } else if (p.percentualComprasVendas !== undefined) {
      setPercentualComprasVendasComparativo(p.percentualComprasVendas)
    }
    if (p.folhaPagamentoMensal !== undefined) setFolhaPagamentoMensal(p.folhaPagamentoMensal)
    if (p.margemLucroEstimada !== undefined) setMargemLucroEstimada(p.margemLucroEstimada)
    if (p.despesasComCreditosMensais !== undefined)
      setDespesasComCreditosMensais(p.despesasComCreditosMensais)
    if (p.percentualExportacao !== undefined) setPercentualExportacao(p.percentualExportacao)
    if (p.ufOrigem) setUfOrigem(p.ufOrigem)

    if (p.despesasCreditos && Array.isArray(p.despesasCreditos)) {
      // Mescla com CATEGORIAS_CREDITO_PADRAO para que simulações antigas com menos categorias
      // incorporem as novas categorias sem perder as personalizações já salvas
      const mapaSalvas = new Map(p.despesasCreditos.map((c) => [c.id, c]))
      const mescladas = CATEGORIAS_CREDITO_PADRAO.map((catPadrao) => {
        const salva = mapaSalvas.get(catPadrao.id)
        if (salva) {
          return {
            ...catPadrao,
            ...salva,
            // Preserva alíquotas/notas especiais atualizadas se a salva não possuir
            aliquotaNova:
              catPadrao.aliquotaNova !== undefined ? catPadrao.aliquotaNova : salva.aliquotaNova,
            notaEspecial: catPadrao.notaEspecial || salva.notaEspecial,
          }
        }
        return catPadrao
      })
      setDespesasCreditos(mescladas)
    }

    if (p.faturamentoAnualProjetado !== undefined)
      setFaturamentoAnualProjetado(p.faturamentoAnualProjetado)
    if (p.setorTransicao) {
      setSetorTransicao(normalizarTipoAtividade(p.setorTransicao))
    }
    if (p.valorEstoqueVirada !== undefined) setValorEstoqueVirada(p.valorEstoqueVirada)
    if (p.taxaMensalCapitalGiro !== undefined) setTaxaMensalCapitalGiro(p.taxaMensalCapitalGiro)
    if (p.diasAntecipacaoSplit !== undefined) setDiasAntecipacaoSplit(p.diasAntecipacaoSplit)

    if (p.periodoDashboard) setPeriodoDashboard(p.periodoDashboard)
    if (p.regimeAtualFiltro) {
      setRegimeAtualFiltro(p.regimeAtualFiltro)
      if (p.config?.regimeAtualEmpresa === undefined) {
        setConfig((prev) => ({ ...prev, regimeAtualEmpresa: p.regimeAtualFiltro }))
      }
    }
    if (p.anoTransicaoDashboard !== undefined) {
      setAnoTransicaoDashboard(p.anoTransicaoDashboard)
    }

    // Parâmetros Fiscais Avançados (Fase 2)
    const pctComprasSemCredito =
      p.percentualComprasSemCredito ??
      p.config?.percentualComprasSemCredito ??
      p.configuracoesDiagnostico?.percentualComprasSemCredito ??
      0
    setPercentualComprasSemCreditoState(pctComprasSemCredito)

    const saldoCredor =
      p.saldoCredorAcumulado ??
      p.config?.saldoCredorAcumulado ??
      p.configuracoesDiagnostico?.saldoCredorAcumulado ??
      0
    setSaldoCredorAcumuladoState(saldoCredor)

    const pctVendasInter =
      p.percentualVendasInterestaduais ??
      p.config?.percentualVendasInterestaduais ??
      p.configuracoesDiagnostico?.percentualVendasInterestaduais ??
      0
    setPercentualVendasInterestaduaisState(pctVendasInter)

    const regEspecial =
      p.regimeEspecialAtual ??
      p.config?.regimeEspecialAtual ??
      (p.configuracoesDiagnostico?.regimeEspecialAtual as any) ??
      'nenhum'
    setRegimeEspecialAtualState(regEspecial)

    const perfilRetSplit =
      p.perfilRetencaoSplit ??
      p.config?.perfilRetencaoSplit ??
      (p.configuracoesDiagnostico?.perfilRetencaoSplit as any) ??
      'nao'
    setPerfilRetencaoSplitState(perfilRetSplit)

    const pctRetSplit =
      p.percentualRetencaoSplit ??
      p.config?.percentualRetencaoSplit ??
      p.configuracoesDiagnostico?.percentualRetencaoSplit ??
      0
    setPercentualRetencaoSplitState(pctRetSplit)

    // Se a simulação tiver configuracoesDiagnostico salvas, sincroniza com DadosEmpresa
    if (p.configuracoesDiagnostico) {
      // CORREÇÃO (bug de zeramento ao salvar): mescla com a fonte mestra existente.
      // Antes, gravavam-se apenas os campos do snapshot e a fonte mestra perdia
      // porcentagemComprasSimplesNacional (e demais campos não salvos na simulação).
      // Com o campo perdido, a ponderação de crédito voltava a usar a alíquota CHEIA
      // nas compras (como se 100% dos insumos gerassem crédito integral), igualando
      // créditos ao débito e zerando o imposto a recolher — na sessão e ao recarregar.
      const fonteMestraAtual = carregarDadosEmpresa()
      const sincronizacaoEmpresa = {
        ...fonteMestraAtual,
        nomeEmpresa: p.empresa,
        cnpj: p.cnpj,
        nomeContato: p.nomeContato,
        regimeAtual: p.configuracoesDiagnostico.regimeAtual,
        segmento: p.configuracoesDiagnostico.segmento as any,
        atividadeMista: p.configuracoesDiagnostico.atividadeMista,
        proporcaoServicoMisto: p.configuracoesDiagnostico.proporcaoServicoMisto,
        anoBaseTransicao: p.configuracoesDiagnostico.anoBaseTransicao as any,
        ufOrigem: p.configuracoesDiagnostico.ufOrigem,
        cidade: p.configuracoesDiagnostico.cidade,
        funcionarios: p.configuracoesDiagnostico.funcionarios,
        emissaoNf: p.configuracoesDiagnostico.emissaoNf,
        // Preserva o valor ATUAL da fonte mestra (% compras Simples Nacional):
        // o snapshot da simulação só é usado como fallback quando a fonte mestra
        // ainda não conhece o campo. Nunca gravar undefined/0 por cima do valor real.
        porcentagemComprasSimplesNacional:
          fonteMestraAtual.porcentagemComprasSimplesNacional ??
          p.configuracoesDiagnostico.porcentagemComprasSimplesNacional ??
          0,
      }
      salvarDadosEmpresa(sincronizacaoEmpresa)
    }
  }, [])

  // Função para restaurar os dados da empresa especificamente para um módulo
  // Reaproveita setters estáveis (useCallback []) e estado funcional — sem dependências voláteis
  const restaurarDadosEmpresaNoModulo = useCallback(
    (modulo: 1 | 2 | 3 | 4 | 5 | 'split') => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const p = isAuthenticated ? carregarDadosEmpresa() : DADOS_EMPRESA_PADRAO
      if (modulo === 1) {
        setPercentualComprasSemCreditoState(p.percentualComprasSemCredito ?? 0)
        setSaldoCredorAcumuladoState(p.saldoCredorAcumulado ?? 0)
        setPercentualVendasInterestaduaisState(p.percentualVendasInterestaduais ?? 0)
        setRegimeEspecialAtualState(p.regimeEspecialAtual ?? 'nenhum')
        setPerfilRetencaoSplitState(p.perfilRetencaoSplit ?? 'nao')
        setPercentualRetencaoSplitState(p.percentualRetencaoSplit ?? 0)
        setConfig((prev) => ({
          ...prev,
          percentualComprasSemCredito: p.percentualComprasSemCredito ?? 0,
          saldoCredorAcumulado: p.saldoCredorAcumulado ?? 0,
          percentualVendasInterestaduais: p.percentualVendasInterestaduais ?? 0,
          regimeEspecialAtual: p.regimeEspecialAtual ?? 'nenhum',
          perfilRetencaoSplit: p.perfilRetencaoSplit ?? 'nao',
          percentualRetencaoSplit: p.percentualRetencaoSplit ?? 0,
        }))
        setEditadoLocalmente((prev) => ({
          ...prev,
          fase2Parametros: false,
        }))
      } else if (modulo === 2) {
        setValorOperacao(p.faturamentoMensal || 50000)
        setPercentualComprasVendasSimples(p.percentualComprasVendas ?? 40)
        setEditadoLocalmente((prev) => ({
          ...prev,
          modulo2ValorOperacao: false,
          modulo2PercentualCompras: false,
          modulo2AnoOperacao: false,
          modulo2RegimeOperacao: false,
        }))
      } else if (modulo === 3) {
        setFaturamentoMensal(p.faturamentoMensal || 0)
        setTipoAtividade(normalizarTipoAtividade(p.tipoAtividade))
        setSubatividadeServico(p.subatividadeServico || 'servico_comum')
        setSubatividadeIndustria(p.subatividadeIndustria || 'industria_comum')
        setSubatividadeComercio(p.subatividadeComercio || 'varejo_comum')
        if ((p as any).subatividadeAgro) setSubatividadeAgro((p as any).subatividadeAgro)
        if ((p as any).subatividadeConstrucao)
          setSubatividadeConstrucao((p as any).subatividadeConstrucao)
        if ((p as any).subatividadeLocacao) setSubatividadeLocacao((p as any).subatividadeLocacao)
        if ((p as any).subatividadeFoodService)
          setSubatividadeFoodService((p as any).subatividadeFoodService)
        setProporcaoServicoMisto(p.proporcaoServicoMisto ?? 50)
        setPercentualComprasVendasComparativo(p.percentualComprasVendas ?? 0)
        setFolhaPagamentoMensal(p.folhaPagamentoMensal || 0)
        setMargemLucroEstimada(p.margemLucroEstimada ?? 20)
        setDespesasComCreditosMensais(p.despesasComCreditosMensais || 0)
        setPercentualExportacao(p.percentualExportacao ?? 0)
        setUfOrigem(p.ufOrigem || 'SP')
        setEditadoLocalmente((prev) => ({
          ...prev,
          modulo3Faturamento: false,
          modulo3PercentualCompras: false,
          modulo3TipoAtividade: false,
        }))
      } else if (modulo === 4) {
        const despesaPerfil = p.despesasComCreditosMensais || 0
        if (!despesaPerfil) {
          setDespesasCreditos(CATEGORIAS_CREDITO_PADRAO)
        } else {
          const somaPadrao =
            CATEGORIAS_CREDITO_PADRAO.reduce((acc, c) => acc + c.valorMensal, 0) || 1
          const proporcao = despesaPerfil / somaPadrao
          setDespesasCreditos(
            CATEGORIAS_CREDITO_PADRAO.map((item) => ({
              ...item,
              valorMensal: Math.round(item.valorMensal * proporcao),
            })),
          )
        }
        setEditadoLocalmente((prev) => ({
          ...prev,
          modulo4Categorias: false,
        }))
      } else if (modulo === 5) {
        setFaturamentoAnualProjetado(p.faturamentoMensal ? p.faturamentoMensal * 12 : 0)
        const novoSetor = normalizarTipoAtividade(p.tipoAtividade)
        setSetorTransicao(novoSetor)
        if (novoSetor === 'servico') {
          setValorEstoqueVirada(0)
        } else {
          const fat = p.faturamentoMensal || 0
          const pct = (p.percentualComprasVendas ?? 0) / 100
          setValorEstoqueVirada(Math.round(fat * pct * 1.5))
        }
        setEditadoLocalmente((prev) => ({
          ...prev,
          modulo5Faturamento: false,
          modulo5SetorTransicao: false,
        }))
      } else if (modulo === 'split') {
        setPerfilRetencaoSplitState(p.perfilRetencaoSplit ?? 'nao')
        setPercentualRetencaoSplitState(p.percentualRetencaoSplit ?? 0)
        setEditadoLocalmente((prev) => ({
          ...prev,
          fase2Parametros: false,
        }))
      }
    },
    [isAuthenticated],
  )

  // ==========================================
  // CÁLCULO MÓDULO 2 (Calculadora Simples)
  // ==========================================
  const resultadoSimples = useMemo(() => {
    // Ano de operação selecionado para o cálculo da nota
    const ano = anoOperacao || config.anoTransicao || 2033
    const dadosFaseAno = CRONOGRAMA_FASES_TRANSICAO[ano] || CRONOGRAMA_FASES_TRANSICAO[2033]

    // Alíquotas de referência da fase selecionada
    // Se o ano for o mesmo do Módulo 1, usamos as alíquotas configuradas (mantendo possíveis edições manuais)
    const ehMesmoAnoDoModulo1 = config.anoTransicao === ano
    const totalIvaBase = ehMesmoAnoDoModulo1 ? config.totalIvaDual : dadosFaseAno.totalIvaDual
    const cbsBase = ehMesmoAnoDoModulo1 ? config.cbsPadrao : dadosFaseAno.aliquotaCbs
    const ibsBase = ehMesmoAnoDoModulo1 ? config.ibsPadrao : dadosFaseAno.aliquotaIbs

    let aliquotaTotal = totalIvaBase
    let aliqCbs = cbsBase
    let aliqIbs = ibsBase

    // Determina a qual faixa legal o regime pertence (Padrão, Redução 60%, Redução 30%, Alíquota Zero)
    const presetCorrespondente = PRESETS_SETORES_LC214.find((p) => p.id === regimeOperacao)
    const grupo =
      presetCorrespondente?.grupo ||
      (regimeOperacao === 'saude_educacao'
        ? 'reducao_60'
        : regimeOperacao === 'transporte' || regimeOperacao === 'transporte_intelectual'
          ? 'reducao_30'
          : regimeOperacao === 'cesta_basica'
            ? 'aliquota_zero'
            : 'geral')

    if (ano === 'atual') {
      // Regime atual pré-reforma: CBS e IBS são 0%
      aliquotaTotal = 0
      aliqCbs = 0
      aliqIbs = 0
    } else if (grupo === 'reducao_60') {
      if (ehMesmoAnoDoModulo1) {
        aliquotaTotal = config.saudeEducacaoAliquota
      } else {
        aliquotaTotal = Number((totalIvaBase * 0.4).toFixed(2))
      }
      const ratioCbs = totalIvaBase > 0 ? cbsBase / totalIvaBase : 0
      aliqCbs = Number((aliquotaTotal * ratioCbs).toFixed(2))
      aliqIbs = Number((aliquotaTotal - aliqCbs).toFixed(2))
    } else if (grupo === 'reducao_30') {
      if (ehMesmoAnoDoModulo1) {
        aliquotaTotal = config.transporteAliquota
      } else {
        aliquotaTotal = Number((totalIvaBase * 0.7).toFixed(2))
      }
      const ratioCbs = totalIvaBase > 0 ? cbsBase / totalIvaBase : 0
      aliqCbs = Number((aliquotaTotal * ratioCbs).toFixed(2))
      aliqIbs = Number((aliquotaTotal - aliqCbs).toFixed(2))
    } else if (grupo === 'aliquota_zero') {
      aliquotaTotal = 0
      aliqCbs = 0
      aliqIbs = 0
    }

    const valor = Math.max(0, valorOperacao)
    const debitoCbs = (valor * aliqCbs) / 100
    const debitoIbs = (valor * aliqIbs) / 100
    const totalDebito = debitoCbs + debitoIbs

    // Créditos = valor × percentual de compras × alíquota total ponderada da fase
    const pctCompras = Math.max(0, percentualComprasVendasSimples) / 100
    const pctFornecSimples = Math.min(
      1,
      Math.max(0, (config.porcentagemComprasSimplesNacional ?? 0) / 100),
    )
    const anoSimplesNum =
      typeof ano === 'number' ? (ano as AnoBaseSimulacao) : (2033 as AnoBaseSimulacao)
    // Alíquota média do Simples: ajuste do Módulo 1 (por ano/valor único) com
    // fallback para a estimativa padrão — nenhuma fórmula muda.
    const aliqSimplesCreditoModulo2 = obterAliquotaSimplesMediaEfectivaEm(
      anoSimplesNum,
      config.ajusteAliquotaSimplesMedia,
    )
    const aliqEfetivaComprasModulo2 =
      pctFornecSimples > 0
        ? (1 - pctFornecSimples) * totalIvaBase + pctFornecSimples * aliqSimplesCreditoModulo2
        : totalIvaBase
    const valorCreditosApurados = valor * pctCompras * (aliqEfetivaComprasModulo2 / 100)

    // Fase 2: Redução proporcional do crédito por compras sem direito a crédito
    // Regra: crédito efetivo = crédito apurado × (1 − pctComprasSemCredito / 100)
    // Neutralidade: se percentualComprasSemCredito === 0, fator = 1 (idêntico ao legado)
    const fatorCreditoAproveitavel = Math.max(0, 1 - (percentualComprasSemCredito || 0) / 100)
    const valorCreditos = valorCreditosApurados * fatorCreditoAproveitavel

    // A recolher = débito - créditos
    // Fase 2: Se houver saldo credor acumulado e for o primeiro ano (ou operação simples),
    // o saldo credor pode abater o imposto a recolher até zerar (de forma não-negativa)
    const saldoCredorDisponivel = Math.max(0, saldoCredorAcumulado || 0)
    const valorARecolherAntesSaldo = Math.max(0, totalDebito - valorCreditos)
    const valorARecolher = Math.max(0, valorARecolherAntesSaldo - saldoCredorDisponivel)
    const aliquotaEfetiva = valor > 0 ? (valorARecolher / valor) * 100 : 0
    const valorTotalNotaFiscal = valor // No IVA por fora com split payment, o valor bruto da operação é a base

    // Construção da etiqueta legal informativa com indicação da fase/ano
    let etiquetaLegalExibida = ''
    if (ano === 'atual') {
      etiquetaLegalExibida = 'Sistema atual (pré-reforma) · CBS e IBS em 0,00%'
    } else if (presetCorrespondente) {
      etiquetaLegalExibida = `${presetCorrespondente.etiquetaOrigem} · fase ${ano}`
    } else if (regimeOperacao === 'saude_educacao') {
      etiquetaLegalExibida = `LC 214/2025 · redução de 60% · fase ${ano}`
    } else if (regimeOperacao === 'transporte' || regimeOperacao === 'transporte_intelectual') {
      etiquetaLegalExibida = `LC 214/2025 · redução de 30% · fase ${ano}`
    } else if (regimeOperacao === 'cesta_basica') {
      etiquetaLegalExibida = `LC 214/2025 · alíquota zero · fase ${ano}`
    } else {
      etiquetaLegalExibida = `LC 214/2025 · alíquota padrão · fase ${ano}`
    }

    return {
      aliquotaCbsAplicada: aliqCbs,
      aliquotaIbsAplicada: aliqIbs,
      aliquotaTotalAplicada: aliquotaTotal,
      debitoCbs,
      debitoIbs,
      totalDebito,
      valorCreditos,
      valorARecolher,
      aliquotaEfetiva,
      valorTotalNotaFiscal,
      anoOperacao: ano,
      etiquetaLegalExibida,
    }
  }, [
    config,
    valorOperacao,
    regimeOperacao,
    anoOperacao,
    percentualComprasVendasSimples,
    percentualComprasSemCredito,
    saldoCredorAcumulado,
  ])

  // ==========================================
  // CÁLCULO MÓDULO 3 (Comparativo por Regime)
  // ==========================================
  const resultadoComparativo = useMemo(() => {
    const faturamentoBruto = Math.max(0, faturamentoMensal)
    const pctExp = Math.max(0, Math.min(100, percentualExportacao || 0)) / 100
    const receitaExportacao = faturamentoBruto * pctExp
    // Receita tributável no mercado interno (desonerada de exportação)
    const faturamentoInternoTributavel = Math.max(0, faturamentoBruto - receitaExportacao)

    const pctCompras = Math.max(0, percentualComprasVendasComparativo) / 100
    // Compras proporcionais sobre o faturamento total da operação
    const comprasValor = faturamentoBruto * pctCompras
    const despesasCreditos = Math.max(0, despesasComCreditosMensais || 0)
    const folha = Math.max(0, folhaPagamentoMensal || 0)

    // Alíquota de ICMS: se UF for selecionada, usar a alíquota interna padrão da UF; senão usar a do Módulo 1 (config.lucroRealIcms / config.lucroPresumidoIcms)
    let aliqIcmsReal = config.lucroRealIcms
    let aliqIcmsPresumido = config.lucroPresumidoIcms
    let origemIcms = 'Módulo 1 (Configurações Gerais)'

    if (ufOrigem) {
      // Tabela de UFs
      const mapaUf: Record<string, number> = {
        AC: 19,
        AL: 19,
        AM: 20,
        AP: 18,
        BA: 20.5,
        CE: 20,
        DF: 20,
        ES: 17,
        GO: 19,
        MA: 22,
        MG: 18,
        MS: 17,
        MT: 17,
        PA: 19,
        PB: 20,
        PE: 20.5,
        PI: 21,
        PR: 19.5,
        RJ: 20,
        RN: 18,
        RO: 19.5,
        RR: 20,
        RS: 17,
        SC: 17,
        SE: 19,
        SP: 18,
        TO: 20,
      }
      if (mapaUf[ufOrigem]) {
        aliqIcmsReal = mapaUf[ufOrigem]
        aliqIcmsPresumido = mapaUf[ufOrigem]
        origemIcms = `UF de Origem: ${ufOrigem} (${mapaUf[ufOrigem]}%)`
      }
    }

    // Identificação das subatividades ativas
    const infoSubServico =
      SUBATIVIDADES_SERVICO.find((s) => s.id === subatividadeServico) || SUBATIVIDADES_SERVICO[0]
    const infoSubIndustria =
      SUBATIVIDADES_INDUSTRIA.find((s) => s.id === subatividadeIndustria) ||
      SUBATIVIDADES_INDUSTRIA[0]
    const infoSubComercio =
      SUBATIVIDADES_COMERCIO.find((s) => s.id === subatividadeComercio) || SUBATIVIDADES_COMERCIO[0]
    const infoSubAgro =
      SUBATIVIDADES_AGRONEGOCIO.find((s) => s.id === subatividadeAgro) ||
      SUBATIVIDADES_AGRONEGOCIO[0]
    const infoSubConstrucao =
      SUBATIVIDADES_CONSTRUCAO.find((s) => s.id === subatividadeConstrucao) ||
      SUBATIVIDADES_CONSTRUCAO[0]
    const infoSubLocacao =
      SUBATIVIDADES_LOCACAO.find((s) => s.id === subatividadeLocacao) || SUBATIVIDADES_LOCACAO[0]
    const infoSubFoodService =
      SUBATIVIDADES_FOOD_SERVICE.find((s) => s.id === subatividadeFoodService) ||
      SUBATIVIDADES_FOOD_SERVICE[0]

    // Determinar dados conforme o ramo e a subatividade (8 ramos ativos)
    let subatividadeNome = ''
    let presuncaoIrpj = 32
    let presuncaoCsll = 32
    let taxaIpiIcmsIssReal = 0
    let taxaIpiIcmsIssPresumido = 0
    let nomeImpostoIndireto = ''
    let reducaoIbsCbsPct = 0
    let temImpostoSeletivo = false
    let isIcmsSt = false
    const impactosDidaticos: string[] = []

    if (tipoAtividade === 'servico') {
      subatividadeNome = infoSubServico.label
      presuncaoIrpj = infoSubServico.presuncaoIrpj
      presuncaoCsll = infoSubServico.presuncaoCsll
      reducaoIbsCbsPct = infoSubServico.reducaoIbsCbsPercentual || 0

      taxaIpiIcmsIssReal = config.lucroRealIss
      taxaIpiIcmsIssPresumido = config.lucroPresumidoIss
      nomeImpostoIndireto = `ISS (${config.lucroPresumidoIss}%)`

      if (presuncaoIrpj === 16) {
        impactosDidaticos.push(
          'Transporte tem presunção de IRPJ favorecida de 16% (contra 32% dos serviços em geral) no Lucro Presumido.',
        )
      } else {
        impactosDidaticos.push('Presunção padrão de 32% para serviços em geral no Lucro Presumido.')
      }

      if (reducaoIbsCbsPct === 60) {
        impactosDidaticos.push(
          'Benefício do Regime Diferenciado no IBS/CBS: redução legal de 60% na alíquota padrão (EC 132/2023).',
        )
      } else if (reducaoIbsCbsPct === 30) {
        impactosDidaticos.push(
          'Benefício do Regime Diferenciado de Transporte no IBS/CBS: redução legal de 30% na alíquota padrão.',
        )
      }
    } else if (tipoAtividade === 'industria') {
      subatividadeNome = infoSubIndustria.label
      presuncaoIrpj = infoSubIndustria.presuncaoIrpj
      presuncaoCsll = infoSubIndustria.presuncaoCsll
      reducaoIbsCbsPct = infoSubIndustria.reducaoIbsCbsPercentual || 0
      temImpostoSeletivo = !!infoSubIndustria.sujeitoImpostoSeletivo

      const aliqIpi =
        infoSubIndustria.aliquotaIpi !== undefined
          ? infoSubIndustria.aliquotaIpi
          : config.lucroRealIpi
      taxaIpiIcmsIssReal = aliqIpi
      taxaIpiIcmsIssPresumido = aliqIpi
      nomeImpostoIndireto = `IPI (${aliqIpi}%)`

      impactosDidaticos.push(
        `Alíquota de IPI configurada em ${aliqIpi}% para o setor industrial (com crédito integral na compra de insumos no Lucro Real).`,
      )
      if (temImpostoSeletivo) {
        impactosDidaticos.push(
          `Produto sujeito ao Imposto Seletivo ("imposto do pecado" — ${aliquotaImpostoSeletivo}%), mantido no novo sistema sobre bens prejudiciais à saúde/ambiente.`,
        )
      }
    } else if (tipoAtividade === 'comercio') {
      subatividadeNome = infoSubComercio.label
      presuncaoIrpj = infoSubComercio.presuncaoIrpj
      presuncaoCsll = infoSubComercio.presuncaoCsll
      reducaoIbsCbsPct = infoSubComercio.reducaoIbsCbsPercentual || 0

      if (infoSubComercio.id === 'com_icms_st') {
        isIcmsSt = true
        // No ICMS-ST, o ICMS próprio da revenda é praticamente 0% (já recolhido na fonte pelo fabricante)
        taxaIpiIcmsIssReal = 0
        taxaIpiIcmsIssPresumido = 0
        nomeImpostoIndireto = 'ICMS Próprio ≈ 0% (ICMS-ST retido na origem)'
        impactosDidaticos.push(
          'Como sua atividade é comércio com ICMS-ST, o ICMS próprio no sistema antigo é praticamente zero — o imposto já foi pago antecipadamente pelo fabricante. No entanto, o custo vem embutido no preço de compra.',
        )
      } else if (infoSubComercio.aliquotaIcmsOverride !== undefined) {
        taxaIpiIcmsIssReal = infoSubComercio.aliquotaIcmsOverride
        taxaIpiIcmsIssPresumido = infoSubComercio.aliquotaIcmsOverride
        nomeImpostoIndireto = `ICMS Atacado (${infoSubComercio.aliquotaIcmsOverride}%)`
        impactosDidaticos.push(
          `Atacado/Distribuição com alíquota interestadual/reduzida de ICMS (${infoSubComercio.aliquotaIcmsOverride}%).`,
        )
      } else {
        taxaIpiIcmsIssReal = aliqIcmsReal
        taxaIpiIcmsIssPresumido = aliqIcmsPresumido
        nomeImpostoIndireto = `ICMS Varejo (${aliqIcmsReal}%)`
        impactosDidaticos.push(
          `Comércio varejista com ICMS padrão de ${aliqIcmsReal}% (${origemIcms}) e presunção de 8% no Lucro Presumido.`,
        )
      }
    } else if (tipoAtividade === 'agronegocio') {
      subatividadeNome = infoSubAgro.label
      presuncaoIrpj = infoSubAgro.presuncaoIrpj
      presuncaoCsll = infoSubAgro.presuncaoCsll
      reducaoIbsCbsPct = infoSubAgro.reducaoIbsCbsPercentual || 0

      // Agroindústria tem IPI, produção rural tem ICMS interno da UF
      if (infoSubAgro.id === 'agroindustria_processamento') {
        taxaIpiIcmsIssReal = config.lucroRealIpi
        taxaIpiIcmsIssPresumido = config.lucroPresumidoIpi
        nomeImpostoIndireto = `IPI (${config.lucroRealIpi}%)`
        impactosDidaticos.push(
          'Agroindústria: Anexo II do Simples Nacional (Indústria), presunção de 8% no Lucro Presumido e IPI de saída.',
        )
      } else {
        taxaIpiIcmsIssReal = aliqIcmsReal
        taxaIpiIcmsIssPresumido = aliqIcmsPresumido
        nomeImpostoIndireto = `ICMS Agro (${aliqIcmsReal}%)`
        impactosDidaticos.push(
          'Produtor rural PJ / Agro: Anexo I do Simples Nacional (comercialização) com presunção de 8% IRPJ / 12% CSLL.',
        )
      }

      if (reducaoIbsCbsPct === 100) {
        impactosDidaticos.push(
          'Hortifrúti / Cesta Básica Nacional: alíquota ZERO (isenção de 100%) no IBS e na CBS (art. 8º da LC 214/2025).',
        )
      } else if (reducaoIbsCbsPct === 60) {
        impactosDidaticos.push(
          'Agronegócio no IBS/CBS: redução legal de 60% na alíquota padrão com manutenção de créditos (EC 132/2023).',
        )
      }
    } else if (tipoAtividade === 'construcao_civil') {
      subatividadeNome = infoSubConstrucao.label
      presuncaoIrpj = infoSubConstrucao.presuncaoIrpj
      presuncaoCsll = infoSubConstrucao.presuncaoCsll
      reducaoIbsCbsPct = infoSubConstrucao.reducaoIbsCbsPercentual || 0

      taxaIpiIcmsIssReal = config.lucroRealIss
      taxaIpiIcmsIssPresumido = config.lucroPresumidoIss
      nomeImpostoIndireto = `ISS Obras (${config.lucroPresumidoIss}%)`

      if (infoSubConstrucao.id === 'engenharia_projetos') {
        impactosDidaticos.push(
          'Engenharia consultiva e projetos: regidos pelo Fator R (LC 123/2006). Folha ≥ 28% qualifica para o Anexo III; abaixo vai para o Anexo V.',
        )
      } else {
        impactosDidaticos.push(
          'Obras e edificações: enquadramento obrigatório no Anexo IV do Simples Nacional (CPP de 20% patronal recolhida por fora na folha).',
        )
      }
      impactosDidaticos.push(
        'Operações com bens imóveis e obras civis no novo sistema submetem-se ao regime específico (art. 156-A CF) com crédito no destino.',
      )
    } else if (tipoAtividade === 'locacao_bens') {
      subatividadeNome = infoSubLocacao.label
      presuncaoIrpj = infoSubLocacao.presuncaoIrpj
      presuncaoCsll = infoSubLocacao.presuncaoCsll
      reducaoIbsCbsPct = infoSubLocacao.reducaoIbsCbsPercentual || 0

      // Locação pura de bens móveis NÃO tem ISS (Súmula Vinculante 31 STF)
      if (infoSubLocacao.id === 'coworking_espacos') {
        taxaIpiIcmsIssReal = config.lucroRealIss
        taxaIpiIcmsIssPresumido = config.lucroPresumidoIss
        nomeImpostoIndireto = `ISS Coworking (${config.lucroPresumidoIss}%)`
        impactosDidaticos.push(
          'Coworking mescla locação e serviços administrativos: sujeito à regra do Fator R (Anexo III se folha ≥ 28%, Anexo V se < 28%).',
        )
      } else {
        taxaIpiIcmsIssReal = 0
        taxaIpiIcmsIssPresumido = 0
        nomeImpostoIndireto = 'Sem ISS (Súmula Vinculante 31 STF)'
        impactosDidaticos.push(
          'Locação de bens móveis pura: não incide ISS (Súmula Vinculante 31 STF) e enquadra-se no Anexo III do Simples Nacional diretamente.',
        )
      }
      impactosDidaticos.push(
        'No novo IVA Dual, a locação de bens e utilidades passa a ser expressamente tributada pelo IBS/CBS, gerando créditos integrais para clientes PJ.',
      )
    } else if (tipoAtividade === 'food_service') {
      subatividadeNome = infoSubFoodService.label
      presuncaoIrpj = infoSubFoodService.presuncaoIrpj
      presuncaoCsll = infoSubFoodService.presuncaoCsll
      reducaoIbsCbsPct = infoSubFoodService.reducaoIbsCbsPercentual || 0
      temImpostoSeletivo = !!infoSubFoodService.sujeitoImpostoSeletivo

      taxaIpiIcmsIssReal = aliqIcmsReal
      taxaIpiIcmsIssPresumido = aliqIcmsPresumido
      nomeImpostoIndireto = `ICMS Restaurante (${aliqIcmsReal}%)`

      impactosDidaticos.push(
        'Bares e restaurantes: enquadramento no Anexo I do Simples Nacional (refeições equiparadas a comércio) com presunção de 8% no Lucro Presumido.',
      )
      if (temImpostoSeletivo) {
        impactosDidaticos.push(
          `Bebidas alcoólicas sofrem incidência adicional do Imposto Seletivo ("imposto do pecado" — ${aliquotaImpostoSeletivo}%) no novo sistema.`,
        )
      }
      if (infoSubFoodService.id === 'delivery_marmitaria') {
        impactosDidaticos.push(
          'Crédito de 26,5% de IBS/CBS sobre taxas e comissões cobradas por aplicativos de delivery (iFood, etc.), reduzindo o custo operacional.',
        )
      }
    } else {
      // Misto: Serviço + Comércio ponderado pela proporção configurável
      const pServ = Math.max(0, Math.min(100, proporcaoServicoMisto)) / 100
      const pCom = 1 - pServ

      subatividadeNome = `Misto: ${infoSubServico.label} (${Math.round(pServ * 100)}%) + ${infoSubComercio.label} (${Math.round(pCom * 100)}%)`
      presuncaoIrpj = Number(
        (infoSubServico.presuncaoIrpj * pServ + infoSubComercio.presuncaoIrpj * pCom).toFixed(2),
      )
      presuncaoCsll = Number(
        (infoSubServico.presuncaoCsll * pServ + infoSubComercio.presuncaoCsll * pCom).toFixed(2),
      )
      reducaoIbsCbsPct = Number(
        (
          (infoSubServico.reducaoIbsCbsPercentual || 0) * pServ +
          (infoSubComercio.reducaoIbsCbsPercentual || 0) * pCom
        ).toFixed(2),
      )

      let aliqComercioReal = aliqIcmsReal
      let aliqComercioPres = aliqIcmsPresumido
      if (infoSubComercio.id === 'com_icms_st') {
        aliqComercioReal = 0
        aliqComercioPres = 0
        isIcmsSt = true
      } else if (infoSubComercio.aliquotaIcmsOverride !== undefined) {
        aliqComercioReal = infoSubComercio.aliquotaIcmsOverride
        aliqComercioPres = infoSubComercio.aliquotaIcmsOverride
      }

      taxaIpiIcmsIssReal = config.lucroRealIss * pServ + aliqComercioReal * pCom
      taxaIpiIcmsIssPresumido = config.lucroPresumidoIss * pServ + aliqComercioPres * pCom
      nomeImpostoIndireto = `ISS (${Math.round(pServ * 100)}%) + ICMS (${Math.round(pCom * 100)}%)`

      impactosDidaticos.push(
        `Atividade mista calculada proporcionalmente: ${Math.round(pServ * 100)}% Serviço (presunção ${infoSubServico.presuncaoIrpj}%) e ${Math.round(pCom * 100)}% Comércio (presunção ${infoSubComercio.presuncaoIrpj}%).`,
      )
      if (reducaoIbsCbsPct > 0) {
        impactosDidaticos.push(
          `Redução ponderada do IBS/CBS na parte de serviço: ${reducaoIbsCbsPct}% de redução média sobre a receita.`,
        )
      }
      if (isIcmsSt) {
        impactosDidaticos.push(
          'A fração do comércio opera sob regime de ICMS-ST, reduzindo a incidência direta do ICMS próprio para ≈ 0%.',
        )
      }
    }

    // ----------------------------------------------------
    // 1. LUCRO REAL
    // ----------------------------------------------------
    // Margem de lucro: padrão 20% se não especificada
    const margemReal =
      margemLucroEstimada !== undefined && margemLucroEstimada !== null
        ? Math.max(0, margemLucroEstimada)
        : 20
    const margemDecimal = margemReal / 100
    // Lucro efetivo apurado (faturamento total × margem)
    const lucroOperacionalEfetivo = faturamentoBruto * margemDecimal

    // Débitos PIS, COFINS e Indireto sobre a receita tributável (excluindo exportação)
    const lrPisNominal = (faturamentoInternoTributavel * config.lucroRealPis) / 100
    const lrCofinsNominal = (faturamentoInternoTributavel * config.lucroRealCofins) / 100
    const lrIndiretoNominal = (faturamentoInternoTributavel * taxaIpiIcmsIssReal) / 100
    const lrTotalNominal = lrPisNominal + lrCofinsNominal + lrIndiretoNominal

    // Créditos Lucro Real:
    // a) Compras de insumos/mercadorias (PIS 1,65% + COFINS 7,60% + ICMS/IPI conforme atividade)
    // Se for serviço ou locação (sem ICMS/IPI), crédito é PIS/COFINS
    const isAtividadeComercioOuIndustriaOuAgroOuFood =
      tipoAtividade === 'comercio' ||
      tipoAtividade === 'industria' ||
      tipoAtividade === 'agronegocio' ||
      tipoAtividade === 'food_service'

    const aliqCreditoRealCompras = !isAtividadeComercioOuIndustriaOuAgroOuFood
      ? config.lucroRealPis + config.lucroRealCofins
      : isIcmsSt
        ? config.lucroRealPis + config.lucroRealCofins
        : config.lucroRealPis + config.lucroRealCofins + taxaIpiIcmsIssReal
    const creditosComprasReal = (comprasValor * aliqCreditoRealCompras) / 100

    // b) Despesas com créditos mensais (energia, aluguel, insumos operacionais - PIS 1,65% + COFINS 7,60% = 9,25%)
    const aliqPisCofinsReal = config.lucroRealPis + config.lucroRealCofins
    const creditosDespesasReal = (despesasCreditos * aliqPisCofinsReal) / 100

    const lrCreditosTotal = creditosComprasReal + creditosDespesasReal
    const lrTotalEfetivo = Math.max(0, lrTotalNominal - lrCreditosTotal)
    const lrAliqEfetiva = faturamentoBruto > 0 ? (lrTotalEfetivo / faturamentoBruto) * 100 : 0

    // IRPJ/CSLL no Lucro Real (alíquotas oficiais: IRPJ 15% + adicional 10% sobre excedente a 20k + CSLL 9% = ~24% sobre o lucro contábil)
    const irpjCsllRealEstimado =
      lucroOperacionalEfetivo > 0
        ? lucroOperacionalEfetivo * 0.15 +
          Math.max(0, lucroOperacionalEfetivo - 20000) * 0.1 +
          lucroOperacionalEfetivo * 0.09
        : 0

    // ----------------------------------------------------
    // 2. LUCRO PRESUMIDO (Regime cumulativo)
    // ----------------------------------------------------
    // Exportação desonera a base proporcionalmente
    const lpPisNominal = (faturamentoInternoTributavel * config.lucroPresumidoPis) / 100
    const lpCofinsNominal = (faturamentoInternoTributavel * config.lucroPresumidoCofins) / 100
    const lpIndiretoNominal = (faturamentoInternoTributavel * taxaIpiIcmsIssPresumido) / 100
    const lpTotalNominal = lpPisNominal + lpCofinsNominal + lpIndiretoNominal
    const lpCreditos = 0 // Cumulativo: não gera créditos
    const lpTotalEfetivo = lpTotalNominal
    const lpAliqEfetiva = faturamentoBruto > 0 ? (lpTotalEfetivo / faturamentoBruto) * 100 : 0

    // IRPJ e CSLL no Lucro Presumido com base na presunção da subatividade
    // Base IRPJ = Receita * presunção IRPJ %; IRPJ = 15% + 10% adicional
    // Base CSLL = Receita * presunção CSLL %; CSLL = 9%
    const basePresumidaIrpj = (faturamentoInternoTributavel * presuncaoIrpj) / 100
    const basePresumidaCsll = (faturamentoInternoTributavel * presuncaoCsll) / 100
    const irpjPresumido = basePresumidaIrpj * 0.15 + Math.max(0, basePresumidaIrpj - 20000) * 0.1
    const csllPresumido = basePresumidaCsll * 0.09
    const irpjCsllPresumidoEstimado = irpjPresumido + csllPresumido

    // ----------------------------------------------------
    // 3. SIMPLES NACIONAL (com Fator R real e Anexos III vs V)
    // ----------------------------------------------------
    const rbt12 = faturamentoBruto * 12
    const folha12 = folha * 12
    const fatorR = faturamentoBruto > 0 ? folha / faturamentoBruto : 0
    const fatorRPercent = Math.round(fatorR * 1000) / 10
    const qualificaAnexoIII = fatorR >= 0.28

    let tabelaSimples = TABELAS_SIMPLES.anexoIII
    let faixaNome = 'Anexo III'
    let anexoCod = 'Anexo III'

    if (tipoAtividade === 'comercio') {
      tabelaSimples = TABELAS_SIMPLES.anexoI
      faixaNome = 'Anexo I (Comércio)'
      anexoCod = 'Anexo I'
    } else if (tipoAtividade === 'industria') {
      tabelaSimples = TABELAS_SIMPLES.anexoII
      faixaNome = 'Anexo II (Indústria)'
      anexoCod = 'Anexo II'
    } else if (tipoAtividade === 'servico') {
      // Serviços gerais sujeitos ao Fator R (LC 123/2006)
      if (qualificaAnexoIII) {
        tabelaSimples = TABELAS_SIMPLES.anexoIII
        faixaNome = `Anexo III (Fator R = ${fatorRPercent}% ≥ 28% — benefício conquistado)`
        anexoCod = 'Anexo III'
      } else {
        tabelaSimples = TABELAS_SIMPLES.anexoV
        faixaNome = `Anexo V (Fator R = ${fatorRPercent}% < 28% — alíquota onerada)`
        anexoCod = 'Anexo V'
      }
    } else if (tipoAtividade === 'agronegocio') {
      if (infoSubAgro.id === 'agroindustria_processamento') {
        tabelaSimples = TABELAS_SIMPLES.anexoII
        faixaNome = 'Anexo II (Agroindústria)'
        anexoCod = 'Anexo II'
      } else {
        tabelaSimples = TABELAS_SIMPLES.anexoI
        faixaNome = 'Anexo I (Agronegócio / Venda de Produção)'
        anexoCod = 'Anexo I'
      }
    } else if (tipoAtividade === 'construcao_civil') {
      if (infoSubConstrucao.id === 'engenharia_projetos') {
        if (qualificaAnexoIII) {
          tabelaSimples = TABELAS_SIMPLES.anexoIII
          faixaNome = `Anexo III (Engenharia — Fator R = ${fatorRPercent}% ≥ 28%)`
          anexoCod = 'Anexo III'
        } else {
          tabelaSimples = TABELAS_SIMPLES.anexoV
          faixaNome = `Anexo V (Engenharia — Fator R = ${fatorRPercent}% < 28%)`
          anexoCod = 'Anexo V'
        }
      } else {
        tabelaSimples = TABELAS_SIMPLES.anexoIV
        faixaNome = 'Anexo IV (Construção Civil — Obras e Instalações)'
        anexoCod = 'Anexo IV'
      }
    } else if (tipoAtividade === 'locacao_bens') {
      if (infoSubLocacao.id === 'coworking_espacos') {
        if (qualificaAnexoIII) {
          tabelaSimples = TABELAS_SIMPLES.anexoIII
          faixaNome = `Anexo III (Coworking — Fator R = ${fatorRPercent}% ≥ 28%)`
          anexoCod = 'Anexo III'
        } else {
          tabelaSimples = TABELAS_SIMPLES.anexoV
          faixaNome = `Anexo V (Coworking — Fator R = ${fatorRPercent}% < 28%)`
          anexoCod = 'Anexo V'
        }
      } else {
        tabelaSimples = TABELAS_SIMPLES.anexoIII
        faixaNome = 'Anexo III (Locação de Bens Móveis — Sem ISS Súmula 31)'
        anexoCod = 'Anexo III'
      }
    } else if (tipoAtividade === 'food_service') {
      tabelaSimples = TABELAS_SIMPLES.anexoI
      faixaNome = 'Anexo I (Bares e Restaurantes)'
      anexoCod = 'Anexo I'
    } else {
      // Misto: ponderação entre Comércio (Anexo I) e Serviço (Anexo III ou V conforme Fator R)
      const pServ = Math.max(0, Math.min(100, proporcaoServicoMisto)) / 100
      const tabServico = qualificaAnexoIII ? TABELAS_SIMPLES.anexoIII : TABELAS_SIMPLES.anexoV
      const anexoServNome = qualificaAnexoIII ? 'Anexo III' : 'Anexo V'
      tabelaSimples = tabServico
      faixaNome = `Misto: Anexo I (${Math.round((1 - pServ) * 100)}%) + ${anexoServNome} (${Math.round(pServ * 100)}%)`
      anexoCod = `Misto (I + ${anexoServNome})`
    }

    let snAliqEfetiva = 0
    if (rbt12 <= 4800000 && rbt12 > 0) {
      if (tipoAtividade === 'misto') {
        const pServ = Math.max(0, Math.min(100, proporcaoServicoMisto)) / 100
        const pCom = 1 - pServ
        const tabServ = qualificaAnexoIII ? TABELAS_SIMPLES.anexoIII : TABELAS_SIMPLES.anexoV
        const fServ = tabServ.find((f) => rbt12 <= f.max) || tabServ[tabServ.length - 1]
        const fCom =
          TABELAS_SIMPLES.anexoI.find((f) => rbt12 <= f.max) ||
          TABELAS_SIMPLES.anexoI[TABELAS_SIMPLES.anexoI.length - 1]
        const aliqServ = Math.max(0, ((rbt12 * (fServ.aliq / 100) - fServ.deducao) / rbt12) * 100)
        const aliqCom = Math.max(0, ((rbt12 * (fCom.aliq / 100) - fCom.deducao) / rbt12) * 100)
        snAliqEfetiva = aliqServ * pServ + aliqCom * pCom
      } else {
        const faixa =
          tabelaSimples.find((f) => rbt12 <= f.max) || tabelaSimples[tabelaSimples.length - 1]
        snAliqEfetiva = Math.max(0, ((rbt12 * (faixa.aliq / 100) - faixa.deducao) / rbt12) * 100)
      }
    } else if (rbt12 > 4800000) {
      // Excedente ao teto do Simples Nacional
      snAliqEfetiva = 19.0
      faixaNome = 'Excede o sublimite/teto de R$ 4,8M/ano'
    }

    // A receita de exportação é imune no Simples Nacional (LC 123/2006 art. 18 § 4º-A)
    // Assim, a alíquota incide sobre o faturamento tributável no mercado interno
    const snTotalEfetivo = (faturamentoInternoTributavel * snAliqEfetiva) / 100
    const snPis = snTotalEfetivo * 0.05
    const snCofins = snTotalEfetivo * 0.15
    const snIndireto = snTotalEfetivo * 0.35
    const snCreditos = 0
    const snAliqEfetivaSobreTotal =
      faturamentoBruto > 0 ? (snTotalEfetivo / faturamentoBruto) * 100 : 0

    // ----------------------------------------------------
    // 4. IBS / CBS (Novo IVA Dual)
    // ----------------------------------------------------
    // Incide sobre o faturamento tributável interno (exportações são 100% imunes com manutenção plena de créditos)
    // Aplicar a redução legal do regime diferenciado se a subatividade tiver redução (ex: 60% saúde/educação/TI, 30% transporte)
    const fatorAliquotaIbsCbs = Math.max(0, 1 - reducaoIbsCbsPct / 100)
    const aliquotaCbsEfetivaSaida = config.cbsPadrao * fatorAliquotaIbsCbs
    const aliquotaIbsEfetivaSaida = config.ibsPadrao * fatorAliquotaIbsCbs
    const aliquotaIvaDualEfetivaSaida = config.totalIvaDual * fatorAliquotaIbsCbs

    const cbsNominal = (faturamentoInternoTributavel * aliquotaCbsEfetivaSaida) / 100
    const ibsNominal = (faturamentoInternoTributavel * aliquotaIbsEfetivaSaida) / 100

    // Imposto Seletivo: caso a subatividade seja produto com IS
    const aliqIsEfetiva = temImpostoSeletivo ? Math.max(0, aliquotaImpostoSeletivo) : 0
    const valorImpostoSeletivo = (faturamentoInternoTributavel * aliqIsEfetiva) / 100

    const ibsCbsTotalNominal = cbsNominal + ibsNominal + valorImpostoSeletivo

    // Créditos plenos do IVA Dual:
    // a) Compras sobre vendas ponderadas pelo % de compras do Simples Nacional (LC 214/2025)
    const pctFornecSimplesComp = Math.min(
      1,
      Math.max(0, (config.porcentagemComprasSimplesNacional ?? 0) / 100),
    )
    const anoTransicaoComp =
      typeof config.anoTransicao === 'number'
        ? (config.anoTransicao as AnoBaseSimulacao)
        : (2033 as AnoBaseSimulacao)
    // Alíquota média do Simples: ajuste do Módulo 1 (por ano/valor único) com
    // fallback para a estimativa padrão — nenhuma fórmula muda.
    const aliqSimplesCreditoModulo3 = obterAliquotaSimplesMediaEfectivaEm(
      anoTransicaoComp,
      config.ajusteAliquotaSimplesMedia,
    )
    const aliqEfetivaComprasModulo3 =
      pctFornecSimplesComp > 0
        ? (1 - pctFornecSimplesComp) * config.totalIvaDual +
          pctFornecSimplesComp * aliqSimplesCreditoModulo3
        : config.totalIvaDual
    const creditosComprasIbsCbsBruto = (comprasValor * aliqEfetivaComprasModulo3) / 100
    // Fase 2: Redução de créditos por compras sem direito a crédito
    // Regra: crédito efetivo = crédito apurado × (1 − pctComprasSemCredito / 100)
    const fatorCreditoAproveitavel = Math.max(0, 1 - (percentualComprasSemCredito || 0) / 100)
    const creditosComprasIbsCbs = creditosComprasIbsCbsBruto * fatorCreditoAproveitavel

    // b) Despesas com créditos informadas (despesas × taxa total do IVA Dual padrão)
    const creditosDespesasIbsCbs = (despesasCreditos * config.totalIvaDual) / 100
    const ibsCbsCreditosTotal = creditosComprasIbsCbs + creditosDespesasIbsCbs

    // Fase 2: Alocação interestadual (DIFAL / destino do IBS):
    // percentualVendasInterestaduais aloca a parcela do imposto sobre operações interestaduais
    // para o Estado de destino. Em termos de apuração líquida da empresa, o total recolhido
    // permanece o mesmo princípio do IVA no destino, mas a distribuição da arrecadação é separada
    const parcelaInterestadual =
      (faturamentoInternoTributavel *
        Math.min(100, Math.max(0, percentualVendasInterestaduais || 0))) /
      100
    const ibsDestinoEstimado = (parcelaInterestadual * aliquotaIbsEfetivaSaida) / 100

    const ibsCbsTotalEfetivo = Math.max(0, ibsCbsTotalNominal - ibsCbsCreditosTotal)
    const ibsCbsAliqEfetiva =
      faturamentoBruto > 0 ? (ibsCbsTotalEfetivo / faturamentoBruto) * 100 : 0

    // Comparativo e ranking: em 2026 ou ano atual, IBS/CBS não concorre no regime recomendado (art. 348 LC 214/2025)
    const ehAno2026OuAtualComparativo =
      config.anoTransicao === 'atual' || String(config.anoTransicao) === '2026'

    const cenarios = [
      { nome: 'Lucro Real', total: lrTotalEfetivo, aliq: lrAliqEfetiva },
      { nome: 'Lucro Presumido', total: lpTotalEfetivo, aliq: lpAliqEfetiva },
      { nome: 'Simples Nacional', total: snTotalEfetivo, aliq: snAliqEfetivaSobreTotal },
      ...(ehAno2026OuAtualComparativo
        ? []
        : [{ nome: 'IBS/CBS', total: ibsCbsTotalEfetivo, aliq: ibsCbsAliqEfetiva }]),
    ]

    // Ramo do Simples Nacional na Reforma Tributária (LC 214/2025):
    // Quando o regime da empresa for Simples Nacional ou para comparação dedicada:
    // Deriva fator de redução setorial se o preset ou atividade possuir desoneração
    let fatorReducaoSetorialSimples = 1.0
    if (config.presetSetor && config.presetSetor !== 'nenhum') {
      const presetInfo = PRESETS_SETORES_LC214[config.presetSetor]
      if (presetInfo) {
        fatorReducaoSetorialSimples = Math.max(0, 1 - (presetInfo.reducaoPercentual || 0) / 100)
      }
    } else if (reducaoIbsCbsPct > 0) {
      fatorReducaoSetorialSimples = Math.max(0, 1 - reducaoIbsCbsPct / 100)
    }

    const simplesReformaCalculado = calcularIbsCbsSimplesNacional({
      faturamentoMensal: faturamentoBruto,
      aliquotaEfetivaAtualSimples: snAliqEfetivaSobreTotal,
      ano: (config.anoTransicao as AnoBaseSimulacao | 'atual') || 2033,
      fatorReducaoSetorial: fatorReducaoSetorialSimples,
      percentualExportacao,
    })

    const isRegimeSimplesSelecionado = config.regimeAtualEmpresa === 'Simples Nacional'

    const cenariosOrdenados = [...cenarios].sort((a, b) => a.total - b.total)
    const melhor = cenariosOrdenados[0]
    const pior = cenariosOrdenados[cenariosOrdenados.length - 1]
    const economia = Math.max(0, pior.total - melhor.total)
    const economiaPct = pior.total > 0 ? (economia / pior.total) * 100 : 0

    // Se o regime atual for Simples Nacional, o melhor cenário e pior cenário do comparativo
    // podem contrapor o DAS atual versus o cenário da transição do Simples
    let regimeMaisVantajosoFinal = melhor.nome
    let piorCenarioFinal = pior.nome
    let economiaFinal = economia
    let economiaPctFinal = economiaPct

    if (isRegimeSimplesSelecionado) {
      if (ehAno2026OuAtualComparativo) {
        regimeMaisVantajosoFinal = 'Simples Nacional (DAS atual)'
        piorCenarioFinal = 'Simples Nacional'
        economiaFinal = 0
        economiaPctFinal = 0
      } else {
        const transicaoMenorQueDas =
          simplesReformaCalculado.cenarioTransicaoTotal < simplesReformaCalculado.dasAtualTotal
        if (transicaoMenorQueDas) {
          regimeMaisVantajosoFinal = 'Simples na Reforma (Transição)'
          piorCenarioFinal = 'DAS Atual'
          economiaFinal = simplesReformaCalculado.economiaMensal
          economiaPctFinal = Math.abs(simplesReformaCalculado.variacaoPercentual)
        } else if (
          simplesReformaCalculado.cenarioTransicaoTotal > simplesReformaCalculado.dasAtualTotal
        ) {
          regimeMaisVantajosoFinal = 'DAS Atual (Mais Econômico)'
          piorCenarioFinal = 'Simples na Reforma (Transição)'
          economiaFinal = simplesReformaCalculado.diferencaMensal
          economiaPctFinal = simplesReformaCalculado.variacaoPercentual
        } else {
          regimeMaisVantajosoFinal = 'Simples Nacional (Equivalente)'
          piorCenarioFinal = 'Simples Nacional'
          economiaFinal = 0
          economiaPctFinal = 0
        }
      }
    }

    return {
      lucroReal: {
        pisOuCbs: lrPisNominal,
        cofinsOuIbs: lrCofinsNominal,
        ipiOuIcmsOuIss: lrIndiretoNominal,
        totalNominal: lrTotalNominal,
        creditos: lrCreditosTotal,
        totalEfetivo: lrTotalEfetivo,
        aliquotaEfetiva: lrAliqEfetiva,
        detalheImpostos: `PIS ${config.lucroRealPis}% + COFINS ${config.lucroRealCofins}% + ${nomeImpostoIndireto}`,
      },
      lucroPresumido: {
        pisOuCbs: lpPisNominal,
        cofinsOuIbs: lpCofinsNominal,
        ipiOuIcmsOuIss: lpIndiretoNominal,
        totalNominal: lpTotalNominal,
        creditos: lpCreditos,
        totalEfetivo: lpTotalEfetivo,
        aliquotaEfetiva: lpAliqEfetiva,
        detalheImpostos: `PIS ${config.lucroPresumidoPis}% + COFINS ${config.lucroPresumidoCofins}% + ${nomeImpostoIndireto} (Sem créditos)`,
      },
      simplesNacional: {
        pisOuCbs: snPis,
        cofinsOuIbs: snCofins,
        ipiOuIcmsOuIss: snIndireto,
        totalNominal: snTotalEfetivo,
        creditos: snCreditos,
        totalEfetivo: snTotalEfetivo,
        aliquotaEfetiva: snAliqEfetivaSobreTotal,
        detalheImpostos: `Guia única DAS (${faixaNome})`,
        faixaEncontrada: faixaNome,
        fatorR: fatorRPercent,
        anexoUtilizado: anexoCod,
      },
      ibsCbs: {
        pisOuCbs: cbsNominal,
        cofinsOuIbs: ibsNominal,
        ipiOuIcmsOuIss: valorImpostoSeletivo,
        impostoSeletivo: valorImpostoSeletivo,
        totalNominal: ibsCbsTotalNominal,
        creditos: ibsCbsCreditosTotal,
        totalEfetivo: ibsCbsTotalEfetivo,
        aliquotaEfetiva: ibsCbsAliqEfetiva,
        reducaoAplicadaPercentual: reducaoIbsCbsPct,
        detalheImpostos:
          reducaoIbsCbsPct > 0
            ? `CBS (${aliquotaCbsEfetivaSaida.toFixed(2)}%) + IBS (${aliquotaIbsEfetivaSaida.toFixed(2)}%) com redução de ${reducaoIbsCbsPct}%${temImpostoSeletivo ? ` + IS (${aliqIsEfetiva}%)` : ''}`
            : `CBS ${config.cbsPadrao}% + IBS ${config.ibsPadrao}%${temImpostoSeletivo ? ` + IS (${aliqIsEfetiva}%)` : ''} (Crédito amplo)`,
      },
      simplesReforma: simplesReformaCalculado,
      regimeMaisVantajoso: regimeMaisVantajosoFinal,
      piorCenario: piorCenarioFinal,
      economiaVersusPior: economiaFinal,
      economiaPercentual: economiaPctFinal,
      dadosAdicionais: {
        fatorR,
        fatorRPercent,
        fatorRQualificaAnexoIII: qualificaAnexoIII,
        margemLucroEfetiva: margemReal,
        creditosDespesasReal,
        creditosDespesasIbsCbs,
        aliquotaIcmsAplicada: aliqIcmsReal,
        origemIcms,
        receitaExportacaoIsenta: receitaExportacao,
        receitaTributavelInterna: faturamentoInternoTributavel,
        subatividadeAtivaNome: subatividadeNome,
        presuncaoIrpjAplicada: presuncaoIrpj,
        presuncaoCsllAplicada: presuncaoCsll,
        irpjCsllPresumidoEstimado,
        irpjCsllRealEstimado,
        sujeitoImpostoSeletivo: temImpostoSeletivo,
        isIcmsSubstituicaoTributaria: isIcmsSt,
        impactosDidaticosSubatividade: impactosDidaticos,
        parcelaInterestadual,
        ibsDestinoEstimado,
      },
    }
  }, [
    config,
    faturamentoMensal,
    tipoAtividade,
    subatividadeServico,
    subatividadeIndustria,
    subatividadeComercio,
    subatividadeAgro,
    subatividadeConstrucao,
    subatividadeLocacao,
    subatividadeFoodService,
    aliquotaImpostoSeletivo,
    proporcaoServicoMisto,
    percentualComprasVendasComparativo,
    folhaPagamentoMensal,
    margemLucroEstimada,
    despesasComCreditosMensais,
    percentualExportacao,
    ufOrigem,
    percentualComprasSemCredito,
    percentualVendasInterestaduais,
  ])

  // ==========================================
  // CÁLCULO MÓDULO 4 (Simulador de Créditos)
  // ==========================================
  const resultadoCreditos = useMemo(() => {
    // Respeita o Ano da Operação definido no Módulo 2
    const ano = anoOperacao || config.anoTransicao || 2033
    const dadosFaseAno = CRONOGRAMA_FASES_TRANSICAO[ano] || CRONOGRAMA_FASES_TRANSICAO[2033]
    const ehMesmoAnoDoModulo1 = config.anoTransicao === ano
    // Se for o mesmo ano do Módulo 1, preserva qualquer personalização direta de config.totalIvaDual;
    // se for outro ano do Módulo 2, usa a alíquota oficial totalIvaDual da fase correspondente do cronograma
    const aliquotaReferenciaFase = ehMesmoAnoDoModulo1
      ? config.totalIvaDual
      : dadosFaseAno.totalIvaDual

    // Regra legal LC 214/2025: grupo Alíquota Zero no Módulo 2 zera créditos das 18 categorias
    const grupoRegime = obterGrupoRegimeOperacao(regimeOperacao)
    const isAliquotaZero = grupoRegime === 'aliquota_zero'

    let totalAntigo = 0
    let totalNovo = 0

    despesasCreditos.forEach((item) => {
      const v = Math.max(0, item.valorMensal)
      const cAntigo = (v * item.aliquotaAntiga) / 100
      // Quando o regime for de alíquota zero (arts. 8º, 129 e 146 da LC 214/2025), o crédito novo é zerado (0%)
      // Para demais regimes, respeita override específico (ex: tarifas bancárias) ou a alíquota da fase
      const aliqNova = isAliquotaZero
        ? 0
        : item.aliquotaNova !== undefined
          ? item.aliquotaNova
          : aliquotaReferenciaFase
      const cNovo = (v * aliqNova) / 100
      totalAntigo += cAntigo
      totalNovo += cNovo
    })

    const adicionalGanho = totalNovo - totalAntigo
    const aumentoPercentual = totalAntigo > 0 ? (adicionalGanho / totalAntigo) * 100 : 0
    const economiaAnual = adicionalGanho * 12

    return {
      totalAntigo,
      totalNovo,
      adicionalGanho,
      aumentoPercentual,
      economiaAnual,
      anoOperacao: ano,
      aliquotaReferencia: aliquotaReferenciaFase,
      regimeOperacao,
      grupoRegime,
      isAliquotaZero,
    }
  }, [despesasCreditos, anoOperacao, config.anoTransicao, config.totalIvaDual, regimeOperacao])

  // ==========================================
  // ETAPA 3: ALERTAS DE LIMITES DO SIMPLES NACIONAL
  // ==========================================
  const alertaLimitesSimples = useMemo(() => {
    // Considera o faturamento anual projetado (ou faturamentoMensal × 12)
    const fatAnual = Math.max(0, faturamentoMensal * 12)
    const TETO = 4800000 // R$ 4,8 milhões/ano
    const SUBLIMITE = 3600000 // R$ 3,6 milhões/ano

    const pctTeto = (fatAnual / TETO) * 100
    const pctSublimite = (fatAnual / SUBLIMITE) * 100

    const margemRestanteTeto = Math.max(0, TETO - fatAnual)
    const margemRestanteSublimite = Math.max(0, SUBLIMITE - fatAnual)

    // Status do Teto (R$ 4,8M):
    // Verde: < 90% (< 4.320.000)
    // Amarelo: >= 90% e <= 100% (4.320.000 a 4.800.000)
    // Vermelho: > 100% (> 4.800.000)
    let statusTeto: 'verde' | 'amarelo' | 'vermelho' = 'verde'
    let mensagemTeto = 'Faturamento dentro do limite legal do Simples Nacional.'

    if (fatAnual > TETO) {
      statusTeto = 'vermelho'
      const excesso = fatAnual - TETO
      mensagemTeto = `Desenquadramento obrigatório do Simples Nacional! Faturamento anual projetado excede o teto de R$ 4.800.000 em R$ ${excesso.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. A empresa deve migrar para o Lucro Presumido, Lucro Real ou IBS/CBS.`
    } else if (pctTeto >= 90) {
      statusTeto = 'amarelo'
      mensagemTeto = `Atenção: faturamento anual projetado atingiu ${pctTeto.toFixed(1)}% do teto do Simples (R$ 4.800.000). Margem restante de segurança de R$ ${margemRestanteTeto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} antes do desenquadramento obrigatório.`
    }

    // Status do Sublimite (R$ 3,6M):
    // Verde: < 90% (< 3.240.000)
    // Amarelo: >= 90% e <= 100%
    // Vermelho: > 100% (Simples Híbrido)
    let statusSublimite: 'verde' | 'amarelo' | 'vermelho' = 'verde'
    let mensagemSublimite = 'ICMS e ISS recolhidos unificados na guia DAS do Simples.'

    const isHibrido = fatAnual > SUBLIMITE && fatAnual <= TETO
    const isDesenquadrado = fatAnual > TETO

    if (fatAnual > SUBLIMITE) {
      statusSublimite = 'vermelho'
      mensagemSublimite = `Empresa no "Simples Híbrido": faturamento anual supera o sublimite de R$ 3.600.000. O ICMS estadual e o ISS municipal deixam de ser recolhidos na guia DAS unificada e passam a ser apurados por fora (débito/crédito regular), o que altera a competitividade frente ao novo IBS/CBS.`
    } else if (pctSublimite >= 90) {
      statusSublimite = 'amarelo'
      mensagemSublimite = `Aproximando do sublimite de R$ 3.600.000 (${pctSublimite.toFixed(1)}%). Restam R$ ${margemRestanteSublimite.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} antes de passar a recolher ICMS e ISS por fora da guia do Simples.`
    }

    return {
      faturamentoAnualProjetado: fatAnual,
      statusTeto,
      statusSublimite,
      tetoMaximo: TETO,
      sublimiteMaximo: SUBLIMITE,
      margemRestanteTeto,
      margemRestanteSublimite,
      percentualAtingidoTeto: Number(pctTeto.toFixed(1)),
      percentualAtingidoSublimite: Number(pctSublimite.toFixed(1)),
      mensagemTeto,
      mensagemSublimite,
      isHibrido,
      isDesenquadrado,
    }
  }, [faturamentoMensal])

  // ==========================================
  // ETAPA 4: SPLIT PAYMENT (IMPACTO NO FLUXO DE CAIXA)
  // ==========================================
  const resultadoSplitPayment = useMemo(() => {
    const anoAtualSplit = anoTransicaoDashboard ?? config.anoTransicao ?? 2033
    const is2026OuAtualSplit = anoAtualSplit === 'atual' || String(anoAtualSplit) === '2026'

    // No IBS/CBS, o imposto bruto é retido diretamente na liquidação da nota/pagamento bancário
    // Valor mensal retido na nota (split payment bruto da saída)
    const fatInterno =
      resultadoComparativo.dadosAdicionais?.receitaTributavelInterna ?? faturamentoMensal
    const aliqTotalIbsCbs = config.totalIvaDual // 26,50%
    const fatorReducao = Math.max(
      0,
      1 - (resultadoComparativo.ibsCbs.reducaoAplicadaPercentual || 0) / 100,
    )
    const aliquotaSaidaEfetiva = aliqTotalIbsCbs * fatorReducao

    // Fase 2: Split payment modulado pelo perfil de retenção e percentual de retenção
    // Regra: quando o perfil de retenção indicar que clientes retêm, ajustar o split payment pelo % de retenção informado
    // Se perfil = 'nao', o padrão é a alíquota cheia legal do IVA (100% da alíquota da saída)
    // Se perfil for 'sim_todos' ou 'parcial', o percentual informado (ex: 20% ou 100%) modula a retenção efetiva.
    // Neutralidade: perfil 'nao' ou percentual = 0 preserva rigorosamente a retenção total integral.
    let fatorAjusteRetencao = 1.0
    if (perfilRetencaoSplit === 'sim_todos') {
      // 100% retido ou percentual se especificado
      if (percentualRetencaoSplit && percentualRetencaoSplit > 0) {
        fatorAjusteRetencao = Math.min(1, Math.max(0, percentualRetencaoSplit / 100))
      }
    } else if (perfilRetencaoSplit === 'parcial') {
      if (percentualRetencaoSplit && percentualRetencaoSplit > 0) {
        fatorAjusteRetencao = Math.min(1, Math.max(0, percentualRetencaoSplit / 100))
      }
    }

    // Retenção imediata no momento da nota / recebimento
    // Na prática do split payment inteligente, o sistema retém o valor apurado ou o débito destacado da nota
    const retencaoMensalNota = ((fatInterno * aliquotaSaidaEfetiva) / 100) * fatorAjusteRetencao

    // No sistema atual, o recolhimento se dá pela guia mensal (DAS no Simples dia 20, DARF PIS/COFINS dia 25, etc.)
    // Usamos o total efetivo apurado do regime atual selecionado
    let recolhimentoAtualMensal = resultadoComparativo.simplesNacional.totalEfetivo
    if (regimeAtualFiltro === 'Lucro Real') {
      recolhimentoAtualMensal = resultadoComparativo.lucroReal.totalEfetivo
    } else if (regimeAtualFiltro === 'Lucro Presumido') {
      recolhimentoAtualMensal = resultadoComparativo.lucroPresumido.totalEfetivo
    }

    // Diferença imediata no caixa: no split payment o dinheiro nem cai na conta corrente da empresa
    const diferencaFluxoCaixa = retencaoMensalNota - recolhimentoAtualMensal

    // Custo de oportunidade / capital de giro da antecipação
    const taxaDecimal = Math.max(0, taxaMensalCapitalGiro) / 100
    const fatorTempo = Math.max(1, diasAntecipacaoSplit) / 30
    const custoCapitalMensal = is2026OuAtualSplit
      ? 0
      : retencaoMensalNota * taxaDecimal * fatorTempo
    const custoCapitalAnual = custoCapitalMensal * 12

    const retencaoFinal = is2026OuAtualSplit ? 0 : retencaoMensalNota
    const diferencaFinal = is2026OuAtualSplit ? 0 : diferencaFluxoCaixa

    const explicacaoSimples = is2026OuAtualSplit
      ? 'Em 2026 (art. 348 da LC 214/2025), a CBS (0,9%) e o IBS (0,1%) atuam em fase de teste piloto compensável integralmente com PIS/COFINS. Não há retenção antecipada nem impacto de custo financeiro no capital de giro nesta fase.'
      : 'No novo sistema (IBS/CBS), a retenção tributária ocorre automaticamente na conta bancária no instante em que o cliente paga a nota (split payment). No modelo atual, a empresa recebe 100% do valor da venda e só desembolsa o imposto por guia no dia 20 do mês seguinte, utilizando esse caixa como capital de giro sem juros por até 30 a 50 dias. Essa antecipação gera um custo financeiro invisível equivalente aos juros de capital de giro ou perda de rendimento no CDI.'

    return {
      retencaoMensalNota: retencaoFinal,
      recolhimentoAtualMensal,
      diferencaFluxoCaixa: diferencaFinal,
      taxaMensalCapital: taxaMensalCapitalGiro,
      diasAntecipacao: diasAntecipacaoSplit,
      custoCapitalMensal,
      custoCapitalAnual,
      explicacaoSimples,
    }
  }, [
    faturamentoMensal,
    config.totalIvaDual,
    resultadoComparativo,
    regimeAtualFiltro,
    taxaMensalCapitalGiro,
    diasAntecipacaoSplit,
    anoTransicaoDashboard,
    config.anoTransicao,
    perfilRetencaoSplit,
    percentualRetencaoSplit,
  ])

  // ==========================================
  // ETAPA 5: CRÉDITO PRESUMIDO DE ESTOQUE NA TRANSIÇÃO
  // ==========================================
  const resultadoEstoque = useMemo(() => {
    // Alíquota de crédito presumido de abertura na virada (CBS 8,80% na entrada plena em 2027)
    // LC 214/2025 prevê apropriação de crédito sobre os estoques inventariados no encerramento do regime anterior
    const isServico = setorTransicao === 'servico'
    const estoque = isServico ? 0 : Math.max(0, valorEstoqueVirada)
    // Alíquota de crédito de abertura: alíquota de CBS vigente em 2027 (8,80% ou taxa configurada)
    const aliqCredito = config.cbsPadrao // 8,80%
    const creditoTotalEstoque = (estoque * aliqCredito) / 100
    // O crédito de estoque é apropriado ao longo do primeiro ano de vigência plena (2027)
    const economiaAno1 = creditoTotalEstoque

    const explicacaoSimples =
      'As mercadorias e insumos estocados no encerramento de 2026 foram adquiridos sob as regras antigas. A reforma permite calcular um crédito presumido de abertura sobre esse estoque (LC 214/2025), garantindo que a empresa abata até 8,80% (CBS) do imposto a pagar no primeiro ano de transição (2027), evitando bitributação na revenda.'

    return {
      valorEstoqueVirada: estoque,
      aliquotaCreditoPresumido: aliqCredito,
      creditoTotalEstoque,
      economiaAno1,
      explicacaoSimples,
    }
  }, [valorEstoqueVirada, config.cbsPadrao, setorTransicao])

  // ==========================================
  // CÁLCULO MÓDULO 5 (Transição 2026 a 2040 — 2033 é o último ano com fase
  // intermediária; 2034+ é regime definitivo, IVA Dual integral) COM CRÉDITO DE ESTOQUE
  // ==========================================
  const resultadoTransicao = useMemo(() => {
    const anos: AnoTransicaoIbsCbs[] = LISTA_ANOS_TRANSICAO
    const fatAnual = Math.max(0, faturamentoAnualProjetado)

    const fatorReducaoTransicao = Math.max(
      0,
      1 - (resultadoComparativo.ibsCbs.reducaoAplicadaPercentual || 0) / 100,
    )

    // Carga atual estimada de referência para comparação conforme o ramo
    const aliqAtualEstimada =
      setorTransicao === 'servico' || setorTransicao === 'construcao_civil'
        ? config.lucroPresumidoPis + config.lucroPresumidoCofins + config.lucroPresumidoIss // ~6,65%
        : setorTransicao === 'locacao_bens'
          ? config.lucroPresumidoPis + config.lucroPresumidoCofins // ~3,65% (sem ISS Súmula 31)
          : setorTransicao === 'industria'
            ? config.lucroRealPis + config.lucroRealCofins + config.lucroRealIpi // ~14,25%
            : config.lucroRealPis + config.lucroRealCofins + config.lucroRealIcms // ~27,25% nominal (comércio, agro, food, misto)
    const impostoAtual = (fatAnual * aliqAtualEstimada) / 100

    return anos
      .map((ano) => {
        const dadosFase = obterFaseTransicaoPorAno(ano)
        if (!dadosFase) return null
        const fase = dadosFase.fase
        const aliqCbsBase = dadosFase.aliquotaCbs
        const aliqIbsBase = dadosFase.aliquotaIbs

        let aliqCbs = aliqCbsBase
        let aliqIbs = aliqIbsBase
        let statusIcms = ''
        let statusIss = ''
        let statusIpi = ''
        let statusPisCofins = ''
        let alertaCritico: string | undefined = undefined

        if (ano === 'atual') {
          statusIcms = '100% Vigente'
          statusIss = '100% Vigente'
          statusIpi = '100% Vigente'
          statusPisCofins = '100% Vigente'
        } else if (ano === 2026) {
          statusIcms = '100% Vigente'
          statusIss = '100% Vigente'
          statusIpi = '100% Vigente'
          statusPisCofins = '100% Vigente (CBS compensável)'
        } else if (ano === 2027) {
          statusIcms = '100% Vigente'
          statusIss = '100% Vigente'
          statusIpi = 'Alíquota Zero (exceto ZFM)'
          statusPisCofins = 'EXTINTOS (Substituídos por CBS)'
          alertaCritico =
            'Ano Crítico: Extinção definitiva de PIS/COFINS e início da CBS com crédito amplo e Imposto Seletivo.'
        } else if (ano === 2028) {
          statusIcms = '100% Vigente'
          statusIss = '100% Vigente'
          statusIpi = 'Alíquota Zero'
          statusPisCofins = 'Extintos'
        } else if (ano === 2029) {
          statusIcms = 'Reduzido para 90%'
          statusIss = 'Reduzido para 90%'
          statusIpi = 'Extinto'
          statusPisCofins = 'Extintos'
        } else if (ano === 2030) {
          statusIcms = 'Reduzido para 80%'
          statusIss = 'Reduzido para 80%'
          statusIpi = 'Extinto'
          statusPisCofins = 'Extintos'
        } else if (ano === 2031) {
          statusIcms = 'Reduzido para 70%'
          statusIss = 'Reduzido para 70%'
          statusIpi = 'Extinto'
          statusPisCofins = 'Extintos'
        } else if (ano === 2032) {
          statusIcms = 'Reduzido para 60%'
          statusIss = 'Reduzido para 60%'
          statusIpi = 'Extinto'
          statusPisCofins = 'Extintos'
        } else if (isAnoPosTransicao(ano)) {
          // 2034–2040: transição CONCLUÍDA — modelo pleno definitivo, sem fases intermediárias.
          statusIcms = 'EXTINTO'
          statusIss = 'EXTINTO'
          statusIpi = 'EXTINTO'
          statusPisCofins = 'EXTINTOS'
        } else {
          // 2033
          statusIcms = 'EXTINTO'
          statusIss = 'EXTINTO'
          statusIpi = 'EXTINTO'
          statusPisCofins = 'EXTINTOS'
          alertaCritico =
            'Ano Crítico: Modelo pleno definitivo. ICMS e ISS 100% extintos; apuração e split payment 100% unificados.'
        }

        // Cálculo de alíquota efetiva ponderada da transição
        let aliqEfetivaAno = aliqCbs + aliqIbs
        if (ano === 'atual' || ano === 2026) {
          aliqEfetivaAno = aliqAtualEstimada // Em 2026 o teste é compensável sem ônus; no atual é a própria carga vigente
        } else if (ano === 2027 || ano === 2028) {
          // CBS escalonada com redução do regime especial + ICMS/ISS integral remanescente
          aliqCbs = Number((aliqCbsBase * fatorReducaoTransicao).toFixed(2))
          aliqIbs = Number((aliqIbsBase * fatorReducaoTransicao).toFixed(2))
          const remanescente =
            setorTransicao === 'servico' || setorTransicao === 'construcao_civil'
              ? config.lucroPresumidoIss
              : setorTransicao === 'locacao_bens'
                ? 0
                : config.lucroRealIcms
          aliqEfetivaAno = aliqCbs + remanescente
        } else if (typeof ano === 'number' && ano >= 2029 && ano <= 2032) {
          aliqCbs = Number((aliqCbsBase * fatorReducaoTransicao).toFixed(2))
          aliqIbs = Number((aliqIbsBase * fatorReducaoTransicao).toFixed(2))
          const fatorIbs = (ano - 2028) * 0.1 // 0.1, 0.2, 0.3, 0.4
          const fatorAntigo = 1 - fatorIbs
          const remanescente =
            (setorTransicao === 'servico' || setorTransicao === 'construcao_civil'
              ? config.lucroPresumidoIss
              : setorTransicao === 'locacao_bens'
                ? 0
                : config.lucroRealIcms) * fatorAntigo
          aliqEfetivaAno = (aliqCbsBase + aliqIbsBase) * fatorReducaoTransicao + remanescente
        } else {
          // 2033 e 2034+ (regime definitivo): IVA Dual integral — mesma fórmula, sem fases intermediárias
          aliqCbs = Number((aliqCbsBase * fatorReducaoTransicao).toFixed(2))
          aliqIbs = Number((aliqIbsBase * fatorReducaoTransicao).toFixed(2))
          aliqEfetivaAno = config.totalIvaDual * fatorReducaoTransicao
        }

        // Fase 2: Modulação da trajetória conforme o Regime Especial Atual informado
        // Regimes especiais (monofasico, st, zfm, ret):
        // - monofasico / st: carga de PIS/COFINS e ICMS concentrada na origem; na transição há diluição gradual
        //   (fator modulador suave: zfm desonera IPI/PIS/COFINS preservando incentivo regional; ret mantém alíquota unificada de 4%)
        // Neutralidade: regimeEspecialAtual === 'nenhum' mantém exatamente 1.0 (idêntico ao legado)
        if (regimeEspecialAtual === 'zona_franca_manaus') {
          // Zona Franca de Manaus: manutenção do tratamento favorecido constitucional (art. 92-B)
          // Reduz a alíquota em transição de IBS/CBS em 20% pela manutenção dos créditos de incentivo regional
          if (typeof ano === 'number' && ano >= 2027) {
            aliqEfetivaAno = Number((aliqEfetivaAno * 0.8).toFixed(2))
          }
        } else if (regimeEspecialAtual === 'ret_permuta') {
          // Regime Especial de Tributação (RET Construção Civil - 4% unificado)
          if (ano === 'atual' || ano === 2026) {
            aliqEfetivaAno = Math.min(aliqEfetivaAno, 4.0)
          }
        } else if (
          regimeEspecialAtual === 'monofasico' ||
          regimeEspecialAtual === 'substituicao_tributaria'
        ) {
          // Monofásico / Substituição Tributária: alíquota concentrada na cadeia
          // Durante a transição, a transição para CBS/IBS unificado é gradual
          if (ano === 2027 || ano === 2028) {
            aliqEfetivaAno = Number((aliqEfetivaAno * 0.95).toFixed(2))
          }
        }

        const impostoEstimado = (fatAnual * aliqEfetivaAno) / 100
        const diferencaAno = ano === 'atual' ? 0 : impostoEstimado - impostoAtual

        // Etapa 5: Crédito presumido de estoque abatido no primeiro ano de CBS plena (2027)
        const creditoEstoqueAno =
          ano === 2027 && setorTransicao !== 'servico' ? resultadoEstoque.economiaAno1 : 0
        // Fase 2: Saldo credor acumulado também é abatido no primeiro ano de transição plena (2027)
        const saldoCredorAno = ano === 2027 ? Math.max(0, saldoCredorAcumulado || 0) : 0
        const abatimentoAno1 = creditoEstoqueAno + saldoCredorAno
        const impostoComCreditoEstoque = Math.max(0, impostoEstimado - abatimentoAno1)

        return {
          ano,
          fase,
          aliquotaCbs: aliqCbs,
          aliquotaIbs: aliqIbs,
          statusIcms,
          statusIss,
          statusIpi,
          statusPisCofins,
          impostoEstimado,
          aliquotaEfetivaTotal: Number(aliqEfetivaAno.toFixed(2)),
          impostoCenarioAtual: impostoAtual,
          diferencaAno,
          creditoEstoqueAno,
          impostoComCreditoEstoque,
          alertaCritico,
        }
      })
      .filter((t): t is NonNullable<typeof t> => t !== null)
  }, [
    config,
    faturamentoAnualProjetado,
    setorTransicao,
    resultadoEstoque,
    regimeEspecialAtual,
    saldoCredorAcumulado,
    resultadoComparativo.ibsCbs.reducaoAplicadaPercentual,
  ])

  // ==========================================
  // CÁLCULO MÓDULO 6 (Dashboard KPIs)
  // ==========================================
  const resultadoDashboard = useMemo(() => {
    const anoDashboard = anoTransicaoDashboard ?? config.anoTransicao ?? 2033
    const is2026 = String(anoDashboard) === '2026'
    const isAtual = anoDashboard === 'atual'
    const is2026OuAtual = is2026 || isAtual

    // Alíquota atual baseada no regime selecionado no filtro
    let aliqAtual = 0
    let cargaAtualMensal = 0

    if (regimeAtualFiltro === 'Lucro Real') {
      aliqAtual = resultadoComparativo.lucroReal.aliquotaEfetiva
      cargaAtualMensal = resultadoComparativo.lucroReal.totalEfetivo
    } else if (regimeAtualFiltro === 'Lucro Presumido') {
      aliqAtual = resultadoComparativo.lucroPresumido.aliquotaEfetiva
      cargaAtualMensal = resultadoComparativo.lucroPresumido.totalEfetivo
    } else {
      aliqAtual = resultadoComparativo.simplesNacional.aliquotaEfetiva
      cargaAtualMensal = resultadoComparativo.simplesNacional.totalEfetivo
    }

    // Se o regime atual for Simples Nacional, o novo cenário é a Transição do Simples
    // (com CBS no DAS e IBS por fora) calculada pelo novo ramo do Simples
    let aliqNova = 0
    let cargaNovaMensal = 0
    let economiaMensal = 0
    let economiaAnual = 0
    let regimeRec = ''

    if (regimeAtualFiltro === 'Simples Nacional') {
      const sr = resultadoComparativo.simplesReforma
      if (is2026OuAtual) {
        aliqNova = aliqAtual
        cargaNovaMensal = cargaAtualMensal
        economiaMensal = 0
        economiaAnual = 0
        regimeRec = 'Simples Nacional (DAS atual)'
      } else if (sr) {
        aliqNova = sr.aliquotaEfetivaTransicao
        cargaNovaMensal = sr.cenarioTransicaoTotal
        economiaMensal = sr.economiaMensal
        economiaAnual = sr.economiaAnual
        regimeRec =
          sr.cenarioTransicaoTotal < sr.dasAtualTotal
            ? 'Simples na Reforma (Transição)'
            : 'DAS Atual (Mais Econômico)'
      } else {
        aliqNova = aliqAtual
        cargaNovaMensal = cargaAtualMensal
        regimeRec = 'Simples Nacional'
      }
    } else {
      // Regra central 2026 (art. 348 LC 214/2025): CBS 0,9% + IBS 0,1% é compensável integralmente com PIS/COFINS,
      // sem ônus real líquido. A carga IBS/CBS exibida é zero/compensável.
      aliqNova = is2026OuAtual ? 0 : resultadoComparativo.ibsCbs.aliquotaEfetiva
      cargaNovaMensal = is2026OuAtual ? 0 : resultadoComparativo.ibsCbs.totalEfetivo

      // Em 2026 e atual, não há economia fantasma para o novo sistema (a comparação real vale a partir de 2027)
      economiaMensal = is2026OuAtual ? 0 : cargaAtualMensal - cargaNovaMensal
      economiaAnual = economiaMensal * 12

      // Regime recomendado: para 2026 e atual, IBS/CBS NÃO concorre (disputa sai apenas entre Real, Presumido e Simples)
      const cenariosTradicionais = [
        { nome: 'Lucro Real', total: resultadoComparativo.lucroReal.totalEfetivo },
        { nome: 'Lucro Presumido', total: resultadoComparativo.lucroPresumido.totalEfetivo },
        { nome: 'Simples Nacional', total: resultadoComparativo.simplesNacional.totalEfetivo },
      ].sort((a, b) => a.total - b.total)

      regimeRec = is2026OuAtual
        ? cenariosTradicionais[0]?.nome || 'Simples Nacional'
        : resultadoComparativo.regimeMaisVantajoso
    }

    return {
      aliquotaEfetivaAtual: aliqAtual,
      aliquotaEfetivaNova: aliqNova,
      economiaMensalProjetada: economiaMensal,
      economiaAnualProjetada: economiaAnual,
      regimeRecomendado: regimeRec,
    }
  }, [regimeAtualFiltro, resultadoComparativo, anoTransicaoDashboard, config.anoTransicao])

  // Função para obter o snapshot dos resultados derivados atuais
  const obterSnapshotResultados = useCallback((): ResultadosSimulacaoCalculadora => {
    return {
      resultadoSimples,
      resultadoComparativo: {
        lucroReal: {
          totalEfetivo: resultadoComparativo.lucroReal.totalEfetivo,
          aliquotaEfetiva: resultadoComparativo.lucroReal.aliquotaEfetiva,
          totalNominal: resultadoComparativo.lucroReal.totalNominal,
          creditos: resultadoComparativo.lucroReal.creditos,
        },
        lucroPresumido: {
          totalEfetivo: resultadoComparativo.lucroPresumido.totalEfetivo,
          aliquotaEfetiva: resultadoComparativo.lucroPresumido.aliquotaEfetiva,
          totalNominal: resultadoComparativo.lucroPresumido.totalNominal,
          creditos: resultadoComparativo.lucroPresumido.creditos,
        },
        simplesNacional: {
          totalEfetivo: resultadoComparativo.simplesNacional.totalEfetivo,
          aliquotaEfetiva: resultadoComparativo.simplesNacional.aliquotaEfetiva,
          totalNominal: resultadoComparativo.simplesNacional.totalNominal,
          creditos: resultadoComparativo.simplesNacional.creditos,
          anexoUtilizado: resultadoComparativo.simplesNacional.anexoUtilizado,
          faixaEncontrada: resultadoComparativo.simplesNacional.faixaEncontrada,
        },
        ibsCbs: {
          totalEfetivo: resultadoComparativo.ibsCbs.totalEfetivo,
          aliquotaEfetiva: resultadoComparativo.ibsCbs.aliquotaEfetiva,
          totalNominal: resultadoComparativo.ibsCbs.totalNominal,
          creditos: resultadoComparativo.ibsCbs.creditos,
          impostoSeletivo: resultadoComparativo.ibsCbs.impostoSeletivo,
        },
        simplesReforma: resultadoComparativo.simplesReforma,
        regimeMaisVantajoso: resultadoComparativo.regimeMaisVantajoso,
        piorCenario: resultadoComparativo.piorCenario,
        economiaVersusPior: resultadoComparativo.economiaVersusPior,
        economiaPercentual: resultadoComparativo.economiaPercentual,
      },
      resultadoCreditos,
      resultadoTransicao: resultadoTransicao.map((t) => ({
        ano: t.ano,
        fase: t.fase,
        aliquotaCbs: t.aliquotaCbs,
        aliquotaIbs: t.aliquotaIbs,
        impostoEstimado: t.impostoEstimado,
        aliquotaEfetivaTotal: t.aliquotaEfetivaTotal,
        creditoEstoqueAno: t.creditoEstoqueAno,
      })),
      resultadoEstoque: {
        valorEstoqueVirada: resultadoEstoque.valorEstoqueVirada,
        aliquotaCreditoPresumido: resultadoEstoque.aliquotaCreditoPresumido,
        creditoTotalEstoque: resultadoEstoque.creditoTotalEstoque,
        economiaAno1: resultadoEstoque.economiaAno1,
      },
      resultadoSplitPayment: {
        retencaoMensalNota: resultadoSplitPayment.retencaoMensalNota,
        recolhimentoAtualMensal: resultadoSplitPayment.recolhimentoAtualMensal,
        diferencaFluxoCaixa: resultadoSplitPayment.diferencaFluxoCaixa,
        taxaMensalCapital: resultadoSplitPayment.taxaMensalCapital,
        custoCapitalMensal: resultadoSplitPayment.custoCapitalMensal,
        custoCapitalAnual: resultadoSplitPayment.custoCapitalAnual,
        diasAntecipacao: resultadoSplitPayment.diasAntecipacao,
      },
      resultadoDashboard,
    }
  }, [])

  const origensPropagadas = useMemo(
    () => ({
      modulo2AnoOperacao: !editadoLocalmente.modulo2AnoOperacao,
      modulo2RegimeOperacao: !editadoLocalmente.modulo2RegimeOperacao,
      modulo2ValorOperacao: !editadoLocalmente.modulo2ValorOperacao,
      modulo2PercentualCompras: !editadoLocalmente.modulo2PercentualCompras,
      modulo3Faturamento: !editadoLocalmente.modulo3Faturamento,
      modulo3PercentualCompras: !editadoLocalmente.modulo3PercentualCompras,
      modulo3TipoAtividade: !editadoLocalmente.modulo3TipoAtividade,
      modulo4Categorias: !editadoLocalmente.modulo4Categorias,
      modulo5Faturamento: !editadoLocalmente.modulo5Faturamento,
      modulo5SetorTransicao: !editadoLocalmente.modulo5SetorTransicao,
      dashboardRegimeAtual: !editadoLocalmente.dashboardRegimeAtual,
      dashboardAnoTransicao: !editadoLocalmente.dashboardAnoTransicao,
      dashboardSetor: !editadoLocalmente.dashboardSetor,
      dashboardFaturamento: !editadoLocalmente.dashboardFaturamento,
      dashboardPercentualCompras: !editadoLocalmente.dashboardPercentualCompras,
    }),
    [editadoLocalmente],
  )

  return (
    <CalculadoraContext.Provider
      value={{
        config,
        updateConfig,
        resetConfig,
        aplicarAnoTransicao,
        aplicarPresetSetor,
        limparEtiquetaOrigem,
        editadoLocalmente,
        origensPropagadas,

        valorOperacao,
        setValorOperacao,
        regimeOperacao,
        setRegimeOperacao,
        anoOperacao,
        setAnoOperacao,
        percentualComprasVendasSimples,
        setPercentualComprasVendasSimples,

        faturamentoMensal,
        setFaturamentoMensal,
        tipoAtividade,
        setTipoAtividade,
        subatividadeServico,
        setSubatividadeServico,
        subatividadeIndustria,
        setSubatividadeIndustria,
        subatividadeComercio,
        setSubatividadeComercio,
        subatividadeAgro,
        setSubatividadeAgro,
        subatividadeConstrucao,
        setSubatividadeConstrucao,
        subatividadeLocacao,
        setSubatividadeLocacao,
        subatividadeFoodService,
        setSubatividadeFoodService,
        aliquotaImpostoSeletivo,
        setAliquotaImpostoSeletivo,
        proporcaoServicoMisto,
        setProporcaoServicoMisto,
        percentualComprasVendasComparativo,
        setPercentualComprasVendasComparativo,
        folhaPagamentoMensal,
        setFolhaPagamentoMensal,
        margemLucroEstimada,
        setMargemLucroEstimada,
        despesasComCreditosMensais,
        setDespesasComCreditosMensais,
        percentualExportacao,
        setPercentualExportacao,
        ufOrigem,
        setUfOrigem,

        despesasCreditos,
        updateDespesaCredito,
        resetDespesasCreditos,

        faturamentoAnualProjetado,
        setFaturamentoAnualProjetado,
        setorTransicao,
        setSetorTransicao,
        valorEstoqueVirada,
        setValorEstoqueVirada,

        taxaMensalCapitalGiro,
        setTaxaMensalCapitalGiro,
        diasAntecipacaoSplit,
        setDiasAntecipacaoSplit,

        periodoDashboard,
        setPeriodoDashboard,
        regimeAtualFiltro,
        setRegimeAtualFiltro,
        anoTransicaoDashboard,
        setAnoTransicaoDashboard,

        // Parâmetros Fiscais Avançados (Fase 2) - Override local da Calculadora
        percentualComprasSemCredito,
        setPercentualComprasSemCredito,
        saldoCredorAcumulado,
        setSaldoCredorAcumulado,
        percentualVendasInterestaduais,
        setPercentualVendasInterestaduais,
        regimeEspecialAtual,
        setRegimeEspecialAtual,
        perfilRetencaoSplit,
        setPerfilRetencaoSplit,
        percentualRetencaoSplit,
        setPercentualRetencaoSplit,

        // Composição detalhada por Itens / NCM (Fase 3)
        itensComposicao,
        setItensComposicao,
        adicionarItemComposicao,
        atualizarItemComposicao,
        removerItemComposicao,
        limparItensComposicao,

        origemDadosEmpresa,
        restaurarDadosEmpresaNoModulo,
        limparDashboard,

        obterSnapshotParametros,
        obterSnapshotResultados,
        restaurarSimulacao,

        resultadoSimples,
        resultadoComparativo,
        resultadoCreditos,
        resultadoTransicao,
        alertaLimitesSimples,
        resultadoSplitPayment,
        resultadoEstoque,
        resultadoDashboard,

        // Radar Tributário
        parametrosRadar,
        parametroCbsAtivo,
        parametroIbsAtivo,
        notificacoesRadar,
        carregandoRadar,
        recarregarParametrosRadar,

        // Parâmetro Temporário do Radar de Alertas
        parametroRadarTemporario,
        aplicarAliquotaRadarTemporaria,
        limparParametroRadarTemporario,

        // IBS/CBS (integração antecipada) - leitura inerte, sem efeito em cálculos
        ibsCbsImportados,
      }}
    >
      {children}
    </CalculadoraContext.Provider>
  )
}

export function useCalculadoraIbsCbs() {
  const context = useContext(CalculadoraContext)
  if (!context) {
    throw new Error('useCalculadoraIbsCbs deve ser usado dentro de CalculadoraProvider')
  }
  return context
}
