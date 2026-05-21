import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
  warning: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}

const STYLES: Record<ToastType, string> = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  warning: 'bg-yellow-500',
  info: 'bg-blue-600',
}

const DURATION = 4000

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))

    timerRef.current = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onRemove(toast.id), 300)
    }, DURATION)

    return () => clearTimeout(timerRef.current)
  }, [toast.id, onRemove])

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium
        transition-all duration-300 min-w-64 max-w-sm
        ${STYLES[toast.type]}
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
    >
      <span className="text-base leading-none">{ICONS[toast.type]}</span>
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => {
          clearTimeout(timerRef.current)
          setVisible(false)
          setTimeout(() => onRemove(toast.id), 300)
        }}
        className="opacity-70 hover:opacity-100 text-lg leading-none ml-1"
      >
        ×
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const add = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, type, message }])
  }, [])

  const value: ToastContextValue = {
    toast: add,
    success: (msg) => add(msg, 'success'),
    error: (msg) => add(msg, 'error'),
    warning: (msg) => add(msg, 'warning'),
    info: (msg) => add(msg, 'info'),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
