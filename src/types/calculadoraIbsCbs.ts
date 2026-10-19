export type RegimeDiferenciadoTipo = 'padrao' | 'saude_educacao' | 'transporte' | 'cesta_basica'

export type TipoAtividade =
  | 'servico'
  | 'industria'
  | 'comercio'
  | 'misto'
  | 'agronegocio'
  | 'construcao_civil'
  | 'locacao_bens'
  | 'food_service'

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

export const SUBATIVIDADES_AGRONEGOCIO: InfoSubatividade[] = [
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
]

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
    id: 'energia_eletrica',
    nome: 'Energia elétrica',
    valorMensal: 15000,
    aliquotaAntiga: 9.25, // PIS/COFINS não-cumulativo (ICMS produtivo condicionado)
    descricaoAntigo: 'Crédito de PIS/COFINS (9,25%) no Lucro Real; ICMS com restrição setorial',
  },
  {
    id: 'aluguel',
    nome: 'Aluguel de imóveis/galpões',
    valorMensal: 25000,
    aliquotaAntiga: 9.25, // PIS/COFINS Lucro Real; Presumido = 0
    descricaoAntigo: 'PIS/COFINS 9,25% apenas Lucro Real de PJ; sem crédito no Presumido/Simples',
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
    id: 'servicos_limpeza',
    nome: 'Serviços de limpeza e segurança',
    valorMensal: 12000,
    aliquotaAntiga: 9.25,
    descricaoAntigo:
      'Permite crédito de PIS/COFINS (9,25%) no Lucro Real como insumo de mão de obra',
  },
  {
    id: 'material_escritorio',
    nome: 'Material de escritório e expediente',
    valorMensal: 5000,
    aliquotaAntiga: 0,
    descricaoAntigo: 'Uso e consumo: Vedado crédito no sistema antigo (ICMS e PIS/COFINS)',
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
    id: 'manutencao',
    nome: 'Manutenção de máquinas e instalações',
    valorMensal: 18000,
    aliquotaAntiga: 9.25,
    descricaoAntigo: 'PIS/COFINS 9,25% para bens de produção no Lucro Real; sem crédito de ISS',
  },
  {
    id: 'consultorias',
    nome: 'Consultorias e serviços profissionais',
    valorMensal: 15000,
    aliquotaAntiga: 0,
    descricaoAntigo: 'Serviços tributados por ISS: zero crédito tributário no sistema atual',
  },
  {
    id: 'frete_transporte',
    nome: 'Frete e Transporte de insumos',
    valorMensal: 30000,
    aliquotaAntiga: 21.25, // ICMS 12% + PIS/COFINS 9.25%
    descricaoAntigo: 'Crédito de PIS/COFINS (9,25%) e ICMS interestadual (~12%) no Lucro Real',
  },
]
