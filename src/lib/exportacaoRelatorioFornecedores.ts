// ============================================================================
// EXPORTAÇÃO DO RELATÓRIO DE FORNECEDORES — PDF (jsPDF) e CSV.
// Apenas formatação dos dados já agregados em relatorioFornecedores.ts.
// ============================================================================

import { jsPDF } from 'jspdf'
import type { RelatorioFornecedoresDados } from './relatorioFornecedores'
import { ROTULO_REGIME_FORNECEDOR } from './relatorioFornecedores'
import { formatarMoeda } from './calculadoraUtils'

const fmt = (v: number) => formatarMoeda(v)

const PDF_MARGEM = 14

function sanitize(v: unknown): string {
  return String(v ?? '')
    .replace(/\r?\n/g, ' ')
    .replace(/;/g, ',')
    .trim()
}

/** Baixa o relatório em CSV (;, BOM UTF-8 para Excel pt-BR). */
export function exportarRelatorioFornecedoresCsv(rel: RelatorioFornecedoresDados): void {
  const linhas: string[][] = []
  linhas.push(['Relatório de Fornecedores — Contabilidade 5.0'])
  if (rel.nomeEmpresa) linhas.push(['Empresa', sanitize(rel.nomeEmpresa)])
  linhas.push(['Gerado em', new Date().toLocaleString('pt-BR')])
  linhas.push([])
  linhas.push(['Resumo da carteira'])
  linhas.push(['Total de fornecedores', String(rel.totalFornecedores)])
  linhas.push(['Volume total de compras', fmt(rel.volumeTotalCompras)])
  linhas.push([])
  linhas.push(['Compras por regime'])
  linhas.push(['Regime', 'Fornecedores', 'Volume de compras'])
  rel.porRegime.forEach((r) => {
    linhas.push([sanitize(r.rotulo), String(r.quantidade), fmt(r.volume)])
  })
  linhas.push([])
  linhas.push(['% Compras do Simples Nacional'])
  linhas.push(['Configurado em Dados da Empresa', `${rel.pctConfigurado}%`])
  linhas.push([
    'Calculado pela carteira',
    rel.pctCarteira === null ? 'sem base (sem volumes informados)' : `${rel.pctCarteira}%`,
  ])
  linhas.push([
    'Divergência detectada',
    rel.divergenciaAviso ? 'SIM (ver aviso no relatório)' : 'não',
  ])
  linhas.push([])
  linhas.push(['Fornecedores-chave (maior volume)'])
  linhas.push([
    'Fornecedor',
    'CNPJ',
    'Regime',
    'Volume',
    '% da carteira',
    'Risco de vedação Simples',
  ])
  rel.fornecedoresChave.forEach((fc) => {
    linhas.push([
      sanitize(fc.fornecedor.nome),
      sanitize(fc.fornecedor.cnpj || ''),
      sanitize(ROTULO_REGIME_FORNECEDOR[fc.fornecedor.regime] || fc.fornecedor.regime),
      fmt(fc.volume),
      `${fc.pesoPercentual}%`,
      fc.riscoVedacao ? `SIM — ${sanitize(fc.rotulosVedacao.join('; '))}` : 'não',
    ])
  })
  linhas.push([])
  linhas.push(['Comparativo 2026–2033 (créditos por ano da transição)'])
  linhas.push(['Ano', 'Crédito aproveitável', 'Crédito perdido', 'Custo líquido'])
  rel.evolucaoAnos.forEach((e) => {
    linhas.push([
      String(e.ano),
      fmt(e.creditoAproveitavelTotal),
      fmt(e.creditoPerdidoTotal),
      fmt(e.custoLiquidoTotal),
    ])
  })

  const csv = '\uFEFF' + linhas.map((l) => l.map((c) => `"${sanitize(c)}"`).join(';')).join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `relatorio-fornecedores-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/** Baixa o relatório em PDF (paisagem). */
export function exportarRelatorioFornecedoresPdf(rel: RelatorioFornecedoresDados): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const largura = doc.internal.pageSize.getWidth()
  const alturaPag = doc.internal.pageSize.getHeight()
  let y = PDF_MARGEM

  const garantirEspaco = (necessario: number) => {
    if (y + necessario > alturaPag - PDF_MARGEM) {
      doc.addPage()
      y = PDF_MARGEM
    }
  }

  const titulo = (t: string) => {
    garantirEspaco(10)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(7, 19, 43)
    doc.text(t, PDF_MARGEM, y)
    y += 7
  }

  const linhaTexto = (
    txt: string,
    size = 9,
    bold = false,
    indent = 0,
    cor?: [number, number, number],
  ) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(size)
    if (cor) doc.setTextColor(...cor)
    else doc.setTextColor(40, 40, 40)
    const linhas = doc.splitTextToSize(txt, largura - PDF_MARGEM * 2 - indent)
    garantirEspaco(linhas.length * 4.5)
    doc.text(linhas, PDF_MARGEM + indent, y)
    y += linhas.length * 4.5 + 1.5
  }

  // Cabeçalho
  doc.setFillColor(7, 19, 43)
  doc.rect(0, 0, largura, 24, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(212, 175, 55)
  doc.text('Relatório de Fornecedores', PDF_MARGEM, 11)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)
  doc.text(
    `Contabilidade 5.0 — carteira de fornecedores sob a Reforma Tributária (IBS/CBS)${rel.nomeEmpresa ? ` • ${rel.nomeEmpresa}` : ''}`,
    PDF_MARGEM,
    17,
  )
  doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, largura - PDF_MARGEM, 17, {
    align: 'right',
  })
  y = 32

  titulo('1. Resumo da carteira')
  linhaTexto(`Total de fornecedores cadastrados: ${rel.totalFornecedores}`, 9, false, 3)
  linhaTexto(`Volume total de compras: ${fmt(rel.volumeTotalCompras)}`, 9, false, 3)
  y += 2

  titulo('2. Compras por regime tributário')
  rel.porRegime.forEach((r) => {
    linhaTexto(`• ${r.rotulo}: ${r.quantidade} fornecedor(es) — ${fmt(r.volume)}`, 9, false, 3)
  })
  if (rel.porRegime.length === 0) linhaTexto('Nenhum fornecedor com regime informado.', 9, false, 3)
  y += 2

  titulo('3. % de compras do Simples Nacional')
  linhaTexto(`Configurado em Dados da Empresa: ${rel.pctConfigurado}%`, 9, false, 3)
  linhaTexto(
    `Calculado pela carteira (volume dos optantes ÷ total): ${
      rel.pctCarteira === null ? 'sem base (sem volumes informados)' : `${rel.pctCarteira}%`
    }`,
    9,
    false,
    3,
  )
  if (rel.divergenciaAviso) {
    garantirEspaco(12)
    doc.setFillColor(254, 243, 199)
    doc.rect(PDF_MARGEM, y - 4, largura - PDF_MARGEM * 2, 10, 'F')
    linhaTexto(
      `AVISO: o % configurado (${rel.pctConfigurado}%) diverge do % calculado pela carteira (${
        rel.pctCarteira ?? 0
      }%). Revise o parâmetro em Dados da Empresa ou atualize os volumes de compra dos fornecedores.`,
      8.5,
      true,
      4,
      [146, 64, 14],
    )
    y += 2
  }
  y += 2

  titulo('4. Fornecedores-chave (maior volume de compras)')
  rel.fornecedoresChave.forEach((fc) => {
    linhaTexto(
      `• ${fc.fornecedor.nome} — ${fmt(fc.volume)} (${fc.pesoPercentual}% da carteira) • ${
        ROTULO_REGIME_FORNECEDOR[fc.fornecedor.regime] || fc.fornecedor.regime
      }`,
      9,
      true,
      3,
    )
    if (fc.riscoVedacao) {
      linhaTexto(
        `ALERTA DE RISCO (vedações Simples, art. 17 LC 123/2006): impacto nos créditos transferidos. Incisos marcados: ${fc.rotulosVedacao.join(
          '; ',
        )}.`,
        8.5,
        false,
        6,
        [185, 28, 28],
      )
    }
  })
  if (rel.fornecedoresChave.length === 0) linhaTexto('Nenhum fornecedor cadastrado.', 9, false, 3)
  y += 2

  titulo('5. Comparativo 2026–2033 (transição IBS/CBS)')
  rel.evolucaoAnos.forEach((e) => {
    linhaTexto(
      `• ${e.ano}: crédito aproveitável ${fmt(e.creditoAproveitavelTotal)} • crédito perdido ${fmt(
        e.creditoPerdidoTotal,
      )} • custo líquido ${fmt(e.custoLiquidoTotal)}`,
      9,
      false,
      3,
    )
  })
  if (rel.evolucaoAnos.length === 0)
    linhaTexto(
      'Sem comparativo anual calculado (cadastre fornecedores com volume de compras).',
      9,
      false,
      3,
    )

  y += 4
  garantirEspaco(10)
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7.5)
  doc.setTextColor(100, 100, 100)
  doc.text(
    'Relatório indicativo — não altera cálculos fiscais. Base legal: LC 123/2006 (vedações do Simples) e LC 214/2025 (transição IBS/CBS).',
    PDF_MARGEM,
    y,
  )

  doc.save(`relatorio-fornecedores-${new Date().toISOString().slice(0, 10)}.pdf`)
}
