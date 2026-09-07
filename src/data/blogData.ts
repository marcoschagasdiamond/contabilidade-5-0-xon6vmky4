export interface BlogPost {
  slug: string
  title: string
  summary: string
  category: string
  author: {
    name: string
    role: string
    avatar: string
  }
  date: string
  readTime: string
  coverImage: string
  content: string[]
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'reforma-tributaria-2026',
    title: 'Reforma Tributária 2026: O que muda para o seu negócio',
    summary:
      'Entenda como a transição do IBS e CBS impactará o fluxo de caixa, as alíquotas do setor de serviços e os passos que sua empresa deve tomar desde já para não perder competitividade.',
    category: 'Reforma Tributária',
    author: {
      name: 'Dr. Marcos Chagas',
      role: 'Sócio Fundador & Tributarista',
      avatar: 'https://img.usecurling.com/ppl/medium?gender=male&seed=101',
    },
    date: '14 de Janeiro de 2025',
    readTime: '6 min de leitura',
    coverImage:
      'https://img.usecurling.com/p/800/450?q=tax%20reform%20finance%20brazil&color=emerald',
    content: [
      'A Reforma Tributária aprovada pelo Congresso Nacional representa a transformação mais profunda no sistema de impostos sobre o consumo no Brasil das últimas cinco décadas. A partir de 2026, com o início da fase de transição para a CBS (Contribuição sobre Bens e Serviços) e o IBS (Imposto sobre Bens e Serviços), o modelo tributário passa por uma unificação histórica de tributos como PIS, COFINS, IPI, ICMS e ISS.',
      'Para a maioria dos gestores e diretores financeiros, o maior desafio não será apenas compreender as novas alíquotas de referência, mas adaptar os sistemas de emissão de notas fiscais, a cadeia de suprimentos e os cálculos de margem de lucro operacional.',
      'O setor de serviços, em particular, deve dedicar atenção redobrada. Enquanto a indústria e o comércio atacadista tendem a se beneficiar com o creditamento financeiro amplo e irrestrito (onde praticamente todo insumo gera crédito do imposto pago anteriormente), as empresas prestadoras de serviços intensivas em mão de obra poderão enfrentar elevação de alíquotas nominais caso estejam no Lucro Presumido ou Real.',
      'Por outro lado, o Simples Nacional permanece garantido na Constituição, mas com nuances importantes: as empresas contratantes do regime geral poderão aproveitar créditos apenas do valor efetivamente recolhido pelo fornecedor enquadrado no Simples, o que pode influenciar decisões contratuais B2B.',
      'Na Contabilidade 5.0, já iniciamos simulações tributárias personalizadas para nossos clientes, avaliando o impacto projetado nos próximos exercícios fiscais e estruturando contratos para preservar a rentabilidade dos nossos parceiros.',
      'O momento de se preparar é agora. Revisar o enquadramento de mercadorias, parametrizações de ERPs e contratos de longo prazo evitará autuações e custos desnecessários durante a fase de transição que se estenderá até 2033.',
    ],
  },
  {
    slug: '5-erros-fiscais-pequenas-empresas',
    title: '5 erros fiscais que podem custar caro para pequenas empresas',
    summary:
      'Misturar finanças pessoais e empresariais, emitir notas em CNAE incorreto e atrasar o eSocial estão entre as falhas mais comuns que levam a multas severas e desenquadramento.',
    category: 'eSocial & Conformidade',
    author: {
      name: 'Dra. Patrícia Lima',
      role: 'Diretora de Contabilidade',
      avatar: 'https://img.usecurling.com/ppl/medium?gender=female&seed=102',
    },
    date: '08 de Janeiro de 2025',
    readTime: '5 min de leitura',
    coverImage:
      'https://img.usecurling.com/p/800/450?q=tax%20error%20calculator%20compliance&color=emerald',
    content: [
      'Manter uma empresa 100% regularizada no Brasil exige disciplina diária. O cruzamento eletrônico de dados da Receita Federal e das Secretarias de Fazenda estaduais tornou quase impossível operar com inconsistências sem ser notificado.',
      '1. Misturar patrimônio da pessoa física com a jurídica: Pagar despesas pessoais com a conta corrente da empresa é o erro número um. Além de descaracterizar a proteção patrimonial dos sócios (desconsideração da personalidade jurídica), pode gerar tributação de distribuição disfarçada de lucros.',
      '2. Emissão de Notas com CNAE inadequado: Utilizar um código de atividade genérico para pagar alíquotas menores no Simples Nacional caracteriza simulação fiscal. O Fisco pode retroagir 5 anos cobrando diferenças com multa de até 150%.',
      '3. Descumprimento dos prazos do eSocial: Atrasar admissões, desligamentos ou envio de laudos de Saúde e Segurança do Trabalho (SST) gera multas automáticas emitidas pelos sistemas do Ministério do Trabalho.',
      '4. Falta de conciliação bancária periódica: Se o saldo contábil não reflete o extrato bancário, o balanço perde validade jurídica para obtenção de crédito e licitações públicas.',
      '5. Não realizar planejamento tributário preventivo: Muitas empresas permanecem anos no Simples Nacional mesmo quando uma transição para o Lucro Real ou Presumido economizaria centenas de milhares de reais.',
    ],
  },
  {
    slug: 'como-ler-balanco-patrimonial-5-minutos',
    title: 'Como ler o balanço patrimonial da sua empresa em 5 minutos',
    summary:
      'Um guia prático para CEOs e fundadores interpretarem ativo circulante, passivo exigível a curto prazo e liquidez corrente sem precisar ser um especialista em contabilidade.',
    category: 'Análise Financeira',
    author: {
      name: 'Caio Andrade',
      role: 'Head de Tecnologia & Métricas',
      avatar: 'https://img.usecurling.com/ppl/medium?gender=male&seed=103',
    },
    date: '02 de Janeiro de 2025',
    readTime: '4 min de leitura',
    coverImage:
      'https://img.usecurling.com/p/800/450?q=balance%20sheet%20charts%20executive&color=emerald',
    content: [
      'Muitos empresários enxergam o Balanço Patrimonial apenas como uma obrigação entregue anualmente ao contador. No entanto, ele é a mais precisa radiografia patrimonial e de solidez do seu negócio.',
      'Em menos de 5 minutos, você pode extrair três respostas vitais:',
      '1. Minha empresa tem liquidez para honrar os compromissos imediatos? Divida o Ativo Circulante (dinheiro em caixa, contas a receber, estoques de curto prazo) pelo Passivo Circulante (dívidas com vencimento em até 12 meses). Se o resultado for maior que 1,2, sua empresa respira com segurança.',
      '2. Quanto do capital utilizado pertence de fato aos sócios? Analise o Patrimônio Líquido em relação ao Passivo Total. Uma empresa com alto índice de endividamento bancário pode sofrer com oscilações das taxas de juros (Selic).',
      '3. Como o lucro se transforma em patrimônio real? O Balanço demonstra claramente se os lucros operacionais apurados na DRE estão gerando caixa líquido, aplicações financeiras ou se estão retidos em estoques parados ou inadimplência de clientes.',
      'Com os relatórios automatizados da Contabilidade 5.0, você não precisa esperar o encerramento do ano fiscal para obter esses números: eles estão disponíveis todos os meses em formato visual e intuitivo.',
    ],
  },
]
