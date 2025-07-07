// app/api/teams/[id]/members/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as jose from "jose";
import { db } from "@/db";
import {
  team as teamSchema,
  teamMember as teamMemberSchema,
  role as roleSchema,
  user as userSchema,
  generateId,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET;

// Validation schema
const addMemberSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  roleId: z.string().min(1, "Role ID is required"),
});

// Helper function to verify JWT and extract user context
async function verifyAuth(request: NextRequest) {
  const sessionToken = request.cookies.get("session_token")?.value;

  if (!sessionToken || !JWT_SECRET) {
    return null;
  }

  try {
    const { payload } = await jose.jwtVerify(
      sessionToken,
      new TextEncoder().encode(JWT_SECRET)
    );

    return {
      userId: payload.id as string,
      email: payload.email as string,
      accountType: payload.accountType as string,
      businessId: payload.businessId as string,
      teams: payload.teams as any[],
    };
  } catch (error) {
    return null;
  }
}

// Helper function to check if user can manage team
async function checkTeamManageAccess(
  teamId: string,
  userId: string,
  businessId: string
) {
  const team = await db
    .select({
      id: teamSchema.id,
      name: teamSchema.name,
      businessId: teamSchema.businessId,
      adminUserId: teamSchema.adminUserId,
      isActive: teamSchema.isActive,
    })
    .from(teamSchema)
    .where(
      and(
        eq(teamSchema.id, teamId),
        eq(teamSchema.businessId, businessId),
        eq(teamSchema.isActive, true)
      )
    )
    .limit(1);

  if (team.length === 0) {
    return { hasAccess: false, team: null };
  }

  const isAdmin = team[0].adminUserId === userId;

  // Check if user is business owner (they can manage any team)
  const business = await db
    .select({ ownerId: userSchema.businessId })
    .from(userSchema)
    .where(eq(userSchema.id, userId))
    .limit(1);

  const isBusinessOwner = business.length > 0 && business[0].ownerId === userId;

  const hasAccess = isAdmin || isBusinessOwner;

  return { hasAccess, team: team[0] };
}

// POST /api/teams/[id]/members - Add member to team
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userContext = await verifyAuth(request);

    if (!userContext) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Authentication required",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    const teamId = params.id;
    const { hasAccess, team } = await checkTeamManageAccess(
      teamId,
      userContext.userId,
      userContext.businessId
    );

    if (!hasAccess) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "You don't have permission to manage this team",
          code: "TEAM_MANAGE_DENIED",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = addMemberSchema.parse(body);

    // Verify user exists and belongs to the business
    const targetUser = await db
      .select()
      .from(userSchema)
      .where(
        and(
          eq(userSchema.id, validatedData.userId),
          eq(userSchema.businessId, userContext.businessId)
        )
      )
      .limit(1);

    if (targetUser.length === 0) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "User does not exist or does not belong to this business",
          code: "USER_NOT_IN_BUSINESS",
        },
        { status: 400 }
      );
    }

    // Verify role exists and belongs to this team
    const targetRole = await db
      .select()
      .from(roleSchema)
      .where(
        and(
          eq(roleSchema.id, validatedData.roleId),
          eq(roleSchema.teamId, teamId)
        )
      )
      .limit(1);

    if (targetRole.length === 0) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "Role does not exist in this team",
          code: "ROLE_NOT_IN_TEAM",
        },
        { status: 400 }
      );
    }

    // Check if user is already a member of this team
    const existingMember = await db
      .select()
      .from(teamMemberSchema)
      .where(
        and(
          eq(teamMemberSchema.teamId, teamId),
          eq(teamMemberSchema.userId, validatedData.userId)
        )
      )
      .limit(1);

    if (existingMember.length > 0) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "User is already a member of this team",
          code: "USER_ALREADY_IN_TEAM",
        },
        { status: 409 }
      );
    }

    // Add user to team
    const result = await db.transaction(async (tx) => {
      // Insert team member
      const memberId = generateId("member");
      const newMember = await tx
        .insert(teamMemberSchema)
        .values({
          id: memberId,
          teamId: teamId,
          userId: validatedData.userId,
          roleId: validatedData.roleId,
          joinedAt: new Date(),
          createdAt: new Date(),
        })
        .returning();

      // Update team member count
      await tx
        .update(teamSchema)
        .set({
          memberCount: sql`${teamSchema.memberCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(teamSchema.id, teamId));

      // Update role user count
      await tx
        .update(roleSchema)
        .set({
          userCount: sql`${roleSchema.userCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(roleSchema.id, validatedData.roleId));

      return newMember[0];
    });

    return NextResponse.json(
      {
        status: "success",
        message: "User assigned to team successfully",
        data: {
          id: result.id,
          userId: validatedData.userId,
          userName: targetUser[0].name,
          userEmail: targetUser[0].email,
          teamId: teamId,
          teamName: team!.name,
          roleId: validatedData.roleId,
          roleName: targetRole[0].name,
          permissions: JSON.parse(targetRole[0].permissions),
          joinedAt: result.joinedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add team member error:", error);

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

    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to add team member",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
