/**
 * Contrato do documento jsPDF falso usado nas suítes sem navegador.
 *
 * `FakePdfCall` registra cada chamada de desenho; `FakeDocJsPdf` descreve a
 * superfície mínima replicada do jsPDF (text/lines/rect/roundedRect/triangle/
 * link/save/addPage/setPage/getNumberOfPages/splitTextToSize/getTextWidth/
 * setLineWidth/getImageProperties/setGState/setProperties/charSpace/internal).
 */
export interface FakePdfCall {
  kind: string
  args: unknown[]
}

export interface FakeGState {
  opacity?: number
  [k: string]: unknown
}

export interface FakeDocJsPdf {
  // desenho registrado
  text: (texto: unknown, x?: number, y?: number, options?: Record<string, unknown>) => void
  line: (x1: number, y1: number, x2: number, y2: number) => void
  lines: (linhas: number[][], x?: number, y?: number) => void
  rect: (x: number, y: number, w: number, h: number, style?: string) => void
  roundedRect: (
    x: number,
    y: number,
    w: number,
    h: number,
    rx: number,
    ry: number,
    style?: string,
  ) => void
  triangle: (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    style?: string,
  ) => void
  link: (x: number, y: number, w: number, h: number, options: unknown) => void
  save: (nomeArquivo?: string) => void
  output: (tipo?: string) => string | Blob
  addImage: (...args: unknown[]) => void

  // páginas
  addPage: () => void
  setPage: (n: number) => void
  getNumberOfPages: () => number
  currentPage: () => number

  // estado gráfico
  setTextColor: (r: number, g?: number, b?: number) => void
  setFillColor: (r: number, g?: number, b?: number) => void
  setDrawColor: (r: number, g?: number, b?: number) => void
  setFont: (nome?: string, estilo?: string) => void
  setFontSize: (tamanho: number) => void
  setCharSpace: (v: number) => void
  setGState: (gs: FakeGState) => void
  setProperties: (props: Record<string, unknown>) => void
  setLineWidth: (v: number) => void
  getTextWidth: (texto: string) => number
  splitTextToSize: (texto: string, maxWidth: number, options?: { fontSize?: number }) => string[]
  getImageProperties: (arquivo: string) => { width: number; height: number; fileType: string }

  // superfície interna replicada
  internal: {
    pageSize: { getWidth: () => number; getHeight: () => number }
    pages: string[][]
  }

  // log auditável de todas as chamadas
  calls: FakePdfCall[]
}
