// app/api/teams/[id]/members/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";
import { db } from "@/db";
import {
  team as teamSchema,
  teamMember as teamMemberSchema,
  role as roleSchema,
  user as userSchema,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET;

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

// DELETE /api/teams/[id]/members/[userId] - Remove member from team
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
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
    const targetUserId = params.userId;

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

    // Check if target user is the team admin
    if (team!.adminUserId === targetUserId) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "Cannot remove team admin. Transfer admin role first",
          code: "CANNOT_REMOVE_ADMIN",
        },
        { status: 400 }
      );
    }

    // Find the team member record
    const teamMember = await db
      .select({
        id: teamMemberSchema.id,
        userId: teamMemberSchema.userId,
        roleId: teamMemberSchema.roleId,
        teamId: teamMemberSchema.teamId,
        joinedAt: teamMemberSchema.joinedAt,
        userName: userSchema.name,
        userEmail: userSchema.email,
      })
      .from(teamMemberSchema)
      .leftJoin(userSchema, eq(teamMemberSchema.userId, userSchema.id))
      .where(
        and(
          eq(teamMemberSchema.teamId, teamId),
          eq(teamMemberSchema.userId, targetUserId)
        )
      )
      .limit(1);

    if (teamMember.length === 0) {
      return NextResponse.json(
        {
          error: "Not found",
          message: "User is not a member of this team",
          code: "USER_NOT_IN_TEAM",
        },
        { status: 404 }
      );
    }

    const member = teamMember[0];

    // Remove user from team
    await db.transaction(async (tx) => {
      // Delete team member record
      await tx
        .delete(teamMemberSchema)
        .where(eq(teamMemberSchema.id, member.id));

      // Update team member count
      await tx
        .update(teamSchema)
        .set({
          memberCount: sql`GREATEST(${teamSchema.memberCount} - 1, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(teamSchema.id, teamId));

      // Update role user count if role exists
      if (member.roleId) {
        await tx
          .update(roleSchema)
          .set({
            userCount: sql`GREATEST(${roleSchema.userCount} - 1, 0)`,
            updatedAt: new Date(),
          })
          .where(eq(roleSchema.id, member.roleId));
      }
    });

    return NextResponse.json({
      status: "success",
      message: "User removed from team successfully",
      data: {
        userId: targetUserId,
        userName: member.userName,
        userEmail: member.userEmail,
        teamId: teamId,
        teamName: team!.name,
        removedAt: new Date().toISOString(),
        removedBy: {
          id: userContext.userId,
          email: userContext.email,
        },
      },
    });
  } catch (error) {
    console.error("Remove team member error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to remove team member",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
