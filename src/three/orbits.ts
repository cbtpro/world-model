// 二体椭圆轨道：焦点为原点，XZ 为轨道平面。
export function orbitPoint(semiMajorAxis: number, eccentricity: number, eccentricAnomaly: number) {
  return {
    x: semiMajorAxis * (Math.cos(eccentricAnomaly) - eccentricity),
    z: -semiMajorAxis * Math.sqrt(1 - eccentricity ** 2) * Math.sin(eccentricAnomaly),
  }
}

export function solveEccentricAnomaly(meanAnomaly: number, eccentricity: number): number {
  const tau = Math.PI * 2
  const mean = ((meanAnomaly % tau) + tau) % tau
  let anomaly = eccentricity < 0.8 ? mean : Math.PI
  for (let i = 0; i < 20; i++) {
    const delta = (anomaly - eccentricity * Math.sin(anomaly) - mean) /
      (1 - eccentricity * Math.cos(anomaly))
    anomaly -= delta
    if (Math.abs(delta) < 1e-12) break
  }
  return anomaly
}
