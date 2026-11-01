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
import type {
  FornecedorDiagnostico,
  RegimeFornecedor,
  ClassificacaoCreditoItem,
} from '@/services/fornecedores'

export interface ModalEditarFornecedorProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  fornecedorInicial?: FornecedorDiagnostico | null
  onSalvar: (fornecedor: Omit<FornecedorDiagnostico, 'id' | 'created' | 'updated'>) => void
}

export function ModalEditarFornecedor({
  aberto,
  onOpenChange,
  fornecedorInicial,
  onSalvar,
}: ModalEditarFornecedorProps) {
  const [nome, setNome] = useState(fornecedorInicial?.nome || '')
  const [cnpj, setCnpj] = useState(fornecedorInicial?.cnpj || '')
  const [regime, setRegime] = useState<RegimeFornecedor>(fornecedorInicial?.regime || 'lucro_real')
  const [proporcaoMisto, setProporcaoMisto] = useState<number>(
    fornecedorInicial?.proporcao_misto ?? 50,
  )
  const [volumeCompras, setVolumeCompras] = useState<number>(
    fornecedorInicial?.volume_compras || 100000,
  )
  const [classificacaoCredito, setClassificacaoCredito] = useState<ClassificacaoCreditoItem>(
    fornecedorInicial?.classificacao_credito || 'integral',
  )
  const [percentualCreditoParcial, setPercentualCreditoParcial] = useState<number>(
    fornecedorInicial?.percentual_credito_parcial ?? 50,
  )
  const [descricaoItem, setDescricaoItem] = useState(fornecedorInicial?.descricao_item || '')
  const [aliquotaSimplesInformada, setAliquotaSimplesInformada] = useState<string>(
    fornecedorInicial?.aliquota_simples_informada
      ? String(fornecedorInicial.aliquota_simples_informada)
      : '',
  )
  const [erro, setErro] = useState<string | null>(null)

  // Atualiza estado quando abre com fornecedorInicial diferente
  React.useEffect(() => {
    if (fornecedorInicial) {
      setNome(fornecedorInicial.nome)
      setCnpj(fornecedorInicial.cnpj || '')
      setRegime(fornecedorInicial.regime)
      setProporcaoMisto(fornecedorInicial.proporcao_misto ?? 50)
      setVolumeCompras(fornecedorInicial.volume_compras)
      setClassificacaoCredito(fornecedorInicial.classificacao_credito)
      setPercentualCreditoParcial(fornecedorInicial.percentual_credito_parcial ?? 50)
      setDescricaoItem(fornecedorInicial.descricao_item || '')
      setAliquotaSimplesInformada(
        fornecedorInicial.aliquota_simples_informada
          ? String(fornecedorInicial.aliquota_simples_informada)
          : '',
      )
    } else {
      setNome('')
      setCnpj('')
      setRegime('lucro_real')
      setProporcaoMisto(50)
      setVolumeCompras(100000)
      setClassificacaoCredito('integral')
      setPercentualCreditoParcial(50)
      setDescricaoItem('')
      setAliquotaSimplesInformada('')
    }
    setErro(null)
  }, [fornecedorInicial, aberto])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) {
      setErro('Informe a razão social ou nome fantasia do fornecedor.')
      return
    }
    if (volumeCompras <= 0) {
      setErro('O volume de compras deve ser maior que zero.')
      return
    }

    const payload: Omit<FornecedorDiagnostico, 'id' | 'created' | 'updated'> = {
      nome: nome.trim(),
      cnpj: cnpj.trim() || undefined,
      regime,
      proporcao_misto: regime === 'misto' ? proporcaoMisto : undefined,
      volume_compras: volumeCompras,
      classificacao_credito: classificacaoCredito,
      percentual_credito_parcial:
        classificacaoCredito === 'parcial' ? percentualCreditoParcial : undefined,
      descricao_item: descricaoItem.trim() || undefined,
      aliquota_simples_informada:
        regime === 'simples_nacional' && aliquotaSimplesInformada
          ? parseFloat(aliquotaSimplesInformada) || undefined
          : undefined,
      ativo: true,
    }

    onSalvar(payload)
    onOpenChange(false)
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white border border-slate-200 text-slate-800 p-6 sm:p-7 rounded-[22px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <DialogTitle className="text-xl font-heading font-extrabold text-slate-900">
            {fornecedorInicial ? 'Editar Fornecedor' : 'Cadastrar Novo Fornecedor'}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Defina o regime tributário e a classificação de crédito do item fornecido.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {erro && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {erro}
            </div>
          )}

          {/* Nome e CNPJ */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Nome / Razão Social *</Label>
            <Input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Fornecedor Aliança Insumos Ltda"
              className="text-xs border-slate-200"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">CNPJ (opcional)</Label>
              <Input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0000-00"
                className="text-xs border-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Volume de Compras (R$) *</Label>
              <Input
                type="number"
                min="0"
                step="any"
                required
                value={volumeCompras || ''}
                onChange={(e) => setVolumeCompras(parseFloat(e.target.value) || 0)}
                placeholder="Ex: 150000"
                className="text-xs border-slate-200 font-mono"
              />
            </div>
          </div>

          {/* Regime do Fornecedor */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">
              Regime Tributário do Fornecedor *
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'lucro_real' as const, label: 'Lucro Real' },
                { id: 'lucro_presumido' as const, label: 'Presumido' },
                { id: 'simples_nacional' as const, label: 'Simples Nac.' },
                { id: 'misto' as const, label: 'Misto' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRegime(r.id)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                    regime === r.id
                      ? 'bg-[#07132B] text-[#D4AF37] border-[#07132B]'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Proporção se for Misto */}
          {regime === 'misto' && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-900">
                  Proporção Lucro Real: {proporcaoMisto}%
                </span>
                <span className="text-amber-700">Simples Nacional: {100 - proporcaoMisto}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={proporcaoMisto}
                onChange={(e) => setProporcaoMisto(parseInt(e.target.value, 10))}
                className="w-full accent-[#07132B]"
              />
            </div>
          )}

          {/* Alíquota declarada do Simples (opcional) */}
          {regime === 'simples_nacional' && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Alíquota transferida do Simples (% opcional, padrão ~3,5% a 7%)
              </Label>
              <Input
                type="number"
                min="0"
                max="30"
                step="0.1"
                value={aliquotaSimplesInformada}
                onChange={(e) => setAliquotaSimplesInformada(e.target.value)}
                placeholder="Ex: 4.5"
                className="text-xs border-slate-200"
              />
            </div>
          )}

          {/* Classificação do Item / Produto */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <Label className="text-xs font-bold text-slate-700">
              Classificação de Crédito do Item *
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                {
                  id: 'integral' as const,
                  titulo: 'Gera Crédito Integral',
                  sub: '100% da base tributável',
                },
                {
                  id: 'parcial' as const,
                  titulo: 'Crédito Parcial',
                  sub: '% informado da base',
                },
                {
                  id: 'nao_gera' as const,
                  titulo: 'Não Gera Crédito',
                  sub: 'Item sem direito a crédito',
                },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setClassificacaoCredito(c.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    classificacaoCredito === c.id
                      ? 'bg-[#07132B] text-white border-[#07132B]'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <p className="text-xs font-bold">{c.titulo}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{c.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Slider se for Parcial */}
          {classificacaoCredito === 'parcial' && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">
                  Percentual de Crédito Aproveitável: {percentualCreditoParcial}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="95"
                step="5"
                value={percentualCreditoParcial}
                onChange={(e) => setPercentualCreditoParcial(parseInt(e.target.value, 10))}
                className="w-full accent-[#07132B]"
              />
            </div>
          )}

          {/* Descrição do Produto/Serviço */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">
              Descrição do Produto ou Serviço (opcional)
            </Label>
            <Input
              type="text"
              value={descricaoItem}
              onChange={(e) => setDescricaoItem(e.target.value)}
              placeholder="Ex: Matéria-prima de alumínio, embalagens, fretes"
              className="text-xs border-slate-200"
            />
          </div>

          {/* Footer do Modal */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs text-slate-600"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs font-bold bg-[#07132B] hover:bg-[#0c224c] text-white border border-[#D4AF37]/50"
            >
              Salvar Fornecedor
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
