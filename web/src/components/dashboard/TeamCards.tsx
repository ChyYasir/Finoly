"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

interface TeamCardsProps {
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

// Mock data for team budgets and spending
const teamBudgetData = {
  team_1: {
    id: "team_1",
    name: "Marketing Team",
    budget: 15000,
    spent: 8750,
    members: 12,
    trend: "up",
    trendValue: 12.5,
    categories: [
      { name: "Advertising", amount: 5200, color: "bg-blue-500" },
      { name: "Events", amount: 2100, color: "bg-green-500" },
      { name: "Content", amount: 1450, color: "bg-purple-500" },
    ],
  },
  team_2: {
    id: "team_2",
    name: "Sales Team",
    budget: 12000,
    spent: 6300,
    members: 8,
    trend: "down",
    trendValue: 5.2,
    categories: [
      { name: "Travel", amount: 3200, color: "bg-orange-500" },
      { name: "Tools", amount: 1800, color: "bg-red-500" },
      { name: "Training", amount: 1300, color: "bg-indigo-500" },
    ],
  },
  team_3: {
    id: "team_3",
    name: "Operations Team",
    budget: 20000,
    spent: 16800,
    members: 15,
    trend: "up",
    trendValue: 18.9,
    categories: [
      { name: "Infrastructure", amount: 8400, color: "bg-cyan-500" },
      { name: "Software", amount: 4200, color: "bg-pink-500" },
      { name: "Maintenance", amount: 4200, color: "bg-yellow-500" },
    ],
  },
};

// Individual user mock data
const individualData = {
  budget: 5000,
  spent: 3200,
  trend: "up",
  trendValue: 8.5,
  categories: [
    { name: "Food", amount: 1200, color: "bg-green-500" },
    { name: "Transport", amount: 800, color: "bg-blue-500" },
    { name: "Entertainment", amount: 600, color: "bg-purple-500" },
    { name: "Shopping", amount: 600, color: "bg-orange-500" },
  ],
};

export function TeamCards({ user, activeTeam }: TeamCardsProps) {
  // For individual users, show personal budget card
  if (user.accountType === "individual") {
    const data = individualData;
    const usagePercentage = (data.spent / data.budget) * 100;
    const remaining = data.budget - data.spent;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Budget Overview
            </h2>
            <p className="text-gray-600">Your personal financial summary</p>
          </div>
        </div>

        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                Personal Budget
              </span>
              <Badge
                variant={
                  usagePercentage > 80
                    ? "destructive"
                    : usagePercentage > 60
                    ? "secondary"
                    : "default"
                }
              >
                {usagePercentage.toFixed(1)}% Used
              </Badge>
            </CardTitle>
            <CardDescription>
              Monthly budget tracking and spending analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Budget Usage</span>
              <span className="font-medium">
                ${data.spent.toLocaleString()} / ${data.budget.toLocaleString()}
              </span>
            </div>
            <Progress value={usagePercentage} className="h-2" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Remaining:</span>
                <span className="text-sm font-medium text-green-600">
                  ${remaining.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {data.trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={`text-sm font-medium ${
                    data.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {data.trendValue}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // For business users, show team cards
  const teams = user.teams || [];
  const currentTeam = teams.find((t) => t.id === activeTeam);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Overview</h2>
          <p className="text-gray-600">Budget usage across your teams</p>
        </div>
        <Button variant="outline" size="sm">
          <ArrowRight className="h-4 w-4 mr-2" />
          View All Teams
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((team) => {
          const data = teamBudgetData[
            team.id as keyof typeof teamBudgetData
          ] || {
            id: team.id,
            name: team.name,
            budget: 10000,
            spent: 4500,
            members: 6,
            trend: "up",
            trendValue: 3.2,
            categories: [
              { name: "General", amount: 4500, color: "bg-gray-500" },
            ],
          };

          const usagePercentage = (data.spent / data.budget) * 100;
          const remaining = data.budget - data.spent;
          const isActive = team.id === activeTeam;

          return (
            <Card
              key={team.id}
              className={`transition-all duration-200 hover:shadow-lg ${
                isActive
                  ? "border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50"
                  : "hover:border-gray-300"
              }`}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-600" />
                    {data.name}
                  </span>
                  {isActive && (
                    <Badge variant="default" className="text-xs">
                      Active
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <span>{data.members} members</span>
                  <span>•</span>
                  <span className="capitalize">
                    {team.roleName || "Member"}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Budget Usage</span>
                  <span className="font-medium">
                    ${data.spent.toLocaleString()} / $
                    {data.budget.toLocaleString()}
                  </span>
                </div>
                <Progress value={usagePercentage} className="h-2" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Remaining:</span>
                    <span className="text-sm font-medium text-green-600">
                      ${remaining.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {data.trend === "up" ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        data.trend === "up" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {data.trendValue}%
                    </span>
                  </div>
                </div>

                {/* Status indicator */}
                <div className="flex items-center gap-2 pt-2">
                  {usagePercentage > 85 ? (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  <span
                    className={`text-sm ${
                      usagePercentage > 85 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {usagePercentage > 85 ? "Over Budget" : "On Track"}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
