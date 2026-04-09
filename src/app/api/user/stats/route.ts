import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
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
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getOrCreateUser(clerkUser)

    const [installations, leads] = await Promise.all([
      prisma.installation.findMany({
        where: { userId: user.id },
        select: { id: true },
      }),
      prisma.leadCapture.count({
        where: { userId: user.id },
      }),
    ])

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const playEvents = await prisma.siteAnalytics.count({
      where: {
        installation: { userId: user.id },
        eventType: "video_played",
        createdAt: { gte: thirtyDaysAgo },
      },
    })

    return NextResponse.json({
      totalInstallations: installations.length,
      totalPlays: playEvents,
      totalLeads: leads,
    })
  } catch (error) {
    console.error("Error fetching user stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
