// components/users/AddUserModal.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Plus,
  X,
  Users,
  User,
  Shield,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { AddUserInput } from "@/lib/users/hooks";

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  onAddUser: (userData: AddUserInput) => Promise<void>;
  teams: Array<{
    id: string;
    name: string;
    roleId: string | null;
    roleName: string | null;
    permissions: string[];
  }>;
}

interface TeamAssignment {
  teamId: string;
  roleId: string;
  teamName?: string;
  roleName?: string;
}

export function AddUserModal({
  open,
  onClose,
  onAddUser,
  teams,
}: AddUserModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    sendInvitation: true,
  });
  const [teamAssignments, setTeamAssignments] = useState<TeamAssignment[]>([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setFormData({ name: "", email: "", sendInvitation: true });
      setTeamAssignments([]);
      setSelectedTeam("");
      setSelectedRole("");
      setErrors({});
      onClose();
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (teamAssignments.length === 0) {
      newErrors.teams = "At least one team assignment is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Add team assignment
  const addTeamAssignment = () => {
    if (!selectedTeam || !selectedRole) return;

    const team = teams.find((t) => t.id === selectedTeam);
    if (!team) return;

    // Check if user is already assigned to this team
    if (teamAssignments.some((ta) => ta.teamId === selectedTeam)) {
      setErrors({ teams: "User is already assigned to this team" });
      return;
    }

    const newAssignment: TeamAssignment = {
      teamId: selectedTeam,
      roleId: selectedRole,
      teamName: team.name,
      roleName: team.roleName || "Member", // This would come from actual role data
    };

    setTeamAssignments([...teamAssignments, newAssignment]);
    setSelectedTeam("");
    setSelectedRole("");
    setErrors({ ...errors, teams: "" });
  };

  // Remove team assignment
  const removeTeamAssignment = (teamId: string) => {
    setTeamAssignments(teamAssignments.filter((ta) => ta.teamId !== teamId));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      await onAddUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        teams: teamAssignments.map((ta) => ({
          teamId: ta.teamId,
          roleId: ta.roleId,
        })),
        sendInvitation: formData.sendInvitation,
      });

      handleOpenChange(false);
    } catch (error) {
      console.error("Error adding user:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Add New User
          </DialogTitle>
          <DialogDescription>
            Add a new user to your business and assign them to teams with
            specific roles.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter user's full name"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Enter user's email address"
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="sendInvitation"
                  checked={formData.sendInvitation}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, sendInvitation: checked })
                  }
                />
                <Label htmlFor="sendInvitation" className="text-sm">
                  Send invitation email
                </Label>
              </div>
              <p className="text-xs text-gray-500">
                {formData.sendInvitation
                  ? "User will receive an email invitation to set up their account"
                  : "User will need to be provided with login credentials manually"}
              </p>
            </CardContent>
          </Card>

          {/* Team Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team Assignments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Team Assignment */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* This would be populated with actual roles for the selected team */}
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  onClick={addTeamAssignment}
                  disabled={!selectedTeam || !selectedRole}
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>

              {errors.teams && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  {errors.teams}
                </div>
              )}

              {/* Current Team Assignments */}
              {teamAssignments.length > 0 && (
                <div className="space-y-2">
                  <Label>Current Assignments</Label>
                  <div className="space-y-2">
                    {teamAssignments.map((assignment) => (
                      <div
                        key={assignment.teamId}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">
                              {assignment.teamName}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Shield className="h-3 w-3" />
                              {assignment.roleName}
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            removeTeamAssignment(assignment.teamId)
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          {teamAssignments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">User:</span>
                    <span className="font-medium">
                      {formData.name || "Not specified"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">
                      {formData.email || "Not specified"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Teams:</span>
                    <span className="font-medium">
                      {teamAssignments.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invitation:</span>
                    <span className="font-medium">
                      {formData.sendInvitation
                        ? "Will be sent"
                        : "Manual setup"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding User..." : "Add User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
