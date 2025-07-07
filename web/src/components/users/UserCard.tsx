// components/users/UserCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Calendar,
  Users,
  Shield,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BusinessUser, formatDate, getUserInitials } from "@/lib/users/hooks";

interface UserCardProps {
  user: BusinessUser;
  onEdit?: (userId: string) => void;
  onRemove?: (userId: string) => void;
  onView?: (userId: string) => void;
  isCurrentUser?: boolean;
  showActions?: boolean;
}

export function UserCard({
  user,
  onEdit,
  onRemove,
  onView,
  isCurrentUser = false,
  showActions = true,
}: UserCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src="" alt={user.name} />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-base">
                {getUserInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {user.name}
                {isCurrentUser && (
                  <Badge variant="secondary" className="text-xs">
                    You
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Mail className="h-3 w-3" />
                {user.email}
              </div>
            </div>
          </div>

          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onView && (
                  <DropdownMenuItem onClick={() => onView(user.id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(user.id)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit User
                  </DropdownMenuItem>
                )}
                {onRemove && !isCurrentUser && (
                  <DropdownMenuItem
                    onClick={() => onRemove(user.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove User
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* User Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Teams:</span>
            <span className="font-medium">{user.teams.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Joined:</span>
            <span className="font-medium">{formatDate(user.createdAt)}</span>
          </div>
        </div>

        <Separator />

        {/* Team Assignments */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              Team Assignments
            </span>
          </div>

          {user.teams.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-2">
              No team assignments
            </div>
          ) : (
            <div className="space-y-2">
              {user.teams.map((team, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-3 w-3 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium">{team.teamName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-600">
                      {team.roleName}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Status */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-600">Active</span>
          </div>
          {user.updatedAt && (
            <span className="text-xs text-gray-500">
              Updated {formatDate(user.updatedAt)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
