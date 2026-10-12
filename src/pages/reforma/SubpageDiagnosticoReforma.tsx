import React from 'react'
import { DiamondHeader, DiamondFooterCTA } from '@/components/reforma/DiamondLayout'
import { ConteudoModulo7Diagnostico } from '@/components/reforma/Modulo7DiagnosticoReforma'

export default function SubpageDiagnosticoReforma() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <DiamondHeader
        badge="MÓDULO 7 • ROTEIRO TÉCNICO DE REUNIÃO"
        titulo="Diagnóstico da Reforma (Roteiro de 40 Minutos)"
        subtitulo="Roteiro guiado em dois blocos operacionais (Negócio & Vendas / Operação & ERP) que gera laudo com farol de risco, 3 prioridades para 90 dias e serviço recomendado."
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ConteudoModulo7Diagnostico modo="reforma" />
      </div>

      <DiamondFooterCTA />
    </div>
  )
}
