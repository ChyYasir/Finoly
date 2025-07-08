// app/api/teams/[id]/roles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as jose from "jose";
import { db } from "@/db";
import {
  team as teamSchema,
  role as roleSchema,
  user as userSchema,
  business as businessSchema,
  generateId,
  PERMISSIONS,
  Permission,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET;

// Validation schema for creating a role
const createRoleSchema = z.object({
  name: z
    .string()
    .min(3, "Role name must be at least 3 characters")
    .max(50, "Role name must not exceed 50 characters"),
  description: z
    .string()
    .max(200, "Description must not exceed 200 characters")
    .optional(),
  permissions: z
    .array(z.string())
    .min(1, "At least one permission must be specified")
    .refine(
      (permissions) =>
        permissions.every((perm) =>
          Object.values(PERMISSIONS).includes(perm as Permission)
        ),
      "Invalid permissions specified"
    ),
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

// Helper function to check if user can manage roles in team
async function checkRoleManageAccess(
  teamId: string,
  userId: string,
  businessId: string
) {
  // Check if team exists and belongs to business
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

  const isTeamAdmin = team[0].adminUserId === userId;

  // Check if user is business owner
  const business = await db
    .select({ ownerId: businessSchema.ownerId })
    .from(businessSchema)
    .where(eq(businessSchema.id, businessId))
    .limit(1);

  const isBusinessOwner = business.length > 0 && business[0].ownerId === userId;

  const hasAccess = isTeamAdmin || isBusinessOwner;

  return { hasAccess, team: team[0] };
}

// GET /api/teams/[teamId]/roles - List all roles within a team
export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
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

    const teamId = params.teamId;

    // Check team access (any team member can view roles)
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
          eq(teamSchema.businessId, userContext.businessId),
          eq(teamSchema.isActive, true)
        )
      )
      .limit(1);

    if (team.length === 0) {
      return NextResponse.json(
        {
          error: "Not found",
          message: "Team not found or you don't have access",
          code: "TEAM_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // Fetch all roles for the team
    const roles = await db
      .select({
        id: roleSchema.id,
        name: roleSchema.name,
        description: roleSchema.description,
        permissions: roleSchema.permissions,
        userCount: roleSchema.userCount,
        isDefault: roleSchema.isDefault,
        createdAt: roleSchema.createdAt,
        updatedAt: roleSchema.updatedAt,
        createdByName: userSchema.name,
      })
      .from(roleSchema)
      .leftJoin(userSchema, eq(roleSchema.id, userSchema.id)) // This might need adjustment based on who created the role
      .where(eq(roleSchema.teamId, teamId))
      .orderBy(roleSchema.createdAt);

    // Group permissions by resource for summary
    const resourcePermissionDistribution: Record<
      string,
      Record<string, number>
    > = {};

    roles.forEach((role) => {
      const permissions = JSON.parse(role.permissions) as string[];
      permissions.forEach((permission) => {
        const [action, resource] = permission.split("_").reverse();
        if (!resourcePermissionDistribution[resource]) {
          resourcePermissionDistribution[resource] = {};
        }
        if (!resourcePermissionDistribution[resource][action]) {
          resourcePermissionDistribution[resource][action] = 0;
        }
        resourcePermissionDistribution[resource][action]++;
      });
    });

    // Format roles response
    const formattedRoles = roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: JSON.parse(role.permissions),
      permissionsByResource: groupPermissionsByResource(
        JSON.parse(role.permissions)
      ),
      userCount: role.userCount,
      isDefault: role.isDefault,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
      createdBy: role.createdByName
        ? {
            name: role.createdByName,
          }
        : null,
    }));

    return NextResponse.json({
      status: "success",
      data: {
        roles: formattedRoles,
        summary: {
          totalRoles: roles.length,
          totalUsers: roles.reduce((sum, role) => sum + role.userCount, 0),
          resourcePermissionDistribution,
        },
      },
    });
  } catch (error) {
    console.error("Get team roles error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to fetch team roles",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

// POST /api/teams/[teamId]/roles - Create a new custom role
export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } }
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

    const teamId = params.teamId;
    const { hasAccess, team } = await checkRoleManageAccess(
      teamId,
      userContext.userId,
      userContext.businessId
    );

    if (!hasAccess) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Only business owners or team admins can create roles",
          code: "PERMISSION_DENIED",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createRoleSchema.parse(body);

    // Check if role name already exists in this team
    const existingRole = await db
      .select()
      .from(roleSchema)
      .where(
        and(
          eq(roleSchema.teamId, teamId),
          eq(roleSchema.name, validatedData.name)
        )
      )
      .limit(1);

    if (existingRole.length > 0) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "Role name already exists in this team",
          details: {
            field: "name",
            code: "DUPLICATE_ROLE_NAME",
            teamId: teamId,
          },
        },
        { status: 400 }
      );
    }

    // Create the role
    const roleId = generateId("role");
    const newRole = await db
      .insert(roleSchema)
      .values({
        id: roleId,
        name: validatedData.name,
        description: validatedData.description,
        teamId: teamId,
        permissions: JSON.stringify(validatedData.permissions),
        userCount: 0,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(
      {
        status: "success",
        message: "Role created successfully",
        data: {
          id: newRole[0].id,
          name: newRole[0].name,
          description: newRole[0].description,
          permissions: validatedData.permissions,
          permissionsByResource: groupPermissionsByResource(
            validatedData.permissions
          ),
          teamId: teamId,
          teamName: team!.name,
          businessId: userContext.businessId,
          userCount: 0,
          isDefault: false,
          createdAt: newRole[0].createdAt.toISOString(),
          createdBy: {
            id: userContext.userId,
            email: userContext.email,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create role error:", error);

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
        message: "Failed to create role",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

// Helper function to group permissions by resource
function groupPermissionsByResource(permissions: string[]) {
  const grouped: Record<string, string[]> = {};

  permissions.forEach((permission) => {
    // Extract resource from permission (e.g., "create_expense" -> "expense")
    const parts = permission.split("_");
    if (parts.length >= 2) {
      const action = parts[0];
      const resource = parts.slice(1).join("_");

      if (!grouped[resource]) {
        grouped[resource] = [];
      }
      grouped[resource].push(action);
    }
  });

  return grouped;
}
