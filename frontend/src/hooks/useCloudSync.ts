import { useEffect, useRef, useState } from 'react'
import { loadFromCloud, saveToCloud, readLocalMeta, writeLocalMeta } from '../lib/cloudSync'

export type CloudSyncStatus = 'idle' | 'loading' | 'syncing' | 'synced' | 'error' | 'offline'

interface UseCloudSyncOptions<T> {
  // Stable identifier for the user (Firebase uid). When null, sync is disabled (offline).
  uid: string | null
  // Logical name of the data being synced. Used as the Firestore doc key + localStorage meta key.
  key: string
  // Current value to sync up to the cloud. Reference identity drives write debouncing.
  value: T
  // Called when the cloud has a newer value than local. Should overwrite local state.
  applyRemote: (remote: T) => void
  // Skip cloud writes (e.g. while we're still hydrating from cloud on first load).
  skipWrite?: boolean
  // Optional value equality check — skip writes that don't actually change the data.
  isEqual?: (a: T, b: T) => boolean
  // Debounce window in ms for cloud writes. Default 1.5s.
  debounceMs?: number
}

// Bridges a piece of localStorage-backed state to a Firestore doc at users/{uid}/state/{key}.
//
// Flow on uid change:
//   1) Read remote doc.
//   2) If remote.clientUpdatedAt > local meta clientUpdatedAt → applyRemote(...) and stamp local meta.
//   3) If remote is older (or missing) → push local value up to cloud.
//
// Subsequent local changes: debounced write to cloud + bump local meta. Last-write-wins.
export function useCloudSync<T>(opts: UseCloudSyncOptions<T>): CloudSyncStatus {
  const { uid, key, value, applyRemote, skipWrite, isEqual, debounceMs = 1500 } = opts
  const [status, setStatus] = useState<CloudSyncStatus>(uid ? 'loading' : 'offline')
  const hydratedRef = useRef(false)
  const lastWrittenRef = useRef<T | null>(null)
  const writeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Keep latest applyRemote in a ref so we don't re-run the hydration effect every render.
  const applyRemoteRef = useRef(applyRemote)
  applyRemoteRef.current = applyRemote

  // Hydration: on uid available, decide local vs remote.
  useEffect(() => {
    if (!uid) {
      setStatus('offline')
      hydratedRef.current = false
      return
    }
    let cancelled = false
    setStatus('loading')
    ;(async () => {
      const remote = await loadFromCloud<T>(uid, key)
      if (cancelled) return
      const localMeta = readLocalMeta(key)
      const localMs = localMeta?.clientUpdatedAt ?? 0
      if (remote && remote.clientUpdatedAt > localMs) {
        applyRemoteRef.current(remote.data)
        writeLocalMeta(key, { clientUpdatedAt: remote.clientUpdatedAt })
        lastWrittenRef.current = remote.data
      } else if (!remote || remote.clientUpdatedAt < localMs) {
        // Local is newer (or remote is absent) — push current value up.
        const now = Date.now()
        const ok = await saveToCloud(uid, key, value, now)
        if (!cancelled) {
          if (ok) writeLocalMeta(key, { clientUpdatedAt: now })
          lastWrittenRef.current = value
        }
      } else {
        lastWrittenRef.current = remote?.data ?? value
      }
      if (!cancelled) {
        hydratedRef.current = true
        setStatus('synced')
      }
    })().catch(() => {
      if (!cancelled) setStatus('error')
    })
    return () => { cancelled = true }
    // We intentionally only re-run when uid or key changes — not on every value tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, key])

  // Write side: debounced push when value changes after hydration.
  useEffect(() => {
    if (!uid || !hydratedRef.current || skipWrite) return
    if (lastWrittenRef.current !== null && (isEqual ? isEqual(value, lastWrittenRef.current) : value === lastWrittenRef.current)) {
      return
    }
    setStatus('syncing')
    if (writeTimerRef.current) clearTimeout(writeTimerRef.current)
    writeTimerRef.current = setTimeout(async () => {
      const now = Date.now()
      const ok = await saveToCloud(uid, key, value, now)
      if (ok) {
        writeLocalMeta(key, { clientUpdatedAt: now })
        lastWrittenRef.current = value
        setStatus('synced')
      } else {
        setStatus('error')
      }
    }, debounceMs)
    return () => {
      if (writeTimerRef.current) clearTimeout(writeTimerRef.current)
    }
  }, [uid, key, value, skipWrite, isEqual, debounceMs])

  return status
}
