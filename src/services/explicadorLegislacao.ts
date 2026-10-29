import pb from '@/lib/pocketbase/client'
import { streamAgentChat } from '@/lib/skipAi'

export interface ExplicacaoNorma {
  id?: string
  chave_norma: string
  titulo: string
  tipo?: string
  numero?: string
  ano?: number
  tributo?: string
  orgao?: string
  link_oficial?: string
  o_que_e: string
  para_quem_importa: string
  na_pratica: string
  texto_completo?: string
  created?: string
  updated?: string
}

export interface NormaInputParaExplicacao {
  chave_norma: string
  titulo: string
  ementa: string
  tipo?: string
  numero?: string
  ano?: number | string
  tributo?: string
  orgao?: string
  link_oficial?: string
}

/**
 * Normaliza e gera chave estável para qualquer card de norma
 */
export function derivarChaveNorma(item: {
  id?: string
  titulo: string
  numero?: string
  ano?: number | string
  tributo?: string
}): string {
  if (item.id && !item.id.startsWith('temp-')) {
    return item.id.toLowerCase().replace(/[^a-z0-9_-]/g, '-')
  }
  const base = `${item.tributo || 'geral'}-${item.titulo}-${item.ano || ''}`
  return base
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}

/**
 * Faz o parse dos 3 blocos obrigatórios a partir do texto retornado pelo agente
 */
export function extrairTresBlocos(texto: string): {
  o_que_e: string
  para_quem_importa: string
  na_pratica: string
} {
  const limpo = texto.trim()

  let oQueE = ''
  let paraQuem = ''
  let naPratica = ''

  // Regex flexível para capturar "### O que é", "### Para quem importa", "### Na prática"
  // Aceita variações como "O que é:", "1. O que é", "## O que é", etc.
  const regexOQueE =
    /(?:###?\s*O que é[:\s]*|1[.)]\s*O que é[:\s]*)([\s\S]*?)(?=(?:###?\s*Para quem importa|2[.)]\s*Para quem importa|$))/i
  const regexParaQuem =
    /(?:###?\s*Para quem importa[:\s]*|2[.)]\s*Para quem importa[:\s]*)([\s\S]*?)(?=(?:###?\s*Na prática|3[.)]\s*Na prática|$))/i
  const regexNaPratica = /(?:###?\s*Na prática[:\s]*|3[.)]\s*Na prática[:\s]*)([\s\S]*?)$/i

  const matchOQueE = limpo.match(regexOQueE)
  const matchParaQuem = limpo.match(regexParaQuem)
  const matchNaPratica = limpo.match(regexNaPratica)

  if (matchOQueE && matchOQueE[1]) {
    oQueE = matchOQueE[1].trim()
  }
  if (matchParaQuem && matchParaQuem[1]) {
    paraQuem = matchParaQuem[1].trim()
  }
  if (matchNaPratica && matchNaPratica[1]) {
    naPratica = matchNaPratica[1].trim()
  }

  // Fallback caso o modelo não tenha usado marcadores exatos
  if (!oQueE && !paraQuem && !naPratica && limpo) {
    const paragrafos = limpo.split(/\n\s*\n/).filter((p) => p.trim().length > 0)
    if (paragrafos.length >= 3) {
      oQueE = paragrafos[0].trim()
      paraQuem = paragrafos[1].trim()
      naPratica = paragrafos.slice(2).join('\n\n').trim()
    } else if (paragrafos.length === 2) {
      oQueE = paragrafos[0].trim()
      paraQuem = 'Empresas e contribuintes sujeitos à incidência e à apuração deste tributo.'
      naPratica = paragrafos[1].trim()
    } else {
      oQueE = limpo
      paraQuem = 'Contribuintes, empresas e profissionais fiscais que atuam com este tributo.'
      naPratica = 'Adequação de procedimentos e acompanhamento dos lançamentos fiscais.'
    }
  }

  return {
    o_que_e: oQueE,
    para_quem_importa: paraQuem,
    na_pratica: naPratica,
  }
}

/**
 * Consulta cache no backend (PocketBase) por chave da norma
 */
export async function buscarExplicacaoEmCache(chave: string): Promise<ExplicacaoNorma | null> {
  if (!chave) return null

  // 1. Tentar via SDK PocketBase direto na coleção
  try {
    const record = await pb
      .collection('explicacoes_legislacao')
      .getFirstListItem<ExplicacaoNorma>(`chave_norma = "${chave.replace(/"/g, '')}"`)
    if (record && record.o_que_e) {
      return record
    }
  } catch {
    /* intentionally ignored */
  }

  // 2. Tentar via endpoint backend dedicado
  try {
    const res = await pb.send<{ encontrado: boolean; item: ExplicacaoNorma | null }>(
      `/backend/v1/legislacao/explicacao/${encodeURIComponent(chave)}`,
      { method: 'GET' },
    )
    if (res?.encontrado && res?.item) {
      return res.item
    }
  } catch (err) {
    console.warn('[Explicador] Erro ao consultar cache:', err)
  }

  return null
}

/**
 * Salva a explicação gerada no cache do backend
 */
export async function salvarExplicacaoNoCache(dados: ExplicacaoNorma): Promise<boolean> {
  try {
    // 1. Tentar pelo endpoint do hook
    await pb.send('/backend/v1/legislacao/salvar-explicacao', {
      method: 'POST',
      body: dados,
    })
    return true
  } catch (hookErr) {
    console.warn(
      '[Explicador] Erro no endpoint salvar-explicacao, tentando coleção direta:',
      hookErr,
    )
    try {
      let existingId: string | null = null
      try {
        const item = await pb
          .collection('explicacoes_legislacao')
          .getFirstListItem(`chave_norma = "${dados.chave_norma.replace(/"/g, '')}"`)
        existingId = item.id
      } catch {
        /* intentionally ignored */
      }

      if (existingId) {
        await pb.collection('explicacoes_legislacao').update(existingId, dados)
      } else {
        await pb.collection('explicacoes_legislacao').create(dados)
      }
      return true
    } catch (dbErr) {
      console.warn('[Explicador] Falha ao persistir na coleção explicacoes_legislacao:', dbErr)
      return false
    }
  }
}

export interface GerarExplicacaoOptions {
  norma: NormaInputParaExplicacao
  onChunk?: (textoParcial: string) => void
  signal?: AbortSignal
}

/**
 * Gera explicação leiga via agente nativo "explicador-legislacao" com streaming
 * e persistência automática no cache. Se já existir cache, retorna sem chamar o agente.
 */
export async function gerarExplicacaoNorma(
  opcoes: GerarExplicacaoOptions,
): Promise<ExplicacaoNorma> {
  const { norma, onChunk, signal } = opcoes
  const chave = norma.chave_norma || derivarChaveNorma(norma)

  // 1. Verifica cache inicial imediato
  const emCache = await buscarExplicacaoEmCache(chave)
  if (emCache && emCache.o_que_e) {
    if (onChunk) {
      onChunk(
        emCache.texto_completo ||
          `### O que é\n${emCache.o_que_e}\n\n### Para quem importa\n${emCache.para_quem_importa}\n\n### Na prática\n${emCache.na_pratica}`,
      )
    }
    return emCache
  }

  // 2. Chama stream do backend
  const baseUrl = import.meta.env.VITE_POCKETBASE_URL || ''
  const url = `${baseUrl}/backend/v1/legislacao/explicar-stream`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (pb.authStore.isValid && pb.authStore.token) {
    headers['Authorization'] = pb.authStore.token
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      chave_norma: chave,
      titulo: norma.titulo,
      ementa: norma.ementa,
      tipo: norma.tipo,
      numero: norma.numero,
      ano: norma.ano,
      tributo: norma.tributo,
      orgao: norma.orgao,
      link_oficial: norma.link_oficial,
    }),
    signal,
  })

  let textoAcumulado = ''
  let resultadoFinal = ''

  try {
    const streamResult = await streamAgentChat(res, {
      onChunk: (_delta, full) => {
        textoAcumulado = full
        if (onChunk) onChunk(full)
      },
      signal,
    })
    resultadoFinal = streamResult.content || textoAcumulado
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw err
    }
    // Se o stream falhou mas acumulou algum conteúdo, tenta aproveitá-lo
    if (!textoAcumulado) {
      throw err
    }
    resultadoFinal = textoAcumulado
  }

  // 3. Extrai os 3 blocos obrigatórios
  const blocos = extrairTresBlocos(resultadoFinal)

  const explicacaoFinal: ExplicacaoNorma = {
    chave_norma: chave,
    titulo: norma.titulo,
    tipo: norma.tipo,
    numero: norma.numero ? String(norma.numero) : undefined,
    ano:
      typeof norma.ano === 'number' ? norma.ano : parseInt(String(norma.ano || 0), 10) || undefined,
    tributo: norma.tributo,
    orgao: norma.orgao,
    link_oficial: norma.link_oficial,
    o_que_e: blocos.o_que_e,
    para_quem_importa: blocos.para_quem_importa,
    na_pratica: blocos.na_pratica,
    texto_completo: resultadoFinal,
  }

  // 4. Salva no cache do backend (não bloqueante)
  salvarExplicacaoNoCache(explicacaoFinal).catch((cacheErr) => {
    console.warn('[Explicador] Falha silenciosa ao salvar cache em background:', cacheErr)
  })

  return explicacaoFinal
}
