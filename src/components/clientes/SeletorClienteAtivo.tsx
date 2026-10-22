import React from 'react'
import { Link } from 'react-router-dom'
import { useClienteAtivo } from '@/context/ClienteAtivoContext'
import { Badge } from '@/components/ui/badge'

interface SeletorClienteAtivoProps {
  className?: string
  mostrarLinkGerenciar?: boolean
  labelCustomizado?: string
}

/**
 * Seletor de Cliente Ativo para o topo da Calculadora e Diagnósticos
 * Padrão Diamond Group: Verde escuro (#07132B) e Dourado (#D4AF37).
 * REGRA PERMANENTE DO USUÁRIO: SEM ÍCONES — apenas texto, badges e marcadores de status.
 */
export function SeletorClienteAtivo({
  className = '',
  mostrarLinkGerenciar = true,
  labelCustomizado,
}: SeletorClienteAtivoProps) {
  const { clienteAtivo, clienteAtivoId, clientes, carregando, selecionarClienteAtivo } =
    useClienteAtivo()

  return (
    <div
      className={`bg-[#07132B] text-white border border-[#D4AF37]/35 rounded-xl px-3.5 py-2.5 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs ${className}`}
    >
      <div className="flex flex-wrap items-center gap-2.5 min-w-0">
        <div className="flex items-center gap-2">
          {/* Marcador de status geométrico/cor sem ícone */}
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              clienteAtivo ? 'bg-[#D4AF37] animate-pulse' : 'bg-slate-500'
            }`}
          />
          <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
            {labelCustomizado || 'Cliente Ativo:'}
          </span>
        </div>

        {/* Dropdown nativo estilizado */}
        <select
          value={clienteAtivoId || ''}
          onChange={(e) => selecionarClienteAtivo(e.target.value || null)}
          disabled={carregando}
          className="bg-[#0D1D3A] text-white text-xs font-semibold rounded-lg px-3 py-1.5 border border-[#D4AF37]/40 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] max-w-[280px] sm:max-w-[340px] truncate cursor-pointer"
          aria-label="Selecionar cliente ativo da carteira"
        >
          <option value="">Sem cliente (Modo Teste / Geral)</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome} {c.cnpj_cpf ? `• ${c.cnpj_cpf}` : ''} ({c.uf})
            </option>
          ))}
        </select>

        {/* Badges de dados do cliente selecionado */}
        {clienteAtivo ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge className="bg-[#D4AF37] text-[#07132B] hover:bg-[#D4AF37] font-bold text-[10px] px-2 py-0.5">
              {clienteAtivo.regime_atual}
            </Badge>
            <Badge
              variant="outline"
              className="border-white/20 text-slate-300 text-[10px] px-2 py-0.5"
            >
              {clienteAtivo.segmento}
            </Badge>
            <Badge
              variant="outline"
              className="border-[#D4AF37]/40 text-[#D4AF37] text-[10px] px-1.5 py-0.5"
            >
              UF: {clienteAtivo.uf}
            </Badge>
          </div>
        ) : (
          <Badge
            variant="outline"
            className="border-slate-600 text-slate-400 text-[10px] px-2 py-0.5"
          >
            Simulações e diagnósticos não vinculados
          </Badge>
        )}
      </div>

      {mostrarLinkGerenciar && (
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {clienteAtivo && (
            <Link
              to={`/clientes/${clienteAtivo.id}`}
              className="text-[#D4AF37] hover:underline font-semibold text-[11px] px-2 py-1 rounded bg-white/5 border border-[#D4AF37]/30 transition-colors"
            >
              Ver Histórico do Cliente
            </Link>
          )}
          <Link
            to="/clientes"
            className="text-slate-300 hover:text-white underline font-medium text-[11px] transition-colors"
          >
            Gerenciar Carteira ({clientes.length})
          </Link>
        </div>
      )}
    </div>
  )
}
