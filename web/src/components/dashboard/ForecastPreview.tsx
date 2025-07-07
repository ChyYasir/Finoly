"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Brain,
} from "lucide-react";

interface ForecastPreviewProps {
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

// Mock forecast data
const forecastData = {
  nextMonth: {
    predicted: 11200,
    budget: 10000,
    confidence: 85,
    trend: "up",
    change: 12.5,
    breakdown: [
      { category: "Advertising", amount: 4200, change: 15.2 },
      { category: "Travel", amount: 2800, change: -8.5 },
      { category: "Software", amount: 2100, change: 5.3 },
      { category: "Events", amount: 1500, change: 22.1 },
      { category: "Office", amount: 600, change: -15.2 },
    ],
  },
  quarter: {
    predicted: 32500,
    budget: 30000,
    confidence: 78,
    trend: "up",
    change: 8.3,
  },
  insights: [
    {
      type: "warning",
      title: "Budget Overspend Risk",
      description: "Predicted to exceed budget by 12% next month",
      impact: "high",
    },
    {
      type: "info",
      title: "Seasonal Pattern",
      description: "Advertising spend typically increases in Q4",
      impact: "medium",
    },
    {
      type: "success",
      title: "Cost Optimization",
      description: "Travel expenses trending down as expected",
      impact: "low",
    },
  ],
};

export function ForecastPreview({ user, activeTeam }: ForecastPreviewProps) {
  const currentTeam = user.teams?.find((t) => t.id === activeTeam);
  const teamName = currentTeam?.name || "Your Team";
  const { nextMonth, quarter, insights } = forecastData;

  const budgetUtilization = (nextMonth.predicted / nextMonth.budget) * 100;
  const quarterUtilization = (quarter.predicted / quarter.budget) * 100;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
            {/* <Crystal className="h-4 w-4 text-white" /> */}
          </div>
          Budget Forecast
        </CardTitle>
        <CardDescription>
          AI-powered predictions for{" "}
          {user.accountType === "individual" ? "your" : teamName} spending
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Next Month Forecast */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Next Month Prediction
            </h3>
            <Badge variant="outline" className="flex items-center gap-1">
              <Brain className="h-3 w-3" />
              {nextMonth.confidence}% confident
            </Badge>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-600">
                  Predicted Spending
                </span>
              </div>
              <div className="flex items-center gap-2">
                {nextMonth.trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-red-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-green-500" />
                )}
                <span
                  className={`text-sm font-medium ${
                    nextMonth.trend === "up" ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {nextMonth.change}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-indigo-900">
                ${nextMonth.predicted.toLocaleString()}
              </span>
              <span className="text-sm text-indigo-600">
                vs ${nextMonth.budget.toLocaleString()} budget
              </span>
            </div>

            <Progress value={budgetUtilization} className="h-2 mb-2" />
            <p className="text-sm text-indigo-600">
              {budgetUtilization > 100 ? "Over" : "Within"} budget by{" "}
              {Math.abs(budgetUtilization - 100).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Category Predictions</h4>
          <div className="space-y-2">
            {nextMonth.breakdown.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <span className="text-sm font-medium">{item.category}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    ${item.amount.toLocaleString()}
                  </span>
                  <div className="flex items-center gap-1">
                    {item.change > 0 ? (
                      <TrendingUp className="h-3 w-3 text-red-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-green-500" />
                    )}
                    <span
                      className={`text-xs ${
                        item.change > 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {Math.abs(item.change)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quarterly Outlook */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">Quarterly Outlook</h4>
            <Badge variant="secondary">{quarter.confidence}% confident</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold">
                ${quarter.predicted.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Predicted Q4 spending</p>
            </div>
            <div className="flex items-center gap-2">
              {quarter.trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500" />
              )}
              <span
                className={`text-sm font-medium ${
                  quarter.trend === "up" ? "text-red-600" : "text-green-600"
                }`}
              >
                {quarter.change}%
              </span>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">AI Insights</h4>
          <div className="space-y-2">
            {insights.map((insight, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-3 bg-white border rounded-lg"
              >
                {insight.type === "warning" && (
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                )}
                {insight.type === "success" && (
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                )}
                {insight.type === "info" && (
                  <Brain className="h-4 w-4 text-blue-500 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{insight.title}</p>
                  <p className="text-xs text-gray-600">{insight.description}</p>
                </div>
                <Badge
                  variant={
                    insight.impact === "high"
                      ? "destructive"
                      : insight.impact === "medium"
                      ? "secondary"
                      : "outline"
                  }
                  className="text-xs"
                >
                  {insight.impact}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <Button className="w-full" variant="outline">
          <ArrowRight className="h-4 w-4 mr-2" />
          View Detailed Forecast
        </Button>
      </CardContent>
    </Card>
  );
}
