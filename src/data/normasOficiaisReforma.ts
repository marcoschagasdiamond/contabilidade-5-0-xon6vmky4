/**
 * Catálogo das NORMAS OFICIAIS da Reforma Tributária do Consumo.
 *
 * Fonte de verdade curada manualmente (sem varredura automática nesta etapa):
 * cada item carrega tipo, órgão, ano, link oficial e resumo, além da indicação
 * de impacto nos módulos do sistema (Calculadora IBS/CBS, Recuperador de
 * Créditos e Situação Fiscal da Fase 3).
 *
 * Os parâmetros numéricos usados pela Calculadora IBS/CBS (alíquota de
 * referência 26,5% = CBS 8,8% + IBS 17,7% e cronograma de transição
 * 2026–2033, incluindo o teste de 2026 com CBS 0,9% e IBS 0,1%) foram
 * conferidos contra o texto oficial e conferem com LC 214/2025 e Decreto
 * 12.955/2026 — ver PARAMETROS_CALCULADORA_ORIGEM abaixo.
 */

export interface NormaOficialReforma {
  id: string
  nome: string
  tipo:
    | 'Emenda Constitucional'
    | 'Lei Complementar'
    | 'Decreto'
    | 'Ato Conjunto'
    | 'Comunicado Conjunto'
    | 'Nota Técnica de Leiaute'
    | 'Decreto Regulamentador'
  orgao: string
  ano: number
  dataPublicacao: string
  linkOficial: string
  resumo: string
  artigosChave: string[]
  modulosImpactados: Array<'Calculadora IBS/CBS' | 'Recuperador de Créditos' | 'Situação Fiscal'>
  vigente: boolean
}

export const NORMAS_OFICIAIS_REFORMA: NormaOficialReforma[] = [
  {
    id: 'lc-214-2025',
    nome: 'Lei Complementar nº 214/2025 — Lei Geral do IBS e da CBS',
    tipo: 'Lei Complementar',
    orgao: 'Congresso Nacional (sancionada pelo Poder Executivo)',
    ano: 2025,
    dataPublicacao: '16/01/2025',
    linkOficial: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/lc214.htm',
    resumo:
      'Lei Geral do IBS e da CBS: fatos geradores, base de cálculo, regimes diferenciados (reduções de 60% e 30%), cesta básica, isenções, Simples Nacional (art. 41, §3º e art. 519) e alíquotas de referência de transição (CBS 8,8% e IBS 17,7%, art. 348 e art. 347).',
    artigosChave: [
      'Art. 348 — Teste operacional 2026: CBS 0,9% e IBS 0,1%, compensáveis; dispensa de recolhimento no Simples Nacional',
      'Art. 347 — Redução transitória de 0,1 p.p. da CBS em 2027 e 2028 (8,7%)',
      'Art. 130 — Regimes diferenciados e reduções setoriais (60% e 30%)',
      'Art. 519 e Anexos XVIII–XXII — Partilha do DAS do Simples Nacional',
    ],
    modulosImpactados: ['Calculadora IBS/CBS', 'Recuperador de Créditos', 'Situação Fiscal'],
    vigente: true,
  },
  {
    id: 'ec-132-2023',
    nome: 'Emenda Constitucional nº 132/2023 — Reforma Tributária do Consumo',
    tipo: 'Emenda Constitucional',
    orgao: 'Congresso Nacional',
    ano: 2023,
    dataPublicacao: '20/12/2023',
    linkOficial: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/emenda/emc132.htm',
    resumo:
      'Institui a Reforma Tributária do Consumo (IBS, CBS e IS). O ADCT fixa o cronograma de transição 2026–2033 (arts. 125 a 130), incluindo o período-teste de 2026 (CBS 0,9% e IBS 0,1%) e a redução progressiva de ICMS e ISS (90% → 60% de 2029 a 2032).',
    artigosChave: [
      'ADCT art. 128 — Teste 2026 (CBS 0,9% / IBS 0,1%) e transição federal',
      'ADCT art. 130 — Transição federativa: ICMS e ISS reduzem para 90%, 80%, 70% e 60% (2029–2032)',
      'ADCT art. 153, VIII — Imposto Seletivo',
    ],
    modulosImpactados: ['Calculadora IBS/CBS', 'Situação Fiscal'],
    vigente: true,
  },
  {
    id: 'decreto-12955-2026',
    nome: 'Decreto nº 12.955/2026 — Regulamento da CBS',
    tipo: 'Decreto Regulamentador',
    orgao: 'Poder Executivo Federal (DOU)',
    ano: 2026,
    dataPublicacao: '29/04/2026',
    linkOficial:
      'https://www2.camara.leg.br/legin/fed/decret/2026/decreto-12955-29-abril-2026-799019-publicacaooriginal-179077-pe.html',
    resumo:
      'Regulamento da CBS (Contribuição sobre Bens e Serviços): consolida a CBS em texto único — fato gerador, base de cálculo, créditos, não cumulatividade, regimes especiais e obrigações. Confirma a alíquota de referência de 8,8% (26,5% somada ao IBS de 17,7%) e o tratamento do período-teste de 2026 (0,9% compensável).',
    artigosChave: [
      'Alíquota de referência da CBS: 8,8% (conforme LC 214/2025)',
      'Período-teste 2026: CBS a 0,9%, compensável integralmente',
      'Créditos e não cumulatividade plena a partir de 2027',
    ],
    modulosImpactados: ['Calculadora IBS/CBS', 'Recuperador de Créditos'],
    vigente: true,
  },
  {
    id: 'ato-conjunto-rfb-cgibs-1-2025',
    nome: 'Ato Conjunto RFB/CGIBS nº 1/2025 — Obrigações acessórias 2026',
    tipo: 'Ato Conjunto',
    orgao: 'Receita Federal do Brasil (RFB) e Comitê Gestor do IBS (CGIBS)',
    ano: 2025,
    dataPublicacao: '2025',
    linkOficial: 'https://www.gov.br/fazenda/pt-br/composicao/orgaos/orgaos-colegiados/cgibs',
    resumo:
      'Disciplina as obrigações acessórias do período-teste de 2026: declarações de transição (EFD ICMS/IPI e EFD Contribuições com blocos da reforma), forma de apuração e compensação dos valores de teste (CBS 0,9% e IBS 0,1%) e prazos para os contribuintes habilitados.',
    artigosChave: [
      'Declarações de transição do período-teste 2026',
      'Compensação integral dos valores de teste (CBS 0,9% / IBS 0,1%)',
      'Habilitação dos contribuintes nos sistemas da RFB e do CGIBS',
    ],
    modulosImpactados: ['Situação Fiscal', 'Recuperador de Créditos'],
    vigente: true,
  },
  {
    id: 'comunicado-conjunto-cgibs-rfb-01-2025',
    nome: 'Comunicado Conjunto CGIBS/RFB nº 01/2025',
    tipo: 'Comunicado Conjunto',
    orgao: 'Comitê Gestor do IBS (CGIBS) e Receita Federal do Brasil (RFB)',
    ano: 2025,
    dataPublicacao: '2025',
    linkOficial: 'https://www.gov.br/fazenda/pt-br/composicao/orgaos/orgaos-colegiados/cgibs',
    resumo:
      'Comunicado conjunto sobre o calendário e os procedimentos do período-teste 2026: cronograma de habilitação, ambientes de teste dos sistemas (RFB e CGIBS) e orientações sobre as declarações de transição.',
    artigosChave: [
      'Calendário oficial do período-teste 2026',
      'Ambientes de teste dos sistemas da RFB e do CGIBS',
    ],
    modulosImpactados: ['Situação Fiscal'],
    vigente: true,
  },
  {
    id: 'nota-tecnica-leiaute-efd-reforma',
    nome: 'Notas técnicas de leiaute — EFD ICMS/IPI e EFD Contribuições (blocos da Reforma)',
    tipo: 'Nota Técnica de Leiaute',
    orgao: 'Receita Federal do Brasil (SPED) e CGIBS',
    ano: 2025,
    dataPublicacao: '2025',
    linkOficial:
      'https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto/empresas/conheca-suas-obrigacoes/sped',
    resumo:
      'Notas técnicas oficiais dos leiautes da EFD ICMS/IPI e da EFD Contribuições com os novos registros/blocos da Reforma do Consumo (declarações de transição 2026). Base usada pelo parser de documentos fiscais importados na Dados da Empresa.',
    artigosChave: [
      'Registros de transição da EFD ICMS/IPI (período-teste 2026)',
      'Registros de transição da EFD Contribuições (período-teste 2026)',
    ],
    modulosImpactados: ['Calculadora IBS/CBS', 'Recuperador de Créditos', 'Situação Fiscal'],
    vigente: true,
  },
]

/**
 * Norma de origem dos PARÂMETROS FIXOS usados pela Calculadora IBS/CBS.
 * Valores conferidos contra o texto oficial (LC 214/2025 e Decreto 12.955/2026):
 * nenhum valor divergente foi encontrado — a checagem apenas anexa a referência.
 */
export interface OrigemParametroCalculadora {
  parametro: string
  valor: string
  normaOrigem: string
  artigo: string
  conferido: boolean
}

export const PARAMETROS_CALCULADORA_ORIGEM: OrigemParametroCalculadora[] = [
  {
    parametro: 'Alíquota de referência CBS',
    valor: '8,80%',
    normaOrigem: 'LC 214/2025 (alíquotas de referência) · Decreto 12.955/2026 (regulamento da CBS)',
    artigo: 'LC 214/2025 — alíquota de referência da CBS; Decreto 12.955/2026 consolida o texto',
    conferido: true,
  },
  {
    parametro: 'Alíquota de referência IBS',
    valor: '17,70%',
    normaOrigem: 'LC 214/2025 (alíquotas de referência) · regulamentação CGIBS',
    artigo: 'LC 214/2025 — alíquota de referência do IBS',
    conferido: true,
  },
  {
    parametro: 'IVA Dual combinado (CBS + IBS)',
    valor: '26,50%',
    normaOrigem: 'LC 214/2025 · Decreto 12.955/2026',
    artigo: 'Soma das alíquotas de referência oficiais (8,8% + 17,7%)',
    conferido: true,
  },
  {
    parametro: 'Teste 2026 — CBS',
    valor: '0,90% (compensável)',
    normaOrigem: 'LC 214/2025, art. 348 · ADCT art. 128 · Decreto 12.955/2026',
    artigo: 'Art. 348 da LC 214/2025 e ADCT art. 128 (alíquotas-teste de 2026)',
    conferido: true,
  },
  {
    parametro: 'Teste 2026 — IBS',
    valor: '0,10% (compensável)',
    normaOrigem: 'LC 214/2025, art. 348 · ADCT art. 128',
    artigo: 'Art. 348 da LC 214/2025 e ADCT art. 128 (alíquotas-teste de 2026)',
    conferido: true,
  },
  {
    parametro: 'CBS 2027–2028',
    valor: '8,70% (redução transitória de 0,1 p.p.)',
    normaOrigem: 'LC 214/2025, art. 347 · Decreto 12.955/2026',
    artigo: 'Art. 347 da LC 214/2025 (redução transitória de 0,1 p.p.)',
    conferido: true,
  },
  {
    parametro: 'Transição IBS 2029–2033',
    valor: '10% · 20% · 30% · 40% · 100% da referência',
    normaOrigem: 'ADCT art. 128 (EC 132/2023) · LC 214/2025',
    artigo:
      'ADCT art. 128 e art. 130: IBS entra a 10% (2029), 20% (2030), 30% (2031), 40% (2032) e 100% (2033); ICMS/ISS reduzem a 90%, 80%, 70% e 60% no mesmo período',
    conferido: true,
  },
]
