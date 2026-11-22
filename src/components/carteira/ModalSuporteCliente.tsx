import { useEffect, useState } from 'react'
import { Loader2, Headphones } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Cliente } from '@/types/cliente'
import { getClienteEmpresaPorClienteAtivo } from '@/services/clientesEmpresas'
import {
  EVENTO_ABRIR_SUPORTE,
  type ContextoSuporteCard,
} from '@/components/suporte/BotaoEChatSuporte'

/**
 * Modal "Suporte com contexto do cliente" na /carteira.
 *
 * Resolve o registro de clientes_empresas do cliente do card (empresa_id →
 * CNPJ → nome, MESMA resolução do dossiê/GE) e abre o chat de suporte EXISTENTE
 * (BotaoEChatSuporte — agente nativo assistente-suporte-50, mesmo histórico
 * persistente) via evento global, injetando o contexto (nome, CNPJ, regime,
 * estágio do funil). Nada é gravado; nenhum chat/agente novo é criado.
 *
 * Em clientes SEM registro de empresa cadastrado, abre o suporte normal,
 * sem contexto (requisito 4).
 */

interface ModalSuporteClienteProps {
  aberto: boolean
  aoFechar: () => void
  cliente: Cliente | null
}

const ROTULOS_ESTAGIO: Record<string, string> = {
  lead: 'Lead',
  diagnostico: 'Diagnóstico',
  proposta: 'Proposta',
  cliente_ativo: 'Cliente Ativo',
  descartado: 'Descartado',
}

export function ModalSuporteCliente({ aberto, aoFechar, cliente }: ModalSuporteClienteProps) {
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    if (!aberto || !cliente) return

    let cancelado = false
    setCarregando(true)

    const abrir = async () => {
      try {
        const registro = await getClienteEmpresaPorClienteAtivo({
          empresa_id: cliente.empresa_id,
          cnpj_cpf: cliente.cnpj_cpf,
          nome: cliente.nome,
        })

        if (cancelado) return

        if (registro) {
          const contexto: ContextoSuporteCard = {
            rotulo: registro.nome_empresa || cliente.nome,
            nome: registro.nome_empresa || cliente.nome,
            cnpj: registro.cnpj || cliente.cnpj_cpf || undefined,
            regime: registro.regime_atual || cliente.regime_atual || undefined,
            estagio_funil:
              ROTULOS_ESTAGIO[cliente.estagio_funil ?? 'lead'] ??
              cliente.estagio_funil ??
              undefined,
            segmento: registro.segmento || cliente.segmento || undefined,
            uf: registro.uf_origem || cliente.uf || undefined,
          }
          window.dispatchEvent(
            new CustomEvent<ContextoSuporteCard>(EVENTO_ABRIR_SUPORTE, { detail: contexto }),
          )
        } else {
          // Cliente sem empresa cadastrada: suporte normal, sem contexto.
          window.dispatchEvent(
            new CustomEvent<ContextoSuporteCard | null>(EVENTO_ABRIR_SUPORTE, { detail: null }),
          )
        }
      } catch (e) {
        console.warn('Erro ao resolver empresa do cliente para o suporte:', e)
        if (!cancelado) {
          window.dispatchEvent(
            new CustomEvent<ContextoSuporteCard | null>(EVENTO_ABRIR_SUPORTE, { detail: null }),
          )
        }
      } finally {
        if (!cancelado) {
          setCarregando(false)
          aoFechar()
        }
      }
    }

    abrir()

    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, cliente])

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && aoFechar()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-bold text-[#07132B]">
            <Headphones className="w-4 h-4 text-[#D4AF37]" />
            Abrindo Suporte
            {cliente?.nome ? (
              <span className="text-slate-500 font-semibold normal-case">• {cliente.nome}</span>
            ) : null}
          </DialogTitle>
        </DialogHeader>
        <div className="py-6 text-center space-y-3">
          <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin mx-auto" />
          <p className="text-xs text-slate-500">
            Localizando os dados da empresa para dar contexto ao atendimento...
          </p>
        </div>
        <div className="flex justify-center pb-2">
          <Button type="button" variant="outline" size="sm" onClick={aoFechar} className="text-xs">
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
