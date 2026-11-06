import { describe, it, expect } from 'vitest'
import { mapearCnaeParaSegmento, type ItemSocioQsa } from '@/services/consultaCnpj'

describe('QSA & Consulta CNPJ Types e Mapeamento', () => {
  it('exporta e tipa corretamente ItemSocioQsa', () => {
    const socio: ItemSocioQsa = {
      nome: 'Fulano da Silva',
      qualificacao: '49-Sócio-Administrador',
      tipoPessoa: 'PF',
    }
    expect(socio.nome).toBe('Fulano da Silva')
    expect(socio.qualificacao).toBe('49-Sócio-Administrador')
  })

  it('mapeia CNAE de tecnologia para segmento Tecnologia', () => {
    expect(mapearCnaeParaSegmento('62.01-5-01', 'Desenvolvimento de programas de computador')).toBe(
      'Tecnologia',
    )
  })
})
