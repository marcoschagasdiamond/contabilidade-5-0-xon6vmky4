/**
 * Utilitário seguro para captura de nós DOM em imagem usando html-to-image.
 * Protegido contra "Not allowed to access cross-origin stylesheet" (CORS de fontes externas).
 * Aplica sempre `skipFonts: true` e filtro para nós problemáticos, além de try/catch gracioso.
 */

declare global {
  interface Window {
    htmlToImage?: {
      toPng: (node: HTMLElement, options?: Record<string, unknown>) => Promise<string>
      toJpeg: (node: HTMLElement, options?: Record<string, unknown>) => Promise<string>
      toBlob: (node: HTMLElement, options?: Record<string, unknown>) => Promise<Blob | null>
      toSvg: (node: HTMLElement, options?: Record<string, unknown>) => Promise<string>
      toCanvas: (node: HTMLElement, options?: Record<string, unknown>) => Promise<HTMLCanvasElement>
      toPixelData: (
        node: HTMLElement,
        options?: Record<string, unknown>,
      ) => Promise<Uint8ClampedArray>
    }
  }
}

export interface CapturaImagemOptions {
  skipFonts?: boolean
  backgroundColor?: string
  quality?: number
  pixelRatio?: number
  filter?: (domNode: HTMLElement) => boolean
}

const OPCOES_SEGURAS_PADRAO: CapturaImagemOptions = {
  skipFonts: true,
  backgroundColor: '#07132B',
  pixelRatio: 2,
  filter: (node: HTMLElement) => {
    // Exclui links externos de stylesheet e elementos marcados para ignorar captura
    if (node && node.tagName) {
      const tag = node.tagName.toLowerCase()
      if (tag === 'link' && (node as HTMLLinkElement).rel === 'stylesheet') {
        return false
      }
    }
    if (node?.getAttribute?.('data-skip-capture') === 'true') {
      return false
    }
    return true
  },
}

/**
 * Captura um elemento DOM como Blob PNG de forma segura, evitando erros de stylesheet cross-origin.
 */
export async function capturarElementoParaBlob(
  elemento: HTMLElement,
  opcoes?: CapturaImagemOptions,
): Promise<Blob | null> {
  const lib = window.htmlToImage
  if (!lib || typeof lib.toBlob !== 'function') {
    throw new Error('Biblioteca de captura de imagem (html-to-image) não está carregada.')
  }

  const mergedOpts = {
    ...OPCOES_SEGURAS_PADRAO,
    ...opcoes,
    skipFonts: true, // Garante que skipFonts nunca seja sobrescrito para false
    filter: (node: HTMLElement) => {
      if (!OPCOES_SEGURAS_PADRAO.filter?.(node)) return false
      if (opcoes?.filter && !opcoes.filter(node)) return false
      return true
    },
  }

  try {
    return await lib.toBlob(elemento, mergedOpts as Record<string, unknown>)
  } catch (err: unknown) {
    console.error('[capturaImagem] Falha na geração do Blob via html-to-image:', err)
    throw err
  }
}

/**
 * Captura um elemento DOM como Data URL PNG (base64) de forma segura.
 */
export async function capturarElementoParaPng(
  elemento: HTMLElement,
  opcoes?: CapturaImagemOptions,
): Promise<string> {
  const lib = window.htmlToImage
  if (!lib || typeof lib.toPng !== 'function') {
    throw new Error('Biblioteca de captura de imagem (html-to-image) não está carregada.')
  }

  const mergedOpts = {
    ...OPCOES_SEGURAS_PADRAO,
    ...opcoes,
    skipFonts: true, // Garante que skipFonts nunca seja desativado
    filter: (node: HTMLElement) => {
      if (!OPCOES_SEGURAS_PADRAO.filter?.(node)) return false
      if (opcoes?.filter && !opcoes.filter(node)) return false
      return true
    },
  }

  try {
    return await lib.toPng(elemento, mergedOpts as Record<string, unknown>)
  } catch (err: unknown) {
    console.error('[capturaImagem] Falha na geração do PNG via html-to-image:', err)
    throw err
  }
}
