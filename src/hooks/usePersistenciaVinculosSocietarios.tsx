import { useCallback, useEffect, useRef, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  getClienteEmpresaPorId,
  getClienteEmpresaPorClienteAtivo,
} from '@/services/clientesEmpresas'
import { useAuth } from '@/context/AuthContext'
import { useDadosEmpresa } from '@/context/DadosEmpresaContext'
import { useClienteAtivo } from '@/context/ClienteAtivoContext'
import type { VinculoSocietario } from '@/types/dadosEmpresa'

/**
 * Persistência imediata dos Vínculos Societários em clientes_empresas.
 *
 * O formulário de Dados da Empresa só grava a página inteira no submit; um
 * vínculo digitado (ex.: sócio PJ/Holding) podia ser perdido se o usuário
 * saísse da tela antes de "Salvar Dados da Empresa". Este hook grava o campo
 * vinculos_societarios direto no registro da empresa ATIVA assim que ele
 * muda (debounce curto), revalidando o id do registro contra o usuário
 * logado (o dono do registro, ou analista/master/admin editando o cliente).
 *
 * RESOLUÇÃO DO ALVO (recidiva v0.0.406, provada em banco): o id recebido da
 * página pode ser de OUTRA coleção — cliente de `clientes` sem empresa_id
 * (ex.: Jucana brq9360g8xgqelw, registro real em clientes_empresas
 * l3zjamzgu2cbt0j). getClienteEmpresaPorId nele retorna null e o hook saía
 * SEM update, SEM toast e o campo ficava [] no banco (enquanto o submit da
 * página gravava faturamento/folha pelo id correto do contexto). Agora cada
 * candidato é VALIDADO em clientes_empresas e a cadeia de fallback segue
 * (contexto → cliente ativo por empresa_id/CNPJ/nome) até achar o registro
 * real; se nenhum candidato resolver, o erro é EXIBIDO — nunca silêncio.
 *
 * Falha de gravação NUNCA é silenciosa: toast de erro com o motivo
 * (getErrorMessage) + ação "Tentar novamente". Não altera regras de negócio
 * dos vínculos — só persistência e feedback.
 */

const DEBOUNCE_MS = 800

interface EstadoVinculos {
  gravando: boolean
  erro: string | null
  tentarNovamente: () => void
  /** Marca a lista atual como já vinda do banco (hidratação) para não regravar. */
  marcarHidratado: (serializado: string) => void
}

/** Lê a lista de vínculos que o banco de fato retornou no campo. */
function listaNoRegistro(rec: any): any[] {
  const bruto = rec?.vinculos_societarios
  if (Array.isArray(bruto)) return bruto
  if (typeof bruto === 'string') {
    try {
      const parsed = JSON.parse(bruto)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

export function usePersistenciaVinculosSocietarios(
  vinculos: VinculoSocietario[] | undefined,
  empresaId: string | null | undefined,
): EstadoVinculos {
  const { toast } = useToast()
  const { user, isAuthenticated, isMaster, isAdmin, nivelAcesso } = useAuth()
  const { empresaVinculadaId: ctxEmpresaId } = useDadosEmpresa()
  const { clienteAtivo } = useClienteAtivo()

  const [gravando, setGravando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const isAnalista =
    !!isMaster ||
    !!isAdmin ||
    nivelAcesso === 'analista' ||
    nivelAcesso === 'master' ||
    nivelAcesso === 'admin'

  // Último payload gravado com sucesso (ou hidratado do banco) — evita regravar
  const ultimoGravadoRef = useRef<string>('')
  // Payload pendente da última tentativa falha (usado pelo "Tentar novamente")
  const pendenteRef = useRef<{
    empresaId: string
    payload: Record<string, any>
    serializado: string
  } | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Últimos valores vistos pelo efeito de debounce, para flush no unmount
  const alvoRef = useRef<string | null>(null)
  const listaRef = useRef<any[]>([])

  /**
   * Valida o id do alvo contra a coleção clientes_empresas E contra o usuário
   * logado (dono do registro, ou analista/master/admin). Retorna o id REAL do
   * registro quando o candidato é válido; null quando o id não existe nessa
   * coleção (id de outra coleção, ex.: cliente sem empresa_id); 'sem-permissao'
   * quando existe mas pertence a outro usuário sem papel de análise.
   */
  const validarAlvo = useCallback(
    async (candidato: string): Promise<string | null | 'sem-permissao'> => {
      try {
        const rec = await getClienteEmpresaPorId(candidato)
        if (!rec) return null
        if (rec.user_id === user?.id || isAnalista) return rec.id
        return 'sem-permissao'
      } catch {
        return null
      }
    },
    [user?.id, isAnalista],
  )

  /**
   * Cadeia de resolução do registro real em clientes_empresas. Candidatos em
   * ordem: id passado pela página (cliente.empresa_id ou cliente.id),
   * empresaVinculadaId do contexto (resolvido por CNPJ) e, por último, o
   * cliente ativo (empresa_id → CNPJ → nome, via getClienteEmpresaPorClienteAtivo).
   */
  const resolverAlvo = useCallback(async (): Promise<{ id: string } | { erro: string } | null> => {
    // 1) Id direto passado pela página — só se existir em clientes_empresas
    if (empresaId) {
      const direto = await validarAlvo(empresaId)
      if (direto === 'sem-permissao') {
        return { erro: 'Sem permissão para gravar vínculos nesta empresa.' }
      }
      if (direto) return { id: direto }
      console.warn(
        '[VinculosSocietarios] id candidato não existe em clientes_empresas (id de outra coleção?), tentando fallback:',
        empresaId,
      )
    }

    // 2) Id resolvido pelo DadosEmpresaContext (busca por CNPJ do cliente ativo)
    if (ctxEmpresaId && ctxEmpresaId !== empresaId) {
      const viaCtx = await validarAlvo(ctxEmpresaId)
      if (viaCtx === 'sem-permissao') {
        return { erro: 'Sem permissão para gravar vínculos nesta empresa.' }
      }
      if (viaCtx) return { id: viaCtx }
    }

    // 3) Cliente ativo: empresa_id → CNPJ → nome (nunca assume; valida)
    if (clienteAtivo) {
      try {
        const viaCliente = await getClienteEmpresaPorClienteAtivo(clienteAtivo)
        if (viaCliente) {
          const validado = await validarAlvo(viaCliente.id)
          if (validado === 'sem-permissao') {
            return { erro: 'Sem permissão para gravar vínculos nesta empresa.' }
          }
          if (validado) return { id: validado }
        }
      } catch {
        /* segue para o erro abaixo */
      }
    }

    return null
  }, [empresaId, ctxEmpresaId, clienteAtivo, validarAlvo])

  const gravarAgora = useCallback(
    async (empresaIdAlvo: string, payload: Record<string, any>, serializado: string) => {
      setGravando(true)
      setErro(null)
      try {
        console.log('[VinculosSocietarios] UPDATE clientes_empresas', {
          id: empresaIdAlvo,
          payload,
        })
        const rec = await pb.collection('clientes_empresas').update(empresaIdAlvo, payload)
        console.log('[VinculosSocietarios] resultado do UPDATE', {
          id: empresaIdAlvo,
          vinculosNoBanco: listaNoRegistro(rec),
        })
        // Verificação pós-gravação (anti perda silenciosa): o update pode
        // responder 200 e ainda assim o campo não conter a lista enviada.
        // Regrava uma vez; se persistir, trata como ERRO — nunca como sucesso.
        const esperados = Array.isArray(payload?.vinculos_societarios)
          ? payload.vinculos_societarios
          : []
        let gravados = listaNoRegistro(rec)
        if (esperados.length > 0 && gravados.length < esperados.length) {
          console.warn('Vínculos não consolidados no registro (tentativa 1). Regravando...', {
            esperados: esperados.length,
            gravados: gravados.length,
          })
          const rec2 = await pb.collection('clientes_empresas').update(empresaIdAlvo, payload)
          gravados = listaNoRegistro(rec2)
        }
        if (esperados.length > 0 && gravados.length < esperados.length) {
          throw new Error(
            `O registro respondeu OK, mas gravou ${gravados.length} de ${esperados.length} vínculo(s). Tente novamente.`,
          )
        }
        ultimoGravadoRef.current = serializado
        pendenteRef.current = null
      } catch (err) {
        console.error('Erro ao gravar vínculos societários:', err)
        pendenteRef.current = { empresaId: empresaIdAlvo, payload, serializado }
        const motivo = getErrorMessage(err)
        setErro(motivo)
        toast({
          title: 'Erro ao gravar vínculos societários',
          description:
            motivo && motivo !== 'An unexpected error occurred.'
              ? motivo
              : 'Não foi possível gravar os vínculos no banco de dados.',
          variant: 'destructive',
          duration: 10000,
          action: (
            <ToastAction
              altText="Tentar novamente"
              onClick={() => {
                const pend = pendenteRef.current
                if (pend) {
                  void gravarAgora(pend.empresaId, pend.payload, pend.serializado)
                }
              }}
              className="bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shrink-0"
            >
              Tentar novamente
            </ToastAction>
          ),
        })
      } finally {
        setGravando(false)
      }
    },
    [toast],
  )

  const tentarNovamente = useCallback(() => {
    const pend = pendenteRef.current
    if (pend) {
      void gravarAgora(pend.empresaId, pend.payload, pend.serializado)
    }
  }, [gravarAgora])

  const marcarHidratado = useCallback((serializado: string) => {
    ultimoGravadoRef.current = serializado
  }, [])

  // Debounce: grava após 800ms sem novas alterações (e faz flush ao desmontar)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const lista = Array.isArray(vinculos) ? vinculos : []
    listaRef.current = lista
    const serializado = JSON.stringify(lista)

    if (!isAuthenticated || !user?.id) return
    // Nada mudou desde a última gravação bem-sucedida / hidratação do banco
    if (serializado === ultimoGravadoRef.current) return
    // Sem nenhum candidato de id ainda (contexto/carregamento em andamento):
    // aguarda os estados chegarem — grava quando resolverem.
    if (!empresaId && !ctxEmpresaId && !clienteAtivo) return
    // Update fantasma (evidência do banco, recidiva v0.0.406): abrir a tela
    // com lista vazia disparava update gravando [] — movia o `updated` do
    // registro sem gravar nada. Banco vazio + nada gravado na sessão = não grava.
    if (lista.length === 0 && ultimoGravadoRef.current === '') {
      ultimoGravadoRef.current = serializado
      return
    }

    const executarGravacao = async () => {
      const alvo = await resolverAlvo()
      alvoRef.current = alvo && 'id' in alvo ? alvo.id : null

      if (!alvo || 'erro' in alvo) {
        pendenteRef.current = null
        setErro(alvo?.erro ?? null)
        if (alvo?.erro) {
          // Sem permissão: nunca escreve em registro alheio — avisa.
          toast({
            title: 'Vínculos não gravados',
            description: alvo.erro,
            variant: 'destructive',
            duration: 8000,
          })
        } else {
          // Nenhum registro de empresa encontrado para o cliente ativo
          // (nenhum candidato existiu em clientes_empresas): erro visível,
          // nunca silêncio com campo vazio.
          toast({
            title: 'Vínculos não gravados',
            description:
              'Não encontramos o registro da empresa em clientes_empresas. Clique em "Salvar Dados da Empresa" para criá-lo e tente novamente.',
            variant: 'destructive',
            duration: 10000,
          })
        }
        return
      }

      console.log('[VinculosSocietarios] estado no agendamento da gravação', {
        alvo: alvo.id,
        vinculos: listaRef.current,
      })

      await gravarAgora(alvo.id, { vinculos_societarios: listaRef.current }, serializado)
    }

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      void executarGravacao()
    }, DEBOUNCE_MS)

    return () => {
      // Flush síncrono: se havia gravação agendada ao desmontar/trocar alvo,
      // executa imediatamente em vez de descartar (herda padrão anti-perda).
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
        void executarGravacao()
      }
    }
    // Intencionalmente não depende de `resolverAlvo`/`gravarAgora` para não
    // reiniciar o debounce a cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vinculos, empresaId, ctxEmpresaId, clienteAtivo, isAuthenticated, user?.id, isAnalista])

  return { gravando, erro, tentarNovamente, marcarHidratado }
}
