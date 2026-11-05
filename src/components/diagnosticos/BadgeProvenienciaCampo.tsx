import React from 'react'
import type { OrigemCampoImportado } from '@/types/dadosEmpresa'

interface BadgeProvenienciaCampoProps {
  origem?: OrigemCampoImportado | null
  className?: string
  variante?: 'compacta' | 'completa'
}

export function BadgeProvenienciaCampo({
  origem,
  className = '',
  variante = 'compacta',
}: BadgeProvenienciaCampoProps) {
  if (!origem) return null

  const formatarData = (iso: string) => {
    try {
      const d = new Date(iso)
      if (isNaN(d.getTime())) return iso
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    } catch {
      return iso
    }
  }

  const rotuloTipo =
    origem.tipo === 'balancete'
      ? 'Balancete'
      : origem.tipo === 'efd_contribuicoes'
        ? 'EFD Contribuições'
        : origem.tipo === 'efd_icms_ipi'
          ? 'EFD ICMS/IPI'
          : origem.tipo === 'nfe_xml'
            ? 'NF-e (Lote XML)'
            : 'Documento Fiscal'

  const dataFmt = formatarData(origem.dataImportacao)
  const textoTooltip = `Preenchido via ${rotuloTipo} (${origem.documento}) importado em ${dataFmt}`

  if (variante === 'completa') {
    return (
      <span
        title={textoTooltip}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-[#07132B] text-[#D4AF37] border border-[#D4AF37]/30 shadow-xs ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse shrink-0" />
        <span>
          Preenchido via {rotuloTipo} em {dataFmt}
        </span>
      </span>
    )
  }

  return (
    <span
      title={textoTooltip}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[9px] font-bold bg-[#07132B] text-[#D4AF37] border border-[#D4AF37]/30 shadow-2xs ${className}`}
    >
      <span className="w-1 h-1 rounded-full bg-[#D4AF37] shrink-0" />
      <span>
        {rotuloTipo} • {dataFmt}
      </span>
    </span>
  )
}
