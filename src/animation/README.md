# 动画扩展

`Motion` 统一管理按时间推进的动画通道。相同通道的新动画覆盖旧动画，调用方从当前显示值开始；`cancel` 可供用户交互接管，`clear` 用于场景释放。动画共用场景渲染循环，不创建额外的循环。

`easing.ts` 提供 linear、smoothstep、smootherstep、cubicInOut 和可配置的三次贝塞尔。新增算法只需实现 `Easing = (progress: number) => number`，输入和输出端点应为 0、1，然后通过 `Motion.start` 或 `CameraMotion.move` 的 `curve` 参数传入。相机默认曲线在 `SceneManager.cameraCurve` 配置。

`CameraMotion` 把目标位置、视角方向和距离分别插值。方向用四元数球面插值，跨天体移动时中途拉远；目的位置通过函数逐帧读取，兼容时间模拟中的轨道运动。`duration` 以毫秒计。路径由 `paths.ts` 生成。新增轨迹算法时，返回 `TransitionPath` 并在 `createTransitionPath` 注册，无需改变 UI 和场景动作的调用方式。

默认时长：天体切换和重置 1000ms，定位 1100ms，地标 850ms，缩放 220ms。用户拖动和滚轮会取消相机动画；系统启用减少动态效果时直接应用终点。

验证：运行 `pnpm test` 检查曲线、帧率无关性、动作覆盖/取消、移动目标与圆弧路径；运行 `pnpm build` 检查类型和生产构建。

## 通过 props 切换算法

`UniverseCanvas` 和 `UniverseView` 均支持以下 props：

| Prop | 类型 | 默认值 | 作用 |
| --- | --- | --- | --- |
| `transitionAlgorithm` | `'bezier'`、`'chaikin'`、`'spherical'` | `'bezier'` | 相机路径算法 |
| `chaikinIterations` | `number` | `3` | Chaikin 切角次数，四舍五入并限制在 1–6 |

```vue
<UniverseCanvas transition-algorithm="bezier" />
<UniverseCanvas transition-algorithm="chaikin" :chaikin-iterations="4" />
<UniverseCanvas :transition-algorithm="algorithm" />
```

props 可响应式更新，新配置从下一次动作起生效；当前过渡继续完成，避免修改算法时跳动。定位、天体、地标、缩放与重置均共用此配置，界面渐变仍使用原有缓动。

贝塞尔使用三次曲线控制推进与拉远，Chaikin 使用 1/4、3/4 切角平滑折线，保留首尾端点并按弧长采样。两者在“目标推进比例 / 拉远比例”的空间生成路径，再结合球面方向插值生成相机轨迹，避免背面定位时直线穿过球体。这与 `easing.ts` 控制快慢的贝塞尔缓动是两层独立算法。
