import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'
import LLMSelector from '@/components/LLMSelector'

export const metadata: Metadata = {
  title: 'Learn { } With AI',
  description: 'An LLM agnostic, local-first web app that analyzes your Claude conversation history and generates a personalized learning curriculum.',
}

const NAV_LINKS = [
  { href: '/queue', label: 'Learn' },
  { href: '/conversations', label: 'Conversations' },
  { href: '/settings', label: 'Settings' },
]

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen text-primary">
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
                    className="text-black hover:text-black transition-colors"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}