import type { ItemSimulacaoUnificado } from '@/services/dashboardSimulacoes'

function formatarMoeda(val?: number): string {
  if (typeof val !== 'number' || isNaN(val)) return 'R$ 0,00'
  return val.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  })
}

function escaparCsv(val: any): string {
  if (val === null || val === undefined) return '""'
  const str = String(val).replace(/"/g, '""')
  return `"${str}"`
}

export interface DadosLinhaComparativoCenario {
  anoLabel: string
  [key: string]: number | string
}

export interface CenarioComparadoExtraido {
  id: string
  nome: string
  empresa: string
  cnpj: string
  regime: string
  tipo: 'calculadora' | 'recuperador'
  impostoAtualAnual: number
  impostoProjetadoAnual: number
  economiaAnual: number
  aliquotaEfetiva?: number
  faturamentoMensal?: number
  evolucaoPorAno: Record<string, number> // chave: 'atual', '2026'..'2033' -> imposto projetado no ano
}

export function extrairDadosCenario(item: ItemSimulacaoUnificado): CenarioComparadoExtraido {
  if (item.tipo === 'calculadora' && item.rawCalculadora) {
    const raw = item.rawCalculadora
    const dash = raw.resultados?.resultadoDashboard
    const transicao = raw.resultados?.resultadoTransicao || []
    const comp = raw.resultados?.resultadoComparativo

    const pontoAtual = transicao.find((t) => t.ano === 'atual' || String(t.ano) === 'atual')
    const pontoPleno =
      transicao.find((t) => t.ano === 2033 || String(t.ano) === '2033') ||
      transicao[transicao.length - 1]

    let impostoAtualAnual = pontoAtual?.impostoEstimado || 0
    if (!impostoAtualAnual && comp) {
      const regimeEmpresa = raw.parametros?.regimeAtualFiltro || raw.parametros?.regimeAtualEmpresa
      if (regimeEmpresa === 'Lucro Real') {
        impostoAtualAnual = (comp.lucroReal?.totalEfetivo || 0) * 12
      } else if (regimeEmpresa === 'Simples Nacional') {
        impostoAtualAnual = (comp.simplesNacional?.totalEfetivo || 0) * 12
      } else {
        impostoAtualAnual = (comp.lucroPresumido?.totalEfetivo || 0) * 12
      }
    }

    const impostoProjetadoAnual =
      pontoPleno?.impostoEstimado ||
      (dash?.economiaAnualProjetada !== undefined
        ? Math.max(0, impostoAtualAnual - dash.economiaAnualProjetada)
        : 0)

    const economiaAnual =
      dash?.economiaAnualProjetada !== undefined
        ? dash.economiaAnualProjetada
        : impostoAtualAnual - impostoProjetadoAnual

    const evolucaoPorAno: Record<string, number> = {}
    transicao.forEach((t) => {
      const chave = String(t.ano)
      evolucaoPorAno[chave] = t.impostoEstimado || 0
    })

    return {
      id: item.id,
      nome: item.nome,
      empresa: item.empresa,
      cnpj: item.cnpj,
      regime: item.regime,
      tipo: 'calculadora',
      impostoAtualAnual,
      impostoProjetadoAnual,
      economiaAnual,
      aliquotaEfetiva: dash?.aliquotaEfetivaNova ?? item.aliquotaEfetiva,
      faturamentoMensal: item.faturamentoMensal,
      evolucaoPorAno,
    }
  }

  // Para Recuperador de Créditos
  const raw = item.rawRecuperador
  const totalIntegral =
    item.totalRecuperavelIntegral ||
    raw?.resultados?.totalIntegralCorrigido ||
    item.economiaAnualOuTotal ||
    0

  return {
    id: item.id,
    nome: item.nome,
    empresa: item.empresa,
    cnpj: item.cnpj,
    regime: item.regime,
    tipo: 'recuperador',
    impostoAtualAnual: 0,
    impostoProjetadoAnual: 0,
    economiaAnual: totalIntegral,
    aliquotaEfetiva: undefined,
    faturamentoMensal: undefined,
    evolucaoPorAno: {},
  }
}

/**
 * Gera o conteúdo CSV para a comparação de 2 a 4 cenários selecionados.
 */
export function gerarCsvComparacaoCenarios(cenarios: CenarioComparadoExtraido[]): string {
  const linhas: string[] = []

  const adicionarLinha = (...cols: (string | number | undefined | null)[]) => {
    linhas.push(cols.map(escaparCsv).join(';'))
  }

  adicionarLinha('CONTABILIDADE 5.0 — DIAMOND GROUP')
  adicionarLinha('DOSSIÊ COMPARATIVO DE CENÁRIOS E SIMULAÇÕES TRIBUTÁRIAS')
  adicionarLinha(
    'Data de Emissão',
    new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  )
  adicionarLinha('Total de Cenários Comparados', cenarios.length)
  adicionarLinha('')

  // 1. Identificação dos Cenários
  adicionarLinha('=== 1. IDENTIFICAÇÃO DOS CENÁRIOS SELECIONADOS ===')
  const cabecalhoCenarios = [
    'Parâmetro / Informação',
    ...cenarios.map((_, idx) => `Cenário #${idx + 1}`),
  ]
  adicionarLinha(...cabecalhoCenarios)

  adicionarLinha('Nome da Simulação', ...cenarios.map((c) => c.nome))
  adicionarLinha('Empresa / Razão Social', ...cenarios.map((c) => c.empresa || 'Não informada'))
  adicionarLinha('CNPJ', ...cenarios.map((c) => c.cnpj || 'Não informado'))
  adicionarLinha(
    'Tipo de Módulo',
    ...cenarios.map((c) =>
      c.tipo === 'calculadora' ? 'Calculadora IBS/CBS' : 'Recuperador de Créditos',
    ),
  )
  adicionarLinha('Regime Fiscal Aplicado', ...cenarios.map((c) => c.regime))
  adicionarLinha(
    'Faturamento Mensal',
    ...cenarios.map((c) => (c.faturamentoMensal ? formatarMoeda(c.faturamentoMensal) : '-')),
  )
  adicionarLinha('')

  // 2. Resultados e Carga Tributária Anual
  adicionarLinha('=== 2. RESULTADOS PRINCIPAIS E CARGA PROJETADA ===')
  adicionarLinha('Métrica Tributária', ...cenarios.map((_, idx) => `Cenário #${idx + 1}`))

  adicionarLinha(
    'Imposto Anual Sistema Atual',
    ...cenarios.map((c) =>
      c.tipo === 'calculadora' ? formatarMoeda(c.impostoAtualAnual) : 'N/A (Recuperador)',
    ),
  )
  adicionarLinha(
    'Imposto Projetado IBS/CBS (2033 Pleno)',
    ...cenarios.map((c) =>
      c.tipo === 'calculadora' ? formatarMoeda(c.impostoProjetadoAnual) : 'N/A (Recuperador)',
    ),
  )
  adicionarLinha(
    'Diferença Anual (IBS/CBS - Atual)',
    ...cenarios.map((c) => {
      if (c.tipo !== 'calculadora') return 'N/A'
      const dif = c.impostoProjetadoAnual - c.impostoAtualAnual
      return `${dif >= 0 ? '+' : ''}${formatarMoeda(dif)}`
    }),
  )
  adicionarLinha(
    'Economia Anual / Créditos Totais',
    ...cenarios.map((c) => formatarMoeda(c.economiaAnual)),
  )
  adicionarLinha(
    'Alíquota Efetiva Nova (%)',
    ...cenarios.map((c) =>
      c.aliquotaEfetiva !== undefined ? `${c.aliquotaEfetiva.toFixed(2)}%` : '-',
    ),
  )

  // Encontra o melhor cenário (menor carga projetada entre os da calculadora, ou maior economia)
  const cenariosCalc = cenarios.filter((c) => c.tipo === 'calculadora')
  let melhorCenarioId: string | null = null
  if (cenariosCalc.length > 0) {
    const sorted = [...cenariosCalc].sort(
      (a, b) => a.impostoProjetadoAnual - b.impostoProjetadoAnual,
    )
    melhorCenarioId = sorted[0].id
  } else if (cenarios.length > 0) {
    const sorted = [...cenarios].sort((a, b) => b.economiaAnual - a.economiaAnual)
    melhorCenarioId = sorted[0].id
  }

  adicionarLinha(
    'Classificação / Veredito',
    ...cenarios.map((c) =>
      c.id === melhorCenarioId ? 'MELHOR CENÁRIO (Menor Carga Projetada)' : 'Alternativo',
    ),
  )
  adicionarLinha('')

  // 3. Evolução Ano a Ano (2026–2033)
  if (cenariosCalc.length > 0) {
    adicionarLinha('=== 3. EVOLUÇÃO ANO A ANO DA TRANSIÇÃO (2026–2033) ===')
    adicionarLinha('Ano da Transição', ...cenarios.map((c) => `${c.nome} (R$)`))

    const anos = ['atual', '2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033']
    anos.forEach((ano) => {
      const label = ano === 'atual' ? 'Sistema Atual' : `Ano ${ano}`
      const valores = cenarios.map((c) => {
        if (c.tipo !== 'calculadora') return 'N/A'
        const val = c.evolucaoPorAno[ano]
        return val !== undefined ? formatarMoeda(val) : '-'
      })
      adicionarLinha(label, ...valores)
    })
    adicionarLinha('')
  }

  // Premissas e Aviso Legal
  adicionarLinha('=== 4. PREMISSAS TÉCNICAS E AVISO LEGAL ===')
  adicionarLinha('Legislação Aplicável', 'EC 132/2023, LC 214/2025 e regulamentos do CGIBS.')
  adicionarLinha(
    'Finalidade',
    'Consultiva e analítica baseada exclusivamente nas simulações salvas no sistema Contabilidade 5.0.',
  )
  adicionarLinha('Emissor', 'Diamond Group • Central de Inteligência Tributária')

  return '\uFEFF' + linhas.join('\r\n')
}

export function baixarCsvComparacaoCenarios(
  cenarios: CenarioComparadoExtraido[],
  nomeArquivo = 'comparacao_cenarios_tributarios',
): void {
  const csv = gerarCsvComparacaoCenarios(cenarios)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const dataIso = new Date().toISOString().slice(0, 10)

  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${nomeArquivo}_${dataIso}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
