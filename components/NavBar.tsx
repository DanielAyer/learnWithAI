'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LLMSelector from './LLMSelector'

const NAV_LINKS = [
  { href: '/queue', label: 'Learn' },
  { href: '/conversations', label: 'Conversations' },
  { href: '/settings', label: 'Settings' },
]

export default function NavBar() {
  const pathname = usePathname()

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 text-primary">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="font-mono text-lg font-semibold tracking-tight">
          learn <span className="text-orange-500">{'{ }'}</span> with AI
        </Link>
        <div className="flex items-center gap-6">
          <LLMSelector />
          <div className="flex gap-6 text-sm">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`transition-colors font-medium ${
                  pathname.startsWith(href)
                    ? 'text-orange-500 border-b-2 border-orange-500 pb-0.5'
                    : 'text-primary hover:text-orange-500'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}