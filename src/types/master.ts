export type NivelAcesso = 'master' | 'admin' | 'analista' | 'empresario'

export type PermissaoMaster =
  | 'ver_clientes_globais'
  | 'excluir_diagnosticos'
  | 'gerenciar_usuarios'
  | 'gerenciar_admins'

export const TODAS_PERMISSOES: { id: PermissaoMaster; rotulo: string; descricao: string }[] = [
  {
    id: 'ver_clientes_globais',
    rotulo: 'Ver Clientes Globais',
    descricao: 'Acesso irrestrito a todos os clientes de todos os analistas e cadastros diretos',
  },
  {
    id: 'excluir_diagnosticos',
    rotulo: 'Excluir Diagnósticos',
    descricao: 'Permissão para excluir registros e trilhas completas de diagnósticos fiscais',
  },
  {
    id: 'gerenciar_usuarios',
    rotulo: 'Gerenciar Usuários',
    descricao: 'Visualizar lista geral de analistas, empresários e editar perfis operacionais',
  },
  {
    id: 'gerenciar_admins',
    rotulo: 'Gerenciar Administradores',
    descricao: 'Eleger, rebaixar admins e designar permissões (exclusivo do Administrador Master)',
  },
]

export interface UsuarioSistema {
  id: string
  name: string
  email: string
  nivel_acesso: NivelAcesso
  permissoes_json: PermissaoMaster[]
  criado_por?: string
  perfil?: 'contador' | 'empresario'
  role?: 'admin' | 'user'
  plano?: 'gratuito' | 'premium'
  is_premium?: boolean
  created?: string
  updated?: string
  criador_nome?: string
  criador_email?: string
  // Novos campos de controle comercial (migração 0029)
  valor_mensal_personalizado?: number
  status_operacao?: 'autorizado' | 'suspenso'
  autorizado_por?: string
  autorizado_por_nome?: string
  autorizado_em?: string
  // Métricas agregadas
  total_clientes?: number
  total_diagnosticos?: number
  total_simulacoes?: number
}

export interface ClienteGlobalItem {
  id: string
  nome: string
  empresa: string
  cnpj_cpf: string
  email: string
  telefone: string
  segmento: string
  regime_atual: string
  uf: string
  cidade: string
  origem_tipo: 'analista' | 'direto'
  analista_id?: string
  analista_nome?: string
  analista_email?: string
  total_diagnosticos: number
  total_simulacoes: number
  ultimo_diagnostico_data?: string
  faturamento_mensal?: number
  created: string
  collection_origem: 'clientes' | 'clientes_empresas'
}

export interface AnalistaMetricasItem {
  id: string
  name: string
  email: string
  nivel_acesso: NivelAcesso
  total_clientes: number
  total_diagnosticos: number
  total_simulacoes: number
  ultimo_acesso_ou_criado: string
  clientes_carteira: ClienteGlobalItem[]
}
