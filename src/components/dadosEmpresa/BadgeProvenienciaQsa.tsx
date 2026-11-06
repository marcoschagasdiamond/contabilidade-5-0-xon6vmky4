import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Users, ShieldCheck } from 'lucide-react'

export interface BadgeProvenienciaQsaProps {
  consultadoEm?: string
  fonte?: string
  totalSocios?: number
  className?: string
  variante?: 'compacta' | 'detalhada'
}

export function BadgeProvenienciaQsa({
  consultadoEm,
  fonte = 'Receita Federal',
  totalSocios,
  className = '',
  variante = 'compacta',
}: BadgeProvenienciaQsaProps) {
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
    fonte === 'receitaws'
      ? 'ReceitaWS'
      : fonte === 'minhareceita'
        ? 'Minha Receita (RFB)'
        : fonte === 'proxy'
          ? 'Proxy C5.0'
          : fonte === 'brasilapi'
            ? 'BrasilAPI'
            : fonte

  const dataFmt = formatarData(consultadoEm)
  const textoTooltip = `Quadro de Sócios e Administradores (QSA) consultado em fonte pública oficial (${rotuloFonte})${
    dataFmt ? ` em ${dataFmt}` : ''
  }`

  if (variante === 'detalhada') {
    return (
      <div
        title={textoTooltip}
        className={`p-3 rounded-xl bg-blue-50/80 border border-blue-200/90 flex items-start gap-2.5 text-xs text-blue-950 ${className}`}
      >
        <Users className="w-4 h-4 text-[#07132B] shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed">
          <div className="font-semibold text-[#07132B] flex items-center gap-1.5">
            <span>QSA Consultado em Fonte Pública</span>
            <Badge className="bg-[#07132B] text-[#D4AF37] text-[10px] px-1.5 py-0 font-mono">
              {rotuloFonte}
            </Badge>
          </div>
          <p className="text-[11px] text-slate-600">
            {totalSocios !== undefined
              ? `${totalSocios} sócio(s)/administrador(es) localizado(s). `
              : ''}
            Dados sincronizados com o registro público da Receita Federal.
            {dataFmt ? ` Consulta realizada em ${dataFmt}.` : ''}
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
      <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
      <span>
        QSA Oficial ({rotuloFonte}){dataFmt ? ` • ${dataFmt}` : ''}
      </span>
    </span>
  )
}
