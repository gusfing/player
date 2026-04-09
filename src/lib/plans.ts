import { prisma } from "@/lib/db"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    players: 1,
    domains: 1,
    features: [
      "Basic analytics",
      "Watermark branding",
    ],
  },
  starter: {
    name: "Starter",
    price: 29,
    domains: 3,
    features: [
      "10 players",
      "3 domains",
      "CTA & Lead capture",
      "Meta Pixel integration",
    ],
  },
  pro: {
    name: "Pro",
    price: 79,
    domains: 10,
    features: [
      "50 players",
      "10 domains",
      "Team access",
      "GA4 + Meta Pixel",
      "Advanced gating",
      "Conversion analytics",
    ],
    popular: true,
  },
  growth: {
    name: "Growth",
    price: 149,
    domains: 25,
    features: [
      "Unlimited players",
      "25 domains",
      "Priority support",
      "Advanced targeting",
      "Multiple gates per video",
      "Conversion funnel analytics",
      "AI/Adaptive gating",
    ],
  },
} as const

export type PlanTier = keyof typeof PLANS

export function getPlanLimits(tier: PlanTier) {
  return PLANS[tier] || PLANS.free
}

export function getDomainCountKey(userId: string): string {
  return `user:${userId}:domain_count`
}

export async function getCachedDomainCount(userId: string): Promise<number | null> {
  try {
    const cached = await redis.get<number>(getDomainCountKey(userId))
    return cached
  } catch {
    return null
  }
}

export async function setCachedDomainCount(userId: string, count: number): Promise<void> {
  try {
    await redis.set(getDomainCountKey(userId), count, { ex: 3600 })
  } catch (error) {
    console.error("Failed to cache domain count:", error)
  }
}

export async function incrementDomainCount(userId: string): Promise<number> {
  try {
    const newCount = await redis.incr(getDomainCountKey(userId))
    await redis.expire(getDomainCountKey(userId), 3600)
    return newCount
  } catch (error) {
    console.error("Failed to increment domain count:", error)
    return await calculateAndCacheDomainCount(userId)
  }
}

export async function decrementDomainCount(userId: string): Promise<number> {
  try {
    const newCount = await redis.decr(getDomainCountKey(userId))
    await redis.expire(getDomainCountKey(userId), 3600)
    return Math.max(0, newCount)
  } catch (error) {
    console.error("Failed to decrement domain count:", error)
    return await calculateAndCacheDomainCount(userId)
  }
}

export async function calculateAndCacheDomainCount(userId: string): Promise<number> {
  try {
    const installations = await prisma.installation.findMany({
      where: {
        userId,
        status: { not: "deleted" },
      },
      select: {
        allowedDomains: true,
      },
    })

    const uniqueDomains = new Set<string>()
    for (const inst of installations) {
      const domains = inst.allowedDomains as string[] || []
      domains.forEach((domain) => uniqueDomains.add(domain))
    }

    const count = uniqueDomains.size
    await setCachedDomainCount(userId, count)
    return count
  } catch (error) {
    console.error("Failed to calculate domain count:", error)
    return 0
  }
}

export async function getUserDomainUsage(userId: string): Promise<{
  used: number
  limit: number
  remaining: number
  percent: number
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    return { used: 0, limit: 1, remaining: 1, percent: 0 }
  }

  const tier = (user.tier as PlanTier) || "free"
  const plan = getPlanLimits(tier)

  let used = await getCachedDomainCount(userId)
  if (used === null) {
    used = await calculateAndCacheDomainCount(userId)
  }

  const limit = plan.domains
  const remaining = Math.max(0, limit - used)
  const percent = limit === Infinity ? 0 : Math.min(100, (used / limit) * 100)

  return { used, limit, remaining, percent }
}

export async function canAddDomain(userId: string): Promise<{
  allowed: boolean
  reason?: string
}> {
  const usage = await getUserDomainUsage(userId)

  if (usage.limit === Infinity) {
    return { allowed: true }
  }

  if (usage.remaining <= 0) {
    return {
      allowed: false,
      reason: `Domain limit reached (${usage.limit}/${usage.limit}). Upgrade to add more domains.`,
    }
  }

  return { allowed: true }
}

export async function validateAndAddDomain(
  userId: string,
  domain: string
): Promise<{
  success: boolean
  error?: string
}> {
  const canAdd = await canAddDomain(userId)
  if (!canAdd.allowed) {
    return { success: false, error: canAdd.reason }
  }

  await incrementDomainCount(userId)
  return { success: true }
}

export async function validateAndRemoveDomain(
  userId: string,
  domain: string
): Promise<{
  success: boolean
  error?: string
}> {
  await decrementDomainCount(userId)
  return { success: true }
}

export async function syncDomainCache(userId: string): Promise<number> {
  return await calculateAndCacheDomainCount(userId)
}
