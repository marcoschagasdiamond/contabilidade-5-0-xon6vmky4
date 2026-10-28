import pb from '@/lib/pocketbase/client'
import type {
  AnuncioCredito,
  NovoAnuncioInput,
  PedidoInformacaoCredito,
  NovoPedidoInformacaoInput,
} from '@/types/creditos'

/**
 * Listar anúncios ativos para a vitrine 'Mercado de Créditos'.
 * Se isAdmin for falso, os dados de contato são mascarados no cliente
 * (garantia dupla contra vazamento de dados sensíveis).
 */
export async function listarAnunciosMercado(
  isAdmin = false,
  usuarioLogadoId?: string,
): Promise<AnuncioCredito[]> {
  const records = await pb.collection('anuncios_creditos').getFullList<AnuncioCredito>({
    sort: '-created',
    filter: "status != 'cancelado'",
    expand: 'user_id',
  })

  if (isAdmin) {
    return records
  }

  // Mascara dados sensíveis de contato para usuários não-admin
  // Preserva apenas para o próprio anunciante que criou
  return records.map((item) => {
    const ehProprioDono = usuarioLogadoId && item.user_id === usuarioLogadoId
    if (ehProprioDono) {
      return item
    }

    return {
      ...item,
      contato_nome: undefined,
      contato_documento: undefined,
      contato_email: undefined,
      contato_telefone: undefined,
    }
  })
}

/**
 * Listar TODOS os anúncios completos para a aba administrativa /admin
 * (com todos os dados sensíveis visíveis).
 */
export async function listarTodosAnunciosAdmin(): Promise<AnuncioCredito[]> {
  return pb.collection('anuncios_creditos').getFullList<AnuncioCredito>({
    sort: '-created',
    expand: 'user_id',
  })
}

/**
 * Criar um novo anúncio de crédito
 */
export async function criarAnuncioCredito(
  userId: string,
  dados: NovoAnuncioInput,
): Promise<AnuncioCredito> {
  const record = await pb.collection('anuncios_creditos').create<AnuncioCredito>({
    ...dados,
    user_id: userId,
    status: 'ativo',
  })
  return record
}

/**
 * Atualizar status do anúncio
 */
export async function atualizarStatusAnuncio(
  anuncioId: string,
  novoStatus: AnuncioCredito['status'],
): Promise<AnuncioCredito> {
  return pb.collection('anuncios_creditos').update<AnuncioCredito>(anuncioId, {
    status: novoStatus,
  })
}

/**
 * Excluir anúncio
 */
export async function excluirAnuncioCredito(anuncioId: string): Promise<boolean> {
  return pb.collection('anuncios_creditos').delete(anuncioId)
}

/**
 * Registrar pedido de informação para um anúncio
 */
export async function registrarPedidoInformacao(
  userId: string,
  dados: NovoPedidoInformacaoInput,
): Promise<PedidoInformacaoCredito> {
  const record = await pb
    .collection('pedidos_informacao_creditos')
    .create<PedidoInformacaoCredito>({
      anuncio_id: dados.anuncio_id,
      solicitante_id: userId,
      solicitante_nome: dados.solicitante_nome,
      solicitante_email: dados.solicitante_email,
      solicitante_telefone: dados.solicitante_telefone || '',
      mensagem: dados.mensagem,
      status: 'pendente',
      visualizado_pelo_solicitante: false,
    })
  return record
}

/**
 * Listar pedidos de informação para a fila do administrador
 */
export async function listarPedidosAdmin(): Promise<PedidoInformacaoCredito[]> {
  return pb.collection('pedidos_informacao_creditos').getFullList<PedidoInformacaoCredito>({
    sort: '-created',
    expand: 'anuncio_id,solicitante_id,respondido_por',
  })
}

/**
 * Listar pedidos de informação feitos pelo próprio usuário logado
 * (para ele acompanhar respostas dos administradores)
 */
export async function listarMeusPedidosUsuario(userId: string): Promise<PedidoInformacaoCredito[]> {
  return pb.collection('pedidos_informacao_creditos').getFullList<PedidoInformacaoCredito>({
    filter: `solicitante_id = "${userId}"`,
    sort: '-created',
    expand: 'anuncio_id,respondido_por',
  })
}

/**
 * Responder pedido de informação (ação do admin)
 */
export async function responderPedidoInformacao(
  pedidoId: string,
  adminId: string,
  respostaAdmin: string,
): Promise<PedidoInformacaoCredito> {
  return pb.collection('pedidos_informacao_creditos').update<PedidoInformacaoCredito>(pedidoId, {
    resposta_admin: respostaAdmin,
    respondido_por: adminId,
    respondido_em: new Date().toISOString(),
    status: 'respondido',
    visualizado_pelo_solicitante: false,
  })
}

/**
 * Marcar resposta como visualizada pelo solicitante
 */
export async function marcarPedidoVisualizado(pedidoId: string): Promise<PedidoInformacaoCredito> {
  return pb.collection('pedidos_informacao_creditos').update<PedidoInformacaoCredito>(pedidoId, {
    visualizado_pelo_solicitante: true,
  })
}

/**
 * Arquivar pedido de informação
 */
export async function arquivarPedidoInformacao(pedidoId: string): Promise<PedidoInformacaoCredito> {
  return pb.collection('pedidos_informacao_creditos').update<PedidoInformacaoCredito>(pedidoId, {
    status: 'arquivado',
  })
}
