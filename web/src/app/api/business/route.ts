// app/api/business/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as jose from "jose";
import { db } from "@/db";
import { business, user, team, teamMember } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { JWT_SECRET } from "@/lib/auth/server";

// Rate limiting - simple in-memory store (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string, limit: number = 50): boolean {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const key = `business_${userId}`;

  const record = rateLimitMap.get(key);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        {
          error: "Authentication required",
          message: "No session token provided",
        },
        { status: 401 }
      );
    }

    // Verify JWT token
    let payload;
    try {
      const { payload: jwtPayload } = await jose.jwtVerify(
        sessionToken,
        new TextEncoder().encode(JWT_SECRET)
      );
      payload = jwtPayload;
    } catch (error) {
      return NextResponse.json(
        {
          error: "Invalid token",
          message: "Session token is invalid or expired",
        },
        { status: 401 }
      );
    }

    // Check if user is business account
    if (payload.accountType !== "business") {
      return NextResponse.json(
        {
          error: "Permission denied",
          message: "Only business accounts can access business details",
        },
        { status: 403 }
      );
    }

    // Rate limiting
    if (!checkRateLimit(payload.id as string)) {
      return NextResponse.json(
        { error: "Rate limit exceeded", message: "Too many requests" },
        { status: 429 }
      );
    }

    // Get business details and check ownership
    const businesses = await db
      .select()
      .from(business)
      .where(eq(business.ownerId, payload.id as string))
      .limit(1);

    if (businesses.length === 0) {
      return NextResponse.json(
        {
          error: "Business not found",
          message: "No business found for this user or user is not the owner",
        },
        { status: 404 }
      );
    }

    const businessData = businesses[0];

    // Get owner details
    const owners = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
      })
      .from(user)
      .where(eq(user.id, businessData.ownerId))
      .limit(1);

    const owner = owners[0];

    // Get team count
    const teamCount = await db
      .select({ count: count() })
      .from(team)
      .where(eq(team.businessId, businessData.id));

    // Get user count
    const userCount = await db
      .select({ count: count() })
      .from(teamMember)
      .innerJoin(team, eq(teamMember.teamId, team.id))
      .where(eq(team.businessId, businessData.id));

    // Parse settings
    let settings;
    try {
      settings = businessData.settings ? JSON.parse(businessData.settings) : {};
    } catch (error) {
      settings = {};
    }

    const response = {
      status: "success",
      data: {
        id: businessData.id,
        name: businessData.name,
        owner: {
          id: owner.id,
          name: owner.name,
          email: owner.email,
        },
        teamsCount: teamCount[0]?.count || 0,
        usersCount: userCount[0]?.count || 0,
        totalExpenses: businessData.totalExpenses || 0,
        activeBudgets: businessData.activeBudgets || 0,
        createdAt: businessData.createdAt.toISOString(),
        subscription: {
          plan: businessData.subscriptionPlan || "free",
          status: businessData.subscriptionStatus || "active",
          expiresAt: businessData.subscriptionExpiresAt?.toISOString() || null,
        },
        settings,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Business GET error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An error occurred while fetching business details",
        timestamp: new Date().toISOString(),
        requestId: `req_${Math.random().toString(36).substr(2, 9)}`,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        {
          error: "Authentication required",
          message: "No session token provided",
        },
        { status: 401 }
      );
    }

    // Verify JWT token
    let payload;
    try {
      const { payload: jwtPayload } = await jose.jwtVerify(
        sessionToken,
        new TextEncoder().encode(JWT_SECRET)
      );
      payload = jwtPayload;
    } catch (error) {
      return NextResponse.json(
        {
          error: "Invalid token",
          message: "Session token is invalid or expired",
        },
        { status: 401 }
      );
    }

    // Check if user is business account
    if (payload.accountType !== "business") {
      return NextResponse.json(
        {
          error: "Permission denied",
          message: "Only business accounts can update business details",
        },
        { status: 403 }
      );
    }

    // Rate limiting
    if (!checkRateLimit(payload.id as string, 10)) {
      return NextResponse.json(
        { error: "Rate limit exceeded", message: "Too many requests" },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, settings } = body;

    // Validate input
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Validation error", message: "Business name is required" },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "Business name cannot exceed 100 characters",
        },
        { status: 400 }
      );
    }

    // Validate settings if provided
    if (settings && typeof settings !== "object") {
      return NextResponse.json(
        { error: "Validation error", message: "Settings must be an object" },
        { status: 400 }
      );
    }

    // Get current business and check ownership
    const businesses = await db
      .select()
      .from(business)
      .where(eq(business.ownerId, payload.id as string))
      .limit(1);

    if (businesses.length === 0) {
      return NextResponse.json(
        {
          error: "Business not found",
          message: "No business found for this user or user is not the owner",
        },
        { status: 404 }
      );
    }

    const businessData = businesses[0];

    // Update business
    const updatedBusiness = await db
      .update(business)
      .set({
        name: name.trim(),
        settings: settings ? JSON.stringify(settings) : businessData.settings,
        updatedAt: new Date(),
      })
      .where(eq(business.id, businessData.id))
      .returning();

    if (updatedBusiness.length === 0) {
      return NextResponse.json(
        { error: "Update failed", message: "Failed to update business" },
        { status: 500 }
      );
    }

    const updated = updatedBusiness[0];

    // Parse updated settings
    let parsedSettings;
    try {
      parsedSettings = updated.settings ? JSON.parse(updated.settings) : {};
    } catch (error) {
      parsedSettings = {};
    }

    const response = {
      status: "success",
      message: "Business updated successfully",
      data: {
        id: updated.id,
        name: updated.name,
        settings: parsedSettings,
        updatedAt: updated.updatedAt.toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Business PUT error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An error occurred while updating business details",
        timestamp: new Date().toISOString(),
        requestId: `req_${Math.random().toString(36).substr(2, 9)}`,
      },
      { status: 500 }
    );
  }
}
