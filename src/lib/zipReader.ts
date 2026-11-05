/**
 * Leitor mínimo de arquivos ZIP no navegador (sem dependências externas).
 *
 * Suporta entradas armazenadas (método 0) e desinfladas (método 8 / DEFLATE),
 * usando a API nativa DecompressionStream('deflate-raw') disponível nos
 * navegadores modernos. Não suporta ZIP64 (arquivos acima de 4GB) nem
 * criptografia — nesses casos devolve erro claro item a item.
 */

export interface EntradaZip {
  nome: string
  texto: string
}

const ASSINATURA_EOCD = 0x06054b50
const ASSINATURA_CD = 0x02014b50
const ASSINATURA_LFH = 0x04034b50

function lerUint16(v: DataView, offset: number): number {
  return v.getUint16(offset, true)
}

function lerUint32(v: DataView, offset: number): number {
  return v.getUint32(offset, true)
}

async function desinflar(dados: Uint8Array): Promise<string> {
  const stream = new Blob([dados.slice().buffer as ArrayBuffer])
    .stream()
    .pipeThrough(new DecompressionStream('deflate-raw'))
  const texto = await new Response(stream).text()
  return texto
}

/**
 * Extrai, de um buffer ZIP, o conteúdo em texto de todas as entradas .xml.
 * Lança Error com mensagem amigável quando o arquivo não é um ZIP válido.
 */
export async function extrairXmlsDeZip(
  buffer: ArrayBuffer,
  limiteArquivos = 500,
): Promise<EntradaZip[]> {
  const view = new DataView(buffer)

  if (buffer.byteLength < 22) {
    throw new Error('Arquivo ZIP vazio ou corrompido.')
  }

  // Localiza o End of Central Directory varrendo os últimos 64KB (comentário do ZIP)
  let posEocd = -1
  const limiteBusca = Math.max(0, buffer.byteLength - 22 - 65536)
  for (let i = buffer.byteLength - 22; i >= limiteBusca; i--) {
    if (lerUint32(view, i) === ASSINATURA_EOCD) {
      posEocd = i
      break
    }
  }
  if (posEocd < 0) {
    throw new Error('O arquivo não é um ZIP válido (estrutura central não encontrada).')
  }

  const totalEntradas = lerUint16(view, posEocd + 10)
  const offsetDiretorioCentral = lerUint32(view, posEocd + 16)
  if (offsetDiretorioCentral === 0xffffffff || totalEntradas === 0xffff) {
    throw new Error(
      'ZIP 64 bits não suportado nesta importação. Descompacte e envie os XMLs direto.',
    )
  }

  const decodificador = new TextDecoder('utf-8')
  const saida: EntradaZip[] = []
  let pos = offsetDiretorioCentral

  for (let i = 0; i < totalEntradas && pos + 46 <= buffer.byteLength; i++) {
    if (lerUint32(view, pos) !== ASSINATURA_CD) {
      break
    }
    const metodo = lerUint16(view, pos + 10)
    const tamanhoComprimido = lerUint32(view, pos + 20)
    const tamanhoNome = lerUint16(view, pos + 28)
    const tamanhoExtra = lerUint16(view, pos + 30)
    const tamanhoComentario = lerUint16(view, pos + 32)
    const offsetLocal = lerUint32(view, pos + 42)

    const nome = decodificador.decode(new Uint8Array(buffer, pos + 46, tamanhoNome))

    pos += 46 + tamanhoNome + tamanhoExtra + tamanhoComentario

    if (nome.endsWith('/') || tamanhoComprimido === 0) continue
    if (!nome.toLowerCase().endsWith('.xml')) continue
    if (saida.length >= limiteArquivos) break

    // Cabeçalho local: pula nome + extra do LFH para chegar aos dados
    if (offsetLocal + 30 > buffer.byteLength || lerUint32(view, offsetLocal) !== ASSINATURA_LFH) {
      continue
    }
    const nomeLenLfh = lerUint16(view, offsetLocal + 26)
    const extraLenLfh = lerUint16(view, offsetLocal + 28)
    const inicioDados = offsetLocal + 30 + nomeLenLfh + extraLenLfh
    if (inicioDados + tamanhoComprimido > buffer.byteLength) continue

    const dados = new Uint8Array(buffer, inicioDados, tamanhoComprimido)

    try {
      const texto = metodo === 0 ? decodificador.decode(dados) : await desinflar(dados)
      saida.push({ nome, texto })
    } catch {
      // Entrada individual corrompida: registrada como erro item a item fora daqui
      saida.push({ nome, texto: '' })
    }
  }

  if (saida.length === 0) {
    throw new Error('Nenhum arquivo XML encontrado dentro do ZIP.')
  }

  return saida
}
