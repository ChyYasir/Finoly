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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  DollarSign,
} from "lucide-react";

interface BudgetChartProps {
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

// Mock data for charts
const spendingTrends = [
  { month: "Jan", spending: 8500, budget: 10000, forecast: 9200 },
  { month: "Feb", spending: 9200, budget: 10000, forecast: 9800 },
  { month: "Mar", spending: 8800, budget: 10000, forecast: 9500 },
  { month: "Apr", spending: 9500, budget: 10000, forecast: 10200 },
  { month: "May", spending: 8900, budget: 10000, forecast: 9600 },
  { month: "Jun", spending: 9800, budget: 10000, forecast: 10400 },
];

const categoryBreakdown = [
  { name: "Advertising", value: 3200, color: "#3B82F6" },
  { name: "Travel", value: 2100, color: "#10B981" },
  { name: "Software", value: 1800, color: "#8B5CF6" },
  { name: "Events", value: 1500, color: "#F59E0B" },
  { name: "Office", value: 1200, color: "#EF4444" },
  { name: "Other", value: 800, color: "#6B7280" },
];

const weeklyTrends = [
  { day: "Mon", amount: 1200 },
  { day: "Tue", amount: 1800 },
  { day: "Wed", amount: 950 },
  { day: "Thu", amount: 2100 },
  { day: "Fri", amount: 1600 },
  { day: "Sat", amount: 800 },
  { day: "Sun", amount: 400 },
];

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#8B5CF6",
  "#F59E0B",
  "#EF4444",
  "#6B7280",
];

export function BudgetChart({ user, activeTeam }: BudgetChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("6months");
  const [activeTab, setActiveTab] = useState("trends");

  const currentTeam = user.teams?.find((t) => t.id === activeTeam);
  const teamName = currentTeam?.name || "Your Team";

  const totalSpending = spendingTrends.reduce(
    (sum, item) => sum + item.spending,
    0
  );
  const totalBudget = spendingTrends.reduce(
    (sum, item) => sum + item.budget,
    0
  );
  const averageSpending = totalSpending / spendingTrends.length;
  const budgetUtilization = (totalSpending / totalBudget) * 100;

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey}: ${entry.value?.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Financial Analytics
            </CardTitle>
            <CardDescription>
              {user.accountType === "individual" ? "Personal" : teamName}{" "}
              spending insights and trends
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={selectedPeriod === "30days" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod("30days")}
            >
              30 Days
            </Button>
            <Button
              variant={selectedPeriod === "6months" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod("6months")}
            >
              6 Months
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">
                Total Spending
              </span>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              ${totalSpending.toLocaleString()}
            </p>
            <p className="text-sm text-blue-600">Last 6 months</p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                Avg. Monthly
              </span>
            </div>
            <p className="text-2xl font-bold text-green-900">
              ${averageSpending.toLocaleString()}
            </p>
            <p className="text-sm text-green-600">Average spending</p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <PieChartIcon className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">
                Budget Usage
              </span>
            </div>
            <p className="text-2xl font-bold text-purple-900">
              {budgetUtilization.toFixed(1)}%
            </p>
            <p className="text-sm text-purple-600">Of total budget</p>
          </div>
        </div>

        {/* Charts */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="trends">Spending Trends</TabsTrigger>
            <TabsTrigger value="categories">Category Breakdown</TabsTrigger>
            <TabsTrigger value="weekly">Weekly View</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Monthly Spending vs Budget
              </h3>
              <Badge variant="outline" className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                8.5% increase
              </Badge>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={spendingTrends}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="budget" fill="#E5E7EB" name="Budget" />
                  <Bar dataKey="spending" fill="#3B82F6" name="Spending" />
                  <Bar dataKey="forecast" fill="#10B981" name="Forecast" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Spending by Category</h3>
              <Badge variant="outline">6 categories</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {categoryBreakdown.map((category, index) => (
                  <div
                    key={category.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm font-medium">
                        {category.name}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">
                      ${category.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="weekly" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Weekly Spending Pattern</h3>
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                This week
              </Badge>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={weeklyTrends}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ fill: "#3B82F6" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
