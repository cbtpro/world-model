export interface UsageRegion {
  id: string
  city: string
  country: string
  latitude: number
  longitude: number
  activeUsers: number
  sessions: number
}

export interface SoftwareUsageDataset {
  version: 1
  software: string
  period: string
  isMock: boolean
  regions: UsageRegion[]
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected object')
  return value as Record<string, unknown>
}
function text(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 120) throw new Error('Invalid text')
  return value.trim()
}
function number(value: unknown, min: number, max: number, integer = false): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isSafeInteger(value))) throw new Error('Invalid number')
  return value
}

export function decodeSoftwareUsage(raw: unknown): SoftwareUsageDataset {
  const data = record(raw)
  if (data.version !== 1 || typeof data.isMock !== 'boolean' || !Array.isArray(data.regions) || data.regions.length > 5000) throw new Error('Invalid dataset header')
  const period = text(data.period)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(period) || !Number.isFinite(Date.parse(period)) || new Date(period).toISOString().slice(0, 10) !== period) throw new Error('Invalid date')
  const ids = new Set<string>()
  const regions = data.regions.map(item => {
    const row = record(item)
    const id = text(row.id)
    if (ids.has(id)) throw new Error('Duplicate region id')
    ids.add(id)
    const activeUsers = number(row.activeUsers, 0, 1_000_000_000_000, true)
    return {
      id, city: text(row.city), country: text(row.country),
      latitude: number(row.latitude, -90, 90), longitude: number(row.longitude, -180, 180),
      activeUsers, sessions: number(row.sessions, activeUsers, Number.MAX_SAFE_INTEGER, true),
    }
  })
  return { version: 1, software: text(data.software), period, isMock: data.isMock, regions }
}
