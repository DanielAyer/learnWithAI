interface Props {
  category: string
  size?: 'sm' | 'md'
}

export default function CategoryBadge({ category, size = 'sm' }: Props) {
  return (
    <span className={`
      inline-flex items-center rounded-full font-medium bg-gray-100 text-secondary
      ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'}
    `}>
      {category}
    </span>
  )
}