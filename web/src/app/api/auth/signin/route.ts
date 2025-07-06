import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { db } from "@/db";
import {
  user as userSchema,
  business as businessSchema,
  team as teamSchema,
  teamMember as teamMemberSchema,
  role as roleSchema,
} from "@/db/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = "30m";

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = signInSchema.parse(body);

    // Find user with business information
    const foundUser = await db
      .select({
        id: userSchema.id,
        name: userSchema.name,
        email: userSchema.email,
        hashedPassword: userSchema.hashedPassword,
        accountType: userSchema.accountType,
        businessId: userSchema.businessId,
        businessName: businessSchema.name,
        businessOwnerId: businessSchema.ownerId,
      })
      .from(userSchema)
      .leftJoin(businessSchema, eq(userSchema.businessId, businessSchema.id))
      .where(eq(userSchema.email, email));

    if (foundUser.length === 0) {
      return NextResponse.json(
        {
          error: "Authentication failed",
          message: "Invalid email or password",
          code: "INVALID_CREDENTIALS",
        },
        { status: 401 }
      );
    }

    const user = foundUser[0];

    if (!user.hashedPassword) {
      return NextResponse.json(
        {
          error: "Authentication failed",
          message: "Invalid email or password",
          code: "INVALID_CREDENTIALS",
        },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          error: "Authentication failed",
          message: "Invalid email or password",
          code: "INVALID_CREDENTIALS",
        },
        { status: 401 }
      );
    }

    // Prepare JWT payload
    let jwtPayload: any = {
      id: user.id,
      email: user.email,
      accountType: user.accountType,
    };

    // For business users, fetch team memberships and roles
    if (user.accountType === "business" && user.businessId) {
      jwtPayload.businessId = user.businessId;

      // Get team memberships with roles
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

      jwtPayload.teams = teamMemberships.map((tm) => ({
        teamId: tm.teamId,
        teamName: tm.teamName,
        roleId: tm.roleId,
        roleName: tm.roleName,
        permissions: tm.permissions ? JSON.parse(tm.permissions) : [],
      }));
    }

    // Create JWT token
    const token = jwt.sign(jwtPayload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    // Set HTTP-only cookie
    cookies().set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 60, // 30 minutes
      path: "/",
      sameSite: "lax",
    });

    // Prepare response data
    const responseData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        accountType: user.accountType,
        businessId: user.businessId,
        businessName: user.businessName,
        role:
          user.accountType === "business" && user.businessOwnerId === user.id
            ? "owner"
            : "member",
        teams: user.accountType === "business" ? jwtPayload.teams : undefined,
      },
      token,
      expiresIn: 1800, // 30 minutes in seconds
    };

    return NextResponse.json({
      status: "success",
      message: "Login successful",
      data: responseData,
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

    console.error("Signin error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
