// lib/dashboard/hooks.ts
import { useState, useEffect, useMemo } from "react";
import { useSession } from "@/lib/auth/client";

// Hook for managing team permissions
export function useTeamPermissions(activeTeam: string) {
  const { data: session } = useSession();

  const permissions = useMemo(() => {
    if (!session?.user) return [];

    if (session.user.accountType === "individual") {
      // Individual users have all permissions
      return [
        "create_expense",
        "read_expense",
        "update_expense",
        "delete_expense",
        "create_budget",
        "read_budget",
        "update_budget",
        "delete_budget",
        "create_report",
        "read_report",
        "update_report",
        "delete_report",
        "create_forecast",
        "read_forecast",
        "update_forecast",
        "delete_forecast",
        "create_alert",
        "read_alert",
        "update_alert",
        "delete_alert",
      ];
    }

    const currentTeam = session.user.teams?.find((t) => t.id === activeTeam);
    return currentTeam?.permissions || [];
  }, [session?.user, activeTeam]);

  const hasPermission = (permission: string) => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissionsList: string[]) => {
    return permissionsList.some((permission) =>
      permissions.includes(permission)
    );
  };

  const hasAllPermissions = (permissionsList: string[]) => {
    return permissionsList.every((permission) =>
      permissions.includes(permission)
    );
  };

  const isTeamAdmin = useMemo(() => {
    if (!session?.user) return false;
    return session.user.isBusinessOwner || hasPermission("update_team");
  }, [session?.user, hasPermission]);

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isTeamAdmin,
  };
}

// Hook for fetching dashboard data
export function useDashboardData(activeTeam: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data - replace with actual API calls
      const mockData = {
        summary: {
          totalBudget: 50000,
          totalSpent: 32500,
          budgetUtilization: 65,
          monthlyAverage: 10833,
        },
        expenses: [
          {
            id: 1,
            amount: 1200,
            category: "Office",
            date: "2024-01-15",
            description: "Office supplies",
          },
          {
            id: 2,
            amount: 800,
            category: "Travel",
            date: "2024-01-14",
            description: "Business trip",
          },
          {
            id: 3,
            amount: 300,
            category: "Software",
            date: "2024-01-13",
            description: "Monthly subscription",
          },
        ],
        budgets: [
          {
            id: 1,
            name: "Q1 Marketing",
            amount: 15000,
            spent: 8750,
            category: "Marketing",
          },
          {
            id: 2,
            name: "Operations",
            amount: 20000,
            spent: 16800,
            category: "Operations",
          },
          {
            id: 3,
            name: "Sales",
            amount: 12000,
            spent: 6300,
            category: "Sales",
          },
        ],
        alerts: [
          {
            id: 1,
            type: "warning",
            message: "Marketing budget at 85%",
            timestamp: "2h ago",
          },
          {
            id: 2,
            type: "info",
            message: "New expense added",
            timestamp: "4h ago",
          },
        ],
      };

      setData(mockData);
    } catch (err) {
      setError("Failed to fetch dashboard data");
      console.error("Dashboard data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTeam) {
      fetchData();
    }
  }, [activeTeam]);

  const refetch = () => {
    if (activeTeam) {
      fetchData();
    }
  };

  return { data, loading, error, refetch };
}

// Hook for managing dashboard filters
export function useDashboardFilters() {
  const [filters, setFilters] = useState({
    dateRange: "30days",
    category: "all",
    team: "all",
    status: "all",
  });

  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      dateRange: "30days",
      category: "all",
      team: "all",
      status: "all",
    });
  };

  return {
    filters,
    updateFilter,
    resetFilters,
  };
}

// Utility functions for formatting data
export const formatCurrency = (amount: number, currency: string = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatPercentage = (value: number, decimals: number = 1) => {
  return `${value.toFixed(decimals)}%`;
};

export const formatDate = (
  date: string | Date,
  format: "short" | "long" = "short"
) => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (format === "long") {
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export const formatRelativeTime = (date: string | Date) => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInHours = Math.floor(
    (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60)
  );

  if (diffInHours < 1) {
    return "Just now";
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }
};

// Calculate budget utilization
export const calculateBudgetUtilization = (spent: number, budget: number) => {
  if (budget === 0) return 0;
  return Math.round((spent / budget) * 100);
};

// Get budget status
export const getBudgetStatus = (utilization: number) => {
  if (utilization >= 100) return "over";
  if (utilization >= 85) return "warning";
  if (utilization >= 70) return "caution";
  return "good";
};

// Get trend direction
export const getTrendDirection = (current: number, previous: number) => {
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "stable";
};

// Calculate trend percentage
export const calculateTrendPercentage = (current: number, previous: number) => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};
