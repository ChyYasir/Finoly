// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as jose from "jose";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import {
  user as userSchema,
  business as businessSchema,
  team as teamSchema,
  teamMember as teamMemberSchema,
  role as roleSchema,
  generateId,
} from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { updateBusinessStats } from "@/lib/business/utils";

const JWT_SECRET = process.env.JWT_SECRET;

const addUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  teams: z
    .array(
      z.object({
        teamId: z.string(),
        roleId: z.string(),
      })
    )
    .min(1, "At least one team assignment is required"),
  sendInvitation: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
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
    const businessId = payload.businessId as string;

    // Check if user is business owner
    const business = await db
      .select({ ownerId: businessSchema.ownerId })
      .from(businessSchema)
      .where(eq(businessSchema.id, businessId))
      .limit(1);

    if (business.length === 0 || business[0].ownerId !== userId) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Only business owners can add users",
          code: "PERMISSION_DENIED",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, teams, sendInvitation } = addUserSchema.parse(body);

    // Check if user already exists
    const existingUser = await db
      .select({ id: userSchema.id })
      .from(userSchema)
      .where(eq(userSchema.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        {
          error: "User already exists",
          message: "A user with this email already exists",
          code: "DUPLICATE_EMAIL",
        },
        { status: 400 }
      );
    }

    // Verify all teams and roles exist and belong to this business
    for (const teamAssignment of teams) {
      const teamCheck = await db
        .select({ id: teamSchema.id })
        .from(teamSchema)
        .where(
          and(
            eq(teamSchema.id, teamAssignment.teamId),
            eq(teamSchema.businessId, businessId)
          )
        )
        .limit(1);

      if (teamCheck.length === 0) {
        return NextResponse.json(
          {
            error: "Invalid team",
            message: `Team ${teamAssignment.teamId} does not exist or doesn't belong to this business`,
            code: "TEAM_NOT_FOUND",
          },
          { status: 400 }
        );
      }

      const roleCheck = await db
        .select({ id: roleSchema.id })
        .from(roleSchema)
        .where(
          and(
            eq(roleSchema.id, teamAssignment.roleId),
            eq(roleSchema.teamId, teamAssignment.teamId)
          )
        )
        .limit(1);

      if (roleCheck.length === 0) {
        return NextResponse.json(
          {
            error: "Invalid role",
            message: `Role ${teamAssignment.roleId} does not exist in team ${teamAssignment.teamId}`,
            code: "ROLE_NOT_FOUND",
          },
          { status: 400 }
        );
      }
    }

    // Create new user
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);
    const newUserId = generateId("usr");

    const newUser = await db
      .insert(userSchema)
      .values({
        id: newUserId,
        name,
        email,
        hashedPassword,
        accountType: "business",
        businessId,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({
        id: userSchema.id,
        name: userSchema.name,
        email: userSchema.email,
        createdAt: userSchema.createdAt,
      });

    const createdUser = newUser[0];

    // Assign user to teams
    const teamAssignments = [];
    for (const teamAssignment of teams) {
      const teamMemberId = generateId("tm");

      await db.insert(teamMemberSchema).values({
        id: teamMemberId,
        userId: createdUser.id,
        teamId: teamAssignment.teamId,
        roleId: teamAssignment.roleId,
        joinedAt: new Date(),
      });

      // Get team and role details for response
      const teamDetails = await db
        .select({
          teamName: teamSchema.name,
          roleName: roleSchema.name,
        })
        .from(teamSchema)
        .leftJoin(roleSchema, eq(roleSchema.id, teamAssignment.roleId))
        .where(eq(teamSchema.id, teamAssignment.teamId))
        .limit(1);

      teamAssignments.push({
        teamId: teamAssignment.teamId,
        teamName: teamDetails[0]?.teamName,
        roleId: teamAssignment.roleId,
        roleName: teamDetails[0]?.roleName,
      });
    }

    // TODO: Send invitation email if sendInvitation is true
    // This would integrate with your email service

    // Update business statistics
    await updateBusinessStats(businessId);

    return NextResponse.json({
      status: "success",
      message: "User added successfully",
      data: {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        businessId,
        teams: teamAssignments,
        invitationSent: sendInvitation,
        createdAt: createdUser.createdAt?.toISOString(),
        tempPassword: sendInvitation ? undefined : tempPassword, // Only return temp password if not sending invitation
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: error.errors[0].message,
          details: {
            field: error.errors[0].path[0],
            code: "VALIDATION_ERROR",
          },
        },
        { status: 400 }
      );
    }

    console.error("Add user error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to add user",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

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
    const businessId = payload.businessId as string;

    // Check if user is business owner
    const business = await db
      .select({ ownerId: businessSchema.ownerId })
      .from(businessSchema)
      .where(eq(businessSchema.id, businessId))
      .limit(1);

    if (business.length === 0 || business[0].ownerId !== userId) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Only business owners can view all users",
          code: "PERMISSION_DENIED",
        },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");
    const role = searchParams.get("role");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
    const offset = (page - 1) * limit;

    // Get all users in the business with their team memberships
    let query = db
      .select({
        id: userSchema.id,
        name: userSchema.name,
        email: userSchema.email,
        createdAt: userSchema.createdAt,
        updatedAt: userSchema.updatedAt,
      })
      .from(userSchema)
      .where(eq(userSchema.businessId, businessId));

    const users = await query.limit(limit).offset(offset);

    // Get team memberships for each user
    const usersWithTeams = await Promise.all(
      users.map(async (user) => {
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

        return {
          ...user,
          teams: teamMemberships.map((tm) => ({
            teamId: tm.teamId,
            teamName: tm.teamName,
            roleId: tm.roleId,
            roleName: tm.roleName,
          })),
          createdAt: user.createdAt?.toISOString(),
          updatedAt: user.updatedAt?.toISOString(),
        };
      })
    );

    // Filter by team and role if specified
    let filteredUsers = usersWithTeams;
    if (teamId) {
      filteredUsers = filteredUsers.filter((user) =>
        user.teams.some((team) => team.teamId === teamId)
      );
    }
    if (role) {
      filteredUsers = filteredUsers.filter((user) =>
        user.teams.some((team) => team.roleName === role)
      );
    }

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: count() })
      .from(userSchema)
      .where(eq(userSchema.businessId, businessId));

    const total = totalCountResult[0]?.count || 0;

    return NextResponse.json({
      status: "success",
      data: {
        users: filteredUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("List users error:", error);

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
        message: "Failed to fetch users",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
