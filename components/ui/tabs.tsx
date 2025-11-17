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
    <div className="flex items-center" style={{ borderBottom: '2px solid var(--border-primary)' }}>
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
      className="px-6 py-3 text-sm uppercase tracking-wider transition-colors"
      style={{
        color: isActive ? 'var(--text-bright)' : 'var(--text-dimmer)',
        fontWeight: isActive ? '600' : '500',
        borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
        marginBottom: '-2px',
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