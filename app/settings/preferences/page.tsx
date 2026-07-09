'use client'

import { useEffect, useState } from 'react'
import { UserPrefs, AnalysisMode, Tier } from '@/types'
import CategoryCombobox from '@/components/CategoryCombobox'

const TIERS: { value: Tier, label: string, description: string }[] = [
  { value: 1, label: 'Surface', description: 'What you use — syntax, tools, APIs, frameworks' },
  { value: 2, label: 'Mechanism', description: 'How it works — algorithms, protocols, internals' },
  { value: 3, label: 'Substrate', description: 'What it runs on — kernel, drivers, hardware' },
]

const DEFAULT_PREFS: UserPrefs = {
  defaultTier: 1,
  categories: [
    'Programming & Software Dev',
    'Systems & Infrastructure',
    'Mathematics & Theory',
    'Data & ML / AI',
    'Design & UI/UX',
    'Product & Business',
    'Security',
    'Networking',
  ],
  analysisMode: 'guided',
  maxCards: 5
}

export default function PreferencesPage() {
  const [prefs, setPrefs] = useState<UserPrefs>(DEFAULT_PREFS)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPrefs()
  }, [])

  async function fetchPrefs() {
    const res = await fetch('/api/preferences')
    if (res.ok) {
      const data = await res.json()
      if (data.prefs) setPrefs({ ...DEFAULT_PREFS, ...data.prefs })
    }
    setLoading(false)
  }

  async function handleSave() {
    await fetch('/api/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs)
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <p className="text-secondary">Loading preferences...</p>

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Preferences</h1>

      {/* Default tier */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
        <h2 className="text-sm font-medium text-primary mb-1">Default Learning Tier</h2>
        <p className="text-xs text-secondary mb-4">
          Topics at or below this tier will be shown by default. All tiers are always accessible.
        </p>
        <div className="flex flex-col gap-2">
          {TIERS.map(tier => (
            <button
              key={tier.value}
              onClick={() => setPrefs(prev => ({ ...prev, defaultTier: tier.value }))}
              className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                prefs.defaultTier === tier.value
                  ? 'border-orange-300 bg-orange-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${
                tier.value === 1 ? 'bg-blue-50 text-blue-600' :
                tier.value === 2 ? 'bg-purple-50 text-purple-600' :
                'bg-red-50 text-red-600'
              }`}>
                {tier.label}
              </span>
              <span className="text-xs text-secondary">{tier.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Analysis mode — red border: affects API call */}
      <div className="bg-white border-2 border-red-200 rounded-xl p-6 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-sm font-medium text-primary">Analysis Mode</h2>
          <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full">affects API call</span>
        </div>
        <p className="text-xs text-secondary mb-4">
          Guided allows the LLM to return whatever is most relevant, using your categories as context.
          Strict constrains results to only your selected categories.
        </p>
        <div className="flex gap-3">
          {(['guided', 'strict'] as AnalysisMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setPrefs(prev => ({ ...prev, analysisMode: mode }))}
              className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors capitalize ${
                prefs.analysisMode === mode
                  ? 'border-orange-300 bg-orange-50 text-orange-700'
                  : 'border-gray-200 text-secondary hover:bg-gray-50'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Max cards — red border: affects API call */}
      <div className="bg-white border-2 border-red-200 rounded-xl p-6 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-sm font-medium text-primary">Topics per Conversation</h2>
          <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full">affects API call</span>
        </div>
        <p className="text-xs text-secondary mb-4">
          How many topic cards to generate per conversation analysis. Min 1, max 10.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={10}
            value={prefs.maxCards}
            onChange={e => {
              const val = Math.min(10, Math.max(1, parseInt(e.target.value) || 1))
              setPrefs(prev => ({ ...prev, maxCards: val }))
            }}
            className="w-20 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-mono text-center"
          />
          <span className="text-xs text-secondary">topics per analysis</span>
        </div>
      </div>

      {/* Categories — red border: affects API call */}
      <div className="bg-white border-2 border-red-200 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-sm font-medium text-primary">Categories of Interest</h2>
          <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full">affects API call</span>
        </div>
        <p className="text-xs text-secondary mb-4">
          Topics in selected categories will be prioritized or strictly filtered depending on your analysis mode.
        </p>
        <CategoryCombobox
          selected={prefs.categories}
          onChange={categories => setPrefs(prev => ({ ...prev, categories }))}
        />
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        className="bg-orange-500 text-white px-6 py-2.5 rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
      >
        {saved ? '✓ Saved' : 'Save Preferences'}
      </button>
    </div>
  )
}