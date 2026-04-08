import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Zap } from "lucide-react"

const plans = [
  {
    name: "Free",
    price: 0,
    description: "Perfect for trying out",
    features: [
      "1 video player",
      "Basic analytics",
      "HTML embed only",
      "Community support",
    ],
    notIncluded: [
      "No custom branding",
      "No CTA/Lead capture",
      "No Meta Pixel",
      "No WordPress/Shopify",
    ],
    cta: "Current Plan",
    popular: false,
  },
  {
    name: "Starter",
    price: 30,
    description: "For growing businesses",
    features: [
      "25 video players",
      "Advanced analytics",
      "Custom branding",
      "CTA & Lead capture",
      "Meta Pixel integration",
      "WordPress plugin",
      "Shopify app",
      "Email support",
    ],
    notIncluded: [],
    cta: "Upgrade",
    popular: true,
  },
  {
    name: "Pro",
    price: 80,
    description: "For power users",
    features: [
      "Unlimited players",
      "Detailed viewer analytics",
      "Everything in Starter",
      "Team management (3 seats)",
      "Weekly digest emails",
      "Priority support",
      "API access",
    ],
    notIncluded: [],
    cta: "Upgrade",
    popular: false,
  },
]

export default function BillingPage() {
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
              <CardDescription>You&apos;re on the Free plan</CardDescription>
            </div>
            <Badge variant="secondary">Free</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 text-center">
            <div>
              <div className="text-2xl font-bold">1</div>
              <p className="text-sm text-gray-500">Players used</p>
            </div>
            <div>
              <div className="text-2xl font-bold">0</div>
              <p className="text-sm text-gray-500">Viewers this month</p>
            </div>
            <div>
              <div className="text-2xl font-bold">0</div>
              <p className="text-sm text-gray-500">Leads captured</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Plans */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Available Plans</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-3 max-w-5xl">
        {plans.map((plan) => (
          <Card 
            key={plan.name} 
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
                {plan.price > 0 && <span className="text-gray-500">/month</span>}
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
                {plan.notIncluded.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-gray-400">
                    <Check className="w-4 h-4" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button 
                className="w-full" 
                variant={plan.popular ? "default" : "outline"}
              >
                {plan.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
