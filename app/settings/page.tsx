import Link from 'next/link'

const SETTINGS_LINKS = [
  {
    href: '/settings/llm',
    title: 'LLM Configuration',
    description: 'Configure AI providers, manage failover priority, and test connections.',
    badge: null
  },
  {
    href: '/settings/preferences',
    title: 'Preferences',
    description: 'Set your default learning tier, analysis mode, topic count, and categories of interest.',
    badge: 'affects API calls'
  },
]

export default function SettingsPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SETTINGS_LINKS.map(({ href, title, description, badge }) => (
          <Link
            key={href}
            href={href}
            className="bg-white border border-gray-200 rounded-xl p-8 flex items-start justify-between gap-4 hover:border-orange-200 hover:bg-orange-50/30 transition-colors"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-medium text-primary">{title}</h2>
                {badge && (
                  <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full">
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-secondary">{description}</p>
            </div>
            <span className="text-muted text-sm shrink-0">→</span>
          </Link>
        ))}
      </div>
    </div>
  )
}