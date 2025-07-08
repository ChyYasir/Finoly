// components/roles/CreateRoleModal.tsx
"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CreateRoleInput,
  PERMISSION_GROUPS,
  ROLE_TEMPLATES,
  getRoleTemplate,
} from "@/lib/roles/hooks";
import {
  AlertCircle,
  Shield,
  Users,
  Zap,
  Eye,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamName: string;
  onSuccess: (roleData: CreateRoleInput) => Promise<void>;
}

export function CreateRoleModal({
  isOpen,
  onClose,
  teamId,
  teamName,
  onSuccess,
}: CreateRoleModalProps) {
  const [formData, setFormData] = useState<CreateRoleInput>({
    name: "",
    description: "",
    permissions: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Role name is required";
    } else if (formData.name.length < 3) {
      newErrors.name = "Role name must be at least 3 characters";
    } else if (formData.name.length > 50) {
      newErrors.name = "Role name must not exceed 50 characters";
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = "Description must not exceed 200 characters";
    }

    if (formData.permissions.length === 0) {
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

      // Reset form
      setFormData({
        name: "",
        description: "",
        permissions: [],
      });
      setErrors({});
      setSelectedTemplate("");
    } catch (error) {
      console.error("Error creating role:", error);
      setErrors({
        submit:
          error instanceof Error ? error.message : "Failed to create role",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      permissions: [],
    });
    setErrors({});
    setSelectedTemplate("");
    onClose();
  };

  const handleTemplateSelect = (templateKey: string) => {
    if (!templateKey) {
      setSelectedTemplate("");
      return;
    }

    const template = getRoleTemplate(
      templateKey as keyof typeof ROLE_TEMPLATES
    );
    setFormData((prev) => ({
      ...prev,
      name: template.name,
      description: template.description,
      permissions: [...template.permissions],
    }));
    setSelectedTemplate(templateKey);
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, permission]
        : prev.permissions.filter((p) => p !== permission),
    }));
  };

  const handleGroupPermissionChange = (groupKey: string, checked: boolean) => {
    const groupPermissions = PERMISSION_GROUPS[
      groupKey as keyof typeof PERMISSION_GROUPS
    ].permissions.map((p) => p.key);

    setFormData((prev) => ({
      ...prev,
      permissions: checked
        ? [...new Set([...prev.permissions, ...groupPermissions])]
        : prev.permissions.filter((p) => !groupPermissions.includes(p)),
    }));
  };

  const isGroupSelected = (groupKey: string) => {
    const groupPermissions = PERMISSION_GROUPS[
      groupKey as keyof typeof PERMISSION_GROUPS
    ].permissions.map((p) => p.key);
    return groupPermissions.every((p) => formData.permissions.includes(p));
  };

  const isGroupPartiallySelected = (groupKey: string) => {
    const groupPermissions = PERMISSION_GROUPS[
      groupKey as keyof typeof PERMISSION_GROUPS
    ].permissions.map((p) => p.key);
    return (
      groupPermissions.some((p) => formData.permissions.includes(p)) &&
      !isGroupSelected(groupKey)
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Create New Role - {teamName}
          </DialogTitle>
          <DialogDescription>
            Create a custom role with specific permissions for team members.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="template">Templates</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
            </TabsList>

            {/* Basic Information */}
            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Role Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter role name (e.g., Marketing Manager, Budget Reviewer)"
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
                  placeholder="Describe the role's responsibilities and access level..."
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
                  {formData.description.length}/200 characters
                </p>
              </div>
            </TabsContent>

            {/* Role Templates */}
            <TabsContent value="template" className="space-y-4">
              <div className="space-y-2">
                <Label>Choose a Template (Optional)</Label>
                <Select
                  value={selectedTemplate}
                  onValueChange={handleTemplateSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role template..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Custom Role (No Template)</SelectItem>
                    {Object.entries(ROLE_TEMPLATES).map(([key, template]) => (
                      <SelectItem key={key} value={key}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Templates provide pre-configured permission sets for common
                  roles
                </p>
              </div>

              {/* Template Preview */}
              {selectedTemplate && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      Template Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="font-medium text-sm">
                        {
                          ROLE_TEMPLATES[
                            selectedTemplate as keyof typeof ROLE_TEMPLATES
                          ].name
                        }
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {
                          ROLE_TEMPLATES[
                            selectedTemplate as keyof typeof ROLE_TEMPLATES
                          ].description
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">
                        Permissions:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {ROLE_TEMPLATES[
                          selectedTemplate as keyof typeof ROLE_TEMPLATES
                        ].permissions
                          .slice(0, 6)
                          .map((perm) => (
                            <Badge
                              key={perm}
                              variant="outline"
                              className="text-xs"
                            >
                              {perm.replace("_", " ")}
                            </Badge>
                          ))}
                        {ROLE_TEMPLATES[
                          selectedTemplate as keyof typeof ROLE_TEMPLATES
                        ].permissions.length > 6 && (
                          <Badge variant="outline" className="text-xs">
                            +
                            {ROLE_TEMPLATES[
                              selectedTemplate as keyof typeof ROLE_TEMPLATES
                            ].permissions.length - 6}{" "}
                            more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Permissions */}
            <TabsContent value="permissions" className="space-y-4">
              <div className="space-y-2">
                <Label>Select Permissions *</Label>
                <p className="text-xs text-gray-500">
                  Choose which resources and actions this role can access
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
                            formData.permissions.filter((p) =>
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
                              checked={formData.permissions.includes(
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

              {/* Selected Permissions Summary */}
              {formData.permissions.length > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">
                        Selected Permissions ({formData.permissions.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {formData.permissions.slice(0, 8).map((perm) => (
                        <Badge
                          key={perm}
                          variant="outline"
                          className="text-xs border-blue-300 text-blue-700"
                        >
                          {perm.replace("_", " ")}
                        </Badge>
                      ))}
                      {formData.permissions.length > 8 && (
                        <Badge
                          variant="outline"
                          className="text-xs border-blue-300 text-blue-700"
                        >
                          +{formData.permissions.length - 8} more
                        </Badge>
                      )}
                    </div>
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
                <Plus className="h-4 w-4" />
              )}
              Create Role
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
