import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: number
  message: string
  type: ToastType
}

const items = ref<ToastItem[]>([])
let cursor = 0
const timers = new Map<number, ReturnType<typeof setTimeout>>()

function push(message: string, type: ToastType = 'info', duration = 3000): number {
  const id = ++cursor
  items.value.push({ id, message, type })
  timers.set(id, setTimeout(() => remove(id), duration))
  return id
}

function remove(id: number): void {
  items.value = items.value.filter((t) => t.id !== id)
  const t = timers.get(id)
  if (t) {
    clearTimeout(t)
    timers.delete(id)
  }
}

export function useToast() {
  return {
    items,
    push,
    remove,
    success: (m: string, d?: number) => push(m, 'success', d),
    error: (m: string, d?: number) => push(m, 'error', d ?? 4200),
    info: (m: string, d?: number) => push(m, 'info', d),
    warn: (m: string, d?: number) => push(m, 'warning', d),
  }
}
