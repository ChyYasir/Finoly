// app/api/teams/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as jose from "jose";
import { db } from "@/db";
import {
  team as teamSchema,
  teamMember as teamMemberSchema,
  role as roleSchema,
  user as userSchema,
  business as businessSchema,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET;

// Validation schemas
const updateTeamSchema = z.object({
  name: z
    .string()
    .min(3, "Team name must be at least 3 characters")
    .max(50, "Team name must not exceed 50 characters")
    .optional(),
  description: z
    .string()
    .max(200, "Description must not exceed 200 characters")
    .optional(),
  adminUserId: z.string().optional(),
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

// Helper function to check if user can access team
async function checkTeamAccess(
  teamId: string,
  userId: string,
  businessId: string,
  requireAdmin: boolean = false
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
    return { hasAccess: false, isAdmin: false, team: null };
  }

  const isAdmin = team[0].adminUserId === userId;

  if (requireAdmin && !isAdmin) {
    return { hasAccess: false, isAdmin: false, team: team[0] };
  }

  // Check if user is a member of the team
  const membership = await db
    .select()
    .from(teamMemberSchema)
    .where(
      and(
        eq(teamMemberSchema.teamId, teamId),
        eq(teamMemberSchema.userId, userId)
      )
    )
    .limit(1);

  const isMember = membership.length > 0;
  const hasAccess = isAdmin || isMember;

  return { hasAccess, isAdmin, team: team[0] };
}

// GET /api/teams/[id] - Get team details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await request.text();
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
    const { hasAccess, isAdmin, team } = await checkTeamAccess(
      teamId,
      userContext.userId,
      userContext.businessId
    );

    if (!hasAccess) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "You don't have access to this team",
          code: "TEAM_ACCESS_DENIED",
        },
        { status: 403 }
      );
    }

    // Fetch complete team data
    const teamData = await db
      .select({
        id: teamSchema.id,
        name: teamSchema.name,
        description: teamSchema.description,
        businessId: teamSchema.businessId,
        adminUserId: teamSchema.adminUserId,
        memberCount: teamSchema.memberCount,
        budgetCount: teamSchema.budgetCount,
        totalExpenses: teamSchema.totalExpenses,
        isActive: teamSchema.isActive,
        createdAt: teamSchema.createdAt,
        updatedAt: teamSchema.updatedAt,
        adminName: userSchema.name,
        adminEmail: userSchema.email,
        businessName: businessSchema.name,
      })
      .from(teamSchema)
      .leftJoin(userSchema, eq(teamSchema.adminUserId, userSchema.id))
      .leftJoin(businessSchema, eq(teamSchema.businessId, businessSchema.id))
      .where(eq(teamSchema.id, teamId))
      .limit(1);

    // Fetch team members
    const members = await db
      .select({
        id: teamMemberSchema.id,
        userId: teamMemberSchema.userId,
        roleId: teamMemberSchema.roleId,
        joinedAt: teamMemberSchema.joinedAt,
        userName: userSchema.name,
        userEmail: userSchema.email,
        roleName: roleSchema.name,
        rolePermissions: roleSchema.permissions,
      })
      .from(teamMemberSchema)
      .leftJoin(userSchema, eq(teamMemberSchema.userId, userSchema.id))
      .leftJoin(roleSchema, eq(teamMemberSchema.roleId, roleSchema.id))
      .where(eq(teamMemberSchema.teamId, teamId));

    // Fetch team roles
    const roles = await db
      .select()
      .from(roleSchema)
      .where(eq(roleSchema.teamId, teamId));

    // Format response
    const formattedTeam = {
      id: teamData[0].id,
      name: teamData[0].name,
      description: teamData[0].description,
      businessId: teamData[0].businessId,
      businessName: teamData[0].businessName,
      admin: {
        id: teamData[0].adminUserId,
        name: teamData[0].adminName,
        email: teamData[0].adminEmail,
      },
      members: members.map((member) => ({
        id: member.id,
        user: {
          id: member.userId,
          name: member.userName,
          email: member.userEmail,
        },
        role: member.roleId
          ? {
              id: member.roleId,
              name: member.roleName,
              permissions: member.rolePermissions
                ? JSON.parse(member.rolePermissions)
                : [],
            }
          : null,
        joinedAt: member.joinedAt.toISOString(),
      })),
      roles: roles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: JSON.parse(role.permissions),
        userCount: role.userCount,
        isDefault: role.isDefault,
      })),
      stats: {
        memberCount: teamData[0].memberCount,
        budgetCount: teamData[0].budgetCount,
        totalExpenses: teamData[0].totalExpenses,
      },
      userRole: isAdmin ? "admin" : "member",
      createdAt: teamData[0].createdAt.toISOString(),
      updatedAt: teamData[0].updatedAt.toISOString(),
    };

    return NextResponse.json({
      status: "success",
      data: formattedTeam,
    });
  } catch (error) {
    console.error("Get team details error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to fetch team details",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

// PUT /api/teams/[id] - Update team
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
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
    const { hasAccess, isAdmin, team } = await checkTeamAccess(
      teamId,
      userContext.userId,
      userContext.businessId,
      true // Require admin access
    );

    if (!hasAccess) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "You don't have permission to update this team",
          code: "TEAM_UPDATE_DENIED",
        },
        { status: 403 }
      );
    }

    const validatedData = updateTeamSchema.parse(body);

    // Check if new team name already exists (if name is being updated)
    if (validatedData.name && validatedData.name !== team!.name) {
      const existingTeam = await db
        .select()
        .from(teamSchema)
        .where(
          and(
            eq(teamSchema.name, validatedData.name),
            eq(teamSchema.businessId, userContext.businessId),
            eq(teamSchema.isActive, true)
          )
        )
        .limit(1);

      if (existingTeam.length > 0) {
        return NextResponse.json(
          {
            error: "Validation error",
            message: "Team name already exists in this business",
            code: "DUPLICATE_TEAM_NAME",
          },
          { status: 400 }
        );
      }
    }

    // Verify new admin user if provided
    if (
      validatedData.adminUserId &&
      validatedData.adminUserId !== team!.adminUserId
    ) {
      const newAdmin = await db
        .select()
        .from(userSchema)
        .where(
          and(
            eq(userSchema.id, validatedData.adminUserId),
            eq(userSchema.businessId, userContext.businessId)
          )
        )
        .limit(1);

      if (newAdmin.length === 0) {
        return NextResponse.json(
          {
            error: "Validation error",
            message:
              "New admin user does not exist or does not belong to this business",
            code: "INVALID_ADMIN_USER",
          },
          { status: 400 }
        );
      }
    }

    // Update team
    const updatedTeam = await db
      .update(teamSchema)
      .set({
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.description !== undefined && {
          description: validatedData.description,
        }),
        ...(validatedData.adminUserId && {
          adminUserId: validatedData.adminUserId,
        }),
        updatedAt: new Date(),
      })
      .where(eq(teamSchema.id, teamId))
      .returning();

    // Fetch updated team data
    const teamData = await db
      .select({
        id: teamSchema.id,
        name: teamSchema.name,
        description: teamSchema.description,
        businessId: teamSchema.businessId,
        adminUserId: teamSchema.adminUserId,
        memberCount: teamSchema.memberCount,
        budgetCount: teamSchema.budgetCount,
        totalExpenses: teamSchema.totalExpenses,
        isActive: teamSchema.isActive,
        createdAt: teamSchema.createdAt,
        updatedAt: teamSchema.updatedAt,
        adminName: userSchema.name,
        adminEmail: userSchema.email,
      })
      .from(teamSchema)
      .leftJoin(userSchema, eq(teamSchema.adminUserId, userSchema.id))
      .where(eq(teamSchema.id, teamId))
      .limit(1);

    return NextResponse.json({
      status: "success",
      message: "Team updated successfully",
      data: {
        id: teamData[0].id,
        name: teamData[0].name,
        description: teamData[0].description,
        businessId: teamData[0].businessId,
        admin: {
          id: teamData[0].adminUserId,
          name: teamData[0].adminName,
          email: teamData[0].adminEmail,
        },
        memberCount: teamData[0].memberCount,
        budgetCount: teamData[0].budgetCount,
        totalExpenses: teamData[0].totalExpenses,
        updatedAt: teamData[0].updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Update team error:", error);

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
        message: "Failed to update team",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/[id] - Delete team (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await request.text();
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
    const { hasAccess, isAdmin, team } = await checkTeamAccess(
      teamId,
      userContext.userId,
      userContext.businessId,
      true // Require admin access
    );

    if (!hasAccess) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "You don't have permission to delete this team",
          code: "TEAM_DELETE_DENIED",
        },
        { status: 403 }
      );
    }

    // Soft delete team (set isActive to false)
    await db.transaction(async (tx) => {
      // Deactivate team
      await tx
        .update(teamSchema)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(teamSchema.id, teamId));

      // Update business teams count
      await tx
        .update(businessSchema)
        .set({
          teamsCount: sql`GREATEST(${businessSchema.teamsCount} - 1, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(businessSchema.id, userContext.businessId));
    });

    return NextResponse.json({
      status: "success",
      message: "Team deleted successfully",
      data: {
        teamId: teamId,
        deletedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Delete team error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to delete team",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}