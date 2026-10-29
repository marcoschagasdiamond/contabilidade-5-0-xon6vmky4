migrate(
  (app) => {
    // 1. Coleção para cache e persistência das explicações geradas para normas
    const col = new Collection({
      name: 'explicacoes_legislacao',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin')",
      fields: [
        { name: 'chave_norma', type: 'text', required: true },
        { name: 'titulo', type: 'text', required: false },
        { name: 'tipo', type: 'text', required: false },
        { name: 'numero', type: 'text', required: false },
        { name: 'ano', type: 'number', required: false },
        { name: 'tributo', type: 'text', required: false },
        { name: 'orgao', type: 'text', required: false },
        { name: 'link_oficial', type: 'text', required: false },
        { name: 'o_que_e', type: 'text', required: false },
        { name: 'para_quem_importa', type: 'text', required: false },
        { name: 'na_pratica', type: 'text', required: false },
        { name: 'texto_completo', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_explicacoes_chave ON explicacoes_legislacao (chave_norma)',
        'CREATE INDEX idx_explicacoes_tributo ON explicacoes_legislacao (tributo)',
        'CREATE INDEX idx_explicacoes_created ON explicacoes_legislacao (created DESC)',
      ],
    })
    app.save(col)

    // 2. Definir o agente nativo Skip Cloud "explicador-legislacao"
    try {
      $ai.agents.delete(app, 'explicador-legislacao')
    } catch (_) {}

    $ai.agents.define(app, {
      slug: 'explicador-legislacao',
      name: 'Explicador de Legislação Tributária',
      description:
        'Agente tributário executivo para traduzir normas, leis, decretos e proposições em linguagem leiga, acessível e direta (Contabilidade 5.0 / Diamond Group).',
      systemPrompt: `Você é o Explicador de Legislação Tributária da Contabilidade 5.0 (Diamond Group).

SUA MISSÃO:
- Explicar normas tributárias (leis, decretos, emendas, instruções normativas, projetos de lei) para pessoas leigas e empresários que não dominam o juridiquês.
- Tornar o impacto da norma compreensível e objetivo em linguagem humana, profissional e sem complicação.

REGRA DE ESTRUTURAÇÃO OBRIGATÓRIA:
A sua resposta DEVE conter rigorosamente e unicamente estes TRÊS blocos curtos, sem introduções nem conclusões adicionais:

### O que é
[A norma em uma frase direta, simples e clara, sem juridiquês nem termos herméticos.]

### Para quem importa
[Segmentos econômicos, regimes tributários (ex: Simples Nacional, Lucro Presumido, Lucro Real) ou tipos de pessoas/empresas diretamente afetados pela norma.]

### Na prática
[O efeito real e prático no dia a dia do contribuinte ou da empresa (o que muda na obrigação, no recolhimento, nos créditos ou na rotina fiscal).]

DIRETRIZES DE FIDELIDADE (CRÍTICO):
1. Baseie-se ESTRITAMENTE na ementa, tipo, ano, tributo e dados oficiais fornecidos no prompt. NUNCA invente artigos, penalidades, alíquotas ou detalhes não informados.
2. Se a ementa ou os dados forem sucintos ou genéricos, seja igualmente prudente e genérico na explicação, sem fabricar números ou fatos.
3. Responda SEMPRE em Português do Brasil (pt-BR).
4. NÃO use emojis ou ícones nos cabeçalhos nem no texto (padrão sóbrio Diamond Group).
5. Mantenha os 3 títulos exatos: "### O que é", "### Para quem importa", "### Na prática".`,
      tier: 'fast',
      tools: [],
      memory: [],
    })
  },
  (app) => {
    try {
      $ai.agents.delete(app, 'explicador-legislacao')
    } catch (_) {}
    try {
      const col = app.findCollectionByNameOrId('explicacoes_legislacao')
      app.delete(col)
    } catch (_) {}
  },
)
