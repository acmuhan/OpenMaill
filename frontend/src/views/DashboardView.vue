<script setup lang="ts">
import { computed } from 'vue'
import { BaseCard, BaseButton, BaseChip } from '@/components/ui'
import WorkflowToolbar from '@/components/modules/workflow/WorkflowToolbar.vue'
import { navigate } from '@/stores/ui.store'
import { activeAccount, activeMail, mailInstances, accountInstances } from '@/stores/providers.store'
import { emails, tokenState } from '@/stores/mail.store'
import { getTool } from '@/tools'

const quickStats = computed(() => [
  {
    label: '账号源',
    value: accountInstances.value.length,
    hint: activeAccount.value?.name || '未配置',
    icon: 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z',
    route: 'accounts' as const,
  },
  {
    label: '邮箱协议',
    value: mailInstances.value.length,
    hint: activeMail.value?.name || '未配置',
    icon: 'M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75',
    route: 'mail' as const,
  },
  {
    label: '收件箱',
    value: emails.value.length,
    hint: tokenState.value === 'ready' ? 'Token 已就绪' : 'Token 未就绪',
    icon: 'M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859',
    route: 'mail' as const,
  },
])

const availableTools = computed(() => {
  const all = [...accountInstances.value, ...mailInstances.value]
  return all
    .map((i) => ({ inst: i, tool: getTool(i.toolId) }))
    .filter((x) => x.tool)
})
</script>

<template>
  <!-- 工作流工具栏 -->
  <WorkflowToolbar />

  <!-- 统计卡片 -->
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <button
      v-for="s in quickStats"
      :key="s.label"
      @click="navigate(s.route)"
      class="text-left rounded-md bg-surface-container-lowest p-5 sm:p-6 shadow-[0_4px_24px_rgba(15,23,42,0.04)] hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 transition-all flex flex-col gap-3"
    >
      <div class="flex items-center justify-between">
        <span class="text-xs uppercase tracking-wider text-on-surface-variant/70 font-semibold">{{ s.label }}</span>
        <div class="w-10 h-10 rounded-full bg-primary-fixed/60 text-primary flex items-center justify-center">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" :d="s.icon" />
          </svg>
        </div>
      </div>
      <div class="flex items-baseline gap-2">
        <span class="text-4xl font-bold text-on-surface tabular-nums">{{ s.value }}</span>
      </div>
      <span class="text-xs text-on-surface-variant/70 truncate">{{ s.hint }}</span>
    </button>
  </div>

  <!-- 已注册工具 -->
  <BaseCard title="已注册工具" subtitle="所有 Tool 实例一览，点击对应卡片快速跳转" elevation="soft">
    <template #actions>
      <BaseButton variant="ghost" size="sm" @click="navigate('providers')">前往管理 →</BaseButton>
    </template>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <button
        v-for="x in availableTools"
        :key="x.inst.id"
        @click="navigate(x.tool!.category === 'account' ? 'accounts' : 'mail')"
        class="text-left flex items-start gap-3 p-4 rounded-2xl bg-surface-container-low/50 hover:bg-primary-fixed/30 transition-colors"
      >
        <div class="w-10 h-10 rounded-2xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-[0_4px_16px_rgba(0,61,155,0.2)]">
          <svg v-if="x.tool!.category === 'account'" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75" />
          </svg>
        </div>
        <div class="flex-1 min-w-0 flex flex-col gap-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-sm font-semibold text-on-surface truncate">{{ x.inst.name }}</span>
            <BaseChip :variant="x.tool!.available ? 'success' : 'warning'" size="sm">
              {{ x.tool!.available ? '可用' : '预留' }}
            </BaseChip>
            <BaseChip v-if="!x.inst.enabled" variant="neutral" size="sm">已禁用</BaseChip>
          </div>
          <p class="text-xs text-on-surface-variant/70 truncate">{{ x.tool!.description }}</p>
        </div>
      </button>
    </div>
  </BaseCard>
</template>
