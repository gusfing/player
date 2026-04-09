"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, ExternalLink, Settings, MoreVertical, Trash2, RefreshCw, BarChart2 } from "lucide-react"

interface Installation {
  id: string
  domain: string
  platform: string
  status: string
  totalPlays: number
  totalViews: number
  lastActivityAt: string | null
  lastHeartbeatAt: string | null
  createdAt: string
}

export default function InstallationsPage() {
  const router = useRouter()
  const [installations, setInstallations] = useState<Installation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchInstallations()
  }, [])

  const fetchInstallations = async () => {
    try {
      const response = await fetch("/api/installations")
      if (response.ok) {
        const data = await response.json()
        setInstallations(data)
      }
    } catch (err) {
      console.error("Failed to fetch installations:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>
      case "disconnected":
        return <Badge className="bg-orange-500">Disconnected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "wordpress":
        return <span className="text-xl">W</span>
      case "shopify":
        return <span className="text-xl">S</span>
      default:
        return <span className="text-xl">C</span>
    }
  }

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case "wordpress":
        return "WordPress"
      case "shopify":
        return "Shopify"
      default:
        return "Custom HTML"
    }
  }

  const formatLastActivity = (date: string | null) => {
    if (!date) return "Never"
    const now = new Date()
    const activity = new Date(date)
    const diff = now.getTime() - activity.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this installation? Analytics data will be retained.")) return
    
    try {
      const response = await fetch(`/api/installations/${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setInstallations(installations.filter((i) => i.id !== id))
      }
    } catch (err) {
      console.error("Failed to delete:", err)
    }
  }

  const groupedInstallations = {
    active: installations.filter((i) => i.status === "active"),
    pending: installations.filter((i) => i.status === "pending"),
    disconnected: installations.filter((i) => i.status === "disconnected"),
  }

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Installations</h1>
          <p className="text-gray-500 mt-1">Manage your connected websites and platforms</p>
        </div>
        <Link href="/dashboard/installations/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Installation
          </Button>
        </Link>
      </div>

      {installations.length === 0 ? (
        <Card className="max-w-2xl">
          <CardContent className="py-12 text-center">
            <div className="text-4xl mb-4">🌐</div>
            <h2 className="text-xl font-semibold mb-2">No installations yet</h2>
            <p className="text-gray-500 mb-6">
              Add your first website or platform to start tracking video analytics
            </p>
            <Link href="/dashboard/installations/new">
              <Button size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Installation
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Active Installations */}
          {groupedInstallations.active.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                Active ({groupedInstallations.active.length})
              </h2>
              <div className="grid gap-4">
                {groupedInstallations.active.map((installation) => (
                  <Card key={installation.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-lg">
                            {getPlatformIcon(installation.platform)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{installation.domain}</h3>
                              {getStatusBadge(installation.status)}
                            </div>
                            <p className="text-sm text-gray-500">
                              {getPlatformName(installation.platform)} • Last active {formatLastActivity(installation.lastActivityAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right mr-4">
                            <p className="font-semibold">{installation.totalPlays.toLocaleString()}</p>
                            <p className="text-sm text-gray-500">plays</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Link href={`/dashboard/installations/${installation.id}`}>
                              <Button variant="ghost" size="icon">
                                <BarChart2 className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Link href={`/dashboard/installations/${installation.id}`}>
                              <Button variant="ghost" size="icon">
                                <Settings className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDelete(installation.id)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Pending Installations */}
          {groupedInstallations.pending.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                Pending ({groupedInstallations.pending.length})
              </h2>
              <div className="grid gap-4">
                {groupedInstallations.pending.map((installation) => (
                  <Card key={installation.id} className="hover:shadow-md transition-shadow border-yellow-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-lg">
                            {getPlatformIcon(installation.platform)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{installation.domain}</h3>
                              {getStatusBadge(installation.status)}
                            </div>
                            <p className="text-sm text-gray-500">
                              {getPlatformName(installation.platform)} • Waiting for connection
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href={`/dashboard/installations/${installation.id}`}>
                            <Button variant="outline" size="sm">
                              View Instructions
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Disconnected Installations */}
          {groupedInstallations.disconnected.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                Disconnected ({groupedInstallations.disconnected.length})
              </h2>
              <div className="grid gap-4">
                {groupedInstallations.disconnected.map((installation) => (
                  <Card key={installation.id} className="hover:shadow-md transition-shadow border-orange-200 opacity-75">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-lg">
                            {getPlatformIcon(installation.platform)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{installation.domain}</h3>
                              {getStatusBadge(installation.status)}
                            </div>
                            <p className="text-sm text-gray-500">
                              {getPlatformName(installation.platform)} • Plugin may be uninstalled
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href={`/dashboard/installations/${installation.id}`}>
                            <Button variant="outline" size="sm">
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Reconnect
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
