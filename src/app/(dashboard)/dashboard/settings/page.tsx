"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SettingsPage() {
  const { user, isLoaded } = useUser()
  const [isSaving, setIsSaving] = useState(false)

  if (!isLoaded) {
    return <div className="p-6 lg:p-8">Loading...</div>
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="meta-pixel">Meta Pixel</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  type="email" 
                  value={user?.emailAddresses[0]?.emailAddress || ""} 
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input 
                  type="text" 
                  placeholder="Your name"
                  defaultValue={user?.fullName || ""}
                />
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Input type="text" placeholder="UTC" defaultValue="UTC" />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meta Pixel Tab */}
        <TabsContent value="meta-pixel">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Meta Pixel</CardTitle>
              <CardDescription>
                Connect Meta Pixel to track conversions from video views
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Pixel ID</Label>
                <Input placeholder="e.g., 123456789" />
                <p className="text-sm text-gray-500">
                  Find your Pixel ID in Meta Events Manager
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">What we track:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• PageView when player loads</li>
                  <li>• VideoView at 25%, 50%, 75%, 100% milestones</li>
                  <li>• Lead when email is captured</li>
                  <li>• Custom events for CTA clicks</li>
                </ul>
              </div>
              <Button>Save Pixel ID</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>
                Connect third-party services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <span className="text-orange-600 font-bold">Z</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Zapier</h4>
                      <p className="text-sm text-gray-500">Connect to 5000+ apps</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Coming Soon</Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <span className="text-orange-600 font-bold">H</span>
                    </div>
                    <div>
                      <h4 className="font-medium">HubSpot</h4>
                      <p className="text-sm text-gray-500">CRM integration</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Coming Soon</Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-bold">G</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Google Analytics</h4>
                      <p className="text-sm text-gray-500">GA4 integration</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Coming Soon</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
