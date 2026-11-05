import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useClienteAtivo } from '@/context/ClienteAtivoContext'
import { criarCliente } from '@/services/clientes'
import { limparDadosEmpresa } from '@/types/dadosEmpresa'
import { useToast } from '@/hooks/use-toast'
import { Building2, FolderOpen, Search, UserPlus, X } from 'lucide-react'
import type { Cliente } from '@/types/cliente'

interface ModalTrocarEmpresaDiagnosticoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Modal "Diagnóstico de outra empresa":
 * confirma a troca do CONTEXTO COMPLETO de análise (fonte mestra + módulos),
 * oferecendo duas vias: criar cliente novo em branco ou escolher um cliente
 * já existente na Carteira. O cliente escolhido/criado vira o CLIENTE ATIVO
 * do app e o técnico é levado a /dados-empresa (fonte mestra).
 *
 * Os dados da empresa anterior permanecem 100% preservados na Carteira
 * (relatórios, históricos, parâmetros das fases e teses ficam vinculados ao
 * cliente anterior e voltam ao reativá-lo).
 */
export function ModalTrocarEmpresaDiagnostico({
  open,
  onOpenChange,
}: ModalTrocarEmpresaDiagnosticoProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { clientes, clienteAtivoId, selecionarClienteAtivo, adicionarCliente } = useClienteAtivo()

  const [via, setVia] = useState<'nova' | 'existente' | null>(null)
  const [nomeNova, setNomeNova] = useState('')
  const [cnpjNova, setCnpjNova] = useState('')
  const [busca, setBusca] = useState('')
  const [clienteEscolhido, setClienteEscolhido] = useState<Cliente | null>(null)
  const [processando, setProcessando] = useState(false)

  // Reset do estado interno sempre que o modal é reaberto
  useEffect(() => {
    if (open) {
      setVia(null)
      setNomeNova('')
      setCnpjNova('')
      setBusca('')
      setClienteEscolhido(null)
      setProcessando(false)
    }
  }, [open])

  const clientesDisponiveis = useMemo(
    () => clientes.filter((c) => !c.arquivado && c.id !== clienteAtivoId),
    [clientes, clienteAtivoId],
  )

  const resultadosBusca = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return clientesDisponiveis.slice(0, 8)
    return clientesDisponiveis
      .filter(
        (c) =>
          (c.nome || '').toLowerCase().includes(q) || (c.cnpj_cpf || '').includes(busca.trim()),
      )
      .slice(0, 8)
  }, [busca, clientesDisponiveis])

  const aplicarTroca = (cliente: Cliente) => {
    adicionarCliente(cliente)
    selecionarClienteAtivo(cliente)
    // Reseta a fonte mestra (Dados da Empresa) para o estado neutro em branco.
    // Os dados do cliente anterior continuam preservados no banco
    // (clientes_empresas) e voltam ao reativá-lo na Carteira.
    limparDadosEmpresa()
    onOpenChange(false)
    toast({
      title: 'Cliente ativo alterado',
      description: `A análise agora está no contexto de "${cliente.nome}". Preencha os Dados da Empresa e siga para Calculadora, Recuperador e Diagnóstico.`,
    })
    navigate('/dados-empresa')
  }

  const handleCriarNovo = async () => {
    const nome = nomeNova.trim()
    if (!nome) {
      toast({
        title: 'Informe o nome do cliente',
        description: 'O nome do novo cliente é obrigatório para criar o cadastro em branco.',
        variant: 'destructive',
      })
      return
    }
    setProcessando(true)
    try {
      const novo = await criarCliente({
        nome,
        cnpj_cpf: cnpjNova.trim(),
        uf: 'SP',
        segmento: 'Serviços',
        regime_atual: 'Simples Nacional',
      })
      aplicarTroca(novo)
    } catch (err) {
      console.error('Erro ao criar novo cliente:', err)
      toast({
        title: 'Erro ao criar cliente',
        description: 'Não foi possível criar o cliente novo. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setProcessando(false)
    }
  }

  const handleEscolherExistente = () => {
    if (!clienteEscolhido) {
      toast({
        title: 'Escolha um cliente',
        description: 'Selecione um cliente já existente na Carteira para torná-lo ativo.',
        variant: 'destructive',
      })
      return
    }
    setProcessando(true)
    aplicarTroca(clienteEscolhido)
    setProcessando(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#07132B]">
            Diagnóstico de outra empresa
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600 leading-relaxed">
            Os dados da empresa atual <strong>permanecem salvos na Carteira</strong>: relatórios
            emitidos, históricos, parâmetros das fases e teses ficam preservados e podem ser
            retomados a qualquer momento ao reativá-la como cliente ativo.
          </DialogDescription>
        </DialogHeader>

        {!via && (
          <div className="grid gap-3 py-2">
            <button
              type="button"
              onClick={() => setVia('nova')}
              className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-[#D4AF37] hover:bg-amber-50/50 cursor-pointer"
            >
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#07132B] text-[#D4AF37]">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#07132B]">Criar cliente novo em branco</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Cadastre uma nova empresa e comece a análise do zero, com campos em branco.
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setVia('existente')}
              className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-[#D4AF37] hover:bg-amber-50/50 cursor-pointer"
            >
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#07132B] text-[#D4AF37]">
                <FolderOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#07132B]">
                  Escolher cliente já existente na Carteira
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Retome a análise de um cliente que já está cadastrado na sua Carteira.
                </p>
              </div>
            </button>
          </div>
        )}

        {via === 'nova' && (
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="nome-novo-cliente" className="text-xs font-semibold text-slate-700">
                Nome do cliente / empresa *
              </Label>
              <Input
                id="nome-novo-cliente"
                value={nomeNova}
                onChange={(e) => setNomeNova(e.target.value)}
                placeholder="Ex.: Nova Empresa Ltda."
                autoFocus
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cnpj-novo-cliente" className="text-xs font-semibold text-slate-700">
                CNPJ (opcional)
              </Label>
              <Input
                id="cnpj-novo-cliente"
                value={cnpjNova}
                onChange={(e) => setCnpjNova(e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <p className="text-xs text-slate-500">
              Os demais dados (UF, segmento, regime, faturamento) serão preenchidos na Fonte Mestra
              (Dados da Empresa), para onde você será levado em seguida.
            </p>
          </div>
        )}

        {via === 'existente' && (
          <div className="grid gap-3 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome ou CNPJ..."
                className="pl-9"
                autoFocus
              />
            </div>
            <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
              {resultadosBusca.length === 0 ? (
                <p className="p-4 text-xs text-slate-500 text-center">
                  Nenhum cliente encontrado na Carteira.
                </p>
              ) : (
                resultadosBusca.map((c) => {
                  const selecionado = clienteEscolhido?.id === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setClienteEscolhido(c)}
                      className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors cursor-pointer ${
                        selecionado ? 'bg-amber-50' : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#07132B] truncate">{c.nome}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {[c.cnpj_cpf, c.segmento, c.regime_atual].filter(Boolean).join(' • ') ||
                            'Cadastro sem detalhes'}
                        </p>
                      </div>
                      {selecionado && <Building2 className="h-4 w-4 shrink-0 text-[#D4AF37]" />}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {via ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setVia(null)}
              disabled={processando}
              className="text-slate-600"
            >
              <X className="h-4 w-4 mr-1" /> Voltar
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={processando}
              className="text-slate-600"
            >
              Cancelar
            </Button>
          )}
          {via === 'nova' && (
            <Button
              type="button"
              onClick={handleCriarNovo}
              disabled={processando}
              className="bg-[#07132B] hover:bg-[#0c224c] text-[#D4AF37] font-bold"
            >
              {processando ? 'Criando...' : 'Criar e abrir Dados da Empresa'}
            </Button>
          )}
          {via === 'existente' && (
            <Button
              type="button"
              onClick={handleEscolherExistente}
              disabled={processando}
              className="bg-[#07132B] hover:bg-[#0c224c] text-[#D4AF37] font-bold"
            >
              {processando ? 'Trocando...' : 'Tornar ativo e abrir Dados da Empresa'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ModalTrocarEmpresaDiagnostico
