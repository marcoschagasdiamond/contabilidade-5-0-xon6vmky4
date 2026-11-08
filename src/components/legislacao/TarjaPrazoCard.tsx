import React from 'react'
import { EstadoPrazoCard } from '@/config/radarPrazos'

interface TarjaPrazoCardProps {
  estado: EstadoPrazoCard
  className?: string
}

/**
 * Componente que exibe a tarja de automação de prazo no card fixo do Radar:
 * - Vencido: Tarja vermelha com "Prazo Vencido"
 * - Prorrogado: Tarja azul com "Prorrogado até DD/MM" (ou texto configurado)
 * - Vigente: null (nenhuma tarja)
 */
export const TarjaPrazoCard: React.FC<TarjaPrazoCardProps> = ({ estado, className = '' }) => {
  if (!estado.tarjaTexto) {
    return null
  }

  if (estado.status === 'prorrogado') {
    return (
      <div
        data-testid="tarja-prazo-prorrogado"
        className={`w-full bg-blue-600 text-white font-heading font-extrabold text-xs sm:text-sm py-1.5 px-3 text-center uppercase tracking-wider shadow-md flex items-center justify-center gap-2 border-b border-blue-400/40 ${className}`}
      >
        <span className="inline-block w-2 h-2 rounded-full bg-blue-200 animate-pulse" />
        <span>{estado.tarjaTexto}</span>
      </div>
    )
  }

  if (estado.status === 'vencido') {
    return (
      <div
        data-testid="tarja-prazo-vencido"
        className={`w-full bg-rose-600 text-white font-heading font-extrabold text-xs sm:text-sm py-1.5 px-3 text-center uppercase tracking-wider shadow-md flex items-center justify-center gap-2 border-b border-rose-400/40 ${className}`}
      >
        <span className="inline-block w-2 h-2 rounded-full bg-white animate-ping" />
        <span>{estado.tarjaTexto}</span>
      </div>
    )
  }

  return null
}
