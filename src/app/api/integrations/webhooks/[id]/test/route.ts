import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import crypto from "crypto"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const webhook = await prisma.webhook.findUnique({
      where: { id },
      include: {
        user: true,
      },
    })

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 })
    }

    const userEmail = user.emailAddresses[0]?.emailAddress
    const dbUser = await prisma.user.findUnique({
      where: { email: userEmail! },
    })

    if (!dbUser || webhook.userId !== dbUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const testPayload = {
      event: "test",
      timestamp: new Date().toISOString(),
      installation: {
        id: "test_installation_id",
        domain: "example.com",
        platform: "custom",
      },
      data: {
        video_id: "dQw4w9WgXcQ",
        url: "https://example.com/test-page",
        message: "This is a test webhook delivery from YouTube Shell",
      },
    }

    const payloadString = JSON.stringify(testPayload)
    const signature = crypto
      .createHmac("sha256", webhook.secret)
      .update(payloadString)
      .digest("hex")

    let success = false
    let errorMessage = null
    let statusCode = 0

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-YouTubeShell-Signature": signature,
          "X-YouTubeShell-Event": "test",
          "X-YouTubeShell-Delivery-ID": `test_${Date.now()}`,
        },
        body: payloadString,
        signal: AbortSignal.timeout(10000),
      })

      statusCode = response.status
      success = response.ok

      if (!response.ok) {
        errorMessage = `HTTP ${statusCode}: ${response.statusText}`
      }

      await prisma.webhookDelivery.create({
        data: {
          webhookId: id,
          event: "test",
          payload: testPayload as unknown as object,
          status: success ? "success" : "failed",
          attempts: 1,
          lastError: errorMessage,
        },
      })

      await prisma.webhookStats.upsert({
        where: { webhookId: id },
        update: {
          successCount: success ? { increment: 1 } : undefined,
          failureCount: success ? undefined : { increment: 1 },
          lastStatus: success ? "success" : "failed",
          lastAttempt: new Date(),
        },
        create: {
          webhookId: id,
          successCount: success ? 1 : 0,
          failureCount: success ? 0 : 1,
          lastStatus: success ? "success" : "failed",
          lastAttempt: new Date(),
        },
      })
    } catch (err: unknown) {
      success = false
      const message = err instanceof Error ? err.message : "Connection failed"
      errorMessage = message

      await prisma.webhookDelivery.create({
        data: {
          webhookId: id,
          event: "test",
          payload: testPayload as unknown as object,
          status: "failed",
          attempts: 1,
          lastError: errorMessage,
        },
      })

      await prisma.webhookStats.upsert({
        where: { webhookId: id },
        update: {
          failureCount: { increment: 1 },
          lastStatus: "failed",
          lastAttempt: new Date(),
        },
        create: {
          webhookId: id,
          failureCount: 1,
          lastStatus: "failed",
          lastAttempt: new Date(),
        },
      })
    }

    return NextResponse.json({
      success,
      statusCode,
      error: errorMessage,
      message: success
        ? "Test webhook delivered successfully!"
        : "Test webhook delivery failed",
    })
  } catch (error) {
    console.error("Error testing webhook:", error)
    return NextResponse.json({ error: "Failed to test webhook" }, { status: 500 })
  }
}
