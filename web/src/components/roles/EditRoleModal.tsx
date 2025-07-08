// components/roles/EditRoleModal.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UpdateRoleInput,
  PERMISSION_GROUPS,
  TeamRole,
} from "@/lib/roles/hooks";
import { AlertCircle, Shield, Save, Users } from "lucide-react";

interface EditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: TeamRole | null;
  teamId: string;
  teamName: string;
  onSuccess: (roleData: UpdateRoleInput) => Promise<void>;
}

export function EditRoleModal({
  isOpen,
  onClose,
  role,
  teamId,
  teamName,
  onSuccess,
}: EditRoleModalProps) {
  const [formData, setFormData] = useState<UpdateRoleInput>({
    name: "",
    description: "",
    permissions: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Initialize form data when role changes
  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        description: role.description || "",
        permissions: [...role.permissions],
      });
    }
  }, [role]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = "Role name is required";
    } else if (formData.name.length < 3) {
      newErrors.name = "Role name must be at least 3 characters";
    } else if (formData.name.length > 50) {
      newErrors.name = "Role name must not exceed 50 characters";
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = "Description must not exceed 200 characters";
    }

    if (!formData.permissions || formData.permissions.length === 0) {
      newErrors.permissions = "At least one permission must be selected";
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
      await onSuccess(formData);
      setErrors({});
    } catch (error) {
      console.error("Error updating role:", error);
      setErrors({
        submit:
          error instanceof Error ? error.message : "Failed to update role",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: checked
        ? [...(prev.permissions || []), permission]
        : (prev.permissions || []).filter((p) => p !== permission),
    }));
  };

  const handleGroupPermissionChange = (groupKey: string, checked: boolean) => {
    const groupPermissions = PERMISSION_GROUPS[
      groupKey as keyof typeof PERMISSION_GROUPS
    ].permissions.map((p) => p.key);

    setFormData((prev) => ({
      ...prev,
      permissions: checked
        ? [...new Set([...(prev.permissions || []), ...groupPermissions])]
        : (prev.permissions || []).filter((p) => !groupPermissions.includes(p)),
    }));
  };

  const isGroupSelected = (groupKey: string) => {
    const groupPermissions = PERMISSION_GROUPS[
      groupKey as keyof typeof PERMISSION_GROUPS
    ].permissions.map((p) => p.key);
    return groupPermissions.every((p) =>
      (formData.permissions || []).includes(p)
    );
  };

  const isGroupPartiallySelected = (groupKey: string) => {
    const groupPermissions = PERMISSION_GROUPS[
      groupKey as keyof typeof PERMISSION_GROUPS
    ].permissions.map((p) => p.key);
    return (
      groupPermissions.some((p) => (formData.permissions || []).includes(p)) &&
      !isGroupSelected(groupKey)
    );
  };

  if (!role) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Edit Role - {role.name}
          </DialogTitle>
          <DialogDescription>
            Update role permissions and details for {teamName}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
            </TabsList>

            {/* Basic Information */}
            <TabsContent value="basic" className="space-y-4">
              {/* Role Info */}
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {role.userCount} user{role.userCount !== 1 ? "s" : ""}{" "}
                        assigned
                      </span>
                    </div>
                    {role.isDefault && (
                      <Badge variant="secondary" className="text-xs">
                        Default Role
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label htmlFor="name">Role Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter role name"
                  className={errors.name ? "border-red-500" : ""}
                  disabled={loading}
                />
                {errors.name && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Describe the role's responsibilities..."
                  className={errors.description ? "border-red-500" : ""}
                  disabled={loading}
                  rows={3}
                />
                {errors.description && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.description}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  {(formData.description || "").length}/200 characters
                </p>
              </div>
            </TabsContent>

            {/* Permissions */}
            <TabsContent value="permissions" className="space-y-4">
              <div className="space-y-2">
                <Label>Update Permissions *</Label>
                <p className="text-xs text-gray-500">
                  Modify which resources and actions this role can access
                </p>
                {errors.permissions && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.permissions}
                  </p>
                )}
              </div>

              <div className="space-y-4 max-h-64 overflow-y-auto">
                {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => (
                  <Card key={groupKey}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`group-${groupKey}`}
                          checked={isGroupSelected(groupKey)}
                          onCheckedChange={(checked) =>
                            handleGroupPermissionChange(groupKey, !!checked)
                          }
                          ref={(ref) => {
                            if (ref && isGroupPartiallySelected(groupKey)) {
                              ref.indeterminate = true;
                            }
                          }}
                        />
                        <Label
                          htmlFor={`group-${groupKey}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {group.label}
                        </Label>
                        <Badge variant="outline" className="text-xs">
                          {
                            (formData.permissions || []).filter((p) =>
                              group.permissions.some((gp) => gp.key === p)
                            ).length
                          }
                          /{group.permissions.length}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 gap-2">
                        {group.permissions.map((permission) => (
                          <div
                            key={permission.key}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={permission.key}
                              checked={(formData.permissions || []).includes(
                                permission.key
                              )}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(
                                  permission.key,
                                  !!checked
                                )
                              }
                            />
                            <Label
                              htmlFor={permission.key}
                              className="text-xs cursor-pointer"
                            >
                              {permission.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Changes Summary */}
              {formData.permissions && formData.permissions.length > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">
                        Current Permissions ({formData.permissions.length})
                      </span>
                    </div>

                    {/* Added Permissions */}
                    {formData.permissions.filter(
                      (p) => !role.permissions.includes(p)
                    ).length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-green-700 font-medium mb-1">
                          Added:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {formData.permissions
                            .filter((p) => !role.permissions.includes(p))
                            .map((perm) => (
                              <Badge
                                key={perm}
                                variant="outline"
                                className="text-xs border-green-300 text-green-700 bg-green-50"
                              >
                                +{perm.replace("_", " ")}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Removed Permissions */}
                    {role.permissions.filter(
                      (p) => !formData.permissions.includes(p)
                    ).length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-red-700 font-medium mb-1">
                          Removed:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions
                            .filter((p) => !formData.permissions.includes(p))
                            .map((perm) => (
                              <Badge
                                key={perm}
                                variant="outline"
                                className="text-xs border-red-300 text-red-700 bg-red-50"
                              >
                                -{perm.replace("_", " ")}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Warning for users */}
                    {role.userCount > 0 && (
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-xs text-yellow-800">
                          ⚠️ Changes will affect {role.userCount} user
                          {role.userCount !== 1 ? "s" : ""} assigned to this
                          role.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

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
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Update Role
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
