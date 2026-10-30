import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { criarCrmCliente } from '@/services/crm'
import type { StatusComercialCrm, CrmClienteRecord } from '@/types/crm'
import type { ClienteEmpresaRecord } from '@/services/clientesEmpresas'

interface ModalNovaFichaCrmProps {
  aberto: boolean
  aoFechar: () => void
  empresasDisponiveis: ClienteEmpresaRecord[]
  aoSalvarSucesso: (novo: CrmClienteRecord) => void
}

export function ModalNovaFichaCrm({
  aberto,
  aoFechar,
  empresasDisponiveis,
  aoSalvarSucesso,
}: ModalNovaFichaCrmProps) {
  const { toast } = useToast()

  const [modo, setModo] = useState<'existente' | 'nova'>('existente')
  const [empresaIdSelecionada, setEmpresaIdSelecionada] = useState<string>('')
  const [statusComercial, setStatusComercial] = useState<StatusComercialCrm>('Prospect')
  const [origemContato, setOrigemContato] = useState('')
  const [valorMensal, setValorMensal] = useState<string>('')
  const [dataEntrada, setDataEntrada] = useState<string>(new Date().toISOString().slice(0, 10))
  const [observacoes, setObservacoes] = useState('')
  const [salvando, setSalvando] = useState(false)

  // Campos para quando for cadastrar nova empresa junto
  const [novaEmpresaNome, setNovaEmpresaNome] = useState('')
  const [novaEmpresaContato, setNovaEmpresaContato] = useState('')
  const [novaEmpresaCnpj, setNovaEmpresaCnpj] = useState('')
  const [novaEmpresaEmail, setNovaEmpresaEmail] = useState('')
  const [novaEmpresaTelefone, setNovaEmpresaTelefone] = useState('')
  const [novaEmpresaRegime, setNovaEmpresaRegime] = useState('Simples Nacional')
  const [novaEmpresaSegmento, setNovaEmpresaSegmento] = useState('Serviços')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)

    try {
      let empresaIdFinal = empresaIdSelecionada

      if (modo === 'nova') {
        if (!novaEmpresaNome.trim()) {
          toast({
            title: 'Nome da Empresa obrigatório',
            description: 'Informe a razão social ou nome fantasia.',
            variant: 'destructive',
          })
          setSalvando(false)
          return
        }

        // Criar registro na coleção clientes_empresas
        const { salvarClienteEmpresaNoBanco } = await import('@/services/clientesEmpresas')
        const novaEmpresa = await salvarClienteEmpresaNoBanco(
          {
            nomeEmpresa: novaEmpresaNome.trim(),
            nomeContato: novaEmpresaContato.trim() || 'Responsável',
            cnpj: novaEmpresaCnpj.trim() || '00.000.000/0000-00',
            email: novaEmpresaEmail.trim() || 'contato@empresa.com.br',
            telefone: novaEmpresaTelefone.trim() || '+55 (11) 99999-9999',
            regimeAtual: novaEmpresaRegime,
            segmento: novaEmpresaSegmento as any,
          },
          '',
        )
        empresaIdFinal = novaEmpresa.id
      }

      const valorNumerico = valorMensal ? parseFloat(valorMensal.replace(',', '.')) : 0

      const novo = await criarCrmCliente({
        empresa_id: empresaIdFinal || undefined,
        status_comercial: statusComercial,
        origem_contato: origemContato.trim(),
        valor_mensal_servico: isNaN(valorNumerico) ? 0 : valorNumerico,
        data_entrada: dataEntrada || new Date().toISOString().slice(0, 10),
        observacoes: observacoes.trim(),
      })

      toast({
        title: 'Ficha Comercial Criada!',
        description: 'O cliente agora integra a gestão ativa do seu CRM.',
      })

      aoSalvarSucesso(novo)
      aoFechar()
    } catch (err: any) {
      console.error('Erro ao criar ficha no CRM:', err)
      toast({
        title: 'Erro ao criar ficha',
        description: err?.message || 'Falha ao salvar ficha comercial.',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={aoFechar}>
      <DialogContent className="sm:max-w-xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1.5 text-left border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#07132B] text-[#D4AF37]">
              Fase 3 • CRM Comercial
            </span>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Nova Ficha
            </span>
          </div>
          <DialogTitle className="font-heading font-extrabold text-2xl text-[#07132B]">
            Abrir Ficha de Cliente no CRM
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-600 leading-relaxed">
            Selecione uma empresa já existente na base ou registre uma nova para iniciar o
            acompanhamento comercial, pipeline e histórico de interações.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* SELETOR DE MODO */}
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold text-slate-700">
            <button
              type="button"
              onClick={() => setModo('existente')}
              className={`flex-1 py-2 rounded-lg transition-all ${
                modo === 'existente'
                  ? 'bg-white text-[#07132B] shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Vincular a Empresa Cadastrada ({empresasDisponiveis.length})
            </button>
            <button
              type="button"
              onClick={() => setModo('nova')}
              className={`flex-1 py-2 rounded-lg transition-all ${
                modo === 'nova'
                  ? 'bg-white text-[#07132B] shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Cadastrar Nova Empresa
            </button>
          </div>

          {modo === 'existente' ? (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Empresa Cadastrada (clientes_empresas)
              </Label>
              <select
                value={empresaIdSelecionada}
                onChange={(e) => setEmpresaIdSelecionada(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              >
                <option value="">Selecione a empresa...</option>
                {empresasDisponiveis.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nome_empresa} • {emp.cnpj || 'Sem CNPJ'} (
                    {emp.regime_atual || 'Regime N/D'})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-bold text-[#07132B] uppercase tracking-wider block">
                Dados Básicos da Nova Empresa
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-700">
                    Nome / Razão Social *
                  </Label>
                  <Input
                    required
                    placeholder="Ex: Alfa Logística Ltda"
                    value={novaEmpresaNome}
                    onChange={(e) => setNovaEmpresaNome(e.target.value)}
                    className="text-xs h-9 rounded-xl border-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-700">CNPJ</Label>
                  <Input
                    placeholder="00.000.000/0000-00"
                    value={novaEmpresaCnpj}
                    onChange={(e) => setNovaEmpresaCnpj(e.target.value)}
                    className="text-xs h-9 rounded-xl border-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-700">Nome do Contato</Label>
                  <Input
                    placeholder="Ex: Carlos Oliveira"
                    value={novaEmpresaContato}
                    onChange={(e) => setNovaEmpresaContato(e.target.value)}
                    className="text-xs h-9 rounded-xl border-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-700">E-mail</Label>
                  <Input
                    type="email"
                    placeholder="carlos@alfalog.com.br"
                    value={novaEmpresaEmail}
                    onChange={(e) => setNovaEmpresaEmail(e.target.value)}
                    className="text-xs h-9 rounded-xl border-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-700">
                    Telefone / WhatsApp
                  </Label>
                  <Input
                    placeholder="+55 (11) 99999-9999"
                    value={novaEmpresaTelefone}
                    onChange={(e) => setNovaEmpresaTelefone(e.target.value)}
                    className="text-xs h-9 rounded-xl border-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-700">Regime Tributário</Label>
                  <select
                    value={novaEmpresaRegime}
                    onChange={(e) => setNovaEmpresaRegime(e.target.value)}
                    className="w-full text-xs h-9 rounded-xl border border-slate-300 px-2.5 bg-white"
                  >
                    <option value="Simples Nacional">Simples Nacional</option>
                    <option value="Lucro Presumido">Lucro Presumido</option>
                    <option value="Lucro Real">Lucro Real</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* DADOS COMERCIAIS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Status Comercial *</Label>
              <select
                value={statusComercial}
                onChange={(e) => setStatusComercial(e.target.value as StatusComercialCrm)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              >
                <option value="Prospect">Prospect (Em sondagem)</option>
                <option value="Onboarding">Onboarding (Implantação)</option>
                <option value="Ativo">Ativo (Em atendimento)</option>
                <option value="Inativo">Inativo (Pausado)</option>
                <option value="Perdido">Perdido (Não fechado)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Valor Mensal do Serviço (R$)
              </Label>
              <Input
                type="text"
                placeholder="Ex: 2.500,00"
                value={valorMensal}
                onChange={(e) => setValorMensal(e.target.value)}
                className="text-xs rounded-xl border-slate-300"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Origem do Contato</Label>
              <Input
                placeholder="Ex: Indicação, Tráfego Pago, LinkedIn, Evento"
                value={origemContato}
                onChange={(e) => setOrigemContato(e.target.value)}
                className="text-xs rounded-xl border-slate-300"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Data de Entrada</Label>
              <Input
                type="date"
                value={dataEntrada}
                onChange={(e) => setDataEntrada(e.target.value)}
                className="text-xs rounded-xl border-slate-300"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Observações Iniciais</Label>
            <Textarea
              rows={3}
              placeholder="Anotações estratégicas sobre este cliente ou oportunidade..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="text-xs rounded-xl border-slate-300 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={aoFechar}
              disabled={salvando}
              className="text-xs font-bold border-slate-300 text-slate-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={salvando}
              className="bg-[#07132B] text-[#D4AF37] hover:bg-[#0d2249] text-xs font-bold px-5 rounded-xl shadow-md"
            >
              {salvando ? 'Criando Ficha...' : 'Criar Ficha no CRM'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
