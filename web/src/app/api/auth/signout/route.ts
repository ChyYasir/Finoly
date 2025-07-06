import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    cookies().delete("session_token");
    return NextResponse.json({ data: { message: "Signed out successfully" } });
  } catch (error) {
    console.error("Signout error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
