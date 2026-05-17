/**
 * Tool 抽象：所有外部接入（账号源 / 邮件协议）都注册为 Tool。
 * UI 通过 fields 自动渲染配置表单，action 通过 services 调用。
 */

export type ToolCategory = 'account' | 'mail' | 'utility'

export type ToolFieldType =
  | 'text'
  | 'password'
  | 'url'
  | 'email'
  | 'number'
  | 'select'
  | 'textarea'
  | 'switch'

export interface ToolFieldOption {
  label: string
  value: string
}

export interface ToolField {
  key: string
  label: string
  type: ToolFieldType
  placeholder?: string
  required?: boolean
  help?: string
  options?: ToolFieldOption[]
  default?: unknown
  mask?: boolean
  cols?: 1 | 2 // 表单栅格占位
  rows?: number // textarea 行数
}

export interface ToolActionMeta {
  id: string
  name: string
  description?: string
  endpoint?: string
}

export interface ToolMeta {
  id: string
  name: string
  vendor?: string
  homepage?: string
  description: string
  category: ToolCategory
  available: boolean
  badge?: 'preview' | 'beta' | 'stable'
  /** lucide / hero 图标名，UI 自行映射 */
  icon?: string
  primaryColor?: string
}

export interface ToolDefinition<C extends Record<string, unknown> = Record<string, unknown>> extends ToolMeta {
  fields: ToolField[]
  defaults?: Partial<C>
  /** 返回错误描述，null 表示通过 */
  validate?: (config: C) => string | null
  actions?: Record<string, ToolActionMeta>
}

export interface ToolInstance<C extends Record<string, unknown> = Record<string, unknown>> {
  /** 实例 ID（用户多账号 / 多卡商时区分） */
  id: string
  /** 引用的 Tool 定义 ID */
  toolId: string
  /** 用户自定义名称（如 "账号鸭主号"） */
  name: string
  config: C
  enabled: boolean
  /** 最近一次状态（余额、最后调用时间等） */
  state?: {
    balance?: string
    lastUsedAt?: number
    lastError?: string
  }
}
