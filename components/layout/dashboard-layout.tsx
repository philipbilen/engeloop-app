"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface SidebarLinkProps {
  href: string
  label: string
}

function SidebarLink({ href, label }: SidebarLinkProps) {
  const pathname = usePathname()
  const isActive = pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-3 rounded-lg transition-all border",
        isActive
          ? "bg-white/10 text-white border-white/15 shadow-[0_8px_20px_rgba(0,0,0,0.18)]"
          : "text-white/70 border-transparent hover:bg-white/5 hover:text-white hover:border-white/10"
      )}
    >
      <span className="h-2 w-2 rounded-full border border-current opacity-60" aria-hidden />
      <span className="font-medium uppercase text-sm tracking-wide">{label}</span>
    </Link>
  )
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div
      className="flex min-h-screen"
      style={{
        background: "radial-gradient(circle at 10% 20%, rgba(79,70,229,0.05), transparent 34%), radial-gradient(circle at 90% 10%, rgba(16,185,129,0.04), transparent 28%), var(--bg-page)",
      }}
    >
      {/* Sidebar */}
      <aside
        className="w-64 flex flex-col border-r shadow-[var(--shadow-card)]"
        style={{
          background: "linear-gradient(180deg, #111827 0%, #0B1220 100%)",
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        {/* Header */}
        <div
          className="p-6 border-b"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <h1
            className="text-xl font-bold uppercase tracking-wide"
            style={{ color: "#F8FAFC" }}
          >
            ENGELOOP
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>
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
      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
