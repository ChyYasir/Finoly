// lib/business/hooks.ts
import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth/client";

export interface BusinessData {
  id: string;
  name: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  teamsCount: number;
  usersCount: number;
  totalExpenses: number;
  activeBudgets: number;
  createdAt: string;
  subscription: {
    plan: string;
    status: string;
    expiresAt: string | null;
  };
  settings: {
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
  };
}

export interface BusinessSettings {
  defaultCurrency: string;
  fiscalYearStart: string;
  timezone: string;
  features: {
    whatsappIntegration: boolean;
    aiInsights: boolean;
    advancedReporting: boolean;
  };
  notifications: {
    email: boolean;
    whatsapp: boolean;
    web: boolean;
  };
}

export interface UpdateBusinessInput {
  name: string;
  settings: BusinessSettings;
}

/**
 * Hook to manage business data fetching and updating
 */
export function useBusiness() {
  const { data: session } = useSession();
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBusinessOwner =
    session?.user?.accountType === "business" && session?.user?.isBusinessOwner;

  /**
   * Fetch business data
   */
  const fetchBusiness = async () => {
    if (!isBusinessOwner) {
      setError("Only business owners can access business data");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/business", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch business data");
      }

      const result = await response.json();
      setBusinessData(result.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch business data";
      setError(errorMessage);
      console.error("Error fetching business data:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update business data
   */
  const updateBusiness = async (updateData: UpdateBusinessInput) => {
    if (!isBusinessOwner) {
      throw new Error("Only business owners can update business data");
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/business", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update business");
      }

      const result = await response.json();

      // Update local state
      if (businessData) {
        setBusinessData({
          ...businessData,
          name: updateData.name,
          settings: updateData.settings,
        });
      }

      return result.data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update business";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh business data
   */
  const refreshBusiness = () => {
    if (isBusinessOwner) {
      fetchBusiness();
    }
  };

  // Auto-fetch on mount if user is business owner
  useEffect(() => {
    if (isBusinessOwner && !businessData) {
      fetchBusiness();
    }
  }, [isBusinessOwner]);

  return {
    businessData,
    loading,
    error,
    isBusinessOwner,
    fetchBusiness,
    updateBusiness,
    refreshBusiness,
  };
}

/**
 * Hook to get business statistics
 */
export function useBusinessStats() {
  const { businessData, loading, error, refreshBusiness } = useBusiness();

  const stats = businessData
    ? {
        teamsCount: businessData.teamsCount,
        usersCount: businessData.usersCount,
        totalExpenses: businessData.totalExpenses,
        activeBudgets: businessData.activeBudgets,
      }
    : null;

  return {
    stats,
    loading,
    error,
    refreshStats: refreshBusiness,
  };
}

/**
 * Hook to get business settings
 */
export function useBusinessSettings() {
  const { businessData, loading, error, updateBusiness } = useBusiness();

  const settings = businessData?.settings;

  const updateSettings = async (newSettings: Partial<BusinessSettings>) => {
    if (!businessData) {
      throw new Error("Business data not available");
    }

    const updatedSettings = {
      ...businessData.settings,
      ...newSettings,
    } as BusinessSettings;

    return updateBusiness({
      name: businessData.name,
      settings: updatedSettings,
    });
  };

  return {
    settings,
    loading,
    error,
    updateSettings,
  };
}

/**
 * Helper function to format currency
 */
export function formatCurrency(amount: number, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Helper function to format date
 */
export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Helper function to get subscription status color
 */
export function getSubscriptionStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "active":
      return "bg-green-100 text-green-800";
    case "expired":
      return "bg-red-100 text-red-800";
    case "cancelled":
      return "bg-gray-100 text-gray-800";
    case "trial":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Helper function to get plan display name
 */
export function getPlanDisplayName(plan: string) {
  switch (plan.toLowerCase()) {
    case "free":
      return "Free Plan";
    case "starter":
      return "Starter Plan";
    case "professional":
      return "Professional Plan";
    case "enterprise":
      return "Enterprise Plan";
    default:
      return plan.charAt(0).toUpperCase() + plan.slice(1) + " Plan";
  }
}
