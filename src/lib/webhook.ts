import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"
import crypto from "crypto"
import { sendWebhookFailureAlert } from "@/lib/email"

const RETRY_DELAYS = [60 * 1000, 5 * 60 * 1000, 15 * 60 * 1000] // 1min, 5min, 15min
const MAX_ATTEMPTS = 3

interface WebhookPayload {
  event: string
  timestamp: string
  installation: {
    id: string
    domain: string
    platform: string
  }
  data: Record<string, unknown>
}

export async function dispatchToWebhooks(
  installationId: string,
  event: string,
  data: Record<string, unknown>
) {
  try {
    const installation = await prisma.installation.findUnique({
      where: { id: installationId },
      include: { user: true },
    })

    if (!installation) {
      console.error("Installation not found:", installationId)
      return
    }

    const webhooks = await prisma.webhook.findMany({
      where: {
        userId: installation.userId,
        enabled: true,
        events: { has: event },
      },
    })

    if (webhooks.length === 0) {
      return
    }

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      installation: {
        id: installation.id,
        domain: installation.domain,
        platform: installation.platform,
      },
      data,
    }

    for (const webhook of webhooks) {
      await queueDelivery(webhook.id, webhook.secret, webhook.url, payload)
    }
  } catch (error) {
    console.error("Error dispatching to webhooks:", error)
  }
}

async function queueDelivery(
  webhookId: string,
  secret: string,
  url: string,
  payload: WebhookPayload
) {
  const delivery = await prisma.webhookDelivery.create({
    data: {
      webhookId,
      event: payload.event,
      payload: payload as unknown as object,
      status: "pending",
      attempts: 0,
    },
  })

  await deliverWithRetry(webhookId, delivery.id, secret, url, payload, 0)
}

async function deliverWithRetry(
  webhookId: string,
  deliveryId: string,
  secret: string,
  url: string,
  payload: WebhookPayload,
  attemptNumber: number
) {
  const payloadString = JSON.stringify(payload)
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payloadString)
    .digest("hex")

  let success = false
  let errorMessage = null
  let statusCode = 0

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-YouTubeShell-Signature": signature,
        "X-YouTubeShell-Event": payload.event,
        "X-YouTubeShell-Delivery-ID": deliveryId,
      },
      body: payloadString,
      signal: AbortSignal.timeout(10000),
    })

    statusCode = response.status
    success = response.ok

    if (!response.ok) {
      errorMessage = `HTTP ${statusCode}: ${response.statusText}`
    }
  } catch (err: unknown) {
    success = false
    const message = err instanceof Error ? err.message : "Connection failed"
    errorMessage = message
  }

  const newAttempt = attemptNumber + 1

  await prisma.webhookDelivery.update({
    where: { id: deliveryId },
    data: {
      status: success ? "success" : newAttempt >= MAX_ATTEMPTS ? "failed" : "pending",
      attempts: newAttempt,
      lastError: errorMessage,
    },
  })

  await prisma.webhook.update({
    where: { id: webhookId },
    data: {
      consecutiveFailures: success ? 0 : { increment: 1 },
      lastFailureAt: success ? null : new Date(),
    },
  })

  await updateStats(webhookId, success)

  if (!success && newAttempt < MAX_ATTEMPTS) {
    setTimeout(() => {
      deliverWithRetry(webhookId, deliveryId, secret, url, payload, newAttempt)
    }, RETRY_DELAYS[newAttempt - 1])
  } else if (!success && newAttempt >= MAX_ATTEMPTS) {
    await handleFailureAlert(webhookId)
  }
}

async function updateStats(webhookId: string, success: boolean) {
  await prisma.webhookStats.upsert({
    where: { webhookId },
    update: {
      successCount: success ? { increment: 1 } : undefined,
      failureCount: success ? undefined : { increment: 1 },
      lastStatus: success ? "success" : "failed",
      lastAttempt: new Date(),
    },
    create: {
      webhookId,
      successCount: success ? 1 : 0,
      failureCount: success ? 0 : 1,
      lastStatus: success ? "success" : "failed",
      lastAttempt: new Date(),
    },
  })
}

async function handleFailureAlert(webhookId: string) {
  const webhook = await prisma.webhook.findUnique({
    where: { id: webhookId },
    include: { user: true },
  })

  if (!webhook) return

  if (webhook.consecutiveFailures >= 3) {
    const recentDelivery = await prisma.webhookDelivery.findFirst({
      where: {
        webhookId,
        status: "failed",
      },
      orderBy: { createdAt: "desc" },
    })

    await sendWebhookFailureAlert(
      webhook.user.email,
      webhook.name,
      webhook.url,
      recentDelivery?.lastError || "Multiple delivery failures",
      webhook.consecutiveFailures
    )
    
    console.log(`Webhook ${webhook.name} failure alert sent to ${webhook.user.email}`)
  }
}

export async function sendTestWebhook(webhookId: string) {
  const webhook = await prisma.webhook.findUnique({
    where: { id: webhookId },
    include: { user: true },
  })

  if (!webhook) {
    throw new Error("Webhook not found")
  }

  const testPayload: WebhookPayload = {
    event: "test",
    timestamp: new Date().toISOString(),
    installation: {
      id: "test",
      domain: "example.com",
      platform: "custom",
    },
    data: {
      message: "This is a test webhook from YouTube Shell",
    },
  }

  const payloadString = JSON.stringify(testPayload)
  const signature = crypto
    .createHmac("sha256", webhook.secret)
    .update(payloadString)
    .digest("hex")

  const response = await fetch(webhook.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-YouTubeShell-Signature": signature,
      "X-YouTubeShell-Event": "test",
    },
    body: payloadString,
  })

  return {
    success: response.ok,
    statusCode: response.status,
  }
}
