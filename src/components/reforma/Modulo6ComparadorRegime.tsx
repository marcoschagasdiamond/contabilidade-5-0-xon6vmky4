import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  GitCompare,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Building2,
  Save,
  CheckCircle2,
  Trophy,
  Scale,
  TrendingUp,
  AlertTriangle,
  FileText,
  DollarSign,
  Percent,
} from 'lucide-react'
import { PERGUNTAS_COMPARADOR, CENARIOS_COMUNS_COMPARADOR } from '@/data/reformaTributariaData'
import { DadosEmpresaPerfil } from '@/types/dadosEmpresa'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BlocoSplitPayment } from '@/components/calculadora/BlocoSplitPayment'
import {
  AnoBaseSimulacao,
  ANOS_SIMULACAO_DISPONIVEIS,
  calcularAliquotasEfetivasReforma,
  obterReducaoSetorialReforma,
} from '@/lib/reformaTributaria'
import { formatarMoeda } from '@/lib/calculadoraUtils'
import { BadgeOrigemPropagada } from '@/components/calculadora/BadgeOrigemPropagada'

export interface Modulo6ComparadorRegimeProps {
  modo?: 'reforma' | 'trilha'
  dadosEmpresa?: DadosEmpresaPerfil
  temDadosSalvos?: boolean
  onRestaurarDados?: () => void
  onSalvarDiagnostico?: (payload: {
    regimeVencedor: string
    justificativa: string
    scoreSimples: number
    scoreHibrido: number
    scoreNormal: number
    respostas: Record<number, string>
    convergencia?: {
      convergem: boolean
      hipoteseQualitativa: string
      recomendacaoFinal: string
      motivoPrevalencia?: string
      detalhes?: {
        faturamentoAnual: number
        tetoSimples: number
        sublimiteSimples: number
        fatorR: number
        fatorRPercent: number
      }
    }
    resultadosNumericos: {
      faturamentoAnual: number
      folhaAnual: number
      margemLucro: number
      anoBase: number
      melhorRegime: string
      economiaAnualMaxima: number
      cargaSimples: number
      cargaPresumido: number
      cargaReal: number
      cargaNovoSistema: number
      ranking: Array<{
        posicao: number
        regime: string
        cargaAnual: number
        aliquotaEfetiva: number
        elegivel: boolean
        diferencaValor: number
        diferencaPercent: number
      }>
    }
  }) => Promise<void>
  salvando?: boolean
  salvoFeedback?: boolean
}

/**
 * Mapeia os Dados da Empresa para respostas prévias das 4 perguntas do comparador qualitativo.
 */
export function mapearDadosEmpresaParaPerguntasModulo6(
  dados?: Partial<DadosEmpresaPerfil>,
): Record<number, string> {
  if (!dados) return {}
  const inicial: Record<number, string> = {}

  // Pergunta 1: Para quem vende a maior parte?
  // Opções: 'b2c' | 'b2b-pequeno' | 'b2b-grande' | 'governo-exportacao'
  const emissao = dados.emissaoNf || ''
  const pctExp = dados.percentualExportacao || 0
  if (pctExp > 20) {
    inicial[1] = 'governo-exportacao'
  } else if (emissao.includes('Consumidores Finais (B2C)')) {
    inicial[1] = 'b2c'
  } else if (emissao.includes('Pessoas Jurídicas (B2B)')) {
    inicial[1] = 'b2b-grande'
  } else if (emissao.includes('Mista') || emissao.includes('50%')) {
    inicial[1] = 'b2b-pequeno'
  }

  // Pergunta 2: O seu comprador direto aproveita créditos tributários?
  // Opções: 'nao-aproveita' | 'as-vezes' | 'exigem-credito'
  if (emissao.includes('Pessoas Jurídicas (B2B)')) {
    inicial[2] = 'exigem-credito'
  } else if (emissao.includes('Mista')) {
    inicial[2] = 'as-vezes'
  } else if (emissao.includes('Consumidores Finais (B2C)')) {
    inicial[2] = 'nao-aproveita'
  }

  // Pergunta 3: Perder venda por falta de crédito doeria no seu caixa?
  // Opções: 'nao-doeria' | 'medio-impacto' | 'alto-impacto'
  if (emissao.includes('Pessoas Jurídicas (B2B)')) {
    inicial[3] = 'alto-impacto'
  } else if (emissao.includes('Mista')) {
    inicial[3] = 'medio-impacto'
  } else if (emissao.includes('Consumidores Finais (B2C)')) {
    inicial[3] = 'nao-doeria'
  }

  // Pergunta 4: Qual o volume de compra de insumos/mercadorias e porte de faturamento?
  // Opções: 'baixo-insumo' | 'medio-insumo' | 'alto-insumo'
  const fatAnual = (dados.faturamentoMensal || 120000) * 12
  const despAnual = (dados.despesasComCreditosMensais || 35000) * 12
  const proporcaoInsumos = fatAnual > 0 ? despAnual / fatAnual : 0.25

  // Alinhado aos limiares do motor: sublimite R$ 3,6M, teto R$ 4,8M
  if (fatAnual > 3600000 || proporcaoInsumos > 0.5) {
    inicial[4] = 'alto-insumo'
  } else if (fatAnual >= 2500000 || proporcaoInsumos >= 0.25) {
    inicial[4] = 'medio-insumo'
  } else {
    inicial[4] = 'baixo-insumo'
  }

  return inicial
}

export function Modulo6ComparadorRegime({
  modo = 'reforma',
  dadosEmpresa,
  temDadosSalvos,
  onRestaurarDados,
  onSalvarDiagnostico,
  salvando = false,
  salvoFeedback = false,
}: Modulo6ComparadorRegimeProps) {
  // Inicialização inteligente com dados da empresa se disponíveis
  const respostasPreenchidas = useMemo(() => {
    return dadosEmpresa ? mapearDadosEmpresaParaPerguntasModulo6(dadosEmpresa) : {}
  }, [dadosEmpresa])

  const [respostas, setRespostas] = useState<Record<number, string>>(respostasPreenchidas)
  const [mostrarResultado, setMostrarResultado] = useState(modo === 'trilha')

  // Se estiver em modo trilha e os dados da empresa carregarem
  useEffect(() => {
    if (dadosEmpresa && Object.keys(respostasPreenchidas).length > 0) {
      setRespostas((prev) => {
        const mesclado = { ...respostasPreenchidas, ...prev }
        return mesclado
      })
    }
  }, [respostasPreenchidas, dadosEmpresa])

  const handleSelectOption = (perguntaId: number, valor: string) => {
    setRespostas((prev) => ({
      ...prev,
      [perguntaId]: valor,
    }))
  }

  const todasRespondidas = PERGUNTAS_COMPARADOR.every((p) => respostas[p.id] !== undefined)

  // Cálculo da pontuação do questionário qualitativo (Módulo 6)
  let scoreSimples = 0
  let scoreHibrido = 0
  let scoreNormal = 0

  PERGUNTAS_COMPARADOR.forEach((p) => {
    const resp = respostas[p.id]
    if (resp) {
      const opcao = p.opcoes.find((o) => o.valor === resp)
      if (opcao) {
        scoreSimples += opcao.peso.simples
        scoreHibrido += opcao.peso.hibrido
        scoreNormal += opcao.peso.normal
      }
    }
  })

  let regimeVencedor = 'Simples Tradicional'
  let justificativa = ''
  let tagColor: 'emerald' | 'amber' | 'blue' = 'emerald'

  if (scoreHibrido > scoreSimples && scoreHibrido >= scoreNormal) {
    regimeVencedor = 'Simples Híbrido (IBS e CBS por fora)'
    justificativa =
      'Como sua empresa atende compradores PJ que exigem crédito fiscal e perder vendas doeria no seu caixa, o Simples Híbrido protege sua carteira de clientes transferindo crédito integral de ~26,5%, enquanto mantém sua folha e IRPJ/CSLL protegidos na guia única do DAS.'
    tagColor = 'amber'
  } else if (scoreNormal > scoreSimples && scoreNormal > scoreHibrido) {
    regimeVencedor = 'Regime Normal (Lucro Real ou Lucro Presumido)'
    justificativa =
      'Seu volume de insumos/compras é muito expressivo ou seu faturamento se aproxima do sublimite de R$ 3,6M. No Regime Normal, os créditos gerados em cadeia podem resultar em tributação efetiva mais baixa do que as faixas altas do Simples.'
    tagColor = 'blue'
  } else {
    regimeVencedor = 'Simples Nacional Tradicional'
    justificativa =
      'Seu perfil de faturamento é predominantemente voltado a consumidores finais (B2C) ou compradores que não dependem de crédito financeiro. Manter-se no Simples Tradicional garante menor carga nominal e máxima simplificação contábil.'
    tagColor = 'emerald'
  }

  // =========================================================
  // PARÂMETROS OPERACIONAIS E CÁLCULO NUMÉRICO DOS 4 REGIMES (MODO TRILHA)
  // =========================================================
  const [faturamentoMensal, setFaturamentoMensal] = useState<number>(
    dadosEmpresa?.faturamentoMensal || 120000,
  )
  const [folhaMensal, setFolhaMensal] = useState<number>(
    dadosEmpresa?.folhaPagamentoMensal || 30000,
  )
  const [despesasCreditosMensal, setDespesasCreditosMensal] = useState<number>(
    dadosEmpresa?.despesasComCreditosMensais || 35000,
  )
  const [margemLucro, setMargemLucro] = useState<number>(dadosEmpresa?.margemLucroEstimada ?? 25)
  const [anoBase, setAnoBase] = useState<AnoBaseSimulacao>(2027)

  // Atualizar quando os dados da empresa carregarem
  useEffect(() => {
    if (dadosEmpresa) {
      if (dadosEmpresa.faturamentoMensal) setFaturamentoMensal(dadosEmpresa.faturamentoMensal)
      if (dadosEmpresa.folhaPagamentoMensal) setFolhaMensal(dadosEmpresa.folhaPagamentoMensal)
      if (dadosEmpresa.despesasComCreditosMensais)
        setDespesasCreditosMensal(dadosEmpresa.despesasComCreditosMensais)
      if (dadosEmpresa.margemLucroEstimada !== undefined)
        setMargemLucro(dadosEmpresa.margemLucroEstimada)
    }
  }, [dadosEmpresa])

  const faturamentoAnual = faturamentoMensal * 12
  const folhaAnual = folhaMensal * 12
  const despesasAnuais = despesasCreditosMensal * 12
  const segmentoEmpresa = dadosEmpresa?.segmento || 'Serviços'
  const reducaoSetor = obterReducaoSetorialReforma(segmentoEmpresa)

  // CÁLCULO DOS 4 REGIMES
  const resultadosRegimes = useMemo(() => {
    // 1. Simples Nacional (Elegibilidade teto R$ 4,8 mi e sublimite R$ 3,6 mi)
    const TETO_SIMPLES = 4800000
    const SUBLIMITE_SIMPLES = 3600000
    const FATOR_R_MINIMO = 0.28

    const elegivelSimples = faturamentoAnual <= TETO_SIMPLES
    const estouraSublimite =
      faturamentoAnual > SUBLIMITE_SIMPLES && faturamentoAnual <= TETO_SIMPLES
    const fatorR = faturamentoAnual > 0 ? folhaAnual / faturamentoAnual : 0
    const fatorRPercent = Math.round(fatorR * 1000) / 10

    let aliqSimples = 0.08
    if (segmentoEmpresa === 'Comércio') aliqSimples = 0.065
    else if (segmentoEmpresa === 'Indústria') aliqSimples = 0.078
    else if (segmentoEmpresa === 'Serviços' || segmentoEmpresa === 'Tecnologia') {
      aliqSimples = fatorR >= FATOR_R_MINIMO ? 0.095 : 0.155 // Anexo III vs Anexo V
    } else {
      aliqSimples = 0.105
    }
    const cargaSimplesAnual = elegivelSimples ? faturamentoAnual * aliqSimples : Infinity

    // 2. Lucro Presumido
    const presuncao =
      segmentoEmpresa === 'Serviços' ||
      segmentoEmpresa === 'Tecnologia' ||
      segmentoEmpresa === 'Saúde'
        ? 0.32
        : 0.08
    const basePresumida = faturamentoAnual * presuncao
    const irpjCsll = basePresumida * 0.24 // 15% + 10% adicional + 9% csll sobre a base pres.
    const pisCofinsPresumido = faturamentoAnual * 0.0365 // 0,65% + 3%
    const issIcmsPresumido = faturamentoAnual * 0.05 // alíquota média estadual/municipal
    const encargoFolhaPresumido = folhaAnual * 0.28 // INSS patronal 20% + RAT/terceiros
    const cargaPresumidoAnual =
      irpjCsll + pisCofinsPresumido + issIcmsPresumido + encargoFolhaPresumido

    // 3. Lucro Real
    const lucroContabil = Math.max(0, faturamentoAnual - despesasAnuais - folhaAnual)
    const irpjCsllReal = lucroContabil * 0.34 // 15% IRPJ + 10% adic + 9% CSLL
    const pisCofinsReal = Math.max(0, (faturamentoAnual - despesasAnuais) * 0.0925)
    const issIcmsReal = faturamentoAnual * 0.04
    const encargoFolhaReal = folhaAnual * 0.28
    const cargaRealAnual = irpjCsllReal + pisCofinsReal + issIcmsReal + encargoFolhaReal

    // 4. Novo Sistema IBS / CBS Dual (com transição para o anoBase)
    const aliqEfetivaNova = calcularAliquotasEfetivasReforma(anoBase, segmentoEmpresa)
    const aliqTotalNova = (aliqEfetivaNova.aliquotaCBS + aliqEfetivaNova.aliquotaIBS) / 100
    const tributoConsumoNovo = Math.max(0, (faturamentoAnual - despesasAnuais) * aliqTotalNova)
    const rendaEstimadaNovo = lucroContabil * 0.34
    const encargoFolhaNovo = folhaAnual * 0.2
    const cargaNovoSistemaAnual = tributoConsumoNovo + rendaEstimadaNovo + encargoFolhaNovo

    const lista = [
      {
        id: 'simples',
        nome: 'Simples Nacional',
        elegivel: elegivelSimples,
        cargaAnual: cargaSimplesAnual,
        aliquotaEfetiva: elegivelSimples ? (cargaSimplesAnual / faturamentoAnual) * 100 : 0,
        motivoElegibilidade: elegivelSimples
          ? 'Faturamento dentro do teto de R$ 4,8 milhões/ano'
          : 'Ultrapassa o teto anual de R$ 4,8 milhões',
        vantagens: ['Guia única (DAS)', 'Dispensa de contribuição patronal na maioria dos anexos'],
        desvantagens: ['Não gera créditos plenos de IBS/CBS a compradores no novo sistema'],
      },
      {
        id: 'presumido',
        nome: 'Lucro Presumido',
        elegivel: faturamentoAnual <= 78000000,
        cargaAnual: cargaPresumidoAnual,
        aliquotaEfetiva: (cargaPresumidoAnual / faturamentoAnual) * 100,
        motivoElegibilidade: 'Faturamento dentro do teto de R$ 78 milhões/ano',
        vantagens: ['Cálculo simplificado de IRPJ/CSLL', 'Previsibilidade contábil'],
        desvantagens: ['INSS patronal pleno de 20% + terceiros sobre a folha'],
      },
      {
        id: 'real',
        nome: 'Lucro Real',
        elegivel: true,
        cargaAnual: cargaRealAnual,
        aliquotaEfetiva: (cargaRealAnual / faturamentoAnual) * 100,
        motivoElegibilidade: 'Acesso irrestrito a qualquer porte de faturamento',
        vantagens: [
          'Impostos sobre a renda cobrados apenas sobre o lucro efetivo',
          'Não-cumulatividade plena de PIS/COFINS',
        ],
        desvantagens: ['Maior exigência de compliance contábil e obrigações acessórias'],
      },
      {
        id: 'novo_dual',
        nome: `Novo Sistema Dual (Ano ${anoBase})`,
        elegivel: true,
        cargaAnual: cargaNovoSistemaAnual,
        aliquotaEfetiva: (cargaNovoSistemaAnual / faturamentoAnual) * 100,
        motivoElegibilidade: `Simulação projetada sob a LC 214/2025 para o ano ${anoBase}`,
        vantagens: ['Não-cumulatividade plena (crédito financeiro total)', 'Fim da cumulatividade'],
        desvantagens: ['Necessidade de sistemas aptos a operar em regime dual com Split Payment'],
      },
    ]

    const ordenados = [...lista]
      .filter((r) => r.elegivel && r.cargaAnual !== Infinity)
      .sort((a, b) => a.cargaAnual - b.cargaAnual)

    const melhorRegime = ordenados[0]
    const piorRegime = ordenados[ordenados.length - 1]
    const economiaAnualMaxima =
      piorRegime && melhorRegime ? piorRegime.cargaAnual - melhorRegime.cargaAnual : 0

    return {
      todos: lista,
      ranking: ordenados,
      melhorRegime,
      piorRegime,
      economiaAnualMaxima,
      fatorR,
      fatorRPercent,
      elegivelSimples,
      estouraSublimite,
      TETO_SIMPLES,
      SUBLIMITE_SIMPLES,
      FATOR_R_MINIMO,
    }
  }, [faturamentoAnual, folhaAnual, despesasAnuais, segmentoEmpresa, anoBase])

  // =========================================================
  // ANÁLISE DE CONVERGÊNCIA / DIVERGÊNCIA (HIPÓTESE QUALITATIVA VS NÚMEROS)
  // =========================================================
  const analiseConvergencia = useMemo(() => {
    // Normalização das categorias para cruzamento
    // Hipótese das 4 perguntas (regimeVencedor):
    // - "Simples Tradicional" / "Simples Nacional Tradicional" -> 'simples'
    // - "Simples Híbrido (IBS e CBS por fora)" -> 'hibrido' (categoria dentro do universo Simples / Regime Regular dependendo do faturamento)
    // - "Regime Normal (Lucro Real ou Lucro Presumido)" -> 'normal'
    let catQualitativa: 'simples' | 'hibrido' | 'normal' = 'simples'
    if (regimeVencedor.includes('Híbrido')) {
      catQualitativa = 'hibrido'
    } else if (regimeVencedor.includes('Regime Normal') || regimeVencedor.includes('Lucro')) {
      catQualitativa = 'normal'
    } else {
      catQualitativa = 'simples'
    }

    const recNumericaId = resultadosRegimes.melhorRegime?.id || 'simples'
    let catNumerica: 'simples' | 'normal' = 'simples'
    if (recNumericaId === 'simples') {
      catNumerica = 'simples'
    } else {
      // Presumido, Real ou Novo Dual são Regimes Normais / Regulares
      catNumerica = 'normal'
    }

    // Convergência:
    // - Se catQualitativa === 'simples' e catNumerica === 'simples': convergem!
    // - Se catQualitativa === 'normal' e catNumerica === 'normal': convergem!
    // - Se catQualitativa === 'hibrido': no Simples Híbrido a empresa recolhe CBS/IBS pelo regime normal ou apura por fora;
    //   se o motor calculou Simples como mais barato, converge como variante do Simples com opção híbrida;
    //   se o motor calculou Regime Normal (Lucro Presumido / Real / Novo Dual), pode ser justificado pelo sublimite ou carga global.
    let convergem = false
    if (catQualitativa === 'simples' && catNumerica === 'simples') {
      convergem = true
    } else if (catQualitativa === 'normal' && catNumerica === 'normal') {
      convergem = true
    } else if (
      catQualitativa === 'hibrido' &&
      (catNumerica === 'simples' || recNumericaId === 'novo_dual')
    ) {
      // No caso de híbrido e Simples / Novo Dual, há consonância com a lógica mista
      convergem = true
    } else {
      convergem = false
    }

    // Motivo específico com dados reais do motor
    const fatAnual = faturamentoAnual
    const fatFormatado = formatarMoeda(fatAnual)
    const folhaFormatada = formatarMoeda(folhaAnual)
    const fatorRPct = resultadosRegimes.fatorRPercent
    const melhorRegimeNome = resultadosRegimes.melhorRegime?.nome || 'Regime Mais Econômico'
    const economia = formatarMoeda(resultadosRegimes.economiaAnualMaxima)

    let motivoDivergencia = ''
    let limiarRompido = ''

    if (!convergem) {
      if (fatAnual > resultadosRegimes.TETO_SIMPLES) {
        limiarRompido = 'Teto do Simples Nacional rompido (> R$ 4,8 milhões/ano)'
        motivoDivergencia = `Seu faturamento anual projetado de ${fatFormatado} excede o teto legal do Simples Nacional (R$ 4.800.000,00). Por determinação expressa da LC 123/2006, a permanência no Simples é legalmente vedada, prevalecendo os regimes normais (Lucro Presumido, Lucro Real ou Novo Sistema) independentemente do perfil das vendas.`
      } else if (fatAnual > resultadosRegimes.SUBLIMITE_SIMPLES && catQualitativa === 'simples') {
        limiarRompido = 'Sublimite estadual do Simples ultrapassado (> R$ 3,6 milhões/ano)'
        motivoDivergencia = `Com receita bruta de ${fatFormatado}, sua empresa superou o sublimite de R$ 3.600.000,00. Nessa faixa, o ICMS/ISS (e futuros IBS/CBS) são compulsoriamente recolhidos por fora do DAS no regime de débito e crédito, descaracterizando a vantagem do Simples Tradicional. Os números apontam ${melhorRegimeNome} como a opção que minimiza o desembolso real (economia estimada de ${economia}/ano).`
      } else if (catQualitativa === 'simples' && catNumerica === 'normal') {
        if (
          (segmentoEmpresa === 'Serviços' || segmentoEmpresa === 'Tecnologia') &&
          fatorRPct < 28
        ) {
          limiarRompido = `Fator R em ${fatorRPct.toFixed(1)}% (abaixo do limiar de 28%)`
          motivoDivergencia = `Embora seu perfil de clientes sugira o Simples, sua relação folha/faturamento (Fator R de ${fatorRPct.toFixed(1)}% com folha de ${folhaFormatada} e receita de ${fatFormatado}) enquadra a atividade no oneroso Anexo V (alíquota inicial de 15,5%). Nesse patamar, o ${melhorRegimeNome} apresenta carga líquida inferior, gerando economia anual de ${economia}.`
        } else {
          limiarRompido = 'Carga tributária efetiva e volume de despesas/créditos'
          motivoDivergencia = `Apesar do perfil de clientes indicar preferência pelo Simples, a simulação matemática com base em receita (${fatFormatado}), despesas operacionais e margem de lucro comprova que o ${melhorRegimeNome} gera menor desembolso financeiro anual (economia de ${economia}/ano). A realidade dos números do seu fluxo contábil prevalece sobre a hipótese inicial de perfil.`
        }
      } else if (catQualitativa === 'normal' && catNumerica === 'simples') {
        limiarRompido =
          'Elegibilidade plena ao Simples Nacional (faturamento até R$ 4,8 milhões/ano)'
        motivoDivergencia = `O questionário indicou que seus clientes demandam créditos fiscais ou que o volume de insumos é representativo, levantando a hipótese de Regime Normal. Contudo, com receita anual de ${fatFormatado} (dentro do limite de R$ 4.800.000,00), a alíquota unificada do Simples Nacional ainda entrega um custo fiscal absoluto significativamente menor (${melhorRegimeNome} com economia de ${economia}/ano), superando a perda de atratividade de crédito.`
      } else {
        limiarRompido = 'Otimização matemática da carga anual'
        motivoDivergencia = `A análise numérica detalhada identificou que o ${melhorRegimeNome} oferece a melhor equação entre impostos sobre consumo, folha e renda para os dados declarados (economia de ${economia}/ano). Por isso a recomendação final calculada é a que prevalece.`
      }
    }

    return {
      convergem,
      catQualitativa,
      catNumerica,
      hipoteseNome: regimeVencedor,
      recomendacaoFinalNome: melhorRegimeNome,
      motivoDivergencia,
      limiarRompido,
      economiaFormatada: economia,
      fatorRPct,
      fatAnual,
    }
  }, [regimeVencedor, resultadosRegimes, faturamentoAnual, folhaAnual, segmentoEmpresa])

  const reiniciar = () => {
    if (modo === 'trilha' && dadosEmpresa) {
      setRespostas(mapearDadosEmpresaParaPerguntasModulo6(dadosEmpresa))
      setFaturamentoMensal(dadosEmpresa.faturamentoMensal || 120000)
      setFolhaMensal(dadosEmpresa.folhaPagamentoMensal || 30000)
      setDespesasCreditosMensal(dadosEmpresa.despesasComCreditosMensais || 35000)
      setMargemLucro(dadosEmpresa.margemLucroEstimada ?? 25)
      setAnoBase(2027)
    } else {
      setRespostas({})
      setMostrarResultado(false)
    }
    if (onRestaurarDados) {
      onRestaurarDados()
    }
  }

  const handleSalvar = async () => {
    if (onSalvarDiagnostico) {
      const simples = resultadosRegimes.todos.find((r) => r.id === 'simples')
      const presumido = resultadosRegimes.todos.find((r) => r.id === 'presumido')
      const real = resultadosRegimes.todos.find((r) => r.id === 'real')
      const novoDual = resultadosRegimes.todos.find((r) => r.id === 'novo_dual')

      await onSalvarDiagnostico({
        regimeVencedor,
        justificativa,
        scoreSimples,
        scoreHibrido,
        scoreNormal,
        respostas,
        convergencia: {
          convergem: analiseConvergencia.convergem,
          hipoteseQualitativa: analiseConvergencia.hipoteseNome,
          recomendacaoFinal: analiseConvergencia.recomendacaoFinalNome,
          motivoPrevalencia: analiseConvergencia.motivoDivergencia,
          detalhes: {
            faturamentoAnual,
            tetoSimples: resultadosRegimes.TETO_SIMPLES,
            sublimiteSimples: resultadosRegimes.SUBLIMITE_SIMPLES,
            fatorR: resultadosRegimes.fatorR,
            fatorRPercent: resultadosRegimes.fatorRPercent,
          },
        },
        resultadosNumericos: {
          faturamentoAnual,
          folhaAnual,
          margemLucro,
          anoBase,
          melhorRegime: resultadosRegimes.melhorRegime?.nome || regimeVencedor,
          economiaAnualMaxima: resultadosRegimes.economiaAnualMaxima,
          cargaSimples:
            simples?.cargaAnual && simples.cargaAnual !== Infinity ? simples.cargaAnual : 0,
          cargaPresumido: presumido?.cargaAnual || 0,
          cargaReal: real?.cargaAnual || 0,
          cargaNovoSistema: novoDual?.cargaAnual || 0,
          ranking: resultadosRegimes.ranking.map((item, idx) => ({
            posicao: idx + 1,
            regime: item.nome,
            cargaAnual: item.cargaAnual,
            aliquotaEfetiva: item.aliquotaEfetiva,
            elegivel: item.elegivel,
            diferencaValor: item.cargaAnual - resultadosRegimes.melhorRegime.cargaAnual,
            diferencaPercent:
              ((item.cargaAnual - resultadosRegimes.melhorRegime.cargaAnual) /
                (resultadosRegimes.melhorRegime.cargaAnual || 1)) *
              100,
          })),
        },
      })
    }
  }

  // =========================================================
  // RENDERIZAÇÃO
  // =========================================================
  return (
    <div className="space-y-10">
      {/* SE FOR NA TRILHA: BADGE E PAINEL DE DADOS DA EMPRESA */}
      {modo === 'trilha' && dadosEmpresa && (
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold bg-[#07132B] text-[#D4AF37] mb-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#2ECC71]" />
              <span>Alimentado pelos Dados da Empresa</span>
            </div>
            <h2 className="text-xl font-heading font-extrabold text-[#07132B]">
              {dadosEmpresa.nomeEmpresa || 'Empresa Cadastrada'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Segmento: <strong>{dadosEmpresa.segmento}</strong> • Regime Atual:{' '}
              <strong>{dadosEmpresa.regimeAtual || 'Não informado'}</strong> • Clientes:{' '}
              <strong>{dadosEmpresa.emissaoNf || 'B2B'}</strong> • UF:{' '}
              <strong>{dadosEmpresa.ufOrigem || 'SP'}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={reiniciar}
              className="text-xs text-slate-700 hover:text-slate-900 border-slate-300 gap-1.5 h-9"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#D4AF37]" />
              Restaurar dados da empresa
            </Button>
          </div>
        </div>
      )}

      {/* SE FOR NA TRILHA: PARÂMETROS OPERACIONAIS REVISÁVEIS */}
      {modo === 'trilha' && (
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] block mb-0.5">
                Parâmetros Econômico-Fiscais
              </span>
              <h3 className="font-heading font-extrabold text-lg text-[#07132B]">
                Base Numérica da Empresa para Cálculo Comparativo
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              Altera as bases de cálculo dos 4 regimes em tempo real
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fat-mensal-r6" className="text-xs font-semibold text-slate-700">
                Faturamento Mensal (R$)
              </Label>
              <Input
                id="fat-mensal-r6"
                type="number"
                value={faturamentoMensal}
                onChange={(e) => setFaturamentoMensal(Number(e.target.value) || 0)}
                className="h-10 text-sm font-semibold"
              />
              <span className="text-[11px] text-slate-400">
                Anual: {formatarMoeda(faturamentoAnual)}
              </span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="folha-mensal-r6" className="text-xs font-semibold text-slate-700">
                Folha Mensal (R$)
              </Label>
              <Input
                id="folha-mensal-r6"
                type="number"
                value={folhaMensal}
                onChange={(e) => setFolhaMensal(Number(e.target.value) || 0)}
                className="h-10 text-sm font-semibold"
              />
              <span className="text-[11px] text-slate-400">Impacta Fator R e INSS</span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desp-cred-r6" className="text-xs font-semibold text-slate-700">
                Despesas c/ Crédito (R$)
              </Label>
              <Input
                id="desp-cred-r6"
                type="number"
                value={despesasCreditosMensal}
                onChange={(e) => setDespesasCreditosMensal(Number(e.target.value) || 0)}
                className="h-10 text-sm font-semibold"
              />
              <span className="text-[11px] text-slate-400">Créditos Real e IBS/CBS</span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="margem-lucro-r6" className="text-xs font-semibold text-slate-700">
                Margem Estimada (%)
              </Label>
              <Input
                id="margem-lucro-r6"
                type="number"
                value={margemLucro}
                onChange={(e) => setMargemLucro(Number(e.target.value) || 0)}
                className="h-10 text-sm font-semibold"
              />
              <span className="text-[11px] text-slate-400">Cálculo do Lucro Real</span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ano-base-r6" className="text-xs font-semibold text-slate-700">
                Ano do Novo Sistema
              </Label>
              <Select
                value={String(anoBase)}
                onValueChange={(val) => setAnoBase(Number(val) as AnoBaseSimulacao)}
              >
                <SelectTrigger id="ano-base-r6" className="h-10 text-sm font-semibold">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {ANOS_SIMULACAO_DISPONIVEIS.map((a) => (
                    <SelectItem key={a} value={String(a)}>
                      Ano {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-[11px] text-[#D4AF37] font-semibold">
                Transição vigência {anoBase}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* PARTE 1: FLUXO DE DECISÃO EM 4 PERGUNTAS (DO MÓDULO 6) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/30 uppercase mb-1">
              <GitCompare className="w-3.5 h-3.5" />
              <span>
                {modo === 'trilha'
                  ? 'Hipótese Qualitativa de Regime (4 Perguntas)'
                  : 'Fluxo de Decisão Interativo'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-heading font-black text-[#07132B]">
              {modo === 'trilha'
                ? 'Hipótese Inicial do Perfil de Operação'
                : 'Qual o regime ideal para sua operação?'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {modo === 'trilha'
                ? 'As 4 perguntas geram uma hipótese preliminar de regime, confrontada em seguida com a análise numérica dos seus números (faturamento, folha, margem e créditos). A recomendação final é única e calculada pelos números.'
                : 'Simples Tradicional, Simples Híbrido ou Regime Normal? Responda a 4 perguntas essenciais.'}
            </p>
          </div>

          {Object.keys(respostas).length > 0 && modo === 'reforma' && (
            <button
              type="button"
              onClick={reiniciar}
              className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reiniciar perguntas
            </button>
          )}
        </div>

        <div className="space-y-6">
          {PERGUNTAS_COMPARADOR.map((p, idx) => (
            <div key={p.id} className="p-5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-start gap-3 mb-3">
                <span className="w-6 h-6 rounded-full bg-[#07132B] text-[#D4AF37] text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-heading font-bold text-sm sm:text-base text-[#07132B]">
                      {p.pergunta}
                    </h3>
                    {respostasPreenchidas[p.id] !== undefined && (
                      <BadgeOrigemPropagada origem="configuracoes" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{p.explicacao}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3 pl-0 sm:pl-9">
                {p.opcoes.map((opcao) => {
                  const isSelected = respostas[p.id] === opcao.valor
                  return (
                    <button
                      key={opcao.valor}
                      type="button"
                      onClick={() => handleSelectOption(p.id, opcao.valor)}
                      className={`p-3 rounded-xl text-left text-xs sm:text-sm font-medium transition-all border ${
                        isSelected
                          ? 'bg-[#07132B] text-white border-[#07132B] shadow-md'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-[#D4AF37] bg-[#D4AF37]' : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#07132B]" />}
                        </span>
                        <span>{opcao.texto}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* BOTÃO GERAR VEREDITO (QUANDO NO MODO REFORMA OU QUANDO RECALCULAR) */}
        {modo === 'reforma' && (
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-500">
              {Object.keys(respostas).length} de {PERGUNTAS_COMPARADOR.length} respondidas
            </span>

            <button
              type="button"
              disabled={!todasRespondidas}
              onClick={() => setMostrarResultado(true)}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                todasRespondidas
                  ? 'bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] text-[#07132B] shadow-lg hover:brightness-110 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#07132B]" />
              Ver Regime Recomendado
            </button>
          </div>
        )}

        {/* RESULTADO INTERATIVO DO QUESTIONÁRIO QUALITATIVO (MODO REFORMA) */}
        {modo === 'reforma' && mostrarResultado && (
          <div className="mt-8 p-6 sm:p-8 rounded-2xl bg-[#07132B] text-white border-2 border-[#D4AF37] shadow-xl animate-fade-in">
            <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              Resultado da Simulação Preliminar
            </div>
            <h3 className="text-2xl sm:text-3xl font-heading font-black text-white mb-3">
              Regime sugerido: <span className="text-[#D4AF37]">{regimeVencedor}</span>
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed mb-6">{justificativa}</p>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 leading-relaxed mb-6">
              <strong className="text-white block mb-1">Observação do Especialista Diamond:</strong>
              A opção pelo Simples Híbrido é anual e deve ser manifestada perante a Receita Federal
              até o último dia útil de setembro de cada ano, para vigorar no ano fiscal seguinte.
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/diagnostico"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-[#07132B] bg-[#D4AF37] hover:bg-[#F3E5AB] transition-colors"
              >
                Fazer diagnóstico numérico completo (com CNPJ)
                <ArrowRight className="w-4 h-4 text-[#07132B]" />
              </Link>
            </div>
          </div>
        )}

        {/* RESUMO DA HIPÓTESE INICIAL NO MODO TRILHA */}
        {modo === 'trilha' && (
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50/70 p-4 rounded-xl border border-slate-200/60">
            <div className="flex items-center gap-2 text-slate-700">
              <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span>
                Hipótese preliminar gerada pelo perfil:{' '}
                <strong className="text-[#07132B] font-bold">{regimeVencedor}</strong>
              </span>
            </div>
            <span className="text-slate-500 font-medium text-[11px]">
              Esta hipótese é confrontada com a análise numérica abaixo
            </span>
          </div>
        )}
      </div>

      {/* SE FOR NA TRILHA: DESTAQUE UNIFICADO DO VEREDITO (QUALITATIVO + NUMÉRICO) */}
      {modo === 'trilha' && (
        <section className="bg-gradient-to-r from-[#07132B] via-[#0A1A13] to-[#07132B] text-white rounded-[26px] p-6 sm:p-10 border-2 border-[#D4AF37] shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#D4AF37] text-[#07132B]">
                <Trophy className="w-3.5 h-3.5" />
                <span>Recomendação Final Única • Decisão Numérica Conclusiva</span>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider mb-1">
                  Regime Recomendado pelo Motor de Cálculo
                </span>
                <h3 className="font-heading font-black text-2xl sm:text-4xl text-white">
                  <span className="text-[#D4AF37]">{resultadosRegimes.melhorRegime?.nome}</span>
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                A recomendação final é estritamente calculada pelo motor numérico com base no
                faturamento, folha de pagamento, margem e créditos tributários da sua empresa. As 4
                perguntas geraram uma hipótese preliminar confrontada abaixo com a realidade fiscal
                dos números.
              </p>

              {/* SELO DE CONVERGÊNCIA OU AVISO DE DIVERGÊNCIA */}
              {analiseConvergencia.convergem ? (
                <div className="p-4 rounded-xl bg-[#2ECC71]/15 border border-[#2ECC71]/40 text-emerald-100 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#2ECC71] text-[#07132B] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-[#07132B]" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading font-black text-sm text-white">
                        ✓ Sua análise de perfil e os números convergem!
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#2ECC71]/30 text-[#2ECC71]">
                        Hipótese Confirmada
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      A hipótese preliminar derivada das 4 perguntas (
                      <strong className="text-white font-semibold">
                        {analiseConvergencia.hipoteseNome}
                      </strong>
                      ) coincide com o regime mais econômico calculado matematicamente (
                      <strong className="text-[#D4AF37] font-semibold">
                        {resultadosRegimes.melhorRegime?.nome}
                      </strong>
                      ). Seu posicionamento comercial e seus parâmetros contábeis apontam na mesma
                      direção.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 sm:p-5 rounded-xl bg-[#0A1A13] border-2 border-[#D4AF37] text-slate-100 space-y-2.5 shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#D4AF37] text-[#07132B] flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4 text-[#07132B]" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap justify-between">
                        <span className="font-heading font-extrabold text-sm sm:text-base text-white">
                          Aviso de Divergência: Por que a Recomendação Numérica Prevalece
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          Números Prevalecem
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 flex items-center gap-2 flex-wrap pt-0.5">
                        <span>
                          Hipótese do perfil (4 perguntas):{' '}
                          <span className="text-slate-200 line-through decoration-amber-400 font-semibold">
                            {analiseConvergencia.hipoteseNome}
                          </span>
                        </span>
                        <span>•</span>
                        <span>
                          Decisão final (motor numérico):{' '}
                          <strong className="text-[#2ECC71] font-bold">
                            {resultadosRegimes.melhorRegime?.nome}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pl-0 sm:pl-10 space-y-2 text-xs">
                    {analiseConvergencia.limiarRompido && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[#D4AF37] font-semibold">
                        <span>Limiar chave acionado:</span>
                        <span className="text-white font-bold">
                          {analiseConvergencia.limiarRompido}
                        </span>
                      </div>
                    )}
                    <p className="text-slate-200 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/10">
                      {analiseConvergencia.motivoDivergencia}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white/10 border border-white/15 text-left md:text-right shrink-0">
              <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider block">
                Economia Anual Projetada
              </span>
              <span className="font-heading font-black text-2xl sm:text-4xl text-emerald-400">
                {formatarMoeda(resultadosRegimes.economiaAnualMaxima)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                Frente ao regime mais oneroso calculado
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[11px] font-bold text-[#D4AF37] block">Simples Nacional:</span>
              <span className="font-heading font-bold text-sm text-white">
                {resultadosRegimes.todos.find((r) => r.id === 'simples')?.cargaAnual !== Infinity
                  ? formatarMoeda(
                      resultadosRegimes.todos.find((r) => r.id === 'simples')?.cargaAnual || 0,
                    )
                  : 'Inelegível (> R$ 4,8M)'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[11px] font-bold text-[#D4AF37] block">Lucro Presumido:</span>
              <span className="font-heading font-bold text-sm text-white">
                {formatarMoeda(
                  resultadosRegimes.todos.find((r) => r.id === 'presumido')?.cargaAnual || 0,
                )}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[11px] font-bold text-[#D4AF37] block">
                Novo Sistema Dual ({anoBase}):
              </span>
              <span className="font-heading font-bold text-sm text-white">
                {formatarMoeda(
                  resultadosRegimes.todos.find((r) => r.id === 'novo_dual')?.cargaAnual || 0,
                )}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* SE FOR NA TRILHA: RANKING COMPLETO DOS 4 REGIMES */}
      {modo === 'trilha' && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-[#07132B]">
              Ranking Completo de Carga Tributária Anual
            </h3>
            <span className="text-xs text-slate-500 font-semibold">
              Ordenado do menor ao maior desembolso anual
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resultadosRegimes.todos.map((regime) => {
              const isMelhor = resultadosRegimes.melhorRegime?.id === regime.id
              const diffMelhor =
                regime.cargaAnual !== Infinity
                  ? regime.cargaAnual - resultadosRegimes.melhorRegime.cargaAnual
                  : 0

              return (
                <div
                  key={regime.id}
                  className={`bg-white rounded-2xl p-6 border transition-all space-y-4 ${
                    isMelhor
                      ? 'border-2 border-[#2ECC71] shadow-lg ring-1 ring-[#2ECC71]/30'
                      : regime.elegivel
                        ? 'border-slate-200 shadow-sm hover:border-slate-300'
                        : 'border-slate-200 bg-slate-50/50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-heading font-extrabold text-lg text-[#07132B]">
                          {regime.nome}
                        </h4>
                        {isMelhor && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#2ECC71]/20 text-[#145A32] border border-[#2ECC71]/40 uppercase">
                            Recomendado
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 mt-0.5 block">
                        {regime.motivoElegibilidade}
                      </span>
                    </div>

                    <div className="text-right">
                      {regime.elegivel && regime.cargaAnual !== Infinity ? (
                        <>
                          <span className="font-heading font-black text-xl text-[#07132B] block">
                            {formatarMoeda(regime.cargaAnual)}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            Alíq. Efetiva: {regime.aliquotaEfetiva.toFixed(2)}%
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded">
                          Não Elegível
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Vantagens / Desvantagens */}
                  <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-100">
                    <div className="space-y-1">
                      <span className="font-bold text-emerald-800 uppercase text-[10px] block">
                        Vantagem:
                      </span>
                      <p className="text-slate-600 leading-snug">{regime.vantagens[0]}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="font-bold text-amber-800 uppercase text-[10px] block">
                        Atenção:
                      </span>
                      <p className="text-slate-600 leading-snug">{regime.desvantagens[0]}</p>
                    </div>
                  </div>

                  {!isMelhor && regime.elegivel && regime.cargaAnual !== Infinity && (
                    <div className="text-[11px] text-rose-700 bg-rose-50/70 p-2 rounded-lg font-semibold flex items-center justify-between">
                      <span>Custo Adicional Anual:</span>
                      <span className="font-mono font-bold">+{formatarMoeda(diffMelhor)}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* SE FOR NA TRILHA: IMPACTO DO SPLIT PAYMENT NO CAPITAL DE GIRO */}
      {modo === 'trilha' &&
        (() => {
          const retencaoMensalNota =
            faturamentoMensal * 0.265 * (1 - reducaoSetor.percentualReducao / 100)
          const recolhimentoAtualMensal = (resultadosRegimes.melhorRegime?.cargaAnual || 0) / 12
          const diferencaFluxoCaixa = retencaoMensalNota - recolhimentoAtualMensal
          const taxaMensalCapital = 1.0 // 1% a.m.
          const diasAntecipacao = 30
          const custoCapitalMensal = retencaoMensalNota * 0.01
          const custoCapitalAnual = custoCapitalMensal * 12

          const resultadoSplitPaymentObj = {
            retencaoMensalNota,
            recolhimentoAtualMensal,
            diferencaFluxoCaixa,
            taxaMensalCapital,
            diasAntecipacao,
            custoCapitalMensal,
            custoCapitalAnual,
            explicacaoSimples:
              'No novo sistema (IBS/CBS), a retenção ocorre na conta no momento em que o cliente paga a nota fiscal (split payment). No sistema atual, a empresa segura o dinheiro até a guia do mês seguinte, usando esse caixa como capital de giro sem juros por 30 a 50 dias.',
          }

          return (
            <BlocoSplitPayment
              resultadoSplitPayment={resultadoSplitPaymentObj}
              taxaMensalCapitalGiro={taxaMensalCapital}
              setTaxaMensalCapitalGiro={() => {}}
              diasAntecipacaoSplit={diasAntecipacao}
              setDiasAntecipacaoSplit={() => {}}
              regimeAtualNome={dadosEmpresa?.regimeAtual || 'Simples Nacional'}
            />
          )
        })()}

      {/* PARTE 2: OS 3 CENÁRIOS PRÁTICOS MAIS COMUNS (COMPARTILHADO EM AMBOS OS MODOS) */}
      <div className="space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/30 uppercase mb-1">
            <Scale className="w-3.5 h-3.5" />
            <span>Estudos de Caso de Referência • Módulo 6</span>
          </div>
          <h2 className="text-2xl font-heading font-black text-[#07132B]">
            Os 3 Cenários Práticos Mais Comuns
          </h2>
          <p className="text-slate-600 text-sm mt-1">
            Veja como empresas com modelos de negócios reais estão se posicionando frente à Reforma:
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {CENARIOS_COMUNS_COMPARADOR.map((cen) => (
            <div
              key={cen.titulo}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-[#D4AF37] transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Estudo de Caso
                </span>
                <h3 className="font-heading font-bold text-base text-[#07132B] mt-1 mb-3">
                  {cen.titulo}
                </h3>

                <div className="inline-block px-3 py-1 rounded-md text-xs font-extrabold text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/30 mb-4">
                  {cen.regimeRecomendado}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-4">{cen.descricao}</p>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed mb-4">
                  <strong className="text-slate-900 block mb-1">Por que esse regime?</strong>
                  {cen.motivo}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-[#07132B] font-semibold bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                <strong className="text-amber-900 block mb-0.5">Dica de Ouro:</strong>
                {cen.dicaOuro}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SE FOR NA TRILHA: CARD DE SALVAMENTO & AVANÇO */}
      {modo === 'trilha' && (
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-heading font-extrabold text-lg text-[#07132B]">
              Salvar Diagnóstico de Comparação de Regime
            </h3>
            <p className="text-xs text-slate-600">
              Grave o ranking e o parecer na sua conta para consulta e acompanhamento pelo time
              Diamond.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {onSalvarDiagnostico && (
              <Button
                type="button"
                onClick={handleSalvar}
                disabled={salvando}
                className="bg-[#D4AF37] hover:bg-[#c49f2e] text-[#07132B] font-bold text-xs sm:text-sm h-11 px-6 rounded-xl"
              >
                <Save className="w-4 h-4 mr-2" />
                {salvando ? 'Salvando...' : 'Salvar Diagnóstico na Conta'}
              </Button>
            )}

            <Link
              to="/diagnostico"
              className="inline-flex items-center justify-center gap-2 bg-[#07132B] hover:brightness-110 text-white font-bold text-xs sm:text-sm h-11 px-6 rounded-xl transition-all"
            >
              <span>Avançar para Etapa 4: Enquadramento Completo (com PDF)</span>
              <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
            </Link>
          </div>
        </section>
      )}

      {modo === 'trilha' && salvoFeedback && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Diagnóstico de Comparação de Regime salvo com sucesso na sua conta!</span>
        </div>
      )}
    </div>
  )
}
