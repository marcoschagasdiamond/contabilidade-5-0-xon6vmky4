/**
 * Hook central: todo registro criado em `clientes` ou `clientes_empresas`
 * nasce com estagio_funil preenchido.
 *
 * Causa raiz corrigida: estagio_funil é select OPCIONAL nessas coleções e
 * registros criados sem o campo (API, importações, telas antigas) nasciam
 * vazio — e a resolução de "cliente ativo" do fluxo cliente-empresa depende
 * de um estágio válido, quebrando o salvamento de dados/diagnóstico com
 * "não há vínculo com cliente ativo".
 *
 * Centralizado aqui porque cobre QUALQUER via de criação (app, admin UI,
 * API externa, importações), sem depender de cada tela lembrar de enviar o
 * campo. Valor explícito enviado no payload é respeitado.
 */
onRecordCreate(
  (e) => {
    if (!e.record.get('estagio_funil')) {
      e.record.set('estagio_funil', 'diagnostico')
    }
    e.next()
  },
  'clientes',
  'clientes_empresas',
)
