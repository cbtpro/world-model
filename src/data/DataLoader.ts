export interface DataSource {
  load(signal: AbortSignal): Promise<unknown>
}

export type LoadErrorCode = 'aborted' | 'timeout' | 'source' | 'validation'
export class DataLoadError extends Error {
  constructor(public readonly code: LoadErrorCode, message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'DataLoadError'
  }
}

export interface LoadOptions {
  signal?: AbortSignal
  timeoutMs?: number
  /** 仅重试数据源错误和超时；取消和校验失败不重试。 */
  retries?: number
}

// 数据源与校验器注入；新增接口、文件或数据格式无需修改加载器。
export class DataLoader<T> {
  constructor(private source: DataSource, private decode: (raw: unknown) => T) {}

  async load(options: LoadOptions = {}): Promise<T> {
    const timeoutMs = options.timeoutMs ?? 8000
    const retries = options.retries ?? 1
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || !Number.isInteger(retries) || retries < 0 || retries > 5) {
      throw new RangeError('Invalid data loader options')
    }
    for (let attempt = 0; ; attempt++) {
      try {
        const raw = await this.read(timeoutMs, options.signal)
        if (options.signal?.aborted) throw new DataLoadError('aborted', 'Data load cancelled')
        try { return this.decode(raw) }
        catch (cause) { throw new DataLoadError('validation', 'Invalid dataset', { cause }) }
      } catch (error) {
        if (!(error instanceof DataLoadError) || error.code === 'validation' || error.code === 'aborted' || attempt >= retries) throw error
      }
    }
  }

  private async read(timeoutMs: number, signal?: AbortSignal): Promise<unknown> {
    if (signal?.aborted) throw new DataLoadError('aborted', 'Data load cancelled')
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    let rejectAbort: (error: DataLoadError) => void = () => {}
    const cancel = () => {
      controller.abort()
      rejectAbort(new DataLoadError('aborted', 'Data load cancelled'))
    }
    const interrupted = new Promise<never>((_, reject) => {
      rejectAbort = reject
      timer = setTimeout(() => {
        controller.abort()
        reject(new DataLoadError('timeout', 'Data source timed out'))
      }, timeoutMs)
    })
    signal?.addEventListener('abort', cancel, { once: true })
    try {
      return await Promise.race([
        Promise.resolve().then(() => this.source.load(controller.signal)).catch(cause => {
          if (cause instanceof DataLoadError) throw cause
          throw new DataLoadError('source', 'Data source failed', { cause })
        }),
        interrupted,
      ])
    } finally {
      clearTimeout(timer)
      signal?.removeEventListener('abort', cancel)
      controller.abort()
    }
  }
}
