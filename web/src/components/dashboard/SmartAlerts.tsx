"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Info,
  X,
  Bell,
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  Settings,
  ExternalLink,
} from "lucide-react";

interface SmartAlertsProps {
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

// Mock alerts data
const alertsData = [
  {
    id: 1,
    type: "critical",
    title: "Budget Threshold Exceeded",
    description: "Marketing team has exceeded 85% of monthly budget",
    amount: 8750,
    budget: 10000,
    percentage: 87.5,
    teamId: "team_1",
    teamName: "Marketing Team",
    timestamp: "2 hours ago",
    actionRequired: true,
    category: "budget",
  },
  {
    id: 2,
    type: "warning",
    title: "Unusual Spending Pattern",
    description: "Office expenses 45% higher than usual this week",
    amount: 1200,
    average: 825,
    teamId: "team_2",
    teamName: "Operations Team",
    timestamp: "4 hours ago",
    actionRequired: false,
    category: "anomaly",
  },
  {
    id: 3,
    type: "info",
    title: "Forecast Update",
    description: "Next month spending predicted to be 12% higher",
    predicted: 11200,
    current: 10000,
    teamId: "team_1",
    teamName: "Marketing Team",
    timestamp: "6 hours ago",
    actionRequired: false,
    category: "forecast",
  },
  {
    id: 4,
    type: "success",
    title: "Budget Goal Achieved",
    description: "Sales team stayed within budget for 3 consecutive months",
    teamId: "team_3",
    teamName: "Sales Team",
    timestamp: "1 day ago",
    actionRequired: false,
    category: "achievement",
  },
  {
    id: 5,
    type: "warning",
    title: "Payment Due Soon",
    description: "Software subscription renewal due in 3 days",
    amount: 299,
    dueDate: "2024-01-15",
    timestamp: "1 day ago",
    actionRequired: true,
    category: "payment",
  },
];

export function SmartAlerts({ user, activeTeam }: SmartAlertsProps) {
  const [alerts, setAlerts] = useState(alertsData);
  const [filter, setFilter] = useState<"all" | "critical" | "warning" | "info">(
    "all"
  );

  const currentTeam = user.teams?.find((t) => t.id === activeTeam);
  const teamName = currentTeam?.name || "Your Team";

  const handleDismissAlert = (alertId: number) => {
    setAlerts(alerts.filter((alert) => alert.id !== alertId));
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === "all") return true;
    return alert.type === filter;
  });

  const criticalCount = alerts.filter(
    (alert) => alert.type === "critical"
  ).length;
  const warningCount = alerts.filter(
    (alert) => alert.type === "warning"
  ).length;
  const actionRequiredCount = alerts.filter(
    (alert) => alert.actionRequired
  ).length;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case "critical":
        return "border-red-200 bg-red-50";
      case "warning":
        return "border-yellow-200 bg-yellow-50";
      case "info":
        return "border-blue-200 bg-blue-50";
      case "success":
        return "border-green-200 bg-green-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-white" />
          </div>
          Smart Alerts
          {alerts.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {alerts.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Real-time budget monitoring and intelligent notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alert Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-600">Critical</span>
            </div>
            <p className="text-lg font-bold text-red-900">{criticalCount}</p>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-600">
                Warning
              </span>
            </div>
            <p className="text-lg font-bold text-yellow-900">{warningCount}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">
                Action Required
              </span>
            </div>
            <p className="text-lg font-bold text-blue-900">
              {actionRequiredCount}
            </p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All ({alerts.length})
          </Button>
          <Button
            variant={filter === "critical" ? "destructive" : "outline"}
            size="sm"
            onClick={() => setFilter("critical")}
          >
            Critical ({criticalCount})
          </Button>
          <Button
            variant={filter === "warning" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setFilter("warning")}
          >
            Warning ({warningCount})
          </Button>
          <Button
            variant={filter === "info" ? "outline" : "outline"}
            size="sm"
            onClick={() => setFilter("info")}
          >
            Info
          </Button>
        </div>

        {/* Alerts List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600">No alerts to display</p>
              <p className="text-sm text-gray-500">You're all caught up!</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <Alert
                key={alert.id}
                className={`${getAlertColor(alert.type)} border`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{alert.title}</h4>
                        {alert.actionRequired && (
                          <Badge variant="destructive" className="text-xs">
                            Action Required
                          </Badge>
                        )}
                      </div>
                      <AlertDescription className="text-xs mb-2">
                        {alert.description}
                      </AlertDescription>

                      {/* Alert Details */}
                      <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                        {alert.teamName && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {alert.teamName}
                          </span>
                        )}
                        {alert.amount && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />$
                            {alert.amount.toLocaleString()}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {alert.timestamp}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      {alert.actionRequired && (
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                          {alert.category === "budget" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                            >
                              Adjust Budget
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismissAlert(alert.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Alert>
            ))
          )}
        </div>

        {/* Alert Settings */}
        <div className="border-t pt-4">
          <Button variant="outline" className="w-full" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure Alert Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
