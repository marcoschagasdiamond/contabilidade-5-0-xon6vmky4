/**
 * Serviço de Consulta Externa de CNAE (Contabilidade 5.0)
 *
 * Arquitetura resiliente de 3 camadas (idêntica ao padrão de consulta de CNPJ):
 * 1. Base curada interna local (0ms de latência, sem risco de rede)
 * 2. Proxy interno PocketBase (/backend/v1/cnae/codigo e /backend/v1/cnae/busca)
 * 3. Fallback direto para endpoints públicos do IBGE e BrasilAPI com timeout
 */

import { CNAES_CURADOS_BASE, type ItemCnaeCurado } from '@/data/cnaesCurados'
import type { SegmentoEmpresa } from '@/lib/regimes'
import { mapearCnaeParaSegmento } from '@/services/consultaCnpj'

export type ProvedorCnae = 'ibge' | 'brasilapi' | 'base_curada' | 'proxy_interno'

export interface ItemResultadoCnae {
  codigo: string // 7 dígitos numéricos, ex: '6201501'
  codigoFormatado: string // '6201-5/01'
  descricao: string
  secaoCodigo?: string
  secaoDescricao?: string
  divisaoCodigo?: string
  divisaoDescricao?: string
  grupoCodigo?: string
  grupoDescricao?: string
  classeCodigo?: string
  classeDescricao?: string
  segmentoSugerido: SegmentoEmpresa
  fonte: ProvedorCnae
  consultadoEm: string
}

export interface RespostaBuscaCnae {
  sucesso: boolean
  itens: ItemResultadoCnae[]
  total: number
  termo: string
  erro?: string
}

/**
 * Formata um código numérico de CNAE para o padrão oficial '0000-0/00'
 */
export function formatarCNAE(codigo: string | number | undefined | null): string {
  if (!codigo) return ''
  const limpo = String(codigo).replace(/\D/g, '')
  if (limpo.length === 7) {
    return `${limpo.slice(0, 4)}-${limpo.slice(4, 5)}/${limpo.slice(5, 7)}`
  }
  if (limpo.length === 5) {
    return `${limpo.slice(0, 4)}-${limpo.slice(4, 5)}`
  }
  return limpo
}

/**
 * Remove formatação e caracteres não numéricos
 */
export function limparCNAE(codigo: string | undefined | null): string {
  if (!codigo) return ''
  return String(codigo).replace(/\D/g, '').trim()
}

/**
 * Normaliza string para comparação sem acentos e minúscula
 */
function normalizar(texto: string | undefined | null): string {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Busca na base curada local por código ou termo
 */
export function buscarCnaeNaBaseCurada(termo: string): ItemResultadoCnae[] {
  const tLimpo = normalizar(termo)
  const codLimpo = limparCNAE(termo)
  const agora = new Date().toISOString()

  if (!tLimpo && !codLimpo) return []

  const partes = tLimpo.split(/\s+/).filter(Boolean)

  const resultados: ItemResultadoCnae[] = []

  for (const item of CNAES_CURADOS_BASE) {
    const itemCod = item.codigo
    const itemDesc = normalizar(item.descricao)

    const bateCodigoExato = codLimpo.length >= 4 && itemCod.startsWith(codLimpo)
    const bateDescricao =
      partes.length > 0 &&
      partes.every(
        (p) => itemDesc.includes(p) || item.tags.some((tag) => normalizar(tag).includes(p)),
      )

    if (bateCodigoExato || bateDescricao) {
      resultados.push({
        codigo: item.codigo,
        codigoFormatado: item.codigoFormatado,
        descricao: item.descricao,
        secaoCodigo: item.secaoCodigo,
        secaoDescricao: item.secaoDescricao,
        divisaoCodigo: item.divisaoCodigo,
        divisaoDescricao: item.divisaoDescricao,
        segmentoSugerido:
          item.segmentoSugerido || mapearCnaeParaSegmento(item.codigo, item.descricao),
        fonte: 'base_curada',
        consultadoEm: agora,
      })
    }
  }

  return resultados
}

/**
 * Consulta direta ao endpoint do IBGE por subclasse
 */
async function consultarIbgePorCodigo(codLimpo: string): Promise<ItemResultadoCnae | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 6000)

  try {
    const url = `https://servicodados.ibge.gov.br/api/v2/cnae/subclasses/${codLimpo}`
    const resp = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })

    if (!resp.ok) return null

    const json = await resp.json()
    const item = Array.isArray(json) ? json[0] : json

    if (!item || !item.id) return null

    const classe = item.classe || {}
    const grupo = classe.grupo || {}
    const divisao = grupo.divisao || {}
    const secao = divisao.secao || {}

    const idStr = String(item.id)
    const descricao = (item.descricao || '').trim()

    return {
      codigo: idStr,
      codigoFormatado: formatarCNAE(idStr),
      descricao,
      secaoCodigo: secao.id ? String(secao.id) : undefined,
      secaoDescricao: secao.descricao || undefined,
      divisaoCodigo: divisao.id ? String(divisao.id) : undefined,
      divisaoDescricao: divisao.descricao || undefined,
      grupoCodigo: grupo.id ? String(grupo.id) : undefined,
      grupoDescricao: grupo.descricao || undefined,
      classeCodigo: classe.id ? String(classe.id) : undefined,
      classeDescricao: classe.descricao || undefined,
      segmentoSugerido: mapearCnaeParaSegmento(idStr, descricao) as SegmentoEmpresa,
      fonte: 'ibge',
      consultadoEm: new Date().toISOString(),
    }
  } catch {
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Consulta via proxy PocketBase por código
 */
async function consultarProxyPorCodigo(codLimpo: string): Promise<ItemResultadoCnae | null> {
  const backendUrl = import.meta.env.VITE_POCKETBASE_URL
  if (!backendUrl) return null

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8000)

  try {
    const url = `${backendUrl.replace(/\/$/, '')}/backend/v1/cnae/codigo/${codLimpo}`
    const resp = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })

    if (!resp.ok) return null

    const json = await resp.json()
    if (!json.sucesso || !json.dados) return null

    const d = json.dados
    return {
      codigo: d.codigo,
      codigoFormatado: d.codigoFormatado || formatarCNAE(d.codigo),
      descricao: d.descricao,
      secaoCodigo: d.secaoCodigo || undefined,
      secaoDescricao: d.secaoDescricao || undefined,
      divisaoCodigo: d.divisaoCodigo || undefined,
      divisaoDescricao: d.divisaoDescricao || undefined,
      grupoCodigo: d.grupoCodigo || undefined,
      grupoDescricao: d.grupoDescricao || undefined,
      classeCodigo: d.classeCodigo || undefined,
      classeDescricao: d.classeDescricao || undefined,
      segmentoSugerido: mapearCnaeParaSegmento(d.codigo, d.descricao) as SegmentoEmpresa,
      fonte: (json.provedor as ProvedorCnae) || 'proxy_interno',
      consultadoEm: new Date().toISOString(),
    }
  } catch {
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Consulta via proxy PocketBase por busca textual
 */
async function consultarProxyPorTermo(termo: string): Promise<ItemResultadoCnae[]> {
  const backendUrl = import.meta.env.VITE_POCKETBASE_URL
  if (!backendUrl) return []

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    const url = `${backendUrl.replace(/\/$/, '')}/backend/v1/cnae/busca?q=${encodeURIComponent(termo)}`
    const resp = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })

    if (!resp.ok) return []

    const json = await resp.json()
    if (!json.sucesso || !Array.isArray(json.itens)) return []

    const agora = new Date().toISOString()
    return json.itens.map((it: any) => ({
      codigo: String(it.codigo),
      codigoFormatado: it.codigoFormatado || formatarCNAE(it.codigo),
      descricao: it.descricao,
      secaoCodigo: it.secaoCodigo || undefined,
      secaoDescricao: it.secaoDescricao || undefined,
      divisaoCodigo: it.divisaoCodigo || undefined,
      divisaoDescricao: it.divisaoDescricao || undefined,
      grupoCodigo: it.grupoCodigo || undefined,
      grupoDescricao: it.grupoDescricao || undefined,
      classeCodigo: it.classeCodigo || undefined,
      classeDescricao: it.classeDescricao || undefined,
      segmentoSugerido: mapearCnaeParaSegmento(it.codigo, it.descricao) as SegmentoEmpresa,
      fonte: (json.provedor as ProvedorCnae) || 'proxy_interno',
      consultadoEm: agora,
    }))
  } catch {
    return []
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Função principal: Busca de CNAE externa ou curada
 *
 * Suporta:
 *  - Código CNAE numérico (ex: "6201501" ou "6201-5/01")
 *  - Termo de busca textual (ex: "desenvolvimento de software", "transporte de cargas", "restaurante")
 */
export async function buscarCnaeExterna(termoOuCodigo: string): Promise<RespostaBuscaCnae> {
  const termo = (termoOuCodigo || '').trim()
  const codLimpo = limparCNAE(termo)

  if (!termo || termo.length < 2) {
    return {
      sucesso: false,
      itens: [],
      total: 0,
      termo,
      erro: 'Informe pelo menos 2 caracteres ou o código numérico do CNAE.',
    }
  }

  // 1. Se for código numérico de 4 a 7 dígitos, buscar pontualmente
  if (codLimpo.length >= 4 && codLimpo.length <= 7 && !/[a-zA-Z]/.test(termo)) {
    // 1.1 Tentar base curada local primeiro
    const curados = buscarCnaeNaBaseCurada(codLimpo)
    const exatoCurado = curados.find((c) => c.codigo === codLimpo)
    if (exatoCurado) {
      return {
        sucesso: true,
        itens: [exatoCurado],
        total: 1,
        termo,
      }
    }

    // 1.2 Tentar IBGE direto client-side
    const ibgeItem = await consultarIbgePorCodigo(codLimpo)
    if (ibgeItem) {
      return {
        sucesso: true,
        itens: [ibgeItem],
        total: 1,
        termo,
      }
    }

    // 1.3 Tentar proxy PocketBase
    const proxyItem = await consultarProxyPorCodigo(codLimpo)
    if (proxyItem) {
      return {
        sucesso: true,
        itens: [proxyItem],
        total: 1,
        termo,
      }
    }

    // 1.4 Se não achou exato, mas há parciais na base curada
    if (curados.length > 0) {
      return {
        sucesso: true,
        itens: curados,
        total: curados.length,
        termo,
      }
    }

    return {
      sucesso: false,
      itens: [],
      total: 0,
      termo,
      erro: `Nenhum CNAE encontrado para o código "${termo}". Verifique a numeração digitada.`,
    }
  }

  // 2. Busca por termo textual:
  // 2.1 Coleta da base curada instantaneamente
  const curadosTermo = buscarCnaeNaBaseCurada(termo)

  // 2.2 Coleta do proxy PocketBase / IBGE online
  const proxyItens = await consultarProxyPorTermo(termo)

  // 2.3 Unifica sem duplicidade pelo código CNAE
  const mapaUnico = new Map<string, ItemResultadoCnae>()

  for (const it of curadosTermo) {
    mapaUnico.set(it.codigo, it)
  }

  for (const it of proxyItens) {
    if (!mapaUnico.has(it.codigo)) {
      mapaUnico.set(it.codigo, it)
    }
  }

  const listaFinal = Array.from(mapaUnico.values())

  if (listaFinal.length === 0) {
    return {
      sucesso: false,
      itens: [],
      total: 0,
      termo,
      erro: `Nenhuma subclasse de CNAE encontrada para o termo "${termo}". Tente palavras-chave mais genéricas (ex: "software", "comércio", "transporte").`,
    }
  }

  return {
    sucesso: true,
    itens: listaFinal,
    total: listaFinal.length,
    termo,
  }
}
