import {
  ParametrosSimulacaoCalculadora,
  ResultadosSimulacaoCalculadora,
  SimulacaoCalculadora,
} from '@/types/simulacaoCalculadora'
import {
  AnoTransicaoIbsCbs,
  CONFIGURACOES_PADRAO,
  CRONOGRAMA_FASES_TRANSICAO,
  PRESETS_SETORES_LC214,
  PresetSetorIbsCbs,
  RegimeDiferenciadoTipo,
} from '@/types/calculadoraIbsCbs'
import { calcularResultadosSimulacao } from '@/lib/calculoSimulacaoIbsCbs'

export interface VariacaoCenarioAutomatico {
  id: string
  titulo: string
  descricao: string
  regimeTributario: 'Lucro Real' | 'Lucro Presumido' | 'Simples Nacional'
  presetSetor: PresetSetorIbsCbs
  presetSetorNome: string
  anoTransicao: AnoTransicaoIbsCbs
  anoTransicaoRotulo: string
  // Valores calculados
  impostoAtualAnual: number
  impostoProjetadoAnual: number
  economiaAnualEstimada: number
  aliquotaEfetivaAtual: number
  aliquotaEfetivaProjetada: number
  recomendado: boolean
  parametrosSnapshot: ParametrosSimulacaoCalculadora
  resultadosSnapshot: ResultadosSimulacaoCalculadora
}

interface DefinicaoVariacao {
  titulo: string
  descricao: string
  regime: 'Lucro Real' | 'Lucro Presumido' | 'Simples Nacional'
  preset: PresetSetorIbsCbs
  ano: AnoTransicaoIbsCbs
}

/**
 * Mapeia e gera até 8 variações automáticas de cenário a partir de uma simulação base.
 * Varia:
 * 1. Regime tributário (Lucro Real, Lucro Presumido, Simples Nacional quando aplicável)
 * 2. Preset por Setor / Regime Aplicado da LC 214/2025 (padrão, redução 60%, redução 30%, alíquota zero etc.)
 * 3. Ano da Operação na transição (2026 teste, 2027 início CBS, 2029 início IBS gradual, 2033 pleno)
 */
export function gerarVariaveisCenariosAutomaticos(
  simulacaoBase: SimulacaoCalculadora,
): VariacaoCenarioAutomatico[] {
  const pBase: ParametrosSimulacaoCalculadora = {
    ...simulacaoBase.parametros,
    config: {
      ...CONFIGURACOES_PADRAO,
      ...(simulacaoBase.parametros?.config || {}),
    },
  }

  const faturamentoAnual =
    (pBase.faturamentoMensal || 0) * 12 || pBase.faturamentoAnualProjetado || 0

  const suportaSimples = faturamentoAnual <= 4800000

  // Selecionar 8 variações estratégicas cobrindo regimes, presets da LC 214 e anos-chave
  const definicoes: DefinicaoVariacao[] = []

  // 1. Cenário Pleno 2033 no Regime Presumido com Alíquota Geral (base de comparação tradicional)
  definicoes.push({
    titulo: 'Lucro Presumido · Alíquota Padrão (2033 Pleno)',
    descricao: 'Operação sob Lucro Presumido migrando para a alíquota geral plena da LC 214/2025.',
    regime: 'Lucro Presumido',
    preset: 'padrao',
    ano: 2033,
  })

  // 2. Cenário Pleno 2033 no Lucro Real (com aproveitamento amplo de créditos não-cumulativos)
  definicoes.push({
    titulo: 'Lucro Real · Não Cumulativo Amplo (2033 Pleno)',
    descricao: 'Lucro Real apurando créditos plenos de insumos, bens e serviços no IVA Dual.',
    regime: 'Lucro Real',
    preset: 'padrao',
    ano: 2033,
  })

  // 3. Se faturamento couber no Simples, variação Simples na Transição Plena
  if (suportaSimples) {
    definicoes.push({
      titulo: 'Simples Nacional · Transição LC 214 (2033)',
      descricao: 'Simples Nacional com apuração híbrida (DAS remanescente + IBS/CBS por fora).',
      regime: 'Simples Nacional',
      preset: 'padrao',
      ano: 2033,
    })
  } else {
    // Para grandes empresas: Lucro Real com redução de insumos/serviços
    definicoes.push({
      titulo: 'Lucro Real · Insumos Estratégicos (2029 Gradual)',
      descricao:
        'Início da transição do IBS em 2029 com créditos maximizados de despesas operacionais.',
      regime: 'Lucro Real',
      preset: 'padrao',
      ano: 2029,
    })
  }

  // 4. Variação com Preset LC 214: Redução de 60% (Saúde, Educação ou Bens Essenciais)
  definicoes.push({
    titulo: 'LC 214/2025 · Redução Setorial de 60%',
    descricao:
      'Aplicação do benefício de 60% de redução nas alíquotas de IBS e CBS (art. 9º LC 214).',
    regime: pBase.config?.regimeAtualEmpresa || 'Lucro Presumido',
    preset: 'saude_educacao',
    ano: 2033,
  })

  // 5. Variação com Preset LC 214: Redução de 30% (Serviços Regulamentados / Profissões)
  definicoes.push({
    titulo: 'LC 214/2025 · Redução de 30% (Prof. Regulamentadas)',
    descricao: 'Redução de 30% aplicável a profissões intelectuais regulamentadas na LC 214.',
    regime: 'Lucro Presumido',
    preset: 'transporte_intelectual',
    ano: 2033,
  })

  // 6. Variação com Preset LC 214: Alíquota Zero / Imunidade Específica
  definicoes.push({
    titulo: 'LC 214/2025 · Alíquota Zero / Cesta Básica Nacional',
    descricao: 'Isenção total de IBS e CBS com manutenção de créditos permitidos em lei.',
    regime: pBase.config?.regimeAtualEmpresa || 'Lucro Real',
    preset: 'cesta_basica',
    ano: 2033,
  })

  // 7. Variação Temporal: Ano 2027 (Entrada da CBS Federal a 8,8% e extinção PIS/COFINS)
  definicoes.push({
    titulo: 'Marco 2027 · Vigência da CBS Federal',
    descricao:
      'Extinção do PIS/COFINS e início da CBS federal (8,80%), com ICMS/ISS ainda vigentes.',
    regime: pBase.config?.regimeAtualEmpresa || 'Lucro Presumido',
    preset: (pBase.config?.presetSetor as PresetSetorIbsCbs) || 'padrao',
    ano: 2027,
  })

  // 8. Variação Temporal: Ano 2026 (Fase de Teste Operacional CBS 0,9% + IBS 0,1%)
  definicoes.push({
    titulo: 'Marco 2026 · Alíquota Teste de Transição',
    descricao:
      'Alíquotas de teste (CBS 0,90% e IBS 0,10%) compensáveis com PIS/COFINS sem acréscimo de carga.',
    regime: pBase.config?.regimeAtualEmpresa || 'Lucro Presumido',
    preset: 'padrao',
    ano: 2026,
  })

  // Limitar rigidamente a 8 cenários
  const selecionadas = definicoes.slice(0, 8)

  const variacoes: VariacaoCenarioAutomatico[] = selecionadas.map((def, idx) => {
    // Clonar e adaptar parâmetros
    const parametrosModificados: ParametrosSimulacaoCalculadora = {
      ...pBase,
      regimeAtualEmpresa: def.regime,
      regimeAtualFiltro: def.regime as any,
      regimeOperacao: def.preset as RegimeDiferenciadoTipo,
      anoOperacao: def.ano,
      anoTransicaoDashboard: def.ano,
      config: {
        ...CONFIGURACOES_PADRAO,
        ...(pBase.config || {}),
        anoTransicao: def.ano,
        presetSetor: def.preset,
        regimeAtualEmpresa: def.regime as any,
      },
    }

    const resultado = calcularResultadosSimulacao(parametrosModificados)

    // Imposto anual no sistema atual
    const impostoAtualMensal =
      resultado.resultadoDashboard.aliquotaEfetivaAtual > 0
        ? (parametrosModificados.faturamentoMensal *
            resultado.resultadoDashboard.aliquotaEfetivaAtual) /
          100
        : 0
    const impostoAtualAnual = impostoAtualMensal * 12

    // Imposto anual projetado no novo sistema
    const impostoProjetadoMensal =
      resultado.resultadoDashboard.aliquotaEfetivaNova > 0
        ? (parametrosModificados.faturamentoMensal *
            resultado.resultadoDashboard.aliquotaEfetivaNova) /
          100
        : 0
    const impostoProjetadoAnual = impostoProjetadoMensal * 12

    // Economia anual estimada: impostoAtualAnual - impostoProjetadoAnual
    const economiaAnualEstimada = impostoAtualAnual - impostoProjetadoAnual

    const presetInfo = PRESETS_SETORES_LC214.find((p) => p.id === def.preset)
    const presetNome = presetInfo ? presetInfo.titulo : 'Alíquota Padrão Geral'

    const faseCronograma = CRONOGRAMA_FASES_TRANSICAO[def.ano]
    const anoRotulo =
      def.ano === 'atual'
        ? 'Atual (Pré-Reforma)'
        : `${def.ano} (${faseCronograma?.fase || 'Transição'})`

    return {
      id: `cenario_auto_${idx + 1}_${def.ano}_${def.regime.toLowerCase().replace(/\s+/g, '_')}_${def.preset}`,
      titulo: def.titulo,
      descricao: def.descricao,
      regimeTributario: def.regime,
      presetSetor: def.preset,
      presetSetorNome: presetNome,
      anoTransicao: def.ano,
      anoTransicaoRotulo: anoRotulo,
      impostoAtualAnual,
      impostoProjetadoAnual,
      economiaAnualEstimada,
      aliquotaEfetivaAtual: resultado.resultadoDashboard.aliquotaEfetivaAtual,
      aliquotaEfetivaProjetada: resultado.resultadoDashboard.aliquotaEfetivaNova,
      recomendado: false,
      parametrosSnapshot: parametrosModificados,
      resultadosSnapshot: resultado,
    }
  })

  // Ordenar do melhor para o pior (maior economia anual primeiro)
  variacoes.sort((a, b) => b.economiaAnualEstimada - a.economiaAnualEstimada)

  // Marcar o primeiro como recomendado (o de maior economia)
  if (variacoes.length > 0) {
    variacoes[0].recomendado = true
  }

  return variacoes
}
