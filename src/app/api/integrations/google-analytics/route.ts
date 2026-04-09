import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { testGoogleAnalyticsConnection } from "@/lib/google-analytics"
import { User } from "@prisma/client"

async function getOrCreateUser(user: { id: string; emailAddresses: Array<{ emailAddress: string }> }): Promise<User> {
  const userEmail = user.emailAddresses[0]?.emailAddress
  if (!userEmail) {
    throw new Error("No email found")
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: userEmail },
  })

  if (dbUser) {
    return dbUser
  }

  return prisma.user.create({
    data: {
      clerkId: user.id,
      email: userEmail,
    },
  })
}

export async function GET() {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let dbUser: User
    try {
      dbUser = await getOrCreateUser(user)
    } catch {
      return NextResponse.json({ error: "No email found" }, { status: 400 })
    }

    const googleAnalytics = await prisma.googleAnalytics.findUnique({
      where: { userId: dbUser.id },
    })

    return NextResponse.json({
      googleAnalytics,
    })
  } catch (error) {
    console.error("Error fetching Google Analytics config:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let dbUser: User
    try {
      dbUser = await getOrCreateUser(user)
    } catch {
      return NextResponse.json({ error: "No email found" }, { status: 400 })
    }

    const body = await request.json()
    const { measurementId, apiSecret } = body

    if (!measurementId || !apiSecret) {
      return NextResponse.json(
        { error: "Measurement ID and API Secret are required" },
        { status: 400 }
      )
    }

    const testResult = await testGoogleAnalyticsConnection(measurementId, apiSecret)
    if (!testResult.success) {
      return NextResponse.json(
        { error: testResult.error || "Connection test failed" },
        { status: 400 }
      )
    }

    const gaConfig = await prisma.googleAnalytics.upsert({
      where: { userId: dbUser.id },
      update: {
        measurementId,
        apiSecret,
        enabled: true,
      },
      create: {
        userId: dbUser.id,
        measurementId,
        apiSecret,
        enabled: true,
      },
    })

    return NextResponse.json(gaConfig)
  } catch (error) {
    console.error("Error creating Google Analytics config:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let dbUser: User
    try {
      dbUser = await getOrCreateUser(user)
    } catch {
      return NextResponse.json({ error: "No email found" }, { status: 400 })
    }

    await prisma.googleAnalytics.deleteMany({
      where: { userId: dbUser.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting Google Analytics config:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
