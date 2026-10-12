import React from 'react'
import { DiamondHeader, DiamondFooterCTA } from '@/components/reforma/DiamondLayout'
import { Modulo6ComparadorRegime } from '@/components/reforma/Modulo6ComparadorRegime'

export default function SubpageComparador() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <DiamondHeader
        badge="MÓDULO 6 • DECISÃO DE REGIME"
        titulo="Comparador de Regime Tributário"
        subtitulo="Simples Tradicional, Simples Híbrido ou Regime Normal? Responda a 4 perguntas e conheça os 3 cenários mais comuns do mercado."
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Modulo6ComparadorRegime modo="reforma" />
      </div>

      <DiamondFooterCTA />
    </div>
  )
}
