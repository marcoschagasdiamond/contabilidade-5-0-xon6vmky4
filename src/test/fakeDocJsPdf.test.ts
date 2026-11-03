/**
 * Suíte de sanidade do documento jsPDF falso (fakeDocJsPdf).
 * Garante que a superfície mocada se comporta como o jsPDF real nos pontos
 * usados pelos geradores de PDF do projeto, antes de provar os blocos de PDF.
 */
import { describe, it, expect } from 'vitest'
import { gerarFakeDocJsPdf } from './fakeDocJsPdf'

describe('fakeDocJsPdf (documento jsPDF falso para testes sem navegador)', () => {
  it('delega text() e registra a chamada (texto, x, y, options)', () => {
    const doc = gerarFakeDocJsPdf()
    doc.text('bloco de teste', 10, 20)
    doc.text('alinhado à direita', 190, 20, { align: 'right' })
    const textos = doc.calls.filter((c) => c.kind === 'text')
    expect(textos).toHaveLength(2)
    expect(textos[0].args).toEqual(['bloco de teste', 10, 20])
    expect(textos[1].args[3]).toEqual({ align: 'right' })
  })

  it('splitTextToSize quebra frases longas em múltiplas linhas (respeitando maxWidth)', () => {
    const doc = gerarFakeDocJsPdf()
    const linhas = doc.splitTextToSize(
      'Cancelamentos de NF-e e devoluções devem ser conciliados com os estornos de crédito correspondentes.',
      60,
    )
    expect(Array.isArray(linhas)).toBe(true)
    expect(linhas.length).toBeGreaterThan(1)
    expect(linhas.join(' ')).toContain('conciliados')
  })

  it('setPage fora do intervalo lança erro (proteção contra índice inválido)', () => {
    const doc = gerarFakeDocJsPdf()
    expect(() => doc.setPage(2)).toThrow()
  })

  it('setPage navega para páginas existentes e addPage cria nova página', () => {
    const doc = gerarFakeDocJsPdf()
    doc.addPage()
    doc.addPage()
    doc.setPage(2)
    expect(doc.currentPage()).toBe(2)
    expect(doc.getNumberOfPages()).toBe(3)
    doc.setPage(1)
    expect(doc.currentPage()).toBe(1)
  })

  it('internal.pageSize expõe 210 x 297 (A4 em mm) e internal.pages tem 1 página inicial', () => {
    const doc = gerarFakeDocJsPdf()
    expect(doc.internal.pageSize.getWidth()).toBe(210)
    expect(doc.internal.pageSize.getHeight()).toBe(297)
    expect(doc.internal.pages).toHaveLength(2) // índice 0 reservado (não usado), 1 página real
  })

  it('save() é registrado com o nome do arquivo (sem I/O real)', () => {
    const doc = gerarFakeDocJsPdf()
    doc.save('parecer-teste.pdf')
    const saves = doc.calls.filter((c) => c.kind === 'save')
    expect(saves).toHaveLength(1)
    expect(saves[0].args[0]).toBe('parecer-teste.pdf')
  })

  it('linhas/rect/roundedRect/triangle/link são registrados com kind próprio', () => {
    const doc = gerarFakeDocJsPdf()
    doc.line(1, 2, 3, 4)
    doc.rect(1, 2, 3, 4, 'F')
    doc.roundedRect(1, 2, 3, 4, 1, 1, 'FD')
    doc.triangle(1, 2, 3, 4, 5, 6, 'FD')
    doc.link(1, 2, 3, 4, { url: 'https://contabilidade50.com.br' })
    const kinds = doc.calls.map((c) => c.kind)
    expect(kinds).toContain('line')
    expect(kinds).toContain('rect')
    expect(kinds).toContain('roundedRect')
    expect(kinds).toContain('triangle')
    expect(kinds).toContain('link')
  })

  it('getImageProperties devolve o mínimo exigido pelo jsPDF addImage', () => {
    const doc = gerarFakeDocJsPdf()
    const props = doc.getImageProperties('/img.png')
    expect(props.width).toBeGreaterThan(0)
    expect(props.height).toBeGreaterThan(0)
    expect(typeof props.fileType).toBe('string')
  })
})
