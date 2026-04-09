import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

async function getOrCreateUser(user: { id: string; emailAddresses: Array<{ emailAddress: string }> }): Promise<{ id: string; stripeCustomerId: string | null }> {
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

export async function POST() {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let dbUser: { id: string; stripeCustomerId: string | null }
    try {
      dbUser = await getOrCreateUser(user) as { id: string; stripeCustomerId: string | null }
    } catch {
      return NextResponse.json({ error: "No email found" }, { status: 400 })
    }

    if (!dbUser.stripeCustomerId) {
      return NextResponse.json({ error: "No Stripe customer found" }, { status: 400 })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: dbUser.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Error creating billing portal session:", error)
    return NextResponse.json({ error: "Failed to create billing portal session" }, { status: 500 })
  }
}
