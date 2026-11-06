import React from 'react'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, Info } from 'lucide-react'

export interface BadgeProvenienciaCnpjProps {
  consultadoEm?: string
  fonte?: 'brasilapi' | 'receitaws' | 'proxy' | string
  className?: string
  variante?: 'compacta' | 'detalhada'
}

export function BadgeProvenienciaCnpj({
  consultadoEm,
  fonte = 'brasilapi',
  className = '',
  variante = 'compacta',
}: BadgeProvenienciaCnpjProps) {
  const formatarData = (iso?: string) => {
    if (!iso) return ''
    try {
      const d = new Date(iso)
      if (isNaN(d.getTime())) return iso
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return iso
    }
  }

  const rotuloFonte =
    fonte === 'receitaws' ? 'ReceitaWS' : fonte === 'proxy' ? 'Proxy C5.0' : 'BrasilAPI'

  const dataFmt = formatarData(consultadoEm)
  const textoTooltip = `Dados cadastrais oficiais obtidos da Receita Federal via ${rotuloFonte}${dataFmt ? ` em ${dataFmt}` : ''}`

  if (variante === 'detalhada') {
    return (
      <div
        title={textoTooltip}
        className={`p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/90 flex items-start gap-2.5 text-xs text-emerald-950 ${className}`}
      >
        <ShieldCheck className="w-4 h-4 text-[#145A32] shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed">
          <div className="font-semibold text-[#145A32] flex items-center gap-1.5">
            <span>Dados Oficiais Validados</span>
            <Badge className="bg-[#145A32] text-white text-[10px] px-1.5 py-0 font-mono">
              {rotuloFonte}
            </Badge>
          </div>
          <p className="text-[11px] text-slate-600">
            Razão social, CNAE, endereço e situação cadastral preenchidos com base nos registros
            públicos da Receita Federal.{dataFmt ? ` Consulta realizada em ${dataFmt}.` : ''}
          </p>
        </div>
      </div>
    )
  }

  return (
    <span
      title={textoTooltip}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-[#07132B] text-[#D4AF37] border border-[#D4AF37]/30 shadow-xs ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[#145A32] border border-emerald-400 shrink-0" />
      <span>
        Receita Federal ({rotuloFonte}){dataFmt ? ` • ${dataFmt}` : ''}
      </span>
    </span>
  )
}
