import type { ToolDefinition } from '../types'

export interface ZhanghaoyaConfig extends Record<string, unknown> {
  base_url: string
  key: string
}

export const zhanghaoyaTool: ToolDefinition<ZhanghaoyaConfig> = {
  id: 'zhanghaoya',
  name: '第三方账号 API',
  vendor: 'zhanghaoya.com',
  homepage: 'https://www.zhanghaoya.com',
  description: '当前接入的第三方账号接口，可批量提取 Hotmail / Outlook 账号，并支持历史导出与 Token 解析。',
  category: 'account',
  available: true,
  badge: 'stable',
  icon: 'duck',
  primaryColor: '#003d9b',
  fields: [
    {
      key: 'base_url',
      label: 'API 服务器',
      type: 'url',
      required: true,
      placeholder: 'https://www.zhanghaoya.com',
      default: 'https://www.zhanghaoya.com',
      cols: 1,
    },
    {
      key: 'key',
      label: 'API Key',
      type: 'password',
      required: true,
      placeholder: '在第三方账号 API 后台获取',
      mask: true,
      cols: 1,
      help: '第三方账号 API 后台 → API 接入 → 获取 Key',
    },
  ],
  defaults: {
    base_url: 'https://www.zhanghaoya.com',
    key: '',
  },
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
