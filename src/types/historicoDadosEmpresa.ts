export interface ItemAlteracaoDadosEmpresa {
  campo: string
  rotulo: string
  valorAnterior: any
  valorNovo: any
  valorAnteriorFormatado: string
  valorNovoFormatado: string
}

export interface HistoricoDadosEmpresaRegistro {
  id: string
  empresa_id?: string
  cliente_id?: string
  user_id?: string
  autor_nome: string
  autor_email?: string
  autor_nivel?: string
  origem_ajuste?: string
  descricao?: string
  nome_empresa?: string
  cnpj?: string
  alteracoes_json: ItemAlteracaoDadosEmpresa[]
  snapshot_anterior_json?: Record<string, any>
  snapshot_novo_json?: Record<string, any>
  created: string
  updated?: string
}
