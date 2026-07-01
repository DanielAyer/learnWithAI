import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="font-mono text-4xl font-semibold tracking-tight mb-4">
        learn <span className="text-orange-500">{'{ }'}</span> with AI
      </h1>
      <p className="text-gray-500 text-lg max-w-md mb-8">
        Turn your Claude conversations into a personal curriculum.
        Surface knowledge gaps. Study what matters.
      </p>
      <div className="flex gap-4">
        <Link
          href="/conversations"
          className="bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors"
        >
          View Conversations
        </Link>
        <Link
          href="/topics"
          className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          View Topics
        </Link>
      </div>
    </div>
  )
}