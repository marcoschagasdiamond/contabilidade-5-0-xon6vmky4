// Migration 0075 — Limpeza do vínculo residual 'Bravo IT' em vinculos_societarios.
//
// Caso de uso imediato do usuário: o registro da Jucana em clientes_empresas
// (l3zjamzgu2cbt0j) tem itens gravados em testes antigos, incluindo um com
// nome 'Bravo IT'. O vínculo VÁLIDO é a 'Inove' (CNPJ 47.080.777/0001-77),
// que NUNCA é removida.
//
// Regra: remove itens cujo nome (case-insensitive) seja exatamente 'bravo it',
// de forma IDEMPOTENTE (em banco vazio ou já limpo, não faz nada). Qualquer
// outro item — inclusive 'Inove', 'inove g...', variações — é preservado.
// Itens que não tenham campo nomeEmpresa (formato antigo) também são
// preservados: só removemos o que conseguimos identificar com certeza.
//
// O app em si ganha botão de remover por item (UI); esta migração resolve
// apenas o dado residual que já estava no banco.

const REGISTRO_ALVO = 'l3zjamzgu2cbt0j'
const NOME_RESIDUAL = 'bravo it'

migrate(
  (app) => {
    let rec = null
    try {
      rec = app.findFirstRecordByFilter('clientes_empresas', `id = "${REGISTRO_ALVO}"`)
    } catch (_) {
      rec = null
    }
    if (!rec) {
      console.log(`[0075] registro ${REGISTRO_ALVO} não existe nesta cópia do banco — no-op`)
      return
    }

    const bruto = rec.get('vinculos_societarios')
    let lista = []
    if (Array.isArray(bruto)) {
      lista = bruto
    } else if (typeof bruto === 'string' && bruto.trim() !== '') {
      try {
        const parsed = JSON.parse(bruto)
        lista = Array.isArray(parsed) ? parsed : []
      } catch (_) {
        lista = []
      }
    }

    const itensIniciais = lista.length
    if (itensIniciais === 0) {
      console.log('[0075] vínculos_societarios vazio — no-op')
      return
    }

    const preservados = lista.filter((item) => {
      if (!item || typeof item !== 'object') return true
      const nome = typeof item.nomeEmpresa === 'string' ? item.nomeEmpresa.trim().toLowerCase() : ''
      // Remove SOMENTE o item residual identificado; tudo que não casa é preservado.
      return nome !== NOME_RESIDUAL
    })

    if (preservados.length === itensIniciais) {
      console.log(
        `[0075] nenhum item '${NOME_RESIDUAL}' encontrado (${itensIniciais} item(ns) preservados) — no-op`,
      )
      return
    }

    rec.set('vinculos_societarios', preservados)
    try {
      app.save(rec)
    } catch (e) {
      console.log(`[0075] falha ao salvar ${REGISTRO_ALVO}:`, e)
      throw e
    }
    console.log(
      `[0075] vínculo(s) residual(is) '${NOME_RESIDUAL}' removido(s) de ${REGISTRO_ALVO}: ${itensIniciais} -> ${preservados.length} item(ns)`,
    )
  },
  // Down: no-op — remoção de dado residual de teste não é revertida
  (app) => {},
)
