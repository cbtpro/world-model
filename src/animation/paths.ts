export type TransitionAlgorithm = 'spherical' | 'bezier' | 'chaikin'

export interface TransitionOptions {
  algorithm?: TransitionAlgorithm
  /** Chaikin 切角次数，限制在 1–6，默认 3。 */
  chaikinIterations?: number
}

export interface PathSample {
  progress: number
  lift: number
}

export type TransitionPath = (progress: number) => PathSample

// 在“目标推进比例 / 额外拉远比例”空间生成路径，再投射到相机的球面轨迹。
// 方向保持球面插值，定位点位于地球背面时不会沿直线穿过球体。
export function bezierPath(t: number): PathSample {
  const inverse = 1 - t
  return {
    progress: 3 * inverse * inverse * t * 0.2 + 3 * inverse * t * t * 0.8 + t ** 3,
    lift: 3 * inverse * inverse * t * 0.85 + 3 * inverse * t * t * 0.85,
  }
}

export function chaikinPath(iterations = 3): TransitionPath {
  const count = Number.isFinite(iterations) ? Math.min(6, Math.max(1, Math.round(iterations))) : 3
  let points: PathSample[] = [
    { progress: 0, lift: 0 },
    { progress: 0.25, lift: 0.8 },
    { progress: 0.75, lift: 0.8 },
    { progress: 1, lift: 0 },
  ]
  const mix = (a: PathSample, b: PathSample, t: number): PathSample => ({
    progress: a.progress + (b.progress - a.progress) * t,
    lift: a.lift + (b.lift - a.lift) * t,
  })
  for (let iteration = 0; iteration < count; iteration++) {
    const next = [points[0]]
    for (let i = 0; i < points.length - 1; i++) {
      next.push(mix(points[i], points[i + 1], 0.25), mix(points[i], points[i + 1], 0.75))
    }
    next.push(points[points.length - 1])
    points = next
  }

  // 按弧长重采样，防止切角后短线段与长线段产生不均匀速度。
  const lengths = [0]
  for (let i = 1; i < points.length; i++) {
    lengths.push(lengths[i - 1] + Math.hypot(
      points[i].progress - points[i - 1].progress,
      points[i].lift - points[i - 1].lift,
    ))
  }
  return (t) => {
    if (t <= 0) return { ...points[0] }
    if (t >= 1) return { ...points[points.length - 1] }
    const distance = t * lengths[lengths.length - 1]
    let low = 1, high = lengths.length - 1
    while (low < high) {
      const mid = (low + high) >>> 1
      if (lengths[mid] < distance) low = mid + 1
      else high = mid
    }
    const fraction = (distance - lengths[low - 1]) / (lengths[low] - lengths[low - 1])
    return mix(points[low - 1], points[low], fraction)
  }
}

export function createTransitionPath(options: TransitionOptions = {}): TransitionPath {
  switch (options.algorithm) {
    case 'bezier': return bezierPath
    case 'chaikin': return chaikinPath(options.chaikinIterations)
    default: return (t) => ({ progress: t, lift: Math.sin(Math.PI * t) ** 2 })
  }
}
