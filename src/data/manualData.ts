export interface SecaoManual {
  id: string
  titulo: string
  subtitulo: string
  categoria:
    | 'geral'
    | 'site'
    | 'diagnosticos'
    | 'calculadora'
    | 'recuperador'
    | 'legislacao'
    | 'relatorios'
    | 'crm'
    | 'admin'
    | 'vantagens'
  perfis: Array<'empresario' | 'analista' | 'admin' | 'master'>
  resumo: string
  conteudo: string[]
  itensDestaque?: Array<{
    rotulo: string
    descricao: string
  }>
  tabela?: {
    cabecalhos: string[]
    linhas: string[][]
  }
}

export const SECOES_MANUAL: SecaoManual[] = [
  {
    id: 'visao-geral',
    titulo: '1. O que é a Contabilidade 5.0',
    subtitulo:
      'Plataforma digital integrada e estruturada em torno da Reforma Tributária (IBS/CBS)',
    categoria: 'geral',
    perfis: ['empresario', 'analista', 'admin', 'master'],
    resumo:
      'A Contabilidade 5.0 une site institucional, inteligência fiscal da Reforma (EC 132/2023 e LC 214/2025) e gestão contábil de ponta a ponta.',
    conteudo: [
      'A Contabilidade 5.0 é uma plataforma de contabilidade digital construída em torno da Reforma Tributária (IBS/CBS — Emenda Constitucional 132/2023 e Lei Complementar 214/2025). Ela integra, em um único ecossistema, o site institucional com captação ativa de leads, ferramentas de análise tributária profunda (calculadoras, diagnósticos, relatórios em PDF) e gestão operacional e comercial do escritório (CRM, carteira de clientes, metas e agendamento de reuniões).',
      'O sistema adota o padrão visual Diamond Group (Navy #07132B, Dourado #D4AF37, Verde #2ECC71), 100% em língua portuguesa e sem elementos gráficos decorativos desnecessários, priorizando sobriedade executiva, clareza numérica e precisão regulatória.',
      'Diferente de sistemas legados focados apenas em obrigações acessórias passadas, a Contabilidade 5.0 é orientada para o futuro: projeta a travessia de 2026 a 2033, simula split payment, apura crédito sobre estoque, calcula custo líquido de aquisição de fornecedores e gera pareceres em PDF diagramados para apresentação executiva imediata.',
    ],
    itensDestaque: [
      {
        rotulo: 'Base Constitucional e Legal',
        descricao:
          'Calculada e atualizada com base na EC 132/2023 e LC 214/2025, cobrindo o IBS (Imposto sobre Bens e Serviços), a CBS (Contribuição sobre Bens e Serviços) e o IS (Imposto Seletivo).',
      },
      {
        rotulo: 'Tríplice Arquitetura',
        descricao:
          '1. Captação e Institucional; 2. Motor Tributário e Diagnósticos; 3. Gestão Comercial e Operacional (CRM, Carteira, Metas e Agendamento).',
      },
      {
        rotulo: 'Padrão Visual Diamond Group',
        descricao:
          'Identidade visual sóbria, elegante e executiva, desenvolvida para inspirar máxima confiança corporativa em reuniões com empresários e investidores.',
      },
    ],
  },
  {
    id: 'perfis-acesso',
    titulo: '2. Perfis de Acesso e Níveis de Permissão',
    subtitulo: 'Estrutura de papéis no sistema: Empresário, Analista, Admin e Master',
    categoria: 'geral',
    perfis: ['empresario', 'analista', 'admin', 'master'],
    resumo:
      'Diferenciação clara entre a visão do cliente final e as ferramentas de gestão do analista contábil e dos administradores.',
    conteudo: [
      'A plataforma adota controle granular de acessos por nível de permissão (campo nivel_acesso no cadastro de usuários), garantindo que cada usuário visualize as ferramentas adequadas à sua atuação no negócio.',
      'O sistema conta com Modo Teste gratuito para que contadores e empresários possam experimentar as simulações e diagnósticos antes de efetivar sua assinatura mensal.',
      'Abaixo, a tabela detalha o investimento mensal, o escopo operacional e as permissões de cada perfil:',
    ],
    tabela: {
      cabecalhos: ['Perfil', 'Investimento', 'Escopo Principal de Atuação', 'Recursos Liberados'],
      linhas: [
        [
          'Empresário / Cliente',
          'R$ 127 / mês',
          'Análise exclusiva da própria empresa cadastrada.',
          'Trilha de Diagnósticos 00–06, Calculadora IBS/CBS, Recuperador de Créditos, Relatórios individuais e dossiê unificado da sua empresa.',
        ],
        [
          'Analista',
          'R$ 347 / mês',
          'Gestão de carteira de clientes, consultoria e prospecção.',
          'Tudo do Empresário + Carteira de Clientes, CRM com ficha em 6 abas, Dashboard de Metas, envio de convites e geração de pareceres por cliente.',
        ],
        [
          'Admin',
          'Corporativo',
          'Visão global eleita pelo Master do sistema.',
          'Visão de todos os clientes, analistas parceiros, leads comerciais, gestão de reuniões e fila de pedidos de créditos.',
        ],
        [
          'Master',
          'Controle Total',
          'Gestão máxima corporativa (Dr. Marco Chagas).',
          'Controle total do sistema, eleição de administradores, gestão do Back Office White-Label e moderação do Mercado de Créditos.',
        ],
      ],
    },
    itensDestaque: [
      {
        rotulo: 'Modo Teste Gratuito',
        descricao:
          'Permite que novos usuários testem o preenchimento de diagnósticos, cálculos de fornecedores e simulações de IBS/CBS sem bloqueio prévio de tela.',
      },
      {
        rotulo: 'Migração para Analista',
        descricao:
          'Empresários e contadores podem migrar instantaneamente para o perfil Analista pelo menu da conta, liberando a gestão multi-empresas.',
      },
    ],
  },
  {
    id: 'site-institucional',
    titulo: '3. Site Institucional e Captação de Leads',
    subtitulo: 'Página inicial, 12 serviços com os 5 Pilares 5.0, Blog e captação ativa',
    categoria: 'site',
    perfis: ['empresario', 'analista', 'admin', 'master'],
    resumo:
      'Estrutura institucional de alta conversão para atrair empresas que buscam segurança na Reforma Tributária.',
    conteudo: [
      'O site institucional é a porta de entrada da plataforma, desenhado para transmitir credibilidade imediata e converter visitantes em leads qualificados para a consultoria contábil.',
      'Possui página inicial completa, hub da Reforma Tributária com submódulos explicativos (Visão Geral, Calendário, Dicionário, Impacto por Setor, Exceções e Split Payment), blog informativo e formulários inteligentes de conversão.',
      'O portfólio é estruturado em 12 serviços especializados, cada um apresentando rigorosamente os "5 Pilares 5.0" — identidade da marca Diamond Group:',
    ],
    itensDestaque: [
      {
        rotulo: 'Os 12 Serviços Especializados',
        descricao:
          '1. Contabilidade Digital; 2. BPO Contábil; 3. Assessoria Tributária; 4. Consultoria Financeira; 5. Departamento Pessoal; 6. Diagnóstico 360°; 7. Gestão Fiscal e Tributária; 8. Gestão de Recebíveis; 9. Negociação de Créditos e Precatórios; 10. Planejamento Sucessório; 11. Treinamento e Capacitação; 12. Back Office 5.0.',
      },
      {
        rotulo: 'Padrão dos 5 Pilares 5.0',
        descricao:
          'Apresentação corporativa, benefícios quantitativos, tabela comparativa com o modelo tradicional, fluxo guiado de implantação e pilares estratégicos.',
      },
      {
        rotulo: 'Formulários de Captação Ativa',
        descricao:
          'Mecanismos "Solicitar Proposta Personalizada" e "Agende com um Especialista", alimentando diretamente a esteira de leads e o CRM do escritório.',
      },
    ],
  },
  {
    id: 'trilha-diagnosticos',
    titulo: '4. Trilha de Diagnósticos Tributários (00 a 06)',
    subtitulo: 'Fluxo guiado em 7 etapas progressivas reunidas no hub /diagnosticos',
    categoria: 'diagnosticos',
    perfis: ['empresario', 'analista', 'admin', 'master'],
    resumo:
      'Esteira completa que conduz a empresa do diagnóstico de maturidade à análise detalhada de fornecedores e emissão do parecer consolidado.',
    conteudo: [
      'A Trilha de Diagnósticos é um fluxo guiado estruturado em 7 etapas sequenciais (00 a 06), acessíveis tanto de forma encadeada quanto individualmente no hub /diagnosticos. Cada etapa alimenta automaticamente as subsequentes:',
      '• Etapa 00 — Diagnóstico 360° (/diagnostico-360): Matriz semáforo de 7 frentes de risco estruturais (Financeiro, Investimentos, Societário, Fiscal, Tributário, Jurídico e Operacional). Apura o índice de maturidade da empresa.',
      '• Etapa 01 — Configurações (/diagnostico-configuracoes): Cadastro cadastral enxuto da empresa (CNPJ, UF, segmento, faturamento, folha, regime atual e ano de transição 2026–2033), que propaga dados para toda a esteira.',
      '• Etapa 02 — Autoavaliação de 7 Riscos (/diagnostico-autoavaliacao): Questionário técnico com 14 perguntas objetivas (2 por frente estrutural) com pontuação média ponderada.',
      '• Etapa 03 — Diagnóstico de Transição (/diagnostico-transicao): Avalia como a organização atravessará o cronograma de transição de 2026 a 2033 e seu grau de dependência de incentivos fiscais.',
      '• Etapa 04 — Comparação (/diagnostico-regimes): Confronta o modelo tributário atual vigente (PIS/COFINS/ICMS/ISS/IRPJ/CSLL) com a nova mecânica IBS/CBS.',
      '• Etapa 05 — Enquadramento (/diagnostico): Recomendação matemática do regime mais vantajoso (Simples Nacional vs. Lucro Presumido vs. Lucro Real), calculando a economia projetada e o Fator R.',
      '• Etapa 06 — Análise de Fornecedores (/diagnostico-fornecedores): Ferramenta de inteligência de compras. Cadastra e importa fornecedores em regimes Lucro Real, Presumido, Simples ou Misto, classifica itens quanto à geração de créditos (integral, parcial ou nulo), calcula o Custo Líquido de Aquisição e o Crédito Perdido, gera ranking de risco de troca, traz o Comparador de Cotações com preço de equilíbrio e veredito, histórico da cotação vencedora e projeção comparativa 2026–2033.',
    ],
    itensDestaque: [
      {
        rotulo: 'Propagação Automática de Parâmetros',
        descricao:
          'O ano da transição e os dados cadastrais informados na Etapa 01 alimentam instantaneamente as etapas seguintes, a Calculadora e os Relatórios.',
      },
      {
        rotulo: 'Relatório Consolidado da Trilha (/diagnostico-relatorio)',
        descricao:
          'Dossiê final executivo que agrupa os resultados das 7 etapas, com gráficos comparativos, semáforo de riscos e botão para emissão em PDF.',
      },
    ],
  },
  {
    id: 'calculadora-ibs-cbs',
    titulo: '5. Calculadora IBS/CBS e Assistente de IA',
    subtitulo: 'Motor de simulação tributária em 6 módulos, split payment e créditos',
    categoria: 'calculadora',
    perfis: ['empresario', 'analista', 'admin', 'master'],
    resumo:
      'Simula o impacto financeiro da EC 132/2023 ano a ano, calcula retenções em tempo real e analisa cenários com inteligência artificial.',
    conteudo: [
      'A Calculadora IBS/CBS (/calculadora-ibs-cbs) é o motor tributário mais sofisticado da plataforma, dividido em 6 módulos funcionais:',
      '• Módulo 1 — Configurações e Parâmetros: Definição da empresa, faturamento, folha, compras, ramos com alíquotas diferenciadas e ano da transição (fase-teste em 2026 com CBS 0,9% e IBS 0,1%; transição progressiva até 2033).',
      '• Módulo 2 — Calculadora Simples: Cálculo rápido da carga estimada no novo sistema para diagnósticos ágeis.',
      '• Módulo 3 — Comparativo de Regimes: Confronto detalhado entre Simples Nacional, Lucro Presumido e Lucro Real sob a ótica do IBS/CBS.',
      '• Módulo 4 — Simulador de Créditos e Estoque: Apuração dos créditos tributários não cumulativos e tratamento do crédito sobre o estoque na virada da legislação.',
      '• Módulo 5 — Transição e Cronograma 2026–2033: Evolução anual da alíquota de teste até a vigência plena em 2033.',
      '• Módulo 6 — Dashboard Estratégico: Visão executiva integrada com Farol de Limites do Simples Nacional, impacto do Split Payment (retenção na fonte por liquidação financeira), alertas de risco e histórico de simulações salvas.',
      'A Calculadora conta ainda com o Assistente de Análise por IA integrado ao Dashboard (agente nativo Skip Cloud) para tirar dúvidas tributárias em linguagem natural, além de suportar o parâmetro ?aplicar vindo do Radar Tributário para simular alíquotas provisórias.',
    ],
    itensDestaque: [
      {
        rotulo: 'Split Payment Automatizado',
        descricao:
          'Calcula o impacto imediato no fluxo de caixa provocado pela retenção automática do tributo no ato da liquidação bancária/eletrônica da fatura.',
      },
      {
        rotulo: 'Exportação e Compartilhamento',
        descricao:
          'Permite salvar múltiplos cenários, comparar histórico de versões, compartilhar link seguro e exportar o parecer técnico completo em PDF.',
      },
    ],
  },
  {
    id: 'recuperador-creditos',
    titulo: '6. Recuperador de Créditos Tributários',
    subtitulo: 'Identificação e apuração de créditos não aproveitados nos últimos 5 anos',
    categoria: 'recuperador',
    perfis: ['empresario', 'analista', 'admin', 'master'],
    resumo:
      'Levantamento administrativo de oportunidades fiscais retroativas com emissão de parecer técnico em PDF.',
    conteudo: [
      'O Recuperador de Créditos (/recuperador-creditos) atua na esfera administrativa, identificando pagamentos a maior ou indevidos dos últimos 60 meses com base nas teses pacificadas e entendimentos da Receita Federal e tribunais superiores.',
      'A ferramenta organiza a apuração em 4 grandes blocos tributários:',
      '1. PIS e COFINS: Insumos na não-cumulatividade, exclusão do ICMS da base de cálculo, fretes, energia elétrica e créditos monofásicos para varejistas.',
      '2. IRPJ e CSLL: Exclusão de benefícios fiscais, subvenções para investimento e deduções legais na sistemática do Lucro Real e Presumido.',
      '3. Folha e Previdenciário: Verbas indenizatórias na base do INSS patronal (terço de férias, aviso prévio indenizado, primeiros 15 dias de afastamento).',
      '4. Outros Tributos: ICMS-ST e taxas com bitributação comprovada.',
      'A ferramenta aplica correção Selic acumulada sobre o montante recuperável e gera um parecer técnico estruturado em PDF com a fundamentação legal de cada tese.',
    ],
    itensDestaque: [
      {
        rotulo: 'Correção Selic Automatizada',
        descricao:
          'Calcula os juros compensatórios mês a mês, demonstrando o valor presente real a ser compensado ou restituído.',
      },
      {
        rotulo: 'Parecer Executivo em PDF',
        descricao:
          'Documento formal com carimbo Diamond Group pronto para protocolização administrativa ou apresentação à diretoria da empresa.',
      },
    ],
  },
  {
    id: 'legislacao-radar',
    titulo: '7. Legislação, Radar Tributário e Alertas',
    subtitulo: 'Acompanhamento normativo em tempo real com botão de aplicação direta',
    categoria: 'legislacao',
    perfis: ['empresario', 'analista', 'admin', 'master'],
    resumo:
      'Radar normativo com aplicação de alíquotas na calculadora e explicador jurídico em linguagem simples.',
    conteudo: [
      'O módulo de Legislação (/legislacao) mantém o escritório e seus clientes sempre alinhados às novidades legislativas federais e estaduais da Reforma Tributária.',
      'É composto por dois pilares fundamentais:',
      '• Radar de Alertas Tributários: Feed dinâmico de novas portarias, instruções normativas e resoluções do Comitê Gestor do IBS. Cada alerta relevante conta com o botão "Aplicar na Calculadora", que abre o simulador pré-carregando o parâmetro ?aplicar correspondente para testar o impacto imediato.',
      '• Explicador de Legislação: Tradutor do texto jurídico para linguagem empresarial simples e direta, destacando o que muda na prática, prazos de adequação e setores impactados.',
      'Adicionalmente, os administradores contam com uma aba de gestão em /admin para disparar comunicados por e-mail sobre novos alertas fiscais.',
    ],
    itensDestaque: [
      {
        rotulo: 'Conexão Direta Radar → Calculadora',
        descricao:
          'Ao clicar em "Aplicar na Calculadora", a alíquota temporária ou benefício do alerta é testado instantaneamente na simulação do cliente.',
      },
      {
        rotulo: 'Tradução para Linguagem Empresarial',
        descricao:
          'Facilita a comunicação do contador com o cliente, eliminando o "juridiquês" sem perder a precisão normativa.',
      },
    ],
  },
  {
    id: 'relatorios-dossies',
    titulo: '8. Central de Relatórios e Dossiês Personalizados',
    subtitulo: 'Pareceres individuais, Relatório Consolidado e montador de dossiês',
    categoria: 'relatorios',
    perfis: ['empresario', 'analista', 'admin', 'master'],
    resumo:
      'Geração de pareceres técnicos em PDF de alta qualidade para apresentação a clientes e conselhos.',
    conteudo: [
      'A plataforma oferece três modalidades complementares de relatórios em PDF:',
      '1. Pareceres Individuais: Cada ferramenta (Calculadora IBS/CBS, Recuperador de Créditos, Fornecedores e cada etapa da trilha) possui botão próprio para emissão de seu respectivo parecer técnico especializado.',
      '2. Relatório Consolidado da Trilha (/diagnostico-relatorio): Visão única que sintetiza o Diagnóstico 360°, a matriz de riscos, o cronograma de transição, a comparação de regimes e a análise de fornecedores.',
      '3. Meus Relatórios (/meus-relatorios): Construtor inteligente de dossiês personalizados que permite ao usuário ou analista selecionar quais blocos deseja combinar (Calculadora + Recuperador + Diagnósticos), salvando versões históricas regeneráveis a qualquer momento.',
    ],
    itensDestaque: [
      {
        rotulo: 'Identidade Visual Padronizada',
        descricao:
          'Todos os PDFs seguem o design executivo Diamond Group (faixa superior Navy #07132B, filete dourado #D4AF37 e numeração de páginas profissional).',
      },
      {
        rotulo: 'Personalização com Dados do Escritório',
        descricao:
          'Analistas podem personalizar o cabeçalho e rodapé dos pareceres com o nome, logotipo e registro CRC do seu próprio escritório contábil.',
      },
    ],
  },
  {
    id: 'crm-metas-agendamento',
    titulo: '9. Gestão do Escritório: CRM, Metas e Agendamento',
    subtitulo: 'Esteira comercial de 6 abas, acompanhamento de metas e agenda integrada',
    categoria: 'crm',
    perfis: ['analista', 'admin', 'master'],
    resumo:
      'Ferramental completo para o analista gerenciar prospecções, carteira de clientes, reuniões e metas de receita.',
    conteudo: [
      'Para os perfis Analista, Admin e Master, a Contabilidade 5.0 atua como o sistema de gestão do escritório, centralizando as frentes comercial e operacional:',
      '• CRM com Ficha em 6 Abas (/crm e /crm/cliente/:id): Pipeline comercial que organiza os clientes por estágio no funil de vendas. A ficha individual do cliente reúne: 1. Dados Cadastrais e Perfil; 2. Histórico de Diagnósticos; 3. Simulações da Calculadora; 4. Créditos Levantados; 5. Tarefas e Compromissos; 6. Anotações e Linha do Tempo.',
      '• Carteira e Clientes (/carteira e /clientes): Gestão consolidada de todas as empresas atendidas pelo analista, com visão de faturamento global, regime tributário e relatórios emitidos.',
      '• Agendamento de Reuniões (/agendamento): Sistema onde empresários e analistas podem agendar reuniões de diagnóstico ou acompanhamento mensal, registrando data, horário, pauta e link da videoconferência.',
      '• Dashboard de Metas (/metas): Painel de controle que cruza dados do CRM para apurar em tempo real: captação de novos clientes, receita recorrente gerada, volume de créditos tributários recuperados e diagnósticos concluídos no mês.',
    ],
    itensDestaque: [
      {
        rotulo: 'Ficha em 6 Abas Unificada',
        descricao:
          'Elimina planilhas avulsas ao reunir histórico tributário, contatos, tarefas e reuniões em uma única interface organizada.',
      },
      {
        rotulo: 'Apuração Automática de Metas',
        descricao:
          'As metas do escritório são alimentadas automaticamente conforme novos diagnósticos e contratos são concluídos no CRM.',
      },
    ],
  },
  {
    id: 'admin-backoffice-mercado',
    titulo: '10. Módulos Corporativos: Admin, Back Office e Créditos',
    subtitulo: 'Painel administrativo global, Back Office White-Label e Mercado de Precatórios',
    categoria: 'admin',
    perfis: ['admin', 'master'],
    resumo:
      'Ferramentas de governança corporativa, expansão white-label e intermediação de créditos judiciais e precatórios.',
    conteudo: [
      'Os módulos corporativos atendem às lideranças do sistema e conferem poder de escala ao negócio:',
      '• Painel Administrativo (/admin): Estruturado em abas estratégicas (Visão Global de Clientes, Analistas & Parceiros, Usuários & Permissões, Reuniões Agendadas, Fila do Mercado de Créditos e Radar Tributário). Apenas o perfil Master pode promover novos administradores.',
      '• Back Office 5.0 White-Label (/servicos/back-office-50): Modelo de parceria comercial onde o escritório parceiro atua na ponta comercial e a Contabilidade 5.0 funciona como fábrica técnica de inteligência fiscal, processando diagnósticos com a marca do parceiro.',
      '• Mercado de Créditos e Precatórios (/mercado-creditos): Balcão de liquidez para negociação de créditos tributários acumulados e precatórios judiciais. Os anúncios são mantidos anônimos entre os usuários e moderados de forma restrita pelo Admin e Master em /admin.',
    ],
    itensDestaque: [
      {
        rotulo: 'Governança Master Restrita',
        descricao:
          'Apenas o usuário Master (Dr. Marco Chagas) detém controle de eleição de admins e moderação de anúncios confidenciais.',
      },
      {
        rotulo: 'Escalabilidade White-Label',
        descricao:
          'O Back Office permite a pequenos e médios escritórios contábeis ofertarem consultoria de IBS/CBS de alto nível sem custos de desenvolvimento.',
      },
    ],
  },
  {
    id: 'vantagens-beneficios',
    titulo: '11. Vantagens e Benefícios Estratégicos',
    subtitulo: 'Os 7 grandes diferenciais que tornam a Contabilidade 5.0 indispensável',
    categoria: 'vantagens',
    perfis: ['empresario', 'analista', 'admin', 'master'],
    resumo:
      'Por que o sistema se destaca no mercado contábil brasileiro e gera retorno financeiro imediato.',
    conteudo: [
      'A adesão à Contabilidade 5.0 fundamenta-se em 7 vantagens e benefícios objetivos que transformam o escritório e a segurança do empresário:',
    ],
    itensDestaque: [
      {
        rotulo: '1. Vende-se sozinho',
        descricao:
          'O diagnóstico gratuito atrai o cliente de forma natural, e o parecer executivo em PDF com a marca do escritório fecha o contrato de consultoria.',
      },
      {
        rotulo: '2. Foco real na Reforma Tributária',
        descricao:
          'Enquanto a maioria dos escritórios e softwares ainda não possui ferramentas de IBS/CBS, a plataforma já entrega simulações completas da EC 132/2023 e LC 214/2025.',
      },
      {
        rotulo: '3. Decisão vira conta, não achismo',
        descricao:
          'O comparador de fornecedores calcula o custo líquido real e o preço de equilíbrio em segundos, orientando decisões de compra com dados matemáticos.',
      },
      {
        rotulo: '4. Fideliza clientes por 8 anos',
        descricao:
          'A transição tributária se estende de 2026 até 2033. O sistema acompanha e recalcula a rota da empresa ano a ano, garantindo receita recorrente ao escritório.',
      },
      {
        rotulo: '5. Gestão do escritório inclusa',
        descricao:
          'CRM completo, carteira de clientes, acompanhamento de metas e agendamento de reuniões na mesma assinatura, sem necessidade de ferramentas terceiras.',
      },
      {
        rotulo: '6. Inteligência Artificial embutida',
        descricao:
          'Assistente de análise fiscal nativo que explica os números complexos e esclarece dúvidas tributárias dos clientes em linguagem acessível.',
      },
      {
        rotulo: '7. Modelo White-Label e Back Office',
        descricao:
          'Possibilidade de revender diagnósticos e consultorias com a marca do escritório parceiro, contando com o apoio técnico de retaguarda.',
      },
    ],
  },
]
