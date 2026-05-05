"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser, UserButton, ClerkLoading } from "@clerk/nextjs"
import {
  LayoutDashboard,
  Play,
  Download,
  Video,
  BarChart3,
  Settings,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Videos", href: "/dashboard/videos", icon: Video },
  { name: "Installations", href: "/dashboard/installations", icon: Download },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user, isLoaded } = useUser()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50" suppressHydrationWarning>
      {/* Mobile menu button */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-white rounded-lg shadow"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar - Desktop */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-white border-r transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
        suppressHydrationWarning
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b" suppressHydrationWarning>
          <Link href="/dashboard" className="flex items-center gap-2" suppressHydrationWarning>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0" suppressHydrationWarning>
              <Play className="w-4 h-4 text-white" fill="white" suppressHydrationWarning />
            </div>
            {!collapsed && (
              <span className="font-bold text-lg" suppressHydrationWarning>YouTube Shell</span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1" suppressHydrationWarning>
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-gray-700 hover:bg-gray-100"
                )}
                suppressHydrationWarning
              >
                <item.icon className="w-5 h-5 shrink-0" suppressHydrationWarning />
                {!collapsed && <span suppressHydrationWarning>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User Menu */}
        <div className="p-3 border-t" suppressHydrationWarning>
          <ClerkLoading>
            <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")} suppressHydrationWarning>
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" suppressHydrationWarning />
              {!collapsed && (
                <div className="flex-1 min-w-0" suppressHydrationWarning>
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-1" suppressHydrationWarning />
                  <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" suppressHydrationWarning />
                </div>
              )}
            </div>
          </ClerkLoading>
          {isLoaded && user ? (
            <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")} suppressHydrationWarning>
              <UserButton />
              {!collapsed && (
                <div className="flex-1 min-w-0" suppressHydrationWarning>
                  <p className="text-sm font-medium truncate" suppressHydrationWarning>{user.fullName || "User"}</p>
                  <p className="text-xs text-gray-500 truncate" suppressHydrationWarning>{user.emailAddresses[0]?.emailAddress}</p>
                </div>
              )}
            </div>
          ) : isLoaded && !user && (
            <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")} suppressHydrationWarning>
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xs" suppressHydrationWarning>TU</div>
              {!collapsed && (
                <div className="flex-1 min-w-0" suppressHydrationWarning>
                  <p className="text-sm font-medium truncate" suppressHydrationWarning>Test User</p>
                  <p className="text-xs text-gray-500 truncate" suppressHydrationWarning>test@example.com</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Collapse button */}
        <div className="p-3 border-t" suppressHydrationWarning>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </aside>

      {/* Sidebar - Mobile */}
      {mobileOpen && (
        <aside className="fixed inset-0 z-40 lg:hidden" suppressHydrationWarning>
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 h-full bg-white p-4" suppressHydrationWarning>
            {/* Logo */}
            <div className="flex items-center justify-between h-16 border-b mb-4" suppressHydrationWarning>
              <Link href="/dashboard" className="flex items-center gap-2" suppressHydrationWarning>
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center" suppressHydrationWarning>
                  <Play className="w-4 h-4 text-white" fill="white" suppressHydrationWarning />
                </div>
                <span className="font-bold text-lg" suppressHydrationWarning>YouTube Shell</span>
              </Link>
              <button onClick={() => setMobileOpen(false)} suppressHydrationWarning>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Info */}
            <ClerkLoading>
              <div className="flex items-center gap-3 p-3 mb-4 bg-gray-50 rounded-lg" suppressHydrationWarning>
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" suppressHydrationWarning />
                <div className="flex-1" suppressHydrationWarning>
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-1" suppressHydrationWarning />
                  <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" suppressHydrationWarning />
                </div>
              </div>
            </ClerkLoading>
            {isLoaded && user && (
              <div className="flex items-center gap-3 p-3 mb-4 bg-gray-50 rounded-lg" suppressHydrationWarning>
                <UserButton />
                <div className="flex-1 min-w-0" suppressHydrationWarning>
                  <p className="text-sm font-medium truncate" suppressHydrationWarning>{user.fullName || "User"}</p>
                  <p className="text-xs text-gray-500 truncate" suppressHydrationWarning>{user.emailAddresses[0]?.emailAddress}</p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav className="space-y-1" suppressHydrationWarning>
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                    suppressHydrationWarning
                  >
                    <item.icon className="w-5 h-5" suppressHydrationWarning />
                    <span suppressHydrationWarning>{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </aside>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto" suppressHydrationWarning>
        {children}
      </main>
    </div>
  )
}
