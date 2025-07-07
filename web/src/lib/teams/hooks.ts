// lib/teams/hooks.ts
import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth/client";

export interface TeamMember {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  role: {
    id: string;
    name: string;
    permissions: string[];
  } | null;
  joinedAt: string;
}

export interface TeamRole {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  userCount: number;
  isDefault: boolean;
}

export interface TeamSummary {
  id: string;
  name: string;
  description?: string;
  businessId: string;
  admin: {
    id: string;
    name: string;
    email: string;
  };
  memberCount: number;
  budgetCount: number;
  totalExpenses: number;
  userRole: string;
  userPermissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeamDetails extends TeamSummary {
  businessName: string;
  members: TeamMember[];
  roles: TeamRole[];
  stats: {
    memberCount: number;
    budgetCount: number;
    totalExpenses: number;
  };
}

export interface CreateTeamInput {
  name: string;
  description?: string;
  adminUserId?: string;
  members?: Array<{
    userId: string;
    roleId?: string;
  }>;
}

export interface UpdateTeamInput {
  name?: string;
  description?: string;
  adminUserId?: string;
}

export interface AddMemberInput {
  userId: string;
  roleId: string;
}

/**
 * Hook for managing teams
 */
export function useTeams() {
  const { data: session } = useSession();
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const isBusinessOwner =
    session?.user?.accountType === "business" && session?.user?.isBusinessOwner;

  /**
   * Fetch teams list
   */
  const fetchTeams = async (options?: { page?: number; limit?: number }) => {
    if (!session?.user) {
      setError("No user session");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (options?.page) searchParams.set("page", options.page.toString());
      if (options?.limit) searchParams.set("limit", options.limit.toString());

      const response = await fetch(`/api/teams?${searchParams.toString()}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch teams");
      }

      const result = await response.json();
      setTeams(result.data.teams);
      setPagination(result.data.pagination);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch teams";
      setError(errorMessage);
      console.error("Error fetching teams:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create a new team
   */
  const createTeam = async (teamData: CreateTeamInput) => {
    if (!isBusinessOwner) {
      throw new Error("Only business owners can create teams");
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(teamData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create team");
      }

      const result = await response.json();

      // Refresh teams list
      await fetchTeams();

      return result.data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create team";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update team
   */
  const updateTeam = async (teamId: string, teamData: UpdateTeamInput) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/teams/${teamId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(teamData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update team");
      }

      const result = await response.json();

      // Update local state
      setTeams((prevTeams) =>
        prevTeams.map((team) =>
          team.id === teamId ? { ...team, ...result.data } : team
        )
      );

      return result.data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update team";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete team
   */
  const deleteTeam = async (teamId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/teams/${teamId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete team");
      }

      const result = await response.json();

      // Remove team from local state
      setTeams((prevTeams) => prevTeams.filter((team) => team.id !== teamId));

      return result.data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete team";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount
  useEffect(() => {
    if (session?.user && session.user.accountType === "business") {
      fetchTeams();
    }
  }, [session?.user]);

  return {
    teams,
    loading,
    error,
    pagination,
    isBusinessOwner,
    fetchTeams,
    createTeam,
    updateTeam,
    deleteTeam,
  };
}

/**
 * Hook for managing team details
 */
export function useTeamDetails(teamId: string | null) {
  const { data: session } = useSession();
  const [teamDetails, setTeamDetails] = useState<TeamDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch team details
   */
  const fetchTeamDetails = async () => {
    if (!teamId || !session?.user) {
      setError("No team ID or user session");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/teams/${teamId}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch team details");
      }

      const result = await response.json();
      setTeamDetails(result.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch team details";
      setError(errorMessage);
      console.error("Error fetching team details:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add member to team
   */
  const addMember = async (memberData: AddMemberInput) => {
    if (!teamId) {
      throw new Error("No team ID provided");
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(memberData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add member");
      }

      const result = await response.json();

      // Refresh team details
      await fetchTeamDetails();

      return result.data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add member";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Remove member from team
   */
  const removeMember = async (userId: string) => {
    if (!teamId) {
      throw new Error("No team ID provided");
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/teams/${teamId}/members/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to remove member");
      }

      const result = await response.json();

      // Refresh team details
      await fetchTeamDetails();

      return result.data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to remove member";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch when teamId changes
  useEffect(() => {
    if (teamId && session?.user) {
      fetchTeamDetails();
    }
  }, [teamId, session?.user]);

  return {
    teamDetails,
    loading,
    error,
    fetchTeamDetails,
    addMember,
    removeMember,
  };
}

/**
 * Hook for team search and filtering
 */
export function useTeamSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    isActive: true,
    memberCount: "",
    createdDateRange: "",
  });

  const updateFilter = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setSearchTerm("");
    setFilters({
      isActive: true,
      memberCount: "",
      createdDateRange: "",
    });
  };

  const filterTeams = (teams: TeamSummary[]) => {
    return teams.filter((team) => {
      const matchesSearch =
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.admin.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesActive = filters.isActive ? team.isActive : true;

      const matchesMemberCount =
        !filters.memberCount ||
        (filters.memberCount === "small" && team.memberCount <= 5) ||
        (filters.memberCount === "medium" &&
          team.memberCount > 5 &&
          team.memberCount <= 15) ||
        (filters.memberCount === "large" && team.memberCount > 15);

      return matchesSearch && matchesActive && matchesMemberCount;
    });
  };

  return {
    searchTerm,
    setSearchTerm,
    filters,
    updateFilter,
    resetFilters,
    filterTeams,
  };
}

/**
 * Utility functions for team management
 */
export const formatTeamRole = (role: string | null) => {
  if (!role) return "No role";
  return role.charAt(0).toUpperCase() + role.slice(1);
};

export const formatMemberCount = (count: number) => {
  if (count === 0) return "No members";
  if (count === 1) return "1 member";
  return `${count} members`;
};

export const formatBudgetCount = (count: number) => {
  if (count === 0) return "No budgets";
  if (count === 1) return "1 budget";
  return `${count} budgets`;
};

export const formatCurrency = (amount: number, currency: string = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const getTeamInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};
