/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook de criação de usuários — proteção do nivel_acesso
 *
 * O cadastro público (Cadastro.tsx → AuthContext.signup) cria o usuário em
 * `users` SEM nivel_acesso, e a API rule de create é pública — o campo nasce
 * vazio, o que impede o usuário de enxergar o próprio painel de analista e de
 * aparecer nos quadros do /admin.
 *
 * Este hook roda no ONTO (antes de gravar) de TODO user criado — cadastro
 * público, inclusão manual do admin, convites aceitos, OAuth, API direta —
 * e garante que o campo nunca mais nasça vazio:
 * - marcoschagasdiamond@icloud.com nasce 'master' (se não vier nível no payload).
 * - Demais usuários: 'empresario' se perfil = empresario; senão 'analista'.
 * - Se o chamador JÁ enviou um nível válido (master/admin/analista/empresario),
 *   ele é respeitado (convites, inclusão manual, migração de perfil).
 *
 * Idempotente por natureza: só preenche quando o campo está vazio.
 */
onRecordCreate((e) => {
  const NIVEIS_VALIDOS = ['master', 'admin', 'analista', 'empresario']
  const MASTER_EMAIL = 'marcoschagasdiamond@icloud.com'

  const record = e.record
  const nivelAtual = (record.getString('nivel_acesso') || '').trim().toLowerCase()
  const email = (record.getString('email') || '').trim().toLowerCase()

  if (nivelAtual === '' || !NIVEIS_VALIDOS.includes(nivelAtual)) {
    const ehMaster = email === MASTER_EMAIL
    const perfil = (record.getString('perfil') || '').trim().toLowerCase()
    record.set(
      'nivel_acesso',
      ehMaster ? 'master' : perfil === 'empresario' ? 'empresario' : 'analista',
    )
    if (ehMaster && record.getString('role') === '') {
      record.set('role', 'admin')
    }
    console.log(
      '[NIVEL_ACESSO] Preenchido automaticamente:',
      email,
      '→',
      record.getString('nivel_acesso'),
    )
  }

  return e.next()
}, 'users')
