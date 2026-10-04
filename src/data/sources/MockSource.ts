import type { DataSource } from '../DataLoader'
import { DataLoadError } from '../DataLoader'

export class MockSource implements DataSource {
  constructor(private dataset: unknown) {}
  async load(signal: AbortSignal): Promise<unknown> {
    if (signal.aborted) throw new DataLoadError('aborted', 'Data load cancelled')
    return structuredClone(this.dataset)
  }
}
