import fs from 'fs'
import path from 'path'
import { LLMConfig, LLMConfigStore } from '@/types'

const CONFIG_PATH = path.join(process.cwd(), 'data', 'llm-configs.json')

const DEFAULT_STORE: LLMConfigStore = {
  globalTimeoutMs: 30000,
  activeIndex: 0,
  configs: [
    {
      index: 0,
      id: 'claude-sonnet-4-6',
      label: 'Claude Sonnet 4.6',
      provider: 'Anthropic',
      family: 'Sonnet',
      version: '4.6',
      baseUrl: 'https://api.anthropic.com',
      apiKey: process.env.ANTHROPIC_API_KEY ?? '',
      model: 'claude-sonnet-4-6',
      timeoutMs: null,
      status: 'untested'
    }
  ]
}

export function readConfigStore(): LLMConfigStore {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      writeConfigStore(DEFAULT_STORE)
      return DEFAULT_STORE
    }
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8')
    return JSON.parse(raw) as LLMConfigStore
  } catch {
    return DEFAULT_STORE
  }
}

export function writeConfigStore(store: LLMConfigStore): void {
  fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true })
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(store, null, 2), 'utf-8')
}

export function getActiveConfig(): LLMConfig {
  const store = readConfigStore()
  return store.configs[store.activeIndex] ?? store.configs[0]
}

export function getConfigsSortedByIndex(): LLMConfig[] {
  const store = readConfigStore()
  return [...store.configs].sort((a, b) => a.index - b.index)
}

export function resolveTimeout(config: LLMConfig): number {
  if (config.timeoutMs !== null) return config.timeoutMs
  return readConfigStore().globalTimeoutMs
}

export async function getLLMWithFailover(): Promise<{
  adapter: any
  config: LLMConfig
}> {
  const configs = getConfigsSortedByIndex()

  for (const config of configs) {
    try {
      const adapter = await buildAdapter(config)
      return { adapter, config }
    } catch {
      console.warn(`LLM config ${config.label} failed, trying next...`)
      continue
    }
  }

  throw new Error('All LLM configurations failed. Please check your settings.')
}

async function buildAdapter(config: LLMConfig) {
  if (config.provider === 'Anthropic') {
    const { ClaudeAdapter } = await import('./claude')
    return new ClaudeAdapter(config)
  } else {
    const { OpenAICompatibleAdapter } = await import('./openai-compatible')
    return new OpenAICompatibleAdapter(config)
  }
}