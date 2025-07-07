// components/users/UserManagement.tsx
"use client";

import { useState, useEffect } from "react";
import { useBusinessUsers, useUserSearch } from "@/lib/users/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserList } from "./UserList";
import { AddUserModal } from "./AddUserModal";
import { UserCard } from "./UserCard";
import {
  Users,
  Plus,
  Search,
  Filter,
  RefreshCw,
  UserCheck,
  UserX,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface UserManagementProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    accountType: "individual" | "business";
    businessId?: string | null;
    businessName?: string | null;
    isBusinessOwner?: boolean;
    teams?: Array<{
      id: string;
      name: string;
      roleId: string | null;
      roleName: string | null;
      permissions: string[];
    }>;
  };
}

export function UserManagement({ user }: UserManagementProps) {
  const {
    users,
    loading,
    error,
    pagination,
    isBusinessOwner,
    fetchUsers,
    addUser,
    removeUser,
  } = useBusinessUsers();

  const {
    searchTerm,
    setSearchTerm,
    filters,
    updateFilter,
    resetFilters,
    filterUsers,
  } = useUserSearch();

  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  // Fetch users on component mount
  useEffect(() => {
    if (isBusinessOwner) {
      fetchUsers();
    }
  }, [isBusinessOwner]);

  // Check if user has access to user management
  if (!isBusinessOwner) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Access Restricted
          </h3>
          <p className="text-sm text-gray-600 text-center">
            Only business owners can access user management features.
          </p>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-2">Debug info:</p>
            <pre className="text-xs text-gray-600 whitespace-pre-wrap">
              {JSON.stringify(
                {
                  accountType: user.accountType,
                  isBusinessOwner: user.isBusinessOwner,
                  businessId: user.businessId,
                  email: user.email,
                  hookIsBusinessOwner: isBusinessOwner,
                },
                null,
                2
              )}
            </pre>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle add user
  const handleAddUser = async (userData: any) => {
    try {
      await addUser(userData);
      setAddUserModalOpen(false);
      toast.success("User added successfully");
    } catch (error) {
      toast.error("Failed to add user");
    }
  };

  // Handle remove user
  const handleRemoveUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to remove this user?")) {
      try {
        await removeUser(userId);
        toast.success("User removed successfully");
      } catch (error) {
        toast.error("Failed to remove user");
      }
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchUsers();
  };

  // Filter users based on search and filters
  const filteredUsers = filterUsers(users);

  return (
    <div className="space-y-6">
      {/* Debug Info */}
      {/* <SessionDebug /> */}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-600">
            Manage users and their access to your business
          </p>
        </div>
        <Button onClick={() => setAddUserModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {pagination.total}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
              <UserX className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Teams</p>
              <p className="text-2xl font-bold text-gray-900">
                {user.teams?.length || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filters.teamId}
              onValueChange={(value) => updateFilter("teamId", value)}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All teams</SelectItem>
                {user.teams?.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.role}
              onValueChange={(value) => updateFilter("role", value)}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {/* This would be populated with actual roles */}
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={resetFilters}
              className="w-full sm:w-auto"
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users ({filteredUsers.length})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No users found
              </h3>
              <p className="text-sm text-gray-600">
                {searchTerm || filters.teamId || filters.role
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first user"}
              </p>
            </div>
          ) : (
            <UserList
              users={filteredUsers}
              onRemoveUser={handleRemoveUser}
              onSelectUser={setSelectedUser}
              currentUserId={user.id}
            />
          )}
        </CardContent>
      </Card>

      {/* Add User Modal */}
      <AddUserModal
        open={addUserModalOpen}
        onClose={() => setAddUserModalOpen(false)}
        onAddUser={handleAddUser}
        teams={user.teams || []}
      />
    </div>
  );
}
