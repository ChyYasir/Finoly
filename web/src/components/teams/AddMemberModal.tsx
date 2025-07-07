// components/teams/AddMemberModal.tsx
"use client";

import { useState, useEffect } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useBusinessUsers } from "@/lib/users/hooks";
import { AddMemberInput, TeamRole } from "@/lib/teams/hooks";
import { AlertCircle, UserPlus, Users, Shield } from "lucide-react";

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  availableRoles: TeamRole[];
  onSuccess: (memberData: AddMemberInput) => Promise<void>;
}

export function AddMemberModal({
  isOpen,
  onClose,
  teamId,
  availableRoles,
  onSuccess,
}: AddMemberModalProps) {
  const { users, loading: usersLoading, fetchUsers } = useBusinessUsers();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Fetch users when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, fetchUsers]);

  // Set default role when roles are available
  useEffect(() => {
    if (availableRoles.length > 0 && !selectedRoleId) {
      const memberRole = availableRoles.find(
        (role) => role.name.toLowerCase().includes("member") || role.isDefault
      );
      if (memberRole) {
        setSelectedRoleId(memberRole.id);
      } else {
        setSelectedRoleId(availableRoles[0].id);
      }
    }
  }, [availableRoles, selectedRoleId]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedUserId) {
      newErrors.userId = "Please select a user";
    }

    if (!selectedRoleId) {
      newErrors.roleId = "Please select a role";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSuccess({
        userId: selectedUserId,
        roleId: selectedRoleId,
      });

      // Reset form
      setSelectedUserId("");
      setSelectedRoleId("");
      setErrors({});
    } catch (error) {
      console.error("Error adding member:", error);
      setErrors({
        submit: error instanceof Error ? error.message : "Failed to add member",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedUserId("");
    setSelectedRoleId("");
    setErrors({});
    onClose();
  };

  // Filter users who might already be team members
  // Note: In a real implementation, you'd want to exclude users already in the team
  const availableUsers = users;

  const selectedUser = availableUsers.find(
    (user) => user.id === selectedUserId
  );
  const selectedRole = availableRoles.find(
    (role) => role.id === selectedRoleId
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            Add Team Member
          </DialogTitle>
          <DialogDescription>
            Add a business user to this team and assign them a role.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Selection */}
          <div className="space-y-2">
            <Label htmlFor="user">Select User *</Label>
            {usersLoading ? (
              <div className="h-10 bg-gray-100 rounded-md animate-pulse"></div>
            ) : (
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
                disabled={loading}
              >
                <SelectTrigger
                  className={errors.userId ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Choose a user to add..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No users available
                    </div>
                  ) : (
                    availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-3 py-1">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src="" alt={user.name} />
                            <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                              {user.name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-500">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
            {errors.userId && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.userId}
              </p>
            )}
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">Assign Role *</Label>
            <Select
              value={selectedRoleId}
              onValueChange={setSelectedRoleId}
              disabled={loading}
            >
              <SelectTrigger className={errors.roleId ? "border-red-500" : ""}>
                <SelectValue placeholder="Choose a role..." />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    <div className="flex items-center justify-between w-full py-1">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="font-medium">{role.name}</p>
                          {role.description && (
                            <p className="text-xs text-gray-500 truncate max-w-48">
                              {role.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {role.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            Default
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500">
                          {role.permissions.length} perms
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.roleId && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.roleId}
              </p>
            )}
          </div>

          {/* Preview */}
          {selectedUser && selectedRole && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                Preview
              </h4>
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={selectedUser.name} />
                  <AvatarFallback className="bg-white text-blue-600 text-xs">
                    {selectedUser.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-blue-900">
                    {selectedUser.name}
                  </p>
                  <p className="text-sm text-blue-700">{selectedUser.email}</p>
                </div>
                <Badge
                  variant="outline"
                  className="border-blue-300 text-blue-700"
                >
                  {selectedRole.name}
                </Badge>
              </div>
              <div className="mt-3 text-xs text-blue-700">
                <p>
                  <strong>Permissions:</strong>{" "}
                  {selectedRole.permissions.length} permissions including{" "}
                  {selectedRole.permissions.slice(0, 3).join(", ")}
                  {selectedRole.permissions.length > 3 ? "..." : ""}
                </p>
              </div>
            </div>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.submit}
              </p>
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
              disabled={loading || !selectedUserId || !selectedRoleId}
              className="flex items-center gap-2"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Add Member
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
