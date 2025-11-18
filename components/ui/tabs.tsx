"use client"

import { useState, createContext, useContext, ReactNode } from 'react'

interface TabsContextProps {
  activeTab: string
  setActiveTab: (label: string) => void
}

const TabsContext = createContext<TabsContextProps | undefined>(undefined)

function useTabs() {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('useTabs must be used within a TabsProvider')
  }
  return context
}

export function Tabs({ children, defaultTab }: { children: ReactNode, defaultTab: string }) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabList({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-1 border-b" style={{ borderColor: 'var(--border-primary)' }}>
      {children}
    </div>
  )
}

export function Tab({ children, label }: { children: ReactNode, label: string }) {
  const { activeTab, setActiveTab } = useTabs()
  const isActive = activeTab === label

  return (
    <button
      onClick={() => setActiveTab(label)}
      className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors rounded-t-md"
      style={{
        color: isActive ? 'var(--text-bright)' : 'var(--text-dimmer)',
        backgroundColor: isActive ? 'rgba(var(--accent-primary-rgb), 0.08)' : 'transparent',
        borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
      }}
    >
      {children}
    </button>
  )
}

export function TabPanel({ children, label }: { children: ReactNode, label: string }) {
  const { activeTab } = useTabs()
  const isActive = activeTab === label

  // The outer div with padding was moved to release-detail-layout.tsx
  // so this can just return the children.
  return isActive ? <>{children}</> : null
}
