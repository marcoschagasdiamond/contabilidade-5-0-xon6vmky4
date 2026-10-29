export type OperacaoCredito = 'venda' | 'compra'

export type TipoCredito =
  | 'Precatório Federal'
  | 'Precatório Estadual'
  | 'Precatório Municipal'
  | 'RPV'
  | 'Crédito de IBS/CBS'
  | 'Crédito de PIS/Cofins'
  | 'Crédito de ICMS de incentivos'
  | 'Crédito judicial contra o Fisco'
  | 'Dívida ativa securitizada'
  | 'Outros'

export type EsferaCredito = 'federal' | 'estadual' | 'municipal'

export type SituacaoCreditoVenda =
  | 'protocolado'
  | 'expedido'
  | 'divida_ativa'
  | 'reconhecido_judicialmente'

export type FinalidadeCreditoCompra =
  | 'compensar_debitos'
  | 'investimento'
  | 'compra_imoveis_publicos'
  | 'quitar_parcelamentos'

export type StatusAnuncio = 'ativo' | 'pausado' | 'negociado' | 'cancelado'

export type StatusPedidoInformacao = 'pendente' | 'respondido' | 'arquivado'

export interface AnuncioCredito {
  id: string
  user_id: string
  operacao: OperacaoCredito
  tipo_credito?: TipoCredito
  esfera: EsferaCredito
  uf?: string
  municipio?: string
  valor_nominal: number
  desagio_percentual: number
  situacao?: SituacaoCreditoVenda
  finalidade?: FinalidadeCreditoCompra
  observacoes?: string
  status: StatusAnuncio
  // Dados sensíveis (visíveis apenas para Master/Admin ou dono)
  contato_nome?: string
  contato_documento?: string
  contato_email?: string
  contato_telefone?: string
  created: string
  updated: string
  // Dados populados opcionais
  expand?: {
    user_id?: {
      id: string
      name?: string
      email?: string
    }
  }
}

export interface NovoAnuncioInput {
  operacao: OperacaoCredito
  tipo_credito?: TipoCredito
  esfera: EsferaCredito
  uf?: string
  municipio?: string
  valor_nominal: number
  desagio_percentual: number
  situacao?: SituacaoCreditoVenda
  finalidade?: FinalidadeCreditoCompra
  observacoes?: string
  contato_nome: string
  contato_documento: string
  contato_email: string
  contato_telefone: string
}

export interface PedidoInformacaoCredito {
  id: string
  anuncio_id: string
  solicitante_id: string
  solicitante_nome: string
  solicitante_email: string
  solicitante_telefone?: string
  mensagem: string
  resposta_admin?: string
  respondido_por?: string
  respondido_em?: string
  status: StatusPedidoInformacao
  visualizado_pelo_solicitante?: boolean
  created: string
  updated: string
  expand?: {
    anuncio_id?: AnuncioCredito
    solicitante_id?: {
      id: string
      name?: string
      email?: string
    }
    respondido_por?: {
      id: string
      name?: string
      email?: string
    }
  }
}

export interface NovoPedidoInformacaoInput {
  anuncio_id: string
  mensagem: string
  solicitante_nome: string
  solicitante_email: string
  solicitante_telefone?: string
}

export const AVISO_LEGAL_CREDITOS =
  'Aviso Legal Obrigatório: A cessão de créditos previdenciários é expressamente vedada por lei (Lei nº 8.213/1991, art. 114). Nos termos da Constituição Federal e jurisprudência vinculante dos tribunais superiores, o cessionário de precatório adquire a titularidade patrimonial do crédito, mas não herda a superpreferência constitucional concedida ao titular originário.'

export const TIPOS_CREDITO_LISTA: TipoCredito[] = [
  'Precatório Federal',
  'Precatório Estadual',
  'Precatório Municipal',
  'RPV',
  'Crédito de IBS/CBS',
  'Crédito de PIS/Cofins',
  'Crédito de ICMS de incentivos',
  'Crédito judicial contra o Fisco',
  'Dívida ativa securitizada',
  'Outros',
]

export const SITUACOES_CREDITO_VENDA: { valor: SituacaoCreditoVenda; label: string }[] = [
  { valor: 'protocolado', label: 'Protocolado / Em tramitação' },
  { valor: 'expedido', label: 'Expedido / Aguardando pagamento orçamentário' },
  { valor: 'divida_ativa', label: 'Inscrito em Dívida Ativa' },
  {
    valor: 'reconhecido_judicialmente',
    label: 'Reconhecido judicialmente com trânsito em julgado',
  },
]

export const FINALIDADES_COMPRA: { valor: FinalidadeCreditoCompra; label: string }[] = [
  { valor: 'compensar_debitos', label: 'Compensar débitos tributários com o ente público' },
  { valor: 'investimento', label: 'Investimento financeiro / Renda fixa estruturada' },
  { valor: 'compra_imoveis_publicos', label: 'Aquisição de imóveis públicos e leilões' },
  { valor: 'quitar_parcelamentos', label: 'Quitar parcelamentos e acordos tributários' },
]
