import { useState, useCallback, useEffect } from 'react'
import { useCloudSync, type CloudSyncStatus } from './useCloudSync'

const STORAGE_KEY = 'ucsd-completed-courses'

export interface CompletedCourse {
  course_code: string
  title: string
}

function loadFromStorage(): CompletedCourse[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function useCompletedCourses(uid: string | null = null) {
  const [completed, setCompleted] = useState<CompletedCourse[]>(loadFromStorage)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completed))
    } catch (e) {
      if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
        console.warn('[useCompletedCourses] localStorage quota exceeded')
      }
    }
  }, [completed])

  const cloudStatus: CloudSyncStatus = useCloudSync<CompletedCourse[]>({
    uid,
    key: 'completed-courses',
    value: completed,
    applyRemote: (remote) => setCompleted(Array.isArray(remote) ? remote : []),
  })

  const addCourse = useCallback((course: CompletedCourse) => {
    setCompleted((prev) => {
      if (prev.some((c) => c.course_code === course.course_code)) return prev
      return [...prev, course].sort((a, b) => a.course_code.localeCompare(b.course_code))
    })
  }, [])

  const removeCourse = useCallback((courseCode: string) => {
    setCompleted((prev) => prev.filter((c) => c.course_code !== courseCode))
  }, [])

  const clearAll = useCallback(() => {
    setCompleted([])
  }, [])

  // Restore a previous snapshot — used by Undo on Clear.
  const restoreAll = useCallback((prev: CompletedCourse[]) => {
    setCompleted(prev)
  }, [])

  const hasCompleted = useCallback(
    (courseCode: string) => completed.some((c) => c.course_code === courseCode),
    [completed],
  )

  // Get a formatted string for the AI context
  const asContextString = useCallback(() => {
    if (completed.length === 0) return ''
    return completed.map((c) => c.course_code).join(', ')
  }, [completed])

  return { completed, addCourse, removeCourse, clearAll, restoreAll, hasCompleted, asContextString, cloudStatus }
}
