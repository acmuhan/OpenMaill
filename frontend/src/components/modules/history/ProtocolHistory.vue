<script setup lang="ts">
import { computed } from 'vue'
import { BaseButton, BaseCard, BaseChip, BaseEmpty, BaseIcon } from '@/components/ui'
import { clearActivityHistory, groupedActivityHistory, type ActivityHistoryItem } from '@/stores/history.store'

const total = computed(() => groupedActivityHistory.value.reduce((sum, group) => sum + group.items.length, 0))

function formatTime(ts: number): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(ts)
}

function statusVariant(item: ActivityHistoryItem): 'success' | 'warning' | 'error' | 'neutral' {
  if (item.status === 'success') return 'success'
  if (item.status === 'error') return 'error'
  return 'neutral'
}
</script>

<template>
  <BaseCard title="本地历史" subtitle="按协议分类保存最近登录与获取记录，只保留本机摘要" elevation="soft">
    <template #actions>
      <BaseButton v-if="total" variant="ghost" size="sm" @click="clearActivityHistory()">清空</BaseButton>
    </template>

    <BaseEmpty
      v-if="!groupedActivityHistory.length"
      title="暂无历史"
      description="获取 Token、读取邮件或获取账号后会自动记录到本机"
      icon="inbox"
      variant="subtle"
    />

    <div v-else class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <section
        v-for="group in groupedActivityHistory"
        :key="group.toolId"
        class="rounded-md border border-outline-variant/35 bg-surface-container-low/45 p-4 flex flex-col gap-3 min-w-0"
      >
        <header class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <div
              class="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-[0_4px_14px_rgba(15,23,42,0.08)]"
              :class="group.category === 'mail' ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-primary-fixed text-on-primary-fixed'"
            >
              <BaseIcon :name="group.category === 'mail' ? 'mail' : 'account'" size="sm" />
            </div>
            <div class="min-w-0">
              <h3 class="text-sm font-semibold text-on-surface truncate">{{ group.toolName }}</h3>
              <p class="text-xs text-on-surface-variant/70">{{ group.items.length }} 条本地记录</p>
            </div>
          </div>
          <BaseButton variant="ghost" size="sm" @click="clearActivityHistory(group.toolId)">清除</BaseButton>
        </header>

        <ol class="flex flex-col gap-2">
          <li
            v-for="item in group.items"
            :key="item.id"
            class="rounded-2xl bg-surface-container-lowest/80 border border-outline-variant/25 px-3 py-3 flex items-start gap-3"
          >
            <div class="w-1.5 self-stretch rounded-full" :class="item.status === 'error' ? 'bg-error' : 'bg-primary'" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm font-semibold text-on-surface truncate">{{ item.action }}</span>
                <BaseChip :variant="statusVariant(item)" size="sm">{{ item.status === 'success' ? '成功' : item.status === 'error' ? '失败' : '信息' }}</BaseChip>
                <span class="text-[11px] text-on-surface-variant/60 tabular-nums">{{ formatTime(item.createdAt) }}</span>
              </div>
              <p class="text-xs text-on-surface-variant/80 mt-1 truncate">{{ item.summary }}</p>
              <p v-if="item.detail" class="text-[11px] text-on-surface-variant/60 mt-1 truncate">{{ item.detail }}</p>
            </div>
          </li>
        </ol>
      </section>
    </div>
  </BaseCard>
</template>
