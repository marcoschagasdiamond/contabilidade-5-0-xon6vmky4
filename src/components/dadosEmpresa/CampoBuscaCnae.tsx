import React, { useState } from 'react'
import {
  Search,
  Loader2,
  Sparkles,
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  buscarCnaeExterna,
  formatarCNAE,
  limparCNAE,
  type ItemResultadoCnae,
} from '@/services/consultaCnae'
import { ModalConfirmarDadosCnae, type OpcoesConfirmacaoCnae } from './ModalConfirmarDadosCnae'
import { BadgeProvenienciaCnae } from './BadgeProvenienciaCnae'

interface CampoBuscaCnaeProps {
  id?: string
  valorCnaeCodigo?: string
  valorCnaeDescricao?: string
  onChangeCnae?: (codigoFormatado: string, descricao: string) => void
  erro?: string
  valoresAtuaisFormulario?: {
    cnaeCodigo?: string
    cnaeDescricao?: string
    segmento?: string
  }
  aoAplicarDadosCnae?: (cnae: ItemResultadoCnae, opcoes: OpcoesConfirmacaoCnae) => void
  label?: string
  obrigatorio?: boolean
  disabled?: boolean
  className?: string
  placeholder?: string
}

/**
 * Componente de Entrada e Busca Externa de CNAE.
 *
 * Funcionalidades:
 * 1. Campo de texto aceita código CNAE numérico (ex: 6201501 ou 6201-5/01) OU termo textual (ex: "desenvolvimento de software").
 * 2. Botão "Buscar CNAE" consulta a API pública/proxy/base curada com feedback visual.
 * 3. Se houver resultado único (código exato), abre modal direto de confirmação.
 * 4. Se houver múltiplos resultados (busca por termo), exibe dropdown/lista com opções para o usuário escolher.
 * 5. Tratamento de erros amigável em português sem mutar o formulário.
 */
export const CampoBuscaCnae: React.FC<CampoBuscaCnaeProps> = ({
  id = 'cnaeEmpresaInput',
  valorCnaeCodigo = '',
  valorCnaeDescricao = '',
  onChangeCnae,
  erro,
  valoresAtuaisFormulario,
  aoAplicarDadosCnae,
  label = 'Atividade Econômica / CNAE Principal',
  obrigatorio = false,
  disabled = false,
  className = '',
  placeholder = 'Digite o código (ex: 6201-5/01) ou atividade (ex: software)',
}) => {
  const [termoBusca, setTermoBusca] = useState(valorCnaeCodigo ? formatarCNAE(valorCnaeCodigo) : '')
  const [carregando, setCarregando] = useState(false)
  const [mensagemErro, setMensagemErro] = useState<string | null>(null)
  const [listaResultados, setListaResultados] = useState<ItemResultadoCnae[]>([])
  const [cnaeSelecionado, setCnaeSelecionado] = useState<ItemResultadoCnae | null>(null)
  const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false)

  // Atualiza termo interno caso o valor da prop mude externamente
  React.useEffect(() => {
    if (valorCnaeCodigo && !termoBusca) {
      setTermoBusca(formatarCNAE(valorCnaeCodigo))
    }
  }, [valorCnaeCodigo])

  const handleBuscar = async () => {
    const termo = termoBusca.trim()
    if (!termo || termo.length < 2) {
      setMensagemErro('Informe pelo menos 2 caracteres ou o código do CNAE.')
      return
    }

    setCarregando(true)
    setMensagemErro(null)
    setListaResultados([])

    try {
      const res = await buscarCnaeExterna(termo)

      if (!res.sucesso || res.itens.length === 0) {
        setMensagemErro(
          res.erro ||
            `Nenhum CNAE encontrado para "${termo}". Verifique o código ou termo digitado.`,
        )
        return
      }

      // Se encontrou exatamente 1 resultado (busca pontual por código exato)
      if (res.itens.length === 1) {
        setCnaeSelecionado(res.itens[0])
        setModalConfirmacaoAberto(true)
      } else {
        // Múltiplos resultados encontrados (busca por termo)
        setListaResultados(res.itens)
      }
    } catch {
      setMensagemErro(
        'Falha momentânea ao consultar serviços de CNAE. Tente novamente em instantes.',
      )
    } finally {
      setCarregando(false)
    }
  }

  const handleSelecionarItemDaLista = (item: ItemResultadoCnae) => {
    setCnaeSelecionado(item)
    setListaResultados([])
    setModalConfirmacaoAberto(true)
  }

  const handleConfirmarModal = (cnae: ItemResultadoCnae, opcoes: OpcoesConfirmacaoCnae) => {
    // Atualiza campo local caso o usuário tenha optado por preencher
    if (opcoes.aplicarCnaeCodigo) {
      setTermoBusca(cnae.codigoFormatado)
      if (onChangeCnae) {
        onChangeCnae(cnae.codigoFormatado, cnae.descricao)
      }
    }

    if (aoAplicarDadosCnae) {
      aoAplicarDadosCnae(cnae, opcoes)
    }
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Label e cabeçalho */}
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
        >
          {label} {obrigatorio && <span className="text-red-500">*</span>}
        </label>
        <span className="text-[11px] text-slate-400">Código ou busca textual oficial</span>
      </div>

      {/* Input com botão integrado de busca */}
      <div className="relative flex items-center">
        <input
          id={id}
          type="text"
          value={termoBusca}
          onChange={(e) => {
            const v = e.target.value
            setTermoBusca(v)
            if (mensagemErro) setMensagemErro(null)
            if (onChangeCnae) {
              const codLimpo = limparCNAE(v)
              if (codLimpo.length >= 4 && codLimpo.length <= 7 && !/[a-zA-Z]/.test(v)) {
                onChangeCnae(formatarCNAE(codLimpo), valorCnaeDescricao)
              } else {
                onChangeCnae(v, valorCnaeDescricao)
              }
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleBuscar()
            }
          }}
          disabled={disabled || carregando}
          placeholder={placeholder}
          className={`w-full pl-4 pr-28 py-3 rounded-xl border text-sm transition-all ${
            disabled
              ? 'bg-slate-100 text-slate-500 cursor-not-allowed select-none border-slate-200'
              : erro || mensagemErro
                ? 'border-red-400 bg-red-50/20 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-red-400/30'
                : 'border-slate-200 text-slate-900 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#2ECC71]/30 focus:border-[#2ECC71]'
          }`}
        />

        <div className="absolute right-1.5 flex items-center gap-1">
          <Button
            type="button"
            onClick={handleBuscar}
            disabled={disabled || carregando || !termoBusca.trim()}
            size="sm"
            className="h-8 px-2.5 text-xs font-semibold bg-[#2ECC71] hover:bg-[#27ae60] text-[#0A1A13] shadow-xs flex items-center gap-1 rounded-lg"
            title="Buscar CNAE em bases públicas oficiais"
          >
            {carregando ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Buscando</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Buscar CNAE</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Descrição do CNAE selecionado (se houver) */}
      {valorCnaeDescricao && (
        <div className="flex items-start gap-1.5 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200/60 mt-1">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span className="leading-snug">{valorCnaeDescricao}</span>
        </div>
      )}

      {/* Mensagem de erro de busca ou validação */}
      {(erro || mensagemErro) && (
        <div className="flex items-start gap-1.5 text-xs text-red-600 font-medium mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{mensagemErro || erro}</span>
        </div>
      )}

      {/* Lista suspensa de resultados quando houver múltiplos */}
      {listaResultados.length > 0 && (
        <div className="mt-2 bg-white rounded-xl border border-slate-200 shadow-md divide-y divide-slate-100 max-h-60 overflow-y-auto z-20 relative">
          <div className="p-2.5 bg-slate-50/80 text-[11px] font-semibold text-slate-600 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              {listaResultados.length} CNAEs encontrados. Clique para selecionar:
            </span>
            <button
              type="button"
              onClick={() => setListaResultados([])}
              className="text-slate-400 hover:text-slate-600 text-[10px]"
            >
              Fechar
            </button>
          </div>
          {listaResultados.map((item) => (
            <button
              key={item.codigo}
              type="button"
              onClick={() => handleSelecionarItemDaLista(item)}
              className="w-full text-left p-3 hover:bg-emerald-50/40 transition-colors flex items-center justify-between gap-3 group"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                    {item.codigoFormatado}
                  </span>
                  <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    {item.segmentoSugerido}
                  </span>
                </div>
                <p className="text-xs text-slate-700 truncate font-medium">{item.descricao}</p>
                {item.divisaoDescricao && (
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {item.divisaoDescricao}
                  </p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Modal de confirmação */}
      <ModalConfirmarDadosCnae
        aberto={modalConfirmacaoAberto}
        aoFechar={() => {
          setModalConfirmacaoAberto(false)
          setCnaeSelecionado(null)
        }}
        cnae={cnaeSelecionado}
        valoresAtuais={{
          cnaeCodigo: valorCnaeCodigo || termoBusca,
          cnaeDescricao: valorCnaeDescricao,
          segmento: valoresAtuaisFormulario?.segmento,
        }}
        aoConfirmar={handleConfirmarModal}
      />
    </div>
  )
}
