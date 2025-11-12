import { RefreshCw } from 'lucide-react'
import './RefreshIndicator.css'

interface RefreshIndicatorProps {
  isRefreshing: boolean
}

export default function RefreshIndicator({ isRefreshing }: RefreshIndicatorProps) {
  if (!isRefreshing) return null

  return (
    <div className="refresh-indicator">
      <RefreshCw size={16} className="refresh-icon" />
    </div>
  )
}
