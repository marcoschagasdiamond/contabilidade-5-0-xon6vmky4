/**
 * Dados estruturados dos módulos da Reforma Tributária
 * Baseados na EC 132/2023, LC 214/2025 e materiais técnicos Diamond Group.
 */

export interface ModuloReforma {
  id: string
  numero: number
  slug: string
  titulo: string
  subtitulo: string
  descricao: string
  icone: string
  tag: string
  destaque: string
}

export const MODULOS_REFORMA: ModuloReforma[] = [
  {
    id: 'visao-geral',
    numero: 1,
    slug: 'visao-geral',
    titulo: 'Visão Geral da Reforma',
    subtitulo: 'Entenda os pilares do novo modelo sem complicação',
    descricao:
      'O que é a reforma, por que existe, os 3 tributos novos (IBS de estados e municípios, CBS federal, Imposto Seletivo) e o cronograma de 2026 a 2033.',
    icone: 'Globe',
    tag: 'Fundamentos',
    destaque: 'IBS + CBS + Imposto Seletivo',
  },
  {
    id: 'calendario',
    numero: 2,
    slug: 'calendario',
    titulo: 'Calendário de Transição',
    subtitulo: 'Linha do tempo interativa ano a ano até 2033',
    descricao:
      'Datas-chave detalhadas: 2026 com teste simbólico, 2027 com CBS cheia e Imposto Seletivo, 2029 a 2032 com redução de ICMS/ISS e 2033 modelo pleno.',
    icone: 'Calendar',
    tag: 'Cronograma',
    destaque: '2026 a 2033 detalhado',
  },
  {
    id: 'dicionario',
    numero: 3,
    slug: 'dicionario',
    titulo: 'Dicionário Rápido',
    subtitulo: 'Siglas explicadas com truques mnemônicos',
    descricao:
      'IBS (imposto de baixo), CBS (imposto de cima), IS (imposto do pecado), Split Payment (imposto separado na hora) e DeRE (declaração de regimes específicos).',
    icone: 'BookOpen',
    tag: 'Mnemônicos',
    destaque: 'Gatilhos mentais práticos',
  },
  {
    id: 'impacto-por-setor',
    numero: 4,
    slug: 'impacto-por-setor',
    titulo: 'Mapa de Impacto por Setor',
    subtitulo: 'Análise minuciosa de 10 segmentos de negócio',
    descricao:
      'Comércio, Serviços, Indústria, Saúde, Educação, Agro, Transporte, Tecnologia, Construção, Bares e Restaurantes: alíquotas, créditos, pontos de atenção e FAQ pronta.',
    icone: 'LayoutGrid',
    tag: '10 Setores',
    destaque: 'Perguntas e respostas de clientes',
  },
  {
    id: 'excecoes',
    numero: 5,
    slug: 'excecoes',
    titulo: 'Mapa de Exceções e Alíquotas',
    subtitulo: 'O que foge da regra geral do IVA de 26,5%',
    descricao:
      'Cesta básica nacional com alíquota zero, saúde e educação com 60% de redução, medicamentos, agropecuária, regras do Simples e opção pelo Simples Híbrido.',
    icone: 'ShieldAlert',
    tag: 'Regimes Especiais',
    destaque: 'Redução de 60% e alíquota zero',
  },
  {
    id: 'painel-carteira',
    numero: 6,
    slug: 'painel-carteira',
    titulo: 'Painel de Controle da Carteira',
    subtitulo: 'Gestão da transição dos clientes em 5 etapas',
    descricao:
      'Etapas: Diagnosticado, Sistema ajustado, Equipe treinada, Cliente comunicado, Operando. Farol de prioridade de risco e rotina mensal estruturada por semanas.',
    icone: 'Kanban',
    tag: 'Gestão Interna',
    destaque: '5 etapas de esteira contábil',
  },
  {
    id: 'split-payment',
    numero: 7,
    slug: 'split-payment',
    titulo: 'Split Payment',
    subtitulo: 'A nova retenção automática no ato do pagamento',
    descricao:
      'Entenda como o imposto passa a ser retido na liquidação bancária, os impactos no capital de giro e fluxo de caixa, quem mais sente e como se preparar.',
    icone: 'Split',
    tag: 'Fluxo de Caixa',
    destaque: 'Retenção na liquidação bancária',
  },
  {
    id: 'reforma-na-pratica',
    numero: 8,
    slug: 'reforma-na-pratica',
    titulo: 'Reforma na Prática — Operação e Cálculo',
    subtitulo: 'A ordem de 6 etapas, base de cálculo, exemplos práticos e créditos',
    descricao:
      'Guia operacional com o caminho do cálculo em 6 etapas, composição da base, exemplos no comércio, serviços e indústria, apuração de créditos, NF-e, DeRE e mapa de decisão.',
    icone: 'Calculator',
    tag: 'Operação & Cálculo',
    destaque: '6 etapas + exemplos por setor',
  },
  {
    id: 'glossario',
    numero: 9,
    slug: 'glossario',
    titulo: 'Glossário e Fontes',
    subtitulo: 'Quadro comparativo de confusões e legislação oficial',
    descricao:
      'Diferença sem complicação: IBS vs CBS, IS vs ISS, IBS vs IPI, CBS vs PIS/COFINS. Links diretos para texto oficial da LC 214/2025, EC 132/2023 e portal do CGIBS.',
    icone: 'FileText',
    tag: 'Legislação & FAQ',
    destaque: 'LC 214/2025 e quadro comparativo',
  },
]

// ==========================================
// 1. DADOS DE VISÃO GERAL
// ==========================================
export const VISAO_GERAL_DATA = {
  oQueE:
    'A Reforma Tributária (Emenda Constitucional nº 132/2023 regulamentada pela Lei Complementar nº 214/2025) unifica 5 impostos antigos sobre o consumo em um modelo moderno de IVA Dual (Imposto sobre Valor Agregado em duas camadas federativas), idêntico ao padrão adotado nos países da OCDE.',
  porQueExiste: [
    'Fim da guerra fiscal interestadual e municipal, transferindo a arrecadação para o destino (onde o bem ou serviço é consumido).',
    'Não-cumulatividade plena: crédito financeiro imediato para cada centavo pago de insumo na cadeia produtiva.',
    'Eliminação da burocracia: substitui centenas de legislações estaduais e mais de 5.500 códigos tributários municipais.',
    'Transparência na nota fiscal com a técnica do split payment (recolhimento automático e instantâneo na liquidação bancária).',
  ],
  tributosNovos: [
    {
      sigla: 'IBS',
      nome: 'Imposto sobre Bens e Serviços',
      competencia: 'Estados, Distrito Federal e Municípios',
      gestao: 'Comitê Gestor do IBS (CGIBS)',
      substitui: 'ICMS (estadual) e ISS (municipal)',
      aliquotaPadrao: '~17,7% (estimada em conjunto com o Senado e CGIBS)',
      papel:
        'Tributa o consumo local e interestadual no destino. Unifica o tratamento de bens tangíveis, mercadorias físicas e serviços digitais ou presenciais.',
    },
    {
      sigla: 'CBS',
      nome: 'Contribuição sobre Bens e Serviços',
      competencia: 'União Federal',
      gestao: 'Receita Federal do Brasil (RFB)',
      substitui: 'PIS e COFINS (e absorve a incidência comum do IPI)',
      aliquotaPadrao: '~8,8% (referência federal de 8,8% com desconto de 0,1 p.p. em 2027-2028)',
      papel:
        'Tributa o consumo sob competência da União. Base de cálculo uniforme com o IBS, apuração centralizada e crédito financeiro sem glosas subjetivas.',
    },
    {
      sigla: 'IS',
      nome: 'Imposto Seletivo ("Imposto do Pecado")',
      competencia: 'União Federal',
      gestao: 'Receita Federal do Brasil',
      substitui: 'Parcela de extrafiscalidade do antigo IPI',
      aliquotaPadrao: 'Variável por produto (alíquotas ad valorem ou específicas)',
      papel:
        'Incide uma única vez na produção ou extração de produtos prejudiciais à saúde humana ou ao meio ambiente (cigarros, bebidas alcoólicas, bebidas açucaradas, veículos a combustão, combustíveis fósseis e minérios). Não gera crédito.',
    },
  ],
  somaIVAPadrao: '26,5%',
}

// ==========================================
// 2. CALENDÁRIO DE TRANSIÇÃO
// ==========================================
export const CALENDARIO_DETALHADO = [
  {
    ano: 2026,
    titulo: 'Ano de Teste Operacional (Ensaio Geral)',
    status: 'Em preparação',
    badge: 'Fase de Teste',
    cor: 'amber',
    cbsAliquota: '0,9% (teste sem recolhimento efetivo se cumprir obrigações acessórias)',
    ibsAliquota: '0,1% (teste simbólico)',
    tributosAntigos: 'PIS, COFINS, IPI, ICMS e ISS continuam 100% integrais',
    simplesNacional: 'Permanece 100% inalterado (art. 348, III, "c" da LC 214/2025)',
    detalhes:
      'Serve para as empresas homologarem seus sistemas emissores de NF-e e NFC-e com as tags IBS e CBS, testando a conexão com a Receita Federal e o Comitê Gestor. O imposto apurado é compensado ou dispensado.',
    marcos: [
      'Início do envio de notas fiscais com campos IBS e CBS',
      'Testes dos webservices do Comitê Gestor do IBS',
      'Treinamento das equipes fiscais e adequação de ERPs',
      'Dispensa de recolhimento para quem transmite os dados tempestivamente',
    ],
  },
  {
    ano: 2027,
    titulo: 'Entrada da CBS Plena e Imposto Seletivo',
    status: 'Impacto federal imediato',
    badge: 'CBS em vigor',
    cor: 'blue',
    cbsAliquota: '8,7% (alíquota cheia com redução transitória de 0,1 p.p.)',
    ibsAliquota: '0,05% estadual + 0,05% municipal (compensável com ICMS/ISS)',
    tributosAntigos: 'PIS e COFINS EXTINTOS! IPI reduzido a zero (exceto Zona Franca de Manaus)',
    simplesNacional: 'Entra a cota de CBS dentro do DAS (15,33% da guia comercial)',
    detalhes:
      'Fim oficial do PIS e COFINS. Entra a CBS recolhida pela Receita Federal com sistema de crédito financeiro amplo. Entra em vigor o Imposto Seletivo para itens prejudiciais à saúde e ao meio ambiente.',
    marcos: [
      'Extinção formal de PIS e COFINS',
      'IPI zerado em todo o país (mantido apenas onde protege ZFM)',
      'Início da cobrança do Imposto Seletivo',
      'Primeiras operações com o mecanismo de Split Payment nos bancos',
    ],
  },
  {
    ano: 2028,
    titulo: 'Consolidação Federal e Homologação Estadual',
    status: 'Preparação para a virada local',
    badge: 'Consolidação',
    cor: 'blue',
    cbsAliquota: '8,7%',
    ibsAliquota: '0,1% compensável com ICMS/ISS',
    tributosAntigos: 'ICMS e ISS ainda vigoram com alíquotas cheias',
    simplesNacional: 'Manutenção da cota de CBS dentro do DAS',
    detalhes:
      'Ano chave para revisão do cadastro fiscal dos estados e municípios. Ajuste das alíquotas de referência pelo Senado Federal.',
    marcos: [
      'Divulgação das alíquotas definitivas de referência do IBS para estados e municípios',
      'Homologação dos sistemas de partilha automática do CGIBS',
      'Primeiros testes de transição federativa por destino',
    ],
  },
  {
    ano: 2029,
    titulo: 'Início da Substituição de ICMS e ISS (10% de IBS)',
    status: 'Início da transição federativa',
    badge: 'Início Transição IBS',
    cor: 'emerald',
    cbsAliquota: '8,8% (referência plena)',
    ibsAliquota: '10% da alíquota de referência (~1,77%)',
    tributosAntigos: 'ICMS e ISS caem para 90% das alíquotas atuais',
    simplesNacional: 'IBS passa a compor 3,40% do DAS',
    detalhes:
      'Início da regra do ADCT art. 128: os tributos locais antigos começam a encolher e o IBS entra gradativamente preenchendo o espaço.',
    marcos: [
      'Redução de 10% nas guias estaduais de ICMS e municipais de ISS',
      'Início da cobrança efetiva de 10% do IBS com crédito transferível',
      'Abertura de prazo para optar pelo Simples Híbrido (IBS/CBS por fora)',
    ],
  },
  {
    ano: 2030,
    titulo: 'Transição Federativa — Fase 2 (20% de IBS)',
    status: 'Transição contínua',
    badge: '20% IBS',
    cor: 'emerald',
    cbsAliquota: '8,8%',
    ibsAliquota: '20% da alíquota de referência (~3,54%)',
    tributosAntigos: 'ICMS e ISS caem para 80%',
    simplesNacional: 'IBS compõe 6,80% do DAS',
    detalhes:
      'O peso dos tributos sobre o consumo migra de forma visível para a não-cumulatividade plena.',
    marcos: ['Avanço na arrecadação centralizada no destino', 'Menor espaço para guerra fiscal'],
  },
  {
    ano: 2031,
    titulo: 'Transição Federativa — Fase 3 (30% de IBS)',
    status: 'Transição avançada',
    badge: '30% IBS',
    cor: 'emerald',
    cbsAliquota: '8,8%',
    ibsAliquota: '30% da alíquota de referência (~5,31%)',
    tributosAntigos: 'ICMS e ISS caem para 70%',
    simplesNacional: 'IBS compõe 10,20% do DAS',
    detalhes: 'Mais de 50% dos tributos sobre o consumo já operam sob a lógica do IVA Dual.',
    marcos: ['Simplificação contábil crescente', 'Declarações antigas com menor relevância'],
  },
  {
    ano: 2032,
    titulo: 'Último Ano de Sobrevivência de ICMS e ISS (40% de IBS)',
    status: 'Fase final dos impostos antigos',
    badge: '40% IBS',
    cor: 'emerald',
    cbsAliquota: '8,8%',
    ibsAliquota: '40% da alíquota de referência (~7,08%)',
    tributosAntigos: 'ICMS e ISS em apenas 60% do valor histórico',
    simplesNacional: 'IBS compõe 13,60% do DAS',
    detalhes:
      'Último ano fiscal em que livros de registro de ICMS e declarações municipais de ISS serão gerados.',
    marcos: [
      'Preparação para desativação de obrigações acessórias estaduais e municipais legadas',
      'Última virada contábil do modelo antigo',
    ],
  },
  {
    ano: 2033,
    titulo: 'Modelo Pleno e Definitivo do IVA Dual Brasileiro',
    status: 'Sistema 100% unificado',
    badge: 'IVA Pleno',
    cor: 'amber',
    cbsAliquota: '8,8% (referência federal)',
    ibsAliquota: '17,7% (referência estados + municípios)',
    tributosAntigos: 'ICMS, ISS, PIS, COFINS e IPI 100% EXTINTOS!',
    simplesNacional: 'Partilha definitiva: CBS ~15,33% e IBS ~34,00% da guia DAS',
    detalhes:
      'O Brasil opera integralmente sob o IVA Dual. Tributação 100% no destino com split payment bancário automático e compensação de créditos em tempo real.',
    marcos: [
      'Extinção histórica de ICMS e ISS',
      'Split payment pleno em todos os meios de pagamento eletrônico',
      'Fim total da guerra fiscal interestadual',
    ],
  },
]

// ==========================================
// 3. DICIONÁRIO RÁPIDO (MNEMÔNICOS)
// ==========================================
export interface SiglaMnemonic {
  sigla: string
  nomeOficial: string
  truqueMemoria: string
  definicaoSimples: string
  exemploPratico: string
  icone: string
}

export const DICIONARIO_MNEMONICOS: SiglaMnemonic[] = [
  {
    sigla: 'IBS',
    nomeOficial: 'Imposto sobre Bens e Serviços',
    truqueMemoria: 'IBS é o imposto de BAIXO (estados e municípios)',
    definicaoSimples:
      'Tributo unificado estadual e municipal gerido pelo CGIBS. Substitui o ICMS e o ISS.',
    exemploPratico:
      'Quando você vende um software ou uma mercadoria para outro estado, o IBS vai para o estado/município do comprador, não de onde você está.',
    icone: 'Building2',
  },
  {
    sigla: 'CBS',
    nomeOficial: 'Contribuição sobre Bens e Serviços',
    truqueMemoria: 'CBS é a de CIMA (União Federal / Brasília)',
    definicaoSimples:
      'Tributo federal gerido pela Receita Federal. Substitui o PIS e a COFINS a partir de 2027.',
    exemploPratico:
      'Toda nota fiscal terá a cota federal da CBS calculada sobre o mesmo valor do produto, gerando crédito imediato para o comprador PJ.',
    icone: 'Landmark',
  },
  {
    sigla: 'IS',
    nomeOficial: 'Imposto Seletivo',
    truqueMemoria: 'IS é o imposto do PECADO (cigarro, bebida, poluição)',
    definicaoSimples:
      'Tributo extrafiscal monofásico criado para desestimular produtos nocivos à saúde e ao meio ambiente.',
    exemploPratico:
      'Indústria de cerveja, cigarros ou petroleiras pagam na fabricação/extração. Não dá crédito para quem compra.',
    icone: 'Flame',
  },
  {
    sigla: 'Split Payment',
    nomeOficial: 'Pagamento Fracionado Instantâneo',
    truqueMemoria: 'Split payment é o imposto SEPARADO na hora do pagamento',
    definicaoSimples:
      'Mecanismo em que a instituição bancária ou adquirente de cartão retém o tributo no ato da liquidação da venda e envia direto ao Fisco.',
    exemploPratico:
      'Vendeu R$ 1.000 via Pix ou maquininha? R$ 735 caem limpos na sua conta e R$ 265 do IBS/CBS vão direto para o cofre público.',
    icone: 'Split',
  },
  {
    sigla: 'DeRE',
    nomeOficial: 'Declaração de Regimes Específicos',
    truqueMemoria: 'DeRE é a declaração de REGIMES ESPECÍFICOS',
    definicaoSimples:
      'Obrigação acessória que comprova operações com tratamento diferenciado, combustíveis, cooperativas, serviços financeiros e compras do Simples.',
    exemploPratico:
      'Sua empresa comprou de cooperativa ou usou crédito presumido? A DeRE informa ao Fisco para liberar o crédito financeiro.',
    icone: 'FileSpreadsheet',
  },
  {
    sigla: 'Simples Híbrido',
    nomeOficial: 'Opção de Segregação de IBS/CBS por fora (art. 41 §3º LC 214)',
    truqueMemoria: 'HÍBRIDO é metade dentro (IRPJ/CSLL/INSS), metade fora (IBS/CBS cheios)',
    definicaoSimples:
      'Possibilidade de a empresa do Simples continuar recolhendo os tributos federais no DAS, mas recolher IBS e CBS no regime regular para transferir 100% de crédito aos clientes B2B.',
    exemploPratico:
      'Uma indústria no Simples que vende para grandes redes pode escolher o Simples Híbrido para não perder clientes que exigem crédito integral de 26,5%.',
    icone: 'Shuffle',
  },
  {
    sigla: 'IVA Dual',
    nomeOficial: 'Imposto sobre Valor Agregado Dual (CBS + IBS)',
    truqueMemoria: 'Um só imposto, cobrado em duas partes: uma de cima, outra de baixo',
    definicaoSimples:
      'O Brasil adotou um modelo de IVA duplo: um tributo federal (CBS) e um estadual/municipal (IBS) que compartilham as mesmas regras, fatos geradores e base de cálculo.',
    exemploPratico:
      'Em vez de emitir guias separadas de ICMS, ISS, PIS e COFINS com regras conflitantes, você calcula CBS e IBS juntos sobre o mesmo valor da venda, com alíquota única somada.',
    icone: 'Layers',
  },
  {
    sigla: 'Não Cumulativo',
    nomeOficial: 'Princípio da Não Cumulatividade Plena',
    truqueMemoria: 'Quem comprou com imposto, desconta na hora de pagar o seu',
    definicaoSimples:
      'Sistema em que cada etapa da cadeia desconta o imposto pago na etapa anterior. A empresa recolhe tributo apenas sobre o valor que realmente agregou ao produto ou serviço.',
    exemploPratico:
      'Se você compra matéria-prima por R$ 100 com R$ 26,50 de imposto e vende o produto acabado por R$ 200 (imposto de R$ 53), só recolhe a diferença de R$ 26,50 aos cofres públicos.',
    icone: 'MinusCircle',
  },
  {
    sigla: 'Crédito',
    nomeOficial: 'Crédito Tributário Financeiro Amplo',
    truqueMemoria: 'Imposto que entra vira desconto do imposto que sai',
    definicaoSimples:
      'O valor do imposto pago nas compras que a empresa abate diretamente do imposto a recolher sobre suas vendas, eliminando a tributação em cascata.',
    exemploPratico:
      'Tudo o que sua empresa compra com nota fiscal regular (energia, máquinas, insumos, softwares, aluguel PJ) gera crédito para abater automaticamente do IBS e CBS a pagar no mês.',
    icone: 'Coins',
  },
]

// ==========================================
// 4. MAPA DE IMPACTO POR 10 SETORES
// ==========================================
export interface SetorImpacto {
  setor: string
  icone: string
  oQueMuda: string
  aliquotaAplica: string
  comoFicaCredito: string
  pontoAtencao: string
  perguntaCliente: string
  respostaPronta: string
  resumoRisco: 'baixo' | 'medio' | 'alto'
}

export const MAPA_SETORES: SetorImpacto[] = [
  {
    setor: 'Comércio',
    icone: 'ShoppingBag',
    oQueMuda:
      'Fim da substituição tributária (ST) e da guerra de ICMS entre estados. O imposto passa a ser 100% devido no destino da entrega.',
    aliquotaAplica: 'Alíquota padrão (~26,5% na soma IBS + CBS)',
    comoFicaCredito:
      'Crédito financeiro pleno sobre mercadorias adquiridas, frete, energia elétrica, embalagens e sistemas de gestão.',
    pontoAtencao:
      'Preços interestaduais precisarão ser recalculados, pois alíquotas de origem deixam de importar.',
    perguntaCliente: 'Minha margem de lucro vai cair com essa alíquota de 26,5%?',
    respostaPronta:
      'Não necessariamente! Hoje você já paga PIS, COFINS, ICMS embutidos em cascata e sem crédito total. No novo modelo, você credita 100% das compras e o imposto incide por fora de forma transparente.',
    resumoRisco: 'medio',
  },
  {
    setor: 'Serviços',
    icone: 'Briefcase',
    oQueMuda:
      'Serviços gerais deixam o ISS de 2% a 5% e passam para a alíquota padrão do IVA Dual. Empresas com folha pesada sentem maior pressão.',
    aliquotaAplica: 'Padrão (~26,5%) ou Redução de 30% para profissões regulamentadas (~18,55%)',
    comoFicaCredito:
      'Folha de salários NÃO gera crédito. Crédito gerado apenas sobre despesas operacionais (aluguel de PJ, software, internet, energia).',
    pontoAtencao:
      'Se o seu cliente for PJ (B2B), ele aproveita todo o seu crédito. Se o seu cliente for PF (B2C), o valor do imposto pode encarecer o preço final.',
    perguntaCliente: 'Vou pagar 26,5% em vez dos 5% de ISS que pago hoje?',
    respostaPronta:
      'A alíquota nominal sobe, mas se seus clientes forem empresas (B2B), elas absorvem esse valor como crédito. Para quem atende pessoa física, a permanência no Simples Nacional é o escudo prioritário.',
    resumoRisco: 'alto',
  },
  {
    setor: 'Indústria',
    icone: 'Factory',
    oQueMuda:
      'Extinção do IPI (exceto produtos concorrentes da ZFM), fim do acúmulo de créditos podres de ICMS e fim do estorno de crédito em operações desoneradas.',
    aliquotaAplica: 'Alíquota padrão (~26,5%) + eventual Imposto Seletivo para itens poluentes',
    comoFicaCredito:
      'Crédito imediato sobre matéria-prima, maquinário (ativo imobilizado sem prazo de 48 meses), peças de reposição e energia.',
    pontoAtencao:
      'O setor industrial é o maior beneficiado no longo prazo, mas precisa mapear a lista do Imposto Seletivo para não ter surpresas.',
    perguntaCliente: 'Como recupero crédito de maquinário novo comprado para a fábrica?',
    respostaPronta:
      'No modelo novo, o crédito de bens de capital é imediato e integral, sem a trava das 48 parcelas do CIAP antigo. Investir em maquinário ficará muito mais barato.',
    resumoRisco: 'baixo',
  },
  {
    setor: 'Saúde',
    icone: 'HeartPulse',
    oQueMuda:
      'Serviços de saúde hospitalar, laboratorial, consultas médicas e medicamentos recebem tratamento diferenciado protegido por lei.',
    aliquotaAplica:
      'Redução de 60% da alíquota padrão (~10,6% de IVA total) e medicamentos essenciais com alíquota ZERO',
    comoFicaCredito:
      'Crédito mantido nas aquisições de insumos hospitalares e equipamentos médicos.',
    pontoAtencao:
      'Manter a correta segregação entre procedimentos puramente médicos (redução 60%) e serviços estéticos ou hotelaria hospitalar.',
    perguntaCliente: 'Clínicas médicas e consultórios continuam competitivos?',
    respostaPronta:
      'Sim! Com a redução legal de 60%, a carga de IBS e CBS cai para ~10,6%, mantendo uma das menores faixas da economia, além de medicamentos de alto custo com alíquota zero.',
    resumoRisco: 'baixo',
  },
  {
    setor: 'Educação',
    icone: 'GraduationCap',
    oQueMuda:
      'Ensino infantil, fundamental, médio, técnico e superior recebem redução constitucional obrigatória de 60% na tributação.',
    aliquotaAplica: 'Redução de 60% (~10,6% de IVA Dual)',
    comoFicaCredito:
      'Crédito sobre materiais didáticos, plataformas digitais, energia e reformas prediais.',
    pontoAtencao:
      'Cursos livres e treinamentos corporativos sem chancela de órgãos de educação podem não se enquadrar na redução de 60% e cair na alíquota cheia.',
    perguntaCliente:
      'Escolas e faculdades privadas vão ter que repassar aumento de imposto na mensalidade?',
    respostaPronta:
      'Com o desconto legal de 60% garantido pelo art. 130 da LC 214/2025, o impacto é equilibrado pela tomada de créditos em tecnologia e infraestrutura, mantendo as mensalidades estáveis.',
    resumoRisco: 'baixo',
  },
  {
    setor: 'Agro',
    icone: 'Wheat',
    oQueMuda:
      'Cesta básica nacional de alimentos terá alíquota ZERO total. Produtor rural pessoa física até R$ 3,6M/ano não é contribuinte obrigatório e pode transferir crédito presumido.',
    aliquotaAplica:
      'Redução de 60% para insumos agropecuários e alíquota ZERO para alimentos da cesta básica nacional',
    comoFicaCredito: 'Crédito amplo de fertilizantes, sementes, maquinário agrícola e combustível.',
    pontoAtencao:
      'Atenção ao cadastro do produtor rural e emissão de notas com indicação de crédito presumido para cooperativas e indústrias alimentícias.',
    perguntaCliente: 'O produtor rural familiar terá que emitir guia de IBS e CBS?',
    respostaPronta:
      'Não! Produtores com faturamento até R$ 3,6 milhões anuais podem optar por não recolher IBS/CBS e continuam transferindo crédito presumido aos adquirentes.',
    resumoRisco: 'baixo',
  },
  {
    setor: 'Transporte',
    icone: 'Truck',
    oQueMuda:
      'Transporte coletivo de passageiros (urbano e interurbano) tem redução de 60%. O transporte de cargas se beneficia de crédito integral sobre combustíveis, pneus e pedágio.',
    aliquotaAplica:
      'Transporte de passageiros: redução de 60% (~10,6%). Transporte de cargas: alíquota padrão (~26,5%) com crédito amplo',
    comoFicaCredito:
      'Crédito imediato sobre frotas, diesel, manutenção, pneus e infraestrutura logística.',
    pontoAtencao:
      'Empresas tomadoras de frete (indústrias e distribuidoras) só fecharão contratos com transportadoras que gerem crédito tributário.',
    perguntaCliente: 'Transportadoras pequenas no Simples correm risco de perder contratos?',
    respostaPronta:
      'Sim, se o embarcador exigir crédito integral de 26,5%. Nesses casos, a transportadora pode optar pelo Simples Híbrido, recolhendo IBS/CBS no regime regular e mantendo os demais no Simples.',
    resumoRisco: 'medio',
  },
  {
    setor: 'Tecnologia',
    icone: 'Cpu',
    oQueMuda:
      'Fim da discussão histórica entre "licenciamento de software = ISS" e "venda de mercadoria = ICMS". Todo SaaS, software e serviço digital segue a regra única do IBS/CBS.',
    aliquotaAplica:
      'Alíquota padrão (~26,5%) ou redução de 30% (~18,55%) para atividades técnicas/intelectuais',
    comoFicaCredito:
      'Crédito de servidores de nuvem (AWS, Azure, GCP), licenças terceirizadas e hardware.',
    pontoAtencao:
      'Desenvolvedores e agências que atendem clientes B2B transferirão crédito direto. Para B2C (apps de usuário final), haverá necessidade de precificação atenta.',
    perguntaCliente: 'Importação de nuvem no exterior vai pagar IBS e CBS?',
    respostaPronta:
      'Sim, as plataformas estrangeiras recolherão IBS e CBS na importação pelo split payment, garantindo crédito idêntico às contratações nacionais.',
    resumoRisco: 'medio',
  },
  {
    setor: 'Construção',
    icone: 'HardHat',
    oQueMuda:
      'Regime específico de tributação imobiliária com redução expressiva da base de cálculo e deduções de valor do terreno e materiais.',
    aliquotaAplica:
      'Redução de 20% na alíquota padrão para incorporação imobiliária e deduções de terreno',
    comoFicaCredito:
      'Crédito total de aço, cimento, pré-moldados, maquinário e subempreiteiras cadastradas.',
    pontoAtencao:
      'Contratos de longo prazo assinados antes da reforma precisam de cláusulas de reequilíbrio econômico-financeiro para absorver a virada da CBS/IBS.',
    perguntaCliente: 'Como ficam as obras em andamento com RET (Regime Especial de Tributação)?',
    respostaPronta:
      'O RET de 4% em patrimônio de afetação segue protegido por regras de transição. As novas incorporações migrarão para o regime específico com dedução de terreno.',
    resumoRisco: 'medio',
  },
  {
    setor: 'Bares e Restaurantes',
    icone: 'Utensils',
    oQueMuda:
      'Regime específico diferenciado previsto no art. 130 da LC 214/2025. Alerta para a incidência do Imposto Seletivo sobre refrigerantes e bebidas alcoólicas na compra.',
    aliquotaAplica: 'Regime específico com apuração simplificada de créditos e alíquota ajustada',
    comoFicaCredito:
      'Crédito sobre alimentos, carnes, hortifrúti e insumos da cozinha, atenuando o imposto final.',
    pontoAtencao:
      'Revisão do cardápio: itens que contêm Imposto Seletivo na compra precisarão ter sua precificação de venda refinada.',
    perguntaCliente: 'Vou pagar Imposto Seletivo na caipirinha e na cerveja do meu bar?',
    respostaPronta:
      'O Seletivo incide na fabricação (na Ambev, vinícola ou destilaria), não na venda do garçom. Mas como a indústria repassa no preço, nós ajustamos sua margem com os créditos dos alimentos.',
    resumoRisco: 'medio',
  },
]

// ==========================================
// 5. MAPA DE EXCEÇÕES E ALÍQUOTAS
// ==========================================
export interface ExcecaoTributaria {
  categoria: string
  reducao: string
  aliquotaEfetivaAprox: string
  baseLegal: string
  itensInclusos: string[]
  regraPratica: string
}

export const MAPA_EXCECOES: ExcecaoTributaria[] = [
  {
    categoria: 'Cesta Básica Nacional de Alimentos',
    reducao: 'Redução de 100% (Alíquota ZERO)',
    aliquotaEfetivaAprox: '0,00%',
    baseLegal: 'Art. 129 da LC 214/2025 e EC 132/2023',
    itensInclusos: [
      'Arroz, feijão, leite fluido e leite em pó',
      'Carnes bovinas, suínas, aves e peixes',
      'Farinha de trigo, mandioca, pão comum',
      'Óleos vegetais, café, frutas e hortaliças frescas',
    ],
    regraPratica:
      'Garante que os alimentos fundamentais do prato do brasileiro tenham zero tributo federal e subnacional, com manutenção do crédito ao longo da cadeia.',
  },
  {
    categoria: 'Saúde Humana e Dispositivos Médicos',
    reducao: 'Redução de 60% da alíquota padrão',
    aliquotaEfetivaAprox: '~10,60%',
    baseLegal: 'Art. 130 da LC 214/2025',
    itensInclusos: [
      'Serviços hospitalares, laboratoriais e consultas médicas',
      'Próteses, órteses e materiais cirúrgicos',
      'Medicamentos sob prescrição médica',
      'Dispositivos de acessibilidade para pessoas com deficiência',
    ],
    regraPratica:
      'Mantém a saúde privada acessível e garante que hospitais mantenham aproveitamento de créditos na compra de equipamentos.',
  },
  {
    categoria: 'Educação Básica, Superior e Técnica',
    reducao: 'Redução de 60% da alíquota padrão',
    aliquotaEfetivaAprox: '~10,60%',
    baseLegal: 'Art. 130 da LC 214/2025',
    itensInclusos: [
      'Educação infantil, ensino fundamental e médio',
      'Ensino superior (graduação e pós-graduação)',
      'Educação profissional técnica e tecnológica',
      'Educação especial de atendimento inclusivo',
    ],
    regraPratica:
      'Evita sobrecarga tributária em mensalidades escolares e incentiva investimentos em infraestrutura e sistemas pedagógicos digitais.',
  },
  {
    categoria: 'Produção Agropecuária, Pesqueira e Florestal',
    reducao: 'Redução de 60% da alíquota padrão',
    aliquotaEfetivaAprox: '~10,60%',
    baseLegal: 'Art. 130 da LC 214/2025',
    itensInclusos: [
      'Insumos agropecuários (fertilizantes, defensivos autorizados, sementes)',
      'Rações e medicamentos veterinários',
      'Serviços de trato cultural e colheita',
      'Produtos agropecuários in natura fora da cesta básica',
    ],
    regraPratica:
      'Preserva a competitividade do agronegócio brasileiro, além de permitir ao produtor não contribuinte repassar crédito presumido.',
  },
  {
    categoria: 'Medicamentos Essenciais e Vacinas',
    reducao: 'Redução de 100% (Alíquota ZERO)',
    aliquotaEfetivaAprox: '0,00%',
    baseLegal: 'Art. 130, §1º da LC 214/2025',
    itensInclusos: [
      'Medicamentos para tratamento de câncer (oncológicos)',
      'Tratamento de doenças raras e crônicas graves',
      'Vacinas e imunobiológicos do PNI',
      'Medicamentos adquiridos pelo SUS e órgãos públicos',
    ],
    regraPratica:
      'Imunidade total e isenção com crédito mantido para desonerar a cura e o acesso a tratamentos de alto custo.',
  },
  {
    categoria: 'Simples Nacional Tradicional',
    reducao: 'Regime Único Próprio (Tabela do DAS)',
    aliquotaEfetivaAprox: 'Alíquota progressiva do DAS',
    baseLegal: 'LC 123/2006 c/ redação da LC 214/2025 e LC 227/2026',
    itensInclusos: [
      'Empresas com faturamento anual de até R$ 4,8 milhões',
      'Sublimite estadual de R$ 3,6 milhões para recolhimento unificado',
      'Transferência de crédito para compradores PJ limitada à cota do DAS',
    ],
    regraPratica:
      'O regime simplificado está mantido na Constituição. A empresa continua pagando tudo em guia única, mas transfere créditos proporcionais.',
  },
  {
    categoria: 'Simples Híbrido (Opção Semestral)',
    reducao: 'IBS e CBS no regime regular + demais no Simples',
    aliquotaEfetivaAprox: '26,5% de IBS/CBS + IRPJ/CSLL/INSS no DAS',
    baseLegal: 'Art. 41, §3º da LC 214/2025',
    itensInclusos: [
      'Opção semestral, com janelas em março e setembro para valer no semestre seguinte (janela de 2026 até 30/10, valendo para o 1º semestre de 2027)',
      'Renúncia possível na janela posterior (a escolha não é irretratável para o ano inteiro)',
      'Recolhe IBS e CBS por fora pela regra geral de débito e crédito',
      'Transfere 100% de crédito tributário para clientes de grande porte',
      'Aproveita crédito integral de todos os insumos adquiridos',
    ],
    regraPratica:
      'Ideal para quem é do Simples mas vende para médias e grandes indústrias que exigem crédito integral na nota.',
  },
]

// ==========================================
// 6. COMPARADOR DE REGIME (4 PERGUNTAS & 3 CENÁRIOS)
// ==========================================
export interface PerguntaComparador {
  id: number
  pergunta: string
  explicacao: string
  opcoes: {
    texto: string
    valor: string
    peso: { simples: number; hibrido: number; normal: number }
  }[]
}

export const PERGUNTAS_COMPARADOR: PerguntaComparador[] = [
  {
    id: 1,
    pergunta: 'Para quem a sua empresa vende a maior parte do faturamento?',
    explicacao:
      'O perfil do comprador define se o crédito do tributo é decisivo na negociação comercial.',
    opcoes: [
      {
        texto: 'Consumidor Final (Pessoa Física / B2C)',
        valor: 'b2c',
        peso: { simples: 3, hibrido: 0, normal: 0 },
      },
      {
        texto: 'Outras Empresas no Simples ou MEI',
        valor: 'b2b-pequeno',
        peso: { simples: 2, hibrido: 1, normal: 0 },
      },
      {
        texto: 'Médias e Grandes Empresas no Lucro Real / Presumido (B2B)',
        valor: 'b2b-grande',
        peso: { simples: 0, hibrido: 3, normal: 2 },
      },
      {
        texto: 'Governo / Órgãos Públicos / Exportação',
        valor: 'governo-exportacao',
        peso: { simples: 1, hibrido: 2, normal: 2 },
      },
    ],
  },
  {
    id: 2,
    pergunta: 'O seu comprador direto aproveita os créditos tributários da sua nota?',
    explicacao:
      'Se o comprador estiver no Lucro Real ou Regime Regular da Reforma, o crédito financeiro de 26,5% abate a guia dele.',
    opcoes: [
      {
        texto: 'Não, meu comprador não aproveita ou não liga para crédito',
        valor: 'nao-aproveita',
        peso: { simples: 3, hibrido: 0, normal: 0 },
      },
      {
        texto: 'Às vezes alguns clientes corporativos solicitam',
        valor: 'as-vezes',
        peso: { simples: 1, hibrido: 2, normal: 1 },
      },
      {
        texto: 'Sim, meus compradores exigem crédito cheio e negociam desconto se não houver',
        valor: 'exigem-credito',
        peso: { simples: -2, hibrido: 3, normal: 3 },
      },
    ],
  },
  {
    id: 3,
    pergunta: 'Perder uma venda por falta de crédito de IBS e CBS doeria no seu caixa?',
    explicacao:
      'No novo sistema, se você transferir apenas 3% de crédito e o seu concorrente transferir 26,5%, seu produto parecerá 23,5% mais caro.',
    opcoes: [
      {
        texto: 'Não doeria, meu diferencial é exclusivo ou vendo no varejo',
        valor: 'nao-doeria',
        peso: { simples: 3, hibrido: 0, normal: 0 },
      },
      {
        texto: 'Poderia causar atrito comercial com alguns clientes chave',
        valor: 'medio-impacto',
        peso: { simples: 0, hibrido: 2, normal: 1 },
      },
      {
        texto: 'Doeria muito, eu perderia contratos essenciais de fornecimento',
        valor: 'alto-impacto',
        peso: { simples: -3, hibrido: 3, normal: 2 },
      },
    ],
  },
  {
    id: 4,
    pergunta: 'Qual o volume de compra de insumos/mercadorias e porte de faturamento?',
    explicacao:
      'Quem compra muito insumo com nota fiscal gera muito crédito financeiro para abater no IBS e CBS.',
    opcoes: [
      {
        texto: 'Insumos baixos (menos de 25% da receita), faturamento até R$ 2,5M',
        valor: 'baixo-insumo',
        peso: { simples: 3, hibrido: 0, normal: 0 },
      },
      {
        texto: 'Insumos médios (25% a 50% da receita), faturamento entre R$ 2,5M e R$ 3,6M',
        valor: 'medio-insumo',
        peso: { simples: 1, hibrido: 3, normal: 1 },
      },
      {
        texto: 'Alto insumo (>50% da receita) ou faturamento acima de R$ 3,6M (sublimite)',
        valor: 'alto-insumo',
        peso: { simples: -2, hibrido: 2, normal: 3 },
      },
    ],
  },
]

export const CENARIOS_COMUNS_COMPARADOR = [
  {
    titulo: 'Cenário 1: Loja de Varejo (B2C)',
    regimeRecomendado: 'Simples Tradicional',
    cor: 'emerald',
    descricao:
      'Uma loja de roupas ou restaurante que vende diretamente para famílias e pessoas físicas.',
    motivo:
      'Como o consumidor final pessoa física não aproveita crédito de imposto, permanecer no Simples Tradicional mantém a carga tributária menor, sem obrigação de apuração no débito e crédito.',
    dicaOuro:
      'Acompanhe o faturamento para não estourar o teto de R$ 4,8 milhões e mantenha seus dados cadastrais em dia.',
  },
  {
    titulo: 'Cenário 2: Fornecedor B2B para Médias e Grandes Indústrias',
    regimeRecomendado: 'Simples Híbrido',
    cor: 'amber',
    descricao:
      'Uma estamparia, usinagem ou agência B2B faturando R$ 1,8M a R$ 3,5M ao ano, fornecendo para montadoras ou grandes redes.',
    motivo:
      'No Simples Tradicional, seu cliente só aproveitaria crédito irrisório (3% a 5%). Ao optar pelo Simples Híbrido, seu cliente PJ recebe 100% de crédito (~26,5%), garantindo sua competitividade, enquanto sua folha e IRPJ/CSLL continuam protegidos na guia unificada do Simples.',
    dicaOuro:
      'A opção é semestral, com janelas em março e setembro para valer no semestre seguinte (a janela atual de 2026 vai até 30 de outubro, valendo para o 1º semestre de 2027). E, se o híbrido não compensar, é possível renunciar na janela seguinte!',
  },
  {
    titulo: 'Cenário 3: Empresa com Alto Insumo ou Faturamento Acima de R$ 3,6M',
    regimeRecomendado: 'Regime Normal (Lucro Real ou Presumido)',
    cor: 'blue',
    descricao:
      'Distribuidora com margem apertada e compra maciça de insumos, ou empresa que fatura entre R$ 3,6M e R$ 10M.',
    motivo:
      'Acima de R$ 3,6M o IBS já é cobrado por fora por determinação da lei (sublimite). Com alto volume de compras tributadas, a geração de créditos abaterá quase todo o débito, tornando o Regime Regular mais vantajoso que o Simples.',
    dicaOuro:
      'Faça o diagnóstico comparativo minucioso com a escrituração real das suas notas fiscais de entrada.',
  },
]

// ==========================================
// 7. DIAGNÓSTICO DA REFORMA (40 MINUTOS)
// ==========================================
export interface PerguntaDiagnostico40Min {
  id: string
  bloco: 'A' | 'B'
  titulo: string
  descricao: string
  tipo: 'select' | 'boolean'
  opcoes?: { label: string; valor: string; pontuacaoRisco: number; descricaoDetalhada?: string }[]
}

export const PERGUNTAS_DIAGNOSTICO_40MIN: PerguntaDiagnostico40Min[] = [
  // BLOCO A: NEGÓCIO E VENDAS
  {
    id: 'a1_atividade',
    bloco: 'A',
    titulo: 'Qual a atividade preponderante da empresa?',
    descricao: 'Define se o setor tem redução de 60%, 30% ou alíquota padrão.',
    tipo: 'select',
    opcoes: [
      { label: 'Saúde ou Educação (redução de 60%)', valor: 'saude_educacao', pontuacaoRisco: 1 },
      { label: 'Agronegócio ou Insumos (redução de 60%)', valor: 'agro', pontuacaoRisco: 1 },
      {
        label: 'Profissão Intelectual Regulamentada (redução 30%)',
        valor: 'intelectual',
        pontuacaoRisco: 2,
      },
      { label: 'Comércio / Varejo', valor: 'comercio', pontuacaoRisco: 2 },
      { label: 'Indústria em Geral', valor: 'industria', pontuacaoRisco: 2 },
      { label: 'Serviços Gerais / Tecnologia B2B', valor: 'servicos_gerais', pontuacaoRisco: 3 },
      {
        label: 'Bares, Bebidas ou Itens com Imposto Seletivo',
        valor: 'seletivo',
        pontuacaoRisco: 3,
      },
      {
        label: 'Transporte / Logística',
        valor: 'transporte_logistica',
        pontuacaoRisco: 2,
        descricaoDetalhada:
          'transporte coletivo de passageiros com redução de 60% na base pela LC 214/2025; carga com tratamento padrão',
      },
      {
        label: 'Construção Civil',
        valor: 'construcao_civil',
        pontuacaoRisco: 3,
        descricaoDetalhada: 'regras próprias de incorporação, fornecimento de material e retenções',
      },
      {
        label: 'Locação de Bens Imóveis',
        valor: 'locacao_imoveis',
        pontuacaoRisco: 1,
        descricaoDetalhada: 'locação pura fora do campo do IBS/CBS',
      },
      {
        label: 'Atividade Mista (mais de um ramo)',
        valor: 'atividade_mista',
        pontuacaoRisco: 3,
        descricaoDetalhada:
          'ao selecionar, informar a proporção entre os ramos com análise ponderada',
      },
    ],
  },
  {
    id: 'a2_regime',
    bloco: 'A',
    titulo: 'Qual o regime tributário atual da empresa?',
    descricao: 'Identifica a estrutura atual de recolhimento.',
    tipo: 'select',
    opcoes: [
      {
        label: 'Simples Nacional (faturamento até R$ 2,5M)',
        valor: 'simples_baixo',
        pontuacaoRisco: 1,
      },
      {
        label: 'Simples Nacional (faturamento entre R$ 2,5M e R$ 4,8M)',
        valor: 'simples_alto',
        pontuacaoRisco: 3,
      },
      { label: 'Lucro Presumido', valor: 'presumido', pontuacaoRisco: 2 },
      { label: 'Lucro Real', valor: 'real', pontuacaoRisco: 2 },
    ],
  },
  {
    id: 'a3_clientes',
    bloco: 'A',
    titulo: 'Quem são os principais compradores (perfil do cliente)?',
    descricao: 'Impacta diretamente a pressão por crédito de IBS/CBS.',
    tipo: 'select',
    opcoes: [
      { label: '100% Pessoa Física (Consumidor Final B2C)', valor: 'pf', pontuacaoRisco: 1 },
      { label: 'Misto (50% PF e 50% PJ)', valor: 'misto', pontuacaoRisco: 2 },
      {
        label: 'Mais de 70% PJ que exige nota fiscal e crédito financeiro',
        valor: 'pj_pesado',
        pontuacaoRisco: 4,
      },
    ],
  },
  {
    id: 'a4_exportacao',
    bloco: 'A',
    titulo: 'A empresa realiza operações de exportação ou atende clientes fora do Brasil?',
    descricao:
      'Exportações são 100% desoneradas com direito a ressarcimento acelerado de créditos.',
    tipo: 'select',
    opcoes: [
      { label: 'Não exporta nada', valor: 'nao', pontuacaoRisco: 1 },
      { label: 'Sim, exporta até 20% da receita', valor: 'pouco', pontuacaoRisco: 2 },
      { label: 'Sim, empresa predominantemente exportadora', valor: 'muito', pontuacaoRisco: 2 },
    ],
  },

  // BLOCO B: OPERAÇÃO E SISTEMA ERP
  {
    id: 'b1_fornecedores',
    bloco: 'B',
    titulo: 'Qual a origem dos seus principais fornecedores e insumos?',
    descricao:
      'Fornecedores no Simples transferem menos crédito que fornecedores do regime regular.',
    tipo: 'select',
    opcoes: [
      {
        label: 'Compro quase tudo de grandes indústrias e distribuidores',
        valor: 'grandes',
        pontuacaoRisco: 1,
      },
      {
        label: 'Compro de pequenos fornecedores locais no Simples ou MEI',
        valor: 'pequenos',
        pontuacaoRisco: 3,
      },
      {
        label: 'Compro produtos importados com despacho aduaneiro',
        valor: 'importacao',
        pontuacaoRisco: 2,
      },
    ],
  },
  {
    id: 'b2_frete_desconto',
    bloco: 'B',
    titulo:
      'A empresa possui operações relevantes com fretes próprios ou descontos incondicionais?',
    descricao: 'Regras de base de cálculo e split payment impactam a liquidação de fretes.',
    tipo: 'select',
    opcoes: [
      {
        label: 'Operações simples sem frete destacado ou descontos',
        valor: 'simples',
        pontuacaoRisco: 1,
      },
      {
        label: 'Frete FOB/CIF contratado com frequência e descontos no boleto',
        valor: 'relevante',
        pontuacaoRisco: 2,
      },
    ],
  },
  {
    id: 'b3_erp',
    bloco: 'B',
    titulo: 'Qual a situação atual do sistema emissor / ERP da empresa?',
    descricao: 'O software precisa emitir notas com IBS/CBS a partir de 2026.',
    tipo: 'select',
    opcoes: [
      {
        label: 'ERP de grande porte já homologado para a Reforma Tributária',
        valor: 'homologado',
        pontuacaoRisco: 0,
      },
      {
        label: 'ERP pequeno/médio ou emissor gratuito da Sefaz sem cronograma claro',
        valor: 'desconhecido',
        pontuacaoRisco: 4,
      },
      {
        label: 'Emissão quase manual ou planilha com suporte técnico atrasado',
        valor: 'critico',
        pontuacaoRisco: 5,
      },
    ],
  },
  {
    id: 'b4_split_payment',
    bloco: 'B',
    titulo: 'A empresa está preparada para a retenção do split payment bancário?',
    descricao: 'Impacta diretamente a gestão de fluxo de caixa e capital de giro.',
    tipo: 'select',
    opcoes: [
      {
        label: 'Fluxo de caixa saudável com capital de giro para absorver a retenção automática',
        valor: 'preparado',
        pontuacaoRisco: 1,
      },
      {
        label: 'Depende do dinheiro integral da venda para pagar contas do dia',
        valor: 'apertado',
        pontuacaoRisco: 4,
      },
    ],
  },
]

// ==========================================
// 8. PAINEL DE CONTROLE DA CARTEIRA
// ==========================================
export interface EtapaCarteira {
  id: string
  numero: number
  nome: string
  descricao: string
  acaoChave: string
}

export const ETAPAS_CARTEIRA: EtapaCarteira[] = [
  {
    id: 'diagnosticado',
    numero: 1,
    nome: 'Diagnosticado',
    descricao: 'Reunião de 40 min realizada, laudo emitido e enquadramento setorial definido.',
    acaoChave: 'Apresentar relatório e assinar plano de transição',
  },
  {
    id: 'sistema_ajustado',
    numero: 2,
    nome: 'Sistema Ajustado',
    descricao: 'ERP atualizado com campos de IBS/CBS e homologado com Comitê Gestor.',
    acaoChave: 'Emitir nota de teste no ambiente de homologação',
  },
  {
    id: 'equipe_treinada',
    numero: 3,
    nome: 'Equipe Treinada',
    descricao: 'Equipe de faturamento, compras e comercial alinhada aos novos conceitos.',
    acaoChave: 'Realizar workshop de precificação e split payment',
  },
  {
    id: 'cliente_comunicado',
    numero: 4,
    nome: 'Cliente Comunicado',
    descricao: 'Compradores B2B informados sobre crédito transferível e condições de faturamento.',
    acaoChave: 'Enviar circular informativa de conformidade tributária',
  },
  {
    id: 'operando',
    numero: 5,
    nome: 'Operando',
    descricao: 'Emissão regular, split payment conciliado e créditos aproveitados sem glosas.',
    acaoChave: 'Monitorar relatórios mensais de conformidade',
  },
]

export interface ClienteAcompanhamento {
  id: string
  nomeEmpresa: string
  cnpj: string
  segmento: string
  regime: string
  etapaAtual: string
  farol: 'vermelho' | 'amarelo' | 'verde'
  responsavel: string
  proximaAcao: string
  prazo: string
}

export const CLIENTES_EXEMPLO_CARTEIRA: ClienteAcompanhamento[] = [
  {
    id: '1',
    nomeEmpresa: 'Metalúrgica Alvorada Ltda',
    cnpj: '12.345.678/0001-90',
    segmento: 'Indústria',
    regime: 'Simples Nacional',
    etapaAtual: 'diagnosticado',
    farol: 'vermelho',
    responsavel: 'Dra. Camila (Fiscal)',
    proximaAcao:
      'Decisão sobre Simples Híbrido na janela semestral (março/setembro; janela de 2026 até 30/10) para não perder contratos com montadoras',
    prazo: '15 dias',
  },
  {
    id: '2',
    nomeEmpresa: 'Clínica Oftalmológica Visão Plena',
    cnpj: '98.765.432/0001-11',
    segmento: 'Saúde',
    regime: 'Lucro Presumido',
    etapaAtual: 'sistema_ajustado',
    farol: 'verde',
    responsavel: 'Dr. Roberto',
    proximaAcao: 'Validar segregação de 60% para procedimentos cirúrgicos no novo ERP',
    prazo: '30 dias',
  },
  {
    id: '3',
    nomeEmpresa: 'LogTech Transportes e Encomendas',
    cnpj: '45.123.890/0001-55',
    segmento: 'Transporte',
    regime: 'Simples Nacional',
    etapaAtual: 'equipe_treinada',
    farol: 'amarelo',
    responsavel: 'Lucas Mendes',
    proximaAcao: 'Treinar compradores sobre tomada de crédito no abastecimento de diesel',
    prazo: '7 dias',
  },
  {
    id: '4',
    nomeEmpresa: 'Padaria & Confeitaria Bela Vista',
    cnpj: '23.456.789/0001-44',
    segmento: 'Bares e Restaurantes',
    regime: 'Simples Nacional',
    etapaAtual: 'cliente_comunicado',
    farol: 'verde',
    responsavel: 'Ana Paula',
    proximaAcao: 'Revisar cardápio de bebidas alcoólicas sujeitas ao Imposto Seletivo',
    prazo: '45 dias',
  },
  {
    id: '5',
    nomeEmpresa: 'Nexus Software & SaaS B2B',
    cnpj: '33.888.999/0001-22',
    segmento: 'Tecnologia',
    regime: 'Lucro Real',
    etapaAtual: 'operando',
    farol: 'verde',
    responsavel: 'Felipe Martins',
    proximaAcao: 'Revisar créditos de computação em nuvem internacional via split payment',
    prazo: '60 dias',
  },
]

export const ROTINA_MENSAL_SEMANAS = [
  {
    semana: 'Semana 1',
    foco: 'Fechamento Fiscal & Conciliação do Split Payment',
    tarefas: [
      'Conferir notas fiscais emitidas no mês anterior com destaque de IBS e CBS',
      'Conciliar as retenções financeiras feitas pelos adquirentes e bancos no split payment',
      'Identificar créditos fiscais gerados por fornecedores e comparar com extrato do CGIBS',
    ],
  },
  {
    semana: 'Semana 2',
    foco: 'Apuração e Transmissão das Guias Unificadas',
    tarefas: [
      'Apuração do saldo devedor ou credor da CBS (federal) e do IBS (estadual/municipal)',
      'Envio tempestivo das obrigações acessórias (DeRE e declaração unificada)',
      'Geração do DAS com a correta repartição das cotas dos novos tributos',
    ],
  },
  {
    semana: 'Semana 3',
    foco: 'Auditoria de Cadastros e Fornecedores',
    tarefas: [
      'Auditar o cadastro de produtos (NCMs e alíquotas com redução de 60% ou alíquota zero)',
      'Verificar se novos fornecedores contratados estão regulares e transferindo créditos',
      'Avisar o setor comercial do cliente caso algum item esteja sofrendo tributação indevida',
    ],
  },
  {
    semana: 'Semana 4',
    foco: 'Reunião de Alinhamento Consultivo com o Cliente',
    tarefas: [
      'Apresentar relatório mensal de impacto no caixa gerado pelo novo sistema',
      'Avaliar se o regime tributário continua sendo o mais vantajoso (termômetro do Simples Híbrido)',
      'Planejar compras estratégicas de maquinário e insumos para aproveitar créditos acumulados',
    ],
  },
]

// ==========================================
// 9. GLOSSÁRIO E FONTES
// ==========================================
export interface ConfusaoComum {
  comparativo: string
  termoA: string
  termoB: string
  diferencaPratica: string
  dicaMnemônica: string
}

export const CONFUSOES_COMUNS: ConfusaoComum[] = [
  {
    comparativo: 'IBS versus CBS',
    termoA: 'IBS (Estadual & Municipal)',
    termoB: 'CBS (Federal)',
    diferencaPratica:
      'O IBS pertence aos estados e municípios (gerido pelo CGIBS e substitui ICMS e ISS). A CBS pertence à União Federal (gerida pela Receita Federal e substitui PIS e COFINS). Ambos incidem sobre a mesma base de cálculo, mas têm destinos federativos diferentes.',
    dicaMnemônica:
      'IBS é o imposto de BAIXO (governadores e prefeitos); CBS é a de CIMA (Brasília).',
  },
  {
    comparativo: 'IS versus ISS',
    termoA: 'IS (Imposto Seletivo)',
    termoB: 'ISS (Imposto sobre Serviços)',
    diferencaPratica:
      'O ISS é o tributo municipal antigo sobre serviços que deixará de existir gradualmente até 2033. O IS é o Imposto Seletivo novo, federal, monofásico, cobrado sobre produtos prejudiciais à saúde ou ao meio ambiente (cigarro, bebidas, veículos fósseis).',
    dicaMnemônica: 'ISS = Serviços antigos de prefeitura. IS = Imposto do "pecado" / seletivo.',
  },
  {
    comparativo: 'IBS versus IPI',
    termoA: 'IBS (IVA dos Estados/Municípios)',
    termoB: 'IPI (Imposto s/ Produtos Industrializados)',
    diferencaPratica:
      'O IPI era um imposto federal sobre transformação industrial que terá alíquotas zeradas em 2027 (ficando apenas onde protege a Zona Franca de Manaus). O IBS é o tributo geral de consumo que incide sobre bens tangíveis e serviços de forma uniforme.',
    dicaMnemônica: 'IPI zera em 2027. O IBS nasce para substituir ICMS e ISS com crédito pleno.',
  },
  {
    comparativo: 'CBS versus PIS/COFINS',
    termoA: 'CBS (Nova Contribuição Plena)',
    termoB: 'PIS e COFINS (Tributos Antigos Extintos)',
    diferencaPratica:
      'PIS e COFINS eram contribuições federais com duas sistemáticas complexas (cumulativo 3,65% e não-cumulativo 9,25%) cheias de restrições de créditos e discussões judiciais. A CBS é unificada em 8,8% (com 0,1 p.p. de desconto inicial) e garante crédito financeiro sobre absolutamente qualquer insumo pago na operação.',
    dicaMnemônica:
      'PIS/COFINS morrem em 31/12/2026. A CBS nasce em 01/01/2027 sem litígio de crédito.',
  },
]

export const FONTES_OFICIAIS = [
  {
    titulo: 'Lei Complementar nº 214/2025',
    descricao:
      'Lei Geral do IBS, da CBS e do Imposto Seletivo. Estabelece fatos geradores, regimes diferenciados, split payment e regras de transição.',
    link: 'https://www.planalto.gov.br',
    badge: 'Lei Oficial',
  },
  {
    titulo: 'Emenda Constitucional nº 132/2023',
    descricao:
      'Altera o Sistema Tributário Nacional na Constituição Federal e cria o IBS, CBS, IS e o Comitê Gestor.',
    link: 'https://www.planalto.gov.br',
    badge: 'Constituição Federal',
  },
  {
    titulo: 'Portal do Comitê Gestor do IBS (CGIBS)',
    descricao:
      'Ambiente oficial de governança federativa do IBS compartilhado entre todos os 27 estados e municípios.',
    link: 'https://www.gov.br',
    badge: 'Portal Governamental',
  },
  {
    titulo: 'Receita Federal do Brasil — Reforma Tributária',
    descricao:
      'Informações técnicas, minutas de regulamentação da CBS e manuais de orientação ao contribuinte.',
    link: 'https://www.gov.br/receitafederal',
    badge: 'Receita Federal',
  },
]
