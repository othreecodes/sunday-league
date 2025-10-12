import './ShimmerLoader.css'

interface ShimmerLoaderProps {
  type?: 'card' | 'list' | 'table' | 'text'
  count?: number
}

export default function ShimmerLoader({ type = 'card', count = 3 }: ShimmerLoaderProps) {
  const items = Array.from({ length: count }, (_, i) => i)

  if (type === 'card') {
    return (
      <div className="shimmer-container">
        {items.map((i) => (
          <div key={i} className="shimmer-card">
            <div className="shimmer shimmer-header" />
            <div className="shimmer shimmer-title" />
            <div className="shimmer shimmer-text" />
            <div className="shimmer shimmer-text short" />
          </div>
        ))}
      </div>
    )
  }

  if (type === 'list') {
    return (
      <div className="shimmer-container">
        {items.map((i) => (
          <div key={i} className="shimmer-list-item">
            <div className="shimmer shimmer-avatar" />
            <div className="shimmer-list-content">
              <div className="shimmer shimmer-title" />
              <div className="shimmer shimmer-text short" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'table') {
    return (
      <div className="shimmer-table">
        <div className="shimmer-table-header">
          <div className="shimmer shimmer-header-cell" />
          <div className="shimmer shimmer-header-cell" />
          <div className="shimmer shimmer-header-cell" />
        </div>
        {items.map((i) => (
          <div key={i} className="shimmer-table-row">
            <div className="shimmer shimmer-cell" />
            <div className="shimmer shimmer-cell" />
            <div className="shimmer shimmer-cell short" />
          </div>
        ))}
      </div>
    )
  }

  // text type
  return (
    <div className="shimmer-container">
      {items.map((i) => (
        <div key={i} className="shimmer shimmer-text-line" />
      ))}
    </div>
  )
}
