import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { user as userSchema, business as businessSchema } from "@/db/schema";
import { eq } from "drizzle-orm";

// Base schema for common fields
const baseSignupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  phone: z.string().optional(),
});

// Individual signup schema
const individualSignupSchema = baseSignupSchema.extend({
  accountType: z.literal("individual"),
  name: z.string().min(1, "Name is required"),
});

// Business signup schema
const businessSignupSchema = baseSignupSchema.extend({
  accountType: z.literal("business"),
  businessName: z.string().min(1, "Business name is required"),
  ownerName: z.string().min(1, "Owner name is required"),
});

export async function POST(req: NextRequest) {
  try {
    // Parse the request body first
    const body = await req.json();

    // Log the received body for debugging
    console.log("Received signup request body:", body);

    // Validate the body has accountType
    if (!body.accountType) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "Account type is required",
          details: {
            field: "accountType",
            code: "MISSING_ACCOUNT_TYPE",
          },
        },
        { status: 400 }
      );
    }

    // Validate password confirmation
    if (body.password !== body.confirmPassword) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "Passwords don't match",
          details: {
            field: "confirmPassword",
            code: "PASSWORD_MISMATCH",
          },
        },
        { status: 422 }
      );
    }

    // Validate based on account type
    let validatedData;
    if (body.accountType === "individual") {
      validatedData = individualSignupSchema.parse(body);
    } else if (body.accountType === "business") {
      validatedData = businessSignupSchema.parse(body);
    } else {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "Invalid account type. Must be 'individual' or 'business'",
          details: {
            field: "accountType",
            code: "INVALID_ACCOUNT_TYPE",
          },
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(userSchema)
      .where(eq(userSchema.email, validatedData.email));

    if (existingUser.length > 0) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "Email already exists",
          details: {
            field: "email",
            code: "DUPLICATE_EMAIL",
          },
        },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 12);
    const userId = crypto.randomUUID();

    if (validatedData.accountType === "individual") {
      // Create individual user
      const newUser = await db
        .insert(userSchema)
        .values({
          id: userId,
          name: validatedData.name,
          email: validatedData.email,
          hashedPassword,
          accountType: "individual",
          businessId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return NextResponse.json(
        {
          status: "success",
          message: "Account created successfully",
          data: {
            userId: newUser[0].id,
            email: newUser[0].email,
            accountType: newUser[0].accountType,
            businessId: null,
            businessName: null,
            role: null,
            verificationRequired: true,
          },
        },
        { status: 201 }
      );
    } else {
      // Create business and business owner
      const businessId = crypto.randomUUID();

      // Start a transaction to create both business and user
      const result = await db.transaction(async (tx) => {
        // Create user first
        const newUser = await tx
          .insert(userSchema)
          .values({
            id: userId,
            name: validatedData.ownerName,
            email: validatedData.email,
            hashedPassword,
            accountType: "business",
            businessId: businessId,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        // Create business
        const newBusiness = await tx
          .insert(businessSchema)
          .values({
            id: businessId,
            name: validatedData.businessName,
            ownerId: userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        return { user: newUser[0], business: newBusiness[0] };
      });

      return NextResponse.json(
        {
          status: "success",
          message: "Account created successfully",
          data: {
            userId: result.user.id,
            email: result.user.email,
            accountType: result.user.accountType,
            businessId: result.business.id,
            businessName: result.business.name,
            role: "owner",
            verificationRequired: true,
          },
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Signup error:", error);

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
        { status: 422 }
      );
    }

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
