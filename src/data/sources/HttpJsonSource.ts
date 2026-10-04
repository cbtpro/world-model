import { DataLoadError, type DataSource } from '../DataLoader'

export class HttpJsonSource implements DataSource {
  constructor(private url: string) {}
  async load(signal: AbortSignal): Promise<unknown> {
    const response = await fetch(this.url, { signal, headers: { Accept: 'application/json' } })
    if (!response.ok) {
      const code = response.status === 429 || response.status >= 500 ? 'source' : 'validation'
      throw new DataLoadError(code, `HTTP ${response.status}`)
    }
    return response.json()
  }
}
