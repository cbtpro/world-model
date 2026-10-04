import { easing } from './easing'

// 按实际经过的时间恢复，补偿量一次性确定，每帧仅应用新增部分。
export class TimeRecovery {
  private applied = 0
  constructor(private amount: number, private start: number, private duration = 900) {}

  step(now: number): number {
    const progress = Math.min(1, Math.max(0, (now - this.start) / this.duration))
    const next = this.amount * easing.smootherstep(progress)
    const delta = next - this.applied
    this.applied = next
    return delta
  }

  get remaining(): number { return this.amount - this.applied }
  get complete(): boolean { return Math.abs(this.remaining) < 1e-12 }
}
