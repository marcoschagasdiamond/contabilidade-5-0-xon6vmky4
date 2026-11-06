import { describe, it, expect } from 'vitest'
import {
  mapearCnaeParaSegmento,
  mapearCnaeParaSegmentoOpcional,
  type ItemSocioQsa,
} from '@/services/consultaCnpj'

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

  describe('Mapeamento expandido para atividades de serviços', () => {
    it('mapeia consultoria de gestão (divisão 70)', () => {
      expect(
        mapearCnaeParaSegmentoOpcional(
          '70.20-4-00',
          'Atividades de consultoria em gestão empresarial',
        ),
      ).toBe('Serviços')
    })

    it('mapeia contabilidade e advocacia (divisão 69)', () => {
      expect(mapearCnaeParaSegmentoOpcional('69.20-6-01', 'Atividades de contabilidade')).toBe(
        'Serviços',
      )
      expect(mapearCnaeParaSegmentoOpcional('69.11-7-01', 'Serviços advocatícios')).toBe('Serviços')
    })

    it('mapeia publicidade e marketing (divisão 73)', () => {
      expect(mapearCnaeParaSegmentoOpcional('73.11-4-00', 'Agências de publicidade')).toBe(
        'Serviços',
      )
    })

    it('mapeia limpeza e conservação (divisão 81)', () => {
      expect(
        mapearCnaeParaSegmentoOpcional('81.21-4-00', 'Limpeza em prédios e em domicílios'),
      ).toBe('Serviços')
    })

    it('mapeia vigilância e segurança privada (divisão 80)', () => {
      expect(
        mapearCnaeParaSegmentoOpcional(
          '80.11-1-01',
          'Atividades de vigilância e segurança privada',
        ),
      ).toBe('Serviços')
    })

    it('mapeia serviços de engenharia e arquitetura (divisão 71)', () => {
      expect(mapearCnaeParaSegmentoOpcional('71.12-0-00', 'Serviços de engenharia')).toBe(
        'Serviços',
      )
      expect(mapearCnaeParaSegmentoOpcional('71.11-1-00', 'Serviços de arquitetura')).toBe(
        'Serviços',
      )
    })

    it('mapeia locação de bens e veículos (divisão 77)', () => {
      expect(
        mapearCnaeParaSegmentoOpcional('77.11-0-00', 'Locação de automóveis sem condutor'),
      ).toBe('Serviços')
    })

    it('mapeia atividades veterinárias (divisão 75)', () => {
      expect(mapearCnaeParaSegmentoOpcional('75.00-1-00', 'Atividades veterinárias')).toBe(
        'Serviços',
      )
    })

    it('mapeia estética e serviços pessoais (divisão 96)', () => {
      expect(
        mapearCnaeParaSegmentoOpcional('96.02-5-01', 'Cabeleireiros, manicure e pedicure'),
      ).toBe('Serviços')
    })

    it('mapeia hotelaria e alojamento (divisão 55)', () => {
      expect(mapearCnaeParaSegmentoOpcional('55.10-8-01', 'Hotéis')).toBe('Serviços')
    })

    it('mapeia agenciamento de viagens (divisão 79) e mão de obra (divisão 78)', () => {
      expect(mapearCnaeParaSegmentoOpcional('79.11-2-00', 'Agências de viagens')).toBe('Serviços')
      expect(
        mapearCnaeParaSegmentoOpcional('78.10-8-00', 'Locação de mão-de-obra temporária'),
      ).toBe('Serviços')
    })

    it('mapeia apoio administrativo e teleatendimento (divisão 82)', () => {
      expect(
        mapearCnaeParaSegmentoOpcional(
          '82.11-3-00',
          'Serviços combinados de escritório e apoio administrativo',
        ),
      ).toBe('Serviços')
    })

    it('mapeia manutenção e reparação de equipamentos (divisão 95)', () => {
      expect(
        mapearCnaeParaSegmentoOpcional(
          '95.11-8-00',
          'Reparação e manutenção de computadores e de equipamentos periféricos',
        ),
      ).toBe('Serviços')
    })

    it('preserva segmentos específicos de saúde, educação, tecnologia, transporte e alimentação', () => {
      expect(mapearCnaeParaSegmentoOpcional('86.30-5-03', 'Atividade médica ambulatorial')).toBe(
        'Saúde',
      )
      expect(mapearCnaeParaSegmentoOpcional('85.12-1-00', 'Educação infantil')).toBe('Educação')
      expect(mapearCnaeParaSegmentoOpcional('62.02-3-00', 'Desenvolvimento de software')).toBe(
        'Tecnologia',
      )
      expect(mapearCnaeParaSegmentoOpcional('49.30-2-02', 'Transporte rodoviário de carga')).toBe(
        'Transporte',
      )
      expect(mapearCnaeParaSegmentoOpcional('56.11-2-01', 'Restaurantes e similares')).toBe(
        'Bares e Restaurantes',
      )
      expect(mapearCnaeParaSegmentoOpcional('41.20-4-00', 'Construção de edifícios')).toBe(
        'Construção Civil',
      )
      expect(
        mapearCnaeParaSegmentoOpcional('47.11-3-02', 'Comércio varejista de mercadorias em geral'),
      ).toBe('Comércio')
      expect(mapearCnaeParaSegmentoOpcional('10.11-2-01', 'Frigorífico - abate de bovinos')).toBe(
        'Indústria',
      )
      expect(mapearCnaeParaSegmentoOpcional('01.11-3-01', 'Cultivo de soja')).toBe('Agro')
    })
  })
})
