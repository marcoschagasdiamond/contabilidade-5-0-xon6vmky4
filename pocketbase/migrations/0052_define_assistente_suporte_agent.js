migrate(
  (app) => {
    try {
      $ai.agents.delete(app, 'assistente-suporte-50')
    } catch (_) {}

    $ai.agents.define(app, {
      slug: 'assistente-suporte-50',
      name: 'Assistente de Suporte 5.0',
      description:
        'Agente nativo de suporte ao usuário do sistema Contabilidade 5.0 (Diamond Group). Orienta sobre recursos, navegação e dúvidas do manual do sistema.',
      systemPrompt:
        'Você é o Assistente de Suporte da plataforma Contabilidade 5.0 (Diamond Group).\n\n' +
        'SUA MISSÃO E IDENTIDADE:\n' +
        '- Atender usuários autenticados de todos os perfis (Empresário/Cliente, Analista, Admin e Master) em Português do Brasil (pt-BR).\n' +
        '- Esclarecer dúvidas operacionais: "como faço X?", "onde fica Y?", "o que significa Z?", "como emitir relatório?", "como cadastrar fornecedor?".\n' +
        '- Base de conhecimento oficial: o manual da plataforma Contabilidade 5.0 (visão geral, perfis de acesso, site institucional, trilha de diagnósticos 00 a 06, Calculadora IBS/CBS, Recuperador de Créditos, Legislação e Radar, Central de Relatórios e Dossiês, CRM/Metas/Agendamento, Admin/Back Office/Mercado de Créditos e Vantagens).\n\n' +
        'ESTILO E PADRÃO DE RESPOSTAS (VARREDURA v0.0.238):\n' +
        '- Respostas curtas, diretas e objetivas, estruturadas em blocos curtos (1 a 3 frases por parágrafo ou tópicos objetivos).\n' +
        '- Sem jargão técnico desnecessário, sem prolixidade.\n' +
        '- SEMPRE que fizer sentido operacional, indique o caminho exato na interface (exemplo: "Abra /diagnosticos → Etapa 06 — Análise de Fornecedores" ou "Acesse /minha-conta para ver seus dados cadastrais").\n' +
        '- Identidade Diamond Group: sobriedade, precisão executiva e cordialidade profissional.\n\n' +
        'LIMITES DE ESCOPO E TRANSIÇÃO PARA SUPORTE HUMANO:\n' +
        '- Seu escopo é o uso, navegação e funcionamento da plataforma Contabilidade 5.0.\n' +
        '- Se a dúvida do usuário fugir do escopo do sistema (por exemplo: consultoria tributária customizada para um caso fático complexo, planejamento sucessório sob medida, emissão de parecer jurídico assinado ou suporte comercial avançado), informe educadamente que um especialista do escritório pode ajudar e indique os contatos de atendimento humano do escritório:\n' +
        '  * E-mail: contato@contabilidade5.com.br\n' +
        '  * Telefone: +55 (11) 4002-8922\n' +
        '  * Horário: Segunda a Sexta, das 8h às 18h.',
      tier: 'fast',
      tools: [],
      memory: [
        {
          type: 'faq',
          payload: {
            qa: [
              {
                question: 'O que é a Contabilidade 5.0?',
                answer:
                  'A Contabilidade 5.0 é a plataforma digital integrada e estruturada em torno da Reforma Tributária (EC 132/2023 e LC 214/2025). Ela integra captação institucional, motor de simulação IBS/CBS, esteira de diagnósticos 00 a 06 e CRM de atendimento, no padrão visual executivo Diamond Group.',
              },
              {
                question: 'Quais são os perfis de acesso e planos do sistema?',
                answer:
                  'A plataforma possui 4 perfis:\n• Empresário / Cliente (R$ 127/mês): análise exclusiva da própria empresa, diagnósticos 00–06, calculadora e relatórios.\n• Analista (R$ 347/mês): gestão de carteira de clientes, CRM em 6 abas, metas, convites e emissão de pareceres por cliente.\n• Admin: visão corporativa global de clientes, analistas, leads e reuniões.\n• Master: controle total do sistema (Dr. Marco Chagas), back office e eleição de admins.',
              },
              {
                question: 'Como funciona o Modo Teste gratuito?',
                answer:
                  'O Modo Teste gratuito permite que novos usuários preencham diagnósticos, simulações de IBS/CBS e cálculos de fornecedores sem bloqueio prévio de tela, permitindo conhecer o sistema antes da contratação.',
              },
              {
                question: 'Como migrar de Empresário para Analista?',
                answer:
                  'Abra o menu da sua conta em /minha-conta ou clique na opção "Migrar para Analista". A migração libera a gestão multi-empresas, carteira de clientes, CRM e dashboard de metas.',
              },
              {
                question: 'O que é a Trilha de Diagnósticos 00 a 06 e onde ela fica?',
                answer:
                  'A trilha fica no hub /diagnosticos e reúne 7 etapas progressivas:\n• Etapa 00 — Diagnóstico 360° (/diagnostico-360): matriz semáforo em 7 frentes.\n• Etapa 01 — Configurações (/diagnostico-configuracoes): CNPJ, faturamento, compras e ano de transição (2026–2033).\n• Etapa 02 — Autoavaliação 7 Riscos (/diagnostico-autoavaliacao): maturidade e plano 30-60-90.\n• Etapa 03 — Transição Fiscal (/diagnostico-transicao): impacto em ERP e vendas.\n• Etapa 04 — Comparação de Regime (/diagnostico-regimes): PIS/COFINS/ICMS/ISS vs. IBS/CBS.\n• Etapa 05 — Enquadramento (/diagnostico): regime ótimo (Simples, Presumido ou Real).\n• Etapa 06 — Fornecedores (/diagnostico-fornecedores): auditoria de compras, crédito perdido e cotações.\n\nAo final, acesse o Relatório Consolidado em /diagnostico-relatorio.',
              },
              {
                question: 'Como cadastro um fornecedor ou importo cotações na Etapa 06?',
                answer:
                  'Abra /diagnostico-fornecedores (ou acesse /diagnosticos → Etapa 06). Na aba "Fornecedores", clique no botão "Novo Fornecedor" para cadastrar nome, CNPJ, regime tributário e valor de compras, ou use "Importar Planilha" para carga em lote. Na aba "Comparador de Cotações", você compara cotações entre fornecedores do Simples, Presumido e Real apurando o preço de equilíbrio.',
              },
              {
                question: 'O que é e como funciona a Calculadora IBS/CBS?',
                answer:
                  'A Calculadora fica em /calculadora-ibs-cbs e possui 6 módulos:\n• Módulo 1: Configurações e faturamento\n• Módulo 2: Calculadora Simples\n• Módulo 3: Comparativo de Regimes\n• Módulo 4: Simulador de Créditos e Estoque\n• Módulo 5: Cronograma de Transição 2026–2033\n• Módulo 6: Dashboard Executivo com Farol de Limites, Split Payment e Assistente de IA.',
              },
              {
                question: 'O que é Split Payment na Calculadora?',
                answer:
                  'O Split Payment calcula a retenção automática do IBS e da CBS no ato da liquidação financeira da fatura (cartão, Pix ou boleto), demonstrando o impacto financeiro imediato no fluxo de caixa líquido da empresa.',
              },
              {
                question: 'Como funciona o Recuperador de Créditos Tributários?',
                answer:
                  'O Recuperador fica em /recuperador-creditos. Ele realiza levantamento administrativo dos últimos 60 meses em 4 blocos (PIS/COFINS, IRPJ/CSLL, Folha/Previdenciário e Outros Tributos), aplica correção Selic mês a mês e gera parecer técnico em PDF pronto para protocolo ou apresentação.',
              },
              {
                question: 'Onde consulto a Legislação e o Radar Tributário?',
                answer:
                  'Acesse /legislacao. O módulo traz acompanhamento normativo em tempo real com botão "Aplicar na Calculadora" para testar alíquotas provisórias, além do Explicador de Legislação que traduz decretos e leis em linguagem empresarial direta.',
              },
              {
                question: 'Onde vejo e gero relatórios em PDF do sistema?',
                answer:
                  'Você pode gerar relatórios em:\n• Pareceres específicos: botões "Gerar Parecer" em cada tela (Calculadora, Recuperador, Fornecedores, Diagnósticos).\n• Relatório Consolidado 360°: /diagnostico-relatorio, agrupando todas as 7 etapas da trilha.\n• Central Meus Relatórios: /meus-relatorios, para montar dossiês personalizados e consultar histórico salvo.',
              },
              {
                question: 'Como o analista gerencia clientes, reuniões e metas?',
                answer:
                  'O Analista utiliza três ferramentas principais no menu superior:\n• Carteira (/carteira): lista de todas as empresas atendidas e atalho para a Ficha do Cliente.\n• CRM (/crm): funil de prospecção e ficha em 6 abas (cadastro, diagnósticos, simulações, créditos, tarefas e anotações).\n• Agendamento (/agendamento): marcação de videoconferências e reuniões mensais.\n• Metas (/metas): acompanhamento de receita e diagnósticos concluídos.',
              },
              {
                question: 'O que é o Back Office 5.0 e o Mercado de Créditos?',
                answer:
                  '• Back Office 5.0 (/servicos/back-office-50): solução white-label que permite a escritórios parceiros ofertarem consultoria de IBS/CBS com a própria marca, contando com o suporte técnico da Diamond Group.\n• Mercado de Créditos (/mercado-creditos): ambiente seguro e confidencial para intermediação de créditos judiciais, tributários e precatórios.',
              },
              {
                question: 'Onde configuro os dados da minha empresa ou do meu escritório?',
                answer:
                  '• Dados da Empresa: acesse /dados-empresa para preencher ou corrigir razão social, CNPJ, UF, regime, colaboradores e perfil de notas.\n• Dados do Escritório (apenas Analistas): acesse /dados-escritorio para cadastrar nome do escritório, CRC e logotipo para personalizar os relatórios em PDF.',
              },
            ],
          },
        },
        {
          type: 'text',
          payload: {
            text:
              'Manual Completo Contabilidade 5.0 — Estrutura e Rotas:\n' +
              '- Início e Institucional: / (Home), /servicos (12 serviços com os 5 Pilares 5.0), /blog, /contato, /planos.\n' +
              '- Trilha de Diagnósticos: /diagnosticos (Hub), /diagnostico-360 (Etapa 00), /diagnostico-configuracoes (Etapa 01), /diagnostico-autoavaliacao (Etapa 02), /diagnostico-transicao (Etapa 03), /diagnostico-regimes (Etapa 04), /diagnostico (Etapa 05 - Enquadramento), /diagnostico-fornecedores (Etapa 06), /diagnostico-relatorio (Relatório Consolidado 360°).\n' +
              '- Simuladores Fiscais: /calculadora-ibs-cbs (6 módulos, Farol, Split Payment, Assistente), /recuperador-creditos (4 blocos, Selic, laudo PDF).\n' +
              '- Inteligência Normativa: /legislacao (Radar de Alertas + Explicador de Leis), /reforma-tributaria (Hub com 6 submódulos da Reforma).\n' +
              '- Relatórios e Dossiês: /meus-relatorios (Montador de dossiês e histórico salvo), /dashboard-simulacoes (Histórico comparativo de simulações).\n' +
              '- Gestão do Analista: /carteira, /clientes, /crm, /crm/cliente/:id, /metas, /agendamento, /dados-escritorio.\n' +
              '- Conta e Administração: /minha-conta, /dados-empresa, /manual (Manual completo), /admin (Visão Global, Analistas & Parceiros, Usuários & Permissões, Leads, Reuniões, Mercado de Créditos).\n' +
              '- Mercado de Ativos: /mercado-creditos (disponível apenas para usuários logados).\n\n' +
              'Contato de Atendimento Humano Diamond Group:\n' +
              '- E-mail: contato@contabilidade5.com.br\n' +
              '- Telefone: +55 (11) 4002-8922\n' +
              '- Horário: Segunda a Sexta, das 8h às 18h.',
          },
        },
      ],
    })
  },
  (app) => {
    try {
      $ai.agents.delete(app, 'assistente-suporte-50')
    } catch (_) {}
  },
)
