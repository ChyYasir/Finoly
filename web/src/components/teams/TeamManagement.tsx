// components/teams/TeamManagement.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Settings,
  Users,
  Building2,
  AlertCircle,
} from "lucide-react";
import { useTeams, useTeamSearch } from "@/lib/teams/hooks";
import { CreateTeamModal } from "./CreateTeamModal";
import { TeamCard } from "./TeamCard";
import { TeamDetailsModal } from "./TeamDetailsModal";
import { toast } from "sonner";

interface TeamManagementProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    accountType: "individual" | "business";
    businessId?: string | null;
    businessName?: string | null;
    isBusinessOwner?: boolean;
  };
}

export function TeamManagement({ user }: TeamManagementProps) {
  const {
    teams,
    loading,
    error,
    pagination,
    isBusinessOwner,
    fetchTeams,
    createTeam,
    updateTeam,
    deleteTeam,
  } = useTeams();

  const {
    searchTerm,
    setSearchTerm,
    filters,
    updateFilter,
    resetFilters,
    filterTeams,
  } = useTeamSearch();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // For individual users, show a message
  if (user.accountType === "individual") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Team Management
            </h1>
            <p className="text-gray-600">
              Manage your teams and collaborate with your team members
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Business Account Required
            </h3>
            <p className="text-gray-600 text-center max-w-md">
              Team management is only available for business accounts.
              Individual accounts can manage their personal finances without
              teams.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // For business users who are not owners
  if (!isBusinessOwner) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Teams</h1>
            <p className="text-gray-600">
              View and manage teams you're a member of
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={resetFilters}
            disabled={
              !searchTerm &&
              Object.values(filters).every((v) => !v || v === true)
            }
          >
            Clear Filters
          </Button>
        </div>

        {/* Teams Grid */}
        <div className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Error Loading Teams
                </h3>
                <p className="text-gray-600 text-center max-w-md mb-4">
                  {error}
                </p>
                <Button onClick={() => fetchTeams()} variant="outline">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : filterTeams(teams).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Users className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Teams Found
                </h3>
                <p className="text-gray-600 text-center max-w-md">
                  {searchTerm ||
                  Object.values(filters).some((v) => v && v !== true)
                    ? "No teams match your search criteria."
                    : "You're not a member of any teams yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterTeams(teams).map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  onView={() => {
                    setSelectedTeamId(team.id);
                    setShowDetailsModal(true);
                  }}
                  onEdit={
                    isBusinessOwner
                      ? () => {
                          // Handle edit
                        }
                      : undefined
                  }
                  onDelete={
                    isBusinessOwner
                      ? async () => {
                          try {
                            await deleteTeam(team.id);
                            toast.success("Team deleted successfully");
                          } catch (error) {
                            toast.error("Failed to delete team");
                          }
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // For business owners
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600">
            Create and manage teams for your business
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Team
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Teams</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teams.length}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Teams
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {teams.filter((t) => t.isActive).length}
                </p>
              </div>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Members
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {teams.reduce((sum, team) => sum + team.memberCount, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Budgets
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {teams.reduce((sum, team) => sum + team.budgetCount, 0)}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={resetFilters}
          disabled={
            !searchTerm && Object.values(filters).every((v) => !v || v === true)
          }
        >
          Clear Filters
        </Button>
      </div>

      {/* Teams Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Error Loading Teams
              </h3>
              <p className="text-gray-600 text-center max-w-md mb-4">{error}</p>
              <Button onClick={() => fetchTeams()} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : filterTeams(teams).length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Users className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Teams Found
              </h3>
              <p className="text-gray-600 text-center max-w-md mb-4">
                {searchTerm ||
                Object.values(filters).some((v) => v && v !== true)
                  ? "No teams match your search criteria."
                  : "You haven't created any teams yet. Create your first team to get started."}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Your First Team
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterTeams(teams).map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                onView={() => {
                  setSelectedTeamId(team.id);
                  setShowDetailsModal(true);
                }}
                onEdit={() => {
                  // Handle edit
                }}
                onDelete={async () => {
                  try {
                    await deleteTeam(team.id);
                    toast.success("Team deleted successfully");
                  } catch (error) {
                    toast.error("Failed to delete team");
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Team Modal */}
      <CreateTeamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={async (teamData) => {
          try {
            await createTeam(teamData);
            setShowCreateModal(false);
            toast.success("Team created successfully");
          } catch (error) {
            toast.error("Failed to create team");
          }
        }}
      />

      {/* Team Details Modal */}
      <TeamDetailsModal
        isOpen={showDetailsModal}
        teamId={selectedTeamId}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedTeamId(null);
        }}
      />
    </div>
  );
}
