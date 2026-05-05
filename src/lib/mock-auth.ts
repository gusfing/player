export const MOCK_USER = {
  id: "user_2test1234567890",
  firstName: "Test",
  lastName: "User",
  fullName: "Test User",
  emailAddresses: [
    {
      emailAddress: "test@example.com",
    },
  ],
}

// Use mock auth when USE_MOCK_AUTH is not explicitly "false"
const USE_MOCK = process.env.USE_MOCK_AUTH !== "false"

export async function getActiveUser() {
  if (USE_MOCK) {
    return MOCK_USER
  }
  try {
    const { currentUser } = await import("@clerk/nextjs/server")
    return currentUser()
  } catch (e) {
    console.warn("Clerk not available, using mock user")
    return MOCK_USER
  }
}

export async function getActiveAuth() {
  if (USE_MOCK) {
    return { userId: MOCK_USER.id }
  }
  try {
    const { auth } = await import("@clerk/nextjs/server")
    return auth()
  } catch (e) {
    console.warn("Clerk not available, using mock auth")
    return { userId: MOCK_USER.id }
  }
}
