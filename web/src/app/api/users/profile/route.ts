// app/api/users/profile/route.ts
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
  try {
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

    // Verify JWT token
    const { payload } = await jose.jwtVerify(
      sessionToken,
      new TextEncoder().encode(JWT_SECRET)
    );

    const userId = payload.id as string;

    // Fetch user profile with business information
    const userData = await db
      .select({
        id: userSchema.id,
        name: userSchema.name,
        email: userSchema.email,
        phone: userSchema.phone,
        accountType: userSchema.accountType,
        businessId: userSchema.businessId,
        businessName: businessSchema.name,
        businessOwnerId: businessSchema.ownerId,
        createdAt: userSchema.createdAt,
        updatedAt: userSchema.updatedAt,
      })
      .from(userSchema)
      .leftJoin(businessSchema, eq(userSchema.businessId, businessSchema.id))
      .where(eq(userSchema.id, userId))
      .limit(1);

    if (userData.length === 0) {
      return NextResponse.json(
        {
          error: "User not found",
          message: "User profile not found",
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
      phone: user.phone,
      accountType: user.accountType,
      createdAt: user.createdAt?.toISOString(),
      updatedAt: user.updatedAt?.toISOString(),
    };

    // Add business context for business users
    if (user.accountType === "business" && user.businessId) {
      responseData.businessId = user.businessId;
      responseData.businessName = user.businessName;
      responseData.isBusinessOwner = user.businessOwnerId === user.id;

      // Fetch team memberships with roles
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

    // Mock preferences - can be extended with actual preferences table
    responseData.preferences = {
      currency: "USD",
      timezone: "UTC",
      notifications: {
        email: true,
        whatsapp: true,
        web: true,
      },
    };

    return NextResponse.json({
      status: "success",
      data: responseData,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);

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
        error: "Internal server error",
        message: "Failed to fetch user profile",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
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

    // Verify JWT token
    const { payload } = await jose.jwtVerify(
      sessionToken,
      new TextEncoder().encode(JWT_SECRET)
    );

    const userId = payload.id as string;
    const body = await request.json();

    console.log("Profile update request:", { userId, body });

    // Validate and update user profile
    const updateData: any = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim().length === 0) {
        return NextResponse.json(
          {
            error: "Validation error",
            message: "Name must be a non-empty string",
            code: "INVALID_NAME",
          },
          { status: 400 }
        );
      }
      updateData.name = body.name.trim();
    }

    if (body.phone !== undefined) {
      updateData.phone = body.phone?.trim() || null;
    }

    updateData.updatedAt = new Date();

    console.log("Update data:", updateData);

    const updatedUser = await db
      .update(userSchema)
      .set(updateData)
      .where(eq(userSchema.id, userId))
      .returning({
        id: userSchema.id,
        name: userSchema.name,
        email: userSchema.email,
        phone: userSchema.phone,
        accountType: userSchema.accountType,
        updatedAt: userSchema.updatedAt,
      });

    if (updatedUser.length === 0) {
      return NextResponse.json(
        {
          error: "Update failed",
          message: "Failed to update user profile",
          code: "UPDATE_FAILED",
        },
        { status: 400 }
      );
    }

    console.log("Updated user:", updatedUser[0]);

    return NextResponse.json({
      status: "success",
      message: "Profile updated successfully",
      data: updatedUser[0],
    });
  } catch (error) {
    console.error("Profile update error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to update user profile",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
