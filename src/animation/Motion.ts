import { easing, type Easing } from './easing'

interface Animation {
  start: number
  duration: number
  curve: Easing
  update: (progress: number) => void
  complete?: () => void
}

// 同一通道的新动作覆盖旧动作；调用方从当前显示值开始，可连续快速切换。
export class Motion {
  private animations = new Map<string, Animation>()

  start(channel: string, update: Animation['update'], options: {
    duration?: number
    curve?: Easing
    complete?: () => void
    immediate?: boolean
  } = {}): void {
    this.cancel(channel)
    if (options.immediate) {
      update(1)
      options.complete?.()
      return
    }
    this.animations.set(channel, {
      start: performance.now(),
      duration: Math.max(1, options.duration ?? 600),
      curve: options.curve ?? easing.smootherstep,
      update,
      complete: options.complete,
    })
  }

  update(now: number): void {
    for (const [channel, animation] of this.animations) {
      const progress = Math.min(1, Math.max(0, (now - animation.start) / animation.duration))
      animation.update(animation.curve(progress))
      if (progress === 1 && this.animations.get(channel) === animation) {
        this.animations.delete(channel)
        animation.complete?.()
      }
    }
  }

  resumeAfterPause(pausedAt: number, now: number): void {
    for (const animation of this.animations.values()) {
      animation.start += Math.max(0, now - Math.max(pausedAt, animation.start))
    }
  }

  has(channel: string): boolean { return this.animations.has(channel) }
  cancel(channel: string): void { this.animations.delete(channel) }
  clear(): void { this.animations.clear() }
}
