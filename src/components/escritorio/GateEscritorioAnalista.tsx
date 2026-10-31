import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { analistaPossuiEscritorioPreenchido, gateEscritorioDispensado } from '@/services/escritorio'

interface GateEscritorioAnalistaProps {
  children: React.ReactNode
}

/**
 * Gate leve para primeiro acesso do Analista:
 * - Se for Empresário/Cliente: NÃO bloqueia (Regra 2 - continua seu fluxo normal).
 * - Se for Master / Admin / Analista: se ainda não preencheu o escritório e não dispensou nesta sessão,
 *   leva ao formulário curto de /dados-escritorio.
 * - O Analista pode clicar em "Pular e preencher depois", dispensando o gate na sessão atual.
 */
export function GateEscritorioAnalista({ children }: GateEscritorioAnalistaProps) {
  const { user, isEmpresario, isContador, isAdmin } = useAuth()
  const location = useLocation()

  // Se não estiver logado ou se for Empresário/Cliente, não aplica o gate
  if (!user || isEmpresario) {
    return <>{children}</>
  }

  // Se estiver na própria página do escritório, não redireciona
  if (location.pathname === '/dados-escritorio') {
    return <>{children}</>
  }

  // Analista / Admin / Master
  const ehAnalistaOuSuperior = isContador || isAdmin
  if (ehAnalistaOuSuperior) {
    const preenchido = analistaPossuiEscritorioPreenchido()
    const dispensado = gateEscritorioDispensado()

    if (!preenchido && !dispensado) {
      // Redireciona com o destino desejado
      return (
        <Navigate
          to={`/dados-escritorio?redirect=${encodeURIComponent(location.pathname + location.search)}`}
          replace
        />
      )
    }
  }

  return <>{children}</>
}
