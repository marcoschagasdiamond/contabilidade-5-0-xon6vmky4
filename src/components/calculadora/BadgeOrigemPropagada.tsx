import React from 'react'

export type OrigemPropagadaTipo = 'modulo1' | 'dados-empresa' | 'configuracoes' | 'custom'

export interface BadgeOrigemPropagadaProps {
  texto?: string
  origem?: OrigemPropagadaTipo | string
  className?: string
  title?: string
}

/**
 * Indicador visual discreto para campos preenchidos automaticamente pelo Módulo 1 ou Dados da Empresa.
 * Estilo padrão Diamond Group (verde escuro / dourado discreto), sem ícones.
 */
export function BadgeOrigemPropagada({
  texto,
  origem,
  className = '',
  title,
}: BadgeOrigemPropagadaProps) {
  // Determina texto e tooltip padrão com base na prop 'origem' caso 'texto' ou 'title' não sejam fornecidos
  let textoExibido = texto
  let titleExibido = title

  if (!textoExibido) {
    if (origem === 'dados-empresa') {
      textoExibido = 'vindo de Dados da Empresa — editável aqui'
      titleExibido =
        titleExibido ||
        'Valor preenchido automaticamente a partir do cadastro em Dados da Empresa (/dados-empresa). Você pode editá-lo livremente.'
    } else if (origem === 'configuracoes') {
      textoExibido = 'vindo das Configurações — editável aqui'
      titleExibido =
        titleExibido ||
        'Valor preenchido a partir das Configurações do Diagnóstico. Você pode editá-lo livremente aqui.'
    } else {
      // Padrão (modulo1 ou omitido)
      textoExibido = 'vindo do Módulo 1 — editável aqui'
      titleExibido =
        titleExibido ||
        'Valor propagado automaticamente pelo Módulo 1 (Configurações Gerais). Você pode editá-lo livremente aqui.'
    }
  } else if (!titleExibido) {
    if (origem === 'dados-empresa') {
      titleExibido = 'Valor preenchido a partir de Dados da Empresa (/dados-empresa).'
    } else if (origem === 'configuracoes') {
      titleExibido = 'Valor preenchido a partir das Configurações do Diagnóstico.'
    } else {
      titleExibido =
        'Valor propagado automaticamente pelo Módulo 1. Você pode editar este campo livremente aqui.'
    }
  }

  return (
    <span
      title={titleExibido}
      className={`inline-flex items-center text-[10px] font-medium text-emerald-800 bg-emerald-50/90 border border-emerald-300/60 px-1.5 py-0.5 rounded leading-tight select-none ${className}`}
    >
      {textoExibido}
    </span>
  )
}

export default BadgeOrigemPropagada
