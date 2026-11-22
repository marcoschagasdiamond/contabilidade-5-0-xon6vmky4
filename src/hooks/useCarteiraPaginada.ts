import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Cliente } from '@/types/cliente'
import {
  buscarLoteCarteira,
  estadoPaginasInicial,
  TAMANHO_PAGINA_CARTEIRA,
  limparCnpj,
  type EstadoPaginasFontes,
} from '@/services/carteiraPaginada'

/**
 * Hook da paginação server-side da /carteira (Fase 2).
 *
 * Mantém a lista ACUMULADA das páginas já carregadas (o agrupamento por
 * técnico opera sobre o que já veio do servidor), busca o próximo lote ao
 * pedir "Carregar mais" e re-carrega do início quando o termo de busca muda —
 * porque o servidor filtra por página, um termo novo precisa reiniciar.
 *
 * Cada fonte (clientes / crm_clientes / clientes_empresas) tem seu próprio
 * contador de página: como as coleções têm tamanhos diferentes, paginar as
 * três por um índice único deixaria buracos.
 *
 * Regras preservadas: as fontes e a deduplicação seguem listarClientes()
 * (mesmas chaves: CNPJ limpo ou id), e a busca por CNPJ ignora pontuação
 * (limparCnpj dos dois lados).
 */
export function useCarteiraPaginada(termoBusca: string) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [carregando, setCarregando] = useState(true)
  const [carregandoMais, setCarregandoMais] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [esgotado, setEsgotado] = useState(false)

  const termoChave = useMemo(() => termoBusca.trim().toLowerCase(), [termoBusca])
  const termoRef = useRef(termoChave)
  const carregandoRef = useRef(false)
  const estadoRef = useRef<EstadoPaginasFontes>(estadoPaginasInicial())

  const mesclar = useCallback((novos: Cliente[]) => {
    if (novos.length === 0) return
    setClientes((atual) => {
      const chavesUsadas = new Set<string>()
      for (const c of atual) {
        chavesUsadas.add(c.id)
        chavesUsadas.add(limparCnpj(c.cnpj_cpf))
        if (c.empresa_id) chavesUsadas.add(c.empresa_id)
        if (c.crm_cliente_id) chavesUsadas.add(c.crm_cliente_id)
      }
      const novosValidos = novos.filter((c) => {
        const chave = limparCnpj(c.cnpj_cpf)
        // Dedup pela MESMA regra de listarClientes: id, CNPJ limpo, empresa
        // vinculada ou registro CRM — o que casar já está na lista.
        return !(
          chavesUsadas.has(c.id) ||
          (chave && chavesUsadas.has(chave)) ||
          (c.empresa_id && chavesUsadas.has(c.empresa_id)) ||
          (c.crm_cliente_id && chavesUsadas.has(c.crm_cliente_id))
        )
      })
      if (novosValidos.length === 0) return atual
      const lista = [...atual, ...novosValidos]
      lista.sort((a, b) => a.nome.localeCompare(b.nome))
      return lista
    })
  }, [])

  const carregar = useCallback(
    async (termo: string, eProxima: boolean) => {
      if (carregandoRef.current) return
      carregandoRef.current = true
      setErro(null)
      if (eProxima) setCarregandoMais(true)
      try {
        const lote = await buscarLoteCarteira(estadoRef.current, TAMANHO_PAGINA_CARTEIRA, termo)
        if (termoRef.current !== termo.trim().toLowerCase()) return
        estadoRef.current = lote.estado
        if (eProxima) {
          mesclar(lote.clientes)
        } else {
          setClientes(lote.clientes)
        }
        setEsgotado(lote.esgotado)
      } catch (e) {
        console.error('Erro ao carregar lote da carteira:', e)
        setErro('Não foi possível carregar a carteira. Tente novamente.')
      } finally {
        carregandoRef.current = false
        setCarregando(false)
        setCarregandoMais(false)
      }
    },
    [mesclar],
  )

  // Primeira carga e re-carga quando o termo debounced muda
  useEffect(() => {
    termoRef.current = termoChave
    estadoRef.current = estadoPaginasInicial()
    setCarregando(true)
    setEsgotado(false)
    void carregar(termoBusca, false)
  }, [termoChave]) // eslint-disable-line react-hooks/exhaustive-deps

  const carregarMais = useCallback(async () => {
    if (carregandoRef.current || esgotado || carregando) return
    await carregar(termoBusca, true)
  }, [carregar, carregando, esgotado, termoBusca])

  /** Recarrega do zero (ex.: após criar/editar cliente). */
  const recarregar = useCallback(() => {
    estadoRef.current = estadoPaginasInicial()
    setEsgotado(false)
    return carregar(termoBusca, false)
  }, [carregar, termoBusca])

  return {
    clientes,
    carregando,
    carregandoMais,
    erro,
    esgotado,
    carregarMais,
    recarregar,
    /** termo efetivamente aplicado na carga atual */
    termoAplicado: termoChave,
  }
}
