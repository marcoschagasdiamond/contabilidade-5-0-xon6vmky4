import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Search, Loader2, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react'
import { formatarCNPJ, limparCNPJ, validarCNPJ } from '@/lib/cnpj'
import {
  consultarCnpjExterno,
  type DadosCnpjConsulta,
  type ResultadoConsultaCnpj,
} from '@/services/consultaCnpj'
import { ModalConfirmarDadosCnpj, type CamposAplicacaoCnpj } from './ModalConfirmarDadosCnpj'

export interface CampoBuscaCnpjProps {
  id?: string
  valor: string
  onChangeValor: (novoValorFormatado: string) => void
  disabled?: boolean
  readOnly?: boolean
  erro?: string
  valoresAtuaisFormulario: {
    nomeEmpresa?: string
    segmento?: string
    ufOrigem?: string
    cidade?: string
    email?: string
    telefone?: string
  }
  aoAplicarDadosCnpj: (dados: DadosCnpjConsulta, opcoes: CamposAplicacaoCnpj) => void
  label?: string
  obrigatorio?: boolean
  className?: string
  exibirHelper?: boolean
}

export function CampoBuscaCnpj({
  id = 'cnpjEmpresa',
  valor,
  onChangeValor,
  disabled = false,
  readOnly = false,
  erro,
  valoresAtuaisFormulario,
  aoAplicarDadosCnpj,
  label = 'CNPJ da Empresa',
  obrigatorio = true,
  className = '',
  exibirHelper = true,
}: CampoBuscaCnpjProps) {
  const [carregando, setCarregando] = useState(false)
  const [erroConsulta, setErroConsulta] = useState<string | null>(null)
  const [avisoConsulta, setAvisoConsulta] = useState<string | null>(null)
  const [dadosConsulta, setDadosConsulta] = useState<DadosCnpjConsulta | null>(null)
  const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false)

  const cnpjLimpo = limparCNPJ(valor)
  const cnpjEValido = cnpjLimpo.length === 14 && validarCNPJ(cnpjLimpo)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatado = formatarCNPJ(e.target.value)
    onChangeValor(formatado)
    if (erroConsulta) setErroConsulta(null)
    if (avisoConsulta) setAvisoConsulta(null)
  }

  const handleBuscarCnpj = async () => {
    if (disabled || readOnly || carregando) return

    setErroConsulta(null)
    setAvisoConsulta(null)

    if (!cnpjLimpo) {
      setErroConsulta('Digite o número do CNPJ antes de buscar.')
      return
    }

    if (cnpjLimpo.length !== 14) {
      setErroConsulta(`CNPJ incompleto (${cnpjLimpo.length} de 14 dígitos).`)
      return
    }

    if (!validarCNPJ(cnpjLimpo)) {
      setErroConsulta('CNPJ inválido de acordo com os dígitos verificadores.')
      return
    }

    setCarregando(true)
    try {
      const res: ResultadoConsultaCnpj = await consultarCnpjExterno(cnpjLimpo)

      if (res.sucesso && res.dados) {
        setDadosConsulta(res.dados)
        if (res.aviso) setAvisoConsulta(res.aviso)
        setModalConfirmacaoAberto(true)
      } else {
        setErroConsulta(
          res.erro || 'Não foi possível encontrar os dados para este CNPJ na Receita Federal.',
        )
      }
    } catch (err: any) {
      setErroConsulta(
        err?.message || 'Erro ao consultar CNPJ externo. Verifique sua conexão e tente novamente.',
      )
    } finally {
      setCarregando(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (cnpjEValido && !carregando) {
        handleBuscarCnpj()
      }
    }
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Label e contador */}
      <div className="flex items-center justify-between">
        <Label
          htmlFor={id}
          className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
        >
          {label} {obrigatorio && <span className="text-red-500">*</span>}
        </Label>
        <span className="text-[11px] text-slate-400">14 dígitos</span>
      </div>

      {/* Input com botão Buscar integrado */}
      <div className="relative flex items-center">
        <Input
          id={id}
          type="text"
          value={valor || ''}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          maxLength={18}
          placeholder="00.000.000/0000-00"
          disabled={disabled || carregando}
          readOnly={readOnly}
          className={`h-12 bg-white font-mono font-medium pr-28 text-slate-900 ${
            erro || erroConsulta ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
          }`}
        />

        <div className="absolute right-1.5 flex items-center">
          <Button
            type="button"
            size="sm"
            onClick={handleBuscarCnpj}
            disabled={disabled || readOnly || carregando || cnpjLimpo.length < 14}
            className={`h-9 px-3 text-xs font-semibold gap-1.5 transition-all shadow-xs ${
              cnpjEValido
                ? 'bg-[#145A32] hover:bg-[#114b2a] text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
            }`}
            title="Buscar razão social, endereço e CNAE na Receita Federal via BrasilAPI"
          >
            {carregando ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Buscando...</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Buscar</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Feedback de erro */}
      {(erro || erroConsulta) && (
        <p className="text-xs text-red-600 font-medium flex items-center gap-1.5 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{erro || erroConsulta}</span>
        </p>
      )}

      {/* Feedback de aviso (contingência) */}
      {avisoConsulta && !erro && !erroConsulta && (
        <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1 mt-1">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-amber-600" />
          <span>{avisoConsulta}</span>
        </p>
      )}

      {/* Helper text padrão */}
      {!erro && !erroConsulta && exibirHelper && (
        <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
          <span>
            Digite o CNPJ e clique em <strong>Buscar</strong> para carregar razão social, CNAE e
            localização da Receita Federal.
          </span>
        </p>
      )}

      {/* Modal de confirmação para prevenir sobrescrita silenciosa */}
      <ModalConfirmarDadosCnpj
        aberto={modalConfirmacaoAberto}
        aoFechar={() => setModalConfirmacaoAberto(false)}
        dados={dadosConsulta}
        valoresAtuais={valoresAtuaisFormulario}
        aoConfirmar={aoAplicarDadosCnpj}
      />
    </div>
  )
}
