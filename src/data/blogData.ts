export interface BlogPostCTA {
  title: string
  description: string
  buttonText: string
  buttonLink: string
  secondaryLink?: {
    text: string
    href: string
  }
  badge?: string
}

export interface BlogPost {
  slug: string
  title: string
  summary: string
  category: string
  series?: string
  seriesOrder?: number
  author: {
    name: string
    role: string
    avatar: string
  }
  date: string
  readTime: string
  coverImage: string
  content: string[]
  cta?: BlogPostCTA
  tags?: string[]
}

export const blogPosts: BlogPost[] = [
  // 1. Artigo da Série: Visão Geral 2026
  {
    slug: 'reforma-tributaria-2026-o-que-realmente-muda',
    title: 'Reforma Tributária 2026: o que realmente muda para a sua empresa',
    summary:
      'Uma análise direta e sem juridiquês sobre a extinção de PIS, COFINS, IPI, ICMS e ISS, a criação do IVA Dual (CBS 8,80% e IBS 17,70%), Imposto Seletivo e o cronograma 2026–2033 aprovado pela EC 132/2023 e LC 214/2025.',
    category: 'Reforma Tributária',
    series: 'Série Reforma Tributária 2026',
    seriesOrder: 1,
    author: {
      name: 'Dr. Marcos Chagas',
      role: 'Sócio Fundador & Tributarista',
      avatar: 'https://img.usecurling.com/ppl/medium?gender=male&seed=101',
    },
    date: '10 de Fevereiro de 2025',
    readTime: '7 min de leitura',
    coverImage:
      'https://img.usecurling.com/p/800/450?q=tax%20reform%20business%20brazil%20charts&color=emerald',
    tags: ['Reforma Tributária', 'IVA Dual', 'CBS', 'IBS', 'Planejamento 2026'],
    cta: {
      badge: 'Simulador Interativo 2026–2033',
      title: 'Calcule a carga tributária da sua empresa na Reforma',
      description:
        'Utilize nossa Calculadora IBS/CBS oficial de 6 módulos ou gere um Diagnóstico Tributário completo comparando o sistema atual e o novo modelo.',
      buttonText: 'Acessar Calculadora IBS/CBS',
      buttonLink: '/calculadora-ibs-cbs',
      secondaryLink: {
        text: 'Fazer Diagnóstico Gratuito',
        href: '/diagnostico',
      },
    },
    content: [
      'A promulgação da Emenda Constitucional 132/2023 e a consolidação das normas operacionais na Lei Complementar 214/2025 marcaram o início da mais profunda reestruturação fiscal da história moderna do Brasil. Após cinco décadas de um manicômio tributário baseado em cumulatividade oculta, disputas fiscais entre estados (a clássica guerra fiscal) e regras de apuração desencontradas, o país inicia em 2026 a transição para o modelo de IVA Dual (Imposto sobre Valor Agregado).',
      'Para o empresário e o diretor financeiro, entender as mudanças não é apenas uma questão de compliance contábil, mas de sobrevivência mercadológica. Cinco tributos históricos estão com os dias contados: na esfera federal, PIS, COFINS e IPI serão gradativamente extintos; nos âmbitos estadual e municipal, desaparecerão o ICMS e o ISS.',
      'Em substituição, teremos três tributos principais no centro do novo arranjo: a CBS (Contribuição sobre Bens e Serviços), de competência da União; o IBS (Imposto sobre Bens e Serviços), gerido de forma compartilhada por estados e municípios através do Comitê Gestor do IBS; e o Imposto Seletivo (IS), apelidado de "imposto do pecado", incidente sobre produtos comprovadamente prejudiciais à saúde humana e ao meio ambiente.',
      'A alíquota padrão estimada para o IVA Dual consolidado é de 26,50% — sendo CBS fixada em 8,80% e IBS em 17,70%. Embora pareça um percentual nominal elevado, a dinâmica real do imposto muda radicalmente por causa do princípio da Não-Cumulatividade Plena (crédito financeiro irrestrito): todo imposto pago na aquisição de insumos, equipamentos, aluguéis e serviços corporativos se converte em crédito integral para abater da guia a recolher na saída.',
      'Além disso, a legislação previu regimes diferenciados vitais para o equilíbrio econômico: redução de 60% na alíquota padrão (resultando em 10,60% de alíquota efetiva) para serviços de saúde humana, educação, medicamentos essenciais e produtos agropecuários in natura. O transporte coletivo de passageiros conta com redução de 30% (alíquota efetiva de 18,55%), enquanto uma Cesta Básica Nacional ampla terá alíquota 0% de CBS e IBS, garantindo neutralidade nos alimentos fundamentais da população.',
      'O cronograma é longo, mas o início dos testes é imediato. Em 2026, teremos a fase de teste operacional com alíquota simbólica de 0,9% de CBS e 0,1% de IBS (totalizando 1,0%), compensável integralmente com PIS e COFINS devidos. Em 2027, a CBS passa a vigorar em sua integralidade (8,80%), extinguindo de imediato PIS e COFINS e zerando as alíquotas do IPI (com exceção dos itens concorrentes com a Zona Franca de Manaus), além da entrada do Imposto Seletivo.',
      'Entre 2029 e 2032, ocorrerá a redução gradual e escalonada do ICMS e do ISS (90% do valor atual em 2029 até 60% em 2032), com o IBS subindo proporcionalmente a cada ano. Finalmente, em 2033, o novo sistema estará 100% implementado em todo o território nacional.',
      'Preparar sua empresa exige rever contratos de prestação de serviços, auditar parametrizações de ERPs, renegociar prazos com fornecedores e avaliar se a sua empresa deve permanecer no Simples Nacional ou migrar para o regime geral. Não espere 2026 chegar para descobrir o tamanho do impacto no seu fluxo de caixa.',
    ],
  },

  // 2. Artigo da Série: Dicionário Didático de Siglas
  {
    slug: 'ibs-cbs-e-imposto-seletivo-entenda-as-siglas',
    title: 'IBS, CBS e Imposto Seletivo: entenda as siglas da nova tributação',
    summary:
      'Um guia prático e didático para descomplicar o vocabulário da Reforma Tributária: aprenda com truques de memória fáceis o que são IBS, CBS, Imposto Seletivo, Split Payment, IVA Dual e Não-Cumulatividade Plena.',
    category: 'Reforma Tributária',
    series: 'Série Reforma Tributária 2026',
    seriesOrder: 2,
    author: {
      name: 'Dra. Patrícia Lima',
      role: 'Diretora de Contabilidade',
      avatar: 'https://img.usecurling.com/ppl/medium?gender=female&seed=102',
    },
    date: '12 de Fevereiro de 2025',
    readTime: '6 min de leitura',
    coverImage:
      'https://img.usecurling.com/p/800/450?q=tax%20dictionary%20glossary%20calculator&color=emerald',
    tags: ['Dicionário Tributário', 'IBS', 'CBS', 'Imposto Seletivo', 'Split Payment'],
    cta: {
      badge: 'Dicionário Completo no Hub',
      title: 'Consulte o Dicionário de Mnemônicos e Termos da Reforma',
      description:
        'Acesse nossa central de termos com dezenas de siglas decodificadas, base legal na LC 214/2025 e exemplos visuais práticos.',
      buttonText: 'Acessar Dicionário da Reforma',
      buttonLink: '/reforma-tributaria/dicionario',
      secondaryLink: {
        text: 'Ver Calendário de Transição',
        href: '/reforma-tributaria/calendario',
      },
    },
    content: [
      'Se você abrir os jornais econômicos ou conversar com seu time financeiro, logo será inundado por uma sopa de letrinhas inédita: IBS, CBS, IS, IVA Dual, Split Payment, Comitê Gestor e Crédito Financeiro. Para quem comanda uma empresa no dia a dia, tentar memorizar conceitos jurídicos densos só gera ansiedade.',
      'Por isso, na Contabilidade 5.0, criamos um método didático com regras mnemônicas simples para fixar o que cada conceito significa e como ele mexe no seu bolso.',
      '1. IBS (Imposto sobre Bens e Serviços): Pense em "Imposto de Baixo". Ele cuida das esferas inferiores da federação — estados e municípios. Ele substitui os velhos ICMS (estadual) e ISS (municipal). Sua alíquota padrão estimada é de 17,70%, recolhida via Comitê Gestor integrado e com tributação no destino (onde a mercadoria ou serviço é consumido, acabando com a guerra fiscal).',
      '2. CBS (Contribuição sobre Bens e Serviços): Pense em "Contribuição de Cima". É o tributo gerido pelo governo federal (União). Ele substitui o PIS e a COFINS federais. Sua alíquota de referência é de 8,80%, apurada e arrecadada pela Receita Federal a partir de 2027.',
      '3. IVA Dual (Imposto sobre Valor Agregado em Duas Camadas): É a soma harmônica do "de cima" (CBS 8,80%) com o "de baixo" (IBS 17,70%), totalizando a alíquota padrão de referência nacional de 26,50%. Ambas as camadas compartilham exatamente a mesma base de cálculo, as mesmas regras de creditamento e a mesma legislação uniforme estabelecida pela LC 214/2025.',
      '4. IS (Imposto Seletivo): O famoso "Imposto do Pecado". Trata-se de uma sobretaxa regulatória incidente sobre produtos e atividades prejudiciais à saúde física ou à sustentabilidade ambiental — tais como bebidas alcoólicas, cigarros, refrigerantes ultra-açucarados, veículos poluentes e mineração. O objetivo não é apenas arrecadar, mas desestimular o consumo de itens nocivos.',
      '5. Split Payment (Pagamento Fracionado em Tempo Real): Talvez a maior revolução tecnológica da LC 214/2025. No modelo antigo, sua empresa recebia a fatura total do cliente e, 20 dias depois, emitia uma guia DARF ou DAE para recolher o imposto ao banco. No Split Payment, o arranjo bancário retém o imposto no exato momento da liquidação financeira (seja via Pix, cartão ou boleto liquidado). O valor do tributo vai direto para a conta do Fisco, e apenas o valor líquido entra no caixa da sua empresa.',
      '6. Não-Cumulatividade Plena (Crédito Financeiro): Esqueça a antiga regra restritiva de creditamento do ICMS, que exigia comprovar se determinado item entrava fisicamente no produto final. No IVA Dual vigora o crédito financeiro pleno: qualquer aquisição corporativa com emissão de nota idônea — desde energia elétrica e computadores até serviços contábeis e licenças de software — gera crédito imediato para abater do imposto devido na venda.',
      'Dominando esses seis pilares, qualquer reunião com advogados, auditores ou diretores comerciais se torna muito mais produtiva. A reforma não precisa ser um mistério quando explicada em linguagem humana.',
    ],
  },

  // 3. Artigo da Série: Apresentando a Calculadora IBS/CBS (Destaque Principal)
  {
    slug: 'apresentamos-a-calculadora-ibs-cbs-simule-o-impacto',
    title: 'Apresentamos a Calculadora IBS/CBS: simule o impacto na sua empresa',
    summary:
      'Lançamos uma ferramenta interativa e gratuita com 6 módulos interligados para projetar alíquotas oficiais (26,50%), comparativo dos 4 regimes tributários, simulador de créditos de insumos e o cronograma de transição 2026–2033 para o seu negócio.',
    category: 'Ferramentas & Simuladores',
    series: 'Série Reforma Tributária 2026',
    seriesOrder: 3,
    author: {
      name: 'Caio Andrade',
      role: 'Head de Tecnologia & Métricas',
      avatar: 'https://img.usecurling.com/ppl/medium?gender=male&seed=103',
    },
    date: '15 de Fevereiro de 2025',
    readTime: '8 min de leitura',
    coverImage:
      'https://img.usecurling.com/p/800/450?q=financial%20calculator%20software%20dashboard&color=emerald',
    tags: [
      'Calculadora IBS/CBS',
      'Simulador Tributário',
      'Simples Nacional',
      'Lucro Real',
      'Lucro Presumido',
    ],
    cta: {
      badge: 'Experimente Gratuitamente',
      title: 'Acesse agora a Calculadora IBS/CBS com 6 módulos',
      description:
        'Simule faturamentos de qualquer porte, despesas operacionais com créditos e descubra se o seu negócio pagará mais ou menos tributos nos próximos anos.',
      buttonText: 'Abrir Calculadora IBS/CBS',
      buttonLink: '/calculadora-ibs-cbs',
      secondaryLink: {
        text: 'Fazer Diagnóstico Tributário Completo',
        href: '/diagnostico',
      },
    },
    content: [
      'Quantas vezes você ouviu especialistas dizendo que a Reforma Tributária trará um IVA de 26,50%, mas ninguém soube responder com exatidão: "Quanto a MINHA empresa vai pagar em reais por mês a partir de 2026?".',
      'Foi exatamente para transformar incertezas teóricas em números auditáveis e práticos que a equipe de engenharia e consultoria tributária da Contabilidade 5.0 desenvolveu a Calculadora IBS/CBS, já disponível gratuitamente em nosso portal.',
      'A ferramenta foi estruturada em 6 módulos integrados em tempo real, permitindo simulações instantâneas para empresas de qualquer porte — desde microempresas do Simples Nacional até corporações do Lucro Presumido e Lucro Real.',
      'Módulo 1 — Configurações Gerais e Alíquotas Oficiais: Permite parametrizar as alíquotas nominais vigentes estabelecidas pela EC 132/2023 e LC 214/2025 (CBS padrão em 8,80%, IBS padrão em 17,70%, totalizando 26,50%). Inclui seletores para regimes diferenciados com 60% de redução (alíquota efetiva de 10,60% para saúde, educação, medicamentos e agropecuária), 30% de redução (18,55% para transporte coletivo) e regime zero para a cesta básica.',
      'Módulo 2 — Calculadora Simples de Saída: Informe seu faturamento mensal ou anual estimado e veja instantaneamente o valor bruto da CBS, do IBS, o total do IVA Dual e o montante líquido retido após a aplicação do Split Payment.',
      'Módulo 3 — Comparativo dos 4 Regimes Tributários: O módulo mais elogiado por CEOs. Coloca lado a lado a carga tributária efetiva no Simples Nacional Tradicional, no Simples Híbrido (recolhendo IBS/CBS pelo regime geral e o restante pelo Simples), no Lucro Presumido e no Lucro Real, indicando com clareza visual a opção mais vantajosa economicamente.',
      'Módulo 4 — Simulador de Créditos Antes × Depois: Permite listar suas despesas operacionais (aluguel comercial, compras de mercadorias, insumos industriais, serviços tomados de terceiros, energia elétrica e telecomunicações) e calcular o crédito tributário recuperável no novo modelo comparado ao modelo cumulativo antigo.',
      'Módulo 5 — Cronograma de Transição 2026–2033: Veja a evolução ano a ano do seu desembolso fiscal durante toda a década: o teste operacional de 2026 (CBS 0,9% e IBS 0,1%), a chegada da CBS plena em 2027, o desmonte gradual de ICMS/ISS entre 2029 e 2032 e a consolidação do IBS pleno em 2033.',
      'Módulo 6 — Dashboard Executivo Consolidado: Gráficos comparativos de faturamento versus tributos, percentuais de carga efetiva sobre a receita líquida e alertas estratégicos específicos para o perfil do seu CNAE.',
      'Quem deve utilizar a calculadora hoje mesmo? Sócios e fundadores planejando investimentos de longo prazo; diretores comerciais que precisam precificar contratos plurianuais com clientes B2B; e analistas tributários que querem oferecer orientações fundamentadas com dados reais.',
      'Além da calculadora rápida, nosso site disponibiliza o Diagnóstico Tributário Aprofundado em /diagnostico, onde nossos especialistas analisam detalhadamente o balanço, a folha de pagamento e o histórico fiscal da sua empresa.',
    ],
  },

  // 4. Artigo da Série: Simples Nacional na Reforma
  {
    slug: 'simples-nacional-na-reforma-teto-sublimite-e-hibrido',
    title: 'Simples Nacional na Reforma: teto, sublimite e o Simples Híbrido',
    summary:
      'Descubra o que muda para micro e pequenas empresas: o teto de R$ 4,8 milhões, o sublimite de R$ 3,6 milhões para o IBS, a escolha anual do Simples Híbrido e como a transferência de créditos impactará suas vendas B2B.',
    category: 'Reforma Tributária',
    series: 'Série Reforma Tributária 2026',
    seriesOrder: 4,
    author: {
      name: 'Dr. Marcos Chagas',
      role: 'Sócio Fundador & Tributarista',
      avatar: 'https://img.usecurling.com/ppl/medium?gender=male&seed=101',
    },
    date: '18 de Fevereiro de 2025',
    readTime: '7 min de leitura',
    coverImage:
      'https://img.usecurling.com/p/800/450?q=small%20business%20taxes%20growth%20brazil&color=emerald',
    tags: ['Simples Nacional', 'Simples Híbrido', 'Sublimite R$ 3,6M', 'Vendas B2B', 'Crédito'],
    cta: {
      badge: 'Comparador de Regimes',
      title: 'Simule se o Simples Híbrido vale a pena para o seu negócio',
      description:
        'Faça uma simulação comparativa entre Simples tradicional, Simples Híbrido e Lucro Real em nosso Comparador de Regimes exclusivo.',
      buttonText: 'Acessar Comparador de Regimes',
      buttonLink: '/diagnostico-regimes',
      secondaryLink: {
        text: 'Abrir Calculadora IBS/CBS',
        href: '/calculadora-ibs-cbs',
      },
    },
    content: [
      'Uma das maiores preocupações dos mais de 20 milhões de pequenos negócios no Brasil era saber se o Simples Nacional deixaria de existir com a aprovação da Reforma Tributária. A resposta imediata e categórica é: NÃO. O Simples Nacional continua protegido pelo artigo 146 da Constituição Federal. No entanto, sua mecânica operacional sofrerá mudanças que exigem atenção redobrada.',
      'O teto de faturamento anual para enquadramento no Simples Nacional permanece em R$ 4,8 milhões para tributos federais. Todavia, a EC 132/2023 consolidou a aplicação nacional do sublimite estadual e municipal de R$ 3,6 milhões para apuração do IBS.',
      'O que isso significa na prática? Empresas cujo faturamento acumulado nos últimos 12 meses ultrapassar R$ 3.600.000,00 (mesmo estando abaixo do teto de R$ 4,8 milhões) serão obrigadas a recolher o IBS (17,70%) por fora do Documento de Arrecadação do Simples (DAS), sob as regras do regime normal de apuração com débito e crédito.',
      'O segundo ponto crítico — e que afetará profundamente o relacionamento comercial — é a transferência de créditos tributários para clientes corporativos (vendas B2B). No regime atual, empresas enquadradas no regime normal compram de optantes do Simples sem poder aproveitar créditos substanciais.',
      'No novo modelo do IVA Dual, os compradores tributados pelo Lucro Real ou Presumido só poderão se creditar do montante de IBS e CBS que o fornecedor do Simples efetivamente recolheu em sua guia unificada. Em muitos casos, esse crédito fica em torno de 3% a 7%, muito abaixo dos 26,50% que o comprador aproveitaria se comprasse de um concorrente do regime geral.',
      'Para evitar que pequenas empresas percam contratos comerciais com grandes clientes corporativos, a LC 214/2025 instituiu formalmente o "Simples Híbrido". Trata-se de uma faculdade em que a empresa optante pelo Simples decide apurar o IBS e a CBS pelas regras gerais de débito e crédito (destacando 26,50% de IVA Dual e transferindo 100% de crédito para seus compradores), enquanto continua recolhendo IRPJ, CSLL e Contribuição Previdenciária Patronal dentro do DAS simplificado.',
      'A opção pelo Simples Híbrido deverá ser exercida anualmente até 30 de setembro com efeitos para o ano-calendário subsequente, sendo irretratável para todo o exercício. Optar ou não dependerá da composição da sua carteira: se a maioria dos seus clientes são consumidores finais (B2C), o Simples tradicional continuará sendo imbatível; se seus clientes forem indústrias e grandes varejistas (B2B), o Simples Híbrido pode ser a única chave para não perder contratos.',
      'Na Contabilidade 5.0, realizamos simulações de carteira em nosso Painel da Carteira e na Calculadora IBS/CBS para mapear o ponto de equilíbrio exato de cada cliente.',
    ],
  },

  // 5. Artigo da Série: Calendário de Ações e Checklist 2026–2033
  {
    slug: 'como-sua-empresa-deve-se-preparar-calendario-2026-2033',
    title: 'Como sua empresa deve se preparar: calendário de ações 2026–2033',
    summary:
      'Um checklist executivo e cronológico com todas as medidas práticas que diretores, gerentes financeiros e controladores devem adotar em cada fase da transição para não serem pegos de surpresa.',
    category: 'Reforma Tributária',
    series: 'Série Reforma Tributária 2026',
    seriesOrder: 5,
    author: {
      name: 'Dra. Patrícia Lima',
      role: 'Diretora de Contabilidade',
      avatar: 'https://img.usecurling.com/ppl/medium?gender=female&seed=102',
    },
    date: '20 de Fevereiro de 2025',
    readTime: '6 min de leitura',
    coverImage:
      'https://img.usecurling.com/p/800/450?q=business%20planning%20calendar%20strategy&color=emerald',
    tags: ['Calendário 2026-2033', 'Planejamento Tributário', 'Checklist', 'Split Payment', 'ERP'],
    cta: {
      badge: 'Diagnóstico Sem Custos',
      title: 'Faça um Diagnóstico Estratégico da Reforma para sua Empresa',
      description:
        'Receba um relatório exclusivo com cronograma de impacto financeiro por ano da transição e recomendações de contingência fiscal.',
      buttonText: 'Solicitar Diagnóstico Estratégico',
      buttonLink: '/diagnostico',
      secondaryLink: {
        text: 'Consultar Calendário Detalhado',
        href: '/reforma-tributaria/calendario',
      },
    },
    content: [
      'A transição da Reforma Tributária brasileira não ocorrerá em um passe de mágica da noite para o dia. Pelo contrário: durante quase uma década inteira (de 2026 a 2032), o ambiente corporativo brasileiro conviverá simultaneamente com dois sistemas tributários paralelos. Manter os sistemas fiscais da sua empresa atualizados exigirá governança, processos ágeis e parceiros contábeis consultivos.',
      'Para facilitar a implementação prática, nossa diretoria compilou o checklist cronológico de ações indispensáveis para cada janela temporal da reforma:',
      'Fase 1: 2025 — Ano do Diagnóstico e Parametrizações (Ação Imediata). Realizar auditoria da carteira de clientes B2B versus B2C; mapear todos os fornecedores críticos e verificar se são optantes do Simples ou do regime geral; cotar atualizações e módulos de ERP para emissão de notas com destaque de IBS e CBS; treinar as equipes de faturamento e compras sobre os critérios de crédito financeiro integral.',
      'Fase 2: 2026 — O Teste Operacional Nacional (CBS 0,9% e IBS 0,1%). O primeiro ano com recolhimento efetivo do IVA Dual em caráter de teste. A empresa deve acompanhar a compensação dos créditos de 1,0% diretamente contra o PIS e a COFINS a recolher; homologar a integração com os primeiros pilotos de Split Payment bancário; testar a conciliação automática com o Comitê Gestor do IBS.',
      'Fase 3: 2027 a 2028 — A Chegada da CBS Plena e Fim de PIS/COFINS. A CBS assume sua alíquota cheia federal de 8,80%, extinguindo em definitivo PIS e COFINS; IPI tem alíquotas zeradas para produtos fora da Zona Franca de Manaus; entrada em vigor do Imposto Seletivo para itens específicos; reprecificação obrigatória de contratos de fornecimento e margens de revenda.',
      'Fase 4: 2029 a 2032 — A Desidratação Progressiva de ICMS e ISS. Início da transição estadual e municipal. A cada ano, o ICMS e o ISS perdem 10 pontos percentuais de sua carga original (90% em 2029, 80% em 2030, 70% em 2031, 60% em 2032), enquanto a alíquota de referência do IBS cresce de forma espelhada. Empresas precisarão de conciliação fiscal dupla impecável para evitar multas de recolhimento a menor.',
      'Fase 5: 2033 em diante — O Modelo Pleno Definitivo. Extinção definitiva de ICMS, ISS e do antigo arranjo tributário. Operação com IVA Dual consolidado (CBS 8,80% + IBS 17,70% = 26,50%) sob princípio irrestrito de destino e liquidação em tempo real.',
      'A maior armadilha para o gestor é postergar o planejamento para 2026. Empresas que iniciarem seus testes de impacto e parametrização agora em 2025 garantirão ampla vantagem de competitividade e segurança de caixa sobre a concorrência.',
    ],
  },

  // Posts anteriores mantidos e aprimorados
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
    tags: ['Reforma Tributária', 'Gestão Financeira', 'Serviços'],
    cta: {
      badge: 'Solução Consultiva',
      title: 'Prepare sua empresa para a nova era fiscal',
      description:
        'Conheça nosso Hub da Reforma Tributária com mapa de setores, exceções e o comparador oficial de regimes.',
      buttonText: 'Acessar Hub da Reforma',
      buttonLink: '/reforma-tributaria',
      secondaryLink: {
        text: 'Testar Calculadora IBS/CBS',
        href: '/calculadora-ibs-cbs',
      },
    },
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
    tags: ['Conformidade', 'Pequenas Empresas', 'eSocial', 'Gestão'],
    cta: {
      badge: 'Auditoria Gratuita',
      title: 'Evite autuações fiscais e multas desnecessárias',
      description:
        'Solicite um diagnóstico preliminar com nossos auditores para verificar a conformidade dos seus CNAEs e notas emitidas.',
      buttonText: 'Fazer Diagnóstico Fiscal',
      buttonLink: '/diagnostico',
    },
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
    tags: ['Balanço Patrimonial', 'Indicadores', 'Gestão Financeira'],
    cta: {
      badge: 'Painel em Tempo Real',
      title: 'Automatize os balanços e DREs da sua empresa',
      description:
        'Conheça nossa metodologia de Contabilidade Digital 5.0 com conciliação automática e relatórios mensais intuitivos.',
      buttonText: 'Conhecer Nossos Serviços',
      buttonLink: '/servicos',
    },
    content: [
      'Muitos empresários enxergam o Balanço Patrimonial apenas como uma obrigação entregue anualmente ao analista ou à contabilidade. No entanto, ele é a mais precisa radiografia patrimonial e de solidez do seu negócio.',
      'Em menos de 5 minutos, você pode extrair três respostas vitais:',
      '1. Minha empresa tem liquidez para honrar os compromissos imediatos? Divida o Ativo Circulante (dinheiro em caixa, contas a receber, estoques de curto prazo) pelo Passivo Circulante (dívidas com vencimento em até 12 meses). Se o resultado for maior que 1,2, sua empresa respira com segurança.',
      '2. Quanto do capital utilizado pertence de fato aos sócios? Analise o Patrimônio Líquido em relação ao Passivo Total. Uma empresa com alto índice de endividamento bancário pode sofrer com oscilações das taxas de juros (Selic).',
      '3. Como o lucro se transforma em patrimônio real? O Balanço demonstra claramente se os lucros operacionais apurados na DRE estão gerando caixa líquido, aplicações financeiras ou se estão retidos em estoques parados ou inadimplência de clientes.',
      'Com os relatórios automatizados da Contabilidade 5.0, você não precisa esperar o encerramento do ano fiscal para obter esses números: eles estão disponíveis todos os meses em formato visual e intuitivo.',
    ],
  },
]
