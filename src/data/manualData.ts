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
      'A Contabilidade 5.0 é a plataforma corporativa orientada à Reforma Tributária (EC 132/2023 e LC 214/2025), unindo inteligência fiscal, geração de laudos técnicos e gestão operacional.',
      'O ecossistema integra em um único ambiente: captação ativa de clientes, simuladores numéricos de IBS/CBS, esteira de diagnósticos 00 a 06 e CRM de atendimento.',
      'Padrão visual Diamond Group (Navy #07132B, Dourado #D4AF37, Verde #2ECC71): sobriedade executiva, foco numérico rigoroso e ausência de elementos gráficos decorativos.',
      'Projeta a travessia 2026–2033: calcula split payment, crédito sobre estoque, custo líquido de fornecedores e gera pareceres em PDF para tomada de decisão imediata.',
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
      'O controle de acesso é segmentado pelo nível de permissão cadastrado (campo nivel_acesso), garantindo privacidade e separação funcional entre clientes e consultores.',
      'O Modo Teste gratuito permite que empresários e analistas explorem as simulações e diagnósticos da trilha antes de efetivar a contratação.',
      'A estrutura abaixo resume o investimento mensal, escopo e ferramentas disponíveis por categoria de usuário:',
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
      'Ambiente institucional desenhado para autoridade executiva e captação qualificada de empresas que buscam segurança na Reforma Tributária.',
      'Conta com hub normativo com 6 submódulos da Reforma (Visão Geral, Calendário, Dicionário, Impacto por Setor, Exceções e Split Payment), blog e formulários diretos de conversão.',
      'O portfólio reúne 12 serviços especializados, cada um estruturado rigorosamente nos "5 Pilares 5.0" característicos da Diamond Group:',
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
      'A esteira modular conduz a organização em 7 etapas progressivas (00 a 06), integradas no hub /diagnosticos com propagação automática de parâmetros:',
      '• Etapa 00 — Diagnóstico 360° (/diagnostico-360): matriz semáforo em 7 frentes (Financeiro, Investimentos, Societário, Fiscal, Tributário, Jurídico e Operacional).',
      '• Etapa 01 — Configurações (/diagnostico-configuracoes): parâmetros centrais da empresa (CNPJ, UF, faturamento, compras e ano de transição 2026–2033).',
      '• Etapa 02 — Autoavaliação 7 Riscos (/diagnostico-autoavaliacao): questionário técnico em 14 dimensões com score de maturidade e plano 30-60-90.',
      '• Etapa 03 — Transição Fiscal (/diagnostico-transicao): avaliação de dependência de incentivos e roteiro prático para sistemas ERP e vendas.',
      '• Etapa 04 — Comparação de Regime (/diagnostico-regimes): confronto dos tributos atuais (PIS/COFINS/ICMS/ISS) contra a incidência IBS/CBS.',
      '• Etapa 05 — Enquadramento (/diagnostico): cálculo numérico do regime ótimo (Simples, Presumido ou Real) com análise do Fator R e laudo em PDF.',
      '• Etapa 06 — Análise de Fornecedores (/diagnostico-fornecedores): auditoria de compras, crédito perdido por fornecedor do Simples, comparador de cotações com preço de equilíbrio e projeção 2026–2033.',
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
      'Motor tributário avançado estruturado em 6 módulos interligados em tempo real:',
      '• Módulo 1 — Configurações: empresa, receita, folha, compras e alíquotas diferenciadas no ano da transição.',
      '• Módulo 2 — Calculadora Simples: apuração unitária ágil do novo imposto para diagnósticos imediatos.',
      '• Módulo 3 — Comparativo de Regimes: confronto Simples vs. Presumido vs. Real sob o IVA Dual.',
      '• Módulo 4 — Simulador de Créditos: crédito financeiro amplo e tratamento do saldo de estoque na virada da lei.',
      '• Módulo 5 — Transição 2026–2033: evolução anual da fase-teste até a incidência plena em 2033.',
      '• Módulo 6 — Dashboard Executivo: Farol de limites, impacto de Split Payment no caixa e histórico comparativo.',
      'Assistente de IA integrado ao Dashboard para responder consultas técnicas e suporte ao parâmetro do Radar Tributário para testar alíquotas provisórias.',
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
      'Auditoria administrativa de indébitos fiscais dos últimos 60 meses, alinhada a decisões pacificadas do STF, STJ e Soluções de Consulta da Receita Federal.',
      'A ferramenta estrutura a apuração em 4 blocos técnicos:',
      '• PIS e COFINS: exclusão do ICMS e ISS da base, insumos não cumulativos, energia, fretes e monofásicos.',
      '• IRPJ e CSLL: subvenções de ICMS, exclusão de benefícios fiscais e deduções legais no Lucro Real e Presumido.',
      '• Folha e Previdenciário: verbas indenizatórias na base do INSS patronal (aviso prévio, terço de férias, primeiros 15 dias de afastamento).',
      '• Outros Tributos: ressarcimento de ICMS-ST e taxas sem respaldo constitucional.',
      'Aplica correção Selic mês a mês e gera parecer técnico em PDF pronto para instrução administrativa.',
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
      'Monitoramento normativo federal, estadual e municipal com foco prático no ambiente da Reforma Tributária.',
      'Estruturado em duas frentes complementares:',
      '• Radar de Alertas: acompanhamento contínuo de normas e propostas com botão "Aplicar na Calculadora" para testar impactos de alíquotas na hora.',
      '• Explicador de Legislação: síntese em linguagem empresarial direta sobre prazos, impactos operacionais e setores atingidos.',
      'Os administradores contam com ferramenta no painel /admin para comunicar novos alertas fiscais a analistas e clientes.',
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
      'Emissão de dossiês executivos em PDF com a identidade Diamond Group e personalização opcional do escritório contábil:',
      '• Pareceres Técnicos Individuais: emissão direta em cada etapa (Calculadora, Recuperador, Fornecedores e Diagnósticos).',
      '• Relatório Consolidado (/diagnostico-relatorio): visão 360° unificada agrupando riscos, transição fiscal, comparação de regimes e compras.',
      '• Central Meus Relatórios (/meus-relatorios): montador modular de dossiês customizados com histórico de versões salvas.',
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
      'Central de gestão para os perfis Analista, Admin e Master, integrando pipeline comercial e rotina consultiva:',
      '• CRM em 6 Abas (/crm): funil por etapas e ficha com cadastro, diagnósticos, simulações, créditos, tarefas e anotações.',
      '• Carteira de Clientes (/carteira): visão unificada de empresas atendidas, regimes, faturamento e relatórios gerados.',
      '• Agendamento de Reuniões (/agendamento): calendário com pauta, horário e videoconferência para diagnósticos e reuniões mensais.',
      '• Dashboard de Metas (/metas): apuração automática de novas contratações, receita recorrente, créditos recuperados e diagnósticos.',
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
      'Ferramentas estratégicas de liderança, expansão de parcerias e liquidez de ativos fiscais:',
      '• Painel Administrativo (/admin): controle global de analistas, usuários, permissões restritas e moderação da plataforma.',
      '• Back Office 5.0 White-Label (/servicos/back-office-50): suporte técnico de retaguarda para escritórios parceiros atenderem com marca própria.',
      '• Mercado de Créditos e Precatórios (/mercado-creditos): balcão confidencial para aproximação de compradores e cedentes de créditos fiscais e judiciais.',
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
      'Sete diferenciais objetivos que consolidam autoridade técnica, previsibilidade de receita e segurança fiscal na Reforma Tributária:',
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
