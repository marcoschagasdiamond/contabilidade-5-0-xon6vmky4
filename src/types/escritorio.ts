export interface DadosEscritorioAdquirente {
  escritorio_nome: string
  escritorio_responsavel: string
  escritorio_cnpj: string
  escritorio_email: string
  escritorio_telefone: string
  escritorio_uf: string
  escritorio_cidade: string
  escritorio_cadastrado?: boolean
}

export const DADOS_ESCRITORIO_PADRAO: DadosEscritorioAdquirente = {
  escritorio_nome: '',
  escritorio_responsavel: '',
  escritorio_cnpj: '',
  escritorio_email: '',
  escritorio_telefone: '',
  escritorio_uf: 'SP',
  escritorio_cidade: '',
  escritorio_cadastrado: false,
}
