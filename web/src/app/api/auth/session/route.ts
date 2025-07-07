// app/api/auth/session/route.ts
import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";
import { db } from "@/db";
import {
  user as userSchema,
  business as businessSchema,
  team as teamSchema,
  teamMember as teamMemberSchema,
  role as roleSchema,
} from "@/db/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get("session_token")?.value;

  if (!sessionToken || !JWT_SECRET) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "No valid session found",
        code: "NO_SESSION",
      },
      { status: 401 }
    );
  }

  try {
    // Verify JWT token
    const { payload } = await jose.jwtVerify(
      sessionToken,
      new TextEncoder().encode(JWT_SECRET)
    );

    const userId = payload.id as string;
    const accountType = payload.accountType as string;

    // Fetch fresh user data from database
    const userData = await db
      .select({
        id: userSchema.id,
        name: userSchema.name,
        email: userSchema.email,
        accountType: userSchema.accountType,
        businessId: userSchema.businessId,
        businessName: businessSchema.name,
        businessOwnerId: businessSchema.ownerId,
        createdAt: userSchema.createdAt,
      })
      .from(userSchema)
      .leftJoin(businessSchema, eq(userSchema.businessId, businessSchema.id))
      .where(eq(userSchema.id, userId));

    if (userData.length === 0) {
      return NextResponse.json(
        {
          error: "User not found",
          message: "User account no longer exists",
          code: "USER_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const user = userData[0];

    // Base response
    const responseData: any = {
      id: user.id,
      name: user.name,
      email: user.email,
      accountType: user.accountType,
      createdAt: user.createdAt.toISOString(),
    };

    // Add business context for business users
    if (user.accountType === "business" && user.businessId) {
      responseData.businessId = user.businessId;
      responseData.businessName = user.businessName;
      responseData.isBusinessOwner = user.businessOwnerId === user.id;

      // Fetch current team memberships with roles
      const teamMemberships = await db
        .select({
          teamId: teamMemberSchema.teamId,
          teamName: teamSchema.name,
          roleId: teamMemberSchema.roleId,
          roleName: roleSchema.name,
          permissions: roleSchema.permissions,
        })
        .from(teamMemberSchema)
        .leftJoin(teamSchema, eq(teamMemberSchema.teamId, teamSchema.id))
        .leftJoin(roleSchema, eq(teamMemberSchema.roleId, roleSchema.id))
        .where(eq(teamMemberSchema.userId, user.id));

      responseData.teams = teamMemberships.map((tm) => ({
        id: tm.teamId,
        name: tm.teamName,
        roleId: tm.roleId,
        roleName: tm.roleName,
        permissions: tm.permissions ? JSON.parse(tm.permissions) : [],
      }));
    }

    return NextResponse.json({
      status: "success",
      data: responseData,
    });
  } catch (error) {
    console.error("Session verification error:", error);

    if (error instanceof jose.errors.JWTExpired) {
      return NextResponse.json(
        {
          error: "Session expired",
          message: "Your session has expired. Please sign in again",
          code: "SESSION_EXPIRED",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "Invalid session token",
        code: "INVALID_SESSION",
      },
      { status: 401 }
    );
  }
}
