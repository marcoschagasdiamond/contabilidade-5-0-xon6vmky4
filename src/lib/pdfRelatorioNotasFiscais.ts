// Exportação da lista de Notas Fiscais em PDF e CSV.
// PDF segue o padrão de pdfRelatorioFornecedores.ts (jsPDF com fakeDoc injetável nos testes).

import { jsPDF } from 'jspdf'
import type { NotaFiscalRecord } from '@/services/notasFiscais'
import { calcularTotaisNotasFiscais } from '@/services/notasFiscais'

export function gerarCsvNotasFiscais(notas: NotaFiscalRecord[], nomeEmpresa: string): string {
  const esc = (v: unknown) => {
    const s = String(v ?? '')
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const linhas: string[] = []
  linhas.push(
    [
      'numero',
      'data_emissao',
      'cnpj_emitente',
      'nome_emitente',
      'valor_total',
      'valor_produtos',
      'regime_fornecedor',
      'origem',
    ]
      .map(esc)
      .join(';'),
  )
  for (const n of notas) {
    linhas.push(
      [
        n.numero,
        n.data_emissao || '',
        n.cnpj_emitente || '',
        n.nome_emitente || '',
        String(n.valor_total ?? ''),
        String(n.valor_produtos ?? ''),
        n.regime_fornecedor || '',
        n.origem || '',
      ]
        .map(esc)
        .join(';'),
    )
  }
  const tot = calcularTotaisNotasFiscais(notas)
  linhas.push('')
  linhas.push(`Empresa;${esc(nomeEmpresa)}`)
  linhas.push(`Notas;${tot.quantidade}`)
  linhas.push(`Valor total;${tot.valorTotal.toFixed(2)}`)
  linhas.push(`Valor produtos;${tot.valorProdutos.toFixed(2)}`)
  return linhas.join('\n')
}

export function baixarCsvNotasFiscais(notas: NotaFiscalRecord[], nomeEmpresa: string) {
  const conteudo = gerarCsvNotasFiscais(notas, nomeEmpresa)
  const blob = new Blob(['\ufeff' + conteudo], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'notas-fiscais.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const BRL = (v: number) =>
  (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function gerarPdfNotasFiscais(
  notas: NotaFiscalRecord[],
  nomeEmpresa: string,
  doc?: jsPDF,
): jsPDF {
  const pdf = doc || new jsPDF()
  const margem = 14
  let y = 20

  pdf.setFontSize(16)
  pdf.text('Notas Fiscais Importadas', margem, y)
  y += 7
  pdf.setFontSize(10)
  pdf.text(nomeEmpresa || 'Empresa não informada', margem, y)
  y += 6
  pdf.setFontSize(9)
  pdf.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, margem, y)
  y += 10

  const tot = calcularTotaisNotasFiscais(notas)
  pdf.setFontSize(10)
  pdf.text(`Notas: ${tot.quantidade}`, margem, y)
  pdf.text(`Valor total: ${BRL(tot.valorTotal)}`, margem + 45, y)
  pdf.text(`Valor produtos: ${BRL(tot.valorProdutos)}`, margem + 105, y)
  y += 8

  pdf.setFontSize(8)
  const colX = [margem, margem + 26, margem + 46, margem + 100, margem + 152, margem + 176]
  pdf.setFont('helvetica', 'bold')
  pdf.text('Número', colX[0], y)
  pdf.text('Emissão', colX[1], y)
  pdf.text('Emitente', colX[2], y)
  pdf.text('CNPJ', colX[3], y)
  pdf.text('Total', colX[4], y)
  pdf.text('Produtos', colX[5], y)
  pdf.setFont('helvetica', 'normal')
  y += 5
  pdf.line(margem, y - 3, 196, y - 3)

  for (const n of notas) {
    if (y > 280) {
      pdf.addPage()
      y = 20
    }
    const dataBr = n.data_emissao
      ? `${n.data_emissao.slice(8, 10)}/${n.data_emissao.slice(5, 7)}/${n.data_emissao.slice(0, 4)}`
      : '-'
    pdf.text(String(n.numero || '-').slice(0, 15), colX[0], y)
    pdf.text(dataBr, colX[1], y)
    pdf.text(String(n.nome_emitente || '-').slice(0, 32), colX[2], y)
    pdf.text(String(n.cnpj_emitente || '-').slice(0, 18), colX[3], y)
    pdf.text(BRL(n.valor_total), colX[4], y)
    pdf.text(BRL(n.valor_produtos), colX[5], y)
    y += 5
  }

  return pdf
}

export function baixarPdfNotasFiscais(notas: NotaFiscalRecord[], nomeEmpresa: string) {
  gerarPdfNotasFiscais(notas, nomeEmpresa).save('notas-fiscais.pdf')
}
