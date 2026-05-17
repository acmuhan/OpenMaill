import { ref, watch } from 'vue'
import { loadJson, saveJson } from './storage'

const KEY = 'ui.v2'

export type RouteName = 'dashboard' | 'accounts' | 'mail' | 'providers' | 'settings'

interface UiState {
  sidebarCollapsed: boolean
  route: RouteName
  theme: 'light' | 'dark' | 'auto'
  accent: string
}

const DEFAULT: UiState = {
  sidebarCollapsed: false,
  route: 'dashboard',
  theme: 'light',
  accent: '#003d9b',
}

const saved = loadJson<Partial<UiState>>(KEY, {})

export const sidebarCollapsed = ref<boolean>(saved.sidebarCollapsed ?? DEFAULT.sidebarCollapsed)
export const route = ref<RouteName>(saved.route ?? DEFAULT.route)
export const theme = ref<'light' | 'dark' | 'auto'>(saved.theme ?? DEFAULT.theme)
export const accent = ref<string>(saved.accent ?? DEFAULT.accent)

function clampHex(value: string): string {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : DEFAULT.accent
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = clampHex(hex).slice(1)
  return [
    Number.parseInt(clean.slice(0, 2), 16),
    Number.parseInt(clean.slice(2, 4), 16),
    Number.parseInt(clean.slice(4, 6), 16),
  ]
}

function mix(hex: string, target: [number, number, number], amount: number): string {
  const [r, g, b] = hexToRgb(hex)
  const out = [r, g, b].map((v, i) => Math.round(v + (target[i] - v) * amount))
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

export function applyAppearance(): void {
  const root = document.documentElement
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  const actualTheme = theme.value === 'auto' ? (prefersDark ? 'dark' : 'light') : theme.value
  const primary = clampHex(accent.value)

  root.dataset.theme = actualTheme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', primary)
  root.style.setProperty('--color-primary', primary)
  root.style.setProperty('--color-primary-container', mix(primary, [0, 0, 0], 0.15))
  root.style.setProperty('--color-primary-fixed', mix(primary, [255, 255, 255], actualTheme === 'dark' ? 0.78 : 0.86))
  root.style.setProperty('--color-primary-fixed-dim', mix(primary, [255, 255, 255], actualTheme === 'dark' ? 0.65 : 0.72))
  root.style.setProperty('--color-on-primary-fixed', actualTheme === 'dark' ? '#061224' : '#071934')
  root.style.setProperty('--color-on-primary-fixed-variant', primary)
}

// 自动持久化
watch([sidebarCollapsed, route, theme, accent], () => {
  saveJson(KEY, {
    sidebarCollapsed: sidebarCollapsed.value,
    route: route.value,
    theme: theme.value,
    accent: accent.value,
  })
  applyAppearance()
}, { immediate: true })

if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (theme.value === 'auto') applyAppearance()
  })
}

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
