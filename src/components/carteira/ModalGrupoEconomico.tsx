import { useEffect, useState } from 'react'
import { Network, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PainelGrupoEconomico } from '@/components/dadosEmpresa/PainelGrupoEconomico'
import type { Cliente } from '@/types/cliente'
import type { VinculoSocietario } from '@/types/dadosEmpresa'
import {
  getClienteEmpresaPorClienteAtivo,
  type ClienteEmpresaRecord,
} from '@/services/clientesEmpresas'

/**
 * Modal "Grupo Econômico (GE)" de consulta rápida na /carteira.
 *
 * REUTILIZA o componente PainelGrupoEconomico (o mesmo de Dados da Empresa) —
 * nenhuma lógica de árvore/barra/alerta duplicada. Modo SOMENTE LEITURA:
 * onAdicionarEmpresa não é passado, portanto o painel não oferece
 * adicionar/remover vínculo (edição continua em /dados-empresa).
 *
 * Fonte única dos dados: campo vinculos_societarios do registro de
 * clientes_empresas do cliente do card, resolvido na mesma ordem usada
 * pelo dossiê (empresa_id → CNPJ → nome). Nada é gravado aqui.
 */

interface ModalGrupoEconomicoProps {
  aberto: boolean
  aoFechar: () => void
  cliente: Cliente | null
}

export function ModalGrupoEconomico({ aberto, aoFechar, cliente }: ModalGrupoEconomicoProps) {
  const [registro, setRegistro] = useState<ClienteEmpresaRecord | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!aberto || !cliente) {
      setRegistro(null)
      setErro(null)
      return
    }

    let cancelado = false
    setCarregando(true)
    setErro(null)

    getClienteEmpresaPorClienteAtivo({
      empresa_id: cliente.empresa_id,
      cnpj_cpf: cliente.cnpj_cpf,
      nome: cliente.nome,
    })
      .then((rec) => {
        if (cancelado) return
        if (!rec) {
          setErro(
            'Nenhum registro de Dados da Empresa encontrado para este cliente — preencha os Dados da Empresa (/dados-empresa) para ver o Grupo Econômico.',
          )
        } else {
          setRegistro(rec)
        }
      })
      .catch(() => {
        if (!cancelado) {
          setErro('Erro ao carregar os dados da empresa. Tente novamente.')
        }
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })

    return () => {
      cancelado = true
    }
  }, [aberto, cliente])

  const vinculos: VinculoSocietario[] = Array.isArray(registro?.vinculos_societarios)
    ? (registro!.vinculos_societarios as VinculoSocietario[])
    : []

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && aoFechar()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-bold text-[#07132B]">
            <Network className="w-4 h-4 text-[#D4AF37]" />
            Grupo Econômico (GE) — Consulta Rápida
            {cliente?.nome ? (
              <span className="text-slate-500 font-semibold normal-case">• {cliente.nome}</span>
            ) : null}
          </DialogTitle>
        </DialogHeader>

        {carregando ? (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="w-7 h-7 text-[#D4AF37] animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Carregando dados do grupo econômico...</p>
          </div>
        ) : erro ? (
          <div className="py-10 text-center space-y-3">
            <p className="text-xs font-semibold text-rose-700">{erro}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={aoFechar}
              className="text-xs"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Fechar
            </Button>
          </div>
        ) : registro ? (
          <>
            <PainelGrupoEconomico
              empresaNome={registro.nome_empresa || cliente?.nome}
              empresaCnpj={registro.cnpj || cliente?.cnpj_cpf}
              regimeAtual={registro.regime_atual || 'Simples Nacional'}
              faturamentoMensalProprio={Number(registro.faturamento_mensal) || 0}
              vinculos={vinculos}
            />
            <p className="text-[10px] text-slate-500 text-center">
              Visualização somente leitura — para adicionar ou remover vínculos, use{' '}
              <strong>Dados da Empresa</strong> (/dados-empresa), aba Vedações.
            </p>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
