'use client'

export default function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  }

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizes[size]} border-primary border-t-transparent rounded-full animate-spin`}
      />
    </div>
  )
}
