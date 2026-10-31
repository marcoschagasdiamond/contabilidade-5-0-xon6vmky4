import type jsPDF from 'jspdf'
import { obterDadosEscritorioAtivo } from '@/services/escritorio'

export interface IdentidadeParecerEscritorio {
  nomeEscritorio: string
  responsavelTecnico: string
  cnpj: string
  cidadeUf: string
  textoRodape: string
  textoCabecalho: string
  ehPersonalizado: boolean
}

/**
 * Retorna os dados consolidados do emissor técnico para uso nos pareceres em PDF,
 * com fallback gracioso para 'Contabilidade 5.0' quando não preenchido.
 */
export function obterIdentidadeParecer(): IdentidadeParecerEscritorio {
  const dados = obterDadosEscritorioAtivo()

  const temEscritorio = Boolean(dados.escritorio_nome && dados.escritorio_nome.trim().length > 0)
  const nomeEscritorio = temEscritorio
    ? dados.escritorio_nome.trim()
    : 'Contabilidade 5.0 — Inteligência Tributária'

  const responsavelTecnico = (
    dados.escritorio_responsavel ||
    (temEscritorio ? 'Responsável Técnico' : 'Equipe Técnica Contabilidade 5.0')
  ).trim()

  const cidadeUf =
    [dados.escritorio_cidade, dados.escritorio_uf].filter(Boolean).join(' - ') || 'São Paulo - SP'
  const cnpj = dados.escritorio_cnpj ? dados.escritorio_cnpj.trim() : ''

  // Formatação solicitada: "Parecer emitido por [Escritório] — responsável técnico [Nome]"
  const textoRodape = temEscritorio
    ? `Parecer emitido por ${nomeEscritorio} — responsável técnico ${responsavelTecnico}`
    : 'Parecer emitido por Contabilidade 5.0 — Inteligência Tributária & Diagnósticos'

  const textoCabecalho = temEscritorio
    ? `${nomeEscritorio} | Responsável: ${responsavelTecnico}`
    : 'Contabilidade 5.0 • Inteligência Tributária'

  return {
    nomeEscritorio,
    responsavelTecnico,
    cnpj,
    cidadeUf,
    textoRodape,
    textoCabecalho,
    ehPersonalizado: temEscritorio,
  }
}

/**
 * Renderiza bloco padrão de rodapé nos PDFs com a identidade do escritório adquirente
 */
export function renderizarRodapeEscritorioPdf(
  doc: jsPDF,
  paginaAtual: number,
  totalPaginas: number,
  y: number = 285,
): void {
  const identidade = obterIdentidadeParecer()

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 130, 140)

  // Linha 1: Parecer emitido por [Escritório] — responsável técnico [Nome]
  doc.text(identidade.textoRodape, 14, y)

  // Lado direito: Paginação
  doc.text(`Página ${paginaAtual} de ${totalPaginas}`, 196, y, { align: 'right' })

  // Linha 2 (sub-rodapé com localização/CNPJ ou aviso legal)
  const subTexto =
    identidade.ehPersonalizado && (identidade.cnpj || identidade.cidadeUf)
      ? `${[identidade.cidadeUf, identidade.cnpj ? `CNPJ ${identidade.cnpj}` : ''].filter(Boolean).join(' • ')} — Documento gerado sob EC 132/2023 e LC 214/2025`
      : 'Documento gerado sob as diretrizes da Reforma Tributária (EC 132/2023 e LC 214/2025)'

  doc.setFontSize(6.5)
  doc.setTextColor(150, 160, 170)
  doc.text(subTexto, 14, y + 3.5)
}
