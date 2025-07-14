// app/api/teams/[teamId]/roles/[roleId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as jose from "jose";
import { db } from "@/db";
import {
  team as teamSchema,
  role as roleSchema,
  teamMember as teamMemberSchema,
  user as userSchema,
  business as businessSchema,
  PERMISSIONS,
  Permission,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET;

// Validation schema for updating a role
const updateRoleSchema = z.object({
  name: z
    .string()
    .min(3, "Role name must be at least 3 characters")
    .max(50, "Role name must not exceed 50 characters")
    .optional(),
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

// Helper function to group permissions by resource
function groupPermissionsByResource(permissions: string[]) {
  const grouped: Record<string, string[]> = {};

  permissions.forEach((permission) => {
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

// PUT /api/teams/[teamId]/roles/[roleId] - Update role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; roleId: string }> }
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

    const { teamId, roleId } = await params;
    const { hasAccess, team } = await checkRoleManageAccess(
      teamId,
      userContext.userId,
      userContext.businessId
    );

    if (!hasAccess) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Only business owners or team admins can update roles",
          code: "PERMISSION_DENIED",
        },
        { status: 403 }
      );
    }

    // Check if role exists and belongs to this team
    const existingRole = await db
      .select()
      .from(roleSchema)
      .where(and(eq(roleSchema.id, roleId), eq(roleSchema.teamId, teamId)))
      .limit(1);

    if (existingRole.length === 0) {
      return NextResponse.json(
        {
          error: "Not found",
          message: "Role not found in this team",
          code: "ROLE_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateRoleSchema.parse(body);

    // Check if new name conflicts with existing roles (if name is being updated)
    if (validatedData.name && validatedData.name !== existingRole[0].name) {
      const nameConflict = await db
        .select()
        .from(roleSchema)
        .where(
          and(
            eq(roleSchema.teamId, teamId),
            eq(roleSchema.name, validatedData.name)
          )
        )
        .limit(1);

      if (nameConflict.length > 0) {
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
    }

    // Update the role
    const updatedRole = await db
      .update(roleSchema)
      .set({
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.description !== undefined && {
          description: validatedData.description,
        }),
        ...(validatedData.permissions && {
          permissions: JSON.stringify(validatedData.permissions),
        }),
        updatedAt: new Date(),
      })
      .where(eq(roleSchema.id, roleId))
      .returning();

    // Get the final permissions array
    const finalPermissions =
      validatedData.permissions || JSON.parse(existingRole[0].permissions);

    return NextResponse.json({
      status: "success",
      message: "Role updated successfully",
      data: {
        id: updatedRole[0].id,
        name: updatedRole[0].name,
        description: updatedRole[0].description,
        permissions: finalPermissions,
        permissionsByResource: groupPermissionsByResource(finalPermissions),
        teamId: teamId,
        teamName: team!.name,
        userCount: updatedRole[0].userCount,
        isDefault: updatedRole[0].isDefault,
        updatedAt: updatedRole[0].updatedAt.toISOString(),
        updatedBy: {
          id: userContext.userId,
          email: userContext.email,
        },
      },
    });
  } catch (error) {
    console.error("Update role error:", error);

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
        message: "Failed to update role",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/[teamId]/roles/[roleId] - Delete role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; roleId: string }> }
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

    const { teamId, roleId } = await params;
    const { hasAccess, team } = await checkRoleManageAccess(
      teamId,
      userContext.userId,
      userContext.businessId
    );

    if (!hasAccess) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Only business owners or team admins can delete roles",
          code: "PERMISSION_DENIED",
        },
        { status: 403 }
      );
    }

    // Parse query parameters for reassignment
    const { searchParams } = new URL(request.url);
    const reassignToRoleId = searchParams.get("reassignToRoleId");

    // Check if role exists and belongs to this team
    const existingRole = await db
      .select()
      .from(roleSchema)
      .where(and(eq(roleSchema.id, roleId), eq(roleSchema.teamId, teamId)))
      .limit(1);

    if (existingRole.length === 0) {
      return NextResponse.json(
        {
          error: "Not found",
          message: "Role not found in this team",
          code: "ROLE_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const role = existingRole[0];

    // Check if role has assigned users
    const usersWithRole = await db
      .select({ userId: teamMemberSchema.userId })
      .from(teamMemberSchema)
      .where(eq(teamMemberSchema.roleId, roleId));

    // If role has users and no reassignment role provided, require reassignment
    if (usersWithRole.length > 0 && !reassignToRoleId) {
      return NextResponse.json(
        {
          error: "Reassignment required",
          message:
            "Must specify reassignToRoleId when deleting role with assigned users",
          details: {
            roleId: roleId,
            affectedUsers: usersWithRole.length,
            code: "REASSIGNMENT_REQUIRED",
          },
        },
        { status: 400 }
      );
    }

    // If reassignment role provided, verify it exists in the same team
    let reassignmentRole = null;
    if (reassignToRoleId) {
      const reassignmentRoleData = await db
        .select()
        .from(roleSchema)
        .where(
          and(
            eq(roleSchema.id, reassignToRoleId),
            eq(roleSchema.teamId, teamId)
          )
        )
        .limit(1);

      if (reassignmentRoleData.length === 0) {
        return NextResponse.json(
          {
            error: "Invalid reassignment role",
            message: "Reassignment role does not exist in this team",
            details: {
              reassignToRoleId: reassignToRoleId,
              teamId: teamId,
              code: "REASSIGN_ROLE_NOT_FOUND",
            },
          },
          { status: 400 }
        );
      }
      reassignmentRole = reassignmentRoleData[0];
    }

    // Check if this is the last role in the team
    const totalRoles = await db
      .select({ count: sql<number>`count(*)` })
      .from(roleSchema)
      .where(eq(roleSchema.teamId, teamId));

    if (totalRoles[0].count <= 1) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "Cannot delete the last role in a team",
          details: {
            roleId: roleId,
            teamId: teamId,
            code: "LAST_ROLE_CANNOT_DELETE",
          },
        },
        { status: 400 }
      );
    }

    // Delete role and reassign users in a transaction
    const result = await db.transaction(async (tx) => {
      // Reassign users if necessary
      if (usersWithRole.length > 0 && reassignToRoleId) {
        await tx
          .update(teamMemberSchema)
          .set({ roleId: reassignToRoleId })
          .where(eq(teamMemberSchema.roleId, roleId));

        // Update user counts
        await tx
          .update(roleSchema)
          .set({
            userCount: sql`${roleSchema.userCount} + ${usersWithRole.length}`,
            updatedAt: new Date(),
          })
          .where(eq(roleSchema.id, reassignToRoleId));
      }

      // Delete the role
      await tx.delete(roleSchema).where(eq(roleSchema.id, roleId));

      return {
        deletedRole: role,
        affectedUsers: usersWithRole.length,
        reassignmentRole: reassignmentRole,
      };
    });

    return NextResponse.json({
      status: "success",
      message: "Role deleted successfully",
      data: {
        roleId: roleId,
        roleName: result.deletedRole.name,
        teamId: teamId,
        teamName: team!.name,
        affectedUsers: result.affectedUsers,
        reassignedToRole: result.reassignmentRole
          ? {
              id: result.reassignmentRole.id,
              name: result.reassignmentRole.name,
            }
          : null,
        deletedAt: new Date().toISOString(),
        deletedBy: {
          id: userContext.userId,
          email: userContext.email,
        },
      },
    });
  } catch (error) {
    console.error("Delete role error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to delete role",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
