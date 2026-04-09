"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Check, Zap, Loader2, AlertTriangle } from "lucide-react"

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: 29,
    description: "For creators and small funnels",
    features: [
      "10 players",
      "3 domains",
      "CTA & Lead capture",
      "Meta Pixel integration",
      "Basic tracking",
    ],
    cta: "Upgrade to Starter",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 79,
    description: "For agencies and serious users",
    features: [
      "50 players",
      "10 domains",
      "Team access",
      "GA4 + Meta Pixel",
      "Advanced gating",
      "Conversion analytics",
    ],
    cta: "Upgrade to Pro",
    popular: true,
  },
  {
    id: "growth",
    name: "Growth",
    price: 149,
    description: "For scale and optimization",
    features: [
      "Unlimited players",
      "25 domains",
      "Priority support",
      "Advanced targeting",
      "Multiple gates per video",
      "Conversion funnel analytics",
    ],
    cta: "Upgrade to Growth",
    popular: false,
  },
]

interface UserTier {
  tier: string
  totalPlays: number
  totalSites: number
  leadsCount: number
}

interface DomainUsage {
  used: number
  limit: number
  remaining: number
  percent: number
}

const PLAN_LIMITS = {
  free: { domains: 1 },
  starter: { domains: 3 },
  pro: { domains: 10 },
  growth: { domains: 25 },
}

export default function BillingPage() {
  const [currentTier, setCurrentTier] = useState("free")
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [domainUsage, setDomainUsage] = useState<DomainUsage | null>(null)
  const [stats, setStats] = useState({ sites: 0, plays: 0, leads: 0 })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, usageRes, statsRes] = await Promise.all([
          fetch("/api/user/settings"),
          fetch("/api/user/domain-usage"),
          fetch("/api/user/stats").catch(() => ({ ok: false, json: async () => null })),
        ])

        if (userRes.ok) {
          const userData = await userRes.json()
          setCurrentTier(userData.tier || "free")
        }

        if (usageRes.ok) {
          setDomainUsage(await usageRes.json())
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          if (statsData) {
            setStats({
              sites: statsData.totalInstallations || 0,
              plays: statsData.totalPlays || 0,
              leads: statsData.totalLeads || 0,
            })
          }
        }
      } catch (err) {
        console.error("Failed to fetch billing data:", err)
      }
    }

    fetchData()
  }, [])

  const handleUpgrade = async (planId: string) => {
    setIsLoading(planId)
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        alert("Failed to create checkout session. Please try again.")
      }
    } catch (err) {
      console.error("Checkout error:", err)
      alert("Something went wrong. Please try again.")
    } finally {
      setIsLoading(null)
    }
  }

  const isCurrentPlan = (planId: string) => {
    if (planId === "free" && currentTier === "free") return true
    if (planId === "starter" && currentTier === "starter") return true
    if (planId === "pro" && currentTier === "pro") return true
    if (planId === "growth" && currentTier === "growth") return true
    return false
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-gray-500 mt-1">Manage your subscription and billing</p>
      </div>

      {/* Current Plan */}
      <Card className="max-w-2xl mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                {currentTier === "free" ? "You're on the Free plan" : `You're on the ${currentTier} plan`}
              </CardDescription>
            </div>
            <Badge variant={currentTier === "free" ? "secondary" : "default"}>
              {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 text-center">
            <div>
              <div className="text-2xl font-bold">{stats.sites}</div>
              <p className="text-sm text-gray-500">Sites created</p>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.plays.toLocaleString()}</div>
              <p className="text-sm text-gray-500">Plays this month</p>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.leads}</div>
              <p className="text-sm text-gray-500">Leads captured</p>
            </div>
          </div>

          {domainUsage && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Domain Usage</span>
                  {domainUsage.remaining <= 0 && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Limit Reached
                    </Badge>
                  )}
                  {domainUsage.remaining > 0 && domainUsage.remaining <= 2 && (
                    <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-600">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Almost Full
                    </Badge>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  {domainUsage.used} / {domainUsage.limit === Infinity ? "∞" : domainUsage.limit} domains
                </span>
              </div>
              <Progress 
                value={domainUsage.percent} 
                className={`h-2 ${
                  domainUsage.percent >= 100 ? "bg-red-200" : 
                  domainUsage.percent >= 80 ? "bg-yellow-200" : ""
                }`}
              />
              {domainUsage.remaining > 0 && domainUsage.remaining <= 2 && (
                <p className="text-xs text-yellow-600 mt-2">
                  You have {domainUsage.remaining} domain{domainUsage.remaining === 1 ? "" : "s"} remaining. Consider upgrading for more.
                </p>
              )}
              {domainUsage.remaining <= 0 && (
                <p className="text-xs text-red-600 mt-2">
                  Upgrade to {currentTier === "starter" ? "Pro" : "Growth"} to add more domains.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing Plans */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Available Plans</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-4xl">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={plan.popular ? "border-primary shadow-lg relative" : ""}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary">
                  <Zap className="w-3 h-3 mr-1" />
                  Popular
                </Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="pt-4">
                <span className="text-3xl font-bold">${plan.price}</span>
                <span className="text-gray-500">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
                disabled={isCurrentPlan(plan.id) || isLoading === plan.id}
                onClick={() => handleUpgrade(plan.id)}
              >
                {isLoading === plan.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Redirecting...
                  </>
                ) : isCurrentPlan(plan.id) ? (
                  "Current Plan"
                ) : (
                  plan.cta
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ */}
      <Card className="max-w-2xl mt-8">
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-medium">Can I cancel anytime?</p>
            <p className="text-gray-500">Yes, you can cancel your subscription at any time. You&apos;ll continue to have access until the end of your billing period.</p>
          </div>
          <div>
            <p className="font-medium">What counts as a &quot;play&quot;?</p>
            <p className="text-gray-500">A play is counted each time a user clicks play on any YouTube video on your site.</p>
          </div>
          <div>
            <p className="font-medium">Can I change plans?</p>
            <p className="text-gray-500">Yes, you can upgrade or downgrade your plan at any time from your billing settings.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
