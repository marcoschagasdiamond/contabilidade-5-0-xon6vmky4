import React from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  Calendar,
  BookOpen,
  LayoutGrid,
  ShieldAlert,
  GitCompare,
  ClipboardCheck,
  Kanban,
  Coins,
  FileText,
  Globe,
  Split,
  Calculator,
} from 'lucide-react'

interface DiamondHeaderProps {
  badge?: string
  titulo: string
  subtitulo: string
  mostrarVoltar?: boolean
  mostrarDiagnosticoBtn?: boolean
}

export function DiamondHeader({
  badge,
  titulo,
  subtitulo,
  mostrarVoltar = true,
  mostrarDiagnosticoBtn = false,
}: DiamondHeaderProps) {
  return (
    <div className="relative bg-[#07132B] text-white pt-28 pb-16 px-4 sm:px-6 lg:px-8 border-b border-[#D4AF37]/20 overflow-hidden">
      {/* Background patterns: Diamond geometric glow */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#1A365D] blur-3xl" />
        <div className="absolute top-1/2 -right-20 w-80 h-80 rounded-full bg-[#D4AF37] blur-3xl opacity-30" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {mostrarVoltar && (
          <div className="mb-6">
            <Link
              to="/reforma-tributaria"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-[#D4AF37] transition-colors uppercase tracking-wider bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar ao Hub da Reforma
            </Link>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 uppercase mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
              {badge}
            </div>

            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-tight text-white leading-tight">
              {titulo}
            </h1>

            <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              {subtitulo}
            </p>
          </div>

          {mostrarDiagnosticoBtn && (
            <div className="shrink-0 flex flex-col sm:flex-row gap-3">
              <Link
                to="/diagnostico-configuracoes"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base text-[#07132B] bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] hover:brightness-110 shadow-[0_4px_20px_rgba(212,175,55,0.35)] transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
              >
                <ClipboardCheck className="w-5 h-5 text-[#07132B]" />
                Fazer diagnóstico gratuito
                <ArrowRight className="w-4 h-4 text-[#07132B]" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface DiamondFooterCTAProps {
  titulo?: string
  subtitulo?: string
  mostrarBotao?: boolean
}

export function DiamondFooterCTA({
  titulo = 'Descubra exatamente o impacto financeiro na sua empresa',
  subtitulo = 'Nossa ferramenta calcula a transição 2026-2033, simula IBS, CBS e compara o Simples Nacional com o Regime Normal em menos de 3 minutos.',
  mostrarBotao = false,
}: DiamondFooterCTAProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 my-16">
      <div className="relative rounded-2xl bg-gradient-to-br from-[#07132B] via-[#0E2442] to-[#14345C] text-white p-8 sm:p-12 border border-[#D4AF37]/30 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 mb-3">
              <TrendingUp className="w-3.5 h-3.5" />
              DIAGNOSTICADOR EXECUTIVO DIAMOND
            </div>
            <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-white leading-tight">
              {titulo}
            </h3>
            <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">{subtitulo}</p>
          </div>

          {mostrarBotao && (
            <div className="shrink-0 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link
                to="/diagnostico-configuracoes"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-bold text-[#07132B] bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] hover:brightness-110 shadow-lg shadow-[#D4AF37]/20 transition-all hover:scale-105 cursor-pointer"
              >
                <FileCheck2 className="w-5 h-5 text-[#07132B]" />
                Fazer diagnóstico gratuito
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function getIconComponent(iconName: string) {
  switch (iconName) {
    case 'Globe':
      return <Globe className="w-6 h-6 text-[#D4AF37]" />
    case 'Calendar':
      return <Calendar className="w-6 h-6 text-[#D4AF37]" />
    case 'BookOpen':
      return <BookOpen className="w-6 h-6 text-[#D4AF37]" />
    case 'LayoutGrid':
      return <LayoutGrid className="w-6 h-6 text-[#D4AF37]" />
    case 'ShieldAlert':
      return <ShieldAlert className="w-6 h-6 text-[#D4AF37]" />
    case 'GitCompare':
      return <GitCompare className="w-6 h-6 text-[#D4AF37]" />
    case 'ClipboardCheck':
      return <ClipboardCheck className="w-6 h-6 text-[#D4AF37]" />
    case 'Kanban':
      return <Kanban className="w-6 h-6 text-[#D4AF37]" />
    case 'Coins':
      return <Coins className="w-6 h-6 text-[#D4AF37]" />
    case 'Split':
      return <Split className="w-6 h-6 text-[#D4AF37]" />
    case 'FileText':
      return <FileText className="w-6 h-6 text-[#D4AF37]" />
    case 'Calculator':
      return <Calculator className="w-6 h-6 text-[#D4AF37]" />
    default:
      return <Globe className="w-6 h-6 text-[#D4AF37]" />
  }
}
