import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import crypto from "crypto"

const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

export async function POST(request: Request) {
  try {
    const payload = await request.text()
    const signature = request.headers.get("svix-signature")
    const timestamp = request.headers.get("svix-timestamp")

    if (!signature || !timestamp) {
      console.error("Missing Clerk webhook signature or timestamp")
      return NextResponse.json({ error: "Missing signature" }, { status: 401 })
    }

    if (!CLERK_WEBHOOK_SECRET) {
      console.error("CLERK_WEBHOOK_SECRET not configured")
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
    }

    const isValid = verifyClerkSignature(payload, timestamp, signature, CLERK_WEBHOOK_SECRET)
    if (!isValid) {
      console.error("Invalid Clerk webhook signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const event = JSON.parse(payload)
    console.log("Clerk webhook event:", event.type)

    switch (event.type) {
      case "user.created": {
        const { id: clerkId, email_addresses, first_name, last_name, primary_email_address_id } = event.data
        
        const primaryEmail = email_addresses?.find(
          (email: { id: string }) => email.id === primary_email_address_id
        )?.email_address || email_addresses?.[0]?.email_address

        if (!primaryEmail) {
          console.error("No email found in user.created event")
          return NextResponse.json({ error: "No email found" }, { status: 400 })
        }

        const existingUser = await prisma.user.findUnique({
          where: { clerkId },
        })

        if (existingUser) {
          console.log("User already exists:", clerkId)
          return NextResponse.json({ success: true, message: "User already exists" })
        }

        const user = await prisma.user.create({
          data: {
            clerkId,
            email: primaryEmail,
            name: [first_name, last_name].filter(Boolean).join(" ") || null,
          },
        })

        console.log("User created via webhook:", user.id)
        return NextResponse.json({ success: true, userId: user.id })
      }

      case "user.updated": {
        const { id: clerkId, email_addresses, first_name, last_name, primary_email_address_id } = event.data
        
        const primaryEmail = email_addresses?.find(
          (email: { id: string }) => email.id === primary_email_address_id
        )?.email_address || email_addresses?.[0]?.email_address

        const existingUser = await prisma.user.findUnique({
          where: { clerkId },
        })

        if (!existingUser) {
          console.log("User not found for update, creating:", clerkId)
          if (primaryEmail) {
            const user = await prisma.user.create({
              data: {
                clerkId,
                email: primaryEmail,
                name: [first_name, last_name].filter(Boolean).join(" ") || null,
              },
            })
            return NextResponse.json({ success: true, userId: user.id })
          }
          return NextResponse.json({ error: "No email found" }, { status: 400 })
        }

        await prisma.user.update({
          where: { clerkId },
          data: {
            email: primaryEmail || existingUser.email,
            name: [first_name, last_name].filter(Boolean).join(" ") || null,
          },
        })

        console.log("User updated via webhook:", clerkId)
        return NextResponse.json({ success: true })
      }

      case "user.deleted": {
        const { id: clerkId } = event.data
        
        const existingUser = await prisma.user.findUnique({
          where: { clerkId },
        })

        if (existingUser) {
          await prisma.user.delete({
            where: { clerkId },
          })
          console.log("User deleted via webhook:", clerkId)
        }

        return NextResponse.json({ success: true })
      }

      default:
        console.log("Unhandled Clerk webhook event type:", event.type)
        return NextResponse.json({ success: true, message: "Event not handled" })
    }
  } catch (error) {
    console.error("Clerk webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

function verifyClerkSignature(
  payload: string,
  timestamp: string,
  signature: string,
  secret: string
): boolean {
  try {
    const timestampPayload = `${timestamp}${payload}`
    const secretBytes = new TextEncoder().encode(secret)
    const timestampPayloadBytes = new TextEncoder().encode(timestampPayload)
    
    const hash = crypto
      .createHmac("sha256", secretBytes)
      .update(timestampPayloadBytes)
      .digest("hex")
    
    const expectedSignature = `v1=${hash}`
    
    const signatures = signature.split(",")
    return signatures.some((sig) => {
      const trimmedSig = sig.trim()
      const isValid = crypto.timingSafeEqual(
        Buffer.from(trimmedSig),
        Buffer.from(expectedSignature)
      )
      return isValid
    })
  } catch (error) {
    console.error("Signature verification error:", error)
    return false
  }
}
