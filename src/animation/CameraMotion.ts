import * as THREE from 'three'
import { Motion } from './Motion'
import type { Easing } from './easing'
import { createTransitionPath, type TransitionOptions } from './paths'

export interface CameraPose {
  target: THREE.Vector3
  offset: THREE.Vector3
}

export class CameraMotion {
  destinationDistance: number | null = null

  constructor(private motion: Motion, private camera: THREE.PerspectiveCamera,
    private target: THREE.Vector3) {}

  move(destination: () => CameraPose, options: {
    duration?: number
    curve?: Easing
    immediate?: boolean
  } & TransitionOptions = {}): void {
    const startTarget = this.target.clone()
    const startOffset = this.camera.position.clone().sub(startTarget)
    const startDistance = Math.max(startOffset.length(), 0.001)
    const startDirection = startOffset.normalize()
    const endPose = destination()
    this.destinationDistance = endPose.offset.length()
    const travel = startTarget.distanceTo(endPose.target)
    const lift = travel * 0.65
    const path = createTransitionPath(options)
    const rotation = new THREE.Quaternion()
    const partialRotation = new THREE.Quaternion()
    const direction = new THREE.Vector3()
    this.motion.start('camera', (t) => {
      const sample = path(t)
      const pose = destination() // 时间模拟中，目的天体仍会移动。
      rotation.setFromUnitVectors(startDirection, pose.offset.clone().normalize())
      partialRotation.identity().slerp(rotation, sample.progress)
      direction.copy(startDirection).applyQuaternion(partialRotation)
      const distance = THREE.MathUtils.lerp(startDistance, pose.offset.length(), sample.progress)
        + sample.lift * lift
      this.target.copy(startTarget).lerp(pose.target, sample.progress)
      this.camera.position.copy(this.target).addScaledVector(direction, distance)
      this.camera.lookAt(this.target)
    }, { ...options, complete: () => { this.destinationDistance = null } })
  }

  cancel(): void {
    this.motion.cancel('camera')
    this.destinationDistance = null
  }
}
