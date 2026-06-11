import { useEffect, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

// Mounts the service worker registration once and shows a small "Update available"
// banner when a new build is ready. The reload is user-initiated so we don't yank
// the page out from under them mid-task.
export function PwaUpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const [updateFn, setUpdateFn] = useState<(() => void) | null>(null)

  useEffect(() => {
    let mounted = true
    try {
      const updater = registerSW({
        onNeedRefresh() {
          if (mounted) setNeedRefresh(true)
        },
      })
      if (mounted) setUpdateFn(() => () => { updater(true) })
    } catch {
      // SW disabled in dev — ignore.
    }
    return () => { mounted = false }
  }, [])

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-[150]">
      <div className="rounded-xl border border-accent/30 bg-card shadow-xl px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-text">Update available</div>
          <div className="text-[11px] text-muted">A newer version of Trittton is ready.</div>
        </div>
        <button
          onClick={() => updateFn?.()}
          className="px-3 py-1.5 rounded-md bg-accent text-white text-[12px] font-semibold cursor-pointer hover:bg-accent/90"
        >
          Reload
        </button>
      </div>
    </div>
  )
}
