/**
 * Mail body helpers:
 *  - extractOtp: local heuristic + multi-regex OTP extraction
 *  - extractLinks: body URL detection
 *  - normalizeMailText / stripHtml: safe text extraction for scoring and display
 *  - sanitizeHtml: sandbox iframe HTML wrapper
 */

export interface OtpScoreBreakdown {
  base: number
  bonuses: string[]
  penalties: string[]
  final: number
}

export interface OtpHit {
  code: string
  /** Context snippet around the first useful occurrence. */
  context: string
  /** Match source. Existing UI only relies on the string value. */
  source: 'keyword' | 'structured' | 'pattern' | 'heuristic' | 'semantic'
  confidence: number
  reason: string
  scoreBreakdown: OtpScoreBreakdown
}

export interface OtpExtractInput {
  body: string
  subject?: string
  from?: string
  date?: string
}

export interface OtpExtractOptions {
  semanticHints?: string[]
}

interface PatternSpec {
  source: OtpHit['source']
  base: number
  re: RegExp
}

interface Candidate {
  rawCode: string
  index: number
  source: OtpHit['source']
  base: number
}

const MAX_TEXT_LENGTH = 20_000
const CONTEXT_RADIUS = 72
const MIN_DISPLAY_CONFIDENCE = 0.55
const HIGH_CONFIDENCE = 0.78

const OTP_KEYWORD_SCAN_RE =
  /验证码|驗證碼|动态码|動態碼|校验码|校驗碼|安全码|安全碼|一次性(?:代码|代碼|密码|密碼)|verification\s*code|security\s*code|one[-\s]?time\s*(?:password|code)|otp|login\s*code|sign[-\s]?in\s*code|your\s*code|auth\s*code|passcode/gi

const ACTION_CONTEXT_RE = /登录|登入|验证|驗證|校验|確認|确认|verify|sign\s*in|log\s*in|authenticate|confirm|enter/i
const REJECT_CONTEXT_RE =
  /order|invoice|ticket|phone|mobile|tel|amount|price|total|tracking|shipment|zip|postal|postcode|receipt|订单|訂單|金额|金額|电话|電話|手机号|手機號|工单|工單|发票|發票|快递|快遞|邮编|郵編|运单|運單/i
const URL_PARAM_CONTEXT_RE = /https?:\/\/|[?&][A-Za-z0-9_-]+=/

const PATTERNS: PatternSpec[] = [
  {
    source: 'keyword',
    base: 0.75,
    re: /(?:验证码|驗證碼|动态码|校验码|安全码|一次性(?:代码|密码)|verification\s*code|security\s*code|one[-\s]?time\s*(?:password|code)|otp|login\s*code|your\s*code)\D{0,40}([A-Za-z0-9](?:[A-Za-z0-9\s-]{2,14})[A-Za-z0-9])/gi,
  },
  {
    source: 'structured',
    base: 0.68,
    re: /\b(?:code|otp|pin|passcode)\s*[:：#-]?\s*([A-Za-z0-9]{2,4}(?:[\s-][A-Za-z0-9]{2,4}){1,3}|[A-Za-z0-9]{4,10})\b/gi,
  },
  {
    source: 'heuristic',
    base: 0.45,
    re: /(?<!\d)(\d(?:[\s-]?\d){3,7})(?!\d)/g,
  },
  {
    source: 'pattern',
    base: 0.55,
    re: /(?<![A-Z0-9])([A-Z]{1,4}\d[A-Z0-9]{2,8}|\d[A-Z][A-Z0-9]{2,8})(?![A-Z0-9])/g,
  },
]

const URL_RE = /https?:\/\/[^\s<>"']{4,}/g

export function normalizeMailText(raw: string): string {
  if (!raw) return ''
  const text = looksLikeHtml(raw) ? htmlToTextContent(raw) : decodeEntities(raw)
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t\r\f\v]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, MAX_TEXT_LENGTH)
}

/**
 * Extract OTP candidates from mail text. It is fully local and never sends
 * body content to a backend service.
 */
export function extractOtp(input: string | OtpExtractInput, max = 3, options: OtpExtractOptions = {}): OtpHit[] {
  const payload = typeof input === 'string' ? { body: input } : input
  const subject = normalizeMailText(payload.subject || '')
  const body = normalizeMailText(payload.body || '')
  if (!subject && !body) return []

  const header = [subject && `Subject: ${subject}`, payload.from && `From: ${payload.from}`, payload.date && `Date: ${payload.date}`]
    .filter(Boolean)
    .join('\n')
  const text = [header, body].filter(Boolean).join('\n\n').slice(0, MAX_TEXT_LENGTH)
  const subjectLimit = header.length
  const candidates: Candidate[] = []

  for (const spec of PATTERNS) {
    spec.re.lastIndex = 0
    for (const match of text.matchAll(spec.re)) {
      candidates.push({
        rawCode: match[1],
        index: match.index ?? 0,
        source: spec.source,
        base: spec.base,
      })
    }
  }

  for (const hint of options.semanticHints || []) {
    const hintText = normalizeMailText(hint)
    if (!hintText) continue
    for (const spec of PATTERNS) {
      spec.re.lastIndex = 0
      for (const match of hintText.matchAll(spec.re)) {
        const rawCode = match[1]
        candidates.push({
          rawCode,
          index: Math.max(0, text.indexOf(rawCode.replace(/[\s-]/g, ''))),
          source: 'semantic',
          base: Math.max(spec.base, 0.62),
        })
      }
    }
  }

  const best = new Map<string, OtpHit>()
  for (const candidate of candidates) {
    const hit = scoreCandidate(candidate, text, subjectLimit, options.semanticHints || [])
    if (!hit || hit.confidence < MIN_DISPLAY_CONFIDENCE) continue
    const previous = best.get(hit.code)
    if (!previous || hit.confidence > previous.confidence) best.set(hit.code, hit)
  }

  return Array.from(best.values())
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, max)
}

export function shouldRunSemanticOtp(hits: OtpHit[]): boolean {
  if (!hits.length) return true
  if (hits[0].confidence < HIGH_CONFIDENCE) return true
  return hits.length > 1 && hits[0].confidence - hits[1].confidence < 0.08
}

export function extractLinks(rawText: string, max = 6): string[] {
  if (!rawText) return []
  const out = new Set<string>()
  for (const m of rawText.matchAll(URL_RE)) {
    out.add(m[0].replace(/[.,;:)\]}>]+$/, ''))
    if (out.size >= max) break
  }
  return Array.from(out)
}

export function stripHtml(html: string): string {
  return normalizeMailText(html)
}

/**
 * Build minimal safe HTML for sandbox iframe rendering:
 *  - removes script/style-like active content
 *  - strips event handlers
 *  - forces safe external link attributes
 */
export function sanitizeHtml(html: string): string {
  if (!html) return ''
  const noActive = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
  const noEvents = noActive.replace(/\son[a-z]+="[^"]*"/gi, '').replace(/\son[a-z]+='[^']*'/gi, '')
  const safeLinks = noEvents.replace(/<a\s/gi, '<a target="_blank" rel="noopener noreferrer" ')

  return `<!doctype html><html><head><meta charset="utf-8">
<style>
  body { font: 14px/1.6 -apple-system, "Segoe UI", "Inter", sans-serif; color:#191c1e; padding:16px; background:#fff; }
  a { color:#003d9b; }
  img { max-width:100%; height:auto; }
  table { max-width:100%; }
  pre { white-space:pre-wrap; word-break:break-word; }
</style></head><body>${safeLinks}</body></html>`
}

export function looksLikeHtml(raw: string): boolean {
  if (!raw) return false
  return /<\/?(html|body|div|p|table|span|a|img|br|h[1-6]|style|script)\b/i.test(raw)
}

function scoreCandidate(candidate: Candidate, text: string, subjectLimit: number, semanticHints: string[]): OtpHit | null {
  const code = normalizeCode(candidate.rawCode)
  if (!isValidCodeShape(code)) return null

  const idx = candidate.index
  const context = sliceContext(text, idx, code.length)
  if (shouldReject(code, context)) return null

  let score = candidate.base
  const bonuses: string[] = [`base:${candidate.source}+${candidate.base.toFixed(2)}`]
  const penalties: string[] = []

  const keywordDistance = nearestKeywordDistance(text, idx)
  if (keywordDistance >= 0 && keywordDistance <= 12) {
    score += 0.25
    bonuses.push('keyword-distance-0-12:+0.25')
  } else if (keywordDistance > 12 && keywordDistance <= 40) {
    score += 0.15
    bonuses.push('keyword-distance-13-40:+0.15')
  }

  if (idx <= subjectLimit) {
    score += 0.12
    bonuses.push('subject:+0.12')
  }

  if (/^\d{6}$/.test(code)) {
    score += 0.12
    bonuses.push('six-digit:+0.12')
  }

  if (ACTION_CONTEXT_RE.test(context)) {
    score += 0.08
    bonuses.push('action-context:+0.08')
  }

  if (semanticHints.some((hint) => hint.includes(candidate.rawCode) || hint.includes(code))) {
    score += 0.1
    bonuses.push('semantic-sentence:+0.10')
  }

  const penalty = scorePenalty(code, context)
  score -= penalty.value
  penalties.push(...penalty.reasons)

  const final = clamp(score, 0.1, 0.99)
  return {
    code,
    context,
    source: candidate.source,
    confidence: final,
    reason: buildReason(candidate.source, bonuses, penalties),
    scoreBreakdown: {
      base: candidate.base,
      bonuses,
      penalties,
      final,
    },
  }
}

function normalizeCode(code: string): string {
  const cleaned = code.replace(/[\s-]/g, '').trim()
  return /[a-z]/.test(cleaned) ? cleaned.toUpperCase() : cleaned
}

function isValidCodeShape(code: string): boolean {
  if (!/^[A-Z0-9]{4,10}$/.test(code)) return false
  if (/^[A-Z]+$/.test(code)) return false
  if (/^\d{11,}$/.test(code)) return false
  return true
}

function shouldReject(code: string, context: string): boolean {
  if (/^\d{11,}$/.test(code)) return true
  if (/^1[3-9]\d{9}$/.test(code)) return true
  if (/^(19|20)\d{2}$/.test(code)) return true
  if (/^\d{4}[-/]?\d{1,2}[-/]?\d{1,2}$/.test(code)) return true
  if (/^\d{5}(?:-\d{4})?$/.test(code) && /(zip|postal|postcode|邮编|郵編)/i.test(context)) return true
  if (URL_PARAM_CONTEXT_RE.test(context) && /^\d{8,}$/.test(code)) return true
  return false
}

function scorePenalty(code: string, context: string): { value: number; reasons: string[] } {
  let value = 0
  const reasons: string[] = []

  if (REJECT_CONTEXT_RE.test(context)) {
    value += 0.28
    reasons.push('reject-context:-0.28')
  }
  if (isRepeatedOrSequential(code)) {
    value += 0.25
    reasons.push('repeated-or-sequential:-0.25')
  }
  if (/^\d{8,10}$/.test(code)) {
    value += 0.16
    reasons.push('long-numeric:-0.16')
  }
  if (/(amount|price|total|金额|金額|¥|\$|€)/i.test(context) && /^\d+$/.test(code)) {
    value += 0.24
    reasons.push('money-context:-0.24')
  }
  if (/(order|invoice|tracking|订单|訂單|发票|發票|运单|運單)/i.test(context)) {
    value += 0.22
    reasons.push('business-id-context:-0.22')
  }

  return { value, reasons }
}

function nearestKeywordDistance(text: string, index: number): number {
  let nearest = Number.POSITIVE_INFINITY
  OTP_KEYWORD_SCAN_RE.lastIndex = 0
  for (const match of text.matchAll(OTP_KEYWORD_SCAN_RE)) {
    const keywordIndex = match.index ?? 0
    nearest = Math.min(nearest, Math.abs(index - keywordIndex))
  }
  return Number.isFinite(nearest) ? nearest : -1
}

function sliceContext(text: string, index: number, length: number): string {
  const start = Math.max(0, index - CONTEXT_RADIUS)
  const end = Math.min(text.length, index + length + CONTEXT_RADIUS)
  return text.slice(start, end).replace(/\s+/g, ' ').trim()
}

function isRepeatedOrSequential(code: string): boolean {
  if (/^(.)\1{3,}$/.test(code)) return true
  if (!/^\d{4,10}$/.test(code)) return false
  const digits = code.split('').map(Number)
  const asc = digits.every((digit, i) => i === 0 || digit === digits[i - 1] + 1)
  const desc = digits.every((digit, i) => i === 0 || digit === digits[i - 1] - 1)
  return asc || desc
}

function buildReason(source: OtpHit['source'], bonuses: string[], penalties: string[]): string {
  const sourceLabel: Record<OtpHit['source'], string> = {
    keyword: '关键词上下文',
    structured: '结构化标签',
    pattern: '字母数字模式',
    heuristic: '纯数字启发式',
    semantic: '语义句子增强',
  }
  const risk = penalties.length ? `，扣分：${penalties.join(', ')}` : ''
  return `${sourceLabel[source]}；${bonuses.join(', ')}${risk}`
}

function htmlToTextContent(html: string): string {
  if (typeof DOMParser === 'undefined') return fallbackStripHtml(html)
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    doc.querySelectorAll('script,style,noscript,svg,img,meta,link,template').forEach((node) => node.remove())
    doc.querySelectorAll('br,p,div,li,tr,h1,h2,h3,h4,h5,h6').forEach((node) => {
      node.appendChild(doc.createTextNode('\n'))
    })
    return decodeEntities(doc.body?.textContent || '')
  } catch {
    return fallbackStripHtml(html)
  }
}

function fallbackStripHtml(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
      .replace(/<\/?[^>]+>/g, ''),
  )
}

function decodeEntities(text: string): string {
  if (!text) return ''
  if (typeof document !== 'undefined') {
    const box = document.createElement('textarea')
    box.innerHTML = text
    return box.value
  }
  return text.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_m, e) => {
    switch (e) {
      case 'amp':
        return '&'
      case 'lt':
        return '<'
      case 'gt':
        return '>'
      case 'quot':
        return '"'
      case '#39':
        return "'"
      case 'nbsp':
        return ' '
      default:
        return ''
    }
  })
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Number(value.toFixed(2))))
}

export { HIGH_CONFIDENCE }
