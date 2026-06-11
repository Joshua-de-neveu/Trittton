// Tiny IndexedDB key-value store used to cache the course catalog (~1.5 MB) so we don't
// re-download it on every cold load. Not a general KV — just enough for this one use.

const DB_NAME = 'trittton-cache'
const DB_VERSION = 1
const STORE = 'kv'

interface CacheEntry<T> {
  value: T
  // Optional content tag (ETag / hash) so we can short-circuit a server fetch when nothing changed.
  etag?: string
  // Wall-clock time when this entry was stored.
  storedAt: number
}

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

export async function idbGet<T>(key: string): Promise<CacheEntry<T> | null> {
  try {
    const db = await openDb()
    return await new Promise<CacheEntry<T> | null>((resolve) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(key)
      req.onsuccess = () => resolve((req.result as CacheEntry<T> | undefined) ?? null)
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

export async function idbSet<T>(key: string, value: T, etag?: string): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite')
      const entry: CacheEntry<T> = { value, etag, storedAt: Date.now() }
      const req = tx.objectStore(STORE).put(entry, key)
      req.onsuccess = () => resolve()
      req.onerror = () => resolve()
    })
  } catch { /* swallow: cache is a best-effort layer */ }
}

export async function idbDelete(key: string): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite')
      const req = tx.objectStore(STORE).delete(key)
      req.onsuccess = () => resolve()
      req.onerror = () => resolve()
    })
  } catch { /* swallow */ }
}
