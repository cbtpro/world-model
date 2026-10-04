export interface GeoNode { id: string; name: string; latitude: number; longitude: number; role: 'primary' | 'replica' | 'airport' }
export interface GeoRoute { id: string; from: string; to: string; label: string; latencyMs: number; durationSeconds: number }
export interface RouteDataset { nodes: GeoNode[]; routes: GeoRoute[] }
export interface SimulationDataset { isMock: true; network: RouteDataset; flights: RouteDataset }

/** 校验节点、经纬度、连线引用及动画参数，避免无效数据进入渲染层。 */
export function decodeSimulation(raw: unknown): SimulationDataset {
  const object = (value: unknown): Record<string, unknown> => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Expected object')
    return value as Record<string, unknown>
  }
  const text = (value: unknown): string => {
    if (typeof value !== 'string' || !value.trim() || value.length > 120) throw Error('Invalid text')
    return value.trim()
  }
  const number = (value: unknown, min: number, max: number): number => {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw Error('Invalid number')
    return value
  }
  const decode = (value: unknown, kind: 'network' | 'flights'): RouteDataset => {
    const data = object(value)
    if (!Array.isArray(data.nodes) || !Array.isArray(data.routes) || data.nodes.length > 500 || data.routes.length > 1000) throw Error('Invalid collection')
    const ids = new Set<string>()
    const nodes = data.nodes.map(item => {
      const node = object(item), id = text(node.id)
      if (ids.has(id)) throw Error('Duplicate node')
      ids.add(id)
      if (kind === 'flights' ? node.role !== 'airport' : node.role !== 'primary' && node.role !== 'replica') throw Error('Invalid role')
      return { id, name: text(node.name), role: node.role as GeoNode['role'], latitude: number(node.latitude, -90, 90), longitude: number(node.longitude, -180, 180) }
    })
    const routeIds = new Set<string>()
    const routes = data.routes.map(item => {
      const route = object(item), id = text(route.id), from = text(route.from), to = text(route.to)
      if (routeIds.has(id) || !ids.has(from) || !ids.has(to) || from === to) throw Error('Invalid route reference')
      routeIds.add(id)
      return { id, from, to, label: text(route.label), latencyMs: number(route.latencyMs, 0, 10000), durationSeconds: number(route.durationSeconds, 2, 300) }
    })
    return { nodes, routes }
  }
  const data = object(raw)
  if (data.isMock !== true) throw Error('Expected simulation data')
  return { isMock: true, network: decode(data.network, 'network'), flights: decode(data.flights, 'flights') }
}
