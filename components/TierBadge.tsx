import { Tier } from '@/types'

interface Props {
  tier: Tier
  size?: 'sm' | 'md'
}

const tierLabels: Record<Tier, string> = {
  1: 'Surface',
  2: 'Mechanism',
  3: 'Substrate'
}

const tierColors: Record<Tier, string> = {
  1: 'bg-blue-50 text-blue-700',
  2: 'bg-purple-50 text-purple-700',
  3: 'bg-red-50 text-red-600'
}

export default function TierBadge({ tier, size = 'sm' }: Props) {
  return (
    <span className={`
      inline-flex items-center rounded-full font-medium
      ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'}
      ${tierColors[tier]}
    `}>
      {tierLabels[tier]}
    </span>
  )
}