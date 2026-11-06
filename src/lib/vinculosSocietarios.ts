/**
 * Motor de análise de Vínculos Societários & Risco de Regime Tributário
 *
 * Base legal:
 * - Lei Complementar nº 123/2006 (Estatuto Nacional da ME e EPP), art. 3º, §§ 4º e 9º
 * - Resolução CGSN nº 140/2018, art. 15
 *
 * Regras:
 * 1. Cliente (PF) sócio de 2+ empresas do Simples Nacional:
 *    -> Soma global das receitas brutas anuais vs. R$ 4.800.000 (art. 3º, §4º, III).
 * 2. Sócio PF com mais de 10% (ou administrador) de PJ fora do Simples (Presumido/Real):
 *    -> Soma condicional das receitas vs. R$ 4.800.000 (art. 3º, §4º, IV e V).
 * 3. Holding / PJ como sócia da empresa analisada:
 *    -> Vedação expressa (art. 3º, §4º, I) — Risco Crítico / Exclusão de ofício.
 * 4. Empresa analisada participando do capital de outra PJ:
 *    -> Vedação expressa (art. 3º, §4º, VII) — Risco Crítico (salvo exceções legais).
 * 5. Excesso de faturamento global:
 *    -> Até 20% acima do teto (R$ 5.760.000): efeitos no ano-calendário seguinte.
 *    -> Superior a 20% acima do teto (> R$ 5.760.000): exclusão retroativa/imediata.
 *
 * Padrão do projeto: módulo puramente informativo/indicativo.
 * NUNCA marca teses nem altera cálculos tributários existentes.
 */

import { VinculoSocietario } from '@/types/dadosEmpresa'

export const TETO_SIMPLES_NACIONAL = 4800000
export const TETO_SIMPLES_TOLERANCIA_20 = 5760000 // 4.800.000 * 1.20
export const SUBLIMITE_SIMPLES = 3600000

export type SeveridadeAchado = 'critico' | 'atencao' | 'regular'

export interface AchadoVinculoSocietario {
  id: string
  severidade: SeveridadeAchado
  titulo: string
  descricao: string
  norma: string
  normaOrigem: string
  impactoRegime: string
  recomendacao: string
  vinculoId?: string
  linkLegislacao?: string
}

export interface ResultadoAnaliseVinculos {
  totalVinculos: number
  temVedacaoCritica: boolean
  ultrapassouTeto: boolean
  ultrapassouTolerancia20: boolean
  faturamentoProprioAnual: number
  faturamentoGlobalSimples: number
  faturamentoSomaCondicional: number
  statusGeral: SeveridadeAchado
  achados: AchadoVinculoSocietario[]
}

export function analisarVinculosSocietarios(params: {
  regimeAtual?: string
  faturamentoAnualProprio: number
  vinculos?: VinculoSocietario[]
}): ResultadoAnaliseVinculos {
  const { regimeAtual = 'Simples Nacional', faturamentoAnualProprio, vinculos = [] } = params

  const achados: AchadoVinculoSocietario[] = []
  const isSimples = regimeAtual.toLowerCase().includes('simples')

  if (!vinculos || vinculos.length === 0) {
    return {
      totalVinculos: 0,
      temVedacaoCritica: false,
      ultrapassouTeto: false,
      ultrapassouTolerancia20: false,
      faturamentoProprioAnual: faturamentoAnualProprio,
      faturamentoGlobalSimples: faturamentoAnualProprio,
      faturamentoSomaCondicional: faturamentoAnualProprio,
      statusGeral: 'regular',
      achados: [],
    }
  }

  let faturamentoGlobalSimples = faturamentoAnualProprio
  let faturamentoSomaCondicional = faturamentoAnualProprio
  let temVedacaoCritica = false

  vinculos.forEach((v) => {
    const nomeExibicao = v.nomeEmpresa || v.cnpj || 'Outra PJ'
    const fatVinc = Number(v.faturamentoAnual) || 0
    const part = Number(v.percentualParticipacao) || 0
    const adm = Boolean(v.exerceAdministracao)
    const isVincSimples = v.regimeEmpresa?.toLowerCase().includes('simples')

    // Regra 3: Holding/PJ como sócia da empresa analisada (art. 3º, §4º, I)
    if (v.papelCliente === 'pj_socia_holding') {
      temVedacaoCritica = true
      achados.push({
        id: `vedacao-pj-socia-${v.id}`,
        vinculoId: v.id,
        severidade: 'critico',
        titulo: `Vedação Legal Crítica: Pessoa Jurídica no quadro societário (${nomeExibicao})`,
        descricao: `A empresa analisada possui participação de outra pessoa jurídica (${nomeExibicao}, CNPJ: ${v.cnpj || 'não informado'}). A legislação veda expressamente a opção ou permanência no Simples Nacional para empresas cujo capital participe outra pessoa jurídica.`,
        norma: 'LC 123/2006, art. 3º, § 4º, inciso I; Resolução CGSN 140/2018, art. 15, I',
        normaOrigem: 'LC 123/2006, art. 3º, § 4º, I',
        impactoRegime: 'Exclusão de ofício do Simples Nacional com desenquadramento obrigatório.',
        recomendacao:
          'Adequar a estrutura societária caso haja intenção de permanência no Simples Nacional, ou planejar a migração para Lucro Presumido ou Lucro Real.',
      })
    }

    // Regra 4: Empresa analisada participando do capital de outra PJ (art. 3º, §4º, VII)
    if (v.papelCliente === 'empresa_participa_outra') {
      if (v.excecaoLegal) {
        achados.push({
          id: `excecao-participacao-${v.id}`,
          vinculoId: v.id,
          severidade: 'regular',
          titulo: `Participação societária com ressalva legal (${nomeExibicao})`,
          descricao: `A participação no capital de ${nomeExibicao} está declarada sob exceção legal prevista em lei (central de compras, cooperativa de crédito, consórcio ou joint venture autorizada).`,
          norma: 'LC 123/2006, art. 3º, § 4º, inciso VII e legislação correlata',
          normaOrigem: 'LC 123/2006, art. 3º, § 4º, VII (Exceção)',
          impactoRegime: 'Permitido, desde que formalmente enquadrada nas hipóteses excepcionais.',
          recomendacao:
            'Manter arquivada a documentação comprobatória da exceção legal para eventual fiscalização.',
        })
      } else {
        temVedacaoCritica = true
        achados.push({
          id: `vedacao-participa-outra-${v.id}`,
          vinculoId: v.id,
          severidade: 'critico',
          titulo: `Vedação Legal Crítica: Participação no capital de outra PJ (${nomeExibicao})`,
          descricao: `A empresa analisada participa do capital social de outra pessoa jurídica (${nomeExibicao}). A LC 123/2006 veda que optante do Simples participe do capital de outra PJ.`,
          norma: 'LC 123/2006, art. 3º, § 4º, inciso VII; Resolução CGSN 140/2018, art. 15, VII',
          normaOrigem: 'LC 123/2006, art. 3º, § 4º, VII',
          impactoRegime: 'Causa impeditiva e motivo de exclusão obrigatória do Simples Nacional.',
          recomendacao:
            'Desinvestir da participação social ou formalizar consórcio/cooperativa legalmente autorizada.',
        })
      }
    }

    // Regra 1: Sócio PF participante de 2+ empresas optantes do Simples (art. 3º, §4º, III)
    if (isVincSimples && (v.papelCliente === 'socio_pf' || v.papelCliente === 'administrador')) {
      faturamentoGlobalSimples += fatVinc
      achados.push({
        id: `soma-simples-vinculo-${v.id}`,
        vinculoId: v.id,
        severidade: 'atencao',
        titulo: `Soma Global de Receitas: Empresa do Simples vinculada (${nomeExibicao})`,
        descricao: `O cliente/sócio participa de outra empresa optante pelo Simples Nacional (${nomeExibicao}, CNPJ: ${v.cnpj || 'não informado'}, receita: R$ ${fatVinc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}). A receita bruta anual de todas as empresas do Simples das quais o titular ou sócio participe deve ser somada para aferição do limite de R$ 4,8 milhões.`,
        norma: 'LC 123/2006, art. 3º, § 4º, inciso III; Resolução CGSN 140/2018, art. 15, III',
        normaOrigem: 'LC 123/2006, art. 3º, § 4º, III',
        impactoRegime:
          'Soma obrigatória de receitas para verificação do limite do Simples Nacional.',
        recomendacao:
          'Monitorar mensalmente a receita global somada das empresas optantes para controle tempestivo do teto.',
      })
    }

    // Regra 2: Sócio PF com mais de 10% ou administrador de PJ fora do Simples
    if (!isVincSimples && (v.papelCliente === 'socio_pf' || v.papelCliente === 'administrador')) {
      if (part > 10 || adm) {
        faturamentoSomaCondicional += fatVinc
        const motivo =
          part > 10 && adm
            ? '>10% e administração'
            : part > 10
              ? `participação de ${part}% (>10%)`
              : 'exerce administração'
        achados.push({
          id: `soma-condicional-${v.id}`,
          vinculoId: v.id,
          severidade: 'atencao',
          titulo: `Soma Global Condicional: Vínculo com PJ do ${v.regimeEmpresa} (${nomeExibicao})`,
          descricao: `O sócio detém ${motivo} em pessoa jurídica não optante (${nomeExibicao}, regime: ${v.regimeEmpresa}, receita: R$ ${fatVinc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}). A receita bruta global de ambas as empresas deve ser somada para aferição do teto de R$ 4,8 milhões.`,
          norma:
            'LC 123/2006, art. 3º, § 4º, incisos IV e V; Resolução CGSN 140/2018, art. 15, IV e V',
          normaOrigem: 'LC 123/2006, art. 3º, § 4º, IV/V',
          impactoRegime:
            'Soma obrigatória de receitas para verificação do limite do Simples Nacional.',
          recomendacao:
            'Monitorar rigorosamente a receita bruta acumulada das duas empresas para evitar exclusão de ofício retroativa.',
        })
      }
    }
  })

  // Avaliação dos Tetos de Faturamento Global
  const receitaGlobalEfetiva = Math.max(faturamentoGlobalSimples, faturamentoSomaCondicional)
  const ultrapassouTeto = receitaGlobalEfetiva > TETO_SIMPLES_NACIONAL
  const ultrapassouTolerancia20 = receitaGlobalEfetiva > TETO_SIMPLES_TOLERANCIA_20

  if (isSimples && ultrapassouTolerancia20) {
    achados.push({
      id: 'excesso-faturamento-grave',
      severidade: 'critico',
      titulo: 'Excesso Crítico de Faturamento Global (> 20% acima do teto de R$ 4,8M)',
      descricao: `A receita bruta global somada (R$ ${receitaGlobalEfetiva.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) ultrapassa o teto do Simples Nacional em mais de 20% (limite de tolerância: R$ ${TETO_SIMPLES_TOLERANCIA_20.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).`,
      norma: 'LC 123/2006, art. 3º, §§ 9º e 9º-A; Resolução CGSN 140/2018',
      normaOrigem: 'LC 123/2006, art. 3º, § 9º (>20%)',
      impactoRegime:
        'Exclusão do Simples Nacional com efeitos retroativos ao início do ano-calendário (ou mês seguinte ao excesso se empresa nova).',
      recomendacao:
        'Planejar imediatamente a migração para Lucro Presumido ou Lucro Real e auditar possíveis passivos fiscais decorrentes de recolhimento a menor.',
    })
  } else if (isSimples && ultrapassouTeto) {
    achados.push({
      id: 'excesso-faturamento-tolerancia',
      severidade: 'atencao',
      titulo: 'Atenção: Faturamento Global acima do teto de R$ 4,8M (até 20% de tolerância)',
      descricao: `A receita bruta global somada (R$ ${receitaGlobalEfetiva.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) ultrapassa R$ 4.800.000, porém permanece dentro da margem de tolerância de 20% (até R$ ${TETO_SIMPLES_TOLERANCIA_20.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).`,
      norma: 'LC 123/2006, art. 3º, §§ 9º e 10; Resolução CGSN 140/2018',
      normaOrigem: 'LC 123/2006, art. 3º, §§ 9º e 10 (até 20%)',
      impactoRegime:
        'Desenquadramento do Simples Nacional com efeitos a partir de 1º de janeiro do ano-calendário seguinte.',
      recomendacao:
        'Preparar a transição contábil e tributária da empresa para o próximo exercício (Lucro Presumido ou Lucro Real sob IBS/CBS).',
    })
  } else if (isSimples && receitaGlobalEfetiva >= 4320000) {
    achados.push({
      id: 'alerta-proximidade-teto',
      severidade: 'atencao',
      titulo: 'Monitoramento: Faturamento Global acima de 90% do teto legal',
      descricao: `A receita bruta global somada das empresas vinculadas atingiu R$ ${receitaGlobalEfetiva.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, superando 90% do limite legal de R$ 4.800.000.`,
      norma: 'LC 123/2006, art. 3º, § 4º',
      normaOrigem: 'LC 123/2006, art. 3º, § 4º',
      impactoRegime: 'Risco iminente de desenquadramento nos próximos meses.',
      recomendacao:
        'Acompanhar mensalmente as emissões de notas fiscais de todo o grupo societário.',
    })
  }

  // Se tem achados informativos normais quando tudo está regular
  if (achados.length === 0) {
    achados.push({
      id: 'regularidade-societaria',
      severidade: 'regular',
      titulo: 'Vínculos Societários em Conformidade Legal',
      descricao: `Os ${vinculos.length} vínculo(s) societário(s) cadastrado(s) foram analisados. A receita global somada (R$ ${receitaGlobalEfetiva.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) está dentro do teto de R$ 4,8 milhões e não há vedações societárias expressas.`,
      norma: 'LC 123/2006, art. 3º; Resolução CGSN 140/2018, art. 15',
      normaOrigem: 'LC 123/2006, art. 3º / CGSN 140 art. 15',
      impactoRegime: 'Permanência regular no regime tributário.',
      recomendacao: 'Manter os cadastros atualizados periodicamente.',
    })
  }

  let statusGeral: SeveridadeAchado = 'regular'
  if (temVedacaoCritica || ultrapassouTolerancia20) {
    statusGeral = 'critico'
  } else if (ultrapassouTeto || achados.some((a) => a.severidade === 'atencao')) {
    statusGeral = 'atencao'
  }

  return {
    totalVinculos: vinculos.length,
    temVedacaoCritica,
    ultrapassouTeto,
    ultrapassouTolerancia20,
    faturamentoProprioAnual: faturamentoAnualProprio,
    faturamentoGlobalSimples,
    faturamentoSomaCondicional,
    statusGeral,
    achados,
  }
}
