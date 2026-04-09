import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import crypto from "crypto"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; deliveryId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: webhookId, deliveryId } = await params

    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
    })

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 })
    }

    if (webhook.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const delivery = await prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
    })

    if (!delivery) {
      return NextResponse.json({ error: "Delivery not found" }, { status: 404 })
    }

    if (delivery.webhookId !== webhookId) {
      return NextResponse.json({ error: "Delivery does not belong to webhook" }, { status: 400 })
    }

    const payload = typeof delivery.payload === "string" 
      ? JSON.parse(delivery.payload) 
      : delivery.payload

    const timestamp = new Date().toISOString()
    const body = JSON.stringify({
      ...payload,
      timestamp,
    })

    const signature = crypto
      .createHmac("sha256", webhook.secret)
      .update(body)
      .digest("hex")

    let success = false
    let errorMessage = ""

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-YouTubeShell-Signature": signature,
          "X-YouTubeShell-Timestamp": timestamp,
        },
        body,
      })

      success = response.ok
      if (!success) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`
      }
    } catch (err: unknown) {
      success = false
      errorMessage = err instanceof Error ? err.message : "Connection failed"
    }

    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: success ? "success" : "failed",
        attempts: delivery.attempts + 1,
        lastError: success ? null : errorMessage,
      },
    })

    const webhookStats = await prisma.webhookStats.findUnique({
      where: { webhookId },
    })

    if (webhookStats) {
      await prisma.webhookStats.update({
        where: { webhookId },
        data: {
          successCount: success ? webhookStats.successCount + 1 : webhookStats.successCount,
          failureCount: success ? webhookStats.failureCount : webhookStats.failureCount + 1,
          lastStatus: success ? "success" : "failed",
          lastAttempt: new Date(),
        },
      })
    }

    if (success) {
      await prisma.webhook.update({
        where: { id: webhookId },
        data: { consecutiveFailures: 0 },
      })
    }

    return NextResponse.json({
      success,
      message: success ? "Delivery successful" : `Delivery failed: ${errorMessage}`,
    })
  } catch (error) {
    console.error("Error retrying webhook delivery:", error)
    return NextResponse.json({ error: "Failed to retry delivery" }, { status: 500 })
  }
}
