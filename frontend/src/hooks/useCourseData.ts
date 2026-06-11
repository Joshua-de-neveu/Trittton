import { useState, useCallback } from 'react'
import type { Course } from '../types'
import { idbGet, idbSet } from '../lib/idbCache'

// Per-term cache key so switching terms doesn't show stale data from another quarter.
function cacheKey(term?: string): string {
  return `courses:${term || 'current'}`
}

export function useCourseData() {
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadFromFile = useCallback((file: File) => {
    setIsLoading(true)
    setError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (!Array.isArray(data)) throw new Error('Expected an array of courses')
        setCourses(data)
        setIsLoaded(true)
      } catch {
        setError('Could not parse JSON — make sure it\'s a valid all_courses.json file.')
      } finally {
        setIsLoading(false)
      }
    }
    reader.onerror = () => {
      setError('Failed to read file.')
      setIsLoading(false)
    }
    reader.readAsText(file)
  }, [])

  const loadFromServer = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/courses')
      if (!res.ok) throw new Error(`Server returned ${res.status}`)
      const data = await res.json()
      if (!Array.isArray(data)) throw new Error('Expected an array of courses')
      setCourses(data)
      setIsLoaded(true)
      // Update the cache so subsequent cold loads are instant.
      idbSet(cacheKey(), data, res.headers.get('ETag') ?? undefined).catch(() => {})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load from server')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Silent auto-load — first try IndexedDB so the UI is interactive within ~50ms even on a
  // cold load. Then revalidate from the server in the background. If the cache is empty we
  // fall back to a 3-second server fetch with the original behavior.
  const autoLoad = useCallback(async (): Promise<boolean> => {
    setIsLoading(true)
    let usedCache = false
    try {
      const cached = await idbGet<Course[]>(cacheKey())
      if (cached && Array.isArray(cached.value) && cached.value.length > 0) {
        setCourses(cached.value)
        setIsLoaded(true)
        setIsLoading(false)
        usedCache = true
        // Background revalidation. If the server responds with fresh data, swap it in
        // silently. Network failures are non-fatal here because we already have data.
        ;(async () => {
          try {
            const headers: HeadersInit = cached.etag ? { 'If-None-Match': cached.etag } : {}
            const res = await fetch('/api/courses', { headers })
            if (res.status === 304) return // unchanged
            if (!res.ok) return
            const data = await res.json()
            if (Array.isArray(data) && data.length > 0) {
              setCourses(data)
              idbSet(cacheKey(), data, res.headers.get('ETag') ?? undefined).catch(() => {})
            }
          } catch { /* offline — keep using cache */ }
        })()
        return true
      }

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 3000)
      const res = await fetch('/api/courses', { signal: controller.signal })
      clearTimeout(timeout)
      if (!res.ok) return false
      const data = await res.json()
      if (!Array.isArray(data) || data.length === 0) return false
      setCourses(data)
      setIsLoaded(true)
      idbSet(cacheKey(), data, res.headers.get('ETag') ?? undefined).catch(() => {})
      return true
    } catch {
      return usedCache
    } finally {
      if (!usedCache) setIsLoading(false)
    }
  }, [])

  const loadFromData = useCallback((data: Course[]) => {
    setCourses(data)
    setIsLoaded(true)
    setError(null)
    idbSet(cacheKey(), data).catch(() => {})
  }, [])

  return { courses, isLoaded, isLoading, error, loadFromFile, loadFromServer, autoLoad, loadFromData }
}
