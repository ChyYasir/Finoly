// app/api/users/[userId]/route.ts
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
import { eq, and } from "drizzle-orm";
import { updateBusinessStats } from "@/lib/business/utils";

const JWT_SECRET = process.env.JWT_SECRET;

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
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

    const currentUserId = payload.id as string;
    const businessId = payload.businessId as string;
    const userIdToDelete = params.userId;

    // Check if current user is business owner
    const business = await db
      .select({ ownerId: businessSchema.ownerId })
      .from(businessSchema)
      .where(eq(businessSchema.id, businessId))
      .limit(1);

    if (business.length === 0 || business[0].ownerId !== currentUserId) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Only business owners can remove users",
          code: "PERMISSION_DENIED",
        },
        { status: 403 }
      );
    }

    // Check if user exists and belongs to this business
    const userToDelete = await db
      .select({
        id: userSchema.id,
        name: userSchema.name,
        email: userSchema.email,
        businessId: userSchema.businessId,
      })
      .from(userSchema)
      .where(eq(userSchema.id, userIdToDelete))
      .limit(1);

    if (userToDelete.length === 0) {
      return NextResponse.json(
        {
          error: "User not found",
          message: "User does not exist",
          code: "USER_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const user = userToDelete[0];

    if (user.businessId !== businessId) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "User does not belong to this business",
          code: "USER_NOT_IN_BUSINESS",
        },
        { status: 403 }
      );
    }

    // Prevent business owner from deleting themselves
    if (user.id === currentUserId) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Business owners cannot remove themselves",
          code: "CANNOT_DELETE_SELF",
        },
        { status: 403 }
      );
    }

    // Remove user from all teams first
    await db
      .delete(teamMemberSchema)
      .where(eq(teamMemberSchema.userId, userIdToDelete));

    // Remove user from business (soft delete by setting businessId to null)
    await db
      .update(userSchema)
      .set({
        businessId: null,
        updatedAt: new Date(),
      })
      .where(eq(userSchema.id, userIdToDelete));

    // Update business statistics
    await updateBusinessStats(businessId);

    return NextResponse.json({
      status: "success",
      message: "User removed from business successfully",
      data: {
        userId: userIdToDelete,
        userName: user.name,
        userEmail: user.email,
        removedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Delete user error:", error);

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
        message: "Failed to remove user",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
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

    const currentUserId = payload.id as string;
    const businessId = payload.businessId as string;
    const userIdToGet = params.userId;

    // Check if current user is business owner or requesting their own data
    const business = await db
      .select({ ownerId: businessSchema.ownerId })
      .from(businessSchema)
      .where(eq(businessSchema.id, businessId))
      .limit(1);

    const isBusinessOwner =
      business.length > 0 && business[0].ownerId === currentUserId;
    const isOwnData = currentUserId === userIdToGet;

    if (!isBusinessOwner && !isOwnData) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message:
            "You can only view your own data or all users if you're a business owner",
          code: "PERMISSION_DENIED",
        },
        { status: 403 }
      );
    }

    // Get user details
    const userData = await db
      .select({
        id: userSchema.id,
        name: userSchema.name,
        email: userSchema.email,
        phone: userSchema.phone,
        businessId: userSchema.businessId,
        createdAt: userSchema.createdAt,
        updatedAt: userSchema.updatedAt,
      })
      .from(userSchema)
      .where(
        and(
          eq(userSchema.id, userIdToGet),
          eq(userSchema.businessId, businessId)
        )
      )
      .limit(1);

    if (userData.length === 0) {
      return NextResponse.json(
        {
          error: "User not found",
          message: "User does not exist or doesn't belong to this business",
          code: "USER_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const user = userData[0];

    // Get team memberships
    const teamMemberships = await db
      .select({
        teamId: teamMemberSchema.teamId,
        teamName: teamSchema.name,
        roleId: teamMemberSchema.roleId,
        roleName: roleSchema.name,
      })
      .from(teamMemberSchema)
      .leftJoin(teamSchema, eq(teamMemberSchema.teamId, teamSchema.id))
      .leftJoin(roleSchema, eq(teamMemberSchema.roleId, roleSchema.id))
      .where(eq(teamMemberSchema.userId, user.id));

    const responseData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      businessId: user.businessId,
      teams: teamMemberships.map((tm) => ({
        teamId: tm.teamId,
        teamName: tm.teamName,
        roleId: tm.roleId,
        roleName: tm.roleName,
      })),
      createdAt: user.createdAt?.toISOString(),
      updatedAt: user.updatedAt?.toISOString(),
    };

    return NextResponse.json({
      status: "success",
      data: responseData,
    });
  } catch (error) {
    console.error("Get user error:", error);

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
        message: "Failed to fetch user",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
