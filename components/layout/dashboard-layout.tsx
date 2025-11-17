"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface SidebarLinkProps {
  href: string
  icon: string
  label: string
}

function SidebarLink({ href, icon, label }: SidebarLinkProps) {
  const pathname = usePathname()
  const isActive = pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded transition-colors",
        isActive
          ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-l-4 border-[var(--accent-primary)]"
          : "text-[var(--text-dim)] hover:bg-[var(--bg-interactive)] hover:text-[var(--text-bright)]"
      )}
    >
      <span className="text-xl">{icon}</span>
      <span className="font-medium uppercase text-sm tracking-wide">{label}</span>
    </Link>
  )
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--bg-deep-dark)" }}>
      {/* Sidebar */}
      <aside
        className="w-60 flex flex-col border-r-2"
        style={{
          backgroundColor: "var(--bg-main)",
          borderColor: "var(--border-primary)",
        }}
      >
        {/* Header */}
        <div
          className="p-6 border-b-2"
          style={{ borderColor: "var(--border-primary)" }}
        >
          <h1
            className="text-xl font-bold uppercase tracking-wide"
            style={{ color: "var(--text-bright)" }}
          >
            ENGELOOP
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-dimmer)" }}>
            Catalog Manager
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <SidebarLink href="/releases" icon="📀" label="Releases" />
          <SidebarLink href="/people" icon="👥" label="People & Artists" />
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1">{children}</main>
    </div>
  )
}
