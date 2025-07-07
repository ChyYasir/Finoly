// components/teams/TeamCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Calendar,
  User,
} from "lucide-react";
import {
  TeamSummary,
  formatMemberCount,
  formatBudgetCount,
  formatCurrency,
  formatDate,
  getTeamInitials,
} from "@/lib/teams/hooks";

interface TeamCardProps {
  team: TeamSummary;
  onView: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function TeamCard({ team, onView, onEdit, onDelete }: TeamCardProps) {
  const adminInitials = getTeamInitials(team.admin.name);
  const canManage = onEdit || onDelete;

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-gray-900">
                {team.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={team.isActive ? "default" : "secondary"}>
                  {team.isActive ? "Active" : "Inactive"}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {team.userRole}
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
                <DropdownMenuItem onClick={onView}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Team
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem onClick={onDelete} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Team
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        {team.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {team.description}
          </p>
        )}

        {/* Team Admin */}
        <div className="flex items-center space-x-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src="" alt={team.admin.name} />
            <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
              {adminInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {team.admin.name}
            </p>
            <p className="text-xs text-gray-500">Team Admin</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-3 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-semibold text-gray-900">
                {team.memberCount}
              </span>
            </div>
            <p className="text-xs text-gray-500">Members</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <PiggyBank className="h-4 w-4 text-green-500" />
              <span className="text-sm font-semibold text-gray-900">
                {team.budgetCount}
              </span>
            </div>
            <p className="text-xs text-gray-500">Budgets</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <DollarSign className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(team.totalExpenses)}
              </span>
            </div>
            <p className="text-xs text-gray-500">Expenses</p>
          </div>
        </div>

        {/* Created Date */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            <span>Created {formatDate(team.createdAt)}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onView}
            className="h-8 px-3"
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
