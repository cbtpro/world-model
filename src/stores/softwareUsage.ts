import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { DataLoader, DataLoadError } from '@/data/DataLoader'
import { MockSource } from '@/data/sources/MockSource'
import { decodeSoftwareUsage, type SoftwareUsageDataset } from '@/data/softwareUsage/schema'
import mock from '@/data/softwareUsage/mock.json'

export const useSoftwareUsageStore = defineStore('softwareUsage', () => {
  const dataset = shallowRef<SoftwareUsageDataset | null>(null)
  const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const visible = ref(false)
  const selectedId = ref<string | null>(null)
  let controller: AbortController | null = null
  let sequence = 0
  const loader = new DataLoader(new MockSource(mock), decodeSoftwareUsage)
  const selected = computed(() => dataset.value?.regions.find(row => row.id === selectedId.value) ?? null)
  const totalUsers = computed(() => dataset.value?.regions.reduce((total, row) => total + row.activeUsers, 0) ?? 0)

  async function load(): Promise<void> {
    controller?.abort()
    const request = ++sequence
    controller = new AbortController()
    status.value = 'loading'
    try {
      const result = await loader.load({ signal: controller.signal })
      if (request !== sequence) return
      dataset.value = result
      if (!result.regions.some(row => row.id === selectedId.value)) selectedId.value = null
      status.value = 'ready'
    } catch (error) {
      if (request !== sequence || (error instanceof DataLoadError && error.code === 'aborted')) return
      status.value = 'error'
    } finally {
      if (request === sequence) controller = null
    }
  }
  function cancel(): void {
    sequence++
    controller?.abort()
    controller = null
    if (status.value === 'loading') status.value = dataset.value ? 'ready' : 'idle'
  }
  return { dataset, status, visible, selectedId, selected, totalUsers, load, cancel }
})
