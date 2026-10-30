/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook de CRM Fase 3 (crm_clientes e crm_interacoes)
 * Validações e integridade de dados comerciais.
 *
 * Regras:
 * - Empresários não podem criar nem atualizar registros em crm_clientes ou crm_interacoes.
 * - Analistas só podem definir a si mesmos como analista_responsavel (ou master/admin podem definir qualquer um).
 * - Ao criar uma interação, o usuario_id é automaticamente associado ao usuário autenticado caso não fornecido.
 */

// 1. Validação em crm_clientes (Create)
onRecordCreateRequest((e) => {
  const authUser = e.auth
  if (!authUser) {
    throw new ForbiddenError('Autenticação necessária para gerenciar o CRM.')
  }

  const nivel = authUser.getString('nivel_acesso') || authUser.getString('role')
  const perfil = authUser.getString('perfil')

  if (nivel === 'empresario' || perfil === 'empresario') {
    throw new ForbiddenError('Acesso restrito: empresários não têm acesso ao CRM.')
  }

  const isMasterOrAdmin =
    nivel === 'master' ||
    nivel === 'admin' ||
    authUser.getString('role') === 'admin' ||
    authUser.getString('email').toLowerCase() === 'marcoschagasdiamond@icloud.com'

  // Se for analista e não especificou analista_responsavel, define o próprio
  if (!e.record.getString('analista_responsavel')) {
    e.record.set('analista_responsavel', authUser.id)
  } else if (!isMasterOrAdmin && e.record.getString('analista_responsavel') !== authUser.id) {
    // Analista só pode criar para sua própria carteira
    e.record.set('analista_responsavel', authUser.id)
  }

  // Define data de entrada default se não veio
  if (!e.record.getString('data_entrada')) {
    e.record.set('data_entrada', new Date().toISOString().slice(0, 10))
  }
}, 'crm_clientes')

// 2. Validação em crm_clientes (Update)
onRecordUpdateRequest((e) => {
  const authUser = e.auth
  if (!authUser) {
    throw new ForbiddenError('Autenticação necessária.')
  }

  const nivel = authUser.getString('nivel_acesso') || authUser.getString('role')
  const perfil = authUser.getString('perfil')

  if (nivel === 'empresario' || perfil === 'empresario') {
    throw new ForbiddenError('Acesso restrito: empresários não têm acesso ao CRM.')
  }

  const isMasterOrAdmin =
    nivel === 'master' ||
    nivel === 'admin' ||
    authUser.getString('role') === 'admin' ||
    authUser.getString('email').toLowerCase() === 'marcoschagasdiamond@icloud.com'

  if (!isMasterOrAdmin && e.record.getString('analista_responsavel') !== authUser.id) {
    throw new ForbiddenError('Você só pode editar clientes da sua própria carteira no CRM.')
  }
}, 'crm_clientes')

// 3. Validação em crm_interacoes (Create)
onRecordCreateRequest((e) => {
  const authUser = e.auth
  if (!authUser) {
    throw new ForbiddenError('Autenticação necessária.')
  }

  const nivel = authUser.getString('nivel_acesso') || authUser.getString('role')
  const perfil = authUser.getString('perfil')

  if (nivel === 'empresario' || perfil === 'empresario') {
    throw new ForbiddenError('Acesso restrito: empresários não têm acesso às interações do CRM.')
  }

  if (!e.record.getString('usuario_id')) {
    e.record.set('usuario_id', authUser.id)
  }

  if (!e.record.getString('data')) {
    e.record.set('data', new Date().toISOString().slice(0, 10))
  }
}, 'crm_interacoes')
