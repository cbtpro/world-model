import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import { DataLoader } from '@/data/DataLoader'
import { MockSource } from '@/data/sources/MockSource'
import { decodeSimulation, type SimulationDataset } from '@/data/simulation/schema'
import mock from '@/data/simulation/mock.json'

export const useSimulationStore = defineStore('simulation', () => {
  const dataset = shallowRef<SimulationDataset | null>(null)
  const networkVisible = ref(false), flightsVisible = ref(false)
  const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const loader = new DataLoader(new MockSource(mock), decodeSimulation)
  let controller: AbortController | null = null
  let sequence = 0
  async function load(): Promise<void> {
    controller?.abort()
    const current = ++sequence
    controller = new AbortController()
    status.value = 'loading'
    try {
      const result = await loader.load({ signal: controller.signal })
      if (current !== sequence) return
      dataset.value = result
      status.value = 'ready'
    } catch {
      if (current === sequence) status.value = 'error'
    } finally {
      if (current === sequence) controller = null
    }
  }
  function cancel(): void {
    sequence++
    controller?.abort()
    controller = null
    if (status.value === 'loading') status.value = dataset.value ? 'ready' : 'idle'
  }
  return { dataset, networkVisible, flightsVisible, status, load, cancel }
})
