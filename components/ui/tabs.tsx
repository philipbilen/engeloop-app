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

export function TabList({ children, className }: { children: ReactNode, className?: string }) {
  return (
    <div className={`flex items-end gap-0 border-b border-[var(--border-primary)] w-full ${className || ''}`}>
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
      className={`
        px-6 py-3 text-sm font-medium transition-all relative top-[1px] border-t-2 border-x
        ${isActive 
          ? 'border-t-[var(--frost-blue)] border-x-[var(--border-primary)] border-b-transparent bg-[var(--bg-secondary)] text-[var(--text-bright)] z-10' 
          : 'border-transparent text-[var(--text-dimmer)] hover:text-[var(--text-dim)] hover:bg-white/5'
        }
      `}
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
