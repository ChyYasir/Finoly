// components/roles/DeleteRoleModal.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TeamRole } from "@/lib/roles/hooks";
import { AlertTriangle, Trash2, Users, Shield, ArrowRight } from "lucide-react";

interface DeleteRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: TeamRole | null;
  availableRoles: TeamRole[];
  onSuccess: (reassignToRoleId?: string) => Promise<void>;
}

export function DeleteRoleModal({
  isOpen,
  onClose,
  role,
  availableRoles,
  onSuccess,
}: DeleteRoleModalProps) {
  const [reassignToRoleId, setReassignToRoleId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If role has users but no reassignment role selected, show error
    if (role && role.userCount > 0 && !reassignToRoleId) {
      setError(
        "You must select a role to reassign users to before deleting this role."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onSuccess(reassignToRoleId || undefined);
      setReassignToRoleId("");
    } catch (error) {
      console.error("Error deleting role:", error);
      setError(
        error instanceof Error ? error.message : "Failed to delete role"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReassignToRoleId("");
    setError("");
    onClose();
  };

  if (!role) return null;

  const canDelete = role.userCount === 0 || reassignToRoleId;
  const selectedReassignRole = availableRoles.find(
    (r) => r.id === reassignToRoleId
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Role
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the "{role.name}" role? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Information */}
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-red-900">{role.name}</h4>
                  {role.description && (
                    <p className="text-sm text-red-700 mt-1">
                      {role.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-red-700">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {role.userCount} user{role.userCount !== 1 ? "s" : ""}
                    </span>
                    <span>
                      {role.permissions.length} permission
                      {role.permissions.length !== 1 ? "s" : ""}
                    </span>
                    {role.isDefault && (
                      <Badge
                        variant="outline"
                        className="border-red-300 text-red-700"
                      >
                        Default
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Reassignment */}
          {role.userCount > 0 && (
            <div className="space-y-3">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    User Reassignment Required
                  </span>
                </div>
                <p className="text-sm text-yellow-700">
                  This role is assigned to {role.userCount} user
                  {role.userCount !== 1 ? "s" : ""}. You must reassign them to
                  another role before deletion.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reassignRole">Reassign users to *</Label>
                <Select
                  value={reassignToRoleId}
                  onValueChange={setReassignToRoleId}
                >
                  <SelectTrigger
                    className={
                      error && !reassignToRoleId ? "border-red-500" : ""
                    }
                  >
                    <SelectValue placeholder="Select a role for reassignment..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No other roles available
                      </div>
                    ) : (
                      availableRoles.map((availableRole) => (
                        <SelectItem
                          key={availableRole.id}
                          value={availableRole.id}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div>
                              <p className="font-medium">
                                {availableRole.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate max-w-48">
                                {availableRole.permissions.length} permission
                                {availableRole.permissions.length !== 1
                                  ? "s"
                                  : ""}
                                {availableRole.isDefault && " • Default"}
                              </p>
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {error && !reassignToRoleId && (
                  <p className="text-sm text-red-600">{error}</p>
                )}
              </div>

              {/* Reassignment Preview */}
              {selectedReassignRole && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        Reassignment Preview
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <span>
                        {role.userCount} user{role.userCount !== 1 ? "s" : ""}
                      </span>
                      <ArrowRight className="h-3 w-3" />
                      <span className="font-medium">
                        {selectedReassignRole.name}
                      </span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      Users will receive{" "}
                      {selectedReassignRole.permissions.length} permission
                      {selectedReassignRole.permissions.length !== 1
                        ? "s"
                        : ""}{" "}
                      from the new role.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* No Users */}
          {role.userCount === 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  No users are assigned to this role. It can be safely deleted.
                </span>
              </div>
            </div>
          )}

          {/* Warning for Default Roles */}
          {role.isDefault && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700">
                  This is a default role. Consider whether your team will need a
                  similar role in the future.
                </span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && role.userCount === 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={loading || !canDelete}
              className="flex items-center gap-2"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete Role
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
