import type { H3Event } from 'h3'

export function toRequestHeaders(event: H3Event): Headers {
  const source = getHeaders(event)
  const headers = new Headers()

  for (const [key, value] of Object.entries(source)) {
    if (typeof value === 'string') {
      headers.set(key, value)
    }
  }

  return headers
}
