import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const RETENTION_DAYS = 7

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS)

    const result = await prisma.webhookDelivery.deleteMany({
      where: {
        status: "success",
        createdAt: {
          lt: cutoffDate,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.count} successful webhook delivery logs older than ${RETENTION_DAYS} days`,
      deletedCount: result.count,
      cutoffDate: cutoffDate.toISOString(),
    })
  } catch (error) {
    console.error("Error cleaning up webhook deliveries:", error)
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS)

    const count = await prisma.webhookDelivery.count({
      where: {
        status: "success",
        createdAt: {
          lt: cutoffDate,
        },
      },
    })

    return NextResponse.json({
      pendingDeletion: count,
      retentionDays: RETENTION_DAYS,
      cutoffDate: cutoffDate.toISOString(),
    })
  } catch (error) {
    console.error("Error counting deliveries for cleanup:", error)
    return NextResponse.json({ error: "Count failed" }, { status: 500 })
  }
}
