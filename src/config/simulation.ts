export const SECONDS_PER_DAY = 86_400
export const ORBIT_DEMO_SPEED = 30 * SECONDS_PER_DAY
export const MAX_SIMULATION_SPEED = 100 * SECONDS_PER_DAY
export const SPEED_PRESETS = [1, 3600, SECONDS_PER_DAY, ORBIT_DEMO_SPEED] as const

export function advanceSimulationDay(day: number, seconds: number, speed: number): number {
  return day + seconds * speed / SECONDS_PER_DAY
}

export function solarOverviewDistance(radius: number, fov: number, aspect: number): number {
  const halfFov = Math.atan(Math.tan(fov * Math.PI / 360) * Math.min(aspect, 1))
  return radius / Math.sin(halfFov) * 1.12
}
