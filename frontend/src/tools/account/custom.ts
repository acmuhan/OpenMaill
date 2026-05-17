import type { ToolDefinition } from '../types'

export interface CustomAccountConfig extends Record<string, unknown> {
  base_url: string
  key: string
  balance_path: string
  account_path: string
  history_path: string
  key_param: string
  type_param: string
  quantity_param: string
  response_code_key: string
  success_code: string
  response_data_key: string
  response_message_key: string
  account_separator: string
}

/**
 * 可配置账号 API 适配器：不同卡商路径、参数名、响应字段不一致时在这里配置。
 */
export const customAccountTool: ToolDefinition<CustomAccountConfig> = {
  id: 'custom-account',
  name: '自定义账号 API',
  description: '可配置路径、参数名和响应字段，用于适配不同第三方卡商 API。',
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
    { key: 'balance_path', label: '余额路径', type: 'text', required: true, default: '/store/ga/balance', cols: 1 },
    { key: 'account_path', label: '账号路径', type: 'text', required: true, default: '/store/ga/account', cols: 1 },
    { key: 'history_path', label: '历史路径', type: 'text', required: true, default: '/store/ga/history', cols: 1 },
    { key: 'key_param', label: 'Key 参数名', type: 'text', required: true, default: 'key', cols: 1 },
    { key: 'type_param', label: '类型参数名', type: 'text', required: true, default: 'type', cols: 1 },
    { key: 'quantity_param', label: '数量参数名', type: 'text', required: true, default: 'quantity', cols: 1 },
    { key: 'response_code_key', label: '状态码字段', type: 'text', required: true, default: 'Code', cols: 1 },
    { key: 'success_code', label: '成功状态码', type: 'text', required: true, default: '200', cols: 1 },
    { key: 'response_data_key', label: '数据字段', type: 'text', required: true, default: 'Data', cols: 1 },
    { key: 'response_message_key', label: '消息字段', type: 'text', required: true, default: 'Message', cols: 1 },
    { key: 'account_separator', label: '账号分隔符', type: 'text', required: true, default: ':', cols: 1, help: '支持 :，历史内容仍兼容 ----' },
  ],
  defaults: {
    base_url: '',
    key: '',
    balance_path: '/store/ga/balance',
    account_path: '/store/ga/account',
    history_path: '/store/ga/history',
    key_param: 'key',
    type_param: 'type',
    quantity_param: 'quantity',
    response_code_key: 'Code',
    success_code: '200',
    response_data_key: 'Data',
    response_message_key: 'Message',
    account_separator: ':',
  },
  validate(c) {
    if (!c.base_url) return '请填写 API 服务器地址'
    if (!c.key) return '请填写 API Key'
    if (!c.account_path || !c.balance_path || !c.history_path) return '请补全接口路径'
    return null
  },
  actions: {
    balance: { id: 'balance', name: '查询余额', endpoint: '/api/balance' },
    accounts: { id: 'accounts', name: '获取账号', endpoint: '/api/accounts' },
    history: { id: 'history', name: '历史记录', endpoint: '/api/history' },
  },
}
