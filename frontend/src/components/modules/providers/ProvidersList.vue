<script setup lang="ts">
import { computed, ref } from 'vue'
import { BaseCard, BaseButton, BaseChip, BaseField, BaseModal, BaseTabs, BaseSwitch } from '@/components/ui'
import {
  instances,
  activeAccountId,
  activeMailId,
  createInstance,
  updateInstance,
  updateInstanceConfig,
  removeInstance,
  setInstanceState,
} from '@/stores/providers.store'
import { getTool, getAccountTools, getMailTools } from '@/tools'
import type { ToolCategory, ToolInstance } from '@/tools'
import { api } from '@/api'
import { useToast } from '@/stores/toast.store'

const toast = useToast()
const expanded = ref<Record<string, boolean>>({})
const checking = ref<Record<string, boolean>>({})

const tab = ref<ToolCategory>('account')
const tabs = [
  { value: 'account' as ToolCategory, label: '账号源' },
  { value: 'mail' as ToolCategory, label: '邮箱协议' },
]

const filtered = computed<ToolInstance[]>(() =>
  instances.value.filter((i) => getTool(i.toolId)?.category === tab.value),
)

const toolPickerOpen = ref(false)
const toolPickerCategory = computed(() =>
  tab.value === 'account' ? getAccountTools() : getMailTools(),
)

function pickAndCreate(toolId: string) {
  const inst = createInstance(toolId)
  if (inst) {
    expanded.value[inst.id] = true
    toast.success(`已添加：${inst.name}`)
  }
  toolPickerOpen.value = false
}

function toggle(id: string) {
  expanded.value[id] = !expanded.value[id]
}

function activate(inst: ToolInstance) {
  const cat = getTool(inst.toolId)?.category
  if (cat === 'account') activeAccountId.value = inst.id
  if (cat === 'mail') activeMailId.value = inst.id
  toast.success(`已激活：${inst.name}`)
}

function remove(inst: ToolInstance) {
  if (filtered.value.length === 1) {
    toast.warn('至少保留 1 个实例')
    return
  }
  if (!confirm(`确定删除「${inst.name}」？此操作不可撤销。`)) return
  removeInstance(inst.id)
  toast.info('已删除')
}

async function checkBalance(inst: ToolInstance) {
  const cfg = inst.config as { base_url?: string; key?: string }
  if (!cfg.base_url || !cfg.key) {
    toast.error('请先填写地址与 Key')
    return
  }
  checking.value[inst.id] = true
  const d = await api.balance({ base_url: cfg.base_url, key: cfg.key })
  checking.value[inst.id] = false
  if (d.ok) {
    setInstanceState(inst.id, { balance: d.balance, lastUsedAt: Date.now() })
    toast.success(`${inst.name} 余额：${d.balance}`)
  } else {
    setInstanceState(inst.id, { lastError: d.error })
    toast.error(d.error || '查询失败')
  }
}

function isActive(inst: ToolInstance) {
  const cat = getTool(inst.toolId)?.category
  return (cat === 'account' && inst.id === activeAccountId.value) ||
         (cat === 'mail' && inst.id === activeMailId.value)
}

function badgeVariant(inst: ToolInstance) {
  const tool = getTool(inst.toolId)
  if (!tool) return 'neutral' as const
  if (!tool.available) return 'warning' as const
  return 'info' as const
}
</script>

<template>
  <BaseCard
    title="供应商管理"
    subtitle="统一管理账号源与邮箱协议实例。每条都是一个独立的 Tool 配置，可启用 / 禁用 / 切换。"
    elevation="soft"
  >
    <template #actions>
      <BaseButton variant="primary" size="sm" @click="toolPickerOpen = true">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        新增实例
      </BaseButton>
    </template>

    <div class="flex flex-col gap-5">
      <BaseTabs v-model="tab" :tabs="tabs" />

      <ul class="flex flex-col gap-3">
        <li
          v-for="inst in filtered"
          :key="inst.id"
          :class="[
            'rounded-2xl border transition-all',
            isActive(inst)
              ? 'border-primary/40 bg-primary-fixed/30 shadow-[0_8px_24px_rgba(0,61,155,0.08)]'
              : 'border-outline-variant/30 bg-surface-container-low/40 hover:bg-surface-container-low/70',
          ]"
        >
          <div class="flex items-center gap-3 p-4">
            <button
              class="shrink-0 w-9 h-9 rounded-full border border-outline-variant/40 flex items-center justify-center transition-colors"
              :class="isActive(inst) ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-lowest hover:bg-primary-fixed'"
              @click="activate(inst)"
              :title="isActive(inst) ? '当前激活' : '点击切换为激活'"
            >
              <svg v-if="isActive(inst)" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span v-else class="text-[10px] font-bold tracking-tight opacity-70">激活</span>
            </button>

            <div class="flex-1 min-w-0 flex flex-col gap-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm font-semibold text-on-surface truncate">{{ inst.name }}</span>
                <BaseChip :variant="badgeVariant(inst)" size="sm">
                  {{ getTool(inst.toolId)?.name || '未知' }}
                </BaseChip>
                <BaseChip v-if="!getTool(inst.toolId)?.available" variant="warning" size="sm">预留</BaseChip>
                <BaseChip v-if="!inst.enabled" variant="neutral" size="sm">已禁用</BaseChip>
                <BaseChip v-if="inst.state?.balance" variant="success" size="sm">余额 {{ inst.state.balance }}</BaseChip>
              </div>
              <span class="text-[11px] text-on-surface-variant/70 truncate">
                {{ getTool(inst.toolId)?.description }}
              </span>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <BaseButton
                v-if="getTool(inst.toolId)?.category === 'account'"
                variant="ghost"
                size="sm"
                :loading="checking[inst.id]"
                @click="checkBalance(inst)"
              >
                查余额
              </BaseButton>
              <BaseButton variant="ghost" size="sm" icon @click="toggle(inst.id)">
                <svg class="w-4 h-4 transition-transform" :class="expanded[inst.id] ? 'rotate-180' : ''" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </BaseButton>
            </div>
          </div>

          <Transition name="expand">
            <div v-if="expanded[inst.id]" class="px-4 pb-4 flex flex-col gap-4">
              <div class="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-outline-variant/20">
                <input
                  :value="inst.name"
                  @input="(e) => updateInstance(inst.id, { name: (e.target as HTMLInputElement).value })"
                  class="text-sm font-semibold text-on-surface bg-transparent border-b border-transparent focus:border-primary focus:outline-none px-1 py-1"
                  placeholder="实例名称"
                />
                <BaseSwitch
                  :model-value="inst.enabled"
                  label="启用"
                  size="sm"
                  @update:model-value="(v: boolean) => updateInstance(inst.id, { enabled: v })"
                />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  v-for="f in getTool(inst.toolId)?.fields || []"
                  :key="f.key"
                  :class="f.cols === 2 ? 'sm:col-span-2' : ''"
                >
                  <BaseField
                    :field="f"
                    :model-value="inst.config[f.key]"
                    @update:model-value="(v) => updateInstanceConfig(inst.id, { [f.key]: v })"
                  />
                </div>
              </div>

              <div class="flex justify-end">
                <BaseButton variant="danger" size="sm" @click="remove(inst)">删除实例</BaseButton>
              </div>
            </div>
          </Transition>
        </li>
      </ul>
    </div>
  </BaseCard>

  <!-- 选择 Tool 模态框 -->
  <BaseModal v-model="toolPickerOpen" title="选择要添加的 Tool" size="lg">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <button
        v-for="tool in toolPickerCategory"
        :key="tool.id"
        @click="pickAndCreate(tool.id)"
        class="text-left flex flex-col gap-2 p-5 rounded-2xl border border-outline-variant/40 hover:border-primary hover:bg-primary-fixed/30 transition-all"
      >
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-base font-semibold text-on-surface">{{ tool.name }}</span>
          <BaseChip :variant="tool.available ? 'success' : 'warning'" size="sm">
            {{ tool.available ? '可用' : '预留' }}
          </BaseChip>
        </div>
        <p class="text-xs text-on-surface-variant/80 leading-relaxed">{{ tool.description }}</p>
        <span v-if="tool.vendor" class="text-[10px] uppercase tracking-wider text-on-surface-variant/60">
          {{ tool.vendor }}
        </span>
      </button>
    </div>
  </BaseModal>
</template>

<style scoped>
.expand-enter-active, .expand-leave-active {
  transition: all 220ms ease;
  overflow: hidden;
}
.expand-enter-from, .expand-leave-to {
  max-height: 0;
  opacity: 0;
}
.expand-enter-to, .expand-leave-from {
  max-height: 800px;
  opacity: 1;
}
</style>
