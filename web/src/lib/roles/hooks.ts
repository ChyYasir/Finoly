// lib/roles/hooks.ts
import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth/client";

export interface RolePermission {
  resource: string;
  actions: string[];
}

export interface TeamRole {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  permissionsByResource: Record<string, string[]>;
  userCount: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    name: string;
  };
}

export interface RolesSummary {
  totalRoles: number;
  totalUsers: number;
  resourcePermissionDistribution: Record<string, Record<string, number>>;
}

export interface CreateRoleInput {
  name: string;
  description?: string;
  permissions: string[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  permissions?: string[];
}

// Available permissions grouped by resource
export const PERMISSION_GROUPS = {
  expenses: {
    label: "Expenses",
    permissions: [
      { key: "create_expense", label: "Create Expenses" },
      { key: "read_expense", label: "View Expenses" },
      { key: "update_expense", label: "Edit Expenses" },
      { key: "delete_expense", label: "Delete Expenses" },
    ],
  },
  budgets: {
    label: "Budgets",
    permissions: [
      { key: "create_budget", label: "Create Budgets" },
      { key: "read_budget", label: "View Budgets" },
      { key: "update_budget", label: "Edit Budgets" },
      { key: "delete_budget", label: "Delete Budgets" },
    ],
  },
  reports: {
    label: "Reports",
    permissions: [
      { key: "create_report", label: "Generate Reports" },
      { key: "read_report", label: "View Reports" },
      { key: "update_report", label: "Edit Reports" },
      { key: "delete_report", label: "Delete Reports" },
    ],
  },
  forecasts: {
    label: "Forecasts",
    permissions: [
      { key: "create_forecast", label: "Create Forecasts" },
      { key: "read_forecast", label: "View Forecasts" },
      { key: "update_forecast", label: "Edit Forecasts" },
      { key: "delete_forecast", label: "Delete Forecasts" },
    ],
  },
  alerts: {
    label: "Smart Alerts",
    permissions: [
      { key: "create_alert", label: "Create Alerts" },
      { key: "read_alert", label: "View Alerts" },
      { key: "update_alert", label: "Edit Alerts" },
      { key: "delete_alert", label: "Delete Alerts" },
    ],
  },
  receipts: {
    label: "Receipts",
    permissions: [
      { key: "create_receipt", label: "Upload Receipts" },
      { key: "read_receipt", label: "View Receipts" },
      { key: "update_receipt", label: "Edit Receipts" },
      { key: "delete_receipt", label: "Delete Receipts" },
    ],
  },
  teams: {
    label: "Team Management",
    permissions: [
      { key: "create_team", label: "Create Teams" },
      { key: "read_team", label: "View Teams" },
      { key: "update_team", label: "Edit Teams" },
      { key: "delete_team", label: "Delete Teams" },
    ],
  },
  users: {
    label: "User Management",
    permissions: [
      { key: "create_user", label: "Add Users" },
      { key: "read_user", label: "View Users" },
      { key: "update_user", label: "Edit Users" },
      { key: "delete_user", label: "Remove Users" },
    ],
  },
  roles: {
    label: "Role Management",
    permissions: [
      { key: "create_role", label: "Create Roles" },
      { key: "read_role", label: "View Roles" },
      { key: "update_role", label: "Edit Roles" },
      { key: "delete_role", label: "Delete Roles" },
    ],
  },
} as const;

// Predefined role templates
export const ROLE_TEMPLATES = {
  admin: {
    name: "Team Administrator",
    description: "Full access to all team resources and management",
    permissions: Object.values(PERMISSION_GROUPS).flatMap((group) =>
      group.permissions.map((p) => p.key)
    ),
  },
  manager: {
    name: "Team Manager",
    description: "Can manage expenses, budgets, and view reports",
    permissions: [
      "create_expense",
      "read_expense",
      "update_expense",
      "create_budget",
      "read_budget",
      "update_budget",
      "create_report",
      "read_report",
      "create_forecast",
      "read_forecast",
      "create_alert",
      "read_alert",
      "update_alert",
      "read_user",
    ],
  },
  member: {
    name: "Team Member",
    description: "Can create expenses and view budgets",
    permissions: [
      "create_expense",
      "read_expense",
      "update_expense",
      "read_budget",
      "read_report",
      "read_forecast",
      "read_alert",
      "create_receipt",
      "read_receipt",
    ],
  },
  viewer: {
    name: "Viewer",
    description: "Read-only access to team data",
    permissions: [
      "read_expense",
      "read_budget",
      "read_report",
      "read_forecast",
      "read_alert",
      "read_receipt",
    ],
  },
  accountant: {
    name: "Accountant",
    description: "Full access to financial data and reporting",
    permissions: [
      "read_expense",
      "update_expense",
      "read_budget",
      "update_budget",
      "create_report",
      "read_report",
      "update_report",
      "create_forecast",
      "read_forecast",
      "update_forecast",
      "read_alert",
      "read_receipt",
      "update_receipt",
    ],
  },
};

/**
 * Hook for managing roles within a team
 */
export function useTeamRoles(teamId: string | null) {
  const { data: session } = useSession();
  const [roles, setRoles] = useState<TeamRole[]>([]);
  const [summary, setSummary] = useState<RolesSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBusinessOwner =
    session?.user?.accountType === "business" && session?.user?.isBusinessOwner;

  const isTeamAdmin = session?.user?.teams?.some(
    (team) => team.id === teamId && team.permissions?.includes("update_team")
  );

  const canManageRoles = isBusinessOwner || isTeamAdmin;

  /**
   * Fetch roles for the team
   */
  const fetchRoles = async () => {
    if (!teamId || !session?.user) {
      setError("No team ID or user session");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/teams/${teamId}/roles`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch roles");
      }

      const result = await response.json();
      setRoles(result.data.roles);
      setSummary(result.data.summary);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch roles";
      setError(errorMessage);
      console.error("Error fetching roles:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create a new role
   */
  const createRole = async (roleData: CreateRoleInput) => {
    if (!teamId) {
      throw new Error("No team ID provided");
    }

    if (!canManageRoles) {
      throw new Error("Insufficient permissions to create roles");
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/teams/${teamId}/roles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(roleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create role");
      }

      const result = await response.json();

      // Refresh roles list
      await fetchRoles();

      return result.data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create role";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update an existing role
   */
  const updateRole = async (roleId: string, roleData: UpdateRoleInput) => {
    if (!teamId) {
      throw new Error("No team ID provided");
    }

    if (!canManageRoles) {
      throw new Error("Insufficient permissions to update roles");
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/teams/${teamId}/roles/${roleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(roleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update role");
      }

      const result = await response.json();

      // Update local state
      setRoles((prevRoles) =>
        prevRoles.map((role) =>
          role.id === roleId ? { ...role, ...result.data } : role
        )
      );

      return result.data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update role";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete a role
   */
  const deleteRole = async (roleId: string, reassignToRoleId?: string) => {
    if (!teamId) {
      throw new Error("No team ID provided");
    }

    if (!canManageRoles) {
      throw new Error("Insufficient permissions to delete roles");
    }

    try {
      setLoading(true);
      setError(null);

      const url = new URL(
        `/api/teams/${teamId}/roles/${roleId}`,
        window.location.origin
      );
      if (reassignToRoleId) {
        url.searchParams.set("reassignToRoleId", reassignToRoleId);
      }

      const response = await fetch(url.toString(), {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete role");
      }

      const result = await response.json();

      // Remove role from local state
      setRoles((prevRoles) => prevRoles.filter((role) => role.id !== roleId));

      return result.data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete role";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch when teamId changes
  useEffect(() => {
    if (teamId && session?.user) {
      fetchRoles();
    }
  }, [teamId, session?.user]);

  return {
    roles,
    summary,
    loading,
    error,
    canManageRoles,
    isBusinessOwner,
    isTeamAdmin,
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
  };
}

/**
 * Hook for role search and filtering
 */
export function useRoleSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    permissionType: "",
    isDefault: "",
    hasUsers: "",
  });

  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setSearchTerm("");
    setFilters({
      permissionType: "",
      isDefault: "",
      hasUsers: "",
    });
  };

  const filterRoles = (roles: TeamRole[]) => {
    return roles.filter((role) => {
      const matchesSearch =
        role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPermissionType =
        !filters.permissionType ||
        role.permissions.some((perm) => perm.includes(filters.permissionType));

      const matchesDefault =
        !filters.isDefault ||
        (filters.isDefault === "true" && role.isDefault) ||
        (filters.isDefault === "false" && !role.isDefault);

      const matchesHasUsers =
        !filters.hasUsers ||
        (filters.hasUsers === "true" && role.userCount > 0) ||
        (filters.hasUsers === "false" && role.userCount === 0);

      return (
        matchesSearch &&
        matchesPermissionType &&
        matchesDefault &&
        matchesHasUsers
      );
    });
  };

  return {
    searchTerm,
    setSearchTerm,
    filters,
    updateFilter,
    resetFilters,
    filterRoles,
  };
}

/**
 * Utility functions for role management
 */
export const getPermissionLabel = (permission: string): string => {
  for (const group of Object.values(PERMISSION_GROUPS)) {
    const perm = group.permissions.find((p) => p.key === permission);
    if (perm) {
      return perm.label;
    }
  }
  return permission;
};

export const getResourceLabel = (resource: string): string => {
  const group = PERMISSION_GROUPS[resource as keyof typeof PERMISSION_GROUPS];
  return group?.label || resource;
};

export const formatPermissionSummary = (permissions: string[]): string => {
  if (permissions.length === 0) return "No permissions";
  if (permissions.length === 1) return getPermissionLabel(permissions[0]);
  if (permissions.length <= 3) {
    return permissions.map(getPermissionLabel).join(", ");
  }
  return `${permissions.slice(0, 2).map(getPermissionLabel).join(", ")} +${
    permissions.length - 2
  } more`;
};

export const formatRoleStats = (role: TeamRole): string => {
  const userText =
    role.userCount === 0
      ? "No users"
      : role.userCount === 1
      ? "1 user"
      : `${role.userCount} users`;
  const permText =
    role.permissions.length === 1
      ? "1 permission"
      : `${role.permissions.length} permissions`;
  return `${userText} • ${permText}`;
};

export const getPermissionsByResource = (permissions: string[]) => {
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
};

export const getRoleTemplate = (templateKey: keyof typeof ROLE_TEMPLATES) => {
  return ROLE_TEMPLATES[templateKey];
};

export const validatePermissions = (permissions: string[]): string[] => {
  const allValidPermissions = Object.values(PERMISSION_GROUPS).flatMap(
    (group) => group.permissions.map((p) => p.key)
  );

  return permissions.filter((perm) => allValidPermissions.includes(perm));
};
