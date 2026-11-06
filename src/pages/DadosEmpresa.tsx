import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useDadosEmpresa } from '@/context/DadosEmpresaContext'
import {
  calcularDiffDadosEmpresa,
  registrarAuditoriaDadosEmpresa,
  listarAuditoriaDadosEmpresa,
} from '@/services/historicoDadosEmpresa'
import { AbaHistoricoCadastral } from '@/components/crm/AbaHistoricoCadastral'
import type { HistoricoDadosEmpresaRegistro } from '@/types/historicoDadosEmpresa'
import { DadosEmpresaPerfil, DADOS_EMPRESA_PADRAO } from '@/types/dadosEmpresa'
import { ResultadoParsingLoteNfe, construirOrigemCamposNfe } from '@/lib/parseNfeLote'
import { LISTA_UFS_ICMS } from '@/types/calculadoraIbsCbs'
import {
  SegmentoEmpresa,
  CIDADES_ISS_MAPA,
  obterAliquotaISS,
  obterAliquotaIcmsUf,
} from '@/lib/regimes'
import {
  CATEGORIAS_MONOFASICOS_OPCOES,
  REGIMES_ESPECIAIS_OPCOES,
  PERFIS_RETENCAO_SPLIT_OPCOES,
  RegimeEspecialAtual,
  PerfilRetencaoSplit,
} from '@/types/dadosEmpresa'
import { Switch } from '@/components/ui/switch'
import { formatarCNPJ, limparCNPJ } from '@/lib/cnpj'
import { formatarMoeda } from '@/lib/calculadoraUtils'
import {
  executarValidacaoFiscal,
  validarCnpjInline,
  validarEmailInline,
  validarTelefoneInline,
  validarPercentualInline,
  validarValorMonetarioInline,
} from '@/lib/validacaoDadosFiscais'
import { IndicadorValidadeFiscal } from '@/components/dadosEmpresa/IndicadorValidadeFiscal'
import { PainelAvisosCoerencia } from '@/components/dadosEmpresa/PainelAvisosCoerencia'
import { SecaoImportacaoDocumentosFiscais } from '@/components/dadosEmpresa/SecaoImportacaoDocumentosFiscais'
import { SecaoVinculosSocietarios } from '@/components/dadosEmpresa/SecaoVinculosSocietarios'
import { CampoBuscaCnpj } from '@/components/dadosEmpresa/CampoBuscaCnpj'
import { BadgeProvenienciaCnpj } from '@/components/dadosEmpresa/BadgeProvenienciaCnpj'
import { BadgeProvenienciaQsa } from '@/components/dadosEmpresa/BadgeProvenienciaQsa'
import { CampoBuscaCnae } from '@/components/dadosEmpresa/CampoBuscaCnae'
import { SecaoCnaesSecundarios } from '@/components/dadosEmpresa/SecaoCnaesSecundarios'
import { PainelTributosAtividade } from '@/components/dadosEmpresa/PainelTributosAtividade'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type { ItemCnaeSecundarioSalvo } from '@/types/dadosEmpresa'
import { BadgeProvenienciaCnae } from '@/components/dadosEmpresa/BadgeProvenienciaCnae'
import type { ItemResultadoCnae } from '@/services/consultaCnae'
import type { OpcoesConfirmacaoCnae } from '@/components/dadosEmpresa/ModalConfirmarDadosCnae'
import {
  mapearCnaeParaSegmento,
  mapearCnaeParaSegmentoOpcional,
  mapearCidadeIss,
  type DadosCnpjConsulta,
} from '@/services/consultaCnpj'
import type { CamposAplicacaoCnpj } from '@/components/dadosEmpresa/ModalConfirmarDadosCnpj'
import { VinculoSocietario, PapelClienteNoVinculo } from '@/types/dadosEmpresa'
import { ResultadoParsingSped } from '@/lib/parseSpedFiscal'
import { DiamondHeader, DiamondFooterCTA } from '@/components/reforma/DiamondLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Save,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Calculator,
  Scale,
  Coins,
  Calendar,
  FileSpreadsheet,
  ArrowRight,
  Users,
  ShieldCheck,
  ShoppingCart,
  Briefcase,
  Factory,
  HeartPulse,
  GraduationCap,
  Sprout,
  Truck,
  Cpu,
  Hammer,
  UtensilsCrossed,
  Percent,
  Landmark,
  Globe2,
  Receipt,
  CreditCard,
  AlertTriangle,
  Info,
  LogIn,
  UserPlus,
  Cloud,
  Lock,
} from 'lucide-react'

// Formatador de telefone brasileiro padrão (+55 XX XXXXX-XXXX)
const formatPhoneBR = (value: string) => {
  let digits = value.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length > 2) {
    digits = digits.slice(2)
  }
  digits = digits.slice(0, 11)
  if (digits.length === 0) return ''
  if (digits.length <= 2) return `+55 (${digits}`
  if (digits.length <= 6) return `+55 (${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) {
    return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

export default function DadosEmpresa() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const {
    dadosEmpresa,
    temDadosSalvos,
    salvoNoBanco,
    isSalvando,
    salvar,
    restaurarPadrao,
    empresaVinculadaId,
  } = useDadosEmpresa()

  const [historicoAuditoria, setHistoricoAuditoria] = useState<HistoricoDadosEmpresaRegistro[]>([])
  const [carregandoHistorico, setCarregandoHistorico] = useState(false)

  // Estado local do formulário
  const CHAVE_RASCUNHO = 'contabilidade50_rascunho_dados_empresa'
  const [formData, setFormData] = useState<DadosEmpresaPerfil>(() => {
    // Restaura rascunho salvo caso os campos principais estejam vazios
    if (typeof window !== 'undefined') {
      try {
        const salvo = localStorage.getItem(CHAVE_RASCUNHO)
        if (salvo) {
          const rascunho = JSON.parse(salvo)
          return { ...dadosEmpresa, ...rascunho }
        }
      } catch (err) {
        console.warn('Erro ao restaurar rascunho de dados da empresa:', err)
      }
    }
    return dadosEmpresa
  })

  const [searchParams] = useSearchParams()
  const destinoParam = searchParams.get('destino') || ''
  const destinoFinal =
    destinoParam === '/calculadora-ibs-cbs' || destinoParam === '/diagnostico' ? destinoParam : ''

  // URL atual completa com query parameters para retorno pós-login
  const currentPathWithSearch = `${location.pathname}${location.search}`

  const [salvoComSucesso, setSalvoComSucesso] = useState(false)
  const [mensagemErro, setMensagemErro] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Validação em tempo real e coerência automática
  const resultadoValidacao = React.useMemo(() => {
    return executarValidacaoFiscal(formData)
  }, [formData])

  // Rastreia se o usuário já editou campos localmente
  const hasEditedRef = React.useRef(false)
  // Rastreia o ID da empresa vinculado para detectar troca de cliente ativo
  const lastEmpresaIdRef = React.useRef<string | null>(empresaVinculadaId)

  // Sincroniza apenas no primeiro carregamento ou na troca de cliente ativo,
  // sem sobrescrever dados que o usuário já começou a digitar
  useEffect(() => {
    const houveTrocaDeCliente = lastEmpresaIdRef.current !== empresaVinculadaId
    if (houveTrocaDeCliente) {
      lastEmpresaIdRef.current = empresaVinculadaId
      hasEditedRef.current = false
      setFormData(dadosEmpresa)
      return
    }

    if (!hasEditedRef.current) {
      setFormData(dadosEmpresa)
    }
  }, [dadosEmpresa, empresaVinculadaId])

  // Helper para atualizar formData e marcar como editado pelo usuário
  const atualizarCampo = React.useCallback(
    (atualizador: (prev: DadosEmpresaPerfil) => DadosEmpresaPerfil) => {
      hasEditedRef.current = true
      setFormData(atualizador)
    },
    [],
  )

  // Modal de confirmação para troca de segmento via CNAE Principal
  const [modalConfirmarTrocaSegmentoCnaePrincipal, setModalConfirmarTrocaSegmentoCnaePrincipal] =
    useState(false)
  const [segmentoPendenteCnaePrincipal, setSegmentoPendenteCnaePrincipal] = useState<{
    segmento: SegmentoEmpresa
    cnaeCodigo: string
    cnaeDescricao: string
  } | null>(null)

  // Aplica o segmento sugerido a partir do CNAE Principal registrando proveniência
  const aplicarSegmentoSugeridoCnaePrincipal = React.useCallback(
    (novoSeg: SegmentoEmpresa, cnaeCod?: string, cnaeDesc?: string) => {
      atualizarCampo((prev) => {
        const atualizado = { ...prev, segmento: novoSeg }
        if (!prev.atividadeMista) {
          if (novoSeg === 'Comércio') atualizado.tipoAtividade = 'comercio'
          else if (novoSeg === 'Indústria') atualizado.tipoAtividade = 'industria'
          else atualizado.tipoAtividade = 'servico'
        }

        const origemAnterior = prev.documentoFiscalImportado?.origemCampos || {}
        const dataHoraIso = new Date().toISOString()
        const rotuloCnae = cnaeCod ? `CNAE Principal ${cnaeCod}` : 'CNAE Principal'

        atualizado.documentoFiscalImportado = {
          ...(prev.documentoFiscalImportado || {
            tipo: 'consulta_cnpj',
            nomeTipo: 'Consulta CNAE Principal',
            nomeArquivo: 'cnae_principal_sugestao',
            dataImportacao: dataHoraIso,
            resumoExtracao: `Segmento ${novoSeg} definido a partir de sugestão do CNAE Principal`,
            camposPreenchidos: ['segmento'],
          }),
          origemCampos: {
            ...origemAnterior,
            segmento: {
              chave: 'segmento',
              rotulo: 'Segmento Principal da Empresa',
              documento: rotuloCnae,
              tipo: 'cnae_principal',
              dataImportacao: dataHoraIso,
              valorFormatado: novoSeg,
            },
          },
        }

        return atualizado
      })

      setErrors((prev) => (prev.segmento ? { ...prev, segmento: '' } : prev))
    },
    [atualizarCampo],
  )

  const handleAcionarSugestaoCnaePrincipal = (
    segmentoSugerido: SegmentoEmpresa,
    cnaeCodigo: string,
    cnaeDescricao: string,
  ) => {
    // Se não há segmento atual definido, aplica direto
    if (!formData.segmento) {
      aplicarSegmentoSugeridoCnaePrincipal(segmentoSugerido, cnaeCodigo, cnaeDescricao)
      return
    }

    // Se já é o mesmo segmento, nada a fazer
    if (formData.segmento === segmentoSugerido) {
      return
    }

    // Se já há segmento preenchido e é diferente, abre dialog de confirmação
    setSegmentoPendenteCnaePrincipal({
      segmento: segmentoSugerido,
      cnaeCodigo,
      cnaeDescricao,
    })
    setModalConfirmarTrocaSegmentoCnaePrincipal(true)
  }

  const handleConfirmarTrocaCnaePrincipal = () => {
    if (segmentoPendenteCnaePrincipal) {
      aplicarSegmentoSugeridoCnaePrincipal(
        segmentoPendenteCnaePrincipal.segmento,
        segmentoPendenteCnaePrincipal.cnaeCodigo,
        segmentoPendenteCnaePrincipal.cnaeDescricao,
      )
    }
    setModalConfirmarTrocaSegmentoCnaePrincipal(false)
    setSegmentoPendenteCnaePrincipal(null)
  }

  // Auto-save com debounce de 600ms no localStorage dedicado
  useEffect(() => {
    if (typeof window === 'undefined') return
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(formData))
      } catch (err) {
        console.warn('Erro ao salvar rascunho no localStorage:', err)
      }
    }, 600)
    return () => clearTimeout(timer)
  }, [formData])

  // Handlers monetários
  const handleFaturamentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    const valor = Number(raw) / 100
    atualizarCampo((prev) => ({ ...prev, faturamentoMensal: valor }))
    const erroFat = validarValorMonetarioInline(valor, 'Faturamento mensal')
    if (erroFat) {
      setErrors((prev) => ({ ...prev, faturamentoMensal: erroFat }))
    } else if (errors.faturamentoMensal) {
      setErrors((prev) => ({ ...prev, faturamentoMensal: '' }))
    }
  }

  const handleFolhaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    const valor = Number(raw) / 100
    atualizarCampo((prev) => ({ ...prev, folhaPagamentoMensal: valor }))
    const erroFolha = validarValorMonetarioInline(valor, 'Folha de pagamento')
    if (erroFolha) {
      setErrors((prev) => ({ ...prev, folhaPagamentoMensal: erroFolha }))
    } else if (errors.folhaPagamentoMensal) {
      setErrors((prev) => ({ ...prev, folhaPagamentoMensal: '' }))
    }
  }

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatarCNPJ(e.target.value)
    atualizarCampo((prev) => ({ ...prev, cnpj: formatted }))
    const erroCnpj = validarCnpjInline(formatted)
    if (erroCnpj) {
      setErrors((prev) => ({ ...prev, cnpj: erroCnpj }))
    } else if (errors.cnpj) {
      setErrors((prev) => ({ ...prev, cnpj: '' }))
    }
  }

  const handleAplicarDadosCnpj = (dados: DadosCnpjConsulta, opcoes: CamposAplicacaoCnpj) => {
    atualizarCampo((prev) => {
      const atualizado = { ...prev }

      // Sempre garante que o CNPJ do formulário esteja com a formatação correta
      atualizado.cnpj = dados.cnpjFormatado || formatarCNPJ(dados.cnpj)

      // Razão Social / Nome da Empresa
      if (opcoes.nomeEmpresa && dados.razaoSocial) {
        if (!opcoes.apenasVazios || !atualizado.nomeEmpresa?.trim()) {
          atualizado.nomeEmpresa = dados.razaoSocial
        }
      }

      // Segmento a partir do CNAE Principal
      if (opcoes.segmento && dados.cnaePrincipalCodigo) {
        if (!opcoes.apenasVazios || !atualizado.segmento) {
          atualizado.segmento = mapearCnaeParaSegmento(
            dados.cnaePrincipalCodigo,
            dados.cnaePrincipalDescricao,
          )
        }
      }

      // UF de Origem
      if (opcoes.ufOrigem && dados.uf) {
        if (!opcoes.apenasVazios || !atualizado.ufOrigem) {
          atualizado.ufOrigem = dados.uf
        }
      }

      // Cidade (ISS)
      if (opcoes.cidade && dados.municipio) {
        if (!opcoes.apenasVazios || !atualizado.cidade) {
          const cid = mapearCidadeIss(dados.municipio, dados.uf)
          atualizado.cidade = cid.cidadeId
        }
      }

      // E-mail
      if (opcoes.email && dados.email) {
        if (!opcoes.apenasVazios || !atualizado.email?.trim()) {
          atualizado.email = dados.email
        }
      }

      // Telefone
      if (opcoes.telefone && dados.telefone) {
        if (!opcoes.apenasVazios || !atualizado.telefone?.trim()) {
          atualizado.telefone = formatPhoneBR(dados.telefone)
        }
      }

      // Guarda os metadados da consulta para proveniência
      const enderecoFmt = [
        dados.logradouro,
        dados.numero ? `nº ${dados.numero}` : '',
        dados.complemento,
        dados.bairro ? `Bairro ${dados.bairro}` : '',
        dados.municipio ? `${dados.municipio}/${dados.uf}` : '',
        dados.cep ? `CEP ${dados.cep.replace(/(\d{5})(\d{3})/, '$1-$2')}` : '',
      ]
        .filter(Boolean)
        .join(', ')

      const sociosRetornados = Array.isArray(dados.qsa)
        ? dados.qsa.map((s, idx) => ({
            id: s.id || `qsa_${idx}`,
            nome: s.nome,
            qualificacao: s.qualificacao,
            cpfCnpj: s.cpfCnpj,
            percentualParticipacao: s.percentualParticipacao,
            dataEntrada: s.dataEntrada,
            faixaEtaria: s.faixaEtaria,
            nomeRepresentanteLegal: s.nomeRepresentanteLegal,
            qualificacaoRepresentanteLegal: s.qualificacaoRepresentanteLegal,
            paisOrigem: s.paisOrigem,
            tipoPessoa: s.tipoPessoa,
          }))
        : []

      atualizado.dadosCnpjConsulta = {
        razaoSocial: dados.razaoSocial,
        nomeFantasia: dados.nomeFantasia,
        situacaoCadastral: dados.situacaoCadastral,
        dataAbertura: dados.dataAbertura,
        cnaePrincipalCodigo: dados.cnaePrincipalCodigo,
        cnaePrincipalDescricao: dados.cnaePrincipalDescricao,
        enderecoCompleto: enderecoFmt,
        cep: dados.cep,
        fonte: dados.fonte,
        consultadoEm: dados.consultadoEm,
        qsa: sociosRetornados,
        qsaFonte: dados.qsaFonte || dados.fonte,
        qsaConsultadoEm: dados.consultadoEm,
      }

      // Integração QSA com Vínculos Societários
      if (
        opcoes.incluirQsa &&
        opcoes.modoQsa === 'vinculos' &&
        sociosRetornados.length > 0 &&
        Array.isArray(opcoes.sociosSelecionadosIds) &&
        opcoes.sociosSelecionadosIds.length > 0
      ) {
        const vinculosAtuais = Array.isArray(atualizado.vinculosSocietarios)
          ? [...atualizado.vinculosSocietarios]
          : []

        // Filtra só os sócios que o técnico manteve marcados
        const sociosParaAdicionar = sociosRetornados.filter((s) =>
          opcoes.sociosSelecionadosIds.includes(s.id),
        )

        sociosParaAdicionar.forEach((socio) => {
          const nomeNormalizado = (socio.nome || '').trim().toLowerCase()
          const docNormalizado = (socio.cpfCnpj || '').replace(/\D/g, '')

          // Verificação de duplicação: evita reinserir vínculo idêntico já cadastrado
          const jaExiste = vinculosAtuais.some((v) => {
            const vNome = (v.nomeEmpresa || '').trim().toLowerCase()
            const vObs = (v.observacoes || '').trim().toLowerCase()
            const vCnpj = (v.cnpj || '').replace(/\D/g, '')

            if (docNormalizado && vCnpj && docNormalizado === vCnpj) return true
            if (vNome === nomeNormalizado || vObs.includes(nomeNormalizado)) return true
            return false
          })

          if (jaExiste) {
            // Se já existe e a opção 'apenasVazios' está ligada ou não queremos sobrescrever, ignora
            return
          }

          // Derivação semântica do papel a partir da qualificação e tipo de pessoa:
          // Se for PJ ou qualificação indicar holding/empresa -> 'socio_pj_holding'
          // Se for Administrador isolado sem quotas -> 'administrador_nao_socio'
          // Caso padrão -> 'socio_pf'
          const qualif = (socio.qualificacao || '').toLowerCase()
          let papelDerivado: PapelClienteNoVinculo = 'socio_pf'

          if (
            socio.tipoPessoa === 'PJ' ||
            qualif.includes('jurídica') ||
            qualif.includes('juridica') ||
            qualif.includes('holding') ||
            docNormalizado.length === 14
          ) {
            papelDerivado = 'pj_socia_holding'
          } else if (
            (qualif.includes('administrador') ||
              qualif.includes('diretor') ||
              qualif.includes('gerente')) &&
            !qualif.includes('sócio') &&
            !qualif.includes('socio') &&
            (socio.percentualParticipacao === undefined || socio.percentualParticipacao === 0)
          ) {
            papelDerivado = 'administrador'
          }

          const exerceAdmin =
            qualif.includes('administrador') ||
            qualif.includes('gerente') ||
            qualif.includes('diretor') ||
            qualif.includes('presidente')

          const participacaoSocio =
            typeof socio.percentualParticipacao === 'number' && socio.percentualParticipacao > 0
              ? socio.percentualParticipacao
              : 50 // padrão seguro se a fonte não trouxe percentual explícito

          vinculosAtuais.push({
            id: `vinc_qsa_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            nomeEmpresa: dados.razaoSocial || 'Empresa Consultada',
            cnpj: dados.cnpjFormatado || formatarCNPJ(dados.cnpj),
            papelCliente: papelDerivado,
            percentualParticipacao: participacaoSocio,
            exerceAdministracao: exerceAdmin,
            regimeEmpresa: 'Simples Nacional',
            faturamentoAnual: 0,
            excecaoLegal: false,
            observacoes: `Sócio/Adm: ${socio.nome}${socio.qualificacao ? ` (${socio.qualificacao})` : ''} - QSA importado em ${new Date().toLocaleDateString('pt-BR')}`,
            dataCadastro: new Date().toISOString(),
          })
        })

        atualizado.vinculosSocietarios = vinculosAtuais
      }

      // Integração de CNAEs Secundários
      if (
        opcoes.incluirCnaesSecundarios &&
        Array.isArray(dados.cnaesSecundarios) &&
        dados.cnaesSecundarios.length > 0 &&
        Array.isArray(opcoes.cnaesSecundariosSelecionadosCodigos) &&
        opcoes.cnaesSecundariosSelecionadosCodigos.length > 0
      ) {
        const cnaesExistentes: ItemCnaeSecundarioSalvo[] = Array.isArray(
          atualizado.cnaesSecundarios,
        )
          ? [...atualizado.cnaesSecundarios]
          : []

        const cnaesParaAdicionar = dados.cnaesSecundarios.filter((c, idx) => {
          const idOuCodigo = c.codigo || `cnae_${idx}`
          return opcoes.cnaesSecundariosSelecionadosCodigos.includes(idOuCodigo)
        })

        cnaesParaAdicionar.forEach((c) => {
          const limpoCodigo = (c.codigo || '').replace(/\D/g, '')
          const jaExiste = cnaesExistentes.some(
            (item) => (item.codigo || '').replace(/\D/g, '') === limpoCodigo,
          )

          if (jaExiste) {
            // Deduplica por código para não sobrescrever nem duplicar
            return
          }

          const segSugerido = mapearCnaeParaSegmentoOpcional(c.codigo, c.descricao) || undefined
          cnaesExistentes.push({
            codigo: c.codigo,
            codigoFormatado: c.codigoFormatado,
            descricao: c.descricao,
            segmentoSugerido: segSugerido,
            fonte: dados.fonte,
            consultadoEm: dados.consultadoEm,
          })
        })

        atualizado.cnaesSecundarios = cnaesExistentes
      }

      return atualizado
    })

    // Limpa erros eventuais dos campos agora preenchidos
    setErrors((prev) => ({
      ...prev,
      cnpj: '',
      nomeEmpresa: '',
      email: '',
      telefone: '',
    }))
  }

  const handleAplicarDadosCnae = (cnae: ItemResultadoCnae, opcoes: OpcoesConfirmacaoCnae) => {
    atualizarCampo((prev) => {
      const atualizado = { ...prev }

      // Segmento Correspondente Sugerido
      if (opcoes.aplicarSegmento && cnae.segmentoSugerido) {
        if (!opcoes.apenasCamposEmBranco || !atualizado.segmento) {
          atualizado.segmento = cnae.segmentoSugerido
          if (!atualizado.atividadeMista) {
            if (cnae.segmentoSugerido === 'Comércio') atualizado.tipoAtividade = 'comercio'
            else if (cnae.segmentoSugerido === 'Indústria') atualizado.tipoAtividade = 'industria'
            else atualizado.tipoAtividade = 'servico'
          }
        }
      }

      // Metadados do CNAE consultado
      atualizado.dadosCnaeConsulta = {
        codigo: cnae.codigo,
        codigoFormatado: cnae.codigoFormatado,
        descricao: cnae.descricao,
        secaoCodigo: cnae.secaoCodigo,
        secaoDescricao: cnae.secaoDescricao,
        divisaoCodigo: cnae.divisaoCodigo,
        divisaoDescricao: cnae.divisaoDescricao,
        segmentoSugerido: cnae.segmentoSugerido,
        fonte: cnae.fonte,
        consultadoEm: cnae.consultadoEm,
      }

      return atualizado
    })

    if (errors.segmento) {
      setErrors((prev) => ({ ...prev, segmento: '' }))
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneBR(e.target.value)
    atualizarCampo((prev) => ({ ...prev, telefone: formatted }))
    const erroTel = validarTelefoneInline(formatted)
    if (erroTel) {
      setErrors((prev) => ({ ...prev, telefone: erroTel }))
    } else if (errors.telefone) {
      setErrors((prev) => ({ ...prev, telefone: '' }))
    }
  }

  const rolarParaCampo = (idCampo: string) => {
    const el = document.getElementById(idCampo)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.focus?.()
    }
  }

  const validarFormulario = (): boolean => {
    const novosErros: Record<string, string> = { ...resultadoValidacao.errosCampos }
    setErrors(novosErros)
    return Object.keys(novosErros).length === 0
  }

  // Validação informativa de soma do perfil de insumos (Fase 1)
  const cheiaAtual = Number(formData.perfilInsumosAliquotaCheia ?? 0)
  const monoAtual = Number(formData.perfilInsumosMonofasicos ?? 0)
  const reduzAtual = Number(formData.perfilInsumosAliquotaReduzida ?? 0)
  const somaPerfilAtual = Math.round((cheiaAtual + monoAtual + reduzAtual) * 100) / 100
  const perfilInsumosDivergente = somaPerfilAtual !== 100

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setMensagemErro(null)

    if (!validarFormulario()) {
      // Scroll até o primeiro erro se houver
      const formTop = document.querySelector('form')
      if (formTop) {
        formTop.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      return
    }

    // Normalização antes de salvar:
    // Se todos os 3 percentuais estiverem zerados (0/0/0), aplica 100/0/0 como "não preenchido"
    let dadosParaSalvar: DadosEmpresaPerfil = { ...formData }
    if (cheiaAtual === 0 && monoAtual === 0 && reduzAtual === 0) {
      dadosParaSalvar = {
        ...dadosParaSalvar,
        perfilInsumosAliquotaCheia: 100,
        perfilInsumosMonofasicos: 0,
        perfilInsumosAliquotaReduzida: 0,
      }
      setFormData(dadosParaSalvar)
    }

    const alteracoes = calcularDiffDadosEmpresa(dadosEmpresa, dadosParaSalvar)

    salvar(dadosParaSalvar)
      .then(async (salvo) => {
        setMensagemErro(null)
        setSalvoComSucesso(true)
        hasEditedRef.current = false

        // Se houve alterações reais, registra auditoria imutável
        if (alteracoes.length > 0) {
          try {
            await registrarAuditoriaDadosEmpresa({
              empresaId: empresaVinculadaId,
              userId: user?.id,
              origemAjuste: 'pagina_dados_empresa',
              nomeEmpresa: salvo.nomeEmpresa,
              cnpj: salvo.cnpj,
              alteracoes,
              snapshotAnterior: dadosEmpresa,
              snapshotNovo: salvo,
              descricao: `Ajuste cadastral realizado em Dados da Empresa (${alteracoes.length} campo(s) alterado(s))`,
            })
            // Recarrega rastro
            listarAuditoriaDadosEmpresa({
              empresaId: empresaVinculadaId || undefined,
              userId: user?.id || undefined,
            }).then((h) => setHistoricoAuditoria(h))
          } catch (e) {
            console.warn('Erro ao gravar auditoria na página Dados da Empresa:', e)
          }
        }
        // Se usuário veio do onboarding ou está no fluxo de onboarding, marca passo 1 como concluído
        if (user?.id) {
          import('@/services/onboarding').then(({ salvarProgressoOnboarding }) => {
            salvarProgressoOnboarding(user.id, { passo_empresa_concluido: true }).catch((e) =>
              console.warn('[Onboarding] Erro ao marcar passo empresa:', e),
            )
          })
        }
        try {
          localStorage.removeItem(CHAVE_RASCUNHO)
        } catch {
          /* ignore */
        }
        if (destinoFinal) {
          setTimeout(() => {
            navigate(destinoFinal)
          }, 1200)
        } else {
          setTimeout(() => setSalvoComSucesso(false), 4000)
        }
      })
      .catch((err) => {
        console.error('Erro ao salvar dados da empresa:', err)
        setSalvoComSucesso(false)
        const msg =
          err?.message ||
          (typeof err === 'string'
            ? err
            : 'Não foi possível gravar os dados no banco de dados. Tente novamente.')
        setMensagemErro(`Erro ao salvar no banco de dados: ${msg}`)
        // Rola até o banner de erro para feedback imediato
        window.scrollTo({ top: 0, behavior: 'smooth' })
      })
  }

  const handleRestaurar = () => {
    if (window.confirm('Deseja restaurar os valores padrão sugeridos pela Contabilidade 5.0?')) {
      restaurarPadrao()
      try {
        localStorage.removeItem(CHAVE_RASCUNHO)
      } catch {
        /* ignore */
      }
      setFormData(DADOS_EMPRESA_PADRAO)
      setSalvoComSucesso(true)
      setTimeout(() => setSalvoComSucesso(false), 3000)
    }
  }

  // Handler de Confirmação da Importação Opcional de Documentos Fiscais
  const handleConfirmarImportacaoDocumento = async (
    novosCampos: Partial<DadosEmpresaPerfil>,
    resultado: ResultadoParsingSped,
    resultadoNfe?: ResultadoParsingLoteNfe,
  ) => {
    setMensagemErro(null)

    const tipoDoc: import('@/types/dadosEmpresa').TipoDocumentoFiscalOrigem = resultadoNfe
      ? 'nfe_xml'
      : resultado.metadados.tipo === 'efd_icms_ipi'
        ? ('efd_icms_ipi' as const)
        : resultado.metadados.nomeTipo.toLowerCase().includes('balancete')
          ? ('balancete' as const)
          : ('efd_contribuicoes' as const)

    const dataHoraIso = new Date().toISOString()

    // Mapeamento de rastreabilidade campo a campo
    const camposAtualizadosChaves = Object.keys(novosCampos)
    const mapaOrigemCampos: Record<string, import('@/types/dadosEmpresa').OrigemCampoImportado> = {
      ...(formData.documentoFiscalImportado?.origemCampos || {}),
      ...(resultadoNfe
        ? construirOrigemCamposNfe(
            novosCampos,
            resultado.metadados.nomeArquivo,
            resultadoNfe.agregadosNfe.totalNotasProcessadas,
          )
        : {}),
    }

    resultado.camposComparativo.forEach((cmp) => {
      mapaOrigemCampos[cmp.chave as string] = {
        chave: cmp.chave as string,
        rotulo: cmp.rotulo,
        documento: resultado.metadados.nomeArquivo,
        tipo: tipoDoc,
        dataImportacao: dataHoraIso,
        valorFormatado: cmp.valorFormatadoExtraido,
      }
    })

    // Totais Fiscais extraídos
    const totaisFiscais: import('@/types/dadosEmpresa').TotaisFiscaisImportados = {
      faturamentoPeriodo: resultado.detalhes.faturamentoPeriodo,
      comprasTotais: resultado.detalhes.comprasTotais,
      comprasComCredito: resultado.detalhes.comprasComCredito,
      saldoCredorAcumulado: resultado.detalhes.saldoCredorAcumulado,
      receitaInterestadual: resultado.detalhes.receitaInterestadual,
      receitaExportacao: resultado.detalhes.receitaExportacao,
      percentualVendasInterestaduais: resultado.detalhes.percentualVendasInterestaduais,
    }

    // Agregados Contábeis (se vierem de balancete)
    const agregadosContabeis =
      resultado.agregadosContabeis || formData.documentoFiscalImportado?.agregadosContabeis

    const docReferencia: import('@/types/dadosEmpresa').DocumentoFiscalImportadoReferencia = {
      tipo: tipoDoc,
      nomeTipo: resultado.metadados.nomeTipo,
      nomeArquivo: resultado.metadados.nomeArquivo,
      periodoInicio: resultado.metadados.periodoInicio,
      periodoFim: resultado.metadados.periodoFim,
      dataImportacao: dataHoraIso,
      cnpjArquivo: resultado.metadados.cnpj,
      linhasLidas: resultado.metadados.linhasLidas,
      resumoExtracao: `${resultado.camposComparativo.length} campos atualizados via ${resultado.metadados.nomeTipo}`,
      agregadosContabeis,
      totaisFiscais,
      camposPreenchidos: camposAtualizadosChaves,
      origemCampos: mapaOrigemCampos,
      itensNcmImportados: resultadoNfe
        ? resultadoNfe.agregadosNfe.ncmsConsolidados.map((item) => ({
            ncm: item.ncm,
            descricao: item.descricao,
            quantidadeTotal: item.quantidadeTotal,
            valorTotal: item.valorTotal,
            totalItens: item.totalItens,
            categoriaRotulo: item.categoriaRotulo,
            tesesSugeridas: item.tesesSugeridas,
          }))
        : formData.documentoFiscalImportado?.itensNcmImportados,
    }

    // Atualiza também o histórico geral de documentos fiscais
    const novoItemHistorico: import('@/types/dadosEmpresa').ItemHistoricoDocumentoFiscal = {
      id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      tipo: tipoDoc,
      categoria: resultadoNfe ? 'nfe' : tipoDoc === 'balancete' ? 'balancete' : 'escrituracao',
      titulo: resultado.metadados.nomeTipo,
      nomeArquivo: resultado.metadados.nomeArquivo,
      dataProcessamento: dataHoraIso,
      fonte: 'manual',
      situacaoOuResumo: `${resultado.camposComparativo.length} campo(s) preenchido(s) automaticamente${
        resultadoNfe
          ? ` • ${resultadoNfe.agregadosNfe.totalNotasProcessadas} NF(s) processada(s) • ${resultadoNfe.agregadosNfe.ncmsConsolidados.length} NCM(s) consolidados`
          : ''
      }`,
      linhasLidas: resultado.metadados.linhasLidas,
      detalhesAdicionais: resultadoNfe
        ? {
            totalNotas: resultadoNfe.agregadosNfe.totalNotasProcessadas,
            totalItens: resultadoNfe.agregadosNfe.ncmsConsolidados.reduce(
              (acc, it) => acc + (it.totalItens || 0),
              0,
            ),
            totalNcms: resultadoNfe.agregadosNfe.ncmsConsolidados.length,
          }
        : undefined,
    }

    const historicoAnterior = formData.historicoDocumentosFiscais || []
    const historicoAtualizado = [
      novoItemHistorico,
      ...historicoAnterior.filter((h) => h.nomeArquivo !== resultado.metadados.nomeArquivo),
    ].slice(0, 30)

    const dadosAtualizados: DadosEmpresaPerfil = {
      ...formData,
      ...novosCampos,
      documentoFiscalImportado: docReferencia,
      historicoDocumentosFiscais: historicoAtualizado,
    }

    // Atualiza estado local imediatamente
    setFormData(dadosAtualizados)
    hasEditedRef.current = false

    const alteracoes = calcularDiffDadosEmpresa(dadosEmpresa, dadosAtualizados)

    try {
      const salvo = await salvar(dadosAtualizados)
      setSalvoComSucesso(true)

      // Registra auditoria imutável se configurado
      if (alteracoes.length > 0) {
        try {
          await registrarAuditoriaDadosEmpresa({
            empresaId: empresaVinculadaId,
            userId: user?.id,
            origemAjuste: 'pagina_dados_empresa',
            nomeEmpresa: salvo.nomeEmpresa,
            cnpj: salvo.cnpj,
            alteracoes,
            snapshotAnterior: dadosEmpresa,
            snapshotNovo: salvo,
            descricao: `Importação de documento fiscal: ${resultado.metadados.nomeArquivo} (${alteracoes.length} campo(s) preenchido(s) automaticamente)`,
          })
          listarAuditoriaDadosEmpresa({
            empresaId: empresaVinculadaId || undefined,
            userId: user?.id || undefined,
          }).then((h) => setHistoricoAuditoria(h))
        } catch (e) {
          console.warn('Erro ao gravar auditoria da importação fiscal:', e)
        }
      }

      try {
        localStorage.removeItem(CHAVE_RASCUNHO)
      } catch {
        /* ignore */
      }

      setTimeout(() => setSalvoComSucesso(false), 4000)
    } catch (err: any) {
      console.error('Erro ao salvar dados importados:', err)
      setSalvoComSucesso(false)
      const msg =
        err?.message ||
        (typeof err === 'string'
          ? err
          : 'Não foi possível gravar os dados importados no banco de dados. Tente novamente.')
      setMensagemErro(`Erro ao salvar dados importados no banco: ${msg}`)
      throw err
    }
  }

  // Cálculos rápidos informativos
  const faturamentoAnual = formData.faturamentoMensal * 12
  const folhaAnual = formData.folhaPagamentoMensal * 12
  const fatorR =
    formData.faturamentoMensal > 0
      ? (formData.folhaPagamentoMensal / formData.faturamentoMensal) * 100
      : 0
  const aliqIcmsUf = obterAliquotaIcmsUf(formData.ufOrigem)
  const infoCidade = obterAliquotaISS(formData.cidade)

  // ESTADO DE CARREGAMENTO DE AUTENTICAÇÃO
  if (authLoading) {
    return (
      <div className="bg-slate-50 min-h-screen">
        <DiamondHeader
          badge="DIAMOND GROUP • CADASTRO OPERACIONAL ÚNICO"
          titulo="Dados da Empresa"
          subtitulo="Preencha uma única vez os dados operacionais e parâmetros fiscais da sua empresa. Eles alimentam instantaneamente o Diagnóstico Tributário, a Calculadora Simples, o Comparativo de Regimes, o Simulador de Créditos e a Transição 2026–2033."
          mostrarVoltar={true}
          mostrarDiagnosticoBtn={true}
        />
        <div className="max-w-7xl mx-auto px-4 py-24 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <div className="w-10 h-10 border-4 border-[#2ECC71] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Verificando credenciais de acesso...</span>
          </div>
        </div>
      </div>
    )
  }

  // REQUISITO: Se NÃO autenticado, exibir tela de acesso (sem o formulário) convidando a entrar ou criar conta
  if (!isAuthenticated) {
    return (
      <div className="bg-slate-50 min-h-screen">
        {/* HEADER DIAMOND GROUP */}
        <DiamondHeader
          badge="DIAMOND GROUP • ÁREA DO CLIENTE"
          titulo="Dados da Empresa"
          subtitulo="Acesse sua conta para cadastrar e gerenciar o perfil operacional e fiscal da sua empresa com sincronização direta em nuvem."
          mostrarVoltar={true}
          mostrarDiagnosticoBtn={false}
        />

        {/* AVISO DO GATE SE O USUÁRIO VEIO REDIRECIONADO DA CALCULADORA OU DIAGNÓSTICO */}
        {destinoFinal && (
          <div className="bg-gradient-to-r from-[#07132B] via-[#0D2A1C] to-[#07132B] text-white border-b border-[#D4AF37]/40 py-3.5 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-ping shrink-0" />
                <Info className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>
                  <strong className="text-[#D4AF37]">Etapa Inicial Obrigatória:</strong> Para
                  acessar o{' '}
                  <strong>
                    {destinoFinal === '/calculadora-ibs-cbs'
                      ? 'Calculadora IBS/CBS'
                      : 'Diagnóstico Tributário'}
                  </strong>
                  , faça login ou crie sua conta para preencher os dados da sua empresa.
                </span>
              </div>
              <span className="text-[11px] text-slate-400 bg-white/10 px-2.5 py-1 rounded-full whitespace-nowrap">
                Retorno automático garantido após login
              </span>
            </div>
          </div>
        )}

        {/* CONTAINER DA TELA DE ACESSO DIAMOND GROUP */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="bg-white rounded-[28px] border border-slate-200/90 shadow-2xl overflow-hidden">
            {/* Header com estilo Diamond escuro */}
            <div className="bg-gradient-to-r from-[#07132B] via-[#0A1A13] to-[#07132B] p-8 sm:p-10 text-white relative overflow-hidden border-b border-[#D4AF37]/30">
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/15 border border-[#D4AF37]/30 mb-4 uppercase tracking-wider">
                  <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Acesso Restrito • Área do Cliente
                </div>

                <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-white tracking-tight leading-tight">
                  Acesse sua conta para preencher os dados da sua empresa
                </h2>

                <p className="text-slate-300 text-sm sm:text-base mt-3 leading-relaxed">
                  Seus dados ficam 100% salvos com segurança na nuvem, vinculados à sua conta e
                  disponíveis em qualquer dispositivo — prontos para alimentar a Calculadora
                  IBS/CBS, o Diagnóstico Tributário e o acompanhamento do seu time contábil.
                </p>
              </div>
            </div>

            {/* Conteúdo: Benefícios e Botões de Ação */}
            <div className="p-8 sm:p-10 space-y-8 bg-slate-50/40">
              {/* Grid de 3 benefícios chave */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#145A32] flex items-center justify-center shrink-0">
                    <Cloud className="w-5 h-5 text-[#2ECC71]" />
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">
                      Armazenamento em Nuvem
                    </strong>
                    <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
                      Nunca perca seus cálculos ao trocar de navegador ou fechar a aba.
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#07132B]/5 text-[#07132B] flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">
                      Multi-Módulos Integrados
                    </strong>
                    <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
                      Alimenta simultaneamente Diagnóstico, Calculadora e Créditos.
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#07132B] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-[#145A32]" />
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">
                      Time Contábil Diamond
                    </strong>
                    <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
                      Parâmetros revisados por nossos tributaristas credenciados.
                    </span>
                  </div>
                </div>
              </div>

              {/* Botões de Ação Principais */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Escolha como deseja prosseguir
                  </span>
                  <span className="text-sm font-semibold text-slate-800">
                    Entre com seu e-mail corporativo ou crie uma conta gratuita em 30 segundos
                  </span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
                  <Link
                    to={`/login?redirect=${encodeURIComponent(currentPathWithSearch)}`}
                    className="flex-1 sm:flex-initial px-6 py-3.5 rounded-xl font-heading font-semibold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-all text-center flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4 text-slate-600" />
                    <span>Entrar</span>
                  </Link>

                  <Link
                    to={`/cadastro?redirect=${encodeURIComponent(currentPathWithSearch)}`}
                    className="flex-1 sm:flex-initial px-7 py-3.5 rounded-xl font-heading font-bold text-sm text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-[0_4px_14px_rgba(46,204,113,0.35)] transition-all duration-200 hover:-translate-y-0.5 btn-press text-center flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4 text-[#0A1A13]" />
                    <span>Criar conta</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </Link>
                </div>
              </div>

              {/* Nota sobre dados já preenchidos no navegador */}
              {temDadosSalvos && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs text-[#145A32]">
                  <CheckCircle2 className="w-5 h-5 text-[#2ECC71] shrink-0" />
                  <span>
                    <strong>Identificamos dados já salvos neste navegador!</strong> Ao fazer login
                    ou criar sua conta, essas informações serão sincronizadas automaticamente com o
                    seu perfil na nuvem.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER CTA DIAMOND */}
        <DiamondFooterCTA
          titulo="Dúvidas sobre o cadastro da sua empresa?"
          subtitulo="Nosso time de consultores está pronto para auxiliar você no mapeamento fiscal preliminar e no uso da plataforma."
        />
      </div>
    )
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* HEADER DIAMOND GROUP */}
      <DiamondHeader
        badge="DIAMOND GROUP • CADASTRO OPERACIONAL ÚNICO"
        titulo="Dados da Empresa"
        subtitulo="Preencha uma única vez os dados operacionais e parâmetros fiscais da sua empresa. Eles alimentam instantaneamente o Diagnóstico Tributário, a Calculadora Simples, o Comparativo de Regimes, o Simulador de Créditos e a Transição 2026–2033."
        mostrarVoltar={true}
        mostrarDiagnosticoBtn={true}
      />

      {/* AVISO DO GATE SE O USUÁRIO VEIO REDIRECIONADO */}
      {destinoFinal && !temDadosSalvos && (
        <div className="bg-gradient-to-r from-[#07132B] via-[#0D2A1C] to-[#07132B] text-white border-b border-[#D4AF37]/40 py-3.5 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-ping shrink-0" />
              <Info className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span>
                <strong className="text-[#D4AF37]">Etapa Inicial Obrigatória:</strong> Para acessar
                o{' '}
                <strong>
                  {destinoFinal === '/calculadora-ibs-cbs'
                    ? 'Calculadora IBS/CBS'
                    : 'Diagnóstico Tributário'}
                </strong>
                , preencha os dados da sua empresa abaixo uma única vez. Eles alimentam
                automaticamente a calculadora e o diagnóstico!
              </span>
            </div>
            <span className="text-[11px] text-slate-400 bg-white/10 px-2.5 py-1 rounded-full whitespace-nowrap">
              Redirecionamento automático após salvar
            </span>
          </div>
        </div>
      )}

      {/* BARRA SUPERIOR DE KPI RÁPIDO */}
      <div className="bg-[#0A140F] text-white border-b border-[#D4AF37]/30 py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2ECC71] animate-pulse" />
            <span className="font-bold text-slate-200">Perfil Global:</span>
            <span className="text-[#D4AF37] font-semibold flex items-center gap-1.5">
              {salvoNoBanco && <ShieldCheck className="w-3.5 h-3.5 text-[#2ECC71]" />}
              {salvoNoBanco
                ? 'Salvo na sua conta (nuvem) e sincronizado com os 5 módulos'
                : temDadosSalvos
                  ? 'Salvo no navegador (faça login ou cadastre-se para sincronizar na nuvem)'
                  : 'Utilizando parâmetros padrão da plataforma'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <span>
              Faturamento Anual:{' '}
              <strong className="text-white font-mono">{formatarMoeda(faturamentoAnual)}</strong>
            </span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:inline">
              Fator R Estimado:{' '}
              <strong
                className={`font-mono ${fatorR >= 28 ? 'text-emerald-400' : 'text-amber-400'}`}
              >
                {fatorR.toFixed(1)}% ({fatorR >= 28 ? 'Anexo III' : 'Anexo V'})
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* FEEDBACK DE SUCESSO FLUTUANTE / FIXO */}
      {salvoComSucesso && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="bg-emerald-500 text-white p-4 rounded-2xl shadow-lg border border-emerald-400 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-white shrink-0" />
              <div>
                <strong className="block text-sm font-bold">
                  Dados da Empresa salvos com sucesso!
                </strong>
                <span className="text-xs text-emerald-100">
                  {destinoFinal
                    ? `Redirecionando você para ${
                        destinoFinal === '/calculadora-ibs-cbs'
                          ? 'a Calculadora IBS/CBS'
                          : 'o Diagnóstico Tributário'
                      }...`
                    : 'Diagnóstico Tributário, Calculadora Simples, Comparativo de Regimes, Créditos e Transição já foram atualizados com seus valores.'}
                </span>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(destinoFinal || '/calculadora-ibs-cbs')}
              className="bg-white text-emerald-800 hover:bg-emerald-50 border-white shrink-0 font-bold"
            >
              {destinoFinal === '/diagnostico' ? 'Ir para Diagnóstico' : 'Ir para Calculadora'}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <form onSubmit={handleSubmit} className="space-y-8 scroll-mt-28">
          {/* INDICADOR VISUAL DE VALIDADE FISCAL (RESUMO NO TOPO) */}
          <IndicadorValidadeFiscal
            resultado={resultadoValidacao}
            onRolarParaCampo={rolarParaCampo}
          />

          {/* BANNER EXPLICATIVO / HUB DE MÓDULOS ALIMENTADOS */}
          <div className="bg-gradient-to-r from-[#07132B] via-[#0D1D3A] to-[#07132B] rounded-2xl p-6 sm:p-8 text-white border border-[#D4AF37]/40 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 uppercase">
                  <Sparkles className="w-3.5 h-3.5" />
                  Alimentação Automática Multi-Módulos
                </div>
                {formData.atualizadoEm && (
                  <span className="text-xs text-slate-400">
                    Última sincronização: {new Date(formData.atualizadoEm).toLocaleString('pt-BR')}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-white">
                  Um único formulário. Cinco motores alimentados.
                </h2>
                <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
                  Evite digitar os mesmos dados repetidas vezes. Ao salvar o perfil abaixo, todos os
                  módulos a seguir iniciarão automaticamente com os dados da sua empresa:
                </p>
              </div>

              {/* Badges dos 5 módulos */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
                {[
                  {
                    titulo: 'Diagnóstico Tributário',
                    rota: '/diagnostico',
                    icon: FileSpreadsheet,
                    desc: 'Wizard & Relatório PDF',
                  },
                  {
                    titulo: 'Calculadora Simples',
                    rota: '/calculadora-ibs-cbs',
                    icon: Calculator,
                    desc: 'Operação Unitária',
                  },
                  {
                    titulo: 'Comparativo de Regimes',
                    rota: '/calculadora-ibs-cbs',
                    icon: Scale,
                    desc: 'Matriz 4 Cenários',
                  },
                  {
                    titulo: 'Simulador de Créditos',
                    rota: '/calculadora-ibs-cbs',
                    icon: Coins,
                    desc: 'Não-Cumulatividade 26,5%',
                  },
                  {
                    titulo: 'Transição 2026–2033',
                    rota: '/calculadora-ibs-cbs',
                    icon: Calendar,
                    desc: 'Cronograma 8 Anos',
                  },
                ].map((item, idx) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={idx}
                      className="bg-white/10 border border-white/10 rounded-xl p-3 flex flex-col justify-between hover:bg-white/15 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-[#D4AF37]" />
                        <span className="text-xs font-bold text-white truncate">{item.titulo}</span>
                      </div>
                      <span className="text-[11px] text-slate-300">{item.desc}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SEÇÃO OPCIONAL: IMPORTAÇÃO DE DOCUMENTOS FISCAIS (EFD SPED)              */}
          {/* ========================================================================= */}
          <SecaoImportacaoDocumentosFiscais
            perfilAtual={formData}
            onConfirmarImportacao={handleConfirmarImportacaoDocumento as any}
            disabled={isSalvando}
          />

          {/* ========================================================================= */}
          {/* BLOCO 1: DADOS OPERACIONAIS DA EMPRESA (ESPELHO DO PASSO 1 DO DIAGNÓSTICO) */}
          {/* ========================================================================= */}
          <Card className="border border-slate-200/90 shadow-md overflow-hidden bg-white rounded-2xl">
            <div className="bg-slate-50 border-b border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#07132B]" />
                  Passo 1 • Diagnóstico Tributário & Módulos
                </span>
                <h3 className="text-xl font-heading font-extrabold text-[#07132B]">
                  1. Dados operacionais da empresa
                </h3>
                <p className="text-xs text-slate-500">
                  Identificação do titular, empresa, CNPJ, localização, 10 segmentos de atuação e
                  perfil operacional.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                Faturamento: {formatarMoeda(formData.faturamentoMensal)}/mês
              </span>
            </div>

            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* SUB-BLOCO A: IDENTIFICAÇÃO (Passo 1 Diagnóstico) */}
              <div className="space-y-5">
                {/* Nome Completo */}
                <div>
                  <Label
                    htmlFor="nomeContato"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Seu Nome Completo *
                  </Label>
                  <Input
                    id="nomeContato"
                    type="text"
                    value={formData.nomeContato || ''}
                    onChange={(e) => {
                      atualizarCampo((prev) => ({ ...prev, nomeContato: e.target.value }))
                      if (errors.nomeContato) setErrors((prev) => ({ ...prev, nomeContato: '' }))
                    }}
                    placeholder="Ex: Carlos Eduardo Silva"
                    className={`h-12 bg-white font-medium ${
                      errors.nomeContato ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                    }`}
                  />
                  {errors.nomeContato ? (
                    <p className="mt-1 text-xs text-red-600 font-medium">{errors.nomeContato}</p>
                  ) : (
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Responsável pelo cadastro e titular das simulações tributárias.
                    </span>
                  )}
                </div>

                {/* Razão Social / Nome da Empresa e CNPJ da Empresa */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <CampoBuscaCnpj
                      id="cnpjEmpresa"
                      valor={formData.cnpj || ''}
                      onChangeValor={(novoCnpjFormatado) => {
                        atualizarCampo((prev) => ({ ...prev, cnpj: novoCnpjFormatado }))
                        const erroCnpj = validarCnpjInline(novoCnpjFormatado)
                        if (erroCnpj) {
                          setErrors((prev) => ({ ...prev, cnpj: erroCnpj }))
                        } else if (errors.cnpj) {
                          setErrors((prev) => ({ ...prev, cnpj: '' }))
                        }
                      }}
                      erro={errors.cnpj}
                      valoresAtuaisFormulario={{
                        nomeEmpresa: formData.nomeEmpresa,
                        segmento: formData.segmento,
                        ufOrigem: formData.ufOrigem,
                        cidade: formData.cidade,
                        email: formData.email,
                        telefone: formData.telefone,
                      }}
                      aoAplicarDadosCnpj={handleAplicarDadosCnpj}
                      label="CNPJ da Empresa"
                      obrigatorio
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label
                        htmlFor="nomeEmpresa"
                        className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                      >
                        Nome da Empresa / Razão Social *
                      </Label>
                      {formData.dadosCnpjConsulta?.fonte && (
                        <BadgeProvenienciaCnpj
                          fonte={formData.dadosCnpjConsulta.fonte}
                          consultadoEm={formData.dadosCnpjConsulta.consultadoEm}
                        />
                      )}
                    </div>
                    <Input
                      id="nomeEmpresa"
                      type="text"
                      value={formData.nomeEmpresa || ''}
                      onChange={(e) => {
                        atualizarCampo((prev) => ({ ...prev, nomeEmpresa: e.target.value }))
                        if (errors.nomeEmpresa) setErrors((prev) => ({ ...prev, nomeEmpresa: '' }))
                      }}
                      placeholder="Ex: Inova Tecnologia & Consultoria Ltda"
                      className={`h-12 bg-white font-medium ${
                        errors.nomeEmpresa ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                      }`}
                    />
                    {errors.nomeEmpresa ? (
                      <p className="mt-1 text-xs text-red-600 font-medium">{errors.nomeEmpresa}</p>
                    ) : (
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Razão social ou nome fantasia utilizado em todos os módulos e relatórios.
                      </span>
                    )}
                  </div>
                </div>

                {/* E-mail Corporativo e Telefone / WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="emailCorporativo"
                      className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                      E-mail Corporativo *
                    </Label>
                    <Input
                      id="emailCorporativo"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => {
                        const val = e.target.value
                        atualizarCampo((prev) => ({ ...prev, email: val }))
                        const err = validarEmailInline(val)
                        if (err) {
                          setErrors((prev) => ({ ...prev, email: err }))
                        } else if (errors.email) {
                          setErrors((prev) => ({ ...prev, email: '' }))
                        }
                      }}
                      onBlur={(e) => {
                        const err = validarEmailInline(e.target.value)
                        if (err) setErrors((prev) => ({ ...prev, email: err }))
                      }}
                      placeholder="carlos@empresa.com.br"
                      className={`h-12 bg-white font-medium ${
                        errors.email ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                      }`}
                    />
                    {errors.email ? (
                      <p className="mt-1 text-xs text-red-600 font-medium">{errors.email}</p>
                    ) : (
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Destino para envio do relatório detalhado do Diagnóstico em PDF.
                      </span>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor="telefoneWhatsapp"
                      className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                      Telefone / WhatsApp *
                    </Label>
                    <Input
                      id="telefoneWhatsapp"
                      type="tel"
                      value={formData.telefone || ''}
                      onChange={handlePhoneChange}
                      placeholder="+55 (11) 99999-9999"
                      className={`h-12 bg-white font-medium ${
                        errors.telefone ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                      }`}
                    />
                    {errors.telefone ? (
                      <p className="mt-1 text-xs text-red-600 font-medium">{errors.telefone}</p>
                    ) : (
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Com DDD e máscara automática (+55).
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Box Informativo de Dados Cadastrais Obtidos via Consulta de CNPJ */}
              {formData.dadosCnpjConsulta && (
                <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-lg text-xs text-sky-950 space-y-1.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-semibold text-sky-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-sky-600" />
                      Dados cadastrais oficiais sincronizados
                    </span>
                    <BadgeProvenienciaCnpj
                      fonte={formData.dadosCnpjConsulta.fonte}
                      consultadoEm={formData.dadosCnpjConsulta.consultadoEm}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 text-[11px] text-sky-800">
                    {formData.dadosCnpjConsulta.situacaoCadastral && (
                      <div>
                        <span className="font-medium text-sky-900">Situação:</span>{' '}
                        {formData.dadosCnpjConsulta.situacaoCadastral}
                      </div>
                    )}
                    {formData.dadosCnpjConsulta.dataAbertura && (
                      <div>
                        <span className="font-medium text-sky-900">Abertura:</span>{' '}
                        {formData.dadosCnpjConsulta.dataAbertura}
                      </div>
                    )}
                    {formData.dadosCnpjConsulta.cnaePrincipalCodigo && (
                      <div
                        className="sm:col-span-2 md:col-span-1 truncate"
                        title={`${formData.dadosCnpjConsulta.cnaePrincipalCodigo} - ${formData.dadosCnpjConsulta.cnaePrincipalDescricao || ''}`}
                      >
                        <span className="font-medium text-sky-900">CNAE:</span>{' '}
                        {formData.dadosCnpjConsulta.cnaePrincipalCodigo}
                      </div>
                    )}
                    {formData.dadosCnpjConsulta.enderecoCompleto && (
                      <div className="sm:col-span-2 md:col-span-3 text-slate-600">
                        <span className="font-medium text-sky-900">Endereço:</span>{' '}
                        {formData.dadosCnpjConsulta.enderecoCompleto}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUB-BLOCO B: LOCALIZAÇÃO (UF de Origem & Cidade ISS com box explicativo) */}
              <div className="pt-5 border-t border-slate-100 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Seletor UF de Origem */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label
                        htmlFor="ufOrigem"
                        className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                      >
                        UF de Origem (ICMS Estadual) *
                      </Label>
                      <span className="text-[11px] font-bold text-[#145A32] bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-300/60">
                        ICMS: {aliqIcmsUf.toFixed(1)}%
                      </span>
                    </div>
                    <Select
                      value={formData.ufOrigem || undefined}
                      onValueChange={(val) => {
                        // Se a cidade selecionada não pertencer à nova UF, limpa o campo de cidade
                        atualizarCampo((prev) => {
                          const cidadeAtual = CIDADES_ISS_MAPA.find((cid) => cid.id === prev.cidade)
                          const cidadeValida =
                            cidadeAtual && (cidadeAtual.uf === val || cidadeAtual.id === 'outra')
                          return {
                            ...prev,
                            ufOrigem: val,
                            cidade: cidadeValida ? prev.cidade : '',
                          }
                        })
                        if (errors.ufOrigem) setErrors((prev) => ({ ...prev, ufOrigem: '' }))
                      }}
                    >
                      <SelectTrigger
                        id="ufOrigem"
                        className="h-12 bg-white border-slate-300 font-medium text-slate-800"
                      >
                        <SelectValue placeholder="Selecione a UF" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {LISTA_UFS_ICMS.map((ufItem) => (
                          <SelectItem key={ufItem.uf} value={ufItem.uf}>
                            {ufItem.uf} — {ufItem.nome} ({ufItem.aliquotaInternaPadrao.toFixed(1)}%
                            ICMS)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Define a alíquota interna padrão de ICMS estadual sobre comércio e indústria.
                    </p>
                  </div>

                  {/* Seletor Cidade/ISS */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label
                        htmlFor="cidadeIss"
                        className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                      >
                        Cidade / UF (Alíquota de ISS) *
                      </Label>
                      <span className="text-[11px] font-bold text-[#145A32] bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-300/60">
                        ISS: {infoCidade.aliquota.toFixed(1)}%
                      </span>
                    </div>
                    <Select
                      value={formData.cidade || undefined}
                      onValueChange={(val) => {
                        atualizarCampo((prev) => ({ ...prev, cidade: val }))
                        if (errors.cidade) setErrors((prev) => ({ ...prev, cidade: '' }))
                      }}
                    >
                      <SelectTrigger
                        id="cidadeIss"
                        className="h-12 bg-white border-slate-300 font-medium text-slate-800"
                      >
                        <SelectValue placeholder="Selecione a cidade" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {CIDADES_ISS_MAPA.filter(
                          (cid) => cid.uf === formData.ufOrigem || cid.id === 'outra',
                        ).map((cid) => (
                          <SelectItem key={cid.id} value={cid.id}>
                            {cid.descricao || `${cid.nome}/${cid.uf} (${cid.aliquota.toFixed(1)}%)`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Define o ISS municipal aplicado aos cálculos de serviços e transporte.
                    </p>
                  </div>
                </div>

                {/* Box explicativo UF & ICMS */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-[#145A32] shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>Impacto no cálculo:</strong> A UF de origem determina o ICMS no sistema
                    atual (Lucro Presumido e Real) e serve de base para calibrar a substituição
                    gradual pelo IBS durante a transição 2029–2032.
                  </p>
                </div>
              </div>

              {/* SUB-BLOCO C: SEGMENTO PRINCIPAL DE ATIVIDADE (Grade com 10 opções exatas + Busca CNAE) */}
              <div className="pt-5 border-t border-slate-100 space-y-4">
                {/* Campo integrado de Busca Externa de CNAE para preenchimento de Segmento */}
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
                  <CampoBuscaCnae
                    id="cnaeEmpresaDadosEmpresa"
                    valorCnaeCodigo={
                      formData.dadosCnaeConsulta?.codigoFormatado ||
                      formData.dadosCnpjConsulta?.cnaePrincipalCodigo ||
                      ''
                    }
                    valorCnaeDescricao={
                      formData.dadosCnaeConsulta?.descricao ||
                      formData.dadosCnpjConsulta?.cnaePrincipalDescricao ||
                      ''
                    }
                    valoresAtuaisFormulario={{
                      cnaeCodigo:
                        formData.dadosCnaeConsulta?.codigoFormatado ||
                        formData.dadosCnpjConsulta?.cnaePrincipalCodigo ||
                        '',
                      cnaeDescricao:
                        formData.dadosCnaeConsulta?.descricao ||
                        formData.dadosCnpjConsulta?.cnaePrincipalDescricao ||
                        '',
                      segmento: formData.segmento,
                    }}
                    aoAplicarDadosCnae={handleAplicarDadosCnae}
                    label="Busca Externa de CNAE (Subclasse / Atividade)"
                    placeholder="Digite o código (ex: 6201-5/01) ou atividade (ex: desenvolvimento de software)"
                  />
                  {formData.dadosCnaeConsulta?.fonte && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between flex-wrap gap-2 text-xs">
                      <span className="text-slate-600 font-medium">
                        CNAE oficial selecionado:{' '}
                        <strong className="font-mono text-slate-800">
                          {formData.dadosCnaeConsulta.codigoFormatado}
                        </strong>{' '}
                        — {formData.dadosCnaeConsulta.descricao}
                      </span>
                      <BadgeProvenienciaCnae
                        fonte={formData.dadosCnaeConsulta.fonte}
                        consultadoEm={formData.dadosCnaeConsulta.consultadoEm}
                      />
                    </div>
                  )}

                  {/* Sugestão de segmento contextual para o CNAE PRINCIPAL */}
                  {(() => {
                    const cnaeCodPrincipal =
                      formData.dadosCnaeConsulta?.codigoFormatado ||
                      formData.dadosCnpjConsulta?.cnaePrincipalCodigo ||
                      ''
                    const cnaeDescPrincipal =
                      formData.dadosCnaeConsulta?.descricao ||
                      formData.dadosCnpjConsulta?.cnaePrincipalDescricao ||
                      ''
                    const segmentoSugeridoPrincipal = mapearCnaeParaSegmentoOpcional(
                      cnaeCodPrincipal,
                      cnaeDescPrincipal,
                    )

                    if (!segmentoSugeridoPrincipal) return null

                    const jaPreenchido = !!formData.segmento
                    const mesmoSegmento = formData.segmento === segmentoSugeridoPrincipal

                    return (
                      <div className="mt-2.5 p-3 rounded-lg bg-emerald-50/70 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <span className="text-xs font-semibold text-emerald-950 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            Sugestão do CNAE Principal:
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {segmentoSugeridoPrincipal}
                          </span>
                          {mesmoSegmento ? (
                            <span className="text-[11px] text-emerald-700 font-medium">
                              (já aplicado ao formulário)
                            </span>
                          ) : jaPreenchido ? (
                            <span className="text-[11px] text-slate-600">
                              (atual: <strong>{formData.segmento}</strong>)
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-600">
                              (campo segmento ainda em branco)
                            </span>
                          )}
                        </div>

                        {!mesmoSegmento && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() =>
                              handleAcionarSugestaoCnaePrincipal(
                                segmentoSugeridoPrincipal,
                                cnaeCodPrincipal,
                                cnaeDescPrincipal,
                              )
                            }
                            className="text-xs font-semibold h-7 px-3 bg-[#145A32] hover:bg-[#114b2a] text-white shrink-0 self-start sm:self-auto shadow-sm"
                          >
                            <Sparkles className="w-3 h-3 mr-1 text-emerald-300" />
                            {jaPreenchido
                              ? `Trocar para ${segmentoSugeridoPrincipal}`
                              : `Sugerir segmento ${segmentoSugeridoPrincipal}`}
                          </Button>
                        )}
                      </div>
                    )
                  })()}

                  {/* Seção de CNAEs Secundários salvos com badge de proveniência */}
                  {Array.isArray(formData.cnaesSecundarios) &&
                    formData.cnaesSecundarios.length > 0 && (
                      <SecaoCnaesSecundarios
                        cnaes={formData.cnaesSecundarios}
                        segmentoAtual={formData.segmento}
                        onRemoverItem={(codRemover) => {
                          const limpoCod = (codRemover || '').replace(/\D/g, '')
                          atualizarCampo((prev) => ({
                            ...prev,
                            cnaesSecundarios: (prev.cnaesSecundarios || []).filter(
                              (item) => (item.codigo || '').replace(/\D/g, '') !== limpoCod,
                            ),
                          }))
                        }}
                        onSugerirSegmento={(novoSeg) => {
                          atualizarCampo((prev) => {
                            const atualizado = { ...prev, segmento: novoSeg }
                            if (!prev.atividadeMista) {
                              if (novoSeg === 'Comércio') atualizado.tipoAtividade = 'comercio'
                              else if (novoSeg === 'Indústria')
                                atualizado.tipoAtividade = 'industria'
                              else atualizado.tipoAtividade = 'servico'
                            }

                            // Registra proveniência do segmento sugerido via CNAE Secundário
                            const origemAnterior = prev.documentoFiscalImportado?.origemCampos || {}
                            const dataHoraIso = new Date().toISOString()
                            atualizado.documentoFiscalImportado = {
                              ...(prev.documentoFiscalImportado || {
                                tipo: 'consulta_cnpj',
                                nomeTipo: 'Consulta CNAE Secundário',
                                nomeArquivo: 'cnae_secundario_sugestao',
                                dataImportacao: dataHoraIso,
                                resumoExtracao: `Segmento ${novoSeg} definido a partir de sugestão de CNAE Secundário`,
                                camposPreenchidos: ['segmento'],
                              }),
                              origemCampos: {
                                ...origemAnterior,
                                segmento: {
                                  chave: 'segmento',
                                  rotulo: 'Segmento Principal da Empresa',
                                  documento: 'CNAE Secundário',
                                  tipo: 'cnae_secundario',
                                  dataImportacao: dataHoraIso,
                                  valorFormatado: novoSeg,
                                },
                              },
                            }

                            return atualizado
                          })
                          if (errors.segmento) {
                            setErrors((prev) => ({ ...prev, segmento: '' }))
                          }
                        }}
                      />
                    )}

                  {/* Painel informativo "Tributos aplicáveis à atividade" (somente indicação) */}
                  <PainelTributosAtividade
                    cnaeCodigo={
                      formData.dadosCnaeConsulta?.codigoFormatado ||
                      formData.dadosCnpjConsulta?.cnaePrincipalCodigo ||
                      ''
                    }
                    cnaeDescricao={
                      formData.dadosCnaeConsulta?.descricao ||
                      formData.dadosCnpjConsulta?.cnaePrincipalDescricao ||
                      ''
                    }
                    segmento={formData.segmento}
                  />
                </div>

                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Segmento Principal de Atividade *
                    </Label>
                    {formData.dadosCnaeConsulta?.fonte && (
                      <BadgeProvenienciaCnae
                        fonte={formData.dadosCnaeConsulta.fonte}
                        consultadoEm={formData.dadosCnaeConsulta.consultadoEm}
                      />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">Selecione 1 das 10 opções</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                  {[
                    {
                      id: 'Comércio' as SegmentoEmpresa,
                      icon: ShoppingCart,
                      desc: 'Varejo e atacado de mercadorias (Anexo I / ICMS)',
                    },
                    {
                      id: 'Serviços' as SegmentoEmpresa,
                      icon: Briefcase,
                      desc: 'Prestação de serviços e consultoria (ISS / Fator R)',
                    },
                    {
                      id: 'Indústria' as SegmentoEmpresa,
                      icon: Factory,
                      desc: 'Fabricação e transformação fabril (Anexo II / ICMS)',
                    },
                    {
                      id: 'Saúde' as SegmentoEmpresa,
                      icon: HeartPulse,
                      desc: 'Clínicas, consultórios e laboratórios (ISS)',
                    },
                    {
                      id: 'Educação' as SegmentoEmpresa,
                      icon: GraduationCap,
                      desc: 'Escolas, faculdades e cursos livres (ISS)',
                    },
                    {
                      id: 'Agro' as SegmentoEmpresa,
                      icon: Sprout,
                      desc: 'Produção rural e agronegócio (Base 8%)',
                    },
                    {
                      id: 'Transporte' as SegmentoEmpresa,
                      icon: Truck,
                      desc: 'Cargas e passageiros (Presunção 16% IRPJ)',
                    },
                    {
                      id: 'Tecnologia' as SegmentoEmpresa,
                      icon: Cpu,
                      desc: 'Software, SaaS e TI (ISS / Fator R)',
                    },
                    {
                      id: 'Construção Civil' as SegmentoEmpresa,
                      icon: Hammer,
                      desc: 'Obras, reformas e engenharia civil (ISS)',
                    },
                    {
                      id: 'Bares e Restaurantes' as SegmentoEmpresa,
                      icon: UtensilsCrossed,
                      desc: 'Alimentação e bebidas (Presunção 8% / ICMS)',
                    },
                  ].map((item) => {
                    const isSelected = formData.segmento === item.id
                    const IconComponent = item.icon
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          // Sincroniza também tipoAtividade aproximado para a calculadora caso não seja misto
                          let autoTipo = formData.tipoAtividade
                          if (!formData.atividadeMista) {
                            if (item.id === 'Comércio') autoTipo = 'comercio'
                            else if (item.id === 'Indústria') autoTipo = 'industria'
                            else autoTipo = 'servico'
                          }
                          atualizarCampo((prev) => ({
                            ...prev,
                            segmento: item.id,
                            tipoAtividade: autoTipo,
                          }))
                          if (errors.segmento) setErrors((prev) => ({ ...prev, segmento: '' }))
                        }}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#2ECC71] bg-emerald-50/70 ring-2 ring-[#2ECC71]/30 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                                isSelected
                                  ? 'bg-[#2ECC71] text-[#0A1A13]'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              <IconComponent className="w-4 h-4" />
                            </div>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />}
                          </div>
                          <span
                            className={`font-heading font-bold text-xs sm:text-sm block leading-tight ${
                              isSelected ? 'text-[#145A32]' : 'text-slate-800'
                            }`}
                          >
                            {item.id}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-snug mt-1.5">
                          {item.desc}
                        </p>
                      </button>
                    )
                  })}
                </div>
                {errors.segmento && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.segmento}</p>
                )}
              </div>

              {/* SUB-BLOCO D: PERFIL OPERACIONAL DA EMPRESA (Passo 1 Diagnóstico) */}
              <div className="pt-5 border-t border-slate-100 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#2ECC71]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Perfil Operacional da Empresa
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Regime Atual */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label
                        htmlFor="regimeAtual"
                        className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                      >
                        Regime Tributário Atual
                      </Label>
                      <span className="text-[11px] text-slate-400">Como tributa hoje</span>
                    </div>
                    <Select
                      value={formData.regimeAtual || undefined}
                      onValueChange={(val) =>
                        atualizarCampo((prev) => ({ ...prev, regimeAtual: val }))
                      }
                    >
                      <SelectTrigger
                        id="regimeAtual"
                        className="h-12 bg-white border-slate-300 font-medium text-slate-800"
                      >
                        <SelectValue placeholder="Selecione o regime atual" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Simples Nacional">Simples Nacional</SelectItem>
                        <SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem>
                        <SelectItem value="Lucro Real">Lucro Real</SelectItem>
                        <SelectItem value="MEI (Microempreendedor)">
                          MEI (Microempreendedor)
                        </SelectItem>
                        <SelectItem value="Nova empresa / Ainda não optante">
                          Nova empresa / Ainda não optante
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Serve para compararmos o regime atual com a oportunidade identificada.
                    </p>
                  </div>

                  {/* Quantidade de funcionários */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label
                        htmlFor="funcionarios"
                        className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                      >
                        Quadro de Colaboradores
                      </Label>
                      <span className="text-[11px] text-slate-400">Equipe</span>
                    </div>
                    <Select
                      value={formData.funcionarios || undefined}
                      onValueChange={(val) =>
                        setFormData((prev) => ({ ...prev, funcionarios: val }))
                      }
                    >
                      <SelectTrigger
                        id="funcionarios"
                        className="h-12 bg-white border-slate-300 font-medium text-slate-800"
                      >
                        <SelectValue placeholder="Selecione o porte da equipe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Apenas sócios (sem funcionários)">
                          Apenas sócios (sem funcionários CLT)
                        </SelectItem>
                        <SelectItem value="1 a 5 funcionários">1 a 5 funcionários</SelectItem>
                        <SelectItem value="6 a 15 funcionários">6 a 15 funcionários</SelectItem>
                        <SelectItem value="16 a 50 funcionários">16 a 50 funcionários</SelectItem>
                        <SelectItem value="Mais de 50 funcionários">
                          Mais de 50 funcionários
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Influencia o peso da CPP (contribuição patronal previdenciária de 20%).
                    </p>
                  </div>
                </div>
              </div>

              {/* SUB-BLOCO E: PARÂMETROS OPERACIONAIS FINANCEIROS */}
              <div className="pt-5 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#07132B]" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Parâmetros Econômicos Operacionais (Faturamento e Folha)
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Alimenta o Passo 2 do Diagnóstico e Módulos da Calculadora
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Faturamento Mensal */}
                  <div className="space-y-2">
                    <Label htmlFor="fatMensal" className="text-sm font-bold text-[#07132B]">
                      Faturamento Mensal (R$) *
                    </Label>
                    <Input
                      id="fatMensal"
                      type="text"
                      value={formData.faturamentoMensal.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                      onChange={handleFaturamentoChange}
                      className="text-lg font-bold font-mono text-[#07132B] bg-white border-slate-300 h-12 shadow-sm"
                    />
                    <span className="text-[11px] text-slate-500 block">
                      Receita bruta mensal. RBT12 calculada:{' '}
                      <strong>{formatarMoeda(faturamentoAnual)}</strong>.
                    </span>
                  </div>

                  {/* Folha de Pagamento Mensal */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="folhaMensal"
                        className="text-sm font-bold text-[#07132B] flex items-center gap-1.5"
                      >
                        <Users className="w-4 h-4 text-[#D4AF37]" />
                        Folha Mensal (com Pró-labore) *
                      </Label>
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          fatorR >= 28
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        R = {fatorR.toFixed(1)}%
                      </span>
                    </div>
                    <Input
                      id="folhaMensal"
                      type="text"
                      value={formData.folhaPagamentoMensal.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                      onChange={handleFolhaChange}
                      className="text-lg font-bold font-mono text-[#07132B] bg-white border-slate-300 h-12 shadow-sm"
                    />
                    <span className="text-[11px] text-slate-500 block">
                      Folha 12m: <strong>{formatarMoeda(folhaAnual)}</strong>. Se ≥ 28%, garante
                      Anexo III.
                    </span>
                  </div>
                </div>
              </div>

              {/* SUB-BLOCO F: PARÂMETROS FISCAIS & INSUMOS (FASE 1 - FONTE MESTRA) */}
              <div className="pt-6 border-t-2 border-slate-200/80 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-slate-50 via-emerald-50/40 to-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
                      <h4 className="text-sm font-heading font-bold uppercase tracking-wider text-[#07132B]">
                        Parâmetros Fiscais & Insumos • Fase 1 (Fonte Mestra)
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Dados corporativos unificados. Propagam para Calculadora IBS/CBS, Recuperador
                      de Créditos e Diagnóstico 360° sem recadastro.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono font-bold bg-[#07132B] text-[#D4AF37] px-2.5 py-1 rounded-full shrink-0 self-start sm:self-auto">
                    FONTE MESTRA C5.0
                  </span>
                </div>

                {/* 1. PERFIL DE INSUMOS (SOMA 100%) */}
                <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <Label className="text-sm font-bold text-[#07132B] flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                        1. Perfil de Insumos da Operação (%)
                      </Label>
                      <span className="text-xs text-slate-500 block mt-0.5">
                        Distribuição das aquisições de insumos. A soma das 3 alíquotas deve ser
                        exatamente 100%.
                      </span>
                    </div>
                    {(() => {
                      const soma =
                        Number(formData.perfilInsumosAliquotaCheia ?? 0) +
                        Number(formData.perfilInsumosMonofasicos ?? 0) +
                        Number(formData.perfilInsumosAliquotaReduzida ?? 0)
                      const ok = Math.round(soma * 100) / 100 === 100
                      return (
                        <div
                          className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                            ok
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}
                        >
                          Soma: {soma.toFixed(1)}% {ok ? '✓ Válida' : '⚠ Deve somar 100%'}
                        </div>
                      )
                    })()}
                  </div>

                  {errors.perfilInsumos && (
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
                      <Info className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{errors.perfilInsumos}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                    {/* Alíquota Cheia */}
                    <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="perfilCheia" className="text-xs font-bold text-[#07132B]">
                          Alíquota Cheia (%)
                        </Label>
                        <span className="text-[11px] font-mono text-slate-500">Padrão</span>
                      </div>
                      <Input
                        id="perfilCheia"
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={formData.perfilInsumosAliquotaCheia ?? 0}
                        onChange={(e) => {
                          const num = Number(e.target.value) || 0
                          const val = Math.max(0, Math.min(100, num))
                          setFormData((prev) => ({ ...prev, perfilInsumosAliquotaCheia: val }))
                          if (errors.perfilInsumos)
                            setErrors((prev) => ({ ...prev, perfilInsumos: '' }))
                          if (errors.perfilInsumosAliquotaCheia)
                            setErrors((prev) => ({ ...prev, perfilInsumosAliquotaCheia: '' }))
                        }}
                        className="text-base font-bold font-mono text-[#07132B] bg-white border-slate-300 h-10 shadow-xs"
                      />
                      <span className="text-[10px] text-slate-500 block">
                        Tributados integralmente
                      </span>
                    </div>

                    {/* Monofásicos */}
                    <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="perfilMono" className="text-xs font-bold text-[#07132B]">
                          Monofásicos (%)
                        </Label>
                        <span className="text-[11px] font-mono text-[#D4AF37] font-bold">
                          Fase 1
                        </span>
                      </div>
                      <Input
                        id="perfilMono"
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={formData.perfilInsumosMonofasicos ?? 0}
                        onChange={(e) => {
                          const num = Number(e.target.value) || 0
                          const val = Math.max(0, Math.min(100, num))
                          setFormData((prev) => ({
                            ...prev,
                            perfilInsumosMonofasicos: val,
                            presencaMonofasicos: val > 0 ? true : prev.presencaMonofasicos,
                          }))
                          if (errors.perfilInsumos)
                            setErrors((prev) => ({ ...prev, perfilInsumos: '' }))
                          if (errors.perfilInsumosMonofasicos)
                            setErrors((prev) => ({ ...prev, perfilInsumosMonofasicos: '' }))
                        }}
                        className="text-base font-bold font-mono text-[#07132B] bg-white border-slate-300 h-10 shadow-xs"
                      />
                      <span className="text-[10px] text-slate-500 block">
                        Alíquota zero / concentrada
                      </span>
                    </div>

                    {/* Alíquota Reduzida */}
                    <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="perfilReduz" className="text-xs font-bold text-[#07132B]">
                          Alíquota Reduzida (%)
                        </Label>
                        <span className="text-[11px] font-mono text-slate-500">Especial</span>
                      </div>
                      <Input
                        id="perfilReduz"
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={formData.perfilInsumosAliquotaReduzida ?? 0}
                        onChange={(e) => {
                          const num = Number(e.target.value) || 0
                          const val = Math.max(0, Math.min(100, num))
                          setFormData((prev) => ({ ...prev, perfilInsumosAliquotaReduzida: val }))
                          if (errors.perfilInsumos)
                            setErrors((prev) => ({ ...prev, perfilInsumos: '' }))
                          if (errors.perfilInsumosAliquotaReduzida)
                            setErrors((prev) => ({ ...prev, perfilInsumosAliquotaReduzida: '' }))
                        }}
                        className="text-base font-bold font-mono text-[#07132B] bg-white border-slate-300 h-10 shadow-xs"
                      />
                      <span className="text-[10px] text-slate-500 block">
                        Incentivados ou cesta básica
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. PRESENÇA DE MONOFÁSICOS & CATEGORIAS */}
                <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold text-[#07132B] flex items-center gap-1.5">
                        <Coins className="w-4 h-4 text-[#D4AF37]" />
                        2. Presença de Insumos / Produtos Monofásicos
                      </Label>
                      <span className="text-xs text-slate-500 block">
                        A empresa comercializa ou adquire insumos submetidos à tributação
                        concentrada/monofásica?
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-600">
                        {formData.presencaMonofasicos ? 'Sim' : 'Não'}
                      </span>
                      <Switch
                        checked={!!formData.presencaMonofasicos}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({
                            ...prev,
                            presencaMonofasicos: checked,
                            categoriasMonofasicos: checked ? prev.categoriasMonofasicos : [],
                          }))
                        }
                      />
                    </div>
                  </div>

                  {formData.presencaMonofasicos && (
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      {(!formData.categoriasMonofasicos ||
                        formData.categoriasMonofasicos.length === 0) && (
                        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                          <span>
                            Atenção: A presença de monofásicos está ativa, mas nenhuma categoria foi
                            selecionada abaixo.
                          </span>
                        </div>
                      )}
                      <Label className="text-xs font-bold text-[#07132B]">
                        Categorias de produtos monofásicos aplicáveis:
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {CATEGORIAS_MONOFASICOS_OPCOES.map((cat) => {
                          const selecionado = (formData.categoriasMonofasicos || []).includes(
                            cat.id,
                          )
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setFormData((prev) => {
                                  const atuais = prev.categoriasMonofasicos || []
                                  const novo = selecionado
                                    ? atuais.filter((id) => id !== cat.id)
                                    : [...atuais, cat.id]
                                  return { ...prev, categoriasMonofasicos: novo }
                                })
                              }}
                              className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-center gap-2 ${
                                selecionado
                                  ? 'bg-[#07132B] text-[#D4AF37] border-[#07132B] font-bold shadow-xs'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <span
                                className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] font-bold border ${
                                  selecionado
                                    ? 'bg-[#D4AF37] text-[#07132B] border-[#D4AF37]'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {selecionado ? '✓' : ''}
                              </span>
                              <span className="truncate">{cat.rotulo}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3 & 4. INSUMOS ENERGÉTICOS E INTANGÍVEIS / ROYALTIES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 3. Insumos energéticos */}
                  <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white flex flex-col justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-[#D4AF37]" />
                        <Label className="text-sm font-bold text-[#07132B]">
                          3. Insumos Energéticos
                        </Label>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        A operação utiliza intensivamente energia elétrica contratada em demanda,
                        vapor industrial ou combustíveis como insumo fabril?
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-xs font-semibold text-slate-600">
                        Presença de insumos energéticos:
                      </span>
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold text-slate-700">
                          {formData.insumosEnergeticos ? 'Sim' : 'Não'}
                        </span>
                        <Switch
                          checked={!!formData.insumosEnergeticos}
                          onCheckedChange={(checked) =>
                            setFormData((prev) => ({ ...prev, insumosEnergeticos: checked }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. Intangíveis e royalties */}
                  <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white flex flex-col justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-[#D4AF37]" />
                        <Label className="text-sm font-bold text-[#07132B]">
                          4. Intangíveis & Royalties
                        </Label>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Aquisição, licenciamento ou remessas de software, cessão de direitos,
                        marcas, patentes, royalties ou direitos autorais?
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-xs font-semibold text-slate-600">
                        Presença de intangíveis/royalties:
                      </span>
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold text-slate-700">
                          {formData.intangiveisRoyalties ? 'Sim' : 'Não'}
                        </span>
                        <Switch
                          checked={!!formData.intangiveisRoyalties}
                          onCheckedChange={(checked) =>
                            setFormData((prev) => ({ ...prev, intangiveisRoyalties: checked }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. INVESTIMENTOS EM ATIVO IMOBILIZADO (ÚLTIMOS 5 ANOS) */}
                <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <Label
                        htmlFor="imobilizadoTotal"
                        className="text-sm font-bold text-[#07132B] flex items-center gap-1.5"
                      >
                        <Hammer className="w-4 h-4 text-[#D4AF37]" />
                        5. Investimentos em Ativo Imobilizado (Últimos 5 Anos)
                      </Label>
                      <span className="text-xs text-slate-500 block mt-0.5">
                        Total investido em máquinas, equipamentos, frotas, edificações e
                        benfeitorias nos últimos 60 meses.
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 self-start sm:self-auto">
                      Base CIAP / PIS / COFINS
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="imobilizadoTotal"
                        className="text-xs font-bold text-slate-700"
                      >
                        Valor Total Acumulado (R$)
                      </Label>
                      <Input
                        id="imobilizadoTotal"
                        type="text"
                        value={(formData.imobilizadoUltimos5Anos ?? 0).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '')
                          const valor = Number(raw) / 100
                          setFormData((prev) => ({ ...prev, imobilizadoUltimos5Anos: valor }))
                        }}
                        className="text-base font-bold font-mono text-[#07132B] bg-white border-slate-300 h-11 shadow-xs"
                      />
                      <span className="text-[11px] text-slate-500 block">
                        Equivale a uma média de{' '}
                        <strong>
                          {formatarMoeda((formData.imobilizadoUltimos5Anos ?? 0) / 5)}/ano
                        </strong>{' '}
                        ou{' '}
                        <strong>
                          {formatarMoeda((formData.imobilizadoUltimos5Anos ?? 0) / 60)}/mês
                        </strong>
                        .
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">
                        Detalhamento Opcional por Exercício (Últimos 5 Anos)
                      </Label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {[2021, 2022, 2023, 2024, 2025].map((ano) => {
                          const anoStr = String(ano)
                          const valorAno = formData.imobilizadoAnosDetalhe?.[anoStr] ?? ''
                          return (
                            <div key={ano} className="space-y-1">
                              <span className="text-[10px] font-mono font-bold text-slate-500 block text-center">
                                {ano}
                              </span>
                              <Input
                                type="text"
                                placeholder="R$ 0"
                                value={
                                  valorAno !== '' && valorAno !== undefined
                                    ? Number(valorAno).toLocaleString('pt-BR')
                                    : ''
                                }
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/\D/g, '')
                                  const num = Number(raw)
                                  setFormData((prev) => {
                                    const detalhe = { ...(prev.imobilizadoAnosDetalhe || {}) }
                                    if (num > 0) {
                                      detalhe[anoStr] = num
                                    } else {
                                      delete detalhe[anoStr]
                                    }
                                    const soma = Object.values(detalhe).reduce(
                                      (acc, v) => acc + v,
                                      0,
                                    )
                                    return {
                                      ...prev,
                                      imobilizadoAnosDetalhe: detalhe,
                                      // Se detalhou, atualiza o total acumulado automaticamente se a soma for maior
                                      imobilizadoUltimos5Anos:
                                        soma > 0 ? soma : prev.imobilizadoUltimos5Anos,
                                    }
                                  })
                                }}
                                className="text-[11px] font-mono text-center h-8 px-1 bg-slate-50 border-slate-200"
                              />
                            </div>
                          )
                        })}
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        Preenchimento livre. Se preenchido, calcula automaticamente o total
                        acumulado.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BLOCO 4: FASE 2 — REFINAMENTO TRIBUTÁRIO & OPERACIONAL (FONTE MESTRA) */}
          <Card className="border border-[#D4AF37]/50 shadow-md bg-gradient-to-br from-white via-slate-50 to-amber-50/20 overflow-hidden">
            <div className="bg-[#07132B] px-6 py-4 border-b border-[#D4AF37]/30 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-[#D4AF37] animate-pulse" />
                <h3 className="font-heading font-bold text-lg text-white">
                  4. Parâmetros Fiscais Avançados (Fase 2 • Refinamento da Calculadora)
                </h3>
              </div>
              <span className="text-xs text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/30 font-semibold">
                Altera cálculos na Calculadora • Informativo no Recuperador e Diagnóstico
              </span>
            </div>

            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 leading-relaxed space-y-1">
                  <p className="font-bold text-[#07132B]">
                    Impacto direto nas fórmulas da Calculadora IBS/CBS:
                  </p>
                  <p>
                    Os campos abaixo refinam automaticamente o crédito de compras (reduzindo
                    aquisições sem direito a crédito), amortizam o saldo credor acumulado de
                    ICMS/PIS/COFINS na projeção, distribuem o IBS com base nas operações
                    interestaduais, aplicam a trajetória setorial de regimes especiais (monofásicos,
                    ST, ZFM, RET) e ajustam a leitura de fluxo de caixa pelo split payment.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. % COMPRAS QUE NÃO GERAM CRÉDITO */}
                <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label
                      htmlFor="percentualComprasSemCredito"
                      className="text-sm font-bold text-[#07132B] flex items-center gap-1.5"
                    >
                      <Percent className="w-4 h-4 text-[#D4AF37]" />
                      1. Compras que NÃO Geram Crédito (%)
                    </Label>
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      0 a 100%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Percentual estimado de aquisições sem direito a crédito amplo no IVA (uso
                    pessoal, despesas não operacionais, mercadorias isentas ou não tributadas).
                  </p>
                  <div className="space-y-1.5 pt-1">
                    <div className="relative">
                      <Input
                        id="percentualComprasSemCredito"
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={formData.percentualComprasSemCredito ?? 0}
                        onChange={(e) => {
                          const val = Math.min(100, Math.max(0, Number(e.target.value) || 0))
                          setFormData((prev) => ({ ...prev, percentualComprasSemCredito: val }))
                          if (errors.percentualComprasSemCredito)
                            setErrors((prev) => ({ ...prev, percentualComprasSemCredito: '' }))
                        }}
                        className="text-base font-bold font-mono text-[#07132B] bg-white border-slate-300 h-11 pr-10 shadow-xs"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 font-mono">
                        %
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 block">
                      {Number(formData.percentualComprasSemCredito || 0) === 0 ? (
                        <span className="text-emerald-600 font-semibold">
                          100% das compras geram crédito integral (padrão)
                        </span>
                      ) : (
                        <span>
                          Reduz a base creditável de compras em{' '}
                          <strong>{formData.percentualComprasSemCredito}%</strong>
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* 2. SALDO CREDOR ACUMULADO */}
                <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label
                      htmlFor="saldoCredorAcumulado"
                      className="text-sm font-bold text-[#07132B] flex items-center gap-1.5"
                    >
                      <Landmark className="w-4 h-4 text-[#D4AF37]" />
                      2. Saldo Credor Acumulado (R$)
                    </Label>
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Estoque Inicial
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Saldo credor existente de ICMS, PIS ou COFINS disponível para compensação ou
                    ressarcimento na virada para o IBS/CBS (estoque inicial de créditos).
                  </p>
                  <div className="space-y-1.5 pt-1">
                    <Input
                      id="saldoCredorAcumulado"
                      type="text"
                      value={(formData.saldoCredorAcumulado ?? 0).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '')
                        const valor = Number(raw) / 100
                        setFormData((prev) => ({ ...prev, saldoCredorAcumulado: valor }))
                      }}
                      className="text-base font-bold font-mono text-[#07132B] bg-white border-slate-300 h-11 shadow-xs"
                    />
                    <span className="text-[11px] text-slate-500 block">
                      Crédito inicial disponível para amortização nos primeiros períodos de
                      transição.
                    </span>
                  </div>
                </div>

                {/* 3. % VENDAS INTERESTADUAIS */}
                <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label
                      htmlFor="percentualVendasInterestaduais"
                      className="text-sm font-bold text-[#07132B] flex items-center gap-1.5"
                    >
                      <Globe2 className="w-4 h-4 text-[#D4AF37]" />
                      3. Vendas Interestaduais (%)
                    </Label>
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Destino vs. Origem
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Parcela do faturamento destinada a outros estados da federação (operações
                    sujeitas a DIFAL no modelo atual e princípio do destino no IBS).
                  </p>
                  <div className="space-y-1.5 pt-1">
                    <div className="relative">
                      <Input
                        id="percentualVendasInterestaduais"
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={formData.percentualVendasInterestaduais ?? 0}
                        onChange={(e) => {
                          const val = Math.min(100, Math.max(0, Number(e.target.value) || 0))
                          setFormData((prev) => ({ ...prev, percentualVendasInterestaduais: val }))
                        }}
                        className="text-base font-bold font-mono text-[#07132B] bg-white border-slate-300 h-11 pr-10 shadow-xs"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 font-mono">
                        %
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 block">
                      Operações internas:{' '}
                      <strong>{100 - Number(formData.percentualVendasInterestaduais || 0)}%</strong>{' '}
                      • Interestaduais:{' '}
                      <strong>{Number(formData.percentualVendasInterestaduais || 0)}%</strong>
                    </span>
                  </div>
                </div>

                {/* 4. REGIME ESPECIAL ATUAL */}
                <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label
                      htmlFor="regimeEspecialAtual"
                      className="text-sm font-bold text-[#07132B] flex items-center gap-1.5"
                    >
                      <Receipt className="w-4 h-4 text-[#D4AF37]" />
                      4. Regime Especial Atual
                    </Label>
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Regras de Transição
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Identifica se a empresa opera hoje sob regimes diferenciados com regras
                    específicas de transição e manutenção de benefícios na LC 214/2025.
                  </p>
                  <div className="space-y-1.5 pt-1">
                    <Select
                      value={formData.regimeEspecialAtual || 'nenhum'}
                      onValueChange={(val: RegimeEspecialAtual) =>
                        setFormData((prev) => ({ ...prev, regimeEspecialAtual: val }))
                      }
                    >
                      <SelectTrigger
                        id="regimeEspecialAtual"
                        className="h-11 bg-white border-slate-300"
                      >
                        <SelectValue placeholder="Selecione o regime especial" />
                      </SelectTrigger>
                      <SelectContent>
                        {REGIMES_ESPECIAIS_OPCOES.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.rotulo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-[11px] text-slate-500 block">
                      {
                        REGIMES_ESPECIAIS_OPCOES.find(
                          (r) => r.id === (formData.regimeEspecialAtual || 'nenhum'),
                        )?.descricao
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. PERFIL DE RETENÇÃO / SPLIT PAYMENT */}
              <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <Label
                      htmlFor="perfilRetencaoSplit"
                      className="text-sm font-bold text-[#07132B] flex items-center gap-1.5"
                    >
                      <CreditCard className="w-4 h-4 text-[#D4AF37]" />
                      5. Perfil de Retenção dos Clientes / Split Payment
                    </Label>
                    <span className="text-xs text-slate-500 block mt-0.5">
                      Os clientes reteriam o IBS/CBS automaticamente na liquidação financeira do
                      pagamento?
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 self-start sm:self-auto">
                    Fluxo de Caixa
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {PERFIS_RETENCAO_SPLIT_OPCOES.map((opcao) => {
                    const selecionado = (formData.perfilRetencaoSplit || 'nao') === opcao.id
                    return (
                      <button
                        key={opcao.id}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            perfilRetencaoSplit: opcao.id,
                            percentualRetencaoSplit:
                              opcao.id === 'sim_todos'
                                ? 100
                                : opcao.id === 'nao'
                                  ? 0
                                  : prev.percentualRetencaoSplit || 50,
                          }))
                        }
                        className={`text-left p-3.5 rounded-xl border transition-all ${
                          selecionado
                            ? 'bg-amber-500/10 border-[#D4AF37] ring-1 ring-[#D4AF37]'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-xs font-bold ${
                              selecionado ? 'text-[#07132B]' : 'text-slate-700'
                            }`}
                          >
                            {opcao.rotulo}
                          </span>
                          {selecionado && (
                            <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                          {opcao.descricao}
                        </p>
                      </button>
                    )
                  })}
                </div>

                {/* Subcampo: % estimado de retenção quando "parcial" */}
                {formData.perfilRetencaoSplit === 'parcial' && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 mt-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label
                        htmlFor="percentualRetencaoSplit"
                        className="text-xs font-bold text-slate-700"
                      >
                        Percentual Estimado de Retenção nos Pagamentos (%)
                      </Label>
                      <span className="text-xs font-mono font-bold text-[#07132B]">
                        {formData.percentualRetencaoSplit ?? 50}%
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        id="percentualVendasInterestaduais"
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={formData.percentualVendasInterestaduais ?? 0}
                        onChange={(e) => {
                          const num = Number(e.target.value) || 0
                          const val = Math.min(100, Math.max(0, num))
                          setFormData((prev) => ({ ...prev, percentualVendasInterestaduais: val }))
                          if (errors.percentualVendasInterestaduais)
                            setErrors((prev) => ({ ...prev, percentualVendasInterestaduais: '' }))
                        }}
                        className="text-base font-bold font-mono text-[#07132B] bg-white border-slate-300 h-10 shadow-xs"
                      />
                    </div>{' '}
                    <span className="text-[11px] text-slate-500 block">
                      Aplica retenção automática sobre{' '}
                      <strong>{formData.percentualRetencaoSplit ?? 50}%</strong> do montante
                      tributário nas simulações de fluxo de caixa e split payment.
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* BLOCO: SITUAÇÃO FISCAL (FASE 3) */}
          <Card className="border-slate-200/80 shadow-xs overflow-hidden">
            <div className="bg-gradient-to-r from-rose-950 via-[#07132B] to-slate-900 px-6 py-5 border-b border-rose-900/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-white flex items-center gap-2">
                    Situação Fiscal
                    <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Fase 3 • Diagnóstico 360°
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Controle de passivos, autuações e conformidade acessória para mapeamento de
                    riscos e defesas tributárias.
                  </p>
                </div>
              </div>
            </div>

            <CardContent className="p-6 md:p-8 space-y-6">
              {/* 1. Autos de infração ativos */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-bold text-[#07132B] flex items-center gap-2">
                      Autos de Infração Ativos
                      {formData.autosInfracaoAtivos && (
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 font-bold">
                          Ativo
                        </span>
                      )}
                    </Label>
                    <p className="text-xs text-slate-500 max-w-xl">
                      A empresa possui autuações fiscais lavradas pela Receita Federal, SEFAZ ou
                      Município em fase administrativa ou judicial?
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-semibold text-slate-600">
                      {formData.autosInfracaoAtivos ? 'Sim, possui' : 'Não possui'}
                    </span>
                    <Switch
                      checked={!!formData.autosInfracaoAtivos}
                      onCheckedChange={(val) =>
                        atualizarCampo((prev) => ({
                          ...prev,
                          autosInfracaoAtivos: val,
                          autosInfracaoQuantidade: val ? prev.autosInfracaoQuantidade || 1 : 0,
                          autosInfracaoValor: val ? prev.autosInfracaoValor || 0 : 0,
                        }))
                      }
                    />
                  </div>
                </div>

                {formData.autosInfracaoAtivos && (
                  <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="autosInfracaoQuantidade"
                        className="text-xs font-bold text-slate-700"
                      >
                        Quantidade de Autos Ativos
                      </Label>
                      <Input
                        id="autosInfracaoQuantidade"
                        type="number"
                        min={1}
                        max={999}
                        value={formData.autosInfracaoQuantidade ?? 1}
                        onChange={(e) => {
                          const val = Math.max(1, Number(e.target.value) || 1)
                          atualizarCampo((prev) => ({ ...prev, autosInfracaoQuantidade: val }))
                        }}
                        className="h-10 text-sm font-mono font-bold bg-white"
                        placeholder="Ex: 1"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="autosInfracaoValor"
                        className="text-xs font-bold text-slate-700"
                      >
                        Valor Total Aproximado (R$)
                      </Label>
                      <Input
                        id="autosInfracaoValor"
                        type="number"
                        min={0}
                        step={1000}
                        value={formData.autosInfracaoValor ?? 0}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0)
                          atualizarCampo((prev) => ({ ...prev, autosInfracaoValor: val }))
                        }}
                        className="h-10 text-sm font-mono font-bold bg-white"
                        placeholder="Ex: 50000"
                      />
                      <span className="text-[11px] text-slate-500 block">
                        Equivalente a:{' '}
                        <strong>{formatarMoeda(formData.autosInfracaoValor ?? 0)}</strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Parcelamentos em curso */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-bold text-[#07132B] flex items-center gap-2">
                      Parcelamentos Tributários em Curso
                      {formData.parcelamentosEmCurso && (
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-bold">
                          {formData.parcelamentosQuantidade || 1} ativo(s)
                        </span>
                      )}
                    </Label>
                    <p className="text-xs text-slate-500 max-w-xl">
                      Existem acordos de parcelamento ativos (PERT, Simples Nacional
                      ordinário/especial, transações tributárias PGFN ou parcelamentos estaduais)?
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-semibold text-slate-600">
                      {formData.parcelamentosEmCurso ? 'Sim, possui' : 'Não possui'}
                    </span>
                    <Switch
                      checked={!!formData.parcelamentosEmCurso}
                      onCheckedChange={(val) =>
                        atualizarCampo((prev) => ({
                          ...prev,
                          parcelamentosEmCurso: val,
                          parcelamentosQuantidade: val ? prev.parcelamentosQuantidade || 1 : 0,
                        }))
                      }
                    />
                  </div>
                </div>

                {formData.parcelamentosEmCurso && (
                  <div className="pt-4 border-t border-slate-200 max-w-xs space-y-1.5">
                    <Label
                      htmlFor="parcelamentosQuantidade"
                      className="text-xs font-bold text-slate-700"
                    >
                      Quantidade de Acordos/Parcelamentos Ativos
                    </Label>
                    <Input
                      id="parcelamentosQuantidade"
                      type="number"
                      min={1}
                      max={50}
                      value={formData.parcelamentosQuantidade ?? 1}
                      onChange={(e) => {
                        const val = Math.max(1, Number(e.target.value) || 1)
                        atualizarCampo((prev) => ({ ...prev, parcelamentosQuantidade: val }))
                      }}
                      className="h-10 text-sm font-mono font-bold bg-white"
                      placeholder="Ex: 2"
                    />
                  </div>
                )}
              </div>

              {/* 3 e 4: Débitos em dívida ativa / Execução fiscal e Obrigações acessórias */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 3. Dívida ativa / Execução fiscal */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-bold text-[#07132B] flex items-center gap-2">
                      Inscrição em Dívida Ativa ou Execução Fiscal
                      {formData.dividaAtivaExecucaoFiscal && (
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 font-bold">
                          Risco Crítico
                        </span>
                      )}
                    </Label>
                    <p className="text-xs text-slate-500">
                      Débitos federais, estaduais ou municipais já inscritos na PGFN/PGE ou com
                      processo de cobrança judicial ajuizado.
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <span className="text-xs font-semibold text-slate-600">
                      {formData.dividaAtivaExecucaoFiscal
                        ? 'Constam débitos/execuções'
                        : 'Sem débitos inscritos'}
                    </span>
                    <Switch
                      checked={!!formData.dividaAtivaExecucaoFiscal}
                      onCheckedChange={(val) =>
                        atualizarCampo((prev) => ({ ...prev, dividaAtivaExecucaoFiscal: val }))
                      }
                    />
                  </div>
                </div>

                {/* 4. Obrigações acessórias em atraso */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-bold text-[#07132B] flex items-center gap-2">
                      Obrigações Acessórias em Atraso
                      {formData.obrigacoesAcessoriasAtraso && (
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-bold">
                          Pendente
                        </span>
                      )}
                    </Label>
                    <p className="text-xs text-slate-500">
                      Declarações fiscais em atraso ou omissas (EFD ICMS/IPI, EFD Contribuições,
                      DCTFWeb, ECD, ECF, PGDAS ou DEFIS).
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <span className="text-xs font-semibold text-slate-600">
                      {formData.obrigacoesAcessoriasAtraso
                        ? 'Constam pendências de envio'
                        : 'Declarações em dia'}
                    </span>
                    <Switch
                      checked={!!formData.obrigacoesAcessoriasAtraso}
                      onCheckedChange={(val) =>
                        atualizarCampo((prev) => ({ ...prev, obrigacoesAcessoriasAtraso: val }))
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BLOCO: OPERAÇÃO MULTI-UF (FASE 3) */}
          <Card className="border-slate-200/80 shadow-xs overflow-hidden">
            <div className="bg-gradient-to-r from-blue-950 via-[#07132B] to-slate-900 px-6 py-5 border-b border-blue-900/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  <Globe2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-white flex items-center gap-2">
                    Operação Multi-UF & Estabelecimentos
                    <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Fase 3 • DIFAL & Territorialidade
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Mapeamento geográfico de filiais e estados de operação para análise de alíquotas
                    estaduais, DIFAL e transição IBS.
                  </p>
                </div>
              </div>
            </div>

            <CardContent className="p-6 md:p-8 space-y-6">
              {/* 5. Número de filiais / estabelecimentos */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Label
                      htmlFor="numeroFiliais"
                      className="text-sm font-bold text-[#07132B] flex items-center gap-2"
                    >
                      Número de Estabelecimentos (Matriz + Filiais)
                    </Label>
                    <p className="text-xs text-slate-500 max-w-xl">
                      Informe o total de unidades produtivas, depósitos, centros de distribuição ou
                      lojas físicas ativas. Padrão: 1 (apenas matriz).
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Input
                      id="numeroFiliais"
                      type="number"
                      min={1}
                      max={999}
                      value={formData.numeroFiliais ?? 1}
                      onChange={(e) => {
                        const val = Math.max(1, Number(e.target.value) || 1)
                        atualizarCampo((prev) => ({ ...prev, numeroFiliais: val }))
                      }}
                      className="w-28 h-10 text-base font-mono font-bold text-center bg-white border-slate-300"
                    />
                    <span className="text-xs font-semibold text-slate-600">
                      {(formData.numeroFiliais ?? 1) > 1
                        ? `1 matriz + ${(formData.numeroFiliais ?? 1) - 1} filial(is)`
                        : 'Apenas Matriz'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 6. UFs adicionais de operação */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <Label className="text-sm font-bold text-[#07132B] flex items-center gap-2">
                      Demais UFs de Operação Comercial / Filiais
                      <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                        {formData.ufsOperacao?.length || 0} selecionada(s)
                      </span>
                    </Label>
                    <p className="text-xs text-slate-500">
                      A <strong>UF principal ({formData.ufOrigem || 'SP'})</strong> já está
                      cadastrada acima. Selecione as outras unidades federativas onde a empresa
                      opera filiais, armazéns ou realiza distribuição direta.
                    </p>
                  </div>
                  {formData.ufsOperacao && formData.ufsOperacao.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => atualizarCampo((prev) => ({ ...prev, ufsOperacao: [] }))}
                      className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 self-start sm:self-auto"
                    >
                      Limpar seleção
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-9 gap-2 pt-2">
                  {LISTA_UFS_ICMS.map((ufItem) => {
                    const sigla = ufItem.uf
                    const isOrigem = sigla === (formData.ufOrigem || 'SP')
                    const selecionada = isOrigem || (formData.ufsOperacao?.includes(sigla) ?? false)

                    return (
                      <button
                        key={sigla}
                        type="button"
                        disabled={isOrigem}
                        onClick={() => {
                          if (isOrigem) return
                          atualizarCampo((prev) => {
                            const atuais = prev.ufsOperacao || []
                            const novaLista = atuais.includes(sigla)
                              ? atuais.filter((u) => u !== sigla)
                              : [...atuais, sigla]
                            return { ...prev, ufsOperacao: novaLista }
                          })
                        }}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                          isOrigem
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-900 cursor-not-allowed'
                            : selecionada
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-1 ring-blue-600'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                        title={
                          isOrigem
                            ? `${sigla} (${ufItem.nome}) é a UF principal de origem da empresa (definida acima)`
                            : `Clique para ${selecionada ? 'remover' : 'adicionar'} ${sigla} (${ufItem.nome})`
                        }
                      >
                        <span className="text-xs font-black font-mono">{sigla}</span>
                        <span className="text-[10px] leading-none opacity-80">
                          {isOrigem ? 'Origem' : selecionada ? 'Ativo' : 'Adicionar'}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {formData.ufsOperacao && formData.ufsOperacao.length > 0 && (
                  <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      Operação interestadual ativa em{' '}
                      <strong>{formData.ufsOperacao.length + 1} estados</strong>:{' '}
                      {formData.ufOrigem || 'SP'} (origem) + {formData.ufsOperacao.join(', ')}. No
                      IBS/CBS, o imposto pertencerá integralmente ao estado/município de destino de
                      cada consumo.
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* BLOCO 6: VÍNCULOS SOCIETÁRIOS & RISCO DE REGIME (LC 123/2006, art. 3º) */}
          <div className="space-y-3">
            {formData.dadosCnpjConsulta?.qsa && formData.dadosCnpjConsulta.qsa.length > 0 && (
              <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-[#07132B] text-[#D4AF37]">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs text-blue-950">
                    <span className="font-semibold">Quadro de Sócios (QSA) Vinculado:</span>{' '}
                    <span className="text-blue-900">
                      {formData.dadosCnpjConsulta.qsa.length} sócio(s)/administrador(es)
                      registrado(s) pela Receita Federal
                    </span>
                  </div>
                </div>

                <BadgeProvenienciaQsa
                  consultadoEm={
                    formData.dadosCnpjConsulta.qsaConsultadoEm ||
                    formData.dadosCnpjConsulta.consultadoEm
                  }
                  fonte={formData.dadosCnpjConsulta.qsaFonte || formData.dadosCnpjConsulta.fonte}
                  totalSocios={formData.dadosCnpjConsulta.qsa.length}
                  variante="compacta"
                />
              </div>
            )}

            <SecaoVinculosSocietarios
              vinculos={formData.vinculosSocietarios || []}
              regimeAtual={formData.regimeAtual}
              faturamentoMensalProprio={formData.faturamentoMensal || 0}
              onChangeVinculos={(novosVinculos: VinculoSocietario[]) => {
                atualizarCampo((prev) => ({
                  ...prev,
                  vinculosSocietarios: novosVinculos,
                }))
              }}
            />
          </div>

          {/* PAINEL INFORMATIVO DE AVISOS DE COERÊNCIA FISCAL (NÃO BLOQUEANTE) */}
          {resultadoValidacao.avisosCoerencia.length > 0 && (
            <PainelAvisosCoerencia
              avisos={resultadoValidacao.avisosCoerencia}
              onFocarCampo={rolarParaCampo}
            />
          )}

          {/* BOTÕES DE AÇÃO: SALVAR / RESTAURAR */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-20">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleRestaurar}
                className="border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-semibold h-12"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restaurar Padrões da Plataforma
              </Button>
              {temDadosSalvos && (
                <span className="text-xs text-slate-500 hidden md:inline">
                  (Seus dados personalizados estão gravados no navegador)
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              {resultadoValidacao.totalAvisos > 0 && (
                <div className="text-[11px] text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    {resultadoValidacao.totalAvisos} aviso(s) de coerência detectado(s) (não
                    bloqueia salvamento)
                  </span>
                </div>
              )}
              <Button
                type="submit"
                disabled={isSalvando}
                className="w-full sm:w-auto h-12 px-8 rounded-xl font-heading font-semibold text-base text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-[0_4px_14px_rgba(46,204,113,0.35)] hover:shadow-[0_6px_20px_rgba(46,204,113,0.5)] transition-all duration-200 hover:-translate-y-0.5 btn-press flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Save className="w-5 h-5 stroke-[2.5]" />
                <span>{isSalvando ? 'Salvando...' : 'Salvar Dados da Empresa'}</span>
              </Button>
            </div>
          </div>
        </form>

        {/* ACESSO DIRETO AOS MÓDULOS DEPOIS DE SALVAR */}
        <div className="mt-12 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-heading font-bold text-lg text-[#07132B]">
              Navegar diretamente para simulação com estes dados
            </h4>
            <span className="text-xs text-slate-500">
              Todos os campos estarão pré-preenchidos automaticamente
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/diagnostico"
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#2ECC71] hover:shadow-lg transition-all group flex items-start gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#145A32] group-hover:bg-[#2ECC71] group-hover:text-[#0A1A13] flex items-center justify-center shrink-0 transition-colors">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-slate-900 group-hover:text-[#145A32] transition-colors">
                    Diagnóstico Tributário Completo
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#145A32] group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Enquadramento entre Simples, Presumido e Real, relatório executivo e exportação em
                  PDF com sua folha, faturamento e créditos.
                </p>
              </div>
            </Link>

            <Link
              to="/calculadora-ibs-cbs"
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#D4AF37] hover:shadow-lg transition-all group flex items-start gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-900 group-hover:bg-[#07132B] group-hover:text-[#D4AF37] flex items-center justify-center shrink-0 transition-colors">
                <Scale className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-slate-900 group-hover:text-[#07132B] transition-colors">
                    Calculadora IBS / CBS Integrada
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#07132B] group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Acesse os 6 módulos interligados (alíquotas oficiais, apuração unitária, matriz
                  dos 4 regimes, simulador de 10 créditos e transição).
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação para Troca de Segmento via CNAE Principal */}
      <Dialog
        open={modalConfirmarTrocaSegmentoCnaePrincipal}
        onOpenChange={(open) => {
          if (!open) {
            setModalConfirmarTrocaSegmentoCnaePrincipal(false)
            setSegmentoPendenteCnaePrincipal(null)
          }
        }}
      >
        <DialogContent className="max-w-md bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Substituir Segmento Atual?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 leading-relaxed pt-2">
              O formulário já possui o segmento{' '}
              <strong className="text-slate-800 font-semibold font-mono">
                "{formData.segmento}"
              </strong>{' '}
              preenchido.
              <br />
              Deseja substituí-lo pela sugestão do CNAE Principal{' '}
              {segmentoPendenteCnaePrincipal?.cnaeCodigo && (
                <span className="font-mono font-semibold text-slate-800">
                  ({segmentoPendenteCnaePrincipal.cnaeCodigo})
                </span>
              )}
              :
              <span className="block mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold text-sm">
                Segmento sugerido: {segmentoPendenteCnaePrincipal?.segmento}
              </span>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setModalConfirmarTrocaSegmentoCnaePrincipal(false)
                setSegmentoPendenteCnaePrincipal(null)
              }}
              className="text-xs text-slate-600"
            >
              Manter "{formData.segmento}"
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmarTrocaCnaePrincipal}
              className="text-xs font-semibold bg-[#145A32] hover:bg-[#114b2a] text-white"
            >
              Confirmar e Trocar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FOOTER CTA DIAMOND */}
      <DiamondFooterCTA
        titulo="Dúvidas sobre o preenchimento ou parametrização tributária?"
        subtitulo="Nossa equipe de analistas e tributaristas pode realizar um diagnóstico assistido para identificar créditos ocultos e o melhor regime para o seu negócio."
      />
    </div>
  )
}
