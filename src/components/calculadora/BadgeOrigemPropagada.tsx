import React from 'react'

interface BadgeOrigemPropagadaProps {
  texto?: string
  className?: string
  title?: string
}

/**
 * Indicador visual discreto para campos preenchidos automaticamente pelo Módulo 1.
 * Estilo padrão Diamond Group (verde escuro / dourado discreto), sem ícones.
 */
export function BadgeOrigemPropagada({
  texto = 'vindo do Módulo 1 — editável aqui',
  className = '',
  title = 'Valor propagado automaticamente pelo Módulo 1. Você pode editar este campo livremente aqui.',
}: BadgeOrigemPropagadaProps) {
  return (
    <span
      title={title}
      className={`inline-flex items-center text-[10px] font-medium text-emerald-800 bg-emerald-50/90 border border-emerald-300/60 px-1.5 py-0.5 rounded leading-tight select-none ${className}`}
    >
      {texto}
    </span>
  )
}

export default BadgeOrigemPropagada
