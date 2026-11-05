/**
 * Mapeamento e Sugestão de Teses do Recuperador de Créditos via NCM (LC 214/2025).
 *
 * Reaproveita a tabela curada NCM da Etapa 06 (src/data/tabelaNcmLc214.ts):
 * - Monofásicos de bebidas, cigarros e combustíveis (2202, 2203, 2402, 2710...)
 * - Insumos agropecuários essenciais (3102, 3104, 3105, 1201, 1005, 3808, 2309...)
 * - Itens com redução:
 *   - Cesta básica Anexo XII (alíquota zero / redução 100%: 1006, 0713, 0401, 1905, 1101, 0201, 0207...)
 *   - Redução 60% (hortícolas, frutas, saúde / medicamentos: 0702, 0701, 0803, 3004, 3002...)
 *   - Redução 30% (regime diferenciado: 8708, 8409, 9018...)
 *
 * Mapeamento para Teses do Recuperador:
 * - Monofásicos / Bebidas / Cigarros -> 'tese_pis_insumos_presumido' (Insumos Essenciais e Monofásicos)
 * - Insumos Agropecuários -> 'tese_pis_insumos_presumido' + 'tese_pis_subvencao_icms' + 'tese_pis_creditos_exportacao'
 * - Cesta Básica / Reduções 60% e 30% -> 'tese_pis_icms_base' + 'tese_pis_insumos_presumido'
 *
 * A seleção manual permanece sempre disponível com override irrestrito.
 */

import {
  buscarNcmPorCodigo,
  formatarCodigoNcm,
  type ItemNcmCurado,
  type CategoriaNcmLc214,
} from '@/data/tabelaNcmLc214'

export { buscarNcmPorCodigo, formatarCodigoNcm, type ItemNcmCurado, type CategoriaNcmLc214 }

export interface SugestaoNcmRecuperador {
  itemCurado: ItemNcmCurado
  tesesSugeridasIds: string[]
  categoriaRotulo: string
  motivoSugestao: string
  tipoAlvo:
    | 'monofasico'
    | 'agropecuario'
    | 'cesta_basica'
    | 'reducao_60'
    | 'reducao_30'
    | 'regime_geral'
}

/**
 * Retorna as sugestões de teses aplicáveis com base no item NCM identificado.
 */
export function sugerirTesesPorItemNcm(itemCurado: ItemNcmCurado): SugestaoNcmRecuperador {
  const cat: CategoriaNcmLc214 = itemCurado.categoria
  const codigoLimpo = itemCurado.codigoLimpo

  // 1. Monofásicos e Bens Sujeitos ao Imposto Seletivo (bebidas frias, cigarros, combustíveis)
  if (
    cat === 'monofasico_imposto_seletivo' ||
    codigoLimpo.startsWith('22') ||
    codigoLimpo.startsWith('24') ||
    codigoLimpo.startsWith('2710')
  ) {
    return {
      itemCurado,
      tesesSugeridasIds: [
        'tese_pis_insumos_presumido', // Segregação de receitas monofásicas / insumos essenciais
        'tese_pis_icms_base', // Exclusão do ICMS da base do PIS/COFINS
      ],
      categoriaRotulo: 'Monofásico / Imposto Seletivo',
      motivoSugestao:
        'Produto com tributação concentrada/monofásica ou Imposto Seletivo (LC 214/2025). Sugere segregação monofásica (PIS-03) e exclusão do ICMS da base (PIS-01).',
      tipoAlvo: 'monofasico',
    }
  }

  // 2. Insumos Agropecuários (fertilizantes, sementes, defensivos, rações)
  if (
    cat === 'insumos_agropecuarios' ||
    codigoLimpo.startsWith('31') ||
    codigoLimpo.startsWith('3808') ||
    codigoLimpo.startsWith('1201') ||
    codigoLimpo.startsWith('1005') ||
    codigoLimpo.startsWith('2309')
  ) {
    return {
      itemCurado,
      tesesSugeridasIds: [
        'tese_pis_insumos_presumido', // Insumos essenciais agropecuários (Tema 329 STJ)
        'tese_pis_subvencao_icms', // Subvenções e benefícios estaduais de ICMS (Tema 1.182)
        'tese_pis_creditos_exportacao', // Créditos acumulados de exportação no agronegócio
      ],
      categoriaRotulo: 'Insumo Agropecuário Essencial',
      motivoSugestao:
        'Insumo agropecuário com manutenção assegurada de crédito e desoneração (LC 214/2025). Sugere tese de insumos essenciais (PIS-03), subvenções de ICMS (PIS-04) e ressarcimento de exportação (PIS-05).',
      tipoAlvo: 'agropecuario',
    }
  }

  // 3. Cesta Básica Nacional (Anexo XII da LC 214/2025 — Alíquota Zero / Redução 100%)
  if (cat === 'cesta_basica_anexo_xii') {
    return {
      itemCurado,
      tesesSugeridasIds: [
        'tese_pis_icms_base', // Exclusão de ICMS em itens da cesta básica
        'tese_pis_insumos_presumido', // Insumos alimentícios essenciais
      ],
      categoriaRotulo: 'Cesta Básica Nacional (Anexo XII)',
      motivoSugestao:
        'Item da Cesta Básica Nacional desonerado na LC 214/2025. Sugere exclusão do ICMS da base (PIS-01) e creditamento de insumos da cadeia alimentar (PIS-03).',
      tipoAlvo: 'cesta_basica',
    }
  }

  // 4. Redução de 60% (Hortícolas, Frutas, Saúde e Medicamentos)
  if (
    cat === 'reducao_60' ||
    codigoLimpo.startsWith('07') ||
    codigoLimpo.startsWith('08') ||
    codigoLimpo.startsWith('300')
  ) {
    return {
      itemCurado,
      tesesSugeridasIds: [
        'tese_pis_icms_base', // Exclusão de ICMS da base
        'tese_pis_insumos_presumido', // Insumos com redução e essencialidade
      ],
      categoriaRotulo: 'Redução de 60% (LC 214/2025)',
      motivoSugestao:
        'Produto sujeito à redução de 60% de alíquota (LC 214/2025). Sugere tese do século de exclusão do ICMS (PIS-01) e insumos essenciais (PIS-03).',
      tipoAlvo: 'reducao_60',
    }
  }

  // 5. Redução de 30% (Bens e Componentes Diferenciados)
  if (
    cat === 'reducao_30' ||
    codigoLimpo.startsWith('8708') ||
    codigoLimpo.startsWith('8409') ||
    codigoLimpo.startsWith('9018')
  ) {
    return {
      itemCurado,
      tesesSugeridasIds: ['tese_pis_icms_base', 'tese_pis_insumos_presumido'],
      categoriaRotulo: 'Redução de 30% (Regime Diferenciado)',
      motivoSugestao:
        'Produto do regime diferenciado com redução de 30% (LC 214/2025). Sugere exclusão do ICMS (PIS-01) e insumos (PIS-03).',
      tipoAlvo: 'reducao_30',
    }
  }

  // 6. Regime Geral / Insumos Industriais
  return {
    itemCurado,
    tesesSugeridasIds: ['tese_pis_icms_base', 'tese_pis_insumos_presumido'],
    categoriaRotulo: 'Regime Geral de Insumos',
    motivoSugestao:
      'Insumo de produção com direito a creditamento no regime não-cumulativo. Sugere PIS-01 e PIS-03.',
    tipoAlvo: 'regime_geral',
  }
}

/**
 * Consulta um código NCM (com ou sem pontuação) e retorna a sugestão caso esteja na base curada.
 * Se não for encontrado, retorna null (garantindo fallback manual intacto).
 */
export function buscarSugestaoTesesPorNcm(
  codigoNcm?: string | null,
): SugestaoNcmRecuperador | null {
  if (!codigoNcm) return null
  const item = buscarNcmPorCodigo(codigoNcm)
  if (!item) return null
  return sugerirTesesPorItemNcm(item)
}

/**
 * Rótulo amigável para a origem da tese no parecer ou na interface.
 */
export function formatarOrigemTese(origem?: 'manual' | 'ncm_sugerido' | string): string {
  if (origem === 'ncm_sugerido') return 'Sugerido via NCM'
  return 'Manual'
}
