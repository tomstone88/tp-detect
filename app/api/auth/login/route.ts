import { type NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { createUser, getUserByEmail } from "@/lib/redis"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, company, phone } = body

    if (!email || !name) {
      return NextResponse.json({ error: "Email and name are required" }, { status: 400 })
    }

    // Check if user already exists
    let user = await getUserByEmail(email)

    // If user doesn't exist, create a new one
    if (!user) {
      user = {
        id: uuidv4(),
        email,
        name,
        company,
        phone,
        createdAt: Date.now(),
      }

      await createUser(user)
    }

    // Set a cookie with the user ID
    const response = NextResponse.json(user)
    response.cookies.set({
      name: "user",
      value: JSON.stringify(user),
      httpOnly: true,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Error processing login:", error)
    return NextResponse.json({ error: "Failed to process login request" }, { status: 500 })
  }
}

