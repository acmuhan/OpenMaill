<script setup lang="ts">
import { computed } from 'vue'
import { BaseCard, BaseButton, BaseChip, BaseIcon } from '@/components/ui'
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
    iconName: 'account',
    route: 'accounts' as const,
  },
  {
    label: '邮箱协议',
    value: mailInstances.value.length,
    hint: activeMail.value?.name || '未配置',
    iconName: 'mail',
    route: 'mail' as const,
  },
  {
    label: '收件箱',
    value: emails.value.length,
    hint: tokenState.value === 'ready' ? 'Token 已就绪' : 'Token 未就绪',
    iconName: 'inbox',
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
          <BaseIcon :name="s.iconName" size="sm" />
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
          <BaseIcon :name="x.tool!.category === 'account' ? 'account' : 'mail'" size="sm" />
        </div>
        <div class="flex-1 min-w-0 flex flex-col gap-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-sm font-semibold text-on-surface truncate">{{ x.inst.name }}</span>
            <BaseChip :variant="x.tool!.available ? 'success' : 'warning'" size="sm">
              {{ x.tool!.available ? '可用' : '未启用' }}
            </BaseChip>
            <BaseChip v-if="!x.inst.enabled" variant="neutral" size="sm">已禁用</BaseChip>
          </div>
          <p class="text-xs text-on-surface-variant/70 truncate">{{ x.tool!.description }}</p>
        </div>
      </button>
    </div>
  </BaseCard>
</template>
