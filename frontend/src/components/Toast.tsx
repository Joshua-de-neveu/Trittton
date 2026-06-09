import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

export interface Toast {
  id: number
  message: string
  // If provided, the toast shows an "Undo" button that invokes this.
  undo?: () => void
  // ms until auto-dismiss. Default 6000.
  durationMs?: number
  // Visual variant.
  tone?: 'default' | 'success' | 'error'
}

interface ToastContextValue {
  showToast: (toast: Omit<Toast, 'id'>) => number
  dismissToast: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextIdRef = useRef(1)
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const showToast = useCallback((toast: Omit<Toast, 'id'>): number => {
    const id = nextIdRef.current++
    const full: Toast = { ...toast, id }
    setToasts((prev) => [...prev, full])
    const duration = toast.durationMs ?? 6000
    if (duration > 0) {
      const timer = setTimeout(() => {
        // Direct setter instead of dismissToast() to avoid stale callbacks.
        setToasts((prev) => prev.filter((t) => t.id !== id))
        timersRef.current.delete(id)
      }, duration)
      timersRef.current.set(id, timer)
    }
    return id
  }, [])

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach((t) => clearTimeout(t))
      timers.clear()
    }
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem
            key={t.id}
            toast={t}
            onDismiss={() => dismissToast(t.id)}
            onUndo={
              t.undo
                ? () => {
                    t.undo?.()
                    dismissToast(t.id)
                  }
                : undefined
            }
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

interface ToastItemProps {
  toast: Toast
  onDismiss: () => void
  onUndo?: () => void
}

function ToastItem({ toast, onDismiss, onUndo }: ToastItemProps) {
  const tone = toast.tone ?? 'default'
  const toneClasses =
    tone === 'success' ? 'border-green/30 bg-green/10 text-text'
    : tone === 'error' ? 'border-red/30 bg-red/10 text-text'
    : 'border-border bg-card text-text'

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 min-w-[280px] max-w-md px-4 py-2.5 rounded-xl border shadow-xl backdrop-blur ${toneClasses} animate-fade-in`}
      role="status"
      aria-live="polite"
    >
      <div className="flex-1 text-[13px] leading-snug">{toast.message}</div>
      {onUndo && (
        <button
          onClick={onUndo}
          className="text-[12px] font-semibold text-accent hover:text-accent/80 cursor-pointer px-2 py-1 rounded-md hover:bg-accent/10"
        >
          Undo
        </button>
      )}
      <button
        onClick={onDismiss}
        className="text-dim hover:text-text cursor-pointer text-lg leading-none px-1"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}
