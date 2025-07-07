// app/api/teams/route.ts
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
  generateId,
  getDefaultPermissions,
} from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET;

// Validation schemas
const createTeamSchema = z.object({
  name: z
    .string()
    .min(3, "Team name must be at least 3 characters")
    .max(50, "Team name must not exceed 50 characters"),
  description: z
    .string()
    .max(200, "Description must not exceed 200 characters")
    .optional(),
  adminUserId: z.string().min(1, "Admin user ID is required").optional(),
  members: z
    .array(
      z.object({
        userId: z.string(),
        roleId: z.string().optional(),
      })
    )
    .optional(),
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

// GET /api/teams - List teams for the authenticated user
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
    const offset = (page - 1) * limit;

    // For individual users, return empty array
    if (userContext.accountType === "individual") {
      return NextResponse.json({
        status: "success",
        data: {
          teams: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        },
      });
    }

    // For business users, get teams they have access to
    const userTeams = await db
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
        userRole: roleSchema.name,
        userPermissions: roleSchema.permissions,
        memberRoleId: teamMemberSchema.roleId,
      })
      .from(teamSchema)
      .leftJoin(userSchema, eq(teamSchema.adminUserId, userSchema.id))
      .leftJoin(
        teamMemberSchema,
        and(
          eq(teamMemberSchema.teamId, teamSchema.id),
          eq(teamMemberSchema.userId, userContext.userId)
        )
      )
      .leftJoin(roleSchema, eq(teamMemberSchema.roleId, roleSchema.id))
      .where(
        and(
          eq(teamSchema.businessId, userContext.businessId),
          eq(teamSchema.isActive, true)
        )
      )
      .orderBy(desc(teamSchema.createdAt))
      .limit(limit)
      .offset(offset);

    // Filter teams where user is a member or admin
    const accessibleTeams = userTeams.filter(
      (team) =>
        team.adminUserId === userContext.userId || team.memberRoleId !== null
    );

    // Format response
    const formattedTeams = accessibleTeams.map((team) => ({
      id: team.id,
      name: team.name,
      description: team.description,
      businessId: team.businessId,
      admin: {
        id: team.adminUserId,
        name: team.adminName,
        email: team.adminEmail,
      },
      memberCount: team.memberCount || 0,
      budgetCount: team.budgetCount || 0,
      totalExpenses: team.totalExpenses || 0,
      userRole:
        team.userRole ||
        (team.adminUserId === userContext.userId ? "admin" : "member"),
      userPermissions: team.userPermissions
        ? JSON.parse(team.userPermissions)
        : [],
      isActive: team.isActive,
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      status: "success",
      data: {
        teams: formattedTeams,
        pagination: {
          page,
          limit,
          total: accessibleTeams.length,
          totalPages: Math.ceil(accessibleTeams.length / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get teams error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to fetch teams",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

// POST /api/teams - Create a new team
export async function POST(request: NextRequest) {
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

    // Only business accounts can create teams
    if (userContext.accountType !== "business") {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Only business accounts can create teams",
          code: "BUSINESS_ACCOUNT_REQUIRED",
        },
        { status: 403 }
      );
    }

    // Check if user is business owner
    const business = await db
      .select()
      .from(businessSchema)
      .where(eq(businessSchema.id, userContext.businessId))
      .limit(1);

    if (business.length === 0 || business[0].ownerId !== userContext.userId) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Only business owners can create teams",
          code: "BUSINESS_OWNER_REQUIRED",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createTeamSchema.parse(body);

    // Use provided admin user or default to current user
    const adminUserId = validatedData.adminUserId || userContext.userId;

    // Verify admin user exists and belongs to business
    const adminUser = await db
      .select()
      .from(userSchema)
      .where(
        and(
          eq(userSchema.id, adminUserId),
          eq(userSchema.businessId, userContext.businessId)
        )
      )
      .limit(1);

    if (adminUser.length === 0) {
      return NextResponse.json(
        {
          error: "Validation error",
          message:
            "Admin user does not exist or does not belong to this business",
          code: "INVALID_ADMIN_USER",
        },
        { status: 400 }
      );
    }

    // Check if team name already exists in business
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

    // Create team with default roles in a transaction
    const result = await db.transaction(async (tx) => {
      // Create the team
      const teamId = generateId("team");
      const newTeam = await tx
        .insert(teamSchema)
        .values({
          id: teamId,
          name: validatedData.name,
          description: validatedData.description,
          businessId: userContext.businessId,
          adminUserId: adminUserId,
          memberCount: 1, // Start with 1 member (the admin)
          budgetCount: 0,
          totalExpenses: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Create default roles for the team
      const adminRoleId = generateId("role");
      const memberRoleId = generateId("role");
      const viewerRoleId = generateId("role");

      const defaultRoles = await tx
        .insert(roleSchema)
        .values([
          {
            id: adminRoleId,
            name: "Team Admin",
            description: "Full access to all team resources",
            teamId: teamId,
            permissions: JSON.stringify(getDefaultPermissions("admin")),
            userCount: 1, // Admin will be assigned this role
            isDefault: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: memberRoleId,
            name: "Team Member",
            description: "Can create and manage expenses and budgets",
            teamId: teamId,
            permissions: JSON.stringify(getDefaultPermissions("member")),
            userCount: 0,
            isDefault: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: viewerRoleId,
            name: "Viewer",
            description: "Read-only access to team data",
            teamId: teamId,
            permissions: JSON.stringify(getDefaultPermissions("viewer")),
            userCount: 0,
            isDefault: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ])
        .returning();

      // Add admin as team member with admin role
      const adminMemberId = generateId("member");
      await tx.insert(teamMemberSchema).values({
        id: adminMemberId,
        teamId: teamId,
        userId: adminUserId,
        roleId: adminRoleId,
        joinedAt: new Date(),
        createdAt: new Date(),
      });

      // Add additional members if provided
      let additionalMembers = 0;
      if (validatedData.members && validatedData.members.length > 0) {
        for (const member of validatedData.members) {
          // Verify user exists and belongs to business
          const memberUser = await tx
            .select()
            .from(userSchema)
            .where(
              and(
                eq(userSchema.id, member.userId),
                eq(userSchema.businessId, userContext.businessId)
              )
            )
            .limit(1);

          if (memberUser.length === 0) {
            continue; // Skip invalid users
          }

          // Use provided role or default to member role
          const roleId = member.roleId || memberRoleId;

          // Verify role exists and belongs to this team
          const roleExists = defaultRoles.find((r) => r.id === roleId);
          if (!roleExists) {
            continue; // Skip invalid roles
          }

          // Add team member
          const memberId = generateId("member");
          await tx.insert(teamMemberSchema).values({
            id: memberId,
            teamId: teamId,
            userId: member.userId,
            roleId: roleId,
            joinedAt: new Date(),
            createdAt: new Date(),
          });

          additionalMembers++;

          // Update role user count using SQL increment
          await tx
            .update(roleSchema)
            .set({
              userCount: sql`${roleSchema.userCount} + 1`,
              updatedAt: new Date(),
            })
            .where(eq(roleSchema.id, roleId));
        }

        // Update final member count if additional members were added
        if (additionalMembers > 0) {
          await tx
            .update(teamSchema)
            .set({
              memberCount: sql`${teamSchema.memberCount} + ${additionalMembers}`,
              updatedAt: new Date(),
            })
            .where(eq(teamSchema.id, teamId));
        }
      }

      // Get current business teams count first, then increment
      const currentBusiness = await tx
        .select({ teamsCount: businessSchema.teamsCount })
        .from(businessSchema)
        .where(eq(businessSchema.id, userContext.businessId))
        .limit(1);

      const currentTeamsCount = currentBusiness[0]?.teamsCount || 0;

      // Update business teams count with explicit value
      await tx
        .update(businessSchema)
        .set({
          teamsCount: currentTeamsCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(businessSchema.id, userContext.businessId));

      return { team: newTeam[0], roles: defaultRoles };
    });

    // Fetch complete team data for response
    const completeTeam = await db
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
      .where(eq(teamSchema.id, result.team.id))
      .limit(1);

    return NextResponse.json(
      {
        status: "success",
        message: "Team created successfully",
        data: {
          id: completeTeam[0].id,
          name: completeTeam[0].name,
          description: completeTeam[0].description,
          businessId: completeTeam[0].businessId,
          admin: {
            id: completeTeam[0].adminUserId,
            name: completeTeam[0].adminName,
            email: completeTeam[0].adminEmail,
          },
          memberCount: completeTeam[0].memberCount,
          budgetCount: completeTeam[0].budgetCount,
          totalExpenses: completeTeam[0].totalExpenses,
          defaultRoles: result.roles.map((role) => ({
            id: role.id,
            name: role.name,
            description: role.description,
            permissions: JSON.parse(role.permissions),
          })),
          createdAt: completeTeam[0].createdAt.toISOString(),
          updatedAt: completeTeam[0].updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create team error:", error);

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
        message: "Failed to create team",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
