export type Easing = (progress: number) => number

export const easing = {
  linear: (t: number) => t,
  smoothstep: (t: number) => t * t * (3 - 2 * t),
  smootherstep: (t: number) => t * t * t * (t * (6 * t - 15) + 10),
  cubicInOut: (t: number) => t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2,
} satisfies Record<string, Easing>

// 数值求解 x(t)，让 CSS 风格的三次贝塞尔曲线也能用于场景动画。
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): Easing {
  if (x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) {
    throw new RangeError('Bezier x control points must be between 0 and 1')
  }
  const sample = (t: number, a: number, b: number) =>
    3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t * t * b + t ** 3
  return (progress) => {
    if (progress <= 0) return 0
    if (progress >= 1) return 1
    let low = 0, high = 1
    for (let i = 0; i < 24; i += 1) {
      const mid = (low + high) / 2
      if (sample(mid, x1, x2) < progress) low = mid
      else high = mid
    }
    return sample((low + high) / 2, y1, y2)
  }
}
