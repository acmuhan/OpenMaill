<script setup lang="ts">
import { computed } from 'vue'
import { route, sidebarCollapsed, navigate, toggleSidebar, type RouteName } from '@/stores/ui.store'
import {
  accountInstances,
  mailInstances,
  activeAccountId,
  activeMailId,
  activeAccount,
  activeMail,
} from '@/stores/providers.store'
import { getTool } from '@/tools'
import { BaseSelect } from '@/components/ui'

interface NavItem {
  id: RouteName
  label: string
  icon: string
  badge?: () => string | number | null
}

const items: NavItem[] = [
  {
    id: 'dashboard',
    label: '仪表盘',
    icon: 'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z',
  },
  {
    id: 'accounts',
    label: '账号工具',
    icon: 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z',
  },
  {
    id: 'mail',
    label: '邮件读取',
    icon: 'M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75',
  },
  {
    id: 'providers',
    label: '供应商',
    icon: 'M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0 4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0-5.571 3-5.571-3',
    badge: () => accountInstances.value.length + mailInstances.value.length,
  },
  {
    id: 'settings',
    label: '设置 / 备份',
    icon: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28Z',
  },
]

const accountToolName = computed(() => (activeAccount.value ? getTool(activeAccount.value.toolId)?.name : ''))
const mailToolName = computed(() => (activeMail.value ? getTool(activeMail.value.toolId)?.name : ''))
</script>

<template>
  <aside
    :class="[
      'flex flex-col gap-4 transition-all duration-300 ease-out',
      sidebarCollapsed ? 'w-[72px]' : 'w-[248px]',
    ]"
  >
    <div
      class="flex-1 flex flex-col gap-2 rounded-lg bg-surface-container-lowest/85 backdrop-blur-md shadow-[0_8px_32px_rgba(15,23,42,0.06)] p-3 sticky top-6"
    >
      <!-- Logo -->
      <div class="flex items-center gap-3 px-2 py-3" :class="sidebarCollapsed && 'justify-center'">
        <div
          class="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-[0_8px_24px_rgba(0,61,155,0.32)] shrink-0"
        >
          <svg class="w-5 h-5 text-on-primary" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
        </div>
        <Transition name="fade">
          <div v-if="!sidebarCollapsed" class="flex flex-col leading-none">
            <span class="text-base font-bold text-on-surface tracking-tight">OpenMail</span>
            <span class="text-[10px] text-on-surface-variant/70 tracking-wider uppercase mt-1">Multi-Tool Suite</span>
          </div>
        </Transition>
      </div>

      <div class="h-px bg-outline-variant/30 mx-2" />

      <!-- 导航 -->
      <nav class="flex flex-col gap-1 pt-2">
        <button
          v-for="item in items"
          :key="item.id"
          @click="navigate(item.id)"
          :class="[
            'group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
            sidebarCollapsed && 'justify-center px-2',
            route === item.id
              ? 'bg-primary text-on-primary shadow-[0_4px_16px_rgba(0,61,155,0.28)]'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
          ]"
          :title="sidebarCollapsed ? item.label : ''"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
          </svg>
          <Transition name="fade">
            <span v-if="!sidebarCollapsed" class="flex-1 text-left truncate">{{ item.label }}</span>
          </Transition>
          <Transition name="fade">
            <span
              v-if="!sidebarCollapsed && item.badge && item.badge()"
              :class="[
                'text-[10px] font-bold px-2 py-0.5 rounded-full',
                route === item.id ? 'bg-white/25 text-on-primary' : 'bg-primary-fixed text-on-primary-fixed',
              ]"
            >
              {{ item.badge() }}
            </span>
          </Transition>
        </button>
      </nav>

      <div class="flex-1" />

      <!-- 当前实例切换器（侧边栏底部，展开时显示） -->
      <Transition name="fade">
        <div v-if="!sidebarCollapsed" class="flex flex-col gap-2 px-1">
          <div class="text-[10px] uppercase tracking-wider text-on-surface-variant/60 font-semibold px-2 pt-2">
            当前实例
          </div>

          <!-- 账号源 -->
          <div class="group relative">
            <BaseSelect
              v-if="accountInstances.length"
              v-model="activeAccountId"
              :options="accountInstances.map(i => ({ label: `${i.name}${!i.enabled ? ' (已禁用)' : ''}`, value: i.id }))"
              size="sm"
              :title="`账号源：${activeAccount?.name || ''}`"
            />
            <button
              v-else
              @click="navigate('providers')"
              class="w-full text-left bg-surface-container-low/40 hover:bg-surface-container rounded-2xl px-3 py-2 text-xs text-on-surface-variant/70"
            >
              + 添加账号源
            </button>
          </div>

          <!-- 邮箱协议 -->
          <div class="group relative">
            <BaseSelect
              v-if="mailInstances.length"
              v-model="activeMailId"
              :options="mailInstances.map(i => ({ label: `${i.name}${!i.enabled ? ' (已禁用)' : ''}`, value: i.id }))"
              size="sm"
              :title="`邮箱协议：${activeMail?.name || ''}`"
            />
            <button
              v-else
              @click="navigate('providers')"
              class="w-full text-left bg-surface-container-low/40 hover:bg-surface-container rounded-2xl px-3 py-2 text-xs text-on-surface-variant/70"
            >
              + 添加邮箱协议
            </button>
          </div>

          <div class="text-[10px] text-on-surface-variant/60 px-2 pb-1 flex items-center gap-2">
            <span class="truncate">{{ accountToolName || '—' }} · {{ mailToolName || '—' }}</span>
          </div>
        </div>
      </Transition>

      <!-- 折叠时仅显示两个圆点指示 -->
      <Transition name="fade">
        <div v-if="sidebarCollapsed" class="flex flex-col items-center gap-2 py-2">
          <div
            class="w-2 h-2 rounded-full"
            :class="accountInstances.length ? 'bg-primary' : 'bg-outline-variant'"
            :title="`账号源：${activeAccount?.name || '未配置'}`"
          />
          <div
            class="w-2 h-2 rounded-full"
            :class="mailInstances.length ? 'bg-secondary' : 'bg-outline-variant'"
            :title="`邮箱：${activeMail?.name || '未配置'}`"
          />
        </div>
      </Transition>

      <!-- 折叠按钮 -->
      <button
        @click="toggleSidebar"
        class="w-full rounded-full hover:bg-surface-container py-2 flex items-center justify-center text-on-surface-variant transition-colors mt-1"
        :title="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'"
      >
        <svg
          class="w-4 h-4 transition-transform duration-300"
          :class="sidebarCollapsed ? 'rotate-180' : ''"
          fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 150ms ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
