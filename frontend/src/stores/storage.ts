/**
 * 简易持久化 helper — 浏览器 localStorage。
 * 所有 store 共用同一个 key 命名空间。
 */
const NS = 'openmail'

export function storageKey(name: string): string {
  return `${NS}.${name}`
}

export function loadJson<T>(name: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(storageKey(name))
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function saveJson(name: string, value: unknown): void {
  try {
    localStorage.setItem(storageKey(name), JSON.stringify(value))
  } catch {
    // quota exceeded or disabled — ignore
  }
}

export function removeKey(name: string): void {
  try {
    localStorage.removeItem(storageKey(name))
  } catch {
    // ignore
  }
}

export function newId(prefix = 'i'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}
