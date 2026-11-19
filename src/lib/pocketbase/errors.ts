import { ClientResponseError } from 'pocketbase'

export type FieldErrors = Record<string, string>

export function extractFieldErrors(error: unknown): FieldErrors {
  if (!(error instanceof ClientResponseError)) return {}
  const data = error.response?.data
  if (!data || typeof data !== 'object') return {}
  const errors: FieldErrors = {}
  for (const [field, detail] of Object.entries(data)) {
    if (
      detail &&
      typeof detail === 'object' &&
      'message' in detail &&
      typeof (detail as { message: unknown }).message === 'string'
    ) {
      errors[field] = (detail as { message: string }).message
    }
  }
  return errors
}

/**
 * Loga o corpo real do erro do PocketBase (response.data) para diagnóstico.
 * O response.data do PocketBase traz { campo: { message, code }, ... } quando a
 * recusa é de validação — sem isso o console só mostra "Failed to create record."
 */
export function logPocketBaseError(rotulo: string, error: unknown): void {
  if (error instanceof ClientResponseError) {
    console.error(
      `[${rotulo}] PocketBase recusou a operação — status ${error.status}`,
      '\nresponse.data:',
      JSON.stringify(error.response?.data ?? error.response ?? {}, null, 2),
      '\nurl:',
      error.url || '',
    )
    return
  }
  console.error(`[${rotulo}] Erro inesperado:`, error)
}

export function getErrorMessage(error: unknown): string {
  if (!(error instanceof ClientResponseError)) {
    return error instanceof Error ? error.message : 'An unexpected error occurred.'
  }
  const msgs = Object.values(extractFieldErrors(error))
  return msgs.length > 0 ? msgs.join(' ') : error.message || 'An unexpected error occurred.'
}
