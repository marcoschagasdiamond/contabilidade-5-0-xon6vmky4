/**
 * Mapeamento informativo "atividade → tributos aplicáveis" (Contabilidade 5.0)
 * ------------------------------------------------------------------
 * SOMENTE INDICAÇÃO: não faz nenhum cálculo, não alimenta teses do Recuperador
 * nem altera qualquer fluxo existente. Dado o CNAE (código e/ou descrição) ou
 * o segmento do cadastro, devolve a lista de tributos que tipicamente incidem
 * sobre aquela atividade, com descrição curta e fundamento legal quando couber.
 *
 * Reforma Tributária: todas as atividades listadas estão sujeitas a IBS/CBS
 * a partir de 2026 (transição 2026–2033 — EC 132/2023 e LC 214/2025). O IS
 * (Imposto Seletivo) só atinge bens/serviços específicos; na maioria dos casos
 * a resposta é "não sujeito".
 */

export type CategoriaTributo = 'municipal' | 'estadual' | 'federal' | 'reforma'

export interface TributoAplicavel {
  id: string
  nome: string
  categoria: CategoriaTributo
  descricao: string
  fundamento?: string
}

export type TipoAtividadeFiscal = 'servico' | 'mercadoria' | 'mista' | 'rural' | 'desconhecida'

export interface ResultadoTributosAtividade {
  /** null quando não há correspondência suficiente para indicar tributos */
  grupoAtividade:
    | 'servico'
    | 'comercio'
    | 'industria'
    | 'transporte'
    | 'agro'
    | 'construcao'
    | 'bares_restaurantes'
    | 'energia_telecom'
    | null
  tipoAtividade: TipoAtividadeFiscal
  tributos: TributoAplicavel[]
  /** Indicação objetiva do Imposto Seletivo (IS) para a atividade */
  impostoSeletivo: { sujeito: boolean; observacao: string }
  observacoes: string[]
}

// Tributos com definição única reaproveitada entre grupos
const TRIB_ISS: TributoAplicavel = {
  id: 'iss',
  nome: 'ISS',
  categoria: 'municipal',
  descricao: 'Imposto Sobre Serviços de qualquer natureza, devido ao Município',
  fundamento: 'LC 116/2003',
}

const TRIB_ICMS: TributoAplicavel = {
  id: 'icms',
  nome: 'ICMS',
  categoria: 'estadual',
  descricao:
    'Imposto estadual sobre circulação de mercadorias e serviços de transporte/comunicação',
  fundamento: 'LC 87/1996 (Lei Kandir)',
}

const TRIB_IPI: TributoAplicavel = {
  id: 'ipi',
  nome: 'IPI',
  categoria: 'federal',
  descricao: 'Imposto sobre produtos industrializados (saída de fábrica)',
  fundamento: 'Decreto 7.619/2011 (RIPI)',
}

const TRIB_IRPJ_CSLL: TributoAplicavel = {
  id: 'irpj_csll',
  nome: 'IRPJ/CSLL',
  categoria: 'federal',
  descricao: 'Imposto de Renda e contribuição social sobre o lucro (presumido ou real)',
  fundamento: 'Leis 9.249/1995 e 7.689/1988',
}

const TRIB_PIS_COFINS: TributoAplicavel = {
  id: 'pis_cofins',
  nome: 'PIS/Cofins',
  categoria: 'federal',
  descricao: 'Contribuições federais sobre a receita (cumulativo ou não cumulativo)',
  fundamento: 'Leis 10.637/2002 e 10.833/2003',
}

const TRIB_IBS_CBS: TributoAplicavel = {
  id: 'ibs_cbs',
  nome: 'IBS/CBS',
  categoria: 'reforma',
  descricao: 'IVA dual da Reforma Tributária, com transição 2026–2033',
  fundamento: 'EC 132/2023 e LC 214/2025',
}

const TRIB_FUNRURAL: TributoAplicavel = {
  id: 'funrural',
  nome: 'Funrural',
  categoria: 'federal',
  descricao: 'Contribuição previdenciária rural sobre a receita bruta da produção',
  fundamento: 'Lei 8.870/1994',
}

const NAO_SUJEITO_IS =
  'Atividade, em regra, fora da lista de bens/serviços específicos do Imposto Seletivo (IS).'

const SUJEITO_IS_INDUSTRIA =
  'Avaliar caso a caso: o IS atinge apenas bens específicos (cigarros, bebidas, veículos, extração mineral etc. — LC 214/2025).'

/**
 * Resolve o grupo fiscal da atividade a partir do CNAE (código e/ou descrição).
 * Espelha a lógica de divisões usada em mapearCnaeParaSegmentoOpcional.
 */
function resolverGrupoPorCnae(cnaeCodigo?: string | null, cnaeDescricao = '') {
  const codLimpo = (cnaeCodigo || '').replace(/\D/g, '')
  const cod2 = codLimpo.slice(0, 2)
  const desc = (cnaeDescricao || '').toLowerCase()
  const num2 = parseInt(cod2, 10)

  const tem = (termos: string[]) => termos.some((t) => desc.includes(t))

  // Agro (produção primária)
  if (
    ['01', '02', '03'].includes(cod2) ||
    tem(['agropecu', 'cultivo', 'pecuária', 'pecuaria', 'pesca'])
  ) {
    return 'agro' as const
  }

  // Indústria (transformação)
  if (
    (!isNaN(num2) && num2 >= 5 && num2 <= 33) ||
    tem(['fabricação', 'fabricacao', 'indústria', 'industria', 'manufatura', 'usinagem'])
  ) {
    return 'industria' as const
  }

  // Comércio
  if (
    ['45', '46', '47'].includes(cod2) ||
    tem(['comércio', 'comercio', 'varejista', 'atacadista', 'distribuidora'])
  ) {
    return 'comercio' as const
  }

  // Transporte
  if (
    ['49', '50', '51', '52', '53'].includes(cod2) ||
    tem(['transporte', 'frete', 'logística', 'logistica', 'armazena'])
  ) {
    return 'transporte' as const
  }

  // Energia e Telecomunicações (divisão 61 e energia)
  if (
    cod2 === '61' ||
    tem(['telecomunicaç', 'telecomunicac', 'energia elétrica', 'energia eletrica'])
  ) {
    return 'energia_telecom' as const
  }

  // Construção Civil
  if (
    ['41', '42', '43'].includes(cod2) ||
    tem([
      'construção',
      'construcao',
      'obras',
      'terraplenagem',
      'demolição',
      'demolicao',
      'incorporação de empreendimentos',
      'incorporacao de empreendimentos',
    ])
  ) {
    return 'construcao' as const
  }

  // Bares e Restaurantes
  if (
    cod2 === '56' ||
    tem([
      'restaurante',
      'lanchonete',
      'catering',
      'serviços de alimentação',
      'servicos de alimentacao',
      'fornecimento de alimentos preparados',
    ])
  ) {
    return 'bares_restaurantes' as const
  }

  // Serviços (divisões típicas 55, 58–60, 62–99 fora das regras acima)
  if (
    [
      '55',
      '58',
      '59',
      '60',
      '64',
      '65',
      '66',
      '68',
      '69',
      '70',
      '71',
      '72',
      '73',
      '74',
      '75',
      '77',
      '78',
      '79',
      '80',
      '81',
      '82',
      '88',
      '90',
      '91',
      '92',
      '93',
      '94',
      '95',
      '96',
      '97',
      '99',
    ].includes(cod2) ||
    tem([
      'serviço',
      'servico',
      'consultoria',
      'software',
      'tecnologia da informação',
      'tecnologia da informacao',
      'ensino',
      'escola',
      'médic',
      'medic',
      'odontol',
      'hospital',
      'publicidade',
      'limpeza',
      'vigilância',
      'vigilancia',
      'locação',
      'locacao',
      'imobiliári',
      'imobiliari',
      'advocacia',
    ])
  ) {
    return 'servico' as const
  }

  return null
}

/** Fallback pelo segmento oficial do cadastro quando não há CNAE reconhecido */
function resolverGrupoPorSegmento(segmento?: string | null) {
  switch (segmento) {
    case 'Comércio':
      return 'comercio' as const
    case 'Indústria':
      return 'industria' as const
    case 'Transporte':
      return 'transporte' as const
    case 'Agro':
      return 'agro' as const
    case 'Construção Civil':
      return 'construcao' as const
    case 'Bares e Restaurantes':
      return 'bares_restaurantes' as const
    case 'Serviços':
    case 'Tecnologia':
    case 'Saúde':
    case 'Educação':
      return 'servico' as const
    default:
      return null
  }
}

/**
 * Função principal: dado CNAE (código/descrição) e/ou segmento, devolve a
 * indicação dos tributos aplicáveis. Retorna grupoAtividade null quando não há
 * correspondência suficiente (o painel chamador pode então ficar neutro/oculto).
 */
export function mapearTributosPorAtividade(
  cnaeCodigo?: string | null,
  cnaeDescricao: string = '',
  segmento?: string | null,
): ResultadoTributosAtividade {
  const grupoCnae =
    cnaeCodigo || cnaeDescricao ? resolverGrupoPorCnae(cnaeCodigo, cnaeDescricao) : null
  const grupo = grupoCnae || resolverGrupoPorSegmento(segmento)

  const naoSujeitoIs = (obs: string = NAO_SUJEITO_IS) => ({
    sujeito: false,
    observacao: obs,
  })

  switch (grupo) {
    case 'servico':
      return {
        grupoAtividade: 'servico',
        tipoAtividade: 'servico',
        tributos: [TRIB_ISS, TRIB_IRPJ_CSLL, TRIB_PIS_COFINS, TRIB_IBS_CBS],
        impostoSeletivo: naoSujeitoIs(),
        observacoes: [
          'Atividade de serviço: em regra NÃO sujeita a ICMS (tributo de mercadorias).',
          'Nota: em 2026–2027 o IBS/CBS entra com alíquota-teste zero e crédito integral; a cobrança efetiva cresce até 2033.',
        ],
      }

    case 'construcao':
      return {
        grupoAtividade: 'construcao',
        tipoAtividade: 'servico',
        tributos: [TRIB_ISS, TRIB_IRPJ_CSLL, TRIB_PIS_COFINS, TRIB_IBS_CBS],
        impostoSeletivo: naoSujeitoIs(),
        observacoes: [
          'Construção civil: prestação em regra sob ISS; ICMS pode incidir quando há fornecimento/revenda de materiais.',
        ],
      }

    case 'comercio':
      return {
        grupoAtividade: 'comercio',
        tipoAtividade: 'mercadoria',
        tributos: [TRIB_ICMS, TRIB_IRPJ_CSLL, TRIB_PIS_COFINS, TRIB_IBS_CBS],
        impostoSeletivo: naoSujeitoIs(),
        observacoes: [
          'Atividade mercantil: incide ICMS sobre mercadorias; sem ISS sobre a venda (salvo serviço acessório).',
        ],
      }

    case 'industria':
      return {
        grupoAtividade: 'industria',
        tipoAtividade: 'mercadoria',
        tributos: [TRIB_ICMS, TRIB_IPI, TRIB_IRPJ_CSLL, TRIB_PIS_COFINS, TRIB_IBS_CBS],
        impostoSeletivo: { sujeito: false, observacao: SUJEITO_IS_INDUSTRIA },
        observacoes: [
          'Industrialização: ICMS na circulação e IPI na saída de fábrica; créditos não cumulativos aplicáveis.',
        ],
      }

    case 'transporte':
      return {
        grupoAtividade: 'transporte',
        tipoAtividade: 'mista',
        tributos: [TRIB_ICMS, TRIB_IRPJ_CSLL, TRIB_PIS_COFINS, TRIB_IBS_CBS],
        impostoSeletivo: naoSujeitoIs(),
        observacoes: [
          'Transporte de cargas (intermunicipal/interestadual) incide ICMS; serviços anexos podem atrair ISS conforme o caso.',
        ],
      }

    case 'energia_telecom':
      return {
        grupoAtividade: 'energia_telecom',
        tipoAtividade: 'servico',
        tributos: [TRIB_ICMS, TRIB_IRPJ_CSLL, TRIB_PIS_COFINS, TRIB_IBS_CBS],
        impostoSeletivo: naoSujeitoIs(),
        observacoes: [
          'Energia elétrica e telecomunicações: ICMS no sistema atual; sob a Reforma passam a IBS/CBS.',
        ],
      }

    case 'agro':
      return {
        grupoAtividade: 'agro',
        tipoAtividade: 'rural',
        tributos: [TRIB_FUNRURAL, TRIB_IRPJ_CSLL, TRIB_PIS_COFINS, TRIB_IBS_CBS],
        impostoSeletivo: naoSujeitoIs(),
        observacoes: [
          'Produção primária tem regras próprias (Funrural, presunções e créditos especiais) — indicação simplificada.',
        ],
      }

    case 'bares_restaurantes':
      return {
        grupoAtividade: 'bares_restaurantes',
        tipoAtividade: 'mista',
        tributos: [TRIB_ICMS, TRIB_ISS, TRIB_IRPJ_CSLL, TRIB_PIS_COFINS, TRIB_IBS_CBS],
        impostoSeletivo: naoSujeitoIs(),
        observacoes: [
          'Alimentação fora do lar: bebidas/mercadorias sob ICMS e, conforme o Município, ISS sobre serviços de alimentação.',
        ],
      }

    default:
      return {
        grupoAtividade: null,
        tipoAtividade: 'desconhecida',
        tributos: [],
        impostoSeletivo: naoSujeitoIs(),
        observacoes: [],
      }
  }
}

/** Rótulo amigável do grupo de atividade para exibição */
export function rotuloGrupoAtividade(grupo: ResultadoTributosAtividade['grupoAtividade']): string {
  switch (grupo) {
    case 'servico':
      return 'Serviço'
    case 'comercio':
      return 'Comércio (mercadoria)'
    case 'industria':
      return 'Indústria (mercadoria)'
    case 'transporte':
      return 'Transporte e Logística'
    case 'agro':
      return 'Agro (produção rural)'
    case 'construcao':
      return 'Construção Civil'
    case 'bares_restaurantes':
      return 'Alimentação fora do lar'
    case 'energia_telecom':
      return 'Energia / Telecomunicações'
    default:
      return ''
  }
}

/** Cores por categoria de tributo (chips) */
export const CORES_CATEGORIA_TRIBUTO: Record<CategoriaTributo, string> = {
  municipal: 'bg-sky-50 text-sky-800 border-sky-200',
  estadual: 'bg-amber-50 text-amber-800 border-amber-200',
  federal: 'bg-violet-50 text-violet-800 border-violet-200',
  reforma: 'bg-emerald-50 text-emerald-800 border-emerald-200',
}
