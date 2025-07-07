// lib/users/hooks.ts
import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth/client";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  accountType: "individual" | "business";
  businessId?: string;
  businessName?: string;
  isBusinessOwner?: boolean;
  teams?: Array<{
    id: string;
    name: string;
    roleId: string;
    roleName: string;
    permissions: string[];
  }>;
  preferences?: {
    currency: string;
    timezone: string;
    notifications: {
      email: boolean;
      whatsapp: boolean;
      web: boolean;
    };
  };
  createdAt: string;
  updatedAt?: string;
}

export interface BusinessUser {
  id: string;
  name: string;
  email: string;
  teams: Array<{
    teamId: string;
    teamName: string;
    roleId: string;
    roleName: string;
  }>;
  createdAt: string;
  updatedAt?: string;
}

export interface AddUserInput {
  name: string;
  email: string;
  teams: Array<{
    teamId: string;
    roleId: string;
  }>;
  sendInvitation?: boolean;
}

export interface UpdateUserProfileInput {
  name?: string;
  phone?: string;
}

/**
 * Hook for managing user profile
 */
export function useUserProfile() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch user profile
   */
  const fetchProfile = async () => {
    if (!session?.user) {
      setError("No user session");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/users/profile", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch profile");
      }

      const result = await response.json();
      setProfile(result.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch profile";
      setError(errorMessage);
      console.error("Error fetching user profile:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = async (updateData: UpdateUserProfileInput) => {
    try {
      setLoading(true);
      setError(null);

      console.log("Updating profile with data:", updateData);

      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      const result = await response.json();

      console.log("Profile update result:", result);

      // Update local state
      if (profile) {
        const updatedProfile = {
          ...profile,
          name: result.data.name || profile.name,
          phone: result.data.phone || profile.phone,
          updatedAt: result.data.updatedAt || new Date().toISOString(),
        };
        console.log("Setting updated profile:", updatedProfile);
        setProfile(updatedProfile);
      }

      return result.data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update profile";
      setError(errorMessage);
      console.error("Profile update error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount
  useEffect(() => {
    if (session?.user && !profile) {
      fetchProfile();
    }
  }, [session?.user]);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
  };
}

/**
 * Hook for managing business users (Business Owner only)
 */
export function useBusinessUsers() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<BusinessUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Debug the business owner check
  const isBusinessOwner =
    session?.user?.accountType === "business" && session?.user?.isBusinessOwner;

  // Add debug logging
  useEffect(() => {
    if (session?.user) {
      console.log("User session debug:", {
        accountType: session.user.accountType,
        isBusinessOwner: session.user.isBusinessOwner,
        businessId: session.user.businessId,
        email: session.user.email,
        calculated_isBusinessOwner: isBusinessOwner,
      });
    }
  }, [session, isBusinessOwner]);

  /**
   * Fetch business users
   */
  const fetchUsers = async (options?: {
    page?: number;
    limit?: number;
    teamId?: string;
    role?: string;
  }) => {
    if (!isBusinessOwner) {
      setError("Only business owners can access user management");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (options?.page) searchParams.set("page", options.page.toString());
      if (options?.limit) searchParams.set("limit", options.limit.toString());
      if (options?.teamId) searchParams.set("teamId", options.teamId);
      if (options?.role) searchParams.set("role", options.role);

      const response = await fetch(`/api/users?${searchParams.toString()}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch users");
      }

      const result = await response.json();
      setUsers(result.data.users);
      setPagination(result.data.pagination);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch users";
      setError(errorMessage);
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add new user to business
   */
  const addUser = async (userData: AddUserInput) => {
    if (!isBusinessOwner) {
      throw new Error("Only business owners can add users");
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add user");
      }

      const result = await response.json();

      // Refresh users list
      await fetchUsers();

      return result.data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add user";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Remove user from business
   */
  const removeUser = async (userId: string) => {
    if (!isBusinessOwner) {
      throw new Error("Only business owners can remove users");
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to remove user");
      }

      const result = await response.json();

      // Remove user from local state
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));

      return result.data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to remove user";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get user details
   */
  const getUserDetails = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/users/${userId}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch user details");
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch user details";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    users,
    loading,
    error,
    pagination,
    isBusinessOwner,
    fetchUsers,
    addUser,
    removeUser,
    getUserDetails,
  };
}

/**
 * Hook for user search and filtering
 */
export function useUserSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    teamId: "",
    role: "",
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
      teamId: "",
      role: "",
    });
  };

  const filterUsers = (users: BusinessUser[]) => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTeam =
        !filters.teamId ||
        user.teams.some((team) => team.teamId === filters.teamId);

      const matchesRole =
        !filters.role ||
        user.teams.some((team) => team.roleName === filters.role);

      return matchesSearch && matchesTeam && matchesRole;
    });
  };

  return {
    searchTerm,
    setSearchTerm,
    filters,
    updateFilter,
    resetFilters,
    filterUsers,
  };
}

/**
 * Utility functions for user management
 */
export const formatUserRole = (teams: BusinessUser["teams"]) => {
  if (teams.length === 0) return "No teams";
  if (teams.length === 1) return teams[0].roleName;
  return `${teams.length} roles`;
};

export const formatUserTeams = (teams: BusinessUser["teams"]) => {
  if (teams.length === 0) return "No teams";
  if (teams.length === 1) return teams[0].teamName;
  return `${teams.length} teams`;
};

export const getUserInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
