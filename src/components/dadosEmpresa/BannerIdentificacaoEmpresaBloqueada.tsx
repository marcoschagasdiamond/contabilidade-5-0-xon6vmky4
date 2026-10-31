import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { ModalCorrigirDadosEmpresa } from '@/components/dadosEmpresa/ModalCorrigirDadosEmpresa'
import type { DadosEmpresaPerfil } from '@/types/dadosEmpresa'

interface BannerIdentificacaoEmpresaBloqueadaProps {
  origemModulo: 'calculadora' | 'recuperador' | 'diagnostico'
  dadosAtuais?: {
    nomeEmpresa?: string
    cnpj?: string
    cidade?: string
    uf?: string
    email?: string
    telefone?: string
    contato?: string
  }
  onDadosAtualizados?: (dados: DadosEmpresaPerfil) => void
  className?: string
}

/**
 * Banner informativo com o botão "Corrigir dados" exclusivo para o perfil Empresário.
 * Mostra a trava de identificação ativa com caminho único auditado de conformidade.
 */
export function BannerIdentificacaoEmpresaBloqueada({
  origemModulo,
  dadosAtuais,
  onDadosAtualizados,
  className = '',
}: BannerIdentificacaoEmpresaBloqueadaProps) {
  const { isEmpresario } = useAuth()
  const [modalAberto, setModalAberto] = useState(false)

  if (!isEmpresario) return null

  return (
    <>
      <div
        className={`p-4 rounded-2xl bg-gradient-to-r from-[#07132B] via-[#0E1F42] to-[#122347] border border-[#D4AF37]/40 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${className}`}
      >
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse shrink-0" />
            <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider bg-[#D4AF37]/15 px-2 py-0.5 rounded-full border border-[#D4AF37]/30">
              Identificação Oficial da Empresa • Somente Leitura
            </span>
          </div>
          <p className="text-xs text-slate-200 leading-snug">
            {dadosAtuais?.nomeEmpresa ? (
              <>
                Empresa ativa:{' '}
                <strong className="text-white font-extrabold">{dadosAtuais.nomeEmpresa}</strong>
                {dadosAtuais.cnpj && (
                  <span className="font-mono text-slate-300 text-[11px] ml-1.5">
                    ({dadosAtuais.cnpj})
                  </span>
                )}
                .
              </>
            ) : (
              'Os dados de identificação e cadastro desta empresa estão protegidos contra edições manuais avulsas.'
            )}{' '}
            Os pareceres e relatórios técnicos são gerados estritamente com os dados cadastrados.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalAberto(true)}
          className="self-start sm:self-auto shrink-0 px-4 py-2 rounded-xl text-xs font-extrabold bg-[#D4AF37] hover:bg-[#E5C158] text-[#07132B] shadow-sm transition-all cursor-pointer"
        >
          Corrigir dados
        </button>
      </div>

      <ModalCorrigirDadosEmpresa
        open={modalAberto}
        onOpenChange={setModalAberto}
        origemModulo={origemModulo}
        onDadosAtualizados={onDadosAtualizados}
      />
    </>
  )
}
