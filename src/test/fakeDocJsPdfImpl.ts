/**
 * Implementação do documento jsPDF FALSO para testes sem navegador.
 *
 * Registra TODAS as chamadas de desenho em um log auditável (`calls`), replicando
 * apenas os detalhes usados pelos geradores de PDF do projeto: splitTextToSize,
 * internal.pageSize (A4 210x297 mm), internal.pages, getNumberOfPages, setPage,
 * addPage, save, getImageProperties e os setters de estado gráfico.
 */
import type { FakeDocJsPdf, FakePdfCall, FakeGState } from './fakeDocJsPdfTypes'

export function gerarFakeDocJsPdf(): FakeDocJsPdf {
  const LARGURA_A4_MM = 210
  const ALTURA_A4_MM = 297

  // ── Estado mutável do documento ──────────────────────────────────────────────
  const pages: string[][] = [[]] // índice 0 reservado (jsPDF conta páginas a partir de 1)
  let tamanhoFonte = 12
  const calls: FakePdfCall[] = []

  const registrar = (kind: string, ...args: unknown[]) => {
    calls.push({ kind, args })
  }

  const doc = {
    // ── Desenho registrado ─────────────────────────────────────────────────────
    text: (texto: unknown, x?: number, y?: number, options?: Record<string, unknown>) => {
      registrar('text', texto, x, y, options)
    },
    line: (x1: number, y1: number, x2: number, y2: number) => registrar('line', x1, y1, x2, y2),
    lines: (linhas: number[][], x?: number, y?: number) => registrar('lines', linhas, x, y),
    rect: (x: number, y: number, w: number, h: number, style?: string) =>
      registrar('rect', x, y, w, h, style),
    roundedRect: (
      x: number,
      y: number,
      w: number,
      h: number,
      rx: number,
      ry: number,
      style?: string,
    ) => registrar('roundedRect', x, y, w, h, rx, ry, style),
    triangle: (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      x3: number,
      y3: number,
      style?: string,
    ) => registrar('triangle', x1, y1, x2, y2, x3, y3, style),
    link: (x: number, y: number, w: number, h: number, options: unknown) =>
      registrar('link', x, y, w, h, options),
    save: (nomeArquivo?: string) => registrar('save', nomeArquivo),
    output: (tipo?: string) => (tipo === 'blob' ? new Blob(['%PDF-fake']) : '%PDF-fake'),
    addImage: (...args: unknown[]) => registrar('addImage', ...args),

    // ── Páginas ────────────────────────────────────────────────────────────────
    addPage: () => {
      pages.push([])
      registrar('addPage')
    },
    setPage: (n: number) => {
      if (n < 1 || n > pages.length - 1) throw new Error(`setPage: página inválida ${n}`)
      registrar('setPage', n)
    },
    getNumberOfPages: () => pages.length - 1,
    currentPage: () => pages.length - 1,

    // ── Estado gráfico (registrado, sem efeito visual) ─────────────────────────
    setTextColor: (r: number, g?: number, b?: number) => registrar('setTextColor', r, g, b),
    setFillColor: (r: number, g?: number, b?: number) => registrar('setFillColor', r, g, b),
    setDrawColor: (r: number, g?: number, b?: number) => registrar('setDrawColor', r, g, b),
    setFont: (nome?: string, estilo?: string) => registrar('setFont', nome, estilo),
    setFontSize: (tamanho: number) => {
      tamanhoFonte = tamanho
      registrar('setFontSize', tamanho)
    },
    setCharSpace: (v: number) => registrar('setCharSpace', v),
    setGState: (gs: FakeGState) => registrar('setGState', gs),
    setProperties: (props: Record<string, unknown>) => registrar('setProperties', props),

    // ── Medição e quebra de texto ──────────────────────────────────────────────
    getTextWidth: (texto: string) => texto.length * 0.352 * (tamanhoFonte / 12),
    splitTextToSize: (
      texto: string,
      maxWidth: number,
      options?: { fontSize?: number },
    ): string[] => {
      const tamanho = options?.fontSize ?? tamanhoFonte
      const mmPorCaractere = 0.352 * (tamanho / 12)
      const maxCaracteres = Math.max(8, Math.floor(maxWidth / mmPorCaractere))
      const linhas: string[] = []
      String(texto)
        .split(/\s+/)
        .forEach((palavra) => {
          const ultima = linhas[linhas.length - 1]
          if (linhas.length === 0 || (ultima + ' ' + palavra).length > maxCaracteres) {
            linhas.push(palavra)
          } else {
            linhas[linhas.length - 1] = ultima + ' ' + palavra
          }
        })
      return linhas
    },

    // ── Imagens (stub: devolve o mínimo exigido por addImage) ──────────────────
    getImageProperties: (_arquivo: string) => ({ width: 64, height: 64, fileType: 'PNG' }),

    // ── Superfície interna replicada do jsPDF ──────────────────────────────────
    internal: {
      pageSize: {
        getWidth: () => LARGURA_A4_MM,
        getHeight: () => ALTURA_A4_MM,
      },
      pages,
    },
  } as unknown as FakeDocJsPdf

  return doc
}
