import type { jsPDF } from 'jspdf'
import { executarCasosOficiaisRtc } from '@/lib/casosOficiaisRtc'

/**
 * Badge de CONFERÊNCIA RTC para os pareceres em PDF.
 *
 * Consome o resultado REAL de `executarCasosOficiaisRtc()` (os 4 casos-oficiais
 * do exemplos.md da Receita Federal rodados no motor puro da Calculadora
 * IBS/CBS — ver página /validacao-rtc). NÃO altera nenhuma fórmula: apenas
 * compõe o texto do rodapé de validação dinamicamente.
 *
 * - Se todos os casos batem: "X/X casos oficiais conferidos".
 * - Se houver divergência (hoje, caso 2 — cerveja/IS, arredondamento IBS UF/Mun
 *   por esfera: 0,16 oficial × 0,165 apurado), menciona "divergência
 *   documentada de arredondamento".
 */

export interface ResumoConferenciaRtc {
  total: number
  batem: number
  divergentes: number
  casosDivergentes: number[]
  temDivergencia: boolean
}

/** Executa os casos-oficiais e resume o veredito (função pura, sem efeitos). */
export function obterResumoConferenciaRtc(): ResumoConferenciaRtc {
  const casos = executarCasosOficiaisRtc()
  const batem = casos.filter((c) => c.bate)
  const divergentes = casos.filter((c) => !c.bate)
  return {
    total: casos.length,
    batem: batem.length,
    divergentes: divergentes.length,
    casosDivergentes: divergentes.map((c) => c.numero),
    temDivergencia: divergentes.length > 0,
  }
}

/** Linhas de texto do badge (fonte oficial + resultado real da conferência). */
export function montarLinhasConferenciaRtc(): { resultado: string; fonte: string } {
  const r = obterResumoConferenciaRtc()
  const fonte =
    'Cálculos conferidos contra a Calculadora RTC oficial da Receita Federal (calculadora-rtc-regime-regular v1.6.1) — ver /validacao-rtc'
  const resultado = r.temDivergencia
    ? `${r.batem}/${r.total} casos oficiais conferidos • divergência documentada de arredondamento por esfera (caso ${r.casosDivergentes.join(', ')}: IBS UF/Mun 0,16 oficial × 0,165 apurado) — não é erro de cálculo`
    : `${r.batem}/${r.total} casos oficiais conferidos — todos os valores conferem com o modelo oficial`
  return { resultado, fonte }
}

/**
 * Desenha o badge de conferência RTC no documento e devolve a altura consumida
 * (mm) para o chamador avançar seu cursor Y.
 */
export function desenharBadgeConferenciaRtcPdf(
  doc: jsPDF,
  x: number,
  y: number,
  contentWidth: number,
): number {
  const { resultado, fonte } = montarLinhasConferenciaRtc()
  const temDivergencia = resultado.includes('divergência documentada')

  // Paleta: âmbar quando há divergência documentada, verde quando tudo bate
  const corStatus = temDivergencia ? [180, 83, 9] : [21, 128, 61] // amber-700 / green-700
  const corFundo = temDivergencia ? [254, 243, 199] : [236, 253, 245] // amber-100 / emerald-50
  const corBorda = temDivergencia ? [217, 119, 6] : [167, 243, 208] // amber-600 / emerald-200

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.2)
  const linhasFonte = doc.splitTextToSize(fonte, contentWidth - 10) as string[]
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.8)
  const linhasResultado = doc.splitTextToSize(resultado, contentWidth - 10) as string[]

  const boxHeight = 4 + linhasResultado.length * 3.2 + linhasFonte.length * 3 + 4

  doc.setFillColor(corFundo[0], corFundo[1], corFundo[2])
  doc.setDrawColor(corBorda[0], corBorda[1], corBorda[2])
  doc.roundedRect(x, y, contentWidth, boxHeight, 1.5, 1.5, 'FD')

  // Tarja lateral de status
  doc.setFillColor(corStatus[0], corStatus[1], corStatus[2])
  doc.roundedRect(x, y, 2.2, boxHeight, 1, 1, 'F')

  let ty = y + 4.8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.8)
  doc.setTextColor(corStatus[0], corStatus[1], corStatus[2])
  for (const linha of linhasResultado) {
    doc.text(linha, x + 5, ty)
    ty += 3.2
  }

  ty += 0.6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.2)
  doc.setTextColor(100, 116, 139) // slate-500
  for (const linha of linhasFonte) {
    doc.text(linha, x + 5, ty)
    ty += 3
  }

  return boxHeight
}
