import type { ToolDefinition } from './types'
import { zhanghaoyaTool } from './account/zhanghaoya'
import { customAccountTool } from './account/custom'
import { outlookTool } from './mail/outlook'
import { gmailTool } from './mail/gmail'
import { imapTool } from './mail/imap'

/**
 * Tool 注册表 — 单一可信来源。
 * 各 Tool 内部使用具体的 Config 泛型；注册表统一存储为擦除泛型的形式。
 */
const _registry: ToolDefinition[] = [
  zhanghaoyaTool as unknown as ToolDefinition,
  customAccountTool as unknown as ToolDefinition,
  outlookTool as unknown as ToolDefinition,
  gmailTool as unknown as ToolDefinition,
  imapTool as unknown as ToolDefinition,
]

export const ALL_TOOLS: readonly ToolDefinition[] = Object.freeze([..._registry])

export function getTool(id: string): ToolDefinition | undefined {
  return _registry.find((t) => t.id === id)
}

export function getAccountTools(): ToolDefinition[] {
  return _registry.filter((t) => t.category === 'account')
}

export function getMailTools(): ToolDefinition[] {
  return _registry.filter((t) => t.category === 'mail')
}

export function isToolAvailable(id: string): boolean {
  return !!getTool(id)?.available
}
