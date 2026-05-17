import { computed, ref, watch } from 'vue'
import { getTool } from '@/tools'
import type { ToolInstance } from '@/tools'
import { loadJson, newId, saveJson } from './storage'

const KEY_INSTANCES = 'providers.v2'
const KEY_ACTIVE_ACCOUNT = 'providers.activeAccountId'
const KEY_ACTIVE_MAIL = 'providers.activeMailId'
const KEY_LEGACY = 'providers'

interface LegacyProvider {
  id: string
  name: string
  type: string
  base_url: string
  key: string
  enabled: boolean
  balance?: string
}

function migrateLegacy(): ToolInstance[] {
  const legacy = loadJson<LegacyProvider[]>(KEY_LEGACY, [])
  if (!legacy.length) return []
  return legacy.map<ToolInstance>((p) => ({
    id: p.id,
    toolId: p.type === 'zhanghaoya' ? 'zhanghaoya' : 'custom-account',
    name: p.name,
    config: { base_url: p.base_url, key: p.key },
    enabled: p.enabled,
    state: { balance: p.balance },
  }))
}

function readDefaultsFromHost(): Partial<{ base_url: string; key: string }> {
  const def = (window as unknown as { APP_DEFAULTS?: { base_url?: string; key?: string } }).APP_DEFAULTS
  return {
    base_url: def?.base_url || 'https://www.zhanghaoya.com',
    key: def?.key || '',
  }
}

function defaultOutlookInstance(): ToolInstance {
  return {
    id: 'outlook-default',
    toolId: 'outlook',
    name: 'Outlook 邮箱',
    config: { email: '', client_id: '', refresh_token: '' },
    enabled: true,
  }
}

function bootstrap(): ToolInstance[] {
  const saved = loadJson<ToolInstance[] | null>(KEY_INSTANCES, null)
  if (Array.isArray(saved) && saved.length) {
    // 修补：旧存档若没有 mail 实例，补一个 Outlook 默认实例
    if (!saved.some((i) => getTool(i.toolId)?.category === 'mail')) {
      saved.push(defaultOutlookInstance())
    }
    return saved
  }

  const migrated = migrateLegacy()
  if (migrated.length) {
    if (!migrated.some((i) => getTool(i.toolId)?.category === 'mail')) {
      migrated.push(defaultOutlookInstance())
    }
    return migrated
  }

  const d = readDefaultsFromHost()
  return [
    {
      id: 'zhanghaoya-default',
      toolId: 'zhanghaoya',
      name: '账号鸭',
      config: {
        base_url: (d.base_url || 'https://www.zhanghaoya.com').replace(/\/+$/, ''),
        key: d.key || '',
      },
      enabled: true,
    },
    defaultOutlookInstance(),
  ]
}

// ============================================================
// state
// ============================================================

export const instances = ref<ToolInstance[]>(bootstrap())

export const activeAccountId = ref<string>(
  loadJson<string>(KEY_ACTIVE_ACCOUNT, '') ||
    instances.value.find((i) => getTool(i.toolId)?.category === 'account')?.id ||
    '',
)

export const activeMailId = ref<string>(
  loadJson<string>(KEY_ACTIVE_MAIL, '') ||
    instances.value.find((i) => getTool(i.toolId)?.category === 'mail')?.id ||
    '',
)

// 持久化
watch(instances, (v) => saveJson(KEY_INSTANCES, v), { deep: true })
watch(activeAccountId, (v) => saveJson(KEY_ACTIVE_ACCOUNT, v))
watch(activeMailId, (v) => saveJson(KEY_ACTIVE_MAIL, v))

// ============================================================
// 派生 selectors
// ============================================================

export const accountInstances = computed(() =>
  instances.value.filter((i) => getTool(i.toolId)?.category === 'account'),
)

export const mailInstances = computed(() =>
  instances.value.filter((i) => getTool(i.toolId)?.category === 'mail'),
)

export const activeAccount = computed<ToolInstance | null>(
  () => instances.value.find((i) => i.id === activeAccountId.value) || null,
)

export const activeMail = computed<ToolInstance | null>(
  () => instances.value.find((i) => i.id === activeMailId.value) || null,
)

// ============================================================
// 命令
// ============================================================

export function createInstance(toolId: string, name?: string): ToolInstance | null {
  const tool = getTool(toolId)
  if (!tool) return null
  const inst: ToolInstance = {
    id: newId(toolId),
    toolId,
    name: name || tool.name,
    config: { ...(tool.defaults || {}) } as Record<string, unknown>,
    enabled: true,
  }
  instances.value.push(inst)
  if (tool.category === 'account' && !activeAccountId.value) activeAccountId.value = inst.id
  if (tool.category === 'mail' && !activeMailId.value) activeMailId.value = inst.id
  return inst
}

export function updateInstance(id: string, patch: Partial<ToolInstance>): void {
  const idx = instances.value.findIndex((i) => i.id === id)
  if (idx < 0) return
  instances.value[idx] = { ...instances.value[idx], ...patch }
}

export function updateInstanceConfig(id: string, patch: Record<string, unknown>): void {
  const idx = instances.value.findIndex((i) => i.id === id)
  if (idx < 0) return
  instances.value[idx] = {
    ...instances.value[idx],
    config: { ...instances.value[idx].config, ...patch },
  }
}

export function setInstanceState(id: string, patch: NonNullable<ToolInstance['state']>): void {
  const idx = instances.value.findIndex((i) => i.id === id)
  if (idx < 0) return
  instances.value[idx] = {
    ...instances.value[idx],
    state: { ...instances.value[idx].state, ...patch },
  }
}

export function removeInstance(id: string): void {
  const target = instances.value.find((i) => i.id === id)
  instances.value = instances.value.filter((i) => i.id !== id)
  if (!target) return
  const cat = getTool(target.toolId)?.category
  if (cat === 'account' && activeAccountId.value === id) {
    activeAccountId.value = accountInstances.value[0]?.id || ''
  }
  if (cat === 'mail' && activeMailId.value === id) {
    activeMailId.value = mailInstances.value[0]?.id || ''
  }
}

export function activate(id: string): void {
  const inst = instances.value.find((i) => i.id === id)
  if (!inst) return
  const cat = getTool(inst.toolId)?.category
  if (cat === 'account') activeAccountId.value = id
  if (cat === 'mail') activeMailId.value = id
}

export function replaceAll(list: ToolInstance[]): void {
  instances.value = [...list]
  if (!instances.value.some((i) => i.id === activeAccountId.value)) {
    activeAccountId.value = accountInstances.value[0]?.id || ''
  }
  if (!instances.value.some((i) => i.id === activeMailId.value)) {
    activeMailId.value = mailInstances.value[0]?.id || ''
  }
}
