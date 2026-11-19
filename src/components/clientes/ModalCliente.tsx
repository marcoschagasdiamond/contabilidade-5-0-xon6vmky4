import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Cliente, ClienteInput } from '@/types/cliente'
import { criarCliente, atualizarCliente } from '@/services/clientes'
import { useToast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'
import { useClienteAtivo } from '@/context/ClienteAtivoContext'

interface ModalClienteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clienteParaEditar?: Cliente | null
  onSalvoComSucesso: (cliente: Cliente) => void
}

const SEGMENTOS_DISPONIVEIS = [
  'Comércio',
  'Serviços',
  'Indústria',
  'Saúde',
  'Educação',
  'Agro',
  'Transporte',
  'Tecnologia',
  'Construção Civil',
  'Bares e Restaurantes',
  'Outro',
]

const REGIMES_DISPONIVEIS = ['Simples Nacional', 'Lucro Presumido', 'Lucro Real', 'MEI / Outro']

const UFS_BRASIL = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
]

/**
 * Modal para cadastro ou edição de cliente do analista.
 * Regra: SEM ÍCONES — apenas texto, badges e marcadores de status.
 */
export function ModalCliente({
  open,
  onOpenChange,
  clienteParaEditar,
  onSalvoComSucesso,
}: ModalClienteProps) {
  const { toast } = useToast()
  const { selecionarClienteAtivo, adicionarCliente } = useClienteAtivo()
  const [salvando, setSalvando] = useState(false)

  const [nome, setNome] = useState('')
  const [cnpjCpf, setCnpjCpf] = useState('')
  const [uf, setUf] = useState('SP')
  const [segmento, setSegmento] = useState('Serviços')
  const [regimeAtual, setRegimeAtual] = useState('Simples Nacional')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')

  React.useEffect(() => {
    if (open) {
      if (clienteParaEditar) {
        setNome(clienteParaEditar.nome || '')
        setCnpjCpf(clienteParaEditar.cnpj_cpf || '')
        setUf(clienteParaEditar.uf || 'SP')
        setSegmento(clienteParaEditar.segmento || 'Serviços')
        setRegimeAtual(clienteParaEditar.regime_atual || 'Simples Nacional')
        setEmail(clienteParaEditar.email || '')
        setTelefone(clienteParaEditar.telefone || '')
      } else {
        setNome('')
        setCnpjCpf('')
        setUf('SP')
        setSegmento('Serviços')
        setRegimeAtual('Simples Nacional')
        setEmail('')
        setTelefone('')
      }
    }
  }, [open, clienteParaEditar])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nome.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Informe a Razão Social ou Nome do cliente.',
        variant: 'destructive',
      })
      return
    }

    if (!cnpjCpf.trim()) {
      toast({
        title: 'CNPJ/CPF obrigatório',
        description: 'Informe o documento do cliente.',
        variant: 'destructive',
      })
      return
    }

    try {
      setSalvando(true)

      const payload: ClienteInput = {
        nome: nome.trim(),
        cnpj_cpf: cnpjCpf.trim(),
        uf: uf.trim().toUpperCase(),
        segmento,
        regime_atual: regimeAtual,
        email: email.trim(),
        telefone: telefone.trim(),
      }

      let salvo: Cliente
      if (clienteParaEditar) {
        salvo = await atualizarCliente(clienteParaEditar.id, payload)
        toast({
          title: 'Cliente atualizado',
          description: `Os dados de "${salvo.nome}" foram atualizados com sucesso.`,
        })
      } else {
        salvo = await criarCliente(payload)
        const novoCliente = salvo
        toast({
          title: 'Cliente cadastrado',
          description: `"${novoCliente.nome}" adicionado à sua carteira com sucesso.`,
          duration: 8000,
          action: (
            <ToastAction
              altText="Tornar Cliente Ativo"
              onClick={() => {
                adicionarCliente(novoCliente)
                selecionarClienteAtivo(novoCliente)
              }}
              className="bg-[#07132B] hover:bg-[#0B1E3F] text-[#D4AF37] font-bold border-[#D4AF37]/50 text-xs shrink-0"
            >
              Tornar Cliente Ativo
            </ToastAction>
          ),
        })
      }

      onSalvoComSucesso(salvo)
      onOpenChange(false)
    } catch (err) {
      // Falha no backend: o modal permanece aberto com os dados preenchidos,
      // mostra o motivo real do erro e permite retry imediato.
      const motivo = err instanceof Error ? err.message : 'Falha ao salvar dados do cliente.'
      toast({
        title: 'Erro ao salvar cliente',
        description: motivo,
        variant: 'destructive',
        duration: 12000,
        action: (
          <ToastAction
            altText="Tentar novamente"
            onClick={() => {
              void handleSubmit(e)
            }}
          >
            Tentar novamente
          </ToastAction>
        ),
      })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-slate-200">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
            <DialogTitle className="text-base font-bold text-[#07132B]">
              {clienteParaEditar ? 'Editar Dados do Cliente' : 'Novo Cliente na Carteira'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500">
            Cadastre os dados cadastrais e fiscais da empresa cliente do analista.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Razão Social / Nome */}
          <div className="space-y-1">
            <Label htmlFor="cliente-nome" className="text-xs font-semibold text-slate-700">
              Razão Social / Nome do Cliente *
            </Label>
            <Input
              id="cliente-nome"
              placeholder="Ex.: Indústria Metalúrgica Aliança Ltda"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="text-xs"
              required
              autoFocus
            />
          </div>

          {/* CNPJ/CPF e UF */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <Label htmlFor="cliente-cnpj" className="text-xs font-semibold text-slate-700">
                CNPJ / CPF *
              </Label>
              <Input
                id="cliente-cnpj"
                placeholder="00.000.000/0000-00"
                value={cnpjCpf}
                onChange={(e) => setCnpjCpf(e.target.value)}
                className="text-xs"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cliente-uf" className="text-xs font-semibold text-slate-700">
                UF *
              </Label>
              <select
                id="cliente-uf"
                value={uf}
                onChange={(e) => setUf(e.target.value)}
                className="w-full text-xs h-9 px-2 rounded-md border border-slate-200 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-[#07132B]"
              >
                {UFS_BRASIL.map((sigla) => (
                  <option key={sigla} value={sigla}>
                    {sigla}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Segmento e Regime Atual */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="cliente-segmento" className="text-xs font-semibold text-slate-700">
                Segmento / Ramo *
              </Label>
              <select
                id="cliente-segmento"
                value={segmento}
                onChange={(e) => setSegmento(e.target.value)}
                className="w-full text-xs h-9 px-2 rounded-md border border-slate-200 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-[#07132B]"
              >
                {SEGMENTOS_DISPONIVEIS.map((seg) => (
                  <option key={seg} value={seg}>
                    {seg}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="cliente-regime" className="text-xs font-semibold text-slate-700">
                Regime Atual *
              </Label>
              <select
                id="cliente-regime"
                value={regimeAtual}
                onChange={(e) => setRegimeAtual(e.target.value)}
                className="w-full text-xs h-9 px-2 rounded-md border border-slate-200 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-[#07132B]"
              >
                {REGIMES_DISPONIVEIS.map((reg) => (
                  <option key={reg} value={reg}>
                    {reg}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* E-mail e Telefone */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="cliente-email" className="text-xs font-semibold text-slate-700">
                E-mail (opcional)
              </Label>
              <Input
                id="cliente-email"
                type="email"
                placeholder="contato@cliente.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="cliente-telefone" className="text-xs font-semibold text-slate-700">
                Telefone (opcional)
              </Label>
              <Input
                id="cliente-telefone"
                placeholder="(11) 99999-9999"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={salvando}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={salvando || !nome.trim() || !cnpjCpf.trim()}
              className="text-xs bg-[#07132B] hover:bg-[#0B1E3F] text-[#D4AF37] font-semibold"
            >
              {salvando
                ? 'Salvando...'
                : clienteParaEditar
                  ? 'Salvar Alterações'
                  : 'Cadastrar Cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
