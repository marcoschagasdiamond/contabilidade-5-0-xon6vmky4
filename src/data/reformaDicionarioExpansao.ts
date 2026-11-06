/**
 * Expansão do Dicionário/FAQ da Reforma Tributária (fase 2).
 * Novos cards no MESMO padrão dos existentes em reformaTributariaData.ts:
 *  - DICIONARIO_MNEMONICOS (SiglaMnemonic) — Dicionário Rápido (/reforma/dicionario)
 *  - CONFUSOES_COMUNS (ConfusaoComum) — Glossário e Fontes Oficiais (/reforma/glossario-fontes)
 * Nenhum termo existente é alterado ou removido: os arrays existentes continuam intactos
 * e os novos termos entram via concatenação (spread) nos pontos de consumo.
 */

import {
  CONFUSOES_COMUNS,
  DICIONARIO_MNEMONICOS,
  type ConfusaoComum,
  type SiglaMnemonic,
} from '@/data/reformaTributariaData'

// ==========================================================
// 1. NOVOS CARDS DO DICIONÁRIO RÁPIDO (MESMO PADRÃO SiglaMnemonic)
// ==========================================================
export const NOVOS_DICIONARIO_MNEMONICOS: SiglaMnemonic[] = [
  {
    sigla: 'Crédito Presumido',
    nomeOficial: 'Crédito Presumido da Agropecuária (art. 133 da LC 214/2025)',
    truqueMemoria: 'Crédito PRESUMIDO: o governo PRESUME o imposto que o produtor pagou',
    definicaoSimples:
      'Mecanismo em que quem compra diretamente do produtor agropecuário, do extrator ou do pescador artesanal recebe um crédito de IBS/CBS estimado pela lei, mesmo sem imposto destacado na nota. Em regra, 12% sobre a aquisição de bens primários (25% em alguns casos, como aves, suínos e leite de pequenos produtores), sem prejuízo do crédito real sobre a parcela tributada.',
    exemploPratico:
      'Um frigorífico compra bois de um pecuarista do Simples: sobre o valor da compra ele credita 12% como se o imposto já tivesse sido pago na fazenda, repassando o benefício para a cadeia e barateando a carne no varejo.',
    icone: 'Sprout',
  },
  {
    sigla: 'Trava de Referência',
    nomeOficial: 'Trava das Alíquotas de Referência (art. 423 da LC 214/2025)',
    truqueMemoria: 'A partir de 2037, a alíquota de referência só pode CAIR, nunca subir',
    definicaoSimples:
      'Garantia constitucional (art. 149-A da CF, incluído pela EC 132/2023) e legal de que, encerrada a transição, as alíquotas de referência do IBS e da CBS não podem exceder as fixadas na LC 214/2025. A partir de 2037, quando a soma atual (~26,5%) for superior à nova alíquota calculada pelo Senado e pelo CG-IBS, ela deve ser reduzida progressivamente até atingir o patamar calculado.',
    exemploPratico:
      'Se em 2037 a soma das alíquotas de referência apuradas pelo Senado e pelo CG-IBS der 26%, mas a lei fixou ~26,5%, a diferença é dada de volta ao contribuinte, reduzindo gradualmente as alíquotas ano a ano até o novo teto.',
    icone: 'Lock',
  },
  {
    sigla: 'NF IBS/CBS',
    nomeOficial: 'Documento Fiscal Eletrônico do IVA Dual (NF-e/NFC-e com IBS e CBS)',
    truqueMemoria: 'A nota continua a mesma, com os campos NOVOS de IBS e CBS',
    definicaoSimples:
      'Não existe uma "nota nova" paralela: os documentos fiscais eletrônicos atuais (NF-e, NFC-e e equivalentes) ganham campos próprios para o IBS e a CBS, incluindo a informação do teste do Comitê Gestor e, na transição, a dupla apuração dos tributos antigos e dos novos.',
    exemploPratico:
      'Em 2026 seu ERP já transmite a NF-e com as tags de teste do IBS/CBS; em 2027 a CBS de 8,8% passa a ser destacada de verdade no XML, e o ICMS/ISS coexistem até 2032.',
    icone: 'FileText',
  },
  {
    sigla: 'Ajuste Fino',
    nomeOficial: 'Fase de Ajuste Fino da Alíquota de Referência (art. 146 da ADCT)',
    truqueMemoria: 'Depois de 2037, o imposto só "afina": ou mantém, ou reduz',
    definicaoSimples:
      'Processo pelo qual, encerrada a transição, Senado e CG-IBS calculam a alíquota de referência realmente necessária para custear os gastos públicos. Enquanto a alíquota fixada em lei for maior que a apurada, ela é reduzida progressivamente; nunca pode ser majorada acima do teto da LC 214/2025.',
    exemploPratico:
      'Entre 2037 e 2078, a cada rodada de cálculo, se a alíquota apurada der menos que a fixada em lei, o IBS/CBS "afina para baixo", devolvendo a diferença ao contribuinte por meio de alíquotas menores.',
    icone: 'Sliders',
  },
  {
    sigla: 'CG-IBS',
    nomeOficial: 'Comitê Gestor do IBS',
    truqueMemoria: 'CG-IBS é o "IBS dos governadores e prefeitos": 27 estados geridos em rede',
    definicaoSimples:
      'Pessoa jurídica de direito público criada pela EC 132/2023 para administrar, arrecadar, distribuir e julgar o IBS em nome de estados, DF e municípios. Tem autarquia federativa, orçamento próprio e poder de regular procedimentos e julgar conflitos entre entes federados.',
    exemploPratico:
      'O portal do Comitê Gestor homologa o sistema emissor da sua empresa em 2026 (teste do IBS) e, depois de 2033, publica as alíquotas de referência do IBS de cada estado e município.',
    icone: 'Landmark',
  },
  {
    sigla: 'Fato Gerador',
    nomeOficial: 'Fato Gerador do IBS/CBS e Destaque na Nota Fiscal',
    truqueMemoria:
      'Fato gerador = momento em que o imposto "nasce": a entrega do bem ou do serviço',
    definicaoSimples:
      'O IBS e a CBS incidem sobre operações com bens materiais e serviços onerosos, inclusive locações e royalties. O tributo "nasce" na entrega do bem, no início ou término da prestação do serviço ou na disponibilização do direito de uso; o imposto deve estar destacado em campo próprio do documento fiscal, sem embutir preços.',
    exemploPratico:
      'Na entrega do caminhão vendido ou no aceite do relatório do projeto de TI, o fato gerador ocorre: a nota sai com o IBS e a CBS destacados em campo próprio, e o cliente PJ credita 100% do valor.',
    icone: 'FileCheck',
  },
  {
    sigla: 'DIBS',
    nomeOficial: 'Documento de Arrecadação do IBS e da CBS (DIBS / DAS-IBS-CBS)',
    truqueMemoria: 'DIBS é a "guia nova" do IVA Dual — uma só guia para IBS + CBS',
    definicaoSimples:
      'Documento de arrecadação unificado do novo sistema: consolida em uma única guia o IBS (estadual/municipal, arrecadado pelo CG-IBS) e a CBS (federal, arrecadada pela Receita Federal). Para empresas do regime regular substitui a lógica das guias separadas de ICMS, ISS, PIS e COFINS; no Simples Nacional a cobrança continua no DAS, com cotas partilhadas do IBS e da CBS.',
    exemploPratico:
      'Em vez de gerar guias separadas de ICMS, ISS e DARF de PIS/COFINS, o contador gera um único DIBS com a soma IBS + CBS da apuração, e o sistema reparte automaticamente cada centavo para União, estados e municípios.',
    icone: 'Receipt',
  },
  {
    sigla: 'Zona Franca de Manaus',
    nomeOficial: 'Tratamento Diferenciado da ZFM (arts. 421 a 433 da LC 214/2025)',
    truqueMemoria: 'A ZFM mantém o incentivo: crédito presumido de 60% no IBS/CBS',
    definicaoSimples:
      'O modelo da Zona Franca de Manaus é mantido: a Lei Complementar 214/2025 prevê crédito presumido de IBS/CBS de 60% para bens com fator Industrialização (FTI) igual ou superior a 20% produzidos na ZFM, além de manter o IPI na compra de produtos industrializados da região. O benefício é condicionado a investimento em P&D.',
    exemploPratico:
      'Uma fábrica de eletrônicos em Manaus mantém a competitividade: além do IPI mantido, credita 60% do IBS/CBS sobre o valor do produto com FTI ≥ 20%, investindo 5% do benefício em pesquisa e desenvolvimento.',
    icone: 'Factory',
  },
  {
    sigla: 'Lucro Presumido',
    nomeOficial: 'Regime de Tributação do Lucro Presumido (Lei 9.718/1998)',
    truqueMemoria: 'Lucro presumido: a Receita "presume" quanto você lucrou pelo seu setor',
    definicaoSimples:
      'Regime em que IRPJ e CSLL são calculados sobre uma base de lucro fixada em lei conforme a atividade (ex.: 8% de comércio/indústria, 32% de serviços), somada à receita. As contribuições PIS/COFINS são cumulativas (3,65% sobre a receita) e, na reforma, a CBS substitui PIS/COFINS e o Lucro Presumido passa a apurar IBS/CBS no regime regular, com crédito pleno.',
    exemploPratico:
      'Um escritório de serviços faturando R$ 6 milhões no Lucro Presumido paga IRPJ/CSLL sobre 32% da receita presumida; após a reforma, passa a apurar IBS/CBS (~26,5%) com crédito integral das despesas com nota fiscal.',
    icone: 'Calculator',
  },
  {
    sigla: 'Lucro Real',
    nomeOficial: 'Regime de Tributação do Lucro Real (Lei 9.718/1998)',
    truqueMemoria:
      'Lucro real: imposto sobre o lucro CONTÁBIL de verdade, apurado na contabilidade',
    definicaoSimples:
      'Regime em que IRPJ e CSLL incidem sobre o lucro contábil efetivo (receitas menos despesas dedutíveis), com escrituração contábil completa. Hoje com PIS/COFINS não-cumulativos (9,25%), na reforma passa a apurar IBS/CBS no regime regular com crédito financeiro pleno sobre todos os insumos, máquinas e serviços.',
    exemploPratico:
      'Uma indústria no Lucro Real faturando R$ 50 milhões apura o lucro contábil de verdade e credita integralmente as compras; na reforma, continua no regime regular, com IBS/CBS de ~26,5% e crédito pleno das entradas.',
    icone: 'Calculator',
  },
]

// ==========================================================
// 2. NOVOS CARDS DO GLOSSÁRIO/FAQ (MESMO PADRÃO ConfusaoComum)
// ==========================================================
export const NOVOS_CONFUSOES_COMUNS: ConfusaoComum[] = [
  {
    comparativo: 'Simples Tradicional versus Simples Híbrido',
    termoA: 'Simples Tradicional (tudo no DAS)',
    termoB: 'Simples Híbrido (IBS/CBS por fora)',
    diferencaPratica:
      'No Simples Tradicional a empresa recolhe tudo na guia única do DAS e transfere crédito proporcional ao cliente. No Simples Híbrido (art. 41, §3º da LC 214/2025) ela mantém IRPJ/CSLL/INSS no DAS mas recolhe IBS e CBS no regime regular, transferindo 100% de crédito ao cliente B2B. A opção é SEMESTRAL: janelas em março e setembro para valer no semestre seguinte (janela de 2026 vai até 30/10 e vale para o 1º semestre de 2027), e é possível renunciar na janela posterior — não é irretratável pelo ano.',
    dicaMnemônica:
      'Híbrido = opção SEMESTRAL: decide em março ou setembro para valer no semestre seguinte; arrependeu? Renuncia na janela seguinte.',
  },
  {
    comparativo: 'Lucro Presumido versus Lucro Real',
    termoA: 'Lucro Presumido (lucro fixado em lei)',
    termoB: 'Lucro Real (lucro contábil efetivo)',
    diferencaPratica:
      'No Lucro Presumido a Receita "presume" o lucro aplicando percentuais fixos sobre a receita (8% comércio/indústria, 32% serviços), com PIS/COFINS cumulativos. No Lucro Real o imposto incide sobre o lucro contábil de verdade, com escrituração completa e PIS/COFINS não-cumulativos (9,25%). Na reforma, ambos migram para o regime regular do IVA Dual, apurando IBS/CBS com crédito pleno; a diferença fica em IRPJ/CSLL e nas obrigações acessórias.',
    dicaMnemônica:
      'Presumido = lucro tabelado por setor (simples de apurar, mas pode pagar mais). Real = lucro apurado pela contabilidade (mais obrigações, menos distorção).',
  },
]

// ==========================================================
// 3. ARRAYS FINAIS — EXISTENTES PRESERVADOS + NOVOS NO FIM
// ==========================================================
export const DICIONARIO_MNEMONICOS_COMPLETO: SiglaMnemonic[] = [
  ...DICIONARIO_MNEMONICOS,
  ...NOVOS_DICIONARIO_MNEMONICOS,
]

export const CONFUSOES_COMUNS_COMPLETO: ConfusaoComum[] = [
  ...CONFUSOES_COMUNS,
  ...NOVOS_CONFUSOES_COMUNS,
]
