import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getActiveUser } from "@/lib/mock-auth"

function generateApiKey(): string {
  return `yt_shell_${crypto.randomUUID().replace(/-/g, "")}`
}

async function getOrCreateUser(user: any): Promise<{ id: string }> {
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
    const user = await getActiveUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await getOrCreateUser(user)

    const installations = await prisma.installation.findMany({
      where: {
        userId: dbUser.id,
        status: { not: "deleted" },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(installations)
  } catch (error) {
    console.error("Error fetching installations:", error)
    return NextResponse.json({ error: "Failed to fetch installations" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getActiveUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let dbUser: { id: string }
    try {
      dbUser = await getOrCreateUser(user)
    } catch {
      return NextResponse.json({ error: "No email found" }, { status: 400 })
    }

    const body = await request.json()
    const { domain, platform } = body

    if (!domain || !platform) {
      return NextResponse.json({ error: "Domain and platform required" }, { status: 400 })
    }

    if (!["wordpress", "shopify", "custom"].includes(platform)) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 })
    }

    const normalizedDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "")

    const existing = await prisma.installation.findFirst({
      where: {
        userId: dbUser.id,
        domain: normalizedDomain,
        status: { not: "deleted" },
      },
    })

    if (existing) {
      return NextResponse.json({ error: "Installation already exists for this domain" }, { status: 409 })
    }

    const installation = await prisma.installation.create({
      data: {
        userId: dbUser.id,
        domain: normalizedDomain,
        platform,
        apiKey: generateApiKey(),
        allowedDomains: [normalizedDomain],
      },
    })

    return NextResponse.json(installation, { status: 201 })
  } catch (error) {
    console.error("Error creating installation:", error)
    return NextResponse.json({ error: "Failed to create installation" }, { status: 500 })
  }
}
