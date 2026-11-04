import { describe, it, expect } from 'vitest'
import {
  parseBalanceteCsvTexto,
  converterValorContabil,
  processarLinhasBalancete,
} from '../lib/parseBalancete'
import { DADOS_EMPRESA_PADRAO } from '../types/dadosEmpresa'

describe('parseBalancete - Motor de Parsing de Balancete Contábil', () => {
  it('deve converter valores contábeis com vírgula, ponto, parênteses e indicador D/C', () => {
    expect(converterValorContabil('1234,56')).toBe(1234.56)
    expect(converterValorContabil('1.234.567,89')).toBe(1234567.89)
    expect(converterValorContabil('(50.000,00)')).toBe(50000)
    expect(converterValorContabil('10.000,00 D')).toBe(10000)
    expect(converterValorContabil('25.000,00 C')).toBe(25000)
    expect(converterValorContabil('')).toBe(0)
    expect(converterValorContabil(null)).toBe(0)
  })

  it('deve rejeitar arquivo CSV vazio ou sem contas válidas', () => {
    const resVazio = parseBalanceteCsvTexto('', 'vazio.csv', DADOS_EMPRESA_PADRAO)
    expect(resVazio.valido).toBe(false)
    expect(resVazio.erro).toBeDefined()

    const resInvalido = parseBalanceteCsvTexto(
      'Coluna1;Coluna2\nTexto;OutroTexto',
      'invalido.csv',
      DADOS_EMPRESA_PADRAO,
    )
    expect(resInvalido.valido).toBe(false)
  })

  it('deve processar balancete de 2 colunas (conta/descrição e saldo)', () => {
    const csvDuasColunas = [
      'Conta;Saldo',
      '3.1.01 Receita Bruta de Vendas;2400000,00',
      '4.1.01 Salarios e Ordenados;360000,00',
      '4.1.02 Encargos Sociais FGTS INSS;120000,00',
      '4.2.01 Despesa com Energia Eletrica;48000,00',
      '4.2.02 Alugueis de Imoveis Comerciais;96000,00',
      '1.2.03 Maquinas e Equipamentos Industriais;500000,00',
      '1.2.04 Veiculos e Frotas;150000,00',
      '1.3.01 Softwares e Licencas de Uso;80000,00',
      '3.9.01 Lucro Liquido do Exercicio;480000,00',
    ].join('\n')

    const resultado = parseBalanceteCsvTexto(csvDuasColunas, 'balancete_2024.csv', {
      ...DADOS_EMPRESA_PADRAO,
      faturamentoMensal: 0,
      folhaPagamentoMensal: 0,
      imobilizadoUltimos5Anos: 0,
      insumosEnergeticos: false,
      intangiveisRoyalties: false,
    })

    expect(resultado.valido).toBe(true)
    expect(resultado.metadados.nomeTipo).toContain('Balancete Contábil')

    // Agregados
    const ag = resultado.detalhesBalancete
    expect(ag.receitaBrutaPeriodo).toBe(2400000)
    expect(ag.faturamentoMensalEstimado).toBe(200000) // 2.400.000 / 12
    expect(ag.folhaPagamentoPeriodo).toBe(480000) // 360k + 120k
    expect(ag.folhaPagamentoMensalEstimada).toBe(40000) // 480k / 12
    expect(ag.contasEnergiaEletrica).toBe(48000)
    expect(ag.contasIntangiveisRoyalties).toBe(80000)
    expect(ag.ativoImobilizadoTotal).toBe(650000) // 500k + 150k
    expect(ag.margemLucroCalculada).toBe(20) // 480k / 2.4M = 20%

    // Campos comparativos e sugeridos
    expect(resultado.camposSugeridos.faturamentoMensal).toBe(200000)
    expect(resultado.camposSugeridos.folhaPagamentoMensal).toBe(40000)
    expect(resultado.camposSugeridos.insumosEnergeticos).toBe(true)
    expect(resultado.camposSugeridos.intangiveisRoyalties).toBe(true)
    expect(resultado.camposSugeridos.imobilizadoUltimos5Anos).toBe(650000)
    expect(resultado.camposSugeridos.margemLucroEstimada).toBe(20)

    const chaves = resultado.camposComparativo.map((c) => c.chave)
    expect(chaves).toContain('faturamentoMensal')
    expect(chaves).toContain('folhaPagamentoMensal')
    expect(chaves).toContain('insumosEnergeticos')
    expect(chaves).toContain('intangiveisRoyalties')
    expect(chaves).toContain('imobilizadoUltimos5Anos')
  })

  it('deve processar balancete completo com colunas separadas de código, descrição, débitos, créditos e saldo final', () => {
    const csvCompleto = [
      'Codigo;Descricao;Saldo_Anterior;Debitos;Creditos;Saldo_Atual',
      '1.1.01.001;Caixa Geral;10000,00;50000,00;45000,00;15000,00',
      '1.2.03.001;Maquinas e Equipamentos;300000,00;50000,00;0,00;350000,00',
      '3.1.01.001;Receita de Prestacao de Servicos;0,00;0,00;1200000,00;1200000,00',
      '3.1.01.002;Receita de Venda de Mercadorias;0,00;0,00;600000,00;600000,00',
      '4.1.01.001;Salarios e Ordenados;0,00;240000,00;0,00;240000,00',
      '4.2.01.005;Energia Eletrica Industrial;0,00;36000,00;0,00;36000,00',
      '4.2.01.010;Servicos de TI e Telecomunicacoes;0,00;24000,00;0,00;24000,00',
    ].join('\n')

    const resultado = parseBalanceteCsvTexto(csvCompleto, 'balancete_completo.csv', {
      ...DADOS_EMPRESA_PADRAO,
      atividadeMista: false,
    })

    expect(resultado.valido).toBe(true)
    const ag = resultado.detalhesBalancete
    expect(ag.receitaBrutaPeriodo).toBe(1800000) // 1.2M + 600k
    expect(ag.receitaServicos).toBe(1200000)
    expect(ag.receitaComercio).toBe(600000)

    // Atividade Mista detectada
    expect(resultado.camposSugeridos.atividadeMista).toBe(true)
    expect(resultado.camposSugeridos.proporcaoServicoMisto).toBe(67) // 1.2M / 1.8M = ~67%
    expect(resultado.camposSugeridos.imobilizadoUltimos5Anos).toBe(350000)
    expect(resultado.camposSugeridos.insumosEnergeticos).toBe(true)
  })
})
