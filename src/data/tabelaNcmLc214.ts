/**
 * Tabela Curada NCM → Tratamento Tributário (EC 132/2023 e LC 214/2025).
 *
 * Base estruturada com códigos-chave dos anexos oficiais da Reforma Tributária:
 * 1. Anexo XII — Cesta Básica Nacional de Alimentos (Alíquota Zero / Redução 100%):
 *    Arroz, feijão, leite, pães, carnes, ovos, café, farinhas, etc.
 * 2. Redução de 60% (Anexos I, II, III LC 214/2025 — Agropecuários, Hortícolas, Frutas, Saúde):
 *    Legumes, verduras, frutas frescas, medicamentos essenciais, produtos agropecuários in natura.
 * 3. Redução de 30% (Anexo IV LC 214/2025 — Bens Essenciais e Serviços Especiais):
 *    Bens intermediários e insumos com regime de redução diferenciada.
 * 4. Monofásicos e Bens Sujeitos ao Imposto Seletivo (Bebidas frias, cervejas, cigarros, combustíveis):
 *    Cerveja, refrigerante, águas minerais gaseificadas, fumo/cigarros, veículos automotores.
 * 5. Insumos Agropecuários (Fertilizantes, Adubos, Sementes, Defensivos):
 *    Fertilizantes nitrogenados/fosfatados/potássicos, sementes certificadas, defensivos agropecuários.
 *
 * Classificação resultante no sistema de Análise de Fornecedores:
 * - 'integral': Item gera crédito pleno no regime não-cumulativo (crédito total aproveitável)
 * - 'parcial': Item gera crédito com redução/parcela (alíquota efetiva reduzida ou proporcional)
 * - 'nao_gera': Item com vedação de crédito, monofásico sem transferência na cadeia ou isento sem manutenção de crédito
 */

import type { ClassificacaoCreditoItem } from '@/services/fornecedores'

export type CategoriaNcmLc214 =
  | 'cesta_basica_anexo_xii'
  | 'reducao_60'
  | 'reducao_30'
  | 'monofasico_imposto_seletivo'
  | 'insumos_agropecuarios'
  | 'regime_geral_insumos'

export interface ItemNcmCurado {
  codigo: string // NCM formatado ou puro (ex: "1006.30.21" ou "10063021")
  codigoLimpo: string // 8 dígitos apenas números (ou 4/6 se prefixo)
  descricao: string
  categoria: CategoriaNcmLc214
  categoriaRotulo: string
  anexoReferencia: string
  classificacaoSugerida: ClassificacaoCreditoItem
  percentualCreditoSugerido?: number // Se 'parcial', percentual padrão (ex: 40 para redução 60%)
  aliquotaEfetivaTexto: string
  observacaoTributaria: string
}

export const TABELA_CURADA_NCM: ItemNcmCurado[] = [
  // -------------------------------------------------------------------------
  // 1. ANEXO XII - CESTA BÁSICA NACIONAL (ALÍQUOTA ZERO / REDUÇÃO 100%)
  // Produtos com desoneração integral (alíquota zero de IBS e CBS)
  // No adquirente comercial/industrial, o crédito pode ser integral se mantido ou não gera se desonerado na ponta
  // -------------------------------------------------------------------------
  {
    codigo: '1006.30.21',
    codigoLimpo: '10063021',
    descricao: 'Arroz polido ou brunido, parboilizado',
    categoria: 'cesta_basica_anexo_xii',
    categoriaRotulo: 'Cesta Básica Nacional',
    anexoReferencia: 'LC 214/2025, Anexo XII',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Alíquota Zero (IBS/CBS 0%)',
    observacaoTributaria: 'Cesta Básica Nacional com desoneração integral (Anexo XII LC 214/2025).',
  },
  {
    codigo: '1006.30.29',
    codigoLimpo: '10063029',
    descricao: 'Arroz polido ou brunido, não parboilizado',
    categoria: 'cesta_basica_anexo_xii',
    categoriaRotulo: 'Cesta Básica Nacional',
    anexoReferencia: 'LC 214/2025, Anexo XII',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Alíquota Zero (IBS/CBS 0%)',
    observacaoTributaria: 'Cesta Básica Nacional com desoneração integral (Anexo XII LC 214/2025).',
  },
  {
    codigo: '1006.10.92',
    codigoLimpo: '10061092',
    descricao: 'Arroz em casca (paddy), não parboilizado',
    categoria: 'cesta_basica_anexo_xii',
    categoriaRotulo: 'Cesta Básica Nacional',
    anexoReferencia: 'LC 214/2025, Anexo XII',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Alíquota Zero (IBS/CBS 0%)',
    observacaoTributaria: 'Insumo agrícola primário de arroz da Cesta Básica.',
  },
  {
    codigo: '0713.33.19',
    codigoLimpo: '07133319',
    descricao: 'Feijão preto comum (seco em grãos)',
    categoria: 'cesta_basica_anexo_xii',
    categoriaRotulo: 'Cesta Básica Nacional',
    anexoReferencia: 'LC 214/2025, Anexo XII',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Alíquota Zero (IBS/CBS 0%)',
    observacaoTributaria: 'Feijão em grãos da Cesta Básica Nacional com alíquota zero.',
  },
  {
    codigo: '0713.33.99',
    codigoLimpo: '07133399',
    descricao: 'Outros feijões comuns (feijão carioca, carioquinha)',
    categoria: 'cesta_basica_anexo_xii',
    categoriaRotulo: 'Cesta Básica Nacional',
    anexoReferencia: 'LC 214/2025, Anexo XII',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Alíquota Zero (IBS/CBS 0%)',
    observacaoTributaria: 'Feijão carioca e outros grãos da Cesta Básica Nacional.',
  },
  {
    codigo: '0401.10.10',
    codigoLimpo: '04011010',
    descricao: 'Leite fluido UHT (longa vida) teor matéria gorda <= 1%',
    categoria: 'cesta_basica_anexo_xii',
    categoriaRotulo: 'Cesta Básica Nacional',
    anexoReferencia: 'LC 214/2025, Anexo XII',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Alíquota Zero (IBS/CBS 0%)',
    observacaoTributaria: 'Leite pasteurizado/UHT desnatado da Cesta Básica Nacional.',
  },
  {
    codigo: '0401.20.10',
    codigoLimpo: '04012010',
    descricao: 'Leite fluido pasteurizado/UHT integral teor > 1% e <= 6%',
    categoria: 'cesta_basica_anexo_xii',
    categoriaRotulo: 'Cesta Básica Nacional',
    anexoReferencia: 'LC 214/2025, Anexo XII',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Alíquota Zero (IBS/CBS 0%)',
    observacaoTributaria: 'Leite fluido integral da Cesta Básica Nacional.',
  },
  {
    codigo: '0402.10.10',
    codigoLimpo: '04021010',
    descricao: 'Leite em pó desnatado',
    categoria: 'cesta_basica_anexo_xii',
    categoriaRotulo: 'Cesta Básica Nacional',
    anexoReferencia: 'LC 214/2025, Anexo XII',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Alíquota Zero (IBS/CBS 0%)',
    observacaoTributaria: 'Leite em pó sem adição de açúcar da Cesta Básica.',
  },
  {
    codigo: '0402.21.10',
    codigoLimpo: '04022110',
    descricao: 'Leite em pó integral sem açúcar',
    categoria: 'cesta_basica_anexo_xii',
    categoriaRotulo: 'Cesta Básica Nacional',
    anexoReferencia: 'LC 214/2025, Anexo XII',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Alíquota Zero (IBS/CBS 0%)',
    observacaoTributaria: 'Leite em pó integral da Cesta Básica Nacional.',
  },
  {
    codigo: '0405.10.00',
    codigoLimpo: '04051000',
    descricao: 'Manteiga comum de leite',
    categoria: 'cesta_basica_anexo_xii',
    categoriaRotulo: 'Cesta Básica Nacional',
    anexoReferencia: 'LC 214/2025, Anexo XII',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Alíquota Zero (IBS/CBS 0%)',
    observacaoTributaria: 'Manteiga de leite da Cesta Básica Nacional.',
  },
  {
    codigo: '1905.90.90',
    codigoLimpo: '19059090',
    descricao: 'Pão francês tradicional e pães comuns sem recheio',
    categoria: 'cesta_basica_anexo_xii',
    categoriaRotulo: 'Cesta Básica Nacional',
    anexoReferencia: 'LC 214/2025, Anexo XII',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Alíquota Zero (IBS/CBS 0%)',
    observacaoTributaria: 'Pão tradicional e produtos de panificação básica.',
  },
  {
    codigo: '1101.00.10',
    codigoLimpo: '11010010',
    descricao: 'Farinha de trigo comum',
    categoria: 'cesta_basica_anexo_xii',
    categoriaRotulo: 'Cesta Básica Nacional',
    anexoReferencia: 'LC 214/2025, Anexo XII',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Alíquota Zero (IBS/CBS 0%)',
    observacaoTributaria: 'Farinha de trigo ensacada da Cesta Básica Nacional.',
  },
  {
    codigo: '1106.20.00',
    codigoLimpo: '11062000',
    descricao: 'Farinha de mandioca e fécula de mandioca',
    categoria: 'cesta_basica_anexo_xii',
    categoriaRotulo: 'Cesta Básica Nacional',
    anexoReferencia: 'LC 214/2025, Anexo XII',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Alíquota Zero (IBS/CBS 0%)',
    observacaoTributaria: 'Farinha e féculas de mandioca da Cesta Básica Nacional.',
  },
  {
    codigo: '1102.20.00',
    codigoLimpo: '11022000',
    descricao: 'Farinha de milho e fubá',
    categoria: 'cesta_basica_anexo_xii',
    categoriaRotulo: 'Cesta Básica Nacional',
    anexoReferencia: 'LC 214/2025, Anexo XII',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Alíquota Zero (IBS/CBS 0%)',
    observacaoTributaria: 'Farinha e sêmolas de milho da Cesta Básica.',
  },
  {
    codigo: '0901.21.00',
    codigoLimpo: '09012100',
    descricao: 'Café torrado e moído (não descafeinado)',
    categoria: 'cesta_basica_anexo_xii',
    categoriaRotulo: 'Cesta Básica Nacional',
    anexoReferencia: 'LC 214/2025, Anexo XII',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Alíquota Zero (IBS/CBS 0%)',
    observacaoTributaria: 'Café torrado e moído tradicional da Cesta Básica Nacional.',
  },
  {
    codigo: '0407.21.00',
    codigoLimpo: '04072100',
    descricao: 'Ovos de aves da espécie Gallus domesticus (frescos)',
    categoria: 'cesta_basica_anexo_xii',
    categoriaRotulo: 'Cesta Básica Nacional',
    anexoReferencia: 'LC 214/2025, Anexo XII',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Alíquota Zero (IBS/CBS 0%)',
    observacaoTributaria: 'Ovos frescos para consumo da Cesta Básica Nacional.',
  },
  {
    codigo: '1507.90.11',
    codigoLimpo: '15079011',
    descricao: 'Óleo de soja refinado em recipientes <= 5 litros',
    categoria: 'cesta_basica_anexo_xii',
    categoriaRotulo: 'Cesta Básica Nacional',
    anexoReferencia: 'LC 214/2025, Anexo XII',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Alíquota Zero (IBS/CBS 0%)',
    observacaoTributaria: 'Óleo de soja vegetal refinado da Cesta Básica Nacional.',
  },
  {
    codigo: '0201.20.90',
    codigoLimpo: '02012090',
    descricao: 'Carnes bovinas frescas ou refrigeradas, desossadas',
    categoria: 'cesta_basica_anexo_xii',
    categoriaRotulo: 'Cesta Básica Nacional',
    anexoReferencia: 'LC 214/2025, Anexo XII',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Alíquota Zero (IBS/CBS 0%)',
    observacaoTributaria: 'Carnes bovinas in natura incluídas na Cesta Básica Nacional.',
  },
  {
    codigo: '0207.14.00',
    codigoLimpo: '02071400',
    descricao: 'Pedaços e miudezas de frango congelados (cortes de frango)',
    categoria: 'cesta_basica_anexo_xii',
    categoriaRotulo: 'Cesta Básica Nacional',
    anexoReferencia: 'LC 214/2025, Anexo XII',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Alíquota Zero (IBS/CBS 0%)',
    observacaoTributaria: 'Cortes de frango in natura incluídos na Cesta Básica Nacional.',
  },
  {
    codigo: '0203.29.00',
    codigoLimpo: '02032900',
    descricao: 'Carnes suínas congeladas desossadas',
    categoria: 'cesta_basica_anexo_xii',
    categoriaRotulo: 'Cesta Básica Nacional',
    anexoReferencia: 'LC 214/2025, Anexo XII',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Alíquota Zero (IBS/CBS 0%)',
    observacaoTributaria: 'Cortes suínos in natura incluídos na Cesta Básica Nacional.',
  },
  {
    codigo: '1701.14.00',
    codigoLimpo: '17011400',
    descricao: 'Açúcar de cana cristal em estado bruto',
    categoria: 'cesta_basica_anexo_xii',
    categoriaRotulo: 'Cesta Básica Nacional',
    anexoReferencia: 'LC 214/2025, Anexo XII',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Alíquota Zero (IBS/CBS 0%)',
    observacaoTributaria: 'Açúcar cristal tradicional da Cesta Básica Nacional.',
  },

  // -------------------------------------------------------------------------
  // 2. REDUÇÃO DE 60% (ANEXOS I, II, III LC 214/2025 - AGRO, HORTÍCOLAS, SAÚDE)
  // Alíquota efetiva = 40% da alíquota padrão (~10,6% sob 26,5%)
  // Crédito de entrada proporcional: classificação 'parcial' com 40% de aproveitamento efetivo
  // -------------------------------------------------------------------------
  {
    codigo: '0702.00.00',
    codigoLimpo: '07020000',
    descricao: 'Tomates frescos ou refrigerados',
    categoria: 'reducao_60',
    categoriaRotulo: 'Redução de 60% (Hortícolas/Agro)',
    anexoReferencia: 'LC 214/2025, Anexo I',
    classificacaoSugerida: 'parcial',
    percentualCreditoSugerido: 40,
    aliquotaEfetivaTexto: 'Redução 60% (Alíquota efetiva ~10,6%)',
    observacaoTributaria:
      'Produto hortícola com alíquota reduzida em 60% da alíquota de referência.',
  },
  {
    codigo: '0701.90.00',
    codigoLimpo: '07019000',
    descricao: 'Batatas frescas ou refrigeradas',
    categoria: 'reducao_60',
    categoriaRotulo: 'Redução de 60% (Hortícolas/Agro)',
    anexoReferencia: 'LC 214/2025, Anexo I',
    classificacaoSugerida: 'parcial',
    percentualCreditoSugerido: 40,
    aliquotaEfetivaTexto: 'Redução 60% (Alíquota efetiva ~10,6%)',
    observacaoTributaria: 'Tubérculos e raízes hortícolas com redução de 60%.',
  },
  {
    codigo: '0703.10.19',
    codigoLimpo: '07031019',
    descricao: 'Cebolas frescas ou refrigeradas',
    categoria: 'reducao_60',
    categoriaRotulo: 'Redução de 60% (Hortícolas/Agro)',
    anexoReferencia: 'LC 214/2025, Anexo I',
    classificacaoSugerida: 'parcial',
    percentualCreditoSugerido: 40,
    aliquotaEfetivaTexto: 'Redução 60% (Alíquota efetiva ~10,6%)',
    observacaoTributaria: 'Hortícola com redução de 60% sob a LC 214/2025.',
  },
  {
    codigo: '0703.20.90',
    codigoLimpo: '07032090',
    descricao: 'Alhos frescos ou refrigerados',
    categoria: 'reducao_60',
    categoriaRotulo: 'Redução de 60% (Hortícolas/Agro)',
    anexoReferencia: 'LC 214/2025, Anexo I',
    classificacaoSugerida: 'parcial',
    percentualCreditoSugerido: 40,
    aliquotaEfetivaTexto: 'Redução 60% (Alíquota efetiva ~10,6%)',
    observacaoTributaria: 'Hortícola com redução de 60% sob a LC 214/2025.',
  },
  {
    codigo: '0709.60.00',
    codigoLimpo: '07096000',
    descricao: 'Pimentões e pimentas frescas',
    categoria: 'reducao_60',
    categoriaRotulo: 'Redução de 60% (Hortícolas/Agro)',
    anexoReferencia: 'LC 214/2025, Anexo I',
    classificacaoSugerida: 'parcial',
    percentualCreditoSugerido: 40,
    aliquotaEfetivaTexto: 'Redução 60% (Alíquota efetiva ~10,6%)',
    observacaoTributaria: 'Hortícola com redução de 60% sob a LC 214/2025.',
  },
  {
    codigo: '0803.90.00',
    codigoLimpo: '08039000',
    descricao: 'Bananas frescas ou secas',
    categoria: 'reducao_60',
    categoriaRotulo: 'Redução de 60% (Frutas/Agro)',
    anexoReferencia: 'LC 214/2025, Anexo I',
    classificacaoSugerida: 'parcial',
    percentualCreditoSugerido: 40,
    aliquotaEfetivaTexto: 'Redução 60% (Alíquota efetiva ~10,6%)',
    observacaoTributaria: 'Frutas frescas nacionais com redução de 60%.',
  },
  {
    codigo: '0805.10.00',
    codigoLimpo: '08051000',
    descricao: 'Laranjas frescas ou secas',
    categoria: 'reducao_60',
    categoriaRotulo: 'Redução de 60% (Frutas/Agro)',
    anexoReferencia: 'LC 214/2025, Anexo I',
    classificacaoSugerida: 'parcial',
    percentualCreditoSugerido: 40,
    aliquotaEfetivaTexto: 'Redução 60% (Alíquota efetiva ~10,6%)',
    observacaoTributaria: 'Citros in natura com redução de 60%.',
  },
  {
    codigo: '0808.10.00',
    codigoLimpo: '08081000',
    descricao: 'Maçãs frescas',
    categoria: 'reducao_60',
    categoriaRotulo: 'Redução de 60% (Frutas/Agro)',
    anexoReferencia: 'LC 214/2025, Anexo I',
    classificacaoSugerida: 'parcial',
    percentualCreditoSugerido: 40,
    aliquotaEfetivaTexto: 'Redução 60% (Alíquota efetiva ~10,6%)',
    observacaoTributaria: 'Frutas frescas com redução de 60%.',
  },
  {
    codigo: '3004.90.99',
    codigoLimpo: '30049099',
    descricao: 'Medicamentos dosados para medicina humana (uso contínuo)',
    categoria: 'reducao_60',
    categoriaRotulo: 'Redução de 60% (Saúde/Medicamentos)',
    anexoReferencia: 'LC 214/2025, Anexo II',
    classificacaoSugerida: 'parcial',
    percentualCreditoSugerido: 40,
    aliquotaEfetivaTexto: 'Redução 60% (Alíquota efetiva ~10,6%)',
    observacaoTributaria: 'Medicamentos essenciais registrados na Anvisa com redução de 60%.',
  },
  {
    codigo: '3002.41.80',
    codigoLimpo: '30024180',
    descricao: 'Vacinas para medicina humana',
    categoria: 'reducao_60',
    categoriaRotulo: 'Redução de 60% (Saúde/Vacinas)',
    anexoReferencia: 'LC 214/2025, Anexo II',
    classificacaoSugerida: 'parcial',
    percentualCreditoSugerido: 40,
    aliquotaEfetivaTexto: 'Redução 60% (Alíquota efetiva ~10,6%)',
    observacaoTributaria: 'Imunobiológicos e vacinas com redução de 60%.',
  },

  // -------------------------------------------------------------------------
  // 3. REDUÇÃO DE 30% (ANEXO IV LC 214/2025 - BENS ESSENCIAIS E SERVIÇOS ESPECIAIS)
  // Alíquota efetiva = 70% da alíquota padrão (~18,55% sob 26,5%)
  // Crédito de entrada proporcional: classificação 'parcial' com 70% de aproveitamento efetivo
  // -------------------------------------------------------------------------
  {
    codigo: '8708.29.99',
    codigoLimpo: '87082999',
    descricao: 'Peças e partes de carroçarias para veículos automotores',
    categoria: 'reducao_30',
    categoriaRotulo: 'Redução de 30% (Regime Diferenciado)',
    anexoReferencia: 'LC 214/2025, Anexo IV',
    classificacaoSugerida: 'parcial',
    percentualCreditoSugerido: 70,
    aliquotaEfetivaTexto: 'Redução 30% (Alíquota efetiva ~18,55%)',
    observacaoTributaria: 'Insumo metal-mecânico industrial sujeito ao regime de redução de 30%.',
  },
  {
    codigo: '8409.91.90',
    codigoLimpo: '84099190',
    descricao: 'Partes de motores de pistão para veículos rodoviários',
    categoria: 'reducao_30',
    categoriaRotulo: 'Redução de 30% (Regime Diferenciado)',
    anexoReferencia: 'LC 214/2025, Anexo IV',
    classificacaoSugerida: 'parcial',
    percentualCreditoSugerido: 70,
    aliquotaEfetivaTexto: 'Redução 30% (Alíquota efetiva ~18,55%)',
    observacaoTributaria: 'Componentes automotivos em regime de desoneração de 30%.',
  },
  {
    codigo: '9018.90.99',
    codigoLimpo: '90189099',
    descricao: 'Instrumentos e aparelhos para medicina, cirurgia e odontologia',
    categoria: 'reducao_30',
    categoriaRotulo: 'Redução de 30% (Aparelhos Médicos)',
    anexoReferencia: 'LC 214/2025, Anexo IV',
    classificacaoSugerida: 'parcial',
    percentualCreditoSugerido: 70,
    aliquotaEfetivaTexto: 'Redução 30% (Alíquota efetiva ~18,55%)',
    observacaoTributaria: 'Dispositivos e equipamentos médicos com alíquota reduzida em 30%.',
  },

  // -------------------------------------------------------------------------
  // 4. MONOFÁSICOS E BENS SUJEITOS AO IMPOSTO SELETIVO (IS)
  // Bebidas frias, refrigerantes, cervejas, cigarros, combustíveis
  // Característica: não geram crédito de IBS/CBS na cadeia de revenda ou crédito vedado
  // -------------------------------------------------------------------------
  {
    codigo: '2203.00.00',
    codigoLimpo: '22030000',
    descricao: 'Cervejas de malte (bebida alcoólica sujeita a Imposto Seletivo)',
    categoria: 'monofasico_imposto_seletivo',
    categoriaRotulo: 'Monofásico / Imposto Seletivo',
    anexoReferencia: 'LC 214/2025, Art. 403 e Anexo XVIII',
    classificacaoSugerida: 'nao_gera',
    aliquotaEfetivaTexto: 'IBS/CBS Padrão + Imposto Seletivo (Sem Crédito de IS)',
    observacaoTributaria:
      'Bebida alcoólica sujeita ao Imposto Seletivo (IS). O IS pago não gera crédito na cadeia.',
  },
  {
    codigo: '2202.10.00',
    codigoLimpo: '22021000',
    descricao: 'Refrigerantes e águas aromatizadas com adição de açúcar',
    categoria: 'monofasico_imposto_seletivo',
    categoriaRotulo: 'Monofásico / Imposto Seletivo',
    anexoReferencia: 'LC 214/2025, Art. 403',
    classificacaoSugerida: 'nao_gera',
    aliquotaEfetivaTexto: 'Bebida açucarada com incidência de Imposto Seletivo',
    observacaoTributaria:
      'Bebidas frias açucaradas sujeitas ao Imposto Seletivo (art. 403 LC 214/2025).',
  },
  {
    codigo: '2202.99.00',
    codigoLimpo: '22029900',
    descricao: 'Outras bebidas não alcoólicas (energéticos, néctares com açúcar)',
    categoria: 'monofasico_imposto_seletivo',
    categoriaRotulo: 'Monofásico / Imposto Seletivo',
    anexoReferencia: 'LC 214/2025, Art. 403',
    classificacaoSugerida: 'nao_gera',
    aliquotaEfetivaTexto: 'Sujeito a Imposto Seletivo (Sem Crédito de IS)',
    observacaoTributaria: 'Bebidas não alcoólicas com açúcares adicionados e incidência de IS.',
  },
  {
    codigo: '2402.20.00',
    codigoLimpo: '24022000',
    descricao: 'Cigarros contendo tabaco',
    categoria: 'monofasico_imposto_seletivo',
    categoriaRotulo: 'Monofásico / Imposto Seletivo',
    anexoReferencia: 'LC 214/2025, Art. 396',
    classificacaoSugerida: 'nao_gera',
    aliquotaEfetivaTexto: 'Tributação Monofásica / IS Majorado (Sem Crédito)',
    observacaoTributaria: 'Produtos fumígenos sujeitos a alíquotas ad valorem e específicas do IS.',
  },
  {
    codigo: '2710.12.59',
    codigoLimpo: '27101259',
    descricao: 'Gasolina automotiva comum e aditivada',
    categoria: 'monofasico_imposto_seletivo',
    categoriaRotulo: 'Monofásico / Combustíveis',
    anexoReferencia: 'LC 214/2025, Regime Monofásico Combustíveis',
    classificacaoSugerida: 'nao_gera',
    aliquotaEfetivaTexto: 'Alíquota Ad Rem Monofásica por Litro',
    observacaoTributaria: 'Combustível sob tributação monofásica por unidade de medida (ad rem).',
  },
  {
    codigo: '2710.19.21',
    codigoLimpo: '27101921',
    descricao: 'Óleo diesel automotivo',
    categoria: 'monofasico_imposto_seletivo',
    categoriaRotulo: 'Monofásico / Combustíveis',
    anexoReferencia: 'LC 214/2025, Regime Monofásico Combustíveis',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Monofásico Ad Rem com Manutenção de Crédito para Transportes/Insumos',
    observacaoTributaria:
      'Diesel utilizado como insumo direto de frete ou produção permite crédito específico.',
  },

  // -------------------------------------------------------------------------
  // 5. INSUMOS AGROPECUÁRIOS (FERTILIZANTES, ADUBOS, SEMENTES, DEFENSIVOS)
  // Alíquota reduzida em 60% ou isenção com crédito assegurado (Anexo I/II LC 214)
  // Crédito integral assegurado para produtores adquirentes
  // -------------------------------------------------------------------------
  {
    codigo: '3102.10.10',
    codigoLimpo: '31021010',
    descricao: 'Ureia com teor de nitrogênio > 45% (fertilizante agrícola)',
    categoria: 'insumos_agropecuarios',
    categoriaRotulo: 'Insumos Agropecuários (Fertilizantes)',
    anexoReferencia: 'LC 214/2025, Anexo I / Art. 129',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Redução 60% com Crédito Assegurado ao Produtor',
    observacaoTributaria:
      'Adubo mineral nitrogenado com manutenção integral de crédito ao adquirente.',
  },
  {
    codigo: '3102.21.00',
    codigoLimpo: '31022100',
    descricao: 'Sulfato de amônio (fertilizante mineral)',
    categoria: 'insumos_agropecuarios',
    categoriaRotulo: 'Insumos Agropecuários (Fertilizantes)',
    anexoReferencia: 'LC 214/2025, Anexo I',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Redução 60% com Crédito Assegurado ao Produtor',
    observacaoTributaria: 'Fertilizante mineral nitrogenado para uso agrícola.',
  },
  {
    codigo: '3104.20.90',
    codigoLimpo: '31042090',
    descricao: 'Cloreto de potássio (fertilizante potássico)',
    categoria: 'insumos_agropecuarios',
    categoriaRotulo: 'Insumos Agropecuários (Fertilizantes)',
    anexoReferencia: 'LC 214/2025, Anexo I',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Redução 60% com Crédito Assegurado ao Produtor',
    observacaoTributaria: 'Adubo mineral potássico com crédito fiscal resguardado.',
  },
  {
    codigo: '3105.20.00',
    codigoLimpo: '31052000',
    descricao: 'Adubos minerais contendo NPK (nitrogênio, fósforo e potássio)',
    categoria: 'insumos_agropecuarios',
    categoriaRotulo: 'Insumos Agropecuários (Fertilizantes)',
    anexoReferencia: 'LC 214/2025, Anexo I',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Redução 60% com Crédito Assegurado ao Produtor',
    observacaoTributaria: 'Formulações completas de NPK para lavouras.',
  },
  {
    codigo: '1201.10.00',
    codigoLimpo: '12011000',
    descricao: 'Sementes de soja para semeadura certificadas',
    categoria: 'insumos_agropecuarios',
    categoriaRotulo: 'Insumos Agropecuários (Sementes)',
    anexoReferencia: 'LC 214/2025, Anexo I',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Alíquota Reduzida em 60% (Insumo Agrícola Essencial)',
    observacaoTributaria: 'Sementes registradas no Renascem com crédito pleno ao produtor rural.',
  },
  {
    codigo: '1005.10.00',
    codigoLimpo: '10051000',
    descricao: 'Sementes de milho para semeadura certificadas',
    categoria: 'insumos_agropecuarios',
    categoriaRotulo: 'Insumos Agropecuários (Sementes)',
    anexoReferencia: 'LC 214/2025, Anexo I',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Alíquota Reduzida em 60% (Insumo Agrícola Essencial)',
    observacaoTributaria: 'Sementes de milho híbrido para semeadura com crédito garantido.',
  },
  {
    codigo: '3808.91.19',
    codigoLimpo: '38089119',
    descricao: 'Inseticidas para uso na agropecuária',
    categoria: 'insumos_agropecuarios',
    categoriaRotulo: 'Insumos Agropecuários (Defensivos)',
    anexoReferencia: 'LC 214/2025, Anexo I',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Defensivo Agropecuário com Redução de 60%',
    observacaoTributaria:
      'Defensivos registrados no Mapa com crédito fiscal de entrada assegurado.',
  },
  {
    codigo: '3808.93.29',
    codigoLimpo: '38089329',
    descricao: 'Herbicidas à base de glifosato e derivados para lavoura',
    categoria: 'insumos_agropecuarios',
    categoriaRotulo: 'Insumos Agropecuários (Defensivos)',
    anexoReferencia: 'LC 214/2025, Anexo I',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Defensivo Agropecuário com Redução de 60%',
    observacaoTributaria: 'Herbicida agrícola essencial para manejo de culturas.',
  },
  {
    codigo: '3808.92.19',
    codigoLimpo: '38089219',
    descricao: 'Fungicidas para uso na agricultura',
    categoria: 'insumos_agropecuarios',
    categoriaRotulo: 'Insumos Agropecuários (Defensivos)',
    anexoReferencia: 'LC 214/2025, Anexo I',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Defensivo Agropecuário com Redução de 60%',
    observacaoTributaria: 'Defensivos fitossanitários com aproveitamento integral de crédito.',
  },
  {
    codigo: '2309.90.10',
    codigoLimpo: '23099010',
    descricao: 'Rações preparadas para alimentação de animais (bovinos, aves, suínos)',
    categoria: 'insumos_agropecuarios',
    categoriaRotulo: 'Insumos Agropecuários (Nutrição)',
    anexoReferencia: 'LC 214/2025, Anexo I',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Rações e Concentrados com Redução de 60%',
    observacaoTributaria: 'Insumos de nutrição animal para pecuária e avicultura industrial.',
  },

  // -------------------------------------------------------------------------
  // 6. REGIME GERAL / INSUMOS INDUSTRIAIS FREQUENTES (CRÉDITO INTEGRAL)
  // Embalagens, matérias-primas mecânicas, plásticos, produtos de limpeza industrial
  // -------------------------------------------------------------------------
  {
    codigo: '4819.10.00',
    codigoLimpo: '48191000',
    descricao: 'Caixas de papel ou cartão ondulado (embalagens de papelão)',
    categoria: 'regime_geral_insumos',
    categoriaRotulo: 'Regime Regular (Insumos/Embalagens)',
    anexoReferencia: 'LC 214/2025, Regime Não-Cumulativo Geral',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Alíquota Padrão (~26,5% na fase plena)',
    observacaoTributaria: 'Embalagem de transporte e acondicionamento com crédito integral.',
  },
  {
    codigo: '3923.21.90',
    codigoLimpo: '39232190',
    descricao: 'Sacos e bolsas de polietileno para embalagem industrial',
    categoria: 'regime_geral_insumos',
    categoriaRotulo: 'Regime Regular (Insumos/Embalagens)',
    anexoReferencia: 'LC 214/2025, Regime Não-Cumulativo Geral',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Alíquota Padrão (~26,5% na fase plena)',
    observacaoTributaria: 'Embalagens plásticas industriais com crédito integral de IBS/CBS.',
  },
  {
    codigo: '7208.39.10',
    codigoLimpo: '72083910',
    descricao: 'Bobinas de aço laminadas a quente de espessura < 3 mm',
    categoria: 'regime_geral_insumos',
    categoriaRotulo: 'Regime Regular (Matéria-Prima Industrial)',
    anexoReferencia: 'LC 214/2025, Regime Não-Cumulativo Geral',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Alíquota Padrão (~26,5% na fase plena)',
    observacaoTributaria: 'Aço para transformação industrial com crédito integral pleno.',
  },
  {
    codigo: '7601.10.00',
    codigoLimpo: '76011000',
    descricao: 'Alumínio em formas brutas não ligado (lingotes)',
    categoria: 'regime_geral_insumos',
    categoriaRotulo: 'Regime Regular (Matéria-Prima Industrial)',
    anexoReferencia: 'LC 214/2025, Regime Não-Cumulativo Geral',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Alíquota Padrão (~26,5% na fase plena)',
    observacaoTributaria: 'Metais primários não ferrosos com crédito integral.',
  },
  {
    codigo: '3402.90.39',
    codigoLimpo: '34029039',
    descricao: 'Detergentes industriais e produtos de limpeza para sanitização',
    categoria: 'regime_geral_insumos',
    categoriaRotulo: 'Regime Regular (Manutenção Industrial)',
    anexoReferencia: 'LC 214/2025, Regime Não-Cumulativo Geral',
    classificacaoSugerida: 'integral',
    aliquotaEfetivaTexto: 'Alíquota Padrão (~26,5% na fase plena)',
    observacaoTributaria: 'Produtos químicos industriais consumidos no processo produtivo.',
  },
  {
    codigo: '4820.10.00',
    codigoLimpo: '48201000',
    descricao: 'Cadernos, blocos de notas e formulários para escritório',
    categoria: 'regime_geral_insumos',
    categoriaRotulo: 'Material de Uso e Consumo',
    anexoReferencia: 'LC 214/2025, Art. 52 (Uso/Consumo)',
    classificacaoSugerida: 'nao_gera',
    aliquotaEfetivaTexto: 'Alíquota Padrão (Sem Aproveitamento se Uso e Consumo Pessoal)',
    observacaoTributaria:
      'Material de expediente e consumo administrativo vedado para crédito de insumo produtivo.',
  },
]

/**
 * Normaliza uma string de NCM removendo pontuações, espaços e caracteres não numéricos
 */
export function normalizarCodigoNcm(codigo?: string | null): string {
  if (!codigo) return ''
  return codigo.replace(/\D/g, '').trim()
}

/**
 * Formata um código NCM numérico de 8 dígitos para o padrão NNNN.NN.NN
 */
export function formatarCodigoNcm(codigo?: string | null): string {
  const limpo = normalizarCodigoNcm(codigo)
  if (limpo.length !== 8) return codigo || ''
  return `${limpo.slice(0, 4)}.${limpo.slice(4, 6)}.${limpo.slice(6, 8)}`
}

/**
 * Localiza um item NCM na tabela curada por código exato ou prefixo
 */
export function buscarNcmPorCodigo(codigo?: string | null): ItemNcmCurado | null {
  const limpo = normalizarCodigoNcm(codigo)
  if (!limpo) return null

  // 1. Busca exata de 8 dígitos
  const exato = TABELA_CURADA_NCM.find((item) => item.codigoLimpo === limpo)
  if (exato) return exato

  // 2. Busca por prefixo de 4 ou 6 dígitos
  if (limpo.length >= 4) {
    const prefixo4 = limpo.slice(0, 4)
    const porPrefixo = TABELA_CURADA_NCM.find((item) => item.codigoLimpo.startsWith(prefixo4))
    if (porPrefixo) return porPrefixo
  }

  return null
}

/**
 * Busca sugestões na tabela curada por termo de pesquisa (código ou descrição)
 */
export function buscarSugestoesNcm(termo: string, limite = 12): ItemNcmCurado[] {
  const t = termo.toLowerCase().trim()
  if (!t) return TABELA_CURADA_NCM.slice(0, limite)

  const tNum = normalizarCodigoNcm(termo)

  return TABELA_CURADA_NCM.filter((item) => {
    const bateCodigo =
      (tNum && item.codigoLimpo.startsWith(tNum)) ||
      item.codigo.toLowerCase().includes(t) ||
      item.codigoLimpo.includes(t)
    const bateDesc = item.descricao.toLowerCase().includes(t)
    const bateCat = item.categoriaRotulo.toLowerCase().includes(t)
    return bateCodigo || bateDesc || bateCat
  }).slice(0, limite)
}
