"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Receipt,
  PiggyBank,
  FileText,
  UserPlus,
  Download,
  Upload,
  Zap,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

interface QuickActionsProps {
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
}

export function QuickActions({ user, activeTeam }: QuickActionsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const currentTeam = user.teams?.find((t) => t.id === activeTeam);
  const userPermissions = currentTeam?.permissions || [];
  const isTeamAdmin =
    user.role === "owner" || userPermissions.includes("update_team");

  const handleAction = async (actionType: string) => {
    setIsLoading(actionType);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsLoading(null);

    // Show success toast
    switch (actionType) {
      case "expense":
        toast.success("Expense form opened");
        break;
      case "budget":
        toast.success("Budget creation started");
        break;
      case "report":
        toast.success("Report generation initiated");
        break;
      case "invite":
        toast.success("Invitation sent");
        break;
      case "import":
        toast.success("Import wizard opened");
        break;
      case "export":
        toast.success("Export started");
        break;
      case "forecast":
        toast.success("Forecast analysis started");
        break;
      case "alert":
        toast.success("Alert configuration opened");
        break;
      default:
        toast.success("Action completed");
    }
  };

  const hasPermission = (permission: string) => {
    if (user.accountType === "individual") return true;
    return userPermissions.includes(permission);
  };

  const primaryActions = [
    {
      id: "expense",
      title: "Add Expense",
      description: "Record new expense with receipt",
      icon: Receipt,
      permission: "create_expense",
      color: "bg-blue-500 hover:bg-blue-600",
      popular: true,
    },
    {
      id: "budget",
      title: "Create Budget",
      description: "Set up new budget plan",
      icon: PiggyBank,
      permission: "create_budget",
      color: "bg-green-500 hover:bg-green-600",
      popular: true,
    },
    {
      id: "report",
      title: "Generate Report",
      description: "Create financial report",
      icon: FileText,
      permission: "create_report",
      color: "bg-purple-500 hover:bg-purple-600",
      popular: true,
    },
    {
      id: "invite",
      title: "Invite Member",
      description: "Add team member",
      icon: UserPlus,
      permission: "create_user",
      color: "bg-orange-500 hover:bg-orange-600",
      adminOnly: true,
      popular: false,
    },
  ];

  const secondaryActions = [
    {
      id: "import",
      title: "Import Data",
      description: "Upload expenses from CSV",
      icon: Upload,
      permission: "create_expense",
      color: "border-blue-200 hover:bg-blue-50",
    },
    {
      id: "export",
      title: "Export Data",
      description: "Download financial data",
      icon: Download,
      permission: "read_expense",
      color: "border-green-200 hover:bg-green-50",
    },
    {
      id: "forecast",
      title: "Run Forecast",
      description: "Generate spending prediction",
      icon: TrendingUp,
      permission: "create_forecast",
      color: "border-purple-200 hover:bg-purple-50",
    },
    {
      id: "alert",
      title: "Set Alert",
      description: "Configure budget alerts",
      icon: AlertCircle,
      permission: "create_alert",
      color: "border-orange-200 hover:bg-orange-50",
    },
  ];

  const visiblePrimaryActions = primaryActions.filter((action) => {
    if (action.adminOnly && !isTeamAdmin) return false;
    if (action.permission && !hasPermission(action.permission)) return false;
    return true;
  });

  const visibleSecondaryActions = secondaryActions.filter((action) => {
    if (action.permission && !hasPermission(action.permission)) return false;
    return true;
  });

  // Recent actions for quick access
  const recentActions = [
    { name: "Office Supplies", type: "expense", amount: 125, time: "2h ago" },
    {
      name: "Q4 Marketing Budget",
      type: "budget",
      amount: 15000,
      time: "1d ago",
    },
    { name: "Monthly Report", type: "report", downloads: 3, time: "2d ago" },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
          Quick Actions
        </CardTitle>
        <CardDescription>
          Streamline your financial management with one-click actions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Actions */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-gray-700">Primary Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {visiblePrimaryActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  onClick={() => handleAction(action.id)}
                  disabled={isLoading === action.id}
                  className={`${action.color} text-white h-auto p-4 flex flex-col items-center gap-2 relative`}
                >
                  {action.popular && (
                    <Badge className="absolute -top-2 -right-2 text-xs">
                      Popular
                    </Badge>
                  )}
                  {isLoading === action.id ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                  <div className="text-center">
                    <p className="font-medium text-sm">{action.title}</p>
                    <p className="text-xs opacity-90">{action.description}</p>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Secondary Actions */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-gray-700">More Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            {visibleSecondaryActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  variant="outline"
                  onClick={() => handleAction(action.id)}
                  disabled={isLoading === action.id}
                  className={`${action.color} h-auto p-3 flex flex-col items-center gap-2`}
                >
                  {isLoading === action.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                  <div className="text-center">
                    <p className="font-medium text-xs">{action.title}</p>
                    <p className="text-xs text-gray-500">
                      {action.description}
                    </p>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-gray-700">Recent Activity</h3>
          <div className="space-y-2">
            {recentActions.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <div className="flex items-center gap-2">
                  {activity.type === "expense" && (
                    <Receipt className="h-4 w-4 text-blue-500" />
                  )}
                  {activity.type === "budget" && (
                    <PiggyBank className="h-4 w-4 text-green-500" />
                  )}
                  {activity.type === "report" && (
                    <FileText className="h-4 w-4 text-purple-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{activity.name}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  {activity.amount && (
                    <p className="text-sm font-medium">
                      ${activity.amount.toLocaleString()}
                    </p>
                  )}
                  {activity.downloads && (
                    <p className="text-sm font-medium">
                      {activity.downloads} downloads
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Keyboard shortcuts:</span>
            <div className="flex gap-2">
              <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl+E</kbd>
              <span>Add Expense</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
