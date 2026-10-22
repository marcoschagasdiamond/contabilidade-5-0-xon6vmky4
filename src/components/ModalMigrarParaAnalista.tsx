import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { migrarParaAnalistaModoTeste, PLANOS_CONFIG } from '@/services/planos'

interface ModalMigrarParaAnalistaProps {
  aberto: boolean
  aoFechar: () => void
  aoMigrarSucesso?: () => void
}

/**
 * Modal reutilizável de Migração de Perfil (Empresário -> Analista) em MODO TESTE
 * Padrão visual Diamond Group (verde escuro, dourado, sem ícones nos botões/itens).
 */
export function ModalMigrarParaAnalista({
  aberto,
  aoFechar,
  aoMigrarSucesso,
}: ModalMigrarParaAnalistaProps) {
  const { toast } = useToast()
  const navigate = useNavigate()
  const { recarregarUsuario } = useAuth()
  const [migrando, setMigrando] = useState(false)

  const handleConfirmar = async () => {
    setMigrando(true)
    try {
      const res = await migrarParaAnalistaModoTeste()
      if (res.success) {
        await recarregarUsuario()
        toast({
          title: 'Perfil Migrado para Analista!',
          description:
            'Recursos liberados: Carteira, Clientes e Convites agora estão disponíveis na sua conta.',
        })
        aoFechar()
        if (aoMigrarSucesso) {
          aoMigrarSucesso()
        } else {
          navigate('/carteira')
        }
      } else {
        toast({
          title: 'Erro na Migração',
          description: res.error || 'Não foi possível migrar seu perfil.',
          variant: 'destructive',
        })
      }
    } catch (_) {
      toast({
        title: 'Erro de Conexão',
        description: 'Falha na comunicação com o servidor.',
        variant: 'destructive',
      })
    } finally {
      setMigrando(false)
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(open) => !open && aoFechar()}>
      <DialogContent className="sm:max-w-md bg-[#07132B] text-white border-2 border-[#D4AF37] rounded-2xl p-6 sm:p-8 shadow-2xl">
        <DialogHeader className="space-y-3 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-bold uppercase tracking-wider">
            <span>Modo Teste Ativo</span>
          </div>
          <DialogTitle className="font-heading font-extrabold text-xl text-white">
            Migrar para Perfil Analista
          </DialogTitle>
          <DialogDescription className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Você está prestes a atualizar sua conta de <strong>Empresário</strong> (R$ 127/mês) para{' '}
            <strong>Analista</strong> ({PLANOS_CONFIG.analista.precoMensalTexto}/mês). No modo de
            testes atual, a migração ocorre imediatamente, de forma gratuita e sem exigência de
            cartão ou pagamento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-3 text-xs">
          <span className="font-bold text-[#D4AF37] uppercase tracking-wider block">
            Recursos que serão liberados na sua conta:
          </span>
          <div className="space-y-2 text-slate-200">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2ECC71] shrink-0" />
              <span>
                <strong>Carteira de Clientes:</strong> Painel analítico consolidado e gráficos
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2ECC71] shrink-0" />
              <span>
                <strong>Gestão de Clientes:</strong> Cadastro e histórico completo de empresas
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2ECC71] shrink-0" />
              <span>
                <strong>Envio de Convites:</strong> Disparo de convites para seus clientes acessarem
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/15 border border-[#D4AF37]/40 text-amber-200 text-[11px] leading-relaxed">
            <strong>Modo de Avaliação:</strong> Sem cartão de crédito nem cobrança nesta fase. A
            cobrança do plano ({PLANOS_CONFIG.analista.precoMensalTexto}/mês) será ativada
            posteriormente.
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={aoFechar}
            className="text-xs border-white/20 text-slate-300 hover:bg-white/10"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={migrando}
            onClick={handleConfirmar}
            className="flex-1 bg-[#D4AF37] text-[#07132B] hover:bg-[#c49f2e] font-bold text-xs"
          >
            {migrando ? 'Migrando Perfil...' : 'Confirmar Migração (Sem Cobrança)'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
