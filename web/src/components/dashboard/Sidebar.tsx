// components/dashboard/Sidebar.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  FileText,
  TrendingUp,
  AlertTriangle,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
} from "lucide-react";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredPermissions: string[];
  adminOnly?: boolean;
  businessOwnerOnly?: boolean;
}

interface SidebarProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    accountType: "individual" | "business";
    businessId?: string | null;
    businessName?: string | null;
    isBusinessOwner?: boolean;
    teams?: Array<{
      id: string;
      name: string;
      roleId: string | null;
      roleName: string | null;
      permissions: string[];
    }>;
  };
  activeTeam: string;
  isOpen: boolean;
  onClose: () => void;
}

const navigationItems: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    requiredPermissions: [],
  },
  {
    name: "Expenses",
    href: "/dashboard/expenses",
    icon: Receipt,
    requiredPermissions: ["read_expense"],
  },
  {
    name: "Budgets",
    href: "/dashboard/budgets",
    icon: PiggyBank,
    requiredPermissions: ["read_budget"],
  },
  {
    name: "Reports",
    href: "/dashboard/reports",
    icon: FileText,
    requiredPermissions: ["read_report"],
  },
  {
    name: "Forecasts",
    href: "/dashboard/forecasts",
    icon: TrendingUp,
    requiredPermissions: ["read_forecast"],
  },
  {
    name: "Smart Alerts",
    href: "/dashboard/alerts",
    icon: AlertTriangle,
    requiredPermissions: ["read_alert"],
  },
  {
    name: "Business Settings",
    href: "/dashboard/business",
    icon: Building2,
    requiredPermissions: [],
    businessOwnerOnly: true,
  },
  {
    name: "Team Settings",
    href: "/dashboard/settings",
    icon: Settings,
    requiredPermissions: ["update_team", "create_role"],
    adminOnly: true,
  },
];

export function Sidebar({ user, activeTeam, isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const currentTeam = user.teams?.find((team) => team.id === activeTeam);
  const userPermissions = currentTeam?.permissions || [];
  const isTeamAdmin =
    user.isBusinessOwner || userPermissions.includes("update_team");

  // Debug logging
  useEffect(() => {
    console.log("Sidebar Debug:", {
      accountType: user.accountType,
      isBusinessOwner: user.isBusinessOwner,
      businessId: user.businessId,
      userPermissions,
      isTeamAdmin,
    });
  }, [user, userPermissions, isTeamAdmin]);

  const hasPermission = (item: NavigationItem) => {
    // Dashboard is always accessible
    if (item.name === "Dashboard") return true;

    // Check if item is for business owners only
    if (item.businessOwnerOnly) {
      const hasAccess = user.accountType === "business" && user.isBusinessOwner;
      console.log(`Business owner check for ${item.name}:`, {
        accountType: user.accountType,
        isBusinessOwner: user.isBusinessOwner,
        hasAccess,
      });
      return hasAccess;
    }

    // For individual users, show all items except Settings and Business Settings
    if (user.accountType === "individual") {
      return !item.adminOnly && !item.businessOwnerOnly;
    }

    // For business users, check permissions
    if (item.adminOnly && !isTeamAdmin) {
      return false;
    }

    // Check if user has required permissions
    if (item.requiredPermissions.length === 0) return true;

    return item.requiredPermissions.some((permission) =>
      userPermissions.includes(permission)
    );
  };

  const visibleItems = navigationItems.filter(hasPermission);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-all duration-300 z-50",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Navigation</h3>
                {currentTeam && (
                  <p className="text-xs text-gray-500">{currentTeam.name}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Button
                key={item.name}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start relative",
                  collapsed && "justify-center"
                )}
                onClick={() => {
                  router.push(item.href);
                  onClose();
                }}
              >
                <Icon className={cn("h-4 w-4", !collapsed && "mr-2")} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.name}</span>
                    {item.name === "Smart Alerts" && (
                      <Badge
                        variant="destructive"
                        className="h-5 w-5 rounded-full p-0 text-xs"
                      >
                        3
                      </Badge>
                    )}
                  </>
                )}

                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    {item.name}
                  </div>
                )}
              </Button>
            );
          })}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
            <div className="text-xs text-gray-500">
              <p className="font-medium">{user.businessName || "Finoly"}</p>
              <p>Version 1.0.0</p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
