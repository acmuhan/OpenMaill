import { ref, watch } from 'vue'
import { loadJson, saveJson } from './storage'

const KEY = 'ui.v2'

export type RouteName = 'dashboard' | 'accounts' | 'mail' | 'providers' | 'settings'

interface UiState {
  sidebarCollapsed: boolean
  route: RouteName
  theme: 'light' | 'auto'
}

const DEFAULT: UiState = {
  sidebarCollapsed: false,
  route: 'dashboard',
  theme: 'light',
}

const saved = loadJson<Partial<UiState>>(KEY, {})

export const sidebarCollapsed = ref<boolean>(saved.sidebarCollapsed ?? DEFAULT.sidebarCollapsed)
export const route = ref<RouteName>(saved.route ?? DEFAULT.route)
export const theme = ref<'light' | 'auto'>(saved.theme ?? DEFAULT.theme)

// 自动持久化
watch([sidebarCollapsed, route, theme], () => {
  saveJson(KEY, {
    sidebarCollapsed: sidebarCollapsed.value,
    route: route.value,
    theme: theme.value,
  })
})

// hash 路由同步
function readHash(): RouteName {
  const raw = (window.location.hash || '#/dashboard').replace(/^#\/?/, '')
  const allowed: RouteName[] = ['dashboard', 'accounts', 'mail', 'providers', 'settings']
  return (allowed as string[]).includes(raw) ? (raw as RouteName) : 'dashboard'
}

export function initRouter(): void {
  // 优先以 hash 为准
  const fromHash = readHash()
  if (fromHash !== route.value) route.value = fromHash

  watch(route, (r) => {
    const want = `#/${r}`
    if (window.location.hash !== want) window.location.hash = want
  }, { immediate: true })

  window.addEventListener('hashchange', () => {
    const r = readHash()
    if (r !== route.value) route.value = r
  })
}

export function navigate(r: RouteName): void {
  route.value = r
}

export function toggleSidebar(): void {
  sidebarCollapsed.value = !sidebarCollapsed.value
}
