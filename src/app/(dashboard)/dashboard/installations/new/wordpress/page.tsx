"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Copy, Check, ExternalLink, Download, CheckCircle2, AlertCircle } from "lucide-react"

export default function WordPressInstallPage() {
  const [step, setStep] = useState(1)
  const [apiKey, setApiKey] = useState("")
  const [isCopied, setIsCopied] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/installations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">WordPress Installation</h1>
          <p className="text-gray-500 mt-1">Install YouTube Shell on your WordPress site</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                s <= step
                  ? "bg-primary text-primary-foreground"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
            </div>
            <span className={`text-sm ${s <= step ? "font-medium" : "text-gray-400"} hidden sm:inline`}>
              {s === 1 ? "Get API Key" : s === 2 ? "Install Plugin" : s === 3 ? "Configure" : "Verify"}
            </span>
            {s < 4 && <div className="w-12 h-px bg-gray-200 ml-2" />}
          </div>
        ))}
      </div>

      {/* Step 1: Get API Key */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Get Your API Key</CardTitle>
            <CardDescription>
              Copy your API key from your YouTube Shell dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Your API Key</Label>
              <div className="flex gap-2">
                <Input
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste your API key here"
                  className="font-mono"
                />
                <Button variant="outline" onClick={() => copyToClipboard(apiKey)} disabled={!apiKey}>
                  {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Find your API key in{" "}
                <Link href="/dashboard/settings" className="text-primary hover:underline">
                  Settings → API Key
                </Link>
              </p>
            </div>

            <Button onClick={() => setStep(2)} disabled={!apiKey}>
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Install Plugin */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Install the Plugin</CardTitle>
            <CardDescription>
              Download and install the YouTube Shell plugin on your WordPress site
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Recommended: Upload Plugin</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                      <li>Download the YouTube Shell plugin (.zip)</li>
                      <li>Go to your WordPress Admin → Plugins → Add New</li>
                      <li>Click &quot;Upload Plugin&quot; at the top</li>
                      <li>Upload the .zip file and click &quot;Install Now&quot;</li>
                      <li>Click &quot;Activate&quot; to enable the plugin</li>
                    </ol>
            </div>

            <div className="flex items-center gap-4">
              <Button asChild>
                <a href="/api/downloads/wordpress-plugin" download>
                  <Download className="w-4 h-4 mr-2" />
                  Download Plugin (.zip)
                </a>
              </Button>
              <span className="text-sm text-gray-500">or</span>
              <Button variant="outline" asChild>
                <a href="https://wordpress.org/plugins/youtube-shell" target="_blank" rel="noopener noreferrer">
                  Search WordPress.org
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Alternative: FTP Upload</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                <li>Unzip the plugin folder</li>
                <li>Upload the folder to <code className="bg-gray-200 px-1 rounded">/wp-content/plugins/</code></li>
                <li>Go to Plugins in WordPress Admin</li>
                <li>Find &quot;YouTube Shell&quot; and click &quot;Activate&quot;</li>
              </ol>
            </div>

            <Button onClick={() => setStep(3)}>
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Configure */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Configure the Plugin</CardTitle>
            <CardDescription>
              Enter your API key in the plugin settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <ol className="list-decimal list-inside space-y-3 text-sm">
                <li>Go to <strong>Settings → YouTube Shell</strong> in your WordPress admin</li>
                <li>Paste your API key in the &quot;API Key&quot; field</li>
                <li>Click <strong>Save Changes</strong></li>
                <li>The plugin will automatically connect to your account</li>
              </ol>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Plugin Settings Preview</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">API Key</span>
                    <code className="text-xs bg-gray-200 px-2 py-1 rounded">{apiKey.substring(0, 8)}...{apiKey.slice(-4)}</code>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Auto-detect YouTube</span>
                    <Badge>Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Custom Player</span>
                    <Badge>Enabled</Badge>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <strong>Important:</strong> After configuration, the plugin will automatically detect 
                    and replace all YouTube embeds on your site with the custom player.
                  </div>
                </div>
              </div>
            </div>

            <Button onClick={() => setStep(4)}>
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Verify */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 4: Verify Installation</CardTitle>
            <CardDescription>
              Check that everything is working correctly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Plugin Activated</p>
                  <p className="text-sm text-green-700">YouTube Shell is now active on your site</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">What happens next:</h4>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                  <li>All YouTube embeds will be automatically detected</li>
                  <li>Videos will display with your custom branding</li>
                  <li>Analytics will start recording within a few minutes</li>
                  <li>View stats in your <Link href="/dashboard" className="text-primary">Dashboard</Link></li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Quick Test</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Visit any page on your WordPress site that has a YouTube video. 
                  The video should now display with a custom play button overlay.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <a href="/" target="_blank">
                      Open Site
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard">
                      View Dashboard
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <Link href="/dashboard/installations">
                <Button variant="outline">
                  Back to Installations
                </Button>
              </Link>
              <Link href="/dashboard/analytics">
                <Button>
                  View Analytics
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FAQ Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-1">Plugin not appearing in WordPress?</h4>
              <p className="text-sm text-gray-600">Make sure you uploaded the entire folder, not just the .zip file. The folder should be named &quot;youtube-shell&quot;.</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">API key invalid error?</h4>
              <p className="text-sm text-gray-600">Check that you copied the complete API key with no extra spaces. You can regenerate it in Settings.</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Videos not showing custom player?</h4>
              <p className="text-sm text-gray-600">Wait 5 minutes for changes to propagate. If still not working, check that your site URL matches the installation domain.</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Need help?</h4>
              <p className="text-sm text-gray-600">
                Contact support at{" "}
                <a href="mailto:support@youtubeshell.com" className="text-primary hover:underline">
                  support@youtubeshell.com
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
