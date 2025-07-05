"use client"

import * as React from "react"
import { X } from "lucide-react"

export interface ToastProps {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  onClose: () => void
  duration?: number
}

export function Toast({ id, title, description, action, onClose, duration = 3000 }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <div className="fixed bottom-4 right-4 z-50 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-4 max-w-sm animate-in slide-in-from-bottom-2">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {title && <div className="font-semibold text-white text-sm">{title}</div>}
          {description && <div className="text-white/70 text-xs mt-1">{description}</div>}
        </div>
        <button onClick={onClose} className="ml-3 text-white/50 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
