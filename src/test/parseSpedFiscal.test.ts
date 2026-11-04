import { describe, it, expect } from 'vitest'
import {
  parseSpedConteudo,
  parseNumeroSped,
  formatarCnpjRaw,
  formatarDataSped,
} from '../lib/parseSpedFiscal'
import { DADOS_EMPRESA_PADRAO } from '../types/dadosEmpresa'

describe('parseSpedFiscal - Motor de Parsing de Documentos Fiscais SPED', () => {
  it('deve converter números no formato SPED brasileiro com vírgula', () => {
    expect(parseNumeroSped('1234,56')).toBe(1234.56)
    expect(parseNumeroSped('1.234.567,89')).toBe(1234567.89)
    expect(parseNumeroSped('')).toBe(0)
    expect(parseNumeroSped('0,00')).toBe(0)
  })

  it('deve formatar CNPJ bruto de 14 dígitos', () => {
    expect(formatarCnpjRaw('12345678000195')).toBe('12.345.678/0001-95')
  })

  it('deve formatar data DDMMAAAA para YYYY-MM-DD', () => {
    expect(formatarDataSped('01012024')).toBe('2024-01-01')
    expect(formatarDataSped('31012024')).toBe('2024-01-31')
  })

  it('deve rejeitar arquivo vazio ou sem registro 0000', () => {
    const res = parseSpedConteudo('', 'teste.txt', DADOS_EMPRESA_PADRAO)
    expect(res.valido).toBe(false)
    expect(res.erro).toBeDefined()

    const resInvalido = parseSpedConteudo(
      'Linha 1 qualquer\nLinha 2 sem pipe',
      'invalido.txt',
      DADOS_EMPRESA_PADRAO,
    )
    expect(resInvalido.valido).toBe(false)
  })

  it('deve processar uma EFD Contribuições válida e extrair receitas, monofásicos e interestadual', () => {
    const efdExemplo = [
      '|0000|005|0|0||01012024|31012024|EMPRESA MODELO CONTABIL LTDA|12345678000195|SP|3550308||01|1|',
      '|0001|0|',
      '|0140|0001|MATRIZ SP|12345678000195|SP||3550308|||',
      '|0140|0002|FILIAL RJ|12345678000276|RJ||3304557|||',
      '|0200|P001|GASOLINA ADITIVADA C|||UN|01|27101259||',
      '|0200|P002|BEBIDA ENERGETICA LATA|||UN|01|22029000||',
      '|C010|12345678000195|1|',
      '|C100|1|0|FORN01|55|00|1|1001|25012024|25012024|100000,00|0||0|100000,00|0|0|0|100000,00|0|0|0|0|0|0|0|',
      '|C170|1|P001|GASOLINA ADITIVADA|1000|UN|50000,00|0|0|010|5102|101|0|0|0|0|0|0|0|0|0|0|0|0|04|0,00|0,00|0,00|04|0,00|0,00|0,00|',
      '|C170|2|P002|BEBIDA ENERGETICA|500|UN|30000,00|0|0|010|6102|101|0|0|0|0|0|0|0|0|0|0|0|0|01|30000,00|1,65|495,00|01|30000,00|7,60|2280,00|',
      '|C170|3|P003|PRODUTO ISENTO|200|UN|20000,00|0|0|040|5102|101|0|0|0|0|0|0|0|0|0|0|0|0|06|0,00|0,00|0,00|06|0,00|0,00|0,00|',
      '|M001|0|',
      '|M100|101|0|50000,00|1,65|0|825,00|0|825,00|0|0|825,00|01|',
      '|M200|100000,00|100000,00|0|0|0|0|0|0|0|0|0|',
      '|9999|15|',
    ].join('\n')

    const resultado = parseSpedConteudo(efdExemplo, 'efd_jan_2024.txt', DADOS_EMPRESA_PADRAO)

    expect(resultado.valido).toBe(true)
    expect(resultado.metadados.tipo).toBe('efd_contribuicoes')
    expect(resultado.metadados.cnpj).toBe('12.345.678/0001-95')
    expect(resultado.metadados.nomeEmpresa).toBe('EMPRESA MODELO CONTABIL LTDA')
    expect(resultado.metadados.uf).toBe('SP')

    // Filiais identificadas (0140: SP e RJ -> 2 estabelecimentos)
    expect(resultado.detalhes.filiaisDetectadas).toBe(2)
    expect(resultado.detalhes.ufsOperacaoDetectadas).toContain('RJ')

    // Faturamento e vendas interestaduais (30k de 100k = 30% interestadual CFOP 6102)
    expect(resultado.detalhes.faturamentoPeriodo).toBe(100000)
    expect(resultado.detalhes.receitaInterestadual).toBe(30000)
    expect(resultado.detalhes.percentualVendasInterestaduais).toBe(30)

    // Presença de monofásicos detectada
    expect(resultado.detalhes.presencaMonofasicos).toBe(true)
    expect(resultado.detalhes.categoriasMonofasicosDetectadas).toEqual(
      expect.arrayContaining(['combustiveis', 'bebidas']),
    )

    // Saldo credor / créditos escriturados M100
    expect(resultado.detalhes.saldoCredorAcumulado).toBe(825)

    // Campos comparativos gerados
    expect(resultado.camposComparativo.length).toBeGreaterThan(0)
    const chavesComparadas = resultado.camposComparativo.map((c) => c.chave)
    expect(chavesComparadas).toContain('cnpj')
    expect(chavesComparadas).toContain('nomeEmpresa')
    expect(chavesComparadas).toContain('presencaMonofasicos')
    expect(chavesComparadas).toContain('percentualVendasInterestaduais')
  })
})
