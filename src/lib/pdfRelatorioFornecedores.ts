/**
 * Exportação do Relatório de Fornecedores (visão de carteira) em PDF e CSV.
 *
 * Reaproveita os dados já calculados pela Etapa 06 (calculoFornecedores.ts) —
 * aqui não há nenhum cálculo fiscal novo, apenas formatação e agregação por
 * regime (Simples Nacional vs. Regime Regular) já agregada na tela.
 */

import { jsPDF } from 'jspdf'

export interface ItemRelatorioFornecedorChave {
  nome: string
  cnpj?: string
  regime: string
  volume: number
  pctVolume: number
  creditoPerdido: number
  riscoTexto?: string
}

export interface DadosRelatorioFornecedores {
  nomeEmpresa: string
  geradoEm: string
  ano: number
  regimeComprador: string
  totais: {
    simples: { quantidade: number; volume: number }
    regular: { quantidade: number; volume: number }
    misto: { quantidade: number; volume: number }
    semRegime: number
    totalFornecedores: number
    volumeTotal: number
  }
  pctCarteira: number | null
  pctConfigurado: number
  divergenciaPp: number | null
  chaves: ItemRelatorioFornecedorChave[]
  evolucaoAnos: Array<{
    ano: number
    creditoAproveitavelTotal: number
    creditoPerdidoTotal: number
    custoLiquidoTotal: number
  }>
  avisosVedacao: string[]
  baseLegalVedacoes: string
}

const fmtMoeda = (v: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtPct = (v: number) => `${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

export function gerarCsvRelatorioFornecedores(d: DadosRelatorioFornecedores): string {
  const linhas: string[] = []
  linhas.push('Relatorio de Fornecedores - Carteira de Compras')
  linhas.push(`Empresa;${d.nomeEmpresa || '-'}`)
  linhas.push(`Gerado em;${d.geradoEm}`)
  linhas.push(`Ano de referencia;${d.ano}`)
  linhas.push(`Regime do comprador;${d.regimeComprador}`)
  linhas.push('')
  linhas.push('Totais por regime')
  linhas.push('Regime;Fornecedores;Volume de compras (R$);% do volume total')
  linhas.push(
    `Simples Nacional;${d.totais.simples.quantidade};${fmtMoeda(d.totais.simples.volume)};${
      d.totais.volumeTotal > 0
        ? fmtPct((d.totais.simples.volume / d.totais.volumeTotal) * 100)
        : '0%'
    }`,
  )
  linhas.push(
    `Regime Regular (Lucro Real/Presumido);${d.totais.regular.quantidade};${fmtMoeda(
      d.totais.regular.volume,
    )};${d.totais.volumeTotal > 0 ? fmtPct((d.totais.regular.volume / d.totais.volumeTotal) * 100) : '0%'}`,
  )
  linhas.push(
    `Misto;${d.totais.misto.quantidade};${fmtMoeda(d.totais.misto.volume)};${
      d.totais.volumeTotal > 0 ? fmtPct((d.totais.misto.volume / d.totais.volumeTotal) * 100) : '0%'
    }`,
  )
  linhas.push(`Total;${d.totais.totalFornecedores};${fmtMoeda(d.totais.volumeTotal)};100%`)
  linhas.push(`Fornecedores sem regime informado;${d.totais.semRegime};;`)
  linhas.push('')
  linhas.push('Comparacao do % de compras do Simples Nacional')
  linhas.push(`Calculado pela carteira;${d.pctCarteira === null ? '-' : fmtPct(d.pctCarteira)}`)
  linhas.push(`Configurado em Dados da Empresa;${fmtPct(d.pctConfigurado)}`)
  linhas.push(
    d.divergenciaPp === null
      ? 'Divergencia (p.p.);-'
      : `Divergencia (p.p.);${d.divergenciaPp.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}`,
  )
  linhas.push('')
  linhas.push('Fornecedores-chave (maior volume)')
  linhas.push('Nome;CNPJ;Regime;Volume (R$);% do total;Credito perdido (R$);Alerta de risco')
  d.chaves.forEach((c) => {
    linhas.push(
      [
        c.nome,
        c.cnpj || '-',
        c.regime,
        fmtMoeda(c.volume),
        fmtPct(c.pctVolume),
        fmtMoeda(c.creditoPerdido),
        c.riscoTexto || 'Sem alerta',
      ]
        .map((v) => String(v).replace(/;/g, ','))
        .join(';'),
    )
  })
  linhas.push('')
  linhas.push('Comparacao 2026-2033 (creditos e custo liquido da carteira)')
  linhas.push('Ano;Credito aproveitado (R$);Credito perdido (R$);Custo liquido (R$)')
  d.evolucaoAnos.forEach((e) => {
    linhas.push(
      `${e.ano};${fmtMoeda(e.creditoAproveitavelTotal)};${fmtMoeda(e.creditoPerdidoTotal)};${fmtMoeda(e.custoLiquidoTotal)}`,
    )
  })
  if (d.avisosVedacao.length > 0) {
    linhas.push('')
    linhas.push('Alertas de vedacao (LC 123/2006)')
    d.avisosVedacao.forEach((a) => linhas.push(a.replace(/;/g, ',')))
  }
  linhas.push('')
  linhas.push(d.baseLegalVedacoes)

  return '\uFEFF' + linhas.join('\r\n')
}

export function baixarCsvRelatorioFornecedores(d: DadosRelatorioFornecedores): void {
  const csv = gerarCsvRelatorioFornecedores(d)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `relatorio-fornecedores-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// PDF
// ---------------------------------------------------------------------------

export function gerarPdfRelatorioFornecedores(d: DadosRelatorioFornecedores): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const M = 48
  const W = doc.internal.pageSize.getWidth() - M * 2
  let y = M

  const escrever = (
    texto: string,
    opts: {
      negrito?: boolean
      tamanho?: number
      cor?: [number, number, number]
      espacoDepois?: number
    } = {},
  ) => {
    doc.setFont('helvetica', opts.negrito ? 'bold' : 'normal')
    doc.setFontSize(opts.tamanho ?? 9)
    const cor = opts.cor ?? [40, 40, 40]
    doc.setTextColor(cor[0], cor[1], cor[2])
    const linhas = doc.splitTextToSize(texto, W) as string[]
    linhas.forEach((l) => {
      doc.text(l, M, y)
      y += (opts.tamanho ?? 9) * 1.35
    })
    y += opts.espacoDepois ?? 4
  }

  // Cabeçalho
  escrever('Relatório de Fornecedores — Carteira de Compras', {
    negrito: true,
    tamanho: 14,
    cor: [7, 19, 43],
  })
  escrever(
    `${d.nomeEmpresa || 'Empresa'} • Gerado em ${d.geradoEm} • Ano de referência: ${d.ano} • Regime do comprador: ${d.regimeComprador}`,
    { tamanho: 8.5, cor: [100, 100, 100], espacoDepois: 10 },
  )

  // Totais por regime
  escrever('1. Totais por regime', { negrito: true, tamanho: 10.5, cor: [7, 19, 43] })
  const pct = (v: number) =>
    d.totais.volumeTotal > 0 ? fmtPct((v / d.totais.volumeTotal) * 100) : '0%'
  escrever(
    `Simples Nacional: ${d.totais.simples.quantidade} fornecedor(es) — R$ ${fmtMoeda(d.totais.simples.volume)} (${pct(d.totais.simples.volume)} do volume)`,
  )
  escrever(
    `Regime Regular (Lucro Real/Presumido): ${d.totais.regular.quantidade} fornecedor(es) — R$ ${fmtMoeda(d.totais.regular.volume)} (${pct(d.totais.regular.volume)} do volume)`,
  )
  escrever(
    `Misto: ${d.totais.misto.quantidade} fornecedor(es) — R$ ${fmtMoeda(d.totais.misto.volume)} (${pct(d.totais.misto.volume)} do volume)`,
  )
  escrever(
    `Total da carteira: ${d.totais.totalFornecedores} fornecedor(es) — R$ ${fmtMoeda(d.totais.volumeTotal)}` +
      (d.totais.semRegime > 0 ? ` • ${d.totais.semRegime} sem regime informado` : ''),
    { espacoDepois: 10 },
  )

  // Comparação do %
  escrever('2. % de compras do Simples Nacional — carteira vs. configurado', {
    negrito: true,
    tamanho: 10.5,
    cor: [7, 19, 43],
  })
  escrever(
    `Calculado pela carteira: ${d.pctCarteira === null ? 'sem base (nenhum volume informado)' : fmtPct(d.pctCarteira)}`,
  )
  escrever(`Configurado em Dados da Empresa: ${fmtPct(d.pctConfigurado)}`)
  if (d.divergenciaPp !== null && Math.abs(d.divergenciaPp) > 5) {
    escrever(
      `⚠ Divergência de ${Math.abs(d.divergenciaPp).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} p.p. entre a carteira e o parâmetro configurado — revise a carteira ou atualize o campo em Dados da Empresa.`,
      { cor: [180, 90, 0] },
    )
  } else if (d.divergenciaPp !== null) {
    escrever('✓ Parâmetro coerente com a carteira cadastrada (diferença de até 5 p.p.).', {
      cor: [20, 110, 50],
    })
  } else {
    escrever(
      'Não foi possível calcular o % da carteira (cadastre fornecedores com regime e volume).',
      { cor: [120, 120, 120] },
    )
  }
  y += 6

  // Fornecedores-chave
  escrever('3. Fornecedores-chave (maior volume) e alertas de risco', {
    negrito: true,
    tamanho: 10.5,
    cor: [7, 19, 43],
  })
  if (d.chaves.length === 0) {
    escrever('Nenhum fornecedor cadastrado com volume informado.', { cor: [120, 120, 120] })
  } else {
    d.chaves.forEach((c, i) => {
      escrever(
        `${i + 1}. ${c.nome}${c.cnpj ? ` (${c.cnpj})` : ''} — ${c.regime} — R$ ${fmtMoeda(c.volume)} (${fmtPct(c.pctVolume)} do total)`,
        { negrito: true, tamanho: 9 },
      )
      if (c.creditoPerdido > 0) {
        escrever(`   Crédito perdido estimado no ano: R$ ${fmtMoeda(c.creditoPerdido)}`, {
          cor: [120, 120, 120],
        })
      }
      if (c.riscoTexto) {
        escrever(`   ⚠ ${c.riscoTexto}`, { cor: [180, 90, 0] })
      }
      y += 2
    })
  }
  y += 4

  // Evolução 2026-2033
  escrever('4. Comparação 2026–2033 (créditos e custo líquido da carteira)', {
    negrito: true,
    tamanho: 10.5,
    cor: [7, 19, 43],
  })
  d.evolucaoAnos.forEach((e) => {
    escrever(
      `${e.ano}: crédito aproveitado R$ ${fmtMoeda(e.creditoAproveitavelTotal)} • crédito perdido R$ ${fmtMoeda(e.creditoPerdidoTotal)} • custo líquido R$ ${fmtMoeda(e.custoLiquidoTotal)}`,
      { tamanho: 8.5 },
    )
  })
  y += 6

  // Vedações / base legal
  if (d.avisosVedacao.length > 0) {
    escrever('5. Alertas de vedação (LC 123/2006)', {
      negrito: true,
      tamanho: 10.5,
      cor: [7, 19, 43],
    })
    d.avisosVedacao.forEach((a) => escrever(`• ${a}`, { cor: [180, 90, 0], tamanho: 8.5 }))
    y += 4
  }
  escrever(d.baseLegalVedacoes, { tamanho: 7.5, cor: [130, 130, 130] })

  doc.save(`relatorio-fornecedores-${new Date().toISOString().slice(0, 10)}.pdf`)
}
