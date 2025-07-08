// components/roles/RoleCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Shield,
  Users,
  MoreHorizontal,
  Edit,
  Trash2,
  Calendar,
  Check,
  Eye,
} from "lucide-react";
import {
  TeamRole,
  formatPermissionSummary,
  formatRoleStats,
  getPermissionsByResource,
  getResourceLabel,
} from "@/lib/roles/hooks";

interface RoleCardProps {
  role: TeamRole;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function RoleCard({ role, onEdit, onDelete }: RoleCardProps) {
  const canManage = onEdit || onDelete;
  const permissionsByResource = getPermissionsByResource(role.permissions);
  const resourceCount = Object.keys(permissionsByResource).length;

  const formatCreatedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                role.isDefault ? "bg-blue-100" : "bg-purple-100"
              }`}
            >
              <Shield
                className={`h-5 w-5 ${
                  role.isDefault ? "text-blue-600" : "text-purple-600"
                }`}
              />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-1">
                {role.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {role.isDefault && (
                  <Badge variant="secondary" className="text-xs">
                    Default
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {role.permissions.length} permissions
                </Badge>
              </div>
            </div>
          </div>

          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Role
                  </DropdownMenuItem>
                )}
                {onDelete && !role.isDefault && (
                  <DropdownMenuItem onClick={onDelete} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Role
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        {role.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {role.description}
          </p>
        )}

        {/* User Count */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {role.userCount === 0
                ? "No users assigned"
                : role.userCount === 1
                ? "1 user assigned"
                : `${role.userCount} users assigned`}
            </span>
          </div>
          {role.userCount > 0 && (
            <Badge variant="default" className="h-6 px-2">
              {role.userCount}
            </Badge>
          )}
        </div>

        {/* Permissions Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">Permissions</h4>
            <span className="text-xs text-gray-500">
              {resourceCount} resource{resourceCount !== 1 ? "s" : ""}
            </span>
          </div>

          {Object.keys(permissionsByResource).length === 0 ? (
            <p className="text-xs text-gray-500 italic">
              No permissions assigned
            </p>
          ) : (
            <div className="space-y-2">
              {Object.entries(permissionsByResource)
                .slice(0, 3)
                .map(([resource, actions]) => (
                  <div
                    key={resource}
                    className="flex items-center justify-between"
                  >
                    <span className="text-xs text-gray-600 capitalize">
                      {getResourceLabel(resource)}
                    </span>
                    <div className="flex items-center gap-1">
                      {actions.slice(0, 3).map((action) => (
                        <Badge
                          key={action}
                          variant="outline"
                          className="text-xs px-1 py-0"
                        >
                          {action}
                        </Badge>
                      ))}
                      {actions.length > 3 && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          +{actions.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}

              {Object.keys(permissionsByResource).length > 3 && (
                <div className="text-center">
                  <span className="text-xs text-gray-500">
                    +{Object.keys(permissionsByResource).length - 3} more
                    resource
                    {Object.keys(permissionsByResource).length - 3 !== 1
                      ? "s"
                      : ""}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            <span>Created {formatCreatedDate(role.createdAt)}</span>
          </div>

          {role.createdBy && (
            <span className="text-xs text-gray-500">
              by {role.createdBy.name}
            </span>
          )}
        </div>

        {/* Quick Access Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8"
            onClick={() => {
              /* View permissions details */
            }}
          >
            <Eye className="h-3 w-3 mr-1" />
            View Details
          </Button>
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3"
              onClick={onEdit}
            >
              <Edit className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
