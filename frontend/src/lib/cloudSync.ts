import { app } from './firebase'

// All user-scoped state lives at: users/{uid}/state/{key}
// Each doc shape: { data: T (JSON-safe), updatedAt: Timestamp, clientUpdatedAt: number }
//
// `clientUpdatedAt` is a millis timestamp set by the client at write time. We use it for
// merge decisions because serverTimestamp() is async and can briefly be null after a write.

// Lazy-load firebase/firestore on first sync to avoid bloating the initial JS bundle.
// The Firestore SDK is ~200 KB ungzipped — only users who actually sign in pay that cost.
type FirestoreFns = typeof import('firebase/firestore')
let firestoreModulePromise: Promise<FirestoreFns> | null = null
type FirestoreInstance = ReturnType<FirestoreFns['getFirestore']>
let dbInstance: FirestoreInstance | null = null

async function getFirestoreFns(): Promise<{ fns: FirestoreFns; db: FirestoreInstance }> {
  if (!firestoreModulePromise) {
    firestoreModulePromise = import('firebase/firestore')
  }
  const fns = await firestoreModulePromise
  if (!dbInstance) {
    dbInstance = fns.getFirestore(app)
  }
  return { fns, db: dbInstance }
}

const META_SUFFIX = '__cloudMeta__'

interface CloudMeta {
  clientUpdatedAt: number
}

function metaKey(key: string): string {
  return `${key}${META_SUFFIX}`
}

export function readLocalMeta(key: string): CloudMeta | null {
  try {
    const raw = localStorage.getItem(metaKey(key))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function writeLocalMeta(key: string, meta: CloudMeta): void {
  try {
    localStorage.setItem(metaKey(key), JSON.stringify(meta))
  } catch { /* quota — ignore */ }
}

export interface CloudReadResult<T> {
  data: T
  clientUpdatedAt: number
  serverUpdatedAt: number | null
}

export async function loadFromCloud<T>(uid: string, key: string): Promise<CloudReadResult<T> | null> {
  try {
    const { fns, db } = await getFirestoreFns()
    const snap = await fns.getDoc(fns.doc(db, 'users', uid, 'state', key))
    if (!snap.exists()) return null
    const raw = snap.data() as { data?: T; updatedAt?: { toMillis(): number }; clientUpdatedAt?: number } | undefined
    if (!raw || raw.data === undefined) return null
    const serverMs = raw.updatedAt ? raw.updatedAt.toMillis() : null
    return {
      data: raw.data,
      clientUpdatedAt: raw.clientUpdatedAt || serverMs || 0,
      serverUpdatedAt: serverMs,
    }
  } catch (err) {
    console.warn('[cloudSync] load failed', key, err)
    return null
  }
}

export async function saveToCloud<T>(uid: string, key: string, data: T, clientUpdatedAt: number): Promise<boolean> {
  try {
    const { fns, db } = await getFirestoreFns()
    await fns.setDoc(fns.doc(db, 'users', uid, 'state', key), {
      data,
      updatedAt: fns.serverTimestamp(),
      clientUpdatedAt,
    })
    return true
  } catch (err) {
    console.warn('[cloudSync] save failed', key, err)
    return false
  }
}
