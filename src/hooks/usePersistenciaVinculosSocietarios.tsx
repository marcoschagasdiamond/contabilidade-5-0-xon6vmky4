import { useCallback, useEffect, useRef, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { getClienteEmpresaPorId } from '@/services/clientesEmpresas'
import { useAuth } from '@/context/AuthContext'
import { useDadosEmpresa } from '@/context/DadosEmpresaContext'
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
 * Falha de gravação NUNCA é silenciosa: toast de erro com o motivo
 * (getErrorMessage) + ação "Tentar novamente". Sem registro ainda em
 * clientes_empresas não há update: a criação continua no submit da página.
 *
 * Não altera regras de negócio dos vínculos — só persistência e feedback.
 */

const DEBOUNCE_MS = 800

interface EstadoVinculos {
  gravando: boolean
  erro: string | null
  tentarNovamente: () => void
  /** Marca a lista atual como já vinda do banco (hidratação) para não regravar. */
  marcarHidratado: (serializado: string) => void
}

export function usePersistenciaVinculosSocietarios(
  vinculos: VinculoSocietario[] | undefined,
  empresaId: string | null | undefined,
): EstadoVinculos {
  const { toast } = useToast()
  const { user, isAuthenticated, isMaster, isAdmin, nivelAcesso } = useAuth()
  const { empresaVinculadaId: ctxEmpresaId } = useDadosEmpresa()

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

  /** Lê a lista de vínculos que o banco de fato retornou após o update. */
  const listaNoRegistro = (rec: any): any[] => {
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

  const gravarAgora = useCallback(
    async (empresaIdAlvo: string, payload: Record<string, any>, serializado: string) => {
      setGravando(true)
      setErro(null)
      try {
        const rec = await pb.collection('clientes_empresas').update(empresaIdAlvo, payload)
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

    // Alvo: id resolvido da empresa ativa em clientes_empresas (contexto ou página)
    const alvoId = empresaId || ctxEmpresaId || null
    alvoRef.current = alvoId
    const lista = Array.isArray(vinculos) ? vinculos : []
    listaRef.current = lista
    const serializado = JSON.stringify(lista)

    if (!alvoId) {
      // Registro ainda não existe em clientes_empresas: nada a atualizar —
      // a criação continua acontecendo no submit da página inteira.
      return
    }
    if (!isAuthenticated || !user?.id) return
    // Nada mudou desde a última gravação bem-sucedida / hidratação do banco
    if (serializado === ultimoGravadoRef.current) return

    const executarGravacao = async () => {
      // Revalidação do id da empresa ATIVA contra o usuário logado
      let idValido: string | null = null
      let autorizado = false
      try {
        const rec = await getClienteEmpresaPorId(alvoId)
        if (!rec) {
          idValido = null
        } else if (rec.user_id === user.id || isAnalista) {
          idValido = rec.id
          autorizado = true
        }
      } catch {
        idValido = null
      }

      if (!idValido || !autorizado) {
        pendenteRef.current = null
        setErro(null)
        if (idValido && !autorizado) {
          // Id aponta para empresa de outro usuário sem permissão de análise:
          // não grava (nunca escreve em registro alheio) e avisa.
          toast({
            title: 'Vínculos não gravados',
            description: 'Sem permissão para gravar vínculos nesta empresa.',
            variant: 'destructive',
            duration: 8000,
          })
        }
        return
      }

      await gravarAgora(idValido, { vinculos_societarios: listaRef.current }, serializado)
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
    // Intencionalmente não depende de `gravarAgora` para não reiniciar o
    // debounce a cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vinculos, empresaId, ctxEmpresaId, isAuthenticated, user?.id, isAnalista])

  return { gravando, erro, tentarNovamente, marcarHidratado }
}
