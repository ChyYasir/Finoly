import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";
import { db } from "@/db";
import { user as userSchema } from "@/db/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get("session_token")?.value;

  if (!sessionToken || !JWT_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { payload } = await jose.jwtVerify(
      sessionToken,
      new TextEncoder().encode(JWT_SECRET)
    );

    const userId = payload.userId as string;
    const user = await db
      .select({
        id: userSchema.id,
        name: userSchema.name,
        email: userSchema.email,
        createdAt: userSchema.createdAt,
      })
      .from(userSchema)
      .where(eq(userSchema.id, userId));

    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ data: user[0] });
  } catch (error) {
    console.error("Session fetch error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
