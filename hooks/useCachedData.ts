import { useState, useEffect, useCallback } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
}

interface UseCachedDataOptions {
  cacheKey: string
  cacheDuration?: number // in milliseconds, default 5 minutes
}

interface UseCachedDataReturn<T> {
  data: T | null
  loading: boolean
  refreshing: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useCachedData<T>(
  fetchFn: () => Promise<T>,
  options: UseCachedDataOptions
): UseCachedDataReturn<T> {
  const { cacheKey, cacheDuration = 5 * 60 * 1000 } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Get cached data from localStorage
  const getCachedData = useCallback((): CacheEntry<T> | null => {
    try {
      const cached = localStorage.getItem(cacheKey)
      if (!cached) return null

      const entry: CacheEntry<T> = JSON.parse(cached)
      const isExpired = Date.now() - entry.timestamp > cacheDuration

      if (isExpired) {
        localStorage.removeItem(cacheKey)
        return null
      }

      return entry
    } catch (err) {
      console.error('Error reading cache:', err)
      return null
    }
  }, [cacheKey, cacheDuration])

  // Save data to localStorage
  const setCachedData = useCallback((newData: T) => {
    try {
      const entry: CacheEntry<T> = {
        data: newData,
        timestamp: Date.now()
      }
      localStorage.setItem(cacheKey, JSON.stringify(entry))
    } catch (err) {
      console.error('Error writing cache:', err)
    }
  }, [cacheKey])

  // Fetch fresh data
  const fetchData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const result = await fetchFn()
      setData(result)
      setCachedData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch data'))
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [fetchFn, setCachedData])

  // Initial load and refetch on cacheKey change
  useEffect(() => {
    const cached = getCachedData()

    if (cached) {
      // Show cached data immediately
      setData(cached.data)
      setLoading(false)

      // Fetch fresh data in background
      fetchData(true)
    } else {
      // No cache, show loading
      fetchData(false)
    }
  }, [cacheKey, getCachedData, fetchData])

  // Manual refetch function
  const refetch = useCallback(async () => {
    await fetchData(data !== null)
  }, [fetchData, data])

  return {
    data,
    loading,
    refreshing,
    error,
    refetch
  }
}
