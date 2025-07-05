"use client"

import { Toast } from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

export function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          title={toast.title}
          description={toast.description}
          action={toast.action}
          onClose={() => removeToast(toast.id)}
          duration={toast.duration}
        />
      ))}
    </>
  )
}
