import React from 'react'
import { Link } from 'react-router-dom'
import type { jsPDF } from 'jspdf'

export const TEXTO_AVISO_ORIENTATIVO_CURTO =
  'Nota orientativa: Esta análise é uma simulação aproximada da realidade, baseada nas informações fornecidas e na legislação vigente. Os valores não constituem parecer definitivo.'

export const TEXTO_AVISO_LEGAL_COMPLETO_PARTE_1 =
  'Aviso Legal: Os resultados deste relatório são uma mera orientação, gerados a partir das informações declaradas e da legislação aplicável na data da emissão. A análise aproxima-se da realidade, porém resultados precisos exigem validação documental e estudo aprofundado do caso concreto. Para um diagnóstico completo e um plano de ação seguro, contrate a equipe técnica do '

export const TEXTO_AVISO_LEGAL_COMPLETO_LINK = 'Diagnóstico 360°'

export const TEXTO_AVISO_LEGAL_COMPLETO_PARTE_2 = ' da Contabilidade 5.0.'

export const TEXTO_AVISO_LEGAL_COMPLETO_PLANO = `${TEXTO_AVISO_LEGAL_COMPLETO_PARTE_1}${TEXTO_AVISO_LEGAL_COMPLETO_LINK}${TEXTO_AVISO_LEGAL_COMPLETO_PARTE_2}`

export const URL_RELATIVO_DIAGNOSTICO_360 = '/servicos/diagnostico-360'

export function obterUrlAbsolutaDiagnostico360(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${URL_RELATIVO_DIAGNOSTICO_360}`
  }
  return `https://contabilidade50.com.br${URL_RELATIVO_DIAGNOSTICO_360}`
}

export interface AvisoOrientativoProps {
  variante?: 'curta' | 'completa'
  className?: string
  tema?: 'claro' | 'escuro'
}

/**
 * Componente AvisoOrientativo
 * Padrão Diamond Group: Navy #07132B, Dourado #D4AF37, texto em corpo menor, borda fina discreta, SEM ícones.
 */
export function AvisoOrientativo({
  variante = 'curta',
  className = '',
  tema = 'claro',
}: AvisoOrientativoProps) {
  if (variante === 'curta') {
    return (
      <div
        className={`rounded-lg px-3 py-2 text-[11px] leading-relaxed transition-colors border ${
          tema === 'escuro'
            ? 'bg-[#07132B]/80 text-slate-200 border-[#D4AF37]/35'
            : 'bg-white/95 text-slate-700 border-[#07132B]/15 shadow-sm'
        } ${className}`}
      >
        <span className="font-semibold text-[#07132B] dark:text-[#D4AF37] mr-1">
          Nota orientativa:
        </span>
        <span>
          Esta análise é uma simulação aproximada da realidade, baseada nas informações fornecidas e
          na legislação vigente. Os valores não constituem parecer definitivo.
        </span>
      </div>
    )
  }

  // Variante 'completa'
  return (
    <div
      className={`rounded-xl p-4 sm:p-5 text-xs leading-relaxed transition-colors border ${
        tema === 'escuro'
          ? 'bg-[#07132B] text-slate-200 border-[#D4AF37]/40 shadow-md'
          : 'bg-slate-50/90 text-slate-700 border-[#07132B]/15 shadow-sm'
      } ${className}`}
    >
      <span className="font-bold text-[#07132B] mr-1 block sm:inline">Aviso Legal:</span>
      <span>
        Os resultados deste relatório são uma mera orientação, gerados a partir das informações
        declaradas e da legislação aplicável na data da emissão. A análise aproxima-se da realidade,
        porém resultados precisos exigem validação documental e estudo aprofundado do caso concreto.
        Para um diagnóstico completo e um plano de ação seguro, contrate a equipe técnica do{' '}
      </span>
      <Link
        to={URL_RELATIVO_DIAGNOSTICO_360}
        className="font-bold text-[#07132B] hover:text-[#D4AF37] underline decoration-[#D4AF37] underline-offset-2 transition-colors inline-block"
      >
        {TEXTO_AVISO_LEGAL_COMPLETO_LINK}
      </Link>
      <span> da Contabilidade 5.0.</span>
    </div>
  )
}

/**
 * Helper para renderizar a 'Nota orientativa' curta em relatórios jsPDF
 * Padrão Diamond Group: Navy #07132B, Dourado #D4AF37, borda fina, SEM ícones
 */
export function desenharNotaCurtaPDF(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  corFundo: [number, number, number] = [248, 250, 252], // slate-50
): number {
  const margemInterna = 3
  const textoLargura = width - margemInterna * 2

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.2)
  const linhas = doc.splitTextToSize(TEXTO_AVISO_ORIENTATIVO_CURTO, textoLargura)
  const alturaBox = Math.max(8.5, linhas.length * 3.2 + 3.5)

  // Fundo
  doc.setFillColor(corFundo[0], corFundo[1], corFundo[2])
  doc.setDrawColor(212, 175, 55) // #D4AF37 Dourado suave
  doc.setLineWidth(0.2)
  doc.roundedRect(x, y, width, alturaBox, 1, 1, 'FD')

  // Borda lateral discreta em Navy #07132B
  doc.setFillColor(7, 19, 43)
  doc.rect(x, y, 1.2, alturaBox, 'F')

  // Texto
  doc.setTextColor(51, 65, 85) // slate-700
  doc.text(linhas, x + margemInterna + 1, y + 3.8)

  return alturaBox
}

/**
 * Helper para renderizar o 'Aviso Legal' completo na página final do PDF
 * Padrão Diamond Group: Navy #07132B, Dourado #D4AF37, borda fina, SEM ícones, link clicável absoluto
 */
export function desenharAvisoLegalCompletoPDF(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  urlAbsoluto?: string,
): number {
  const margemInterna = 4.5
  const textoLargura = width - margemInterna * 2
  const urlFinal = urlAbsoluto || obterUrlAbsolutaDiagnostico360()

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.8)
  const linhas = doc.splitTextToSize(TEXTO_AVISO_LEGAL_COMPLETO_PLANO, textoLargura)
  const alturaBox = Math.max(16, linhas.length * 3.6 + 6)

  // Box de fundo com borda fina em Dourado Diamond Group
  doc.setFillColor(248, 250, 252) // slate-50
  doc.setDrawColor(212, 175, 55) // #D4AF37 Dourado
  doc.setLineWidth(0.3)
  doc.roundedRect(x, y, width, alturaBox, 1.5, 1.5, 'FD')

  // Barra de realce lateral em Navy #07132B
  doc.setFillColor(7, 19, 43) // #07132B
  doc.rect(x, y, 2.2, alturaBox, 'F')

  // Texto normal
  doc.setTextColor(51, 65, 85)
  doc.text(linhas, x + margemInterna + 1.5, y + 4.8)

  // Adiciona anotação de link clicável no PDF sobre o box
  try {
    doc.link(x, y, width, alturaBox, { url: urlFinal })
  } catch {
    // ignore
  }

  return alturaBox
}
