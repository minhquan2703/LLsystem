'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import styles from './alert.context.module.css'

type AlertType = 'success' | 'error' | 'warning' | 'info'

interface IAlert {
  id: string
  type: AlertType
  title: string
  message?: string
  exiting: boolean
}

interface AlertContextValue {
  alert: (type: AlertType, title: string, message?: string) => void
}

const AlertContext = createContext<AlertContextValue | null>(null)

export const useAlert = () => {
  const ctx = useContext(AlertContext)
  if (!ctx) throw new Error('useAlert must be used within AlertProvider')
  return ctx
}

const TOKENS: Record<AlertType, { color: string; icon: React.ReactNode }> = {
  success: {
    color: '#16a34a',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M2.5 7.5l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  error: {
    color: '#dc2626',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M3.5 3.5l8 8M11.5 3.5l-8 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
  },
  warning: {
    color: '#d97706',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M7.5 4.5v4M7.5 10.5v.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
  },
  info: {
    color: '#2563eb',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M7.5 6.5v4M7.5 4.5v.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
  },
}

function AlertCard({ item, onClose }: { item: IAlert; onClose: (id: string) => void }) {
  const { color, icon } = TOKENS[item.type]
  const canClose = item.type !== 'success'

  const cardClass = [
    styles.card,
    item.exiting && styles.exiting,
    canClose && styles.hasClose,
    item.type === 'success' && styles.hasProgress,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      role="alert"
      className={cardClass}
      style={{ '--accent': color } as React.CSSProperties}
    >
      <span className={styles.icon}>{icon}</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p className={styles.title}>{item.title}</p>
        {item.message && <p className={styles.message}>{item.message}</p>}
      </div>

      {canClose && (
        <button className={styles.closeBtn} onClick={() => onClose(item.id)}>
          ×
        </button>
      )}

      {item.type === 'success' && <div className={styles.progress} />}
    </div>
  )
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<IAlert[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const remove = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, exiting: true } : a))
    setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== id)), 200)
  }, [])

  const alert = useCallback(
    (type: AlertType, title: string, message?: string) => {
      const id = crypto.randomUUID()
      setAlerts(prev => [...prev, { id, type, title, message, exiting: false }])
      if (type === 'success') setTimeout(() => remove(id), 3000)
    },
    [remove],
  )

  return (
    <AlertContext.Provider value={{ alert }}>
      {children}
      {mounted &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              alignItems: 'center',
              pointerEvents: 'none',
              width: 'max-content',
              maxWidth: 'calc(100vw - 48px)',
            }}
          >
            {alerts.map(item => (
              <AlertCard key={item.id} item={item} onClose={remove} />
            ))}
          </div>,
          document.body,
        )}
    </AlertContext.Provider>
  )
}
