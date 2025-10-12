import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { name, nickname, password } = await req.json()

    // Validation
    if (!name || !nickname || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }

    // Check if user already exists with this nickname
    const existingUser = await prisma.user.findUnique({
      where: { nickname }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this username already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Generate a unique email from nickname for NextAuth compatibility
    const generatedEmail = `${nickname}@cowrywisefc.local`

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        nickname,
        email: generatedEmail,
        password: hashedPassword
      },
      select: {
        id: true,
        name: true,
        nickname: true,
        role: true,
        createdAt: true
      }
    })

    return NextResponse.json(
      { user, message: "User created successfully" },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    console.error("Error details:", JSON.stringify(error, null, 2))
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
