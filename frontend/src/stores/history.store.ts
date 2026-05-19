import { computed, ref, watch } from 'vue'
import { getTool } from '@/tools'
import { loadJson, newId, saveJson } from './storage'

const KEY_HISTORY = 'activity.history.v1'
const MAX_PER_TOOL = 12

export type HistoryCategory = 'account' | 'mail'
export type HistoryStatus = 'success' | 'error' | 'info'

export interface ActivityHistoryItem {
  id: string
  toolId: string
  toolName: string
  category: HistoryCategory
  instanceId?: string
  instanceName?: string
  action: string
  summary: string
  detail?: string
  status: HistoryStatus
  createdAt: number
}

export interface ActivityHistoryGroup {
  toolId: string
  toolName: string
  category: HistoryCategory
  items: ActivityHistoryItem[]
}

export const activityHistory = ref<ActivityHistoryItem[]>(loadJson<ActivityHistoryItem[]>(KEY_HISTORY, []))

watch(activityHistory, (value) => saveJson(KEY_HISTORY, value), { deep: true })

export const groupedActivityHistory = computed<ActivityHistoryGroup[]>(() => {
  const groups = new Map<string, ActivityHistoryGroup>()
  for (const item of activityHistory.value) {
    const group = groups.get(item.toolId) || {
      toolId: item.toolId,
      toolName: item.toolName,
      category: item.category,
      items: [],
    }
    group.items.push(item)
    groups.set(item.toolId, group)
  }
  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      items: group.items.sort((a, b) => b.createdAt - a.createdAt).slice(0, MAX_PER_TOOL),
    }))
    .sort((a, b) => (b.items[0]?.createdAt || 0) - (a.items[0]?.createdAt || 0))
})

export function addActivityHistory(input: {
  toolId: string
  instanceId?: string
  instanceName?: string
  action: string
  summary: string
  detail?: string
  status?: HistoryStatus
}): void {
  const tool = getTool(input.toolId)
  const category = tool?.category === 'mail' ? 'mail' : 'account'
  const item: ActivityHistoryItem = {
    id: newId('hist'),
    toolId: input.toolId,
    toolName: tool?.name || input.toolId,
    category,
    instanceId: input.instanceId,
    instanceName: input.instanceName,
    action: input.action,
    summary: input.summary,
    detail: input.detail,
    status: input.status || 'success',
    createdAt: Date.now(),
  }

  const next = [item, ...activityHistory.value]
  const counts = new Map<string, number>()
  activityHistory.value = next.filter((entry) => {
    const count = counts.get(entry.toolId) || 0
    if (count >= MAX_PER_TOOL) return false
    counts.set(entry.toolId, count + 1)
    return true
  })
}

export function clearActivityHistory(toolId?: string): void {
  if (!toolId) {
    activityHistory.value = []
    return
  }
  activityHistory.value = activityHistory.value.filter((item) => item.toolId !== toolId)
}
