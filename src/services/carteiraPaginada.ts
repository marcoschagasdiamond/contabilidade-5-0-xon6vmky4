import pb from '@/lib/pocketbase/client'
import type { Cliente, ClienteRecord } from '@/types/cliente'

/**
 * Paginação server-side da /carteira (Fase 2).
 *
 * Reaproveita a MESMA composição de fontes de listarClientes() (coleção
 * clientes + crm_clientes + clientes_empresas), mas buscando por página via
 * page/perPage do PocketBase, para não carregar tudo de uma vez em carteiras
 * grandes. As regras de acesso das coleções (proteção por usuário + visão de
 * master) são aplicadas pelo servidor — nada muda aqui.
 *
 * Cada fonte tem seu próprio contador de página: como as coleções têm
 * tamanhos diferentes, paginar as três por um índice único deixaria buracos.
 * A deduplicação (mesmas chaves de listarClientes: CNPJ limpo ou id) é feita
 * pelo hook acumulador, que mescla as páginas já carregadas.
 */

export const TAMANHO_PAGINA_CARTEIRA = 30

/** Deixa só dígitos — usado para busca de CNPJ/CPF sem pontuação. */
export function limparCnpj(valor: string): string {
  return (valor || '').replace(/\D/g, '')
}

export type FonteCarteira = 'clientes' | 'crm_clientes' | 'clientes_empresas'

/** Próxima página a buscar em cada fonte (começa em 1). */
export interface EstadoPaginasFontes {
  clientes: number
  crm_clientes: number
  clientes_empresas: number
}

export function estadoPaginasInicial(): EstadoPaginasFontes {
  return { clientes: 1, crm_clientes: 1, clientes_empresas: 1 }
}

function paraClienteClientes(rec: ClienteRecord): Cliente {
  return {
    id: rec.id,
    user_id: rec.user_id,
    nome: rec.nome,
    cnpj_cpf: rec.cnpj_cpf,
    uf: rec.uf,
    segmento: rec.segmento,
    regime_atual: rec.regime_atual,
    email: rec.email,
    telefone: rec.telefone,
    arquivado: Boolean(rec.arquivado),
    created: rec.created,
    updated: rec.updated,
    origem_fonte: 'clientes',
  }
}

function paraClienteCrm(rec: any): Cliente {
  const emp = rec.expand?.empresa_id
  return {
    id: rec.id,
    user_id: rec.analista_responsavel || emp?.user_id,
    nome: emp?.nome_empresa || 'Cliente CRM',
    cnpj_cpf: emp?.cnpj || '',
    uf: emp?.uf_origem || 'SP',
    segmento: emp?.segmento || 'Serviços',
    regime_atual: emp?.regime_atual || 'Simples Nacional',
    email: emp?.email || '',
    telefone: emp?.telefone || '',
    arquivado: rec.status_comercial === 'Inativo' || rec.status_comercial === 'Perdido',
    created: rec.created,
    updated: rec.updated,
    crm_cliente_id: rec.id,
    empresa_id: rec.empresa_id,
    origem_fonte: 'crm_clientes',
  }
}

function paraClienteEmpresas(emp: any): Cliente {
  return {
    id: emp.id,
    user_id: emp.user_id,
    nome: emp.nome_empresa,
    cnpj_cpf: emp.cnpj,
    uf: emp.uf_origem || 'SP',
    segmento: emp.segmento || 'Serviços',
    regime_atual: emp.regime_atual || 'Simples Nacional',
    email: emp.email,
    telefone: emp.telefone,
    arquivado: false,
    created: emp.created,
    updated: emp.updated,
    empresa_id: emp.id,
    origem_fonte: 'clientes_empresas',
  }
}

async function buscarPaginaFonte(
  colecao: FonteCarteira,
  page: number,
  perPage: number,
  termoLimpo: string,
  termoOriginal: string,
): Promise<Cliente[]> {
  const filtros: string[] = []
  // Escapa aspas duplas para não quebrar o filtro do PocketBase
  const esc = (v: string) => v.replace(/"/g, '\\"')
  const t = esc(termoOriginal)

  if (termoLimpo) {
    if (colecao === 'clientes') {
      filtros.push(
        `(nome ~ "${t}" || cnpj_cpf ~ "${termoLimpo}" || cnpj_cpf ~ "${t}" || email ~ "${t}" || telefone ~ "${t}")`,
      )
    } else if (colecao === 'clientes_empresas') {
      filtros.push(
        `(nome_empresa ~ "${t}" || cnpj ~ "${termoLimpo}" || cnpj ~ "${t}" || email ~ "${t}" || telefone ~ "${t}")`,
      )
    } else {
      // crm_clientes: a fonte do nome/CNPJ na carteira é a empresa vinculada
      // (relação direta empresa_id → clientes_empresas; usa notação de relação)
      filtros.push(
        `(empresa_id.nome_empresa ~ "${t}" || empresa_id.cnpj ~ "${termoLimpo}" || empresa_id.cnpj ~ "${t}" || empresa_id.email ~ "${t}")`,
      )
    }
  }

  const filtro = filtros.length > 0 ? filtros.join(' && ') : ''

  if (colecao === 'clientes') {
    const recs = await pb.collection('clientes').getList<ClienteRecord>(page, perPage, {
      sort: 'nome',
      ...(filtro ? { filter: filtro } : {}),
    })
    return recs.items.map(paraClienteClientes)
  }

  if (colecao === 'crm_clientes') {
    const recs = await pb.collection('crm_clientes').getList<any>(page, perPage, {
      sort: '-created',
      expand: 'empresa_id',
      ...(filtro ? { filter: filtro } : {}),
    })
    return recs.items.map(paraClienteCrm)
  }

  const recs = await pb.collection('clientes_empresas').getList<any>(page, perPage, {
    sort: 'nome_empresa',
    ...(filtro ? { filter: filtro } : {}),
  })
  return recs.items.map(paraClienteEmpresas)
}

export interface LoteCarteira {
  clientes: Cliente[]
  /** Estado atualizado dos contadores por fonte (consumido no próximo lote). */
  estado: EstadoPaginasFontes
  /** true quando TODAS as fontes estão na última página */
  esgotado: boolean
}

/**
 * Busca o próximo lote da carteira: uma página de cada fonte cujo contador
 * ainda não esgotou, avançando os contadores. Um lote sem itens novos no
 * acumulador pode significar apenas sobreposição de fontes — o hook dedup e
 * o usuário simplesmente clica de novo (ou esgotou).
 */
export async function buscarLoteCarteira(
  estado: EstadoPaginasFontes,
  perPage: number = TAMANHO_PAGINA_CARTEIRA,
  termo: string = '',
): Promise<LoteCarteira> {
  const termoLimpo = limparCnpj(termo)
  const termoOriginal = (termo || '').trim()

  const fontes: FonteCarteira[] = ['clientes', 'crm_clientes', 'clientes_empresas']

  const resultados = await Promise.all(
    fontes.map(async (fonte) => {
      const pagina = estado[fonte]
      try {
        const itens = await buscarPaginaFonte(fonte, pagina, perPage, termoLimpo, termoOriginal)
        return { fonte, itens, esgotada: itens.length < perPage }
      } catch (e) {
        console.warn(`Aviso: falha ao paginar fonte ${fonte}:`, e)
        return { fonte, itens: [] as Cliente[], esgotada: true }
      }
    }),
  )

  const proximoEstado: EstadoPaginasFontes = { ...estado }
  for (const r of resultados) {
    proximoEstado[r.fonte] = r.esgotada ? estado[r.fonte] : estado[r.fonte] + 1
  }

  const esgotado = resultados.every((r) => r.esgotada)

  const clientes = resultados.flatMap((r) => r.itens)
  clientes.sort((a, b) => a.nome.localeCompare(b.nome))
  return { clientes, estado: proximoEstado, esgotado }
}
