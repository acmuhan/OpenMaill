import type { ToolDefinition } from '../types'

export interface CustomAccountConfig extends Record<string, unknown> {
  base_url: string
  key: string
}

/**
 * 通用账号鸭兼容协议工具：任何遵循 base_url + key 协议的卡商都可使用。
 */
export const customAccountTool: ToolDefinition<CustomAccountConfig> = {
  id: 'custom-account',
  name: '自定义账号 API',
  description: '兼容账号鸭协议（POST /store/ga/account 等）的任意第三方接口。',
  category: 'account',
  available: true,
  badge: 'stable',
  icon: 'plug',
  fields: [
    {
      key: 'base_url',
      label: 'API 服务器',
      type: 'url',
      required: true,
      placeholder: 'https://provider.example.com',
      cols: 1,
    },
    {
      key: 'key',
      label: 'API Key',
      type: 'password',
      required: true,
      mask: true,
      cols: 1,
    },
  ],
  defaults: { base_url: '', key: '' },
  validate(c) {
    if (!c.base_url) return '请填写 API 服务器地址'
    if (!c.key) return '请填写 API Key'
    return null
  },
  actions: {
    balance: { id: 'balance', name: '查询余额', endpoint: '/api/balance' },
    accounts: { id: 'accounts', name: '获取账号', endpoint: '/api/accounts' },
    history: { id: 'history', name: '历史记录', endpoint: '/api/history' },
  },
}
