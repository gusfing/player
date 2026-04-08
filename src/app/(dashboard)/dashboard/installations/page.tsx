import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Code2, Globe, ShoppingBag, ExternalLink } from "lucide-react"

export default function InstallationsPage() {
  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Installations</h1>
        <p className="text-gray-500 mt-1">Connect your website platforms to install players</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* WordPress */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>WordPress</CardTitle>
                <CardDescription>Plugin for WordPress sites</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Install our plugin to easily add custom players to your WordPress site. 
              Supports Gutenberg blocks and shortcodes.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Auto-sync branding changes</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Built-in analytics</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                <span>No coding required</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1">
                <ExternalLink className="w-4 h-4 mr-2" />
                Download Plugin
              </Button>
              <Button variant="outline">
                View Docs
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Shopify */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <CardTitle>Shopify</CardTitle>
                <CardDescription>App for Shopify stores</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Install our app from the Shopify App Store to add custom players 
              to your product pages and boost conversions.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Works on product pages</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Auto-detect YouTube embeds</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                <span>One-click install</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1">
                <ExternalLink className="w-4 h-4 mr-2" />
                Coming Soon
              </Button>
              <Button variant="outline">
                View Docs
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* HTML Embed */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Code2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <CardTitle>HTML Embed</CardTitle>
                <CardDescription>Works on any website</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Add a single line of code to any website to embed your custom player. 
              Works on Wix, Webflow, Squarespace, and any custom HTML site.
            </p>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
              <code className="text-green-400">
                {`<script src="https://cdn.yourdomain.com/player.min.js" data-player-id="YOUR_ID"></script>`}
              </code>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Universal compatibility</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Copy-paste installation</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Full analytics tracking</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1">
                Get Embed Code
              </Button>
              <Button variant="outline">
                View Docs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
