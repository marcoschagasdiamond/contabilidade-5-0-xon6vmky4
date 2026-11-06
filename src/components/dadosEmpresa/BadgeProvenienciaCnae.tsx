import React from 'react'
import { CheckCircle2, Globe, Database, Building2 } from 'lucide-react'
import type { ProvedorCnae } from '@/services/consultaCnae'

interface BadgeProvenienciaCnaeProps {
  fonte?: ProvedorCnae | string
  consultadoEm?: string
  className?: string
  tamanho?: 'sm' | 'md'
}

/**
 * Badge de proveniência de dados de CNAE consultados em fontes oficiais/curadas.
 * Segue o padrão de auditoria do app (BadgeProvenienciaCnpj / BadgeProvenienciaCampo).
 */
export const BadgeProvenienciaCnae: React.FC<BadgeProvenienciaCnaeProps> = ({
  fonte,
  consultadoEm,
  className = '',
  tamanho = 'sm',
}) => {
  if (!fonte) return null

  const getNomeFonte = (f: string) => {
    switch (f.toLowerCase()) {
      case 'ibge':
        return 'IBGE Oficial (CONCLA)'
      case 'brasilapi':
        return 'BrasilAPI (IBGE)'
      case 'base_curada':
        return 'Base Curada Oficial'
      case 'proxy_interno':
        return 'IBGE / Base Oficial'
      default:
        return 'Fonte Pública Oficial'
    }
  }

  const getIcone = (f: string) => {
    switch (f.toLowerCase()) {
      case 'ibge':
      case 'brasilapi':
        return <Globe className="w-3 h-3 text-sky-600 inline mr-1" />
      case 'base_curada':
        return <Database className="w-3 h-3 text-emerald-600 inline mr-1" />
      default:
        return <Building2 className="w-3 h-3 text-emerald-600 inline mr-1" />
    }
  }

  const formatarData = (iso?: string) => {
    if (!iso) return ''
    try {
      const d = new Date(iso)
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return ''
    }
  }

  const dataFormatada = formatarData(consultadoEm)
  const isSm = tamanho === 'sm'

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full border shadow-xs transition-colors ${
        fonte === 'base_curada'
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
          : 'bg-sky-50 text-sky-800 border-sky-200'
      } ${isSm ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'} ${className}`}
      title={
        consultadoEm
          ? `CNAE consultado em fonte pública oficial (${getNomeFonte(fonte)}) em ${dataFormatada}`
          : `CNAE consultado em fonte pública oficial (${getNomeFonte(fonte)})`
      }
    >
      <CheckCircle2
        className={`${isSm ? 'w-2.5 h-2.5' : 'w-3 h-3'} ${
          fonte === 'base_curada' ? 'text-emerald-600' : 'text-sky-600'
        }`}
      />
      {getIcone(fonte)}
      <span>{getNomeFonte(fonte)}</span>
      {dataFormatada && (
        <span className="text-[9px] opacity-75 hidden sm:inline ml-0.5 font-mono">
          ({dataFormatada})
        </span>
      )}
    </span>
  )
}
