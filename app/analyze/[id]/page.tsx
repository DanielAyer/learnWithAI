'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { UserPrefs, AnalysisMode, Conversation } from '@/types'
import CategoryCombobox from '@/components/CategoryCombobox'
import Link from 'next/link'

const BASE_INPUT_TOKENS = 195
const BASE_OUTPUT_TOKENS = 300
const BASE_TOKENS = BASE_INPUT_TOKENS + BASE_OUTPUT_TOKENS

function estimateTokens(maxCards: number, categories: string[], mode: AnalysisMode, learnedTopics: number) {
  const input = 190
    + (categories.length * 5)
    + (learnedTopics * 5)
    + (mode === 'strict' ? 30 : 0)
  const output = maxCards * 100
  return { input, output, total: input + output }
}

function complexityColor(multiplier: number) {
  if (multiplier <= 2) return 'bg-green-500'
  if (multiplier <= 5) return 'bg-yellow-500'
  return 'bg-orange-500'
}

function complexityLabel(multiplier: number) {
  if (multiplier <= 2) return 'lightweight'
  if (multiplier <= 5) return 'moderate'
  return 'heavy'
}

export default function AnalyzePage() {
  const { id } = useParams()
  const router = useRouter()

  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [prefs, setPrefs] = useState<UserPrefs | null>(null)
  const [mode, setMode] = useState<AnalysisMode>('guided')
  const [maxCards, setMaxCards] = useState(5)
  const [categories, setCategories] = useState<string[]>([])
  const [learnedCount, setLearnedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    async function load() {
      // Load conversations to find this one
      const convRes = await fetch('/api/conversations')
      const convData = await convRes.json()
      const conv = convData.conversations?.find((c: Conversation) => c.id === id)
      setConversation(conv ?? null)

      // Load preferences
      const prefsRes = await fetch('/api/preferences')
      const prefsData = await prefsRes.json()
      if (prefsData.prefs) {
        const p: UserPrefs = prefsData.prefs
        setPrefs(p)
        setMode(p.analysisMode ?? 'guided')
        setMaxCards(p.maxCards ?? 5)
        setCategories(p.categories ?? [])
      }

      // Load learned topic count for token estimate
      const topicsRes = await fetch('/api/topics')
      const topicsData = await topicsRes.json()
      const learned = topicsData.cards?.filter((c: any) => c.status === 'learned').length ?? 0
      setLearnedCount(learned)

      setLoading(false)
    }
    load()
  }, [id])

  const tokens = useMemo(() =>
    estimateTokens(maxCards, categories, mode, learnedCount),
    [maxCards, categories, mode, learnedCount]
  )

  const baseTokens = estimateTokens(3, ['Programming & Software Dev'], 'guided', 0)
  const multiplier = Math.round((tokens.total / baseTokens.total) * 10) / 10
  const barWidth = Math.min(100, (tokens.total / (baseTokens.total * 10)) * 100)

  async function handleAnalyze() {
    if (!conversation) return
    setAnalyzing(true)
    setShowConfirm(false)

    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: id,
        title: conversation.title,
        overrides: { mode, maxCards, categories }
      })
    })

    if (res.ok) {
      router.push(`/conversations/${id}`)
    } else {
      alert('Analysis failed. Check your API key and try again.')
      setAnalyzing(false)
    }
  }

  if (loading) return <p className="text-secondary">Loading...</p>
  if (!conversation) return <p className="text-secondary">Conversation not found.</p>

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/conversations"
          className="text-sm text-muted hover:text-primary transition-colors"
        >
          ← Conversations
        </Link>
        <h1 className="text-2xl font-semibold mt-2">Analyze Conversation</h1>
        <p className="text-secondary text-sm mt-1 line-clamp-2">{conversation.title}</p>
        <p className="text-xs text-muted mt-0.5">
          {new Date(conversation.updatedAt).toLocaleDateString()}
          {conversation.messageCount ? ` · ${conversation.messageCount} messages` : ''}
        </p>
      </div>

      {/* Analysis settings */}
      <div className="bg-white border-2 border-red-200 rounded-xl p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-medium text-primary">Analysis Settings</h2>
          <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full">affects API call</span>
        </div>

        {/* Mode */}
        <div className="flex flex-col gap-1 mb-4">
          <label className="text-xs font-medium text-secondary">Analysis Mode</label>
          <div className="flex gap-2">
            {(['guided', 'strict'] as AnalysisMode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-colors capitalize ${
                  mode === m
                    ? 'border-orange-300 bg-orange-50 text-orange-700'
                    : 'border-gray-200 text-secondary hover:bg-gray-50'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted mt-1">
            {mode === 'guided'
              ? 'LLM returns most relevant topics, using categories as context.'
              : 'LLM only returns topics within your selected categories.'}
          </p>
        </div>

        {/* Max cards */}
        <div className="flex flex-col gap-1 mb-4">
          <label className="text-xs font-medium text-secondary">Topics to generate</label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={10}
              value={maxCards}
              onChange={e => setMaxCards(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-20 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-mono text-center"
            />
            <span className="text-xs text-muted">min 1 · max 10</span>
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-secondary">Categories</label>
          <CategoryCombobox
            selected={categories}
            onChange={setCategories}
          />
        </div>
      </div>

      {/* Complexity estimator */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-medium text-primary mb-4">Complexity Estimator</h2>

        {/* Base bar */}
        <div className="flex flex-col gap-1 mb-3">
          <div className="flex items-center justify-between text-xs text-muted mb-1">
            <span>Base call</span>
            <span>{baseTokens.total} tokens · 1x</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-400 rounded-full" style={{ width: '10%' }} />
          </div>
        </div>

        {/* Current call bar */}
        <div className="flex flex-col gap-1 mb-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-secondary">This call</span>
            <span className={`font-medium ${
              multiplier <= 2 ? 'text-green-600' :
              multiplier <= 5 ? 'text-yellow-600' :
              'text-orange-600'
            }`}>
              {tokens.total} tokens · {multiplier}x
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${complexityColor(multiplier)}`}
              style={{ width: `${Math.max(10, barWidth)}%` }}
            />
          </div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="flex flex-col gap-0.5">
            <span className="text-muted">Input</span>
            <span className="text-secondary font-mono">{tokens.input} tokens</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-muted">Output</span>
            <span className="text-secondary font-mono">{tokens.output} tokens</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-muted">Complexity</span>
            <span className={`font-medium capitalize ${
              multiplier <= 2 ? 'text-green-600' :
              multiplier <= 5 ? 'text-yellow-600' :
              'text-orange-600'
            }`}>{complexityLabel(multiplier)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Link
          href="/conversations"
          className="text-sm border border-gray-200 text-secondary px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </Link>
        <button
          onClick={() => setShowConfirm(true)}
          disabled={analyzing || categories.length === 0}
          className="text-sm bg-orange-500 text-white px-6 py-2.5 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-40 font-medium"
        >
          {analyzing ? 'Analyzing...' : 'Analyze →'}
        </button>
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Confirm Analysis</h2>
            <p className="text-secondary text-sm">
              You are about to analyze <strong className="text-primary">"{conversation.title}"</strong>.
            </p>
            <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Estimated tokens</span>
                <span className="font-mono text-primary">{tokens.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Complexity</span>
                <span className={`font-medium capitalize ${
                  multiplier <= 2 ? 'text-green-600' :
                  multiplier <= 5 ? 'text-yellow-600' :
                  'text-orange-600'
                }`}>{multiplier}x base call</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Mode</span>
                <span className="text-primary capitalize">{mode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Topics</span>
                <span className="text-primary">{maxCards}</span>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="text-sm border border-gray-200 text-secondary px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAnalyze}
                className="text-sm bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}