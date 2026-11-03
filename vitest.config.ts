import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    // Suíte mínima e sem navegador: provam o conteúdo do parecer PDF via fakeDoc
    // e a camada de relacionamento da tese EST-04 do Recuperador de Créditos.
    include: ['src/**/*.test.ts'],
    environment: 'node',
    globals: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
