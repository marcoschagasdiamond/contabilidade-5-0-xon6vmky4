export type RegimeDiferenciadoTipo =
  // Opção genérica / manual
  | 'padrao'
  // Legados mantidos para compatibilidade retroativa com simulações e links antigos
  | 'saude_educacao'
  | 'transporte'
  | 'transporte_intelectual'
  | 'cesta_basica'
  // (1) Redução de 60% (arts. 128–134 da LC 214/2025)
  | 'saude_servicos'
  | 'educacao_ensino'
  | 'medicamentos_60'
  | 'dispositivos_medicos_anvisa'
  | 'alimentacao_humana'
  | 'insumos_agropecuarios'
  | 'producoes_artisticas_culturais'
  | 'seguranca_nacional'
  // (2) Redução de 30% (art. 132 da LC 214/2025) - Profissões Intelectuais Regulamentadas
  | 'profissoes_intelectuais_advogados'
  | 'profissoes_intelectuais_contadores'
  | 'profissoes_intelectuais_engenheiros'
  | 'profissoes_intelectuais_economistas'
  | 'profissoes_intelectuais_jornalistas'
  | 'profissoes_intelectuais_demais'
  // (3) Alíquota Zero (arts. 8º, 129 e 146 da LC 214/2025)
  | 'cesta_basica_nacional'
  | 'horticolas_frutas_ovos'
  | 'medicamentos_essenciais_anexo_xii'
  | 'dispositivos_acessibilidade_pcd'

/**
 * Normaliza qualquer valor antigo ou novo de RegimeDiferenciadoTipo garantindo retrocompatibilidade plena
 */
export function normalizarRegimeOperacao(
  regime: string | undefined | null,
): RegimeDiferenciadoTipo {
  if (!regime) return 'padrao'
  const r = regime.trim()
  const validos: RegimeDiferenciadoTipo[] = [
    'padrao',
    'saude_educacao',
    'transporte',
    'transporte_intelectual',
    'cesta_basica',
    'saude_servicos',
    'educacao_ensino',
    'medicamentos_60',
    'dispositivos_medicos_anvisa',
    'alimentacao_humana',
    'insumos_agropecuarios',
    'producoes_artisticas_culturais',
    'seguranca_nacional',
    'profissoes_intelectuais_advogados',
    'profissoes_intelectuais_contadores',
    'profissoes_intelectuais_engenheiros',
    'profissoes_intelectuais_economistas',
    'profissoes_intelectuais_jornalistas',
    'profissoes_intelectuais_demais',
    'cesta_basica_nacional',
    'horticolas_frutas_ovos',
    'medicamentos_essenciais_anexo_xii',
    'dispositivos_acessibilidade_pcd',
  ]
  if (validos.includes(r as RegimeDiferenciadoTipo)) {
    return r as RegimeDiferenciadoTipo
  }
  return 'padrao'
}

/**
 * Retorna as informações do preset/regime LC 214/2025 para exibição de título, subtítulo e etiquetas legais
 */
export function obterInfoRegimeOperacao(regime: RegimeDiferenciadoTipo) {
  const achado = PRESETS_SETORES_LC214.find((p) => p.id === regime)
  if (achado) return achado

  // Mapeamentos de fallback para legados
  if (regime === 'transporte') {
    return (
      PRESETS_SETORES_LC214.find((p) => p.id === 'transporte_intelectual') || {
        id: 'transporte' as any,
        grupo: 'reducao_30' as const,
        grupoLabel: 'Redução de 30% (art. 132)',
        titulo: 'Transporte Coletivo & Profissões Regulamentadas (-30%)',
        subtitulo: 'Regime diferenciado com redução de 30%',
        reducaoPercentual: 30,
        baseLegal: 'LC 214/2025 art. 132',
        etiquetaOrigem: 'LC 214/2025 · art. 132 — redução 30%',
        alvoRegime: 'transporte' as const,
      }
    )
  }
  return PRESETS_SETORES_LC214[0]
}

/**
 * Retorna o grupo tributário do regime da operação (LC 214/2025)
 * 'geral' (alíquota padrão cheia) | 'reducao_60' (arts. 128–134) | 'reducao_30' (art. 132) | 'aliquota_zero' (arts. 8º, 129 e 146)
 */
export function obterGrupoRegimeOperacao(regime: RegimeDiferenciadoTipo): GrupoPresetSetor {
  const preset = PRESETS_SETORES_LC214.find((p) => p.id === regime)
  if (preset) return preset.grupo

  // Fallbacks legados
  if (regime === 'saude_educacao') return 'reducao_60'
  if (regime === 'transporte' || regime === 'transporte_intelectual') return 'reducao_30'
  if (regime === 'cesta_basica') return 'aliquota_zero'
  return 'geral'
}

export type TipoAtividadePrincipal =
  | 'servico'
  | 'industria'
  | 'comercio'
  | 'misto'
  | 'agronegocio'
  | 'construcao_civil'
  | 'locacao_bens'
  | 'food_service'

export type TipoAtividadeLegado =
  | 'agronegocio'
  | 'construcao_civil'
  | 'locacao_bens'
  | 'food_service'

export type TipoAtividade = TipoAtividadePrincipal

export const RAMOS_PRINCIPAIS_ATIVOS: Array<{
  id: TipoAtividadePrincipal
  label: string
  subtitulo: string
}> = [
  {
    id: 'servico',
    label: 'Serviço',
    subtitulo: 'ISS / Anexo III ou V / Presunção 32% ou 16%',
  },
  {
    id: 'industria',
    label: 'Indústria',
    subtitulo: 'IPI / Anexo II / Imposto Seletivo',
  },
  {
    id: 'comercio',
    label: 'Comércio',
    subtitulo: 'ICMS / Anexo I / ICMS-ST / Presunção 8%',
  },
  {
    id: 'agronegocio',
    label: 'Agronegócio / Produtor rural',
    subtitulo: 'Anexo I ou II / Redução 60% ou Cesta Básica / Presunção 8%',
  },
  {
    id: 'construcao_civil',
    label: 'Construção civil e engenharia',
    subtitulo: 'Anexo IV ou III (Fator R) / Regime de Obras e Bens Imóveis',
  },
  {
    id: 'locacao_bens',
    label: 'Aluguel / Locação de bens',
    subtitulo: 'Anexo III (sem ISS Súmula 31) / Fator R para Coworking',
  },
  {
    id: 'food_service',
    label: 'Bares / Restaurantes e food service',
    subtitulo: 'Anexo I / Imposto Seletivo Bebidas / Créditos Delivery',
  },
  {
    id: 'misto',
    label: 'Misto',
    subtitulo: 'Serviço + Comércio com proporção customizada',
  },
]

/**
 * Mantido para compatibilidade histórica; agora preserva diretamente os 4 ramos restaurados.
 */
export const MAPA_FALLBACK_RAMOS_LEGADOS: Record<TipoAtividadeLegado, TipoAtividadePrincipal> = {
  agronegocio: 'agronegocio',
  construcao_civil: 'construcao_civil',
  locacao_bens: 'locacao_bens',
  food_service: 'food_service',
}

export const LABELS_RAMOS_LEGADOS: Record<TipoAtividadeLegado, string> = {
  agronegocio: 'Agronegócio / Produtor rural',
  construcao_civil: 'Construção civil e engenharia',
  locacao_bens: 'Aluguel / Locação de bens',
  food_service: 'Bares / Restaurantes e food service',
}

export function isTipoAtividadeLegado(
  tipo: string | undefined | null,
): tipo is TipoAtividadeLegado {
  return (
    tipo === 'agronegocio' ||
    tipo === 'construcao_civil' ||
    tipo === 'locacao_bens' ||
    tipo === 'food_service'
  )
}

export function normalizarTipoAtividade(tipo: string | undefined | null): TipoAtividadePrincipal {
  if (!tipo) return 'servico'
  if (
    tipo === 'servico' ||
    tipo === 'industria' ||
    tipo === 'comercio' ||
    tipo === 'misto' ||
    tipo === 'agronegocio' ||
    tipo === 'construcao_civil' ||
    tipo === 'locacao_bens' ||
    tipo === 'food_service'
  ) {
    return tipo
  }
  return 'servico'
}

export type SubatividadeServico =
  | 'servico_comum'
  | 'tecnologia_software'
  | 'saude_educacao'
  | 'transporte'
  | 'intermediacao'

export type SubatividadeIndustria =
  | 'industria_comum'
  | 'industria_ipi_alto'
  | 'industria_ipi_baixo_zero'
  | 'produto_imposto_seletivo'

export type SubatividadeComercio = 'varejo_comum' | 'com_icms_st' | 'atacado_distribuicao'

export type SubatividadeAgronegocio =
  | 'producao_agricola_graos'
  | 'pecuaria_corte_leite'
  | 'agroindustria_processamento'
  | 'hortifrutigranjeiros'
  | 'hortifruti_cesta_basica'

export type SubatividadeAgro = SubatividadeAgronegocio

export type SubatividadeConstrucao =
  | 'obras_edificacoes_ret'
  | 'reformas_instalacoes'
  | 'engenharia_projetos'
  | 'obras_infraestrutura'

export type SubatividadeLocacao =
  | 'locacao_veiculos_maquinas'
  | 'locacao_imoveis_proprios'
  | 'locacao_equipamentos_eventos'
  | 'coworking_espacos'

export type SubatividadeFoodService =
  | 'restaurante_a_la_carte_buffet'
  | 'bar_choperia_noturno'
  | 'bar_balada_bebidas'
  | 'lanchonete_fast_food'
  | 'delivery_marmitaria'

export type SubatividadeTipo =
  | SubatividadeServico
  | SubatividadeIndustria
  | SubatividadeComercio
  | SubatividadeAgronegocio
  | SubatividadeConstrucao
  | SubatividadeLocacao
  | SubatividadeFoodService

export interface InfoSubatividade {
  id: string
  label: string
  descricao: string
  presuncaoIrpj: number // % ex: 32, 16, 8
  presuncaoCsll: number // % ex: 32, 12
  aliquotaIpi?: number // % ex: 5, 15, 0
  aliquotaIcmsProprioReducao?: number // fator multiplicador ou override (ex: 0 para ICMS-ST)
  aliquotaIcmsOverride?: number // ex: 12% para atacado
  reducaoIbsCbsPercentual?: number // % ex: 60 para saúde/TI/agro, 30 para transporte
  sujeitoImpostoSeletivo?: boolean
  aliquotaSeletivoPadrao?: number // % ex: 10
  anexoSimplesRegra?: 'I' | 'II' | 'III' | 'IV' | 'fator_r' | 'misto' | 'isento_rural'
  explicacaoSimples?: string
  tratamentoIbsCbs?: string
}

export const SUBATIVIDADES_SERVICO: InfoSubatividade[] = [
  {
    id: 'servico_comum',
    label: 'Serviço comum (presunção 32%, ISS cheio)',
    descricao:
      'Prestação de serviços em geral com presunção de 32% no Lucro Presumido e ISS municipal cheio.',
    presuncaoIrpj: 32,
    presuncaoCsll: 32,
    reducaoIbsCbsPercentual: 0,
  },
  {
    id: 'tecnologia_software',
    label: 'Tecnologia/Software (redução 60% no IBS/CBS)',
    descricao:
      'Desenvolvimento de software, licenciamento e serviços digitais qualificados com redução de 60% no regime diferenciado.',
    presuncaoIrpj: 32,
    presuncaoCsll: 32,
    reducaoIbsCbsPercentual: 60,
  },
  {
    id: 'saude_educacao',
    label: 'Saúde/Educação (presunção 32%, redução 60%)',
    descricao:
      'Serviços de saúde e ensino regulamentados, contemplados com redução de 60% da alíquota padrão no IBS/CBS.',
    presuncaoIrpj: 32,
    presuncaoCsll: 32,
    reducaoIbsCbsPercentual: 60,
  },
  {
    id: 'transporte',
    label: 'Transporte de passageiros/cargas (presunção 16%, redução 30%)',
    descricao:
      'Transporte coletivo ou de cargas com presunção especial de 16% no Lucro Presumido e redução de 30% no IBS/CBS.',
    presuncaoIrpj: 16,
    presuncaoCsll: 12,
    reducaoIbsCbsPercentual: 30,
  },
  {
    id: 'intermediacao',
    label: 'Intermediação / Corretagem (sem redução, ISS cheio)',
    descricao:
      'Intermediação de negócios, agenciamento e representação com presunção integral (32%) e sem desonerações no novo IVA.',
    presuncaoIrpj: 32,
    presuncaoCsll: 32,
    reducaoIbsCbsPercentual: 0,
  },
]

export const SUBATIVIDADES_INDUSTRIA: InfoSubatividade[] = [
  {
    id: 'industria_comum',
    label: 'Indústria comum (IPI 5%)',
    descricao:
      'Transformação padrão de bens de consumo duráveis ou semi-duráveis com IPI de referência de 5%.',
    presuncaoIrpj: 8,
    presuncaoCsll: 12,
    aliquotaIpi: 5,
    reducaoIbsCbsPercentual: 0,
  },
  {
    id: 'industria_ipi_alto',
    label: 'Indústria com IPI alto (15%)',
    descricao:
      'Produtos industrializados com carga seletiva ou ad valorem elevada (ex: químicos, cosméticos, eletroeletrônicos).',
    presuncaoIrpj: 8,
    presuncaoCsll: 12,
    aliquotaIpi: 15,
    reducaoIbsCbsPercentual: 0,
  },
  {
    id: 'industria_ipi_baixo_zero',
    label: 'Indústria com IPI baixo/zero (0%)',
    descricao:
      'Bens de capital, insumos agropecuários ou produtos da cesta básica beneficiados com alíquota 0% de IPI.',
    presuncaoIrpj: 8,
    presuncaoCsll: 12,
    aliquotaIpi: 0,
    reducaoIbsCbsPercentual: 0,
  },
  {
    id: 'produto_imposto_seletivo',
    label: 'Produto com Imposto Seletivo (bebida/veículo/cigarro — IS 10%)',
    descricao:
      'Bens prejudiciais à saúde ou meio ambiente sujeitos ao Imposto Seletivo (art. 153, VIII da CF/88) cumulativo no IBS/CBS.',
    presuncaoIrpj: 8,
    presuncaoCsll: 12,
    aliquotaIpi: 10,
    sujeitoImpostoSeletivo: true,
    aliquotaSeletivoPadrao: 10,
    reducaoIbsCbsPercentual: 0,
  },
]

export const SUBATIVIDADES_COMERCIO: InfoSubatividade[] = [
  {
    id: 'varejo_comum',
    label: 'Varejo comum (ICMS 18%)',
    descricao:
      'Venda a consumidor final com tributação normal de ICMS na saída e apuração padrão no Lucro Presumido (presunção 8%).',
    presuncaoIrpj: 8,
    presuncaoCsll: 12,
    reducaoIbsCbsPercentual: 0,
    anexoSimplesRegra: 'I',
    explicacaoSimples: 'Comércio varejista: enquadrado no Anexo I do Simples Nacional.',
    tratamentoIbsCbs: 'Tributação padrão com creditamento amplo nas compras e extinção do ICMS.',
  },
  {
    id: 'com_icms_st',
    label: 'Com ICMS-ST (substituição tributária — ICMS próprio ≈ 0%, ST repassado)',
    descricao:
      'Produtos submetidos à Substituição Tributária (ex: autopeças, cosméticos, bebidas, fármacos). O ICMS próprio da revenda é zero pois foi recolhido antes pelo fabricante.',
    presuncaoIrpj: 8,
    presuncaoCsll: 12,
    aliquotaIcmsProprioReducao: 0,
    reducaoIbsCbsPercentual: 0,
    anexoSimplesRegra: 'I',
    explicacaoSimples: 'Comércio com ST: Anexo I do Simples com segregação de ICMS-ST na DAS.',
    tratamentoIbsCbs:
      'Extinção completa da Substituição Tributária no IBS/CBS, migrando para Split Payment.',
  },
  {
    id: 'atacado_distribuicao',
    label: 'Atacado/distribuição (ICMS reduzido ~12%)',
    descricao:
      'Operações interestaduais e centros de distribuição atacadistas com benefícios fiscais ou alíquotas reduzidas de ICMS (~12%).',
    presuncaoIrpj: 8,
    presuncaoCsll: 12,
    aliquotaIcmsOverride: 12,
    reducaoIbsCbsPercentual: 0,
    anexoSimplesRegra: 'I',
    explicacaoSimples: 'Atacado e revenda: Anexo I do Simples Nacional.',
    tratamentoIbsCbs:
      'Tributação pelo destino com creditamento financeiro integral nas operações B2B.',
  },
]

export const SUBATIVIDADES_AGRO: InfoSubatividade[] = [
  {
    id: 'producao_agricola_graos',
    label: 'Produção Agrícola / Grãos (Soja, Milho, Café)',
    descricao:
      'Cultivo e comercialização de grãos e comodities agrícolas. Presunção favorecida de 8% IRPJ / 12% CSLL, imunidade exportadora e redução de 60% no IBS/CBS para insumos e alimentos.',
    presuncaoIrpj: 8,
    presuncaoCsll: 12,
    reducaoIbsCbsPercentual: 60,
    anexoSimplesRegra: 'I',
    explicacaoSimples:
      'Produtor rural PJ optante pelo Simples recolhe pelo Anexo I (comercialização da produção). Exportações são imunes e Funrural/ICMS contam com diferimento.',
    tratamentoIbsCbs:
      'Redução de 60% na alíquota padrão do IBS/CBS para produtos agropecuários e alimentos da cesta básica estendida (EC 132/2023), com manutenção de créditos.',
  },
  {
    id: 'pecuaria_corte_leite',
    label: 'Pecuária de Corte e Leiteira',
    descricao:
      'Criação de bovinos, suínos e aves com abate ou comercialização de leite/carne in natura. Presunção 8% IRPJ / 12% CSLL, desoneração de insumos biológicos e redução de 60% no IVA Dual.',
    presuncaoIrpj: 8,
    presuncaoCsll: 12,
    reducaoIbsCbsPercentual: 60,
    anexoSimplesRegra: 'I',
    explicacaoSimples:
      'Anexo I do Simples Nacional para venda de animais vivos e produção rural pecuária.',
    tratamentoIbsCbs:
      'Redução de 60% no IBS/CBS com direito a crédito presumido para o adquirente de produtor não contribuinte.',
  },
  {
    id: 'agroindustria_processamento',
    label: 'Agroindústria / Beneficiamento (Laticínios, Usinas, Ração)',
    descricao:
      'Industrialização e transformação de produtos agropecuários. Presunção 8% IRPJ / 12% CSLL, IPI de 0% a 5% e regime de créditos plenos nas aquisições rurais.',
    presuncaoIrpj: 8,
    presuncaoCsll: 12,
    aliquotaIpi: 0,
    reducaoIbsCbsPercentual: 60,
    anexoSimplesRegra: 'II',
    explicacaoSimples:
      'Agroindústria com transformação física: Anexo II do Simples Nacional (Indústria).',
    tratamentoIbsCbs:
      'Regime de crédito presumido de aquisição de insumos agropecuários de pessoa física e redução de 60% para alimentos básicos.',
  },
  {
    id: 'hortifrutigranjeiros',
    label: 'Hortifrúti e Produtos Orgânicos (Cesta Básica Nacional)',
    descricao:
      'Frutas, legumes, verduras e ovos com alíquota zero (isenção 100%) no IBS/CBS conforme Cesta Básica Nacional e presunção 8% no Lucro Presumido.',
    presuncaoIrpj: 8,
    presuncaoCsll: 12,
    reducaoIbsCbsPercentual: 100, // Cesta Básica Isenção 100%
    anexoSimplesRegra: 'I',
    explicacaoSimples:
      'Comercialização direta de hortifrutigranjeiros: Anexo I do Simples Nacional com isenções estaduais de ICMS em vários estados.',
    tratamentoIbsCbs:
      'Alíquota ZERO (isenção 100%) no IBS e na CBS pela Cesta Básica Nacional de Alimentos (art. 8º da LC 214/2025).',
  },
  {
    id: 'hortifruti_cesta_basica',
    label: 'Hortifrúti e Cesta Básica Nacional (Alíquota Zero 100%)',
    descricao:
      'Alimentos essenciais da Cesta Básica Nacional e hortifrutigranjeiros in natura: alíquota ZERO (isenção 100%) no IBS e na CBS com direito à manutenção integral de créditos e Anexo I no Simples.',
    presuncaoIrpj: 8,
    presuncaoCsll: 12,
    reducaoIbsCbsPercentual: 100,
    anexoSimplesRegra: 'I',
    explicacaoSimples:
      'Anexo I do Simples Nacional (comércio de alimentos básicos) com desoneração nas saídas estaduais de ICMS em diversos estados.',
    tratamentoIbsCbs:
      'Alíquota ZERO (isenção 100%) no IBS e na CBS pela Cesta Básica Nacional de Alimentos (art. 8º da LC 214/2025), garantindo desoneração integral ao consumidor final com manutenção de créditos.',
  },
]

export const SUBATIVIDADES_AGRONEGOCIO: InfoSubatividade[] = SUBATIVIDADES_AGRO

export const SUBATIVIDADES_CONSTRUCAO: InfoSubatividade[] = [
  {
    id: 'obras_edificacoes_ret',
    label: 'Construção de Edifícios e Obras Civis (Anexo IV / RET)',
    descricao:
      'Execução de obras de alvenaria e incorporações imobiliárias. No Simples enquadra-se no Anexo IV (com CPP de 20% recolhida por fora na folha de pagamento). Presunção de 32% (serviço) ou 8% (com fornecimento de materiais e empreitada global).',
    presuncaoIrpj: 32,
    presuncaoCsll: 32,
    reducaoIbsCbsPercentual: 0,
    anexoSimplesRegra: 'IV',
    explicacaoSimples:
      'Obras civis e edificações enquadram-se obrigatoriamente no ANEXO IV do Simples Nacional (art. 18, § 5º-C da LC 123/2006). A Contribuição Previdenciária Patronal (CPP de 20%) NÃO está inclusa na guia DAS e deve ser recolhida à parte.',
    tratamentoIbsCbs:
      'Submetido ao regime específico de operações com bens imóveis no IBS/CBS (art. 156-A e LC 214/2025) ou RET com margem redutora sobre terrenos e insumos.',
  },
  {
    id: 'reformas_instalacoes',
    label: 'Reformas, Instalações Elétricas/Hidráulicas e Pintura',
    descricao:
      'Serviços de acabamento, reformas prediais e instalações. Tributado no Anexo IV do Simples Nacional com retenção de INSS e ISS na fonte conforme município da obra.',
    presuncaoIrpj: 32,
    presuncaoCsll: 32,
    reducaoIbsCbsPercentual: 0,
    anexoSimplesRegra: 'IV',
    explicacaoSimples:
      'Serviços especializados de instalação e reforma: Anexo IV do Simples Nacional (CPP patronal recolhida por fora, não entra na alíquota única do DAS).',
    tratamentoIbsCbs:
      'Prestação de serviço civil no novo IVA Dual com incidência no local da execução da obra (princípio do destino pleno).',
  },
  {
    id: 'engenharia_projetos',
    label: 'Serviços de Engenharia, Arquitetura e Projetos Técnicos',
    descricao:
      'Projetos arquitetônicos, cálculo estrutural e consultoria técnica. No Simples está sujeito ao FATOR R (folha ≥ 28% vai para o Anexo III; < 28% vai para o Anexo V). Presunção 32% no Lucro Presumido.',
    presuncaoIrpj: 32,
    presuncaoCsll: 32,
    reducaoIbsCbsPercentual: 0,
    anexoSimplesRegra: 'fator_r',
    explicacaoSimples:
      'Engenharia consultiva e projetos intelectuais: sujeitos à regra do FATOR R (LC 123/2006 art. 18 § 5º-J). Se a folha for ≥ 28%, tributa pelo Anexo III (mais barato); se < 28%, cai no Anexo V.',
    tratamentoIbsCbs:
      'Tributação padrão com aproveitamento amplo de créditos pelos clientes corporativos (B2B).',
  },
  {
    id: 'obras_infraestrutura',
    label: 'Obras de Infraestrutura, Terraplenagem e Pavimentação',
    descricao:
      'Obras pesadas de rodovias, saneamento e terraplenagem com emprego de maquinário pesado. Anexo IV do Simples Nacional e retenção previdenciária de 11% sobre cessão de mão de obra.',
    presuncaoIrpj: 32,
    presuncaoCsll: 32,
    reducaoIbsCbsPercentual: 0,
    anexoSimplesRegra: 'IV',
    explicacaoSimples:
      'Construção pesada e infraestrutura: enquadramento obrigatório no Anexo IV do Simples (INSS patronal pago na guia previdenciária avulsa).',
    tratamentoIbsCbs:
      'Creditamento integral das aquisições de maquinário, combustíveis e insumos pesados no IVA Dual.',
  },
]

export const SUBATIVIDADES_LOCACAO: InfoSubatividade[] = [
  {
    id: 'locacao_veiculos_maquinas',
    label: 'Locação de Bens Móveis (Máquinas, Veículos e Equipamentos)',
    descricao:
      'Locação pura de bens móveis (sem operador). Súmula Vinculante 31 do STF: NÃO incide ISS. No Simples enquadra-se no Anexo III diretamente. Presunção 32% no Lucro Presumido.',
    presuncaoIrpj: 32,
    presuncaoCsll: 32,
    reducaoIbsCbsPercentual: 0,
    anexoSimplesRegra: 'III',
    explicacaoSimples:
      'Locação de bens móveis pura: Anexo III do Simples Nacional diretamente (sem necessidade de Fator R e sem incidência de ISS por força da Súmula Vinculante 31 do STF).',
    tratamentoIbsCbs:
      'No novo sistema tributário, a locação de bens móveis passa a ser expressamente tributada pelo IBS/CBS (conceito amplo de fornecimento oneroso de bens/utilidades).',
  },
  {
    id: 'locacao_imoveis_proprios',
    label: 'Locação de Imóveis Próprios (Holding / Patrimonial)',
    descricao:
      'Gestão e aluguel de imóveis próprios residenciais ou comerciais. No sistema antigo não há ISS nem ICMS (apenas PIS/COFINS e IRPJ/CSLL). Presunção 32% no Lucro Presumido. VEDADO o Simples Nacional para locação pura de imóveis próprios.',
    presuncaoIrpj: 32,
    presuncaoCsll: 32,
    reducaoIbsCbsPercentual: 0,
    anexoSimplesRegra: 'III',
    explicacaoSimples:
      'Locação de imóveis: no Simples há restrições legais para locação pura de imóveis próprios (vedação do art. 17 da LC 123/2006). Quando permitida com intermediação/serviço correlato, enquadra-se no Anexo III.',
    tratamentoIbsCbs:
      'Regime específico de bens imóveis no IBS/CBS com direito a redução de base ou dedução do valor do bem/aluguel para evitar distorções no mercado imobiliário.',
  },
  {
    id: 'locacao_equipamentos_eventos',
    label: 'Locação de Equipamentos de Som, Luz e Estruturas para Eventos',
    descricao:
      'Locação de estruturas e equipamentos sem prestação de serviço técnico concomitante. Anexo III do Simples Nacional, sem ISS sobre o aluguel dos bens.',
    presuncaoIrpj: 32,
    presuncaoCsll: 32,
    reducaoIbsCbsPercentual: 0,
    anexoSimplesRegra: 'III',
    explicacaoSimples:
      'Aluguel de palcos e equipamentos: Anexo III do Simples Nacional (locação pura desonerada de ISS).',
    tratamentoIbsCbs:
      'Incidência padrão do IBS/CBS com creditamento total para os organizadores de eventos corporativos.',
  },
  {
    id: 'coworking_espacos',
    label: 'Coworking, Salas Compartilhadas e Locação de Espaços',
    descricao:
      'Cessão de postos de trabalho e salas comerciais mobiliadas com internet e recepção. Sujeito ao FATOR R (Anexo III se folha ≥ 28%, Anexo V se < 28%) devido aos serviços agregados.',
    presuncaoIrpj: 32,
    presuncaoCsll: 32,
    reducaoIbsCbsPercentual: 0,
    anexoSimplesRegra: 'fator_r',
    explicacaoSimples:
      'Coworking mescla locação e serviços administrativos: submetido à regra do FATOR R (folha ≥ 28% garante Anexo III; abaixo vai para o Anexo V).',
    tratamentoIbsCbs:
      'Tributação pelo novo IVA Dual gerando créditos de 26,5% para clientes empresas enquadradas no regime regular.',
  },
]

export const SUBATIVIDADES_FOOD_SERVICE: InfoSubatividade[] = [
  {
    id: 'restaurante_a_la_carte_buffet',
    label: 'Restaurante À La Carte / Buffet (Anexo I, Consumo Local e Alimentos)',
    descricao:
      'Fornecimento de refeições para consumo no local. No Simples Nacional é enquadrado no ANEXO I (Comércio), com parcelas de ICMS e ISS conforme entendimento da legislação municipal/estadual. Presunção 8% IRPJ / 12% CSLL.',
    presuncaoIrpj: 8,
    presuncaoCsll: 12,
    reducaoIbsCbsPercentual: 0,
    anexoSimplesRegra: 'I',
    explicacaoSimples:
      'Restaurantes e serviços de alimentação enquadram-se no ANEXO I do Simples Nacional (comércio/refeições preparadas), usufruindo das alíquotas mais favoráveis de saída.',
    tratamentoIbsCbs:
      'Regime específico de bares e restaurantes previsto na Reforma Tributária (LC 214/2025): sistemática diferenciada que equaliza as alíquotas de preparo e consumo no local com crédito das compras de insumos.',
  },
  {
    id: 'bar_balada_bebidas',
    label: 'Bar, Choperia, Balada e Bebidas Alcoólicas (Imposto Seletivo)',
    descricao:
      'Comercialização de bebidas alcoólicas, drinks e alimentação noturna com música/entretenimento. No Simples enquadra no Anexo I com ICMS-ST / monofásico e Imposto Seletivo no IBS/CBS.',
    presuncaoIrpj: 8,
    presuncaoCsll: 12,
    sujeitoImpostoSeletivo: true,
    aliquotaSeletivoPadrao: 10,
    reducaoIbsCbsPercentual: 0,
    anexoSimplesRegra: 'I',
    explicacaoSimples:
      'Bares, choperias e baladas: Anexo I do Simples Nacional com segregação de bebidas frias (ICMS-ST e monofásico).',
    tratamentoIbsCbs:
      'Bebidas alcoólicas sofrem incidência adicional do Imposto Seletivo ("imposto do pecado"), enquanto refeições e petiscos seguem a regra padrão com creditamento das compras.',
  },
  {
    id: 'bar_choperia_noturno',
    label: 'Bar, Choperia e Casa Noturna (Bebidas Alcoólicas & Petiscos)',
    descricao:
      'Fornecimento de refeições para consumo no local. No Simples Nacional é enquadrado no ANEXO I (Comércio), com parcelas de ICMS e ISS conforme entendimento da legislação municipal/estadual. Presunção 8% IRPJ / 12% CSLL.',
    presuncaoIrpj: 8,
    presuncaoCsll: 12,
    reducaoIbsCbsPercentual: 0,
    anexoSimplesRegra: 'I',
    explicacaoSimples:
      'Restaurantes e serviços de alimentação enquadram-se no ANEXO I do Simples Nacional (comércio/refeições preparadas), usufruindo das alíquotas mais favoráveis de saída.',
    tratamentoIbsCbs:
      'Regime específico de bares e restaurantes previsto na Reforma Tributária (LC 214/2025): sistemática diferenciada que equaliza as alíquotas de preparo e consumo no local com crédito das compras de insumos.',
  },
  {
    id: 'bar_choperia_noturno',
    label: 'Bar, Choperia e Casa Noturna (Bebidas Alcoólicas & Petiscos)',
    descricao:
      'Comercialização de bebidas alcoólicas e alimentação noturna. No Simples aplica Anexo I com bebidas frias sujeitas a ICMS-ST / monofásico. Sujeito ao Imposto Seletivo no novo IVA para bebidas alcoólicas.',
    presuncaoIrpj: 8,
    presuncaoCsll: 12,
    sujeitoImpostoSeletivo: true,
    aliquotaSeletivoPadrao: 10,
    reducaoIbsCbsPercentual: 0,
    anexoSimplesRegra: 'I',
    explicacaoSimples:
      'Bares e choperias: Anexo I do Simples Nacional. Destaque para a segregação de ICMS-ST e PIS/COFINS monofásico sobre cervejas e destilados.',
    tratamentoIbsCbs:
      'Bebidas alcoólicas sofrem incidência adicional do Imposto Seletivo ("imposto do pecado"), mas as refeições e petiscos seguem a regra regular com crédito das compras.',
  },
  {
    id: 'lanchonete_fast_food',
    label: 'Lanchonete, Hamburgueria e Fast Food',
    descricao:
      'Preparo rápido de lanches, salgados e sucos com alto giro operacional. Anexo I do Simples Nacional e presunção 8% IRPJ / 12% CSLL no Lucro Presumido.',
    presuncaoIrpj: 8,
    presuncaoCsll: 12,
    reducaoIbsCbsPercentual: 0,
    anexoSimplesRegra: 'I',
    explicacaoSimples:
      'Lanchonetes e fast food: tributados pelo Anexo I do Simples Nacional (refeições rápidas equiparadas a comércio).',
    tratamentoIbsCbs:
      'Crédito pleno de IBS/CBS sobre energia elétrica, embalagens descartáveis, compras de carne/pão e taxas de maquininhas/marketplaces.',
  },
  {
    id: 'delivery_marmitaria',
    label: 'Delivery Exclusivo, Dark Kitchen e Marmitaria',
    descricao:
      'Alimentação preparada exclusivamente para entrega a domicílio e retirada. Anexo I do Simples Nacional com alto impacto das taxas de intermediação de plataformas de delivery.',
    presuncaoIrpj: 8,
    presuncaoCsll: 12,
    reducaoIbsCbsPercentual: 0,
    anexoSimplesRegra: 'I',
    explicacaoSimples: 'Delivery e marmitarias: tributação no Anexo I do Simples Nacional.',
    tratamentoIbsCbs:
      'No IBS/CBS, as altas comissões retidas pelos apps de delivery (iFood, etc.) geram crédito de 26,5% de IVA Dual, desonerando significativamente o custo da intermediação digital.',
  },
]

export interface ItemUfIcms {
  uf: string
  nome: string
  aliquotaInternaPadrao: number
}

export const LISTA_UFS_ICMS: ItemUfIcms[] = [
  { uf: 'AC', nome: 'Acre', aliquotaInternaPadrao: 19 },
  { uf: 'AL', nome: 'Alagoas', aliquotaInternaPadrao: 19 },
  { uf: 'AM', nome: 'Amazonas', aliquotaInternaPadrao: 20 },
  { uf: 'AP', nome: 'Amapá', aliquotaInternaPadrao: 18 },
  { uf: 'BA', nome: 'Bahia', aliquotaInternaPadrao: 20.5 },
  { uf: 'CE', nome: 'Ceará', aliquotaInternaPadrao: 20 },
  { uf: 'DF', nome: 'Distrito Federal', aliquotaInternaPadrao: 20 },
  { uf: 'ES', nome: 'Espírito Santo', aliquotaInternaPadrao: 17 },
  { uf: 'GO', nome: 'Goiás', aliquotaInternaPadrao: 19 },
  { uf: 'MA', nome: 'Maranhão', aliquotaInternaPadrao: 22 },
  { uf: 'MG', nome: 'Minas Gerais', aliquotaInternaPadrao: 18 },
  { uf: 'MS', nome: 'Mato Grosso do Sul', aliquotaInternaPadrao: 17 },
  { uf: 'MT', nome: 'Mato Grosso', aliquotaInternaPadrao: 17 },
  { uf: 'PA', nome: 'Pará', aliquotaInternaPadrao: 19 },
  { uf: 'PB', nome: 'Paraíba', aliquotaInternaPadrao: 20 },
  { uf: 'PE', nome: 'Pernambuco', aliquotaInternaPadrao: 20.5 },
  { uf: 'PI', nome: 'Piauí', aliquotaInternaPadrao: 21 },
  { uf: 'PR', nome: 'Paraná', aliquotaInternaPadrao: 19.5 },
  { uf: 'RJ', nome: 'Rio de Janeiro', aliquotaInternaPadrao: 20 }, // + 2% FECOP = 22%, modal básica 20%
  { uf: 'RN', nome: 'Rio Grande do Norte', aliquotaInternaPadrao: 18 },
  { uf: 'RO', nome: 'Rondônia', aliquotaInternaPadrao: 19.5 },
  { uf: 'RR', nome: 'Roraima', aliquotaInternaPadrao: 20 },
  { uf: 'RS', nome: 'Rio Grande do Sul', aliquotaInternaPadrao: 17 },
  { uf: 'SC', nome: 'Santa Catarina', aliquotaInternaPadrao: 17 },
  { uf: 'SE', nome: 'Sergipe', aliquotaInternaPadrao: 19 },
  { uf: 'SP', nome: 'São Paulo', aliquotaInternaPadrao: 18 },
  { uf: 'TO', nome: 'Tocantins', aliquotaInternaPadrao: 20 },
]

export type AnoTransicaoIbsCbs = 'atual' | 2026 | 2027 | 2028 | 2029 | 2030 | 2031 | 2032 | 2033

export type GrupoPresetSetor = 'geral' | 'reducao_60' | 'reducao_30' | 'aliquota_zero'

export type PresetSetorIbsCbs =
  // Opção genérica / manual
  | 'nenhum'
  | 'padrao'
  // Legados mantidos para compatibilidade retroativa com simulações antigas
  | 'saude_educacao'
  | 'transporte_intelectual'
  | 'cesta_basica'
  // (1) Redução de 60% (arts. 128–134 da LC 214/2025)
  | 'saude_servicos'
  | 'educacao_ensino'
  | 'medicamentos_60'
  | 'dispositivos_medicos_anvisa'
  | 'alimentacao_humana'
  | 'insumos_agropecuarios'
  | 'producoes_artisticas_culturais'
  | 'seguranca_nacional'
  // (2) Redução de 30% (art. 132 da LC 214/2025) - Profissões Intelectuais Regulamentadas
  | 'profissoes_intelectuais_advogados'
  | 'profissoes_intelectuais_contadores'
  | 'profissoes_intelectuais_engenheiros'
  | 'profissoes_intelectuais_economistas'
  | 'profissoes_intelectuais_jornalistas'
  | 'profissoes_intelectuais_demais'
  // (3) Alíquota Zero (arts. 8º, 129 e 146 da LC 214/2025)
  | 'cesta_basica_nacional'
  | 'horticolas_frutas_ovos'
  | 'medicamentos_essenciais_anexo_xii'
  | 'dispositivos_acessibilidade_pcd'

export interface DadosFaseTransicao {
  ano: AnoTransicaoIbsCbs
  fase: string
  subtitulo: string
  aliquotaCbs: number
  aliquotaIbs: number
  totalIvaDual: number
  etiquetaOrigem: string
  baseLegal: string
}

/**
 * Fonte única da verdade das alíquotas oficiais de transição (LC 214/2025 e EC 132/2023)
 * Compartilhada entre Módulo 1 (preenchimento assistido) e Módulo 5 (cronograma 2026–2033).
 */
export const CRONOGRAMA_FASES_TRANSICAO: Record<AnoTransicaoIbsCbs, DadosFaseTransicao> = {
  atual: {
    ano: 'atual',
    fase: 'Ano atual (sistema atual)',
    subtitulo: 'Regime atual pré-reforma · CBS e IBS em 0,00% (ICMS, ISS, PIS e COFINS integrais)',
    aliquotaCbs: 0.0,
    aliquotaIbs: 0.0,
    totalIvaDual: 0.0,
    etiquetaOrigem: 'Sistema atual (pré-reforma)',
    baseLegal: 'Sistema Tributário Vigente pré-EC 132/2023 (PIS, COFINS, IPI, ICMS e ISS vigentes)',
  },
  2026: {
    ano: 2026,
    fase: 'Fase de Teste Operacional',
    subtitulo: 'CBS 0,90% + IBS 0,10% (ensaio geral compensável)',
    aliquotaCbs: 0.9,
    aliquotaIbs: 0.1,
    totalIvaDual: 1.0,
    etiquetaOrigem: 'LC 214/2025 · fase 2026',
    baseLegal: 'Art. 348 da LC 214/2025 (Teste operacional 0,9% CBS + 0,1% IBS compensáveis)',
  },
  2027: {
    ano: 2027,
    fase: 'CBS Plena + Fim PIS/COFINS',
    subtitulo: 'CBS 8,70% (-0,1 p.p.) + IBS 0,10% teste',
    aliquotaCbs: 8.7,
    aliquotaIbs: 0.1,
    totalIvaDual: 8.8,
    etiquetaOrigem: 'LC 214/2025 · fase 2027',
    baseLegal: 'Art. 347 da LC 214/2025 (CBS plena com desconto transitório de 0,1 p.p.)',
  },
  2028: {
    ano: 2028,
    fase: 'Consolidação CBS',
    subtitulo: 'CBS 8,70% + IBS 0,10% teste',
    aliquotaCbs: 8.7,
    aliquotaIbs: 0.1,
    totalIvaDual: 8.8,
    etiquetaOrigem: 'LC 214/2025 · fase 2028',
    baseLegal: 'Art. 347 da LC 214/2025 (CBS consolidada e homologação do CGIBS)',
  },
  2029: {
    ano: 2029,
    fase: 'Início Transição IBS (10%)',
    subtitulo: 'CBS 8,80% + IBS 1,77% (10% de 17,70%)',
    aliquotaCbs: 8.8,
    aliquotaIbs: 1.77,
    totalIvaDual: 10.57,
    etiquetaOrigem: 'LC 214/2025 · fase 2029',
    baseLegal: 'ADCT art. 128 / LC 214/2025 (IBS 10% da alíquota de referência)',
  },
  2030: {
    ano: 2030,
    fase: 'Transição IBS (20%)',
    subtitulo: 'CBS 8,80% + IBS 3,54% (20% de 17,70%)',
    aliquotaCbs: 8.8,
    aliquotaIbs: 3.54,
    totalIvaDual: 12.34,
    etiquetaOrigem: 'LC 214/2025 · fase 2030',
    baseLegal: 'ADCT art. 128 / LC 214/2025 (IBS 20% da alíquota de referência)',
  },
  2031: {
    ano: 2031,
    fase: 'Transição IBS (30%)',
    subtitulo: 'CBS 8,80% + IBS 5,31% (30% de 17,70%)',
    aliquotaCbs: 8.8,
    aliquotaIbs: 5.31,
    totalIvaDual: 14.11,
    etiquetaOrigem: 'LC 214/2025 · fase 2031',
    baseLegal: 'ADCT art. 128 / LC 214/2025 (IBS 30% da alíquota de referência)',
  },
  2032: {
    ano: 2032,
    fase: 'Transição IBS (40%)',
    subtitulo: 'CBS 8,80% + IBS 7,08% (40% de 17,70%)',
    aliquotaCbs: 8.8,
    aliquotaIbs: 7.08,
    totalIvaDual: 15.88,
    etiquetaOrigem: 'LC 214/2025 · fase 2032',
    baseLegal: 'ADCT art. 128 / LC 214/2025 (IBS 40% da alíquota de referência)',
  },
  2033: {
    ano: 2033,
    fase: 'Sistema Pleno IVA Dual (100%)',
    subtitulo: 'CBS 8,80% + IBS 17,70% (26,50% integral)',
    aliquotaCbs: 8.8,
    aliquotaIbs: 17.7,
    totalIvaDual: 26.5,
    etiquetaOrigem: 'LC 214/2025 · fase 2033',
    baseLegal: 'LC 214/2025 art. 130 (IVA Dual integral com ICMS/ISS/PIS/COFINS extintos)',
  },
}

export const LISTA_ANOS_TRANSICAO: AnoTransicaoIbsCbs[] = [
  'atual',
  2026,
  2027,
  2028,
  2029,
  2030,
  2031,
  2032,
  2033,
]

export interface OpcaoPresetSetor {
  id: PresetSetorIbsCbs
  grupo: GrupoPresetSetor
  grupoLabel: string
  titulo: string
  subtitulo: string
  reducaoPercentual: number // 0, 60, 30, 100
  baseLegal: string
  etiquetaOrigem: string
  alvoRegime?: 'padrao' | 'saude_educacao' | 'transporte' | 'cesta_basica'
}

export const PRESETS_SETORES_LC214: OpcaoPresetSetor[] = [
  // --- GRUPO GERAL / PADRÃO ---
  {
    id: 'padrao',
    grupo: 'geral',
    grupoLabel: 'Padrão / Sem Redução',
    titulo: 'Alíquota Padrão Plena (Sem Redução)',
    subtitulo: 'Comércio, Indústria e Serviços em geral (alíquota cheia da fase)',
    reducaoPercentual: 0,
    baseLegal: 'LC 214/2025 art. 130 (Alíquota de referência sem redução)',
    etiquetaOrigem: 'LC 214/2025 · alíquota plena',
    alvoRegime: 'padrao',
  },

  // --- (1) REDUÇÃO DE 60% (arts. 128–134 da LC 214/2025) ---
  {
    id: 'saude_servicos',
    grupo: 'reducao_60',
    grupoLabel: 'Redução de 60% (arts. 128–134)',
    titulo: 'Saúde — Serviços Hospitalares, Clínicas e Diagnóstico (-60%)',
    subtitulo: 'Serviços de saúde humana, atenção ambulatorial e exames laboratoriais',
    reducaoPercentual: 60,
    baseLegal: 'LC 214/2025 art. 130 (Serviços de saúde humana regulamentados)',
    etiquetaOrigem: 'LC 214/2025 · art. 130 — saúde',
    alvoRegime: 'saude_educacao',
  },
  {
    id: 'educacao_ensino',
    grupo: 'reducao_60',
    grupoLabel: 'Redução de 60% (arts. 128–134)',
    titulo: 'Educação — Ensino Básico, Superior e Técnico (-60%)',
    subtitulo: 'Educação infantil, ensino fundamental/médio, superior e técnico-profissional',
    reducaoPercentual: 60,
    baseLegal: 'LC 214/2025 art. 130 (Serviços de educação e ensino)',
    etiquetaOrigem: 'LC 214/2025 · art. 130 — educação',
    alvoRegime: 'saude_educacao',
  },
  {
    id: 'medicamentos_60',
    grupo: 'reducao_60',
    grupoLabel: 'Redução de 60% (arts. 128–134)',
    titulo: 'Medicamentos — Produtos Farmacêuticos Registrados (-60%)',
    subtitulo: 'Medicamentos com registro Anvisa não contemplados com alíquota zero',
    reducaoPercentual: 60,
    baseLegal: 'LC 214/2025 art. 133 (Medicamentos e fármacos com redução de 60%)',
    etiquetaOrigem: 'LC 214/2025 · art. 133 — medicamentos',
    alvoRegime: 'saude_educacao',
  },
  {
    id: 'dispositivos_medicos_anvisa',
    grupo: 'reducao_60',
    grupoLabel: 'Redução de 60% (arts. 128–134)',
    titulo: 'Dispositivos Médicos — Equipamentos e Materiais Anvisa (-60%)',
    subtitulo: 'Dispositivos médicos, próteses, órteses e materiais hospitalares credenciados',
    reducaoPercentual: 60,
    baseLegal:
      'LC 214/2025 art. 131 (Dispositivos médicos e de acessibilidade com registro Anvisa)',
    etiquetaOrigem: 'LC 214/2025 · art. 131 — dispositivos médicos/Anvisa',
    alvoRegime: 'saude_educacao',
  },
  {
    id: 'alimentacao_humana',
    grupo: 'reducao_60',
    grupoLabel: 'Redução de 60% (arts. 128–134)',
    titulo: 'Alimentação Humana — Produtos Agropecuários & Alimentos (-60%)',
    subtitulo: 'Alimentos destinados ao consumo humano fora da Cesta Básica Nacional',
    reducaoPercentual: 60,
    baseLegal: 'LC 214/2025 art. 128 (Alimentos destinados ao consumo humano)',
    etiquetaOrigem: 'LC 214/2025 · art. 128 — alimentação humana',
    alvoRegime: 'saude_educacao',
  },
  {
    id: 'insumos_agropecuarios',
    grupo: 'reducao_60',
    grupoLabel: 'Redução de 60% (arts. 128–134)',
    titulo: 'Insumos Agropecuários e Aquícolas (-60%)',
    subtitulo: 'Fertilizantes, defensivos, sementes certificadas, rações e insumos da produção',
    reducaoPercentual: 60,
    baseLegal: 'LC 214/2025 art. 128 (Insumos agropecuários e aquícolas)',
    etiquetaOrigem: 'LC 214/2025 · art. 128 — insumos agropecuários',
    alvoRegime: 'saude_educacao',
  },
  {
    id: 'producoes_artisticas_culturais',
    grupo: 'reducao_60',
    grupoLabel: 'Redução de 60% (arts. 128–134)',
    titulo: 'Produções Artísticas, Culturais e Desportivas (-60%)',
    subtitulo: 'Eventos culturais, obras audiovisuais nacionais e atividades desportivas',
    reducaoPercentual: 60,
    baseLegal:
      'LC 214/2025 art. 130, IV (Produções artísticas, culturais, jornalísticas e desportivas)',
    etiquetaOrigem: 'LC 214/2025 · art. 130 — cultura/desporto',
    alvoRegime: 'saude_educacao',
  },
  {
    id: 'seguranca_nacional',
    grupo: 'reducao_60',
    grupoLabel: 'Redução de 60% (arts. 128–134)',
    titulo: 'Segurança e Soberania Nacional — Bens e Tecnologias de Defesa (-60%)',
    subtitulo: 'Bens e serviços de segurança nacional, defesa e soberania cibernética',
    reducaoPercentual: 60,
    baseLegal: 'LC 214/2025 art. 134 (Bens e serviços de segurança e soberania nacional)',
    etiquetaOrigem: 'LC 214/2025 · art. 134 — segurança nacional',
    alvoRegime: 'saude_educacao',
  },

  // --- (2) REDUÇÃO DE 30% (art. 132 da LC 214/2025) - PROFISSÕES INTELECTUAIS REGULAMENTADAS ---
  {
    id: 'profissoes_intelectuais_advogados',
    grupo: 'reducao_30',
    grupoLabel: 'Redução de 30% — Profissões Regulamentadas (art. 132)',
    titulo: 'Advocacia — Serviços Jurídicos e Consultoria Legal (-30%)',
    subtitulo: 'Sociedades e profissionais submetidos à fiscalização da OAB',
    reducaoPercentual: 30,
    baseLegal: 'LC 214/2025 art. 132 (Serviços de profissões intelectuais — Advocacia / OAB)',
    etiquetaOrigem: 'LC 214/2025 · art. 132 — advogados (OAB)',
    alvoRegime: 'transporte',
  },
  {
    id: 'profissoes_intelectuais_contadores',
    grupo: 'reducao_30',
    grupoLabel: 'Redução de 30% — Profissões Regulamentadas (art. 132)',
    titulo: 'Contabilidade e Auditoria — CFC/CRC (-30%)',
    subtitulo: 'Serviços contábeis, perícia contábil e auditoria independente',
    reducaoPercentual: 30,
    baseLegal: 'LC 214/2025 art. 132 (Serviços de profissões intelectuais — Contabilidade / CFC)',
    etiquetaOrigem: 'LC 214/2025 · art. 132 — contadores (CFC/CRC)',
    alvoRegime: 'transporte',
  },
  {
    id: 'profissoes_intelectuais_engenheiros',
    grupo: 'reducao_30',
    grupoLabel: 'Redução de 30% — Profissões Regulamentadas (art. 132)',
    titulo: 'Engenharia, Arquitetura e Agronomia — CREA/CAU (-30%)',
    subtitulo: 'Projetos técnicos, perícias, consultorias de engenharia e urbanismo',
    reducaoPercentual: 30,
    baseLegal: 'LC 214/2025 art. 132 (Serviços de profissões intelectuais — Engenharia / CREA-CAU)',
    etiquetaOrigem: 'LC 214/2025 · art. 132 — engenheiros/arquitetos',
    alvoRegime: 'transporte',
  },
  {
    id: 'profissoes_intelectuais_economistas',
    grupo: 'reducao_30',
    grupoLabel: 'Redução de 30% — Profissões Regulamentadas (art. 132)',
    titulo: 'Economia, Administração e Atuária — CORECON/CRA (-30%)',
    subtitulo: 'Consultoria financeira, estudos de viabilidade, auditoria de gestão e previdência',
    reducaoPercentual: 30,
    baseLegal: 'LC 214/2025 art. 132 (Serviços de profissões intelectuais — Economistas / CORECON)',
    etiquetaOrigem: 'LC 214/2025 · art. 132 — economistas/administradores',
    alvoRegime: 'transporte',
  },
  {
    id: 'profissoes_intelectuais_jornalistas',
    grupo: 'reducao_30',
    grupoLabel: 'Redução de 30% — Profissões Regulamentadas (art. 132)',
    titulo: 'Jornalismo, Comunicação e Redação Técnica (-30%)',
    subtitulo: 'Atividades jornalísticas regulamentadas, reportagem e edição técnica',
    reducaoPercentual: 30,
    baseLegal: 'LC 214/2025 art. 132 (Serviços de profissões intelectuais — Jornalistas)',
    etiquetaOrigem: 'LC 214/2025 · art. 132 — jornalistas',
    alvoRegime: 'transporte',
  },
  {
    id: 'profissoes_intelectuais_demais',
    grupo: 'reducao_30',
    grupoLabel: 'Redução de 30% — Profissões Regulamentadas (art. 132)',
    titulo: 'Demais Profissões Intelectuais Regulamentadas por Conselho (-30%)',
    subtitulo: 'Psicologia, fisioterapia, medicina veterinária, biologia e outros conselhos',
    reducaoPercentual: 30,
    baseLegal: 'LC 214/2025 art. 132 (Serviços prestados por profissões intelectuais com conselho)',
    etiquetaOrigem: 'LC 214/2025 · art. 132 — profissões regulamentadas',
    alvoRegime: 'transporte',
  },

  // --- (3) ALÍQUOTA ZERO (arts. 8º, 129 e 146 da LC 214/2025) ---
  {
    id: 'cesta_basica_nacional',
    grupo: 'aliquota_zero',
    grupoLabel: 'Alíquota Zero (arts. 8º, 129 e 146)',
    titulo: 'Cesta Básica Nacional de Alimentos — Alíquota Zero (0%)',
    subtitulo: 'Arroz, feijão, leite, carnes, farinhas, pão, café e itens essenciais do Anexo I',
    reducaoPercentual: 100,
    baseLegal: 'LC 214/2025 art. 8º e 129 (Cesta Básica Nacional com desoneração integral)',
    etiquetaOrigem: 'LC 214/2025 · arts. 8º e 129 — cesta básica nacional',
    alvoRegime: 'cesta_basica',
  },
  {
    id: 'horticolas_frutas_ovos',
    grupo: 'aliquota_zero',
    grupoLabel: 'Alíquota Zero (arts. 8º, 129 e 146)',
    titulo: 'Hortícolas, Frutas Frescas e Ovos — Alíquota Zero (0%)',
    subtitulo: 'Produtos hortícolas in natura, leguminosas, frutas frescas e ovos',
    reducaoPercentual: 100,
    baseLegal: 'LC 214/2025 art. 129, II (Hortícolas, frutas e ovos com alíquota zero)',
    etiquetaOrigem: 'LC 214/2025 · art. 129 — hortícolas, frutas e ovos',
    alvoRegime: 'cesta_basica',
  },
  {
    id: 'medicamentos_essenciais_anexo_xii',
    grupo: 'aliquota_zero',
    grupoLabel: 'Alíquota Zero (arts. 8º, 129 e 146)',
    titulo: 'Medicamentos Essenciais e Imunobiológicos — Anexo XII (0%)',
    subtitulo: 'Medicamentos para câncer, doenças raras, vacinas do PNI e itens do Anexo XII',
    reducaoPercentual: 100,
    baseLegal: 'LC 214/2025 art. 146 e Anexo XII (Medicamentos essenciais com alíquota zero)',
    etiquetaOrigem: 'LC 214/2025 · art. 146 — medicamentos essenciais (Anexo XII)',
    alvoRegime: 'cesta_basica',
  },
  {
    id: 'dispositivos_acessibilidade_pcd',
    grupo: 'aliquota_zero',
    grupoLabel: 'Alíquota Zero (arts. 8º, 129 e 146)',
    titulo: 'Dispositivos de Acessibilidade para PcD — Alíquota Zero (0%)',
    subtitulo: 'Cadeiras de rodas, próteses auditivas/visuais e tecnologias assistivas',
    reducaoPercentual: 100,
    baseLegal: 'LC 214/2025 art. 146 (Dispositivos de acessibilidade para pessoas com deficiência)',
    etiquetaOrigem: 'LC 214/2025 · art. 146 — acessibilidade PcD',
    alvoRegime: 'cesta_basica',
  },

  // --- PRESETS HISTÓRICOS MANTIDOS PARA COMPATIBILIDADE ---
  {
    id: 'saude_educacao',
    grupo: 'reducao_60',
    grupoLabel: 'Redução de 60% (arts. 128–134)',
    titulo: 'Saúde e Educação (-60% genérico)',
    subtitulo: 'Serviços de saúde humana e ensino (preset legado)',
    reducaoPercentual: 60,
    baseLegal: 'LC 214/2025 art. 130 (Redução de 60% para saúde e educação)',
    etiquetaOrigem: 'LC 214/2025 · art. 130 — saúde e educação',
    alvoRegime: 'saude_educacao',
  },
  {
    id: 'transporte_intelectual',
    grupo: 'reducao_30',
    grupoLabel: 'Redução de 30% — Profissões Regulamentadas (art. 132)',
    titulo: 'Transporte Coletivo & Intelectuais (-30% genérico)',
    subtitulo: 'Transporte e profissões regulamentadas (preset legado)',
    reducaoPercentual: 30,
    baseLegal: 'LC 214/2025 arts. 130 e 132 (Redução de 30%)',
    etiquetaOrigem: 'LC 214/2025 · art. 132 — intelectuais/transporte',
    alvoRegime: 'transporte',
  },
  {
    id: 'cesta_basica',
    grupo: 'aliquota_zero',
    grupoLabel: 'Alíquota Zero (arts. 8º, 129 e 146)',
    titulo: 'Cesta Básica Nacional (Alíquota Zero genérica)',
    subtitulo: 'Alimentos essenciais da cesta básica (preset legado)',
    reducaoPercentual: 100,
    baseLegal: 'LC 214/2025 art. 8º e 129 (Isenção integral 0%)',
    etiquetaOrigem: 'LC 214/2025 · arts. 8º e 129 — cesta básica',
    alvoRegime: 'cesta_basica',
  },
]

export interface OrigemCamposAliquota {
  cbsPadrao?: string
  ibsPadrao?: string
  totalIvaDual?: string
  saudeEducacaoAliquota?: string
  transporteAliquota?: string
  cestaBasicaIsencao?: string
}

export interface ConfiguracoesGerais {
  // Alíquotas Padrão IVA Dual
  cbsPadrao: number // 8.80
  ibsPadrao: number // 17.70
  totalIvaDual: number // 26.50

  // Regimes diferenciados
  saudeEducacaoReducao: number // 60%
  saudeEducacaoAliquota: number // 10.60%
  transporteReducao: number // 30%
  transporteAliquota: number // 18.55%
  cestaBasicaIsencao: number // 0%

  // Metadados do preenchimento assistido (Módulo 1)
  anoTransicao?: AnoTransicaoIbsCbs
  presetSetor?: PresetSetorIbsCbs
  regimeAtualEmpresa?: 'Lucro Real' | 'Lucro Presumido' | 'Simples Nacional'
  faturamentoMensal?: number
  percentualComprasVendas?: number
  etiquetasOrigem?: OrigemCamposAliquota

  // Sistema Antigo Lucro Real
  lucroRealPis: number // 1.65%
  lucroRealCofins: number // 7.60%
  lucroRealIpi: number // 5.0%
  lucroRealIcms: number // 18.0%
  lucroRealIss: number // 3.0%

  // Sistema Antigo Lucro Presumido
  lucroPresumidoPis: number // 0.65%
  lucroPresumidoCofins: number // 3.00%
  lucroPresumidoIcms: number // 18.0%
  lucroPresumidoIss: number // 3.0%
  lucroPresumidoIpi: number // 5.0%
}

export const CONFIGURACOES_PADRAO: ConfiguracoesGerais = {
  cbsPadrao: 8.8,
  ibsPadrao: 17.7,
  totalIvaDual: 26.5,

  saudeEducacaoReducao: 60,
  saudeEducacaoAliquota: 10.6,
  transporteReducao: 30,
  transporteAliquota: 18.55,
  cestaBasicaIsencao: 0,

  anoTransicao: 2033,
  presetSetor: 'padrao',
  regimeAtualEmpresa: 'Lucro Presumido',
  faturamentoMensal: 200000,
  percentualComprasVendas: 40,

  lucroRealPis: 1.65,
  lucroRealCofins: 7.6,
  lucroRealIpi: 5.0,
  lucroRealIcms: 18.0,
  lucroRealIss: 3.0,

  lucroPresumidoPis: 0.65,
  lucroPresumidoCofins: 3.0,
  lucroPresumidoIcms: 18.0,
  lucroPresumidoIss: 3.0,
  lucroPresumidoIpi: 5.0,
}

export interface CategoriaDespesaCredito {
  id: string
  nome: string
  valorMensal: number
  // Taxa de crédito do sistema antigo em % (ex: 9.25% para PIS/COFINS LR, 18% para ICMS em insumos, etc.)
  aliquotaAntiga: number
  descricaoAntigo: string
  // Alíquota nova específica (se omitido, aplica config.totalIvaDual de 26,50%)
  aliquotaNova?: number
  // Nota explicativa técnica/legal (ex.: regras de transição ou regimes específicos da LC 214/2025)
  notaEspecial?: string
}

export const CATEGORIAS_CREDITO_PADRAO: CategoriaDespesaCredito[] = [
  {
    id: 'materia_prima',
    nome: 'Matéria-prima',
    valorMensal: 100000,
    aliquotaAntiga: 27.25, // PIS 1.65 + COFINS 7.6 + ICMS 18
    descricaoAntigo: 'Crédito pleno no Lucro Real (PIS 1,65% + COFINS 7,6% + ICMS 18%)',
  },
  {
    id: 'mercadorias_revenda',
    nome: 'Mercadorias para revenda (comércio)',
    valorMensal: 80000,
    aliquotaAntiga: 27.25, // PIS 1.65 + COFINS 7.6 + ICMS 18
    descricaoAntigo:
      'Crédito pleno no Lucro Real (PIS/COFINS 9,25% + ICMS ~18%); restrito no Simples Nacional e Lucro Presumido',
  },
  {
    id: 'maquinas_equipamentos',
    nome: 'Máquinas e equipamentos (CAPEX)',
    valorMensal: 35000,
    aliquotaAntiga: 9.25,
    descricaoAntigo:
      'Crédito restrito e fracionado em 48 meses (CIAP/PIS/COFINS) no Lucro Real; sem crédito no Simples e Presumido',
  },
  {
    id: 'energia_eletrica',
    nome: 'Energia elétrica',
    valorMensal: 15000,
    aliquotaAntiga: 9.25, // PIS/COFINS não-cumulativo (ICMS produtivo condicionado)
    descricaoAntigo: 'Crédito de PIS/COFINS (9,25%) no Lucro Real; ICMS com restrição setorial',
  },
  {
    id: 'combustiveis_lubrificantes',
    nome: 'Combustíveis e lubrificantes de frota',
    valorMensal: 15000,
    aliquotaAntiga: 18.0,
    descricaoAntigo:
      'ICMS monofásico e PIS/COFINS restrito a frotas estritamente produtivas no Lucro Real; vedado para uso administrativo',
  },
  {
    id: 'frete_transporte',
    nome: 'Frete e Transporte de insumos',
    valorMensal: 30000,
    aliquotaAntiga: 21.25, // ICMS 12% + PIS/COFINS 9.25%
    descricaoAntigo: 'Crédito de PIS/COFINS (9,25%) e ICMS interestadual (~12%) no Lucro Real',
  },
  {
    id: 'aluguel',
    nome: 'Aluguel de imóveis/galpões',
    valorMensal: 25000,
    aliquotaAntiga: 9.25, // PIS/COFINS Lucro Real; Presumido = 0
    descricaoAntigo: 'PIS/COFINS 9,25% apenas Lucro Real de PJ; sem crédito no Presumido/Simples',
  },
  {
    id: 'leasing_veiculos_equipamentos',
    nome: 'Arrendamento/leasing de veículos e equipamentos',
    valorMensal: 14000,
    aliquotaAntiga: 9.25,
    descricaoAntigo:
      'Crédito de PIS/COFINS (9,25%) no Lucro Real para bens de capital; sem crédito de ISS e ICMS',
  },
  {
    id: 'manutencao',
    nome: 'Manutenção de máquinas e instalações',
    valorMensal: 18000,
    aliquotaAntiga: 9.25,
    descricaoAntigo: 'PIS/COFINS 9,25% para bens de produção no Lucro Real; sem crédito de ISS',
  },
  {
    id: 'servicos_limpeza',
    nome: 'Serviços de limpeza e segurança',
    valorMensal: 12000,
    aliquotaAntiga: 9.25,
    descricaoAntigo:
      'Permite crédito de PIS/COFINS (9,25%) no Lucro Real como insumo de mão de obra',
  },
  {
    id: 'servicos_ti',
    nome: 'Serviços de TI e Software',
    valorMensal: 20000,
    aliquotaAntiga: 0, // Tradicionalmente vedado/litigioso sem crédito ICMS/ISS
    descricaoAntigo:
      'Geralmente sem crédito no sistema antigo (ISS não gera crédito, PIS/COFINS restrito)',
  },
  {
    id: 'consultorias',
    nome: 'Consultorias e serviços profissionais',
    valorMensal: 15000,
    aliquotaAntiga: 0,
    descricaoAntigo: 'Serviços tributados por ISS: zero crédito tributário no sistema atual',
  },
  {
    id: 'marketing_publicidade',
    nome: 'Marketing e publicidade',
    valorMensal: 12000,
    aliquotaAntiga: 0,
    descricaoAntigo:
      'Serviço tributado sob ISS: sem crédito no sistema antigo e histórico de litígio em PIS/COFINS',
  },
  {
    id: 'royalties_licenciamento',
    nome: 'Royalties e licenciamento',
    valorMensal: 8000,
    aliquotaAntiga: 0,
    descricaoAntigo:
      'Vedação expressa de apropriação de créditos de PIS/COFINS (Leis 10.637 e 10.833) e sem crédito de ISS',
  },
  {
    id: 'seguros',
    nome: 'Seguros',
    valorMensal: 6000,
    aliquotaAntiga: 0,
    descricaoAntigo:
      'Operação financeira sujeita a IOF: vedação legal absoluta de aproveitamento de créditos no regime anterior',
  },
  {
    id: 'viagens_hospedagem',
    nome: 'Viagens/hospedagem/diárias',
    valorMensal: 7000,
    aliquotaAntiga: 0,
    descricaoAntigo:
      'Despesas de representação e viagem: vedadas de crédito no regime anterior (enquadramento em uso/consumo)',
  },
  {
    id: 'tarifas_bancarias',
    nome: 'Tarifas bancárias',
    valorMensal: 3500,
    aliquotaAntiga: 0,
    descricaoAntigo:
      'Serviços do setor financeiro sujeitos a ISS: sem geração de créditos tributários no sistema anterior',
    aliquotaNova: 0,
    notaEspecial:
      'Regime especial dos arts. 164–165 da LC 214/2025: crédito restrito e apenas a partir de 2027. Alíquota imediata de 26,50% não aplicável a serviços financeiros.',
  },
  {
    id: 'agua_esgoto_gas',
    nome: 'Água/esgoto/gás',
    valorMensal: 4000,
    aliquotaAntiga: 0,
    descricaoAntigo:
      'Uso e consumo geral: vedação expressa de créditos de ICMS e PIS/COFINS no sistema antigo',
  },
  {
    id: 'telefonia_internet',
    nome: 'Telefonia e Internet',
    valorMensal: 6000,
    aliquotaAntiga: 0,
    descricaoAntigo:
      'Sem crédito para a maioria dos setores no sistema antigo (vedação de uso/consumo)',
  },
  {
    id: 'material_escritorio',
    nome: 'Material de escritório e expediente',
    valorMensal: 5000,
    aliquotaAntiga: 0,
    descricaoAntigo: 'Uso e consumo: Vedado crédito no sistema antigo (ICMS e PIS/COFINS)',
  },
]
