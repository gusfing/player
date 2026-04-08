import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, Eye, Clock, Users } from "lucide-react"

export default function DashboardPage() {
  const stats = [
    { name: "Total Players", value: "0", icon: Play, change: "+0 this week" },
    { name: "Total Plays", value: "0", icon: Eye, change: "+0 this week" },
    { name: "Avg Watch Time", value: "0s", icon: Clock, change: "0% completion" },
    { name: "Active Viewers", value: "0", icon: Users, change: "Right now" },
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
        {stats.map((stat) => (
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
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <a href="/dashboard/players/new" className="block">
              <div className="p-4 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="font-medium">Create New Player</div>
                <p className="text-sm text-gray-500">Set up a new custom video player</p>
              </div>
            </a>
            <a href="/dashboard/installations" className="block">
              <div className="p-4 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="font-medium">Install on Your Site</div>
                <p className="text-sm text-gray-500">Add the player to WordPress or Shopify</p>
              </div>
            </a>
            <a href="/dashboard/analytics" className="block">
              <div className="p-4 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="font-medium">View Analytics</div>
                <p className="text-sm text-gray-500">See who&apos;s watching your videos</p>
              </div>
            </a>
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
                <span>Create your first video player</span>
              </li>
              <li className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                <span>Customize colors and branding</span>
              </li>
              <li className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                <span>Copy the embed code</span>
              </li>
              <li className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">4</span>
                <span>Add it to your website</span>
              </li>
              <li className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">5</span>
                <span>Track views in analytics</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
