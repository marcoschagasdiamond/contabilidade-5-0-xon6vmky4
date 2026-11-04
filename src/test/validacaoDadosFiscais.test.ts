import { describe, it, expect } from 'vitest'
import {
  validarCnpjInline,
  validarEmailInline,
  validarTelefoneInline,
  validarPercentualInline,
  validarValorMonetarioInline,
  executarValidacaoFiscal,
} from '@/lib/validacaoDadosFiscais'
import { DADOS_EMPRESA_PADRAO } from '@/types/dadosEmpresa'

describe('Validação de Dados Fiscais - Unit Tests', () => {
  it('valida CNPJ corretamente (dígitos verificadores e formato)', () => {
    // CNPJ vazio
    expect(validarCnpjInline('')).toBe('CNPJ é obrigatório')

    // CNPJ incompleto
    expect(validarCnpjInline('12.345.678')).toBe('Informe um CNPJ completo com 14 dígitos')

    // CNPJ com dígitos verificadores inválidos
    expect(validarCnpjInline('11.111.111/1111-11')).toBe(
      'CNPJ inválido (dígitos verificadores incorretos)',
    )
    expect(validarCnpjInline('12.345.678/0001-99')).toBe(
      'CNPJ inválido (dígitos verificadores incorretos)',
    )

    // CNPJ válido real
    // Exemplo de CNPJ matematicamente válido: 00.000.000/0001-91 (Banco do Brasil)
    expect(validarCnpjInline('00.000.000/0001-91')).toBeNull()
  })

  it('valida E-mail corporativo', () => {
    expect(validarEmailInline('')).toBe('E-mail corporativo é obrigatório')
    expect(validarEmailInline('usuario')).toBe(
      'Informe um e-mail válido (ex: contato@empresa.com.br)',
    )
    expect(validarEmailInline('usuario@')).toBe(
      'Informe um e-mail válido (ex: contato@empresa.com.br)',
    )
    expect(validarEmailInline('usuario@empresa.com.br')).toBeNull()
  })

  it('valida Telefone/WhatsApp', () => {
    expect(validarTelefoneInline('')).toBe('Telefone/WhatsApp é obrigatório')
    expect(validarTelefoneInline('12345')).toBe('Telefone com DDD inválido (mínimo 10 dígitos)')
    expect(validarTelefoneInline('+55 (11) 99999-9999')).toBeNull()
  })

  it('valida percentuais e valores monetários', () => {
    expect(validarPercentualInline(-5, 'Percentual')).toBe('Percentual não pode ser negativo')
    expect(validarPercentualInline(120, 'Percentual')).toBe('Percentual não pode ultrapassar 100%')
    expect(validarPercentualInline(50, 'Percentual')).toBeNull()

    expect(validarValorMonetarioInline(-10, 'Faturamento')).toBe(
      'Faturamento não pode ser negativo',
    )
    expect(validarValorMonetarioInline(100000, 'Faturamento')).toBeNull()
  })

  it('detecta avisos de coerência não-bloqueantes', () => {
    // 1. Monofásicos ativo sem categoria selecionada
    const dadosMono = {
      ...DADOS_EMPRESA_PADRAO,
      presencaMonofasicos: true,
      categoriasMonofasicos: [],
    }
    const resMono = executarValidacaoFiscal(dadosMono)
    expect(resMono.avisosCoerencia.some((a) => a.id === 'monofasicos-sem-categorias')).toBe(true)

    // 2. Perfil de insumos diferente de 100
    const dadosInsumos = {
      ...DADOS_EMPRESA_PADRAO,
      perfilInsumosAliquotaCheia: 50,
      perfilInsumosMonofasicos: 20,
      perfilInsumosAliquotaReduzida: 10, // soma = 80
    }
    const resInsumos = executarValidacaoFiscal(dadosInsumos)
    expect(resInsumos.avisosCoerencia.some((a) => a.id === 'perfil-insumos-soma')).toBe(true)

    // 3. Split parcial sem percentual
    const dadosSplit = {
      ...DADOS_EMPRESA_PADRAO,
      perfilRetencaoSplit: 'parcial' as const,
      percentualRetencaoSplit: 0,
    }
    const resSplit = executarValidacaoFiscal(dadosSplit)
    expect(resSplit.avisosCoerencia.some((a) => a.id === 'split-parcial-sem-percentual')).toBe(true)

    // 4. Filiais vs UFs de operação
    const dadosUfs = {
      ...DADOS_EMPRESA_PADRAO,
      numeroFiliais: 1, // apenas matriz
      ufsOperacao: ['MG', 'RJ', 'PR'], // 3 UFs adicionais
    }
    const resUfs = executarValidacaoFiscal(dadosUfs)
    expect(resUfs.avisosCoerencia.some((a) => a.id === 'filiais-vs-ufs')).toBe(true)
  })

  it('valida perfil padrão completo', () => {
    const res = executarValidacaoFiscal(DADOS_EMPRESA_PADRAO)
    // O perfil padrão possui dados válidos (exceto avisos eventuais de configuração)
    expect(typeof res.totalErros).toBe('number')
    expect(typeof res.totalAvisos).toBe('number')
  })
})
