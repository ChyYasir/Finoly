"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { signOut } from "@/lib/auth/client";
import {
  Menu,
  Bell,
  ChevronDown,
  DollarSign,
  LogOut,
  Settings,
  User,
  Users,
} from "lucide-react";

interface TopbarProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    accountType: "individual" | "business";
    businessId?: string | null;
    businessName?: string | null;
    role?: "owner" | "member" | null;
    teams?: Array<{
      id: string;
      name: string;
      roleId: string | null;
      roleName: string | null;
      permissions: string[];
    }>;
  };
  activeTeam: string;
  onTeamChange: (teamId: string) => void;
  onMenuClick: () => void;
}

export function Topbar({
  user,
  activeTeam,
  onTeamChange,
  onMenuClick,
}: TopbarProps) {
  const router = useRouter();
  const [notifications] = useState([
    {
      id: 1,
      message: "Budget threshold reached for Marketing team",
      type: "warning",
    },
    {
      id: 2,
      message: "Monthly report generated successfully",
      type: "success",
    },
    { id: 3, message: "New team member added to Sales team", type: "info" },
  ]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const displayName = user.name || user.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  const currentTeam = user.teams?.find((team) => team.id === activeTeam);

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side - Logo and Menu */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Finoly</h1>
              {user.accountType === "business" && (
                <p className="text-xs text-gray-500">{user.businessName}</p>
              )}
            </div>
          </div>
        </div>

        {/* Center - Team Switcher */}
        {user.accountType === "business" &&
          user.teams &&
          user.teams.length > 0 && (
            <div className="hidden sm:flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <Users className="h-4 w-4" />
                    <span className="max-w-32 truncate">
                      {currentTeam?.name || "Select Team"}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-64">
                  <DropdownMenuLabel>Switch Team</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user.teams.map((team) => (
                    <DropdownMenuItem
                      key={team.id}
                      onClick={() => onTeamChange(team.id)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>{team.name}</span>
                      </div>
                      {team.id === activeTeam && (
                        <Badge variant="secondary" className="ml-2">
                          Active
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

        {/* Right side - Notifications and Profile */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
                  >
                    {notifications.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No new notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem key={notification.id} className="p-3">
                    <div className="flex items-start space-x-2">
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${
                          notification.type === "warning"
                            ? "bg-yellow-500"
                            : notification.type === "success"
                            ? "bg-green-500"
                            : "bg-blue-500"
                        }`}
                      />
                      <p className="text-sm flex-1">{notification.message}</p>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={displayName} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-gray-500">
                    {currentTeam?.roleName || user.role}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 hidden sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="font-medium">{displayName}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  <Badge variant="outline" className="w-fit">
                    {user.accountType}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
