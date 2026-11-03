import React, { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  buscarSugestoesNcm,
  buscarNcmPorCodigo,
  formatarCodigoNcm,
  type ItemNcmCurado,
} from '@/data/tabelaNcmLc214'

export interface CampoNcmAutocompleteProps {
  ncmValor: string
  onChangeNcm: (codigo: string) => void
  onNcmSelecionado: (item: ItemNcmCurado) => void
  itemNcmAtual?: ItemNcmCurado | null
}

export function CampoNcmAutocomplete({
  ncmValor,
  onChangeNcm,
  onNcmSelecionado,
  itemNcmAtual,
}: CampoNcmAutocompleteProps) {
  const [termoBusca, setTermoBusca] = useState(ncmValor || '')
  const [dropdownAberto, setDropdownAberto] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sincroniza se o valor externo mudar
  useEffect(() => {
    setTermoBusca(ncmValor || '')
  }, [ncmValor])

  const sugestoes = buscarSugestoesNcm(termoBusca, 10)

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickFora = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownAberto(false)
      }
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setTermoBusca(val)
    onChangeNcm(val)
    setDropdownAberto(true)

    // Se o usuário digitou exatamente um código existente de 8 dígitos ou NNNN.NN.NN
    const encontrado = buscarNcmPorCodigo(val)
    if (encontrado) {
      onNcmSelecionado(encontrado)
    }
  }

  const handleSelecionarItem = (item: ItemNcmCurado) => {
    setTermoBusca(item.codigo)
    onChangeNcm(item.codigo)
    onNcmSelecionado(item)
    setDropdownAberto(false)
  }

  return (
    <div ref={containerRef} className="space-y-1.5 relative">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-bold text-slate-700">
          NCM do Item / Mercadoria (opcional — LC 214/2025)
        </Label>
        <span className="text-[11px] text-slate-400 font-normal">
          Ex: 1006.30.21, 2202, arroz, fertilizante...
        </span>
      </div>

      <div className="relative">
        <Input
          type="text"
          value={termoBusca}
          onChange={handleInputChange}
          onFocus={() => setDropdownAberto(true)}
          placeholder="Digite o código NCM (8 dígitos) ou nome do produto para buscar na LC 214"
          className="text-xs border-slate-200 font-mono pr-8"
        />
        {termoBusca && (
          <button
            type="button"
            onClick={() => {
              setTermoBusca('')
              onChangeNcm('')
              setDropdownAberto(false)
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            title="Limpar NCM"
          >
            ×
          </button>
        )}
      </div>

      {/* Dropdown de sugestões */}
      {dropdownAberto && sugestoes.length > 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
          <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-bold text-slate-700">
              Sugestões da Tabela Curada (LC 214/2025)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {sugestoes.length} encontrados
            </span>
          </div>

          {sugestoes.map((item) => (
            <div
              key={item.codigoLimpo}
              onMouseDown={() => handleSelecionarItem(item)}
              className="p-2.5 hover:bg-slate-50 cursor-pointer transition-colors space-y-1"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                  {formatarCodigoNcm(item.codigoLimpo)}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.classificacaoSugerida === 'integral'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : item.classificacaoSugerida === 'parcial'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {item.classificacaoSugerida === 'integral'
                    ? 'Crédito Integral'
                    : item.classificacaoSugerida === 'parcial'
                      ? `Parcial (${item.percentualCreditoSugerido}%)`
                      : 'Não gera crédito'}
                </span>
              </div>
              <p className="text-slate-800 font-medium text-[11px] leading-tight">
                {item.descricao}
              </p>
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                <span>{item.categoriaRotulo}</span>
                <span className="font-mono">{item.anexoReferencia}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Caixa de feedback do NCM identificado */}
      {itemNcmAtual && (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-slate-900">
              NCM {formatarCodigoNcm(itemNcmAtual.codigoLimpo)}: {itemNcmAtual.descricao}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#07132B] text-[#D4AF37]">
              LC 214/2025
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-200">
            <div>
              <span className="text-slate-400 block text-[10px]">Alíquota / Tratamento:</span>
              <strong className="text-slate-800">{itemNcmAtual.aliquotaEfetivaTexto}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Referência Legal:</span>
              <span className="font-mono text-slate-700">{itemNcmAtual.anexoReferencia}</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 italic pt-0.5">
            {itemNcmAtual.observacaoTributaria}
          </p>
          <p className="text-[10px] text-emerald-700 font-bold">
            ✓ Classificação sugerida automaticamente. Você pode alterá-la manualmente abaixo se
            desejar.
          </p>
        </div>
      )}
    </div>
  )
}
