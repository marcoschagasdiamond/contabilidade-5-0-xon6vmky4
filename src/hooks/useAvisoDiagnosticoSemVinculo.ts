import { useEffect, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'

export const EVENTO_DIAGNOSTICO_SEM_VINCULO = 'contabilidade50_diagnostico_salvo_sem_vinculo'

export const TEXTO_AVISO_SEM_VINCULO =
  'Diagnóstico salvo, mas sem vínculo com um Cliente Ativo. Selecione o cliente para o resultado aparecer no relatório e no /admin.'

/**
 * Observa o evento global disparado por createDiagnostico() (src/services/diagnosticos.ts)
 * quando um registro é salvo na coleção 'diagnosticos' SEM vínculo de cliente
 * (cliente_id vazio — diagnóstico órfão) e exibe um aviso visual (toast shadcn/ui).
 *
 * Uso: chamar uma única vez no topo de cada página de etapa do diagnóstico:
 *   useAvisoDiagnosticoSemVinculo()
 */
export function useAvisoDiagnosticoSemVinculo() {
  const { toast } = useToast()
  const avisoEmExibicao = useRef(false)

  useEffect(() => {
    const handler = (event: Event) => {
      if (avisoEmExibicao.current) return
      avisoEmExibicao.current = true
      const custom = event as CustomEvent<{ tipo?: string }>
      toast({
        variant: 'destructive',
        title: 'Atenção: diagnóstico sem vínculo',
        description: TEXTO_AVISO_SEM_VINCULO,
      })
      console.warn(
        '[Diagnósticos] Aviso exibido na tela: diagnóstico salvo sem cliente ativo' +
          (custom.detail?.tipo ? ` (tipo: ${custom.detail.tipo})` : ''),
      )
      // Libera o próximo aviso após o tempo do toast (duração padrão 5s)
      setTimeout(() => {
        avisoEmExibicao.current = false
      }, 5500)
    }

    window.addEventListener(EVENTO_DIAGNOSTICO_SEM_VINCULO, handler)
    return () => {
      window.removeEventListener(EVENTO_DIAGNOSTICO_SEM_VINCULO, handler)
    }
  }, [toast])
}
