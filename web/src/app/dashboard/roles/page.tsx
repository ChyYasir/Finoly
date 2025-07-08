// app/dashboard/roles/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoleManagement } from "@/components/roles/RoleManagement";
import { useTeams } from "@/lib/teams/hooks";
import {
  Shield,
  Users,
  Building2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

export default function RolesPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const { teams, loading: teamsLoading } = useTeams();
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [showRoleManagement, setShowRoleManagement] = useState(false);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/signin");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    // Auto-select first team if available
    if (teams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(teams[0].id);
    }
  }, [teams, selectedTeamId]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const selectedTeam = teams.find((team) => team.id === selectedTeamId);
  const isBusinessOwner =
    session.user.accountType === "business" && session.user.isBusinessOwner;
  const canManageRoles =
    selectedTeam?.userPermissions?.includes("create_role") ||
    selectedTeam?.userPermissions?.includes("update_role") ||
    isBusinessOwner;

  // For individual users, show message
  if (session.user.accountType === "individual") {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Role Management
              </h1>
              <p className="text-gray-600">Manage team roles and permissions</p>
            </div>
          </div>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Building2 className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Business Account Required
              </h3>
              <p className="text-gray-600 text-center max-w-md">
                Role management is only available for business accounts with
                teams. Individual accounts don't require role-based permissions.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Role Management
            </h1>
            <p className="text-gray-600">
              Create and manage custom roles with granular permissions for your
              teams
            </p>
          </div>
        </div>

        {/* Team Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Select Team
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {teamsLoading ? (
              <div className="animate-pulse">
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ) : teams.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Teams Available
                </h3>
                <p className="text-gray-600 mb-4">
                  You need to be a member of at least one team to manage roles.
                </p>
                <Button onClick={() => router.push("/dashboard/teams")}>
                  Go to Teams
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Select
                      value={selectedTeamId}
                      onValueChange={setSelectedTeamId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a team to manage roles..." />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-blue-500" />
                                <span>{team.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {team.userRole}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {team.memberCount} members
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedTeam && (
                    <Button
                      onClick={() => setShowRoleManagement(true)}
                      disabled={!canManageRoles}
                      className="flex items-center gap-2"
                    >
                      <Shield className="h-4 w-4" />
                      Manage Roles
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Selected Team Info */}
                {selectedTeam && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-blue-900">
                            {selectedTeam.name}
                          </h4>
                          {selectedTeam.description && (
                            <p className="text-sm text-blue-700 mt-1">
                              {selectedTeam.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-blue-700">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {selectedTeam.memberCount} members
                            </span>
                            <span className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              Your role: {selectedTeam.userRole}
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant={
                            selectedTeam.isActive ? "default" : "secondary"
                          }
                          className="ml-2"
                        >
                          {selectedTeam.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      {/* Permission Check */}
                      {!canManageRoles && (
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm text-yellow-800">
                              You don't have permission to manage roles in this
                              team. Contact your team admin or business owner.
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        {selectedTeam && canManageRoles && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setShowRoleManagement(true)}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Manage Roles</h3>
                    <p className="text-sm text-gray-600">
                      Create, edit, and delete team roles
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/dashboard/teams`)}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Manage Members
                    </h3>
                    <p className="text-sm text-gray-600">
                      Add and assign roles to team members
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push("/dashboard/teams")}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Team Settings</h3>
                    <p className="text-sm text-gray-600">
                      Configure team details and preferences
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Role Management Modal */}
        {selectedTeam && (
          <RoleManagement
            teamId={selectedTeamId}
            teamName={selectedTeam.name}
            isOpen={showRoleManagement}
            onClose={() => setShowRoleManagement(false)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
