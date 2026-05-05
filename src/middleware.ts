import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/signup(.*)",
  "/api/webhooks/clerk(.*)",
  "/api/stripe/webhook(.*)",
  "/api/track(.*)",
  "/api/embed(.*)",
])

export default clerkMiddleware(async (auth, req) => {
  // Authentication disabled for testing
  // if (!isPublicRoute(req)) {
  //   await auth.protect()
  // }
})

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}
