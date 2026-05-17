import {
  instances,
  activeAccountId,
  activeMailId,
  replaceAll,
} from '@/stores/providers.store'
import { prefs } from '@/stores/mail.store'
import type { ToolInstance } from '@/tools'

export interface BackupBundle {
  __openmail__: true
  version: 2
  exportedAt: string
  instances: ToolInstance[]
  activeAccountId: string
  activeMailId: string
  prefs: typeof prefs.value
}

export const backupService = {
  build(): BackupBundle {
    return {
      __openmail__: true,
      version: 2,
      exportedAt: new Date().toISOString(),
      instances: instances.value.map((i) => ({ ...i })),
      activeAccountId: activeAccountId.value,
      activeMailId: activeMailId.value,
      prefs: { ...prefs.value },
    }
  },

  toJson(): string {
    return JSON.stringify(this.build(), null, 2)
  },

  download(): void {
    const json = this.toJson()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    a.href = url
    a.download = `openmail-backup-${ts}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  },

  apply(input: unknown, mode: 'replace' | 'merge' = 'merge'): number {
    if (!input || typeof input !== 'object') throw new Error('无效的备份内容')
    const b = input as Partial<BackupBundle>
    if (!b.__openmail__) throw new Error('不是 OpenMail 备份文件')

    // v2 直接读取；v1 在 providers store 启动时已经迁移过，这里只处理 v2 字段
    const list = Array.isArray(b.instances) ? b.instances : []

    if (mode === 'replace') {
      replaceAll(list)
    } else {
      const map = new Map(instances.value.map((i) => [i.id, i]))
      for (const i of list) map.set(i.id, { ...map.get(i.id), ...i })
      replaceAll(Array.from(map.values()))
    }

    if (b.activeAccountId && instances.value.some((i) => i.id === b.activeAccountId)) {
      activeAccountId.value = b.activeAccountId
    }
    if (b.activeMailId && instances.value.some((i) => i.id === b.activeMailId)) {
      activeMailId.value = b.activeMailId
    }
    if (b.prefs && typeof b.prefs === 'object') {
      Object.assign(prefs.value, b.prefs)
    }

    return instances.value.length
  },
}
