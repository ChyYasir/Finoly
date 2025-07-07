// components/teams/TeamDetailsModal.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  PiggyBank,
  DollarSign,
  Calendar,
  Settings,
  UserPlus,
  MoreHorizontal,
  UserMinus,
  Shield,
  Eye,
  AlertCircle,
} from "lucide-react";
import { useTeamDetails } from "@/lib/teams/hooks";
import { AddMemberModal } from "./AddMemberModal";
import { formatDate, formatCurrency, getTeamInitials } from "@/lib/teams/hooks";
import { toast } from "sonner";

interface TeamDetailsModalProps {
  isOpen: boolean;
  teamId: string | null;
  onClose: () => void;
}

export function TeamDetailsModal({
  isOpen,
  teamId,
  onClose,
}: TeamDetailsModalProps) {
  const {
    teamDetails,
    loading,
    error,
    fetchTeamDetails,
    addMember,
    removeMember,
  } = useTeamDetails(teamId);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  if (!isOpen || !teamId) return null;

  const isAdmin = teamDetails?.userRole === "admin";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            {teamDetails?.name || "Loading..."}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Error Loading Team
            </h3>
            <p className="text-gray-600 text-center max-w-md mb-4">{error}</p>
            <Button onClick={fetchTeamDetails} variant="outline">
              Try Again
            </Button>
          </div>
        ) : teamDetails ? (
          <div className="space-y-6">
            {/* Team Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Badge
                    variant={teamDetails.isActive ? "default" : "secondary"}
                  >
                    {teamDetails.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="outline">{teamDetails.businessName}</Badge>
                </div>
                {teamDetails.description && (
                  <p className="text-gray-600 mb-4">
                    {teamDetails.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Created {formatDate(teamDetails.createdAt)}</span>
                  <span>•</span>
                  <span>Updated {formatDate(teamDetails.updatedAt)}</span>
                </div>
              </div>
              {isAdmin && (
                <Button
                  onClick={() => setShowAddMemberModal(true)}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Add Member
                </Button>
              )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Members</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {teamDetails.stats.memberCount}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Budgets</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {teamDetails.stats.budgetCount}
                      </p>
                    </div>
                    <PiggyBank className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Expenses</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(teamDetails.stats.totalExpenses)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="members" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="roles">Roles</TabsTrigger>
              </TabsList>

              <TabsContent value="members" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Team Members</h3>
                  <span className="text-sm text-gray-500">
                    {teamDetails.members.length} member
                    {teamDetails.members.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {teamDetails.members.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No Members Yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Add members to this team to start collaborating.
                    </p>
                    {isAdmin && (
                      <Button onClick={() => setShowAddMemberModal(true)}>
                        Add First Member
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {teamDetails.members.map((member) => (
                      <Card key={member.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src="" alt={member.user.name} />
                                <AvatarFallback className="bg-gray-100 text-gray-600">
                                  {getTeamInitials(member.user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {member.user.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {member.user.email}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="flex items-center gap-1"
                              >
                                {member.user.id === teamDetails.admin.id ? (
                                  <Shield className="h-3 w-3" />
                                ) : (
                                  <Users className="h-3 w-3" />
                                )}
                                {member.user.id === teamDetails.admin.id
                                  ? "Admin"
                                  : member.role?.name || "No Role"}
                              </Badge>

                              <div className="text-xs text-gray-500">
                                Joined {formatDate(member.joinedAt)}
                              </div>

                              {isAdmin &&
                                member.user.id !== teamDetails.admin.id && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={async () => {
                                          try {
                                            await removeMember(member.user.id);
                                            toast.success(
                                              "Member removed successfully"
                                            );
                                          } catch (error) {
                                            toast.error(
                                              "Failed to remove member"
                                            );
                                          }
                                        }}
                                        className="text-red-600"
                                      >
                                        <UserMinus className="h-4 w-4 mr-2" />
                                        Remove Member
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="roles" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Team Roles</h3>
                  <span className="text-sm text-gray-500">
                    {teamDetails.roles.length} role
                    {teamDetails.roles.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="space-y-3">
                  {teamDetails.roles.map((role) => (
                    <Card key={role.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-gray-900">
                                {role.name}
                              </h4>
                              {role.isDefault && (
                                <Badge variant="secondary" className="text-xs">
                                  Default
                                </Badge>
                              )}
                            </div>
                            {role.description && (
                              <p className="text-sm text-gray-600 mb-3">
                                {role.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {role.userCount} member
                                {role.userCount !== 1 ? "s" : ""}
                              </span>
                              <span className="flex items-center gap-1">
                                <Shield className="h-3 w-3" />
                                {role.permissions.length} permission
                                {role.permissions.length !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : null}

        {/* Add Member Modal */}
        <AddMemberModal
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          teamId={teamId}
          availableRoles={teamDetails?.roles || []}
          onSuccess={async (memberData) => {
            try {
              await addMember(memberData);
              setShowAddMemberModal(false);
              toast.success("Member added successfully");
            } catch (error) {
              toast.error("Failed to add member");
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
