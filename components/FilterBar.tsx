'use client'

import { Category, Tier } from '@/types'

const TIERS: { value: Tier | 'all', label: string }[] = [
  { value: 'all', label: 'All Tiers' },
  { value: 1, label: 'Surface' },
  { value: 2, label: 'Mechanism' },
  { value: 3, label: 'Substrate' },
]

const CATEGORIES: { value: Category | 'all', label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'Programming & Software Dev', label: 'Programming' },
  { value: 'Systems & Infrastructure', label: 'Systems' },
  { value: 'Mathematics & Theory', label: 'Mathematics' },
  { value: 'Data & ML / AI', label: 'Data & AI' },
  { value: 'Design & UI/UX', label: 'Design' },
  { value: 'Product & Business', label: 'Business' },
  { value: 'Security', label: 'Security' },
  { value: 'Networking', label: 'Networking' },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'tier-asc', label: 'Tier: Easy First' },
  { value: 'tier-desc', label: 'Tier: Hard First' },
  { value: 'title', label: 'Title A-Z' },
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'untouched', label: 'Untouched' },
  { value: 'queued', label: 'In Queue' },
  { value: 'learned', label: 'Learned' },
]

export interface FilterState {
  tier: Tier | 'all'
  category: Category | 'all'
  status: string
  sort: string
}

interface Props {
  filters: FilterState
  onChange: (filters: FilterState) => void
  totalCount: number
  filteredCount: number
}

export default function FilterBar({ filters, onChange, totalCount, filteredCount }: Props) {
  function update(partial: Partial<FilterState>) {
    onChange({ ...filters, ...partial })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-center">
      {/* Tier filter */}
      <select
        value={String(filters.tier)}
        onChange={e => update({ tier: e.target.value === 'all' ? 'all' : Number(e.target.value) as Tier })}
        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-secondary"
      >
        {TIERS.map(t => (
          <option key={String(t.value)} value={String(t.value)}>{t.label}</option>
        ))}
      </select>

      {/* Category filter */}
      <select
        value={filters.category}
        onChange={e => update({ category: e.target.value as Category | 'all' })}
        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-secondary"
      >
        {CATEGORIES.map(c => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>

      {/* Status filter */}
      <select
        value={filters.status}
        onChange={e => update({ status: e.target.value })}
        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-secondary"
      >
        {STATUS_OPTIONS.map(s => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      {/* Sort */}
      <select
        value={filters.sort}
        onChange={e => update({ sort: e.target.value })}
        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-secondary"
      >
        {SORT_OPTIONS.map(s => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      {/* Count */}
      <span className="text-sm text-muted ml-auto">
        {filteredCount === totalCount
          ? `${totalCount} topics`
          : `${filteredCount} of ${totalCount} topics`}
      </span>

      {/* Reset */}
      {(filters.tier !== 'all' || filters.category !== 'all' || filters.status !== 'all' || filters.sort !== 'newest') && (
        <button
          onClick={() => onChange({ tier: 'all', category: 'all', status: 'all', sort: 'newest' })}
          className="text-xs text-orange-500 hover:text-orange-600 transition-colors"
        >
          Reset filters
        </button>
      )}
    </div>
  )
}