'use client'

import { useState, useEffect } from 'react'
import { LLMConfig, LLMProvider } from '@/types'

const PROVIDER_URLS: Record<LLMProvider, string> = {
  Anthropic: 'https://api.anthropic.com',
  OpenAI: 'https://api.openai.com/v1',
  Ollama: 'http://localhost:11434/v1',
  Groq: 'https://api.groq.com/openai/v1',
  Mistral: 'https://api.mistral.ai/v1',
  Custom: ''
}

const PROVIDERS: LLMProvider[] = ['Anthropic', 'OpenAI', 'Ollama', 'Groq', 'Mistral', 'Custom']

interface Props {
  initial?: Partial<LLMConfig>
  onSave: (config: Partial<LLMConfig>) => void
  onCancel: () => void
  globalTimeoutMs: number
}

export default function LLMModal({ initial, onSave, onCancel, globalTimeoutMs }: Props) {
  const [provider, setProvider] = useState<LLMProvider>(initial?.provider ?? 'Anthropic')
  const [baseUrl, setBaseUrl] = useState(initial?.baseUrl ?? PROVIDER_URLS['Anthropic'])
  const [apiKey, setApiKey] = useState(initial?.apiKey ?? '')
  const [family, setFamily] = useState(initial?.family ?? '')
  const [version, setVersion] = useState(initial?.version ?? '')
  const [model, setModel] = useState(initial?.model ?? '')
  const [label, setLabel] = useState(initial?.label ?? '')
  const [timeoutMs, setTimeoutMs] = useState<string>(
    initial?.timeoutMs != null ? String(initial.timeoutMs) : ''
  )
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'connected' | 'failed' | null>(null)
  const [testError, setTestError] = useState<string | null>(null)

  // Auto-fill baseUrl when provider changes
  useEffect(() => {
    if (!initial?.baseUrl) {
      setBaseUrl(PROVIDER_URLS[provider])
    }
  }, [provider])

  // Auto-generate model string and label
  useEffect(() => {
    if (family && version) {
      const generated = `${family.toLowerCase().replace(/\s+/g, '-')}-${version.toLowerCase().replace(/\s+/g, '-')}`
      setModel(generated)
      setLabel(`${provider} ${family} ${version}`)
    }
  }, [provider, family, version])

  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    setTestError(null)

    const config: Partial<LLMConfig> = {
      provider,
      baseUrl,
      apiKey,
      model,
      timeoutMs: timeoutMs ? parseInt(timeoutMs) : null
    }

    const res = await fetch('/api/llm-configs/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    })

    const data = await res.json()
    setTestResult(data.status)
    setTestError(data.error ?? null)
    setTesting(false)
  }

  function handleSave() {
    onSave({
      provider,
      baseUrl,
      apiKey,
      family,
      version,
      model,
      label,
      timeoutMs: timeoutMs ? parseInt(timeoutMs) : null
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4">
        <h2 className="text-lg font-semibold">
          {initial?.id ? 'Edit LLM' : 'Add New LLM'}
        </h2>

        {/* Provider */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-secondary">Provider</label>
          <select
            value={provider}
            onChange={e => setProvider(e.target.value as LLMProvider)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            {PROVIDERS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Base URL */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-secondary">Base URL</label>
          <input
            type="text"
            value={baseUrl}
            onChange={e => setBaseUrl(e.target.value)}
            placeholder="https://api.example.com"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono"
          />
        </div>

        {/* API Key */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-secondary">
            API Key <span className="text-muted">(optional for local)</span>
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono"
          />
        </div>

        {/* Family + Version */}
        <div className="flex gap-3">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs font-medium text-secondary">Family</label>
            <input
              type="text"
              value={family}
              onChange={e => setFamily(e.target.value)}
              placeholder="Sonnet, GPT-4o, Llama"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1 w-28">
            <label className="text-xs font-medium text-secondary">Version</label>
            <input
              type="text"
              value={version}
              onChange={e => setVersion(e.target.value)}
              placeholder="4.6"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Model string */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-secondary">
            Model string <span className="text-muted">(auto-generated)</span>
          </label>
          <input
            type="text"
            value={model}
            onChange={e => setModel(e.target.value)}
            placeholder="claude-sonnet-4-6"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono"
          />
        </div>

        {/* Label */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-secondary">
            Label <span className="text-muted">(auto-generated)</span>
          </label>
          <input
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Claude Sonnet 4.6"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* Timeout */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-secondary">
            Timeout (ms) <span className="text-muted">(leave blank for global default: {globalTimeoutMs}ms)</span>
          </label>
          <input
            type="number"
            value={timeoutMs}
            onChange={e => setTimeoutMs(e.target.value)}
            placeholder={String(globalTimeoutMs)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* Test result */}
        {testResult && (
          <div className={`text-xs px-3 py-2 rounded-lg ${
            testResult === 'connected'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-600'
          }`}>
            {testResult === 'connected'
              ? '✓ Connection successful'
              : `✗ ${testError ?? 'Connection failed'}`}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleTest}
            disabled={testing || !model || !baseUrl}
            className="text-sm border border-gray-200 text-secondary px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={onCancel}
              className="text-sm text-secondary px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!model || !baseUrl || !label}
              className="text-sm bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-40"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}