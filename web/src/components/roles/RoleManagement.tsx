// components/roles/RoleManagement.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Shield, Users, AlertCircle, Filter } from "lucide-react";
import {
  useTeamRoles,
  useRoleSearch,
  PERMISSION_GROUPS,
} from "@/lib/roles/hooks";
import { CreateRoleModal } from "./CreateRoleModal";
import { RoleCard } from "./RoleCard";
import { EditRoleModal } from "./EditRoleModal";
import { DeleteRoleModal } from "./DeleteRoleModal";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RoleManagementProps {
  teamId: string;
  teamName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function RoleManagement({
  teamId,
  teamName,
  isOpen,
  onClose,
}: RoleManagementProps) {
  const {
    roles,
    summary,
    loading,
    error,
    canManageRoles,
    createRole,
    updateRole,
    deleteRole,
  } = useTeamRoles(teamId);

  const {
    searchTerm,
    setSearchTerm,
    filters,
    updateFilter,
    resetFilters,
    filterRoles,
  } = useRoleSearch();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [deletingRole, setDeletingRole] = useState<any>(null);

  const filteredRoles = filterRoles(roles);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="!max-w-[98vw] !w-[98vw] max-h-[95vh] overflow-y-auto p-0"
        style={{ maxWidth: "98vw", width: "98vw" }}
      >
        {/* Header */}
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Role Management - {teamName}
            </div>
            <div className="flex items-center gap-2">
              {canManageRoles && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Role
                </Button>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            Create and manage custom roles with granular permissions
          </DialogDescription>
        </DialogHeader>

        {/* Stats Cards */}
        {summary && (
          <div className="grid grid-cols-3 gap-4 py-6 border-t border-b bg-gray-50 mx-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Roles</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {summary.totalRoles}
                    </p>
                  </div>
                  <Shield className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Assigned Users</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {summary.totalUsers}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Permission Types</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {
                        Object.keys(summary.resourcePermissionDistribution)
                          .length
                      }
                    </p>
                  </div>
                  <Filter className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <div className="py-6 border-b px-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Select
                value={filters.permissionType || "all"}
                onValueChange={(value) =>
                  updateFilter("permissionType", value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Permission Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(PERMISSION_GROUPS).map(([key, group]) => (
                    <SelectItem key={key} value={key}>
                      {group.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.isDefault || "all"}
                onValueChange={(value) =>
                  updateFilter("isDefault", value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Default</SelectItem>
                  <SelectItem value="false">Custom</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.hasUsers || "all"}
                onValueChange={(value) =>
                  updateFilter("hasUsers", value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Usage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">With Users</SelectItem>
                  <SelectItem value="false">Unused</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={resetFilters}
                disabled={
                  !searchTerm && Object.values(filters).every((v) => !v)
                }
              >
                Clear
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-6 px-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
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
            <div className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Error Loading Roles
              </h3>
              <p className="text-gray-600 text-center max-w-md mb-4">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          ) : filteredRoles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Shield className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm || Object.values(filters).some((v) => v)
                  ? "No Roles Found"
                  : "No Roles Yet"}
              </h3>
              <p className="text-gray-600 text-center max-w-md mb-4">
                {searchTerm || Object.values(filters).some((v) => v)
                  ? "No roles match your search criteria."
                  : "Create custom roles to control team member permissions."}
              </p>
              {canManageRoles && !searchTerm && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Your First Role
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {filteredRoles.map((role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  onEdit={
                    canManageRoles ? () => setEditingRole(role) : undefined
                  }
                  onDelete={
                    canManageRoles ? () => setDeletingRole(role) : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Create Role Modal */}
        <CreateRoleModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          teamId={teamId}
          teamName={teamName}
          onSuccess={async (roleData) => {
            try {
              await createRole(roleData);
              setShowCreateModal(false);
              toast.success("Role created successfully");
            } catch (error) {
              toast.error("Failed to create role");
            }
          }}
        />

        {/* Edit Role Modal */}
        <EditRoleModal
          isOpen={!!editingRole}
          onClose={() => setEditingRole(null)}
          role={editingRole}
          teamId={teamId}
          teamName={teamName}
          onSuccess={async (roleData) => {
            try {
              await updateRole(editingRole.id, roleData);
              setEditingRole(null);
              toast.success("Role updated successfully");
            } catch (error) {
              toast.error("Failed to update role");
            }
          }}
        />

        {/* Delete Role Modal */}
        <DeleteRoleModal
          isOpen={!!deletingRole}
          onClose={() => setDeletingRole(null)}
          role={deletingRole}
          availableRoles={roles.filter((r) => r.id !== deletingRole?.id)}
          onSuccess={async (reassignToRoleId) => {
            try {
              await deleteRole(deletingRole.id, reassignToRoleId);
              setDeletingRole(null);
              toast.success("Role deleted successfully");
            } catch (error) {
              toast.error("Failed to delete role");
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
