import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Play, BarChart3, Zap, Code2 } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Play className="w-4 h-4 text-white" fill="white" />
              </div>
              <span className="font-bold text-lg">YouTube Shell</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">
            Custom YouTube Player for
            <span className="text-primary"> Your Website</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Replace YouTube embeds with branded players. Capture leads, track viewers, 
            and boost conversions with detailed analytics.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg">
                Start Free
                <Play className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-4">100 free users • No credit card required</p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Everything You Need</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Custom Branding</h3>
              <p className="text-gray-600">
                Remove YouTube branding. Add your colors, logos, and fonts for a seamless experience.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Detailed Analytics</h3>
              <p className="text-gray-600">
                Track who watches your videos, when, and for how long. Know your viewers intimately.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Code2 className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Easy Installation</h3>
              <p className="text-gray-600">
                WordPress plugin, Shopify app, or universal HTML embed. Works on any site.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Simple Pricing</h2>
          <p className="text-gray-600 mb-8">Start free, upgrade when you grow</p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 border rounded-xl">
              <h3 className="font-semibold mb-2">Free</h3>
              <div className="text-3xl font-bold mb-4">$0</div>
              <p className="text-sm text-gray-600">1 player, basic analytics</p>
            </div>
            <div className="p-6 border-2 border-primary rounded-xl relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs px-3 py-1 rounded-full">
                Popular
              </div>
              <h3 className="font-semibold mb-2">Starter</h3>
              <div className="text-3xl font-bold mb-4">$30<span className="text-sm font-normal">/mo</span></div>
              <p className="text-sm text-gray-600">25 players, CTA, Meta Pixel</p>
            </div>
            <div className="p-6 border rounded-xl">
              <h3 className="font-semibold mb-2">Pro</h3>
              <div className="text-3xl font-bold mb-4">$80<span className="text-sm font-normal">/mo</span></div>
              <p className="text-sm text-gray-600">Unlimited, team, detailed analytics</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500">
          <p>© 2026 YouTube Shell. Built with Next.js.</p>
        </div>
      </footer>
    </div>
  )
}
