// lib/business/utils.ts
import { db } from "@/db";
import { business, team, teamMember } from "@/db/schema";
import { eq, count } from "drizzle-orm";

export interface BusinessStats {
  teamsCount: number;
  usersCount: number;
  totalExpenses: number;
  activeBudgets: number;
}

/**
 * Update business statistics (teams count, users count, etc.)
 */
export async function updateBusinessStats(
  businessId: string
): Promise<BusinessStats> {
  try {
    // Get team count
    const teamCount = await db
      .select({ count: count() })
      .from(team)
      .where(eq(team.businessId, businessId));

    // Get user count (distinct users across all teams)
    const userCount = await db
      .select({ count: count() })
      .from(teamMember)
      .innerJoin(team, eq(teamMember.teamId, team.id))
      .where(eq(team.businessId, businessId));

    const stats: BusinessStats = {
      teamsCount: teamCount[0]?.count || 0,
      usersCount: userCount[0]?.count || 0,
      totalExpenses: 0, // Will be updated when expenses are implemented
      activeBudgets: 0, // Will be updated when budgets are implemented
    };

    // Update the business table with new stats
    await db
      .update(business)
      .set({
        teamsCount: stats.teamsCount,
        usersCount: stats.usersCount,
        totalExpenses: stats.totalExpenses,
        activeBudgets: stats.activeBudgets,
        updatedAt: new Date(),
      })
      .where(eq(business.id, businessId));

    return stats;
  } catch (error) {
    console.error("Error updating business stats:", error);
    throw error;
  }
}

/**
 * Get business by owner ID
 */
export async function getBusinessByOwnerId(ownerId: string) {
  try {
    const businesses = await db
      .select()
      .from(business)
      .where(eq(business.ownerId, ownerId))
      .limit(1);

    return businesses[0] || null;
  } catch (error) {
    console.error("Error getting business by owner ID:", error);
    throw error;
  }
}

/**
 * Check if user is business owner
 */
export async function isBusinessOwner(
  userId: string,
  businessId: string
): Promise<boolean> {
  try {
    const businesses = await db
      .select({ ownerId: business.ownerId })
      .from(business)
      .where(eq(business.id, businessId))
      .limit(1);

    return businesses.length > 0 && businesses[0].ownerId === userId;
  } catch (error) {
    console.error("Error checking business ownership:", error);
    return false;
  }
}

/**
 * Validate business settings
 */
export interface BusinessSettingsInput {
  defaultCurrency?: string;
  fiscalYearStart?: string;
  timezone?: string;
  features?: {
    whatsappIntegration?: boolean;
    aiInsights?: boolean;
    advancedReporting?: boolean;
  };
  notifications?: {
    email?: boolean;
    whatsapp?: boolean;
    web?: boolean;
  };
}

export function validateBusinessSettings(settings: BusinessSettingsInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate currency
  if (settings.defaultCurrency && !isValidCurrency(settings.defaultCurrency)) {
    errors.push("Invalid currency code");
  }

  // Validate fiscal year start
  if (settings.fiscalYearStart && !isValidDate(settings.fiscalYearStart)) {
    errors.push("Invalid fiscal year start date");
  }

  // Validate timezone
  if (settings.timezone && !isValidTimezone(settings.timezone)) {
    errors.push("Invalid timezone");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if currency code is valid
 */
function isValidCurrency(currency: string): boolean {
  const validCurrencies = [
    "USD",
    "EUR",
    "GBP",
    "JPY",
    "CAD",
    "AUD",
    "CHF",
    "CNY",
    "INR",
    "KRW",
    "SGD",
    "HKD",
    "NOK",
    "SEK",
    "DKK",
    "PLN",
    "CZK",
    "HUF",
    "RUB",
    "BRL",
    "MXN",
    "ZAR",
    "TRY",
    "AED",
    "SAR",
    "THB",
    "MYR",
    "IDR",
    "PHP",
    "VND",
  ];
  return validCurrencies.includes(currency);
}

/**
 * Check if date string is valid
 */
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(dateString);
}

/**
 * Check if timezone is valid
 */
function isValidTimezone(timezone: string): boolean {
  const validTimezones = [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Rome",
    "Europe/Madrid",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Asia/Mumbai",
    "Asia/Dubai",
    "Asia/Singapore",
    "Australia/Sydney",
    "Australia/Melbourne",
    "Pacific/Auckland",
  ];
  return validTimezones.includes(timezone);
}

/**
 * Generate business report data
 */
export async function getBusinessReportData(businessId: string) {
  try {
    const businessData = await db
      .select()
      .from(business)
      .where(eq(business.id, businessId))
      .limit(1);

    if (businessData.length === 0) {
      throw new Error("Business not found");
    }

    const business_obj = businessData[0];

    // Get team count
    const teamCount = await db
      .select({ count: count() })
      .from(team)
      .where(eq(team.businessId, businessId));

    // Get user count
    const userCount = await db
      .select({ count: count() })
      .from(teamMember)
      .innerJoin(team, eq(teamMember.teamId, team.id))
      .where(eq(team.businessId, businessId));

    return {
      business: business_obj,
      stats: {
        teamsCount: teamCount[0]?.count || 0,
        usersCount: userCount[0]?.count || 0,
        totalExpenses: business_obj.totalExpenses || 0,
        activeBudgets: business_obj.activeBudgets || 0,
      },
    };
  } catch (error) {
    console.error("Error getting business report data:", error);
    throw error;
  }
}
