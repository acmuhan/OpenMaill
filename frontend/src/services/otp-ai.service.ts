import {
  extractOtp,
  normalizeMailText,
  shouldRunSemanticOtp,
  type OtpExtractInput,
  type OtpHit,
} from './mail-body.service'

type Extractor = (text: string | string[], options?: Record<string, unknown>) => Promise<unknown>

export type OtpAiStatus = 'idle' | 'loading' | 'ready' | 'unavailable'

export interface OtpAiResult {
  hits: OtpHit[]
  semanticHints: string[]
  status: OtpAiStatus
  error?: string
}

let extractorPromise: Promise<Extractor> | null = null
let promptVectorPromise: Promise<number[]> | null = null

const MODEL_ID = 'Xenova/all-MiniLM-L6-v2'
const PROMPT = 'verification code 验证码 one time password otp login security code'
const MAX_SENTENCES = 24
const MIN_SIMILARITY = 0.32

export async function extractOtpWithSemanticFallback(input: OtpExtractInput, ruleHits: OtpHit[], max = 3): Promise<OtpAiResult> {
  if (!shouldRunSemanticOtp(ruleHits)) {
    return { hits: ruleHits, semanticHints: [], status: 'idle' }
  }

  const text = normalizeMailText([input.subject || '', input.body || ''].filter(Boolean).join('\n\n'))
  const sentences = splitSentences(text)
  if (!sentences.length) return { hits: ruleHits, semanticHints: [], status: 'idle' }

  try {
    const extractor = await getExtractor()
    const promptVector = await getPromptVector(extractor)
    const sentenceVectors = await embed(extractor, sentences)
    const ranked = sentences
      .map((sentence, index) => ({
        sentence,
        score: cosine(promptVector, sentenceVectors[index] || []),
      }))
      .filter((item) => item.score >= MIN_SIMILARITY)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)

    const semanticHints = ranked.map((item) => item.sentence)
    if (!semanticHints.length) return { hits: ruleHits, semanticHints: [], status: 'ready' }

    const semanticHits = extractOtp(input, max, { semanticHints })
    return {
      hits: mergeHits(ruleHits, semanticHits).slice(0, max),
      semanticHints,
      status: 'ready',
    }
  } catch (error) {
    return {
      hits: ruleHits,
      semanticHints: [],
      status: 'unavailable',
      error: error instanceof Error ? error.message : '本地语义模型不可用',
    }
  }
}

export function preloadOtpSemanticModel(): Promise<void> {
  return getExtractor().then(() => undefined)
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[。！？!?；;.\n])\s+|\n+/)
    .map((sentence) => sentence.replace(/\s+/g, ' ').trim())
    .filter((sentence) => sentence.length >= 8 && sentence.length <= 360)
    .slice(0, MAX_SENTENCES)
}

async function getExtractor(): Promise<Extractor> {
  if (!extractorPromise) {
    extractorPromise = import('@huggingface/transformers').then(async ({ env, pipeline }) => {
      env.allowLocalModels = false
      env.useBrowserCache = true
      return (await pipeline('feature-extraction', MODEL_ID)) as Extractor
    })
  }
  return extractorPromise
}

function getPromptVector(extractor: Extractor): Promise<number[]> {
  if (!promptVectorPromise) promptVectorPromise = embedOne(extractor, PROMPT)
  return promptVectorPromise
}

async function embed(extractor: Extractor, texts: string[]): Promise<number[][]> {
  const output = await extractor(texts, { pooling: 'mean', normalize: true })
  const data = tensorToArray(output)
  if (!data.length) return []

  const dims = data.length / texts.length
  if (!Number.isInteger(dims) || dims <= 0) return texts.map(() => [])
  const vectors: number[][] = []
  for (let i = 0; i < texts.length; i += 1) {
    vectors.push(data.slice(i * dims, (i + 1) * dims))
  }
  return vectors
}

async function embedOne(extractor: Extractor, text: string): Promise<number[]> {
  const output = await extractor(text, { pooling: 'mean', normalize: true })
  return tensorToArray(output)
}

function tensorToArray(output: unknown): number[] {
  if (Array.isArray(output)) return output.flat(Infinity).map(Number)
  if (output && typeof output === 'object' && 'data' in output) {
    const data = (output as { data: ArrayLike<number> }).data
    return Array.from(data, Number)
  }
  return []
}

function cosine(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) return 0
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1)
}

function mergeHits(primary: OtpHit[], semantic: OtpHit[]): OtpHit[] {
  const best = new Map<string, OtpHit>()
  for (const hit of [...primary, ...semantic]) {
    const previous = best.get(hit.code)
    if (!previous || hit.confidence > previous.confidence) best.set(hit.code, hit)
  }
  return Array.from(best.values()).sort((a, b) => b.confidence - a.confidence)
}
