export type MercuryTask =
  | 'mercury-diffusion'
  | 'mercury-voice'
  | 'mercury-operator'
  | 'default'

export interface MercuryMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface MercuryRoute {
  model: string
  baseUrl: string
  apiKey?: string
  maxTokens: number
  diffusing: boolean
  reasoningEffort: 'instant' | 'low' | 'medium'
}

const ENV_ALIASES: Record<string, string[]> = {
  INCEPTION_API_KEY: ['MERCURY2_API_TOKEN', 'INCEPTION_MERCURY2_API_TOKEN', 'INCEPTION_LABS_API_KEY'],
  MERCURY_BASE_URL: ['INCEPTION_BASE_URL'],
  MERCURY_MODEL: ['INCEPTION_MODEL'],
  OPENAI_API_KEY: ['OPENAI_API_KEY_ALT'],
}

export function resolveEnvValue(name: string) {
  const candidates = [name, ...(ENV_ALIASES[name] ?? [])]
  for (const candidate of candidates) {
    const value = process.env[candidate]
    if (value?.trim()) return value.trim()
  }
  return undefined
}

export function getMercuryRoute(task: MercuryTask): MercuryRoute {
  const baseUrl = resolveEnvValue('MERCURY_BASE_URL') ?? 'https://api.inceptionlabs.ai/v1'
  const model = resolveEnvValue('MERCURY_MODEL') ?? 'mercury-2'
  const apiKey = resolveEnvValue('INCEPTION_API_KEY')

  if (task === 'mercury-voice') {
    return {
      model,
      baseUrl,
      apiKey,
      maxTokens: 4096,
      diffusing: false,
      reasoningEffort: 'instant',
    }
  }

  if (task === 'mercury-operator') {
    return {
      model,
      baseUrl,
      apiKey,
      maxTokens: 8192,
      diffusing: false,
      reasoningEffort: 'medium',
    }
  }

  return {
    model,
    baseUrl,
    apiKey,
    maxTokens: task === 'default' ? 4096 : 8192,
    diffusing: task !== 'default',
    reasoningEffort: 'low',
  }
}

export function getRuntimeStatus() {
  const mercuryRoute = getMercuryRoute('mercury-diffusion')
  const openAiKey = resolveEnvValue('OPENAI_API_KEY')

  return {
    status: mercuryRoute.apiKey ? 'ready' : 'missing_mercury_key',
    mercury: {
      baseUrl: mercuryRoute.baseUrl,
      model: mercuryRoute.model,
      hasApiKey: Boolean(mercuryRoute.apiKey),
    },
    voice: {
      hasOpenAiKey: Boolean(openAiKey),
    },
  }
}

export async function runMercuryChat(
  messages: MercuryMessage[],
  task: MercuryTask,
  systemPrompt?: string
) {
  const route = getMercuryRoute(task)

  if (!route.apiKey) {
    throw new Error('Missing INCEPTION_API_KEY or Mercury API key alias')
  }

  const payloadMessages = systemPrompt
    ? [{ role: 'system' as const, content: systemPrompt }, ...messages]
    : messages

  const response = await fetch(`${route.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${route.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: route.model,
      messages: payloadMessages,
      max_tokens: route.maxTokens,
      temperature: 0.7,
      stream: false,
      extra_body: {
        diffusing: route.diffusing,
        reasoning_effort: route.reasoningEffort,
      },
    }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = typeof data?.error?.message === 'string' ? data.error.message : response.statusText
    throw new Error(`Mercury request failed: ${detail}`)
  }

  const reply = data?.choices?.[0]?.message?.content
  if (typeof reply !== 'string') {
    throw new Error('Mercury response did not include assistant content')
  }

  return {
    reply,
    model: route.model,
    provider: route.baseUrl,
    usage: data?.usage ?? null,
  }
}
