"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  EmptyState,
  StatsCard,
  ChartWrapper,
  StatusBadge,
} from "@/components/dashboard/DashboardComponents";
import {
  useTeamPermissions,
  formatCurrency,
  formatPercentage,
  calculateBudgetUtilization,
} from "@/lib/dashboard/hooks";
import {
  Plus,
  Target,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  PieChart,
  Settings,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

// Mock budgets data
const mockBudgets = [
  {
    id: 1,
    name: "Q1 Marketing Budget",
    amount: 15000,
    spent: 8750,
    period: "Q1 2024",
    category: "Marketing",
    status: "active",
    team: "Marketing Team",
    startDate: "2024-01-01",
    endDate: "2024-03-31",
    alerts: [{ type: "warning", message: "Budget at 58% utilization" }],
  },
  {
    id: 2,
    name: "Operations Budget",
    amount: 20000,
    spent: 16800,
    period: "Q1 2024",
    category: "Operations",
    status: "active",
    team: "Operations Team",
    startDate: "2024-01-01",
    endDate: "2024-03-31",
    alerts: [{ type: "danger", message: "Budget at 84% utilization" }],
  },
  {
    id: 3,
    name: "Sales Travel Budget",
    amount: 12000,
    spent: 6300,
    period: "Q1 2024",
    category: "Travel",
    status: "active",
    team: "Sales Team",
    startDate: "2024-01-01",
    endDate: "2024-03-31",
    alerts: [],
  },
  {
    id: 4,
    name: "Software Licenses",
    amount: 8000,
    spent: 8000,
    period: "Q1 2024",
    category: "Software",
    status: "completed",
    team: "IT Team",
    startDate: "2024-01-01",
    endDate: "2024-03-31",
    alerts: [{ type: "info", message: "Budget fully utilized" }],
  },
  {
    id: 5,
    name: "Training & Development",
    amount: 5000,
    spent: 1200,
    period: "Q1 2024",
    category: "Training",
    status: "active",
    team: "HR Team",
    startDate: "2024-01-01",
    endDate: "2024-03-31",
    alerts: [],
  },
];

export default function BudgetsPage() {
  const [selectedBudget, setSelectedBudget] = useState<number | null>(null);
  const { hasPermission } = useTeamPermissions("team_1"); // Example team

  const handleCreateBudget = () => {
    if (!hasPermission("create_budget")) {
      toast.error("You don't have permission to create budgets");
      return;
    }
    toast.success("Create budget form would open here");
  };

  const handleEditBudget = (budget: any) => {
    if (!hasPermission("update_budget")) {
      toast.error("You don't have permission to edit budgets");
      return;
    }
    toast.success(`Edit budget: ${budget.name}`);
  };

  const handleViewBudget = (budget: any) => {
    setSelectedBudget(budget.id);
    toast.info(`Viewing budget: ${budget.name}`);
  };

  // Calculate summary stats
  const totalBudget = mockBudgets.reduce(
    (sum, budget) => sum + budget.amount,
    0
  );
  const totalSpent = mockBudgets.reduce((sum, budget) => sum + budget.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overBudgetCount = mockBudgets.filter((b) => b.spent > b.amount).length;
  const activeBudgets = mockBudgets.filter((b) => b.status === "active").length;

  const getBudgetStatus = (budget: any) => {
    const utilization = calculateBudgetUtilization(budget.spent, budget.amount);
    if (utilization >= 100) return "over";
    if (utilization >= 85) return "warning";
    if (utilization >= 70) return "caution";
    return "good";
  };

  const getBudgetStatusBadge = (budget: any) => {
    const status = getBudgetStatus(budget);
    switch (status) {
      case "over":
        return <StatusBadge status="danger" label="Over Budget" />;
      case "warning":
        return <StatusBadge status="warning" label="Near Limit" />;
      case "caution":
        return <StatusBadge status="warning" label="Caution" />;
      default:
        return <StatusBadge status="good" label="On Track" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
            <p className="text-gray-600">
              Monitor and manage your team budgets
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            {hasPermission("create_budget") && (
              <Button onClick={handleCreateBudget}>
                <Plus className="h-4 w-4 mr-2" />
                Create Budget
              </Button>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Budget"
            value={formatCurrency(totalBudget)}
            icon={<Target className="h-5 w-5 text-blue-500" />}
            description="Across all teams"
          />
          <StatsCard
            title="Total Spent"
            value={formatCurrency(totalSpent)}
            icon={<DollarSign className="h-5 w-5 text-green-500" />}
            change={15.2}
            changeType="positive"
            trend="up"
          />
          <StatsCard
            title="Remaining"
            value={formatCurrency(totalRemaining)}
            icon={<TrendingDown className="h-5 w-5 text-orange-500" />}
            description="Available to spend"
          />
          <StatsCard
            title="Active Budgets"
            value={activeBudgets}
            icon={<CheckCircle className="h-5 w-5 text-purple-500" />}
            description={`${overBudgetCount} over budget`}
          />
        </div>

        {/* Budget Overview Chart */}
        <ChartWrapper
          title="Budget Overview"
          description="Current period budget utilization across teams"
        >
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Chart would be rendered here</p>
              <p className="text-sm text-gray-500">
                Using Recharts or similar library
              </p>
            </div>
          </div>
        </ChartWrapper>

        {/* Budget Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Budget Details</h2>
            <Badge variant="outline">{mockBudgets.length} budgets</Badge>
          </div>

          {mockBudgets.length === 0 ? (
            <EmptyState
              title="No budgets found"
              description="Create your first budget to start tracking expenses and managing your team's financial goals."
              action={{
                label: "Create Budget",
                onClick: handleCreateBudget,
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockBudgets.map((budget) => {
                const utilization = calculateBudgetUtilization(
                  budget.spent,
                  budget.amount
                );
                const remaining = budget.amount - budget.spent;
                const isOverBudget = budget.spent > budget.amount;

                return (
                  <Card
                    key={budget.id}
                    className={`transition-all duration-200 hover:shadow-lg ${
                      selectedBudget === budget.id ? "ring-2 ring-blue-500" : ""
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {budget.name}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <span>{budget.team}</span>
                            <span>•</span>
                            <span>{budget.period}</span>
                          </CardDescription>
                        </div>
                        {getBudgetStatusBadge(budget)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Budget Progress */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Budget Usage</span>
                          <span className="font-medium">
                            {formatCurrency(budget.spent)} /{" "}
                            {formatCurrency(budget.amount)}
                          </span>
                        </div>
                        <Progress
                          value={Math.min(utilization, 100)}
                          className={`h-2 ${isOverBudget ? "bg-red-100" : ""}`}
                        />
                        <div className="flex items-center justify-between text-sm">
                          <span
                            className={`${
                              isOverBudget ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            {isOverBudget ? "Over by" : "Remaining"}:{" "}
                            {formatCurrency(Math.abs(remaining))}
                          </span>
                          <span className="font-medium">
                            {formatPercentage(utilization)}
                          </span>
                        </div>
                      </div>

                      {/* Alerts */}
                      {budget.alerts.length > 0 && (
                        <div className="space-y-2">
                          {budget.alerts.map((alert, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 text-sm"
                            >
                              {alert.type === "danger" && (
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                              )}
                              {alert.type === "warning" && (
                                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                              )}
                              {alert.type === "info" && (
                                <CheckCircle className="h-4 w-4 text-blue-500" />
                              )}
                              <span className="text-gray-600">
                                {alert.message}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleViewBudget(budget)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        {hasPermission("update_budget") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditBudget(budget)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
