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
import type { ResultadoCotacaoIndividual } from '@/lib/calculoComparadorCotacoes'
import type { FornecedorDiagnostico } from '@/services/fornecedores'

export interface ModalSalvarCotacaoVencedoraProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  cotacaoVencedora: ResultadoCotacaoIndividual | null
  fornecedoresCadastrados: FornecedorDiagnostico[]
  itemPadrao?: string
  anoTransicao: number
  regimeComprador: string
  classificacaoItem: string
  onSalvar: (dados: {
    fornecedorId?: string
    fornecedorNome: string
    descricaoItem: string
    observacoes?: string
    cadastrarFornecedorNaCarteira: boolean
    dadosNovoFornecedor?: {
      nome: string
      cnpj?: string
      volumeCompras?: number
    }
  }) => Promise<void>
}

export function ModalSalvarCotacaoVencedora({
  aberto,
  onOpenChange,
  cotacaoVencedora,
  fornecedoresCadastrados,
  itemPadrao = '',
  anoTransicao,
  regimeComprador,
  classificacaoItem,
  onSalvar,
}: ModalSalvarCotacaoVencedoraProps) {
  const [fornecedorSelecionadoId, setFornecedorSelecionadoId] = useState<string>('')
  const [fornecedorNomeManual, setFornecedorNomeManual] = useState<string>('')
  const [descricaoItem, setDescricaoItem] = useState<string>(itemPadrao)
  const [observacoes, setObservacoes] = useState<string>('')
  const [cadastrarNaCarteira, setCadastrarNaCarteira] = useState<boolean>(false)
  const [cnpjNovo, setCnpjNovo] = useState<string>('')
  const [volumeComprasNovo, setVolumeComprasNovo] = useState<string>('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Quando abre ou muda a cotação vencedora
  React.useEffect(() => {
    if (cotacaoVencedora) {
      setDescricaoItem(itemPadrao || 'Insumo / Mercadoria Cotada')

      // Tenta achar fornecedor com nome similar na carteira
      const nomeCot = cotacaoVencedora.fornecedorNome.toLowerCase().trim()
      const correspondente = fornecedoresCadastrados.find(
        (f) =>
          f.nome.toLowerCase().includes(nomeCot) ||
          nomeCot.includes(f.nome.toLowerCase()) ||
          f.id === cotacaoVencedora.id,
      )

      if (correspondente && correspondente.id) {
        setFornecedorSelecionadoId(correspondente.id)
        setFornecedorNomeManual(correspondente.nome)
        setCadastrarNaCarteira(false)
      } else {
        setFornecedorSelecionadoId('')
        setFornecedorNomeManual(cotacaoVencedora.fornecedorNome)
        setCadastrarNaCarteira(true) // Facilita cadastrar rapidamente se não estiver na carteira
      }
    }
    setErro(null)
  }, [cotacaoVencedora, fornecedoresCadastrados, itemPadrao, aberto])

  const handleFornecedorSelectChange = (id: string) => {
    setFornecedorSelecionadoId(id)
    if (id === '__novo__') {
      setFornecedorNomeManual(cotacaoVencedora?.fornecedorNome || '')
      setCadastrarNaCarteira(true)
    } else if (id) {
      const f = fornecedoresCadastrados.find((item) => item.id === id)
      if (f) {
        setFornecedorNomeManual(f.nome)
        setCadastrarNaCarteira(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cotacaoVencedora) return

    const nomeFinal = fornecedorNomeManual.trim()
    if (!nomeFinal) {
      setErro('Informe o nome do fornecedor.')
      return
    }

    setSalvando(true)
    setErro(null)

    try {
      const volNum = parseFloat(volumeComprasNovo.replace(/\./g, '').replace(',', '.'))
      await onSalvar({
        fornecedorId:
          fornecedorSelecionadoId && fornecedorSelecionadoId !== '__novo__'
            ? fornecedorSelecionadoId
            : undefined,
        fornecedorNome: nomeFinal,
        descricaoItem: descricaoItem.trim() || 'Item / Cotação',
        observacoes: observacoes.trim() || undefined,
        cadastrarFornecedorNaCarteira: cadastrarNaCarteira && !fornecedorSelecionadoId,
        dadosNovoFornecedor:
          cadastrarNaCarteira && !fornecedorSelecionadoId
            ? {
                nome: nomeFinal,
                cnpj: cnpjNovo.trim() || undefined,
                volumeCompras: !isNaN(volNum) && volNum > 0 ? volNum : cotacaoVencedora.precoBruto,
              }
            : undefined,
      })
      onOpenChange(false)
    } catch (err: any) {
      setErro(err?.message || 'Falha ao salvar a cotação no histórico.')
    } finally {
      setSalvando(false)
    }
  }

  if (!cotacaoVencedora) return null

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white border border-slate-200 text-slate-800 p-6 sm:p-7 rounded-[22px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 w-fit mb-1">
            <span>COTAÇÃO VENCEDORA • {cotacaoVencedora.identificador}</span>
          </div>
          <DialogTitle className="text-xl font-heading font-extrabold text-slate-900">
            Salvar Cotação no Histórico do Fornecedor
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Registre esta decisão vencedora no histórico para servir de referência em futuras
            compras e auditoria de crédito.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {erro && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {erro}
            </div>
          )}

          {/* RESUMO DOS NÚMEROS DA COTAÇÃO VENCEDORA */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Dados Calculados da Oferta Vencedora
            </span>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-white border border-slate-100">
                <span className="text-[10px] text-slate-400 block">Preço Face:</span>
                <span className="font-mono font-bold text-slate-900">
                  R${' '}
                  {cotacaoVencedora.precoBruto.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-100">
                <span className="text-[10px] text-slate-400 block">Crédito Ganho:</span>
                <span className="font-mono font-bold text-emerald-600">
                  R${' '}
                  {cotacaoVencedora.creditoRecuperavel.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-100">
                <span className="text-[10px] text-slate-400 block">Custo Líquido:</span>
                <span className="font-mono font-bold text-[#07132B]">
                  R${' '}
                  {cotacaoVencedora.custoLiquido.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>
                Regime: <strong>{cotacaoVencedora.regimeRotulo}</strong> (
                {cotacaoVencedora.aliquotaEfetivaAplicada.toFixed(1)}%)
              </span>
              <span>Ano: {anoTransicao}</span>
            </div>
          </div>

          {/* VÍNCULO COM FORNECEDOR DA CARTEIRA OU NOVO */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">
              Vincular a Fornecedor da Carteira
            </Label>
            <select
              value={fornecedorSelecionadoId || (cadastrarNaCarteira ? '__novo__' : '')}
              onChange={(e) => handleFornecedorSelectChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 font-medium focus:ring-1 focus:ring-[#07132B]"
            >
              <option value="">Salvar avulso no histórico (sem vínculo com a carteira)</option>
              {fornecedoresCadastrados.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome} (
                  {f.regime === 'simples_nacional'
                    ? 'Simples'
                    : f.regime === 'lucro_presumido'
                      ? 'Presumido'
                      : f.regime === 'lucro_real'
                        ? 'Lucro Real'
                        : 'Misto'}
                  )
                </option>
              ))}
              <option value="__novo__">+ Cadastrar este fornecedor na Carteira da Etapa 06</option>
            </select>
          </div>

          {/* NOME DO FORNECEDOR */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">
              Nome / Razão Social do Fornecedor *
            </Label>
            <Input
              type="text"
              required
              value={fornecedorNomeManual}
              onChange={(e) => setFornecedorNomeManual(e.target.value)}
              placeholder="Ex: Fornecedor Alpha Insumos Ltda"
              className="text-xs border-slate-200"
            />
          </div>

          {/* CAMPOS RÁPIDOS SE FOR CADASTRAR NA CARTEIRA */}
          {(!fornecedorSelecionadoId || fornecedorSelecionadoId === '__novo__') && (
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-900">
                <input
                  type="checkbox"
                  checked={cadastrarNaCarteira}
                  onChange={(e) => setCadastrarNaCarteira(e.target.checked)}
                  className="rounded border-amber-300 text-[#07132B] focus:ring-[#07132B]"
                />
                <span>Adicionar também como fornecedor cadastrado na Carteira da Etapa 06</span>
              </label>

              {cadastrarNaCarteira && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-amber-950">CNPJ (opcional)</Label>
                    <Input
                      type="text"
                      value={cnpjNovo}
                      onChange={(e) => setCnpjNovo(e.target.value)}
                      placeholder="00.000.000/0000-00"
                      className="text-xs border-amber-200 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-amber-950">
                      Volume Anual Estimado (R$)
                    </Label>
                    <Input
                      type="text"
                      value={volumeComprasNovo}
                      onChange={(e) => setVolumeComprasNovo(e.target.value)}
                      placeholder="Ex: 50.000"
                      className="text-xs border-amber-200 bg-white font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ITEM / PRODUTO COTADO */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">
              Descrição do Item / Mercadoria *
            </Label>
            <Input
              type="text"
              required
              value={descricaoItem}
              onChange={(e) => setDescricaoItem(e.target.value)}
              placeholder="Ex: Aço laminado 1020, embalagens plásticas, frete..."
              className="text-xs border-slate-200"
            />
          </div>

          {/* OBSERVAÇÕES */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">
              Observações da Cotação (opcional)
            </Label>
            <Input
              type="text"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Condição de pagamento 30 dias; entrega imediata; lote 500 un."
              className="text-xs border-slate-200"
            />
          </div>

          {/* BOTÕES */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={salvando}
              onClick={() => onOpenChange(false)}
              className="text-xs text-slate-600"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={salvando}
              className="text-xs font-bold bg-[#07132B] hover:bg-[#0c224c] text-white border border-[#D4AF37]/50"
            >
              {salvando ? 'Salvando...' : 'Confirmar e Salvar no Histórico'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
