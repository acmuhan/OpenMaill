import { api } from '@/api'
import { setInstanceState } from '@/stores/providers.store'
import type { ToolInstance } from '@/tools'
import { getTool } from '@/tools'

export interface AccountConfig {
  base_url: string
  key: string
}

function asCfg(inst: ToolInstance): AccountConfig | null {
  const cfg = inst.config as Partial<AccountConfig>
  if (!cfg.base_url || !cfg.key) return null
  return { base_url: cfg.base_url, key: cfg.key }
}

function ensureUsable(inst: ToolInstance | null): { ok: false; error: string } | { ok: true; cfg: AccountConfig } {
  if (!inst) return { ok: false, error: '尚未配置账号 API' }
  if (!inst.enabled) return { ok: false, error: `供应商「${inst.name}」已禁用` }
  const tool = getTool(inst.toolId)
  if (!tool) return { ok: false, error: '未知的供应商类型' }
  const validate = tool.validate
  if (validate) {
    const err = validate(inst.config)
    if (err) return { ok: false, error: err }
  }
  const cfg = asCfg(inst)
  if (!cfg) return { ok: false, error: '当前供应商配置不完整' }
  return { ok: true, cfg }
}

export const accountService = {
  async balance(inst: ToolInstance) {
    const guard = ensureUsable(inst)
    if (!guard.ok) return { ok: false as const, error: guard.error }
    const r = await api.balance(guard.cfg)
    if (r.ok) {
      setInstanceState(inst.id, { balance: r.balance, lastUsedAt: Date.now() })
      return { ok: true as const, balance: r.balance }
    }
    setInstanceState(inst.id, { lastError: r.error })
    return { ok: false as const, error: r.error || '查询失败' }
  },

  async accounts(inst: ToolInstance, type: string, quantity: number) {
    const guard = ensureUsable(inst)
    if (!guard.ok) return { ok: false as const, error: guard.error }
    const r = await api.accounts(guard.cfg, type, quantity)
    if (r.ok) {
      setInstanceState(inst.id, { lastUsedAt: Date.now() })
      return { ok: true as const, accounts: r.accounts }
    }
    return { ok: false as const, error: r.error || '获取账号失败' }
  },

  async history(inst: ToolInstance, type: string) {
    const guard = ensureUsable(inst)
    if (!guard.ok) return { ok: false as const, error: guard.error }
    const r = await api.history(guard.cfg, type)
    if (r.ok) {
      setInstanceState(inst.id, { lastUsedAt: Date.now() })
      return { ok: true as const, raw: r.data }
    }
    return { ok: false as const, error: r.error || '查询失败' }
  },
}
