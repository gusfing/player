"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Play, TrendingUp, Loader2, Users } from "lucide-react"

interface Installation {
  id: string
  totalPlays: number
  totalViews: number
  status: string
}

interface DashboardStats {
  totalInstallations: number
  activeInstallations: number
  totalPlays: number
  totalViews: number
  totalLeads: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalInstallations: 0,
    activeInstallations: 0,
    totalPlays: 0,
    totalViews: 0,
    totalLeads: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/installations")
      if (response.ok) {
        const installations = await response.json()
        
        const totalPlays = installations.reduce((acc: number, inst: Installation) => acc + (inst.totalPlays || 0), 0)
        const totalViews = installations.reduce((acc: number, inst: Installation) => acc + (inst.totalViews || 0), 0)
        const activeCount = installations.filter((i: Installation) => i.status === "active").length

        setStats({
          totalInstallations: installations.length,
          activeInstallations: activeCount,
          totalPlays,
          totalViews,
          totalLeads: 0,
        })
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const statCards = [
    { name: "Total Installations", value: stats.totalInstallations, icon: Download, change: "Websites connected" },
    { name: "Active Installations", value: stats.activeInstallations, icon: TrendingUp, change: "Currently tracking" },
    { name: "Total Plays", value: stats.totalPlays, icon: Play, change: "Video plays" },
    { name: "Leads Captured", value: stats.totalLeads, icon: Users, change: "Email captures" },
  ]

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here&apos;s an overview of your video performance.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {isLoading ? (
          <Card>
            <CardContent className="p-6 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : (
          statCards.map((stat) => (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/installations/new" className="block">
              <div className="p-4 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="font-medium">Add New Installation</div>
                <p className="text-sm text-gray-500">Connect a website or platform</p>
              </div>
            </Link>
            <Link href="/dashboard/installations" className="block">
              <div className="p-4 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="font-medium">Manage Installations</div>
                <p className="text-sm text-gray-500">Customize branding and view stats</p>
              </div>
            </Link>
            <Link href="/dashboard/analytics" className="block">
              <div className="p-4 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="font-medium">View Analytics</div>
                <p className="text-sm text-gray-500">See who&apos;s watching your videos</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                <span>Add your website domain</span>
              </li>
              <li className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                <span>Install plugin or copy embed code</span>
              </li>
              <li className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                <span>Plugin connects automatically</span>
              </li>
              <li className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">4</span>
                <span>Track all YouTube videos!</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
