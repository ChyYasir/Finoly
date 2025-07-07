import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Database,
  FileX,
  Search,
} from "lucide-react";

// Loading Skeleton Component
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-2 bg-gray-200 rounded w-full"></div>
            </div>
          </Card>
        ))}
      </div>

      {/* Chart skeleton */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </Card>
    </div>
  );
}

// Empty State Component
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  type?: "default" | "search" | "error" | "success";
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  type = "default",
}: EmptyStateProps) {
  const getDefaultIcon = () => {
    switch (type) {
      case "search":
        return <Search className="h-12 w-12 text-gray-400" />;
      case "error":
        return <AlertCircle className="h-12 w-12 text-red-400" />;
      case "success":
        return <CheckCircle className="h-12 w-12 text-green-400" />;
      default:
        return <Database className="h-12 w-12 text-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon || getDefaultIcon()}
      <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600 max-w-md">{description}</p>
      {action && (
        <Button onClick={action.onClick} className="mt-4" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
  description?: string;
  trend?: "up" | "down" | "stable";
  loading?: boolean;
  className?: string;
}

export function StatsCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
  description,
  trend,
  loading = false,
  className = "",
}: StatsCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getChangeColor = () => {
    switch (changeType) {
      case "positive":
        return "text-green-600";
      case "negative":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
          {icon && <div className="flex-shrink-0">{icon}</div>}
        </div>

        {(change !== undefined || trend) && (
          <div className="mt-4 flex items-center gap-2">
            {trend && getTrendIcon()}
            {change !== undefined && (
              <span className={`text-sm font-medium ${getChangeColor()}`}>
                {change > 0 ? "+" : ""}
                {change}%
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Chart Wrapper Component
interface ChartWrapperProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  toolbar?: React.ReactNode;
}

export function ChartWrapper({
  title,
  description,
  children,
  loading = false,
  error,
  onRefresh,
  toolbar,
}: ChartWrapperProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            {onRefresh && (
              <Button onClick={onRefresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center gap-2">
            {toolbar}
            {onRefresh && (
              <Button onClick={onRefresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// Status Badge Component
interface StatusBadgeProps {
  status: "good" | "warning" | "danger" | "info";
  label: string;
  className?: string;
}

export function StatusBadge({
  status,
  label,
  className = "",
}: StatusBadgeProps) {
  const getVariant = () => {
    switch (status) {
      case "good":
        return "default";
      case "warning":
        return "secondary";
      case "danger":
        return "destructive";
      case "info":
        return "outline";
      default:
        return "outline";
    }
  };

  const getIcon = () => {
    switch (status) {
      case "good":
        return <CheckCircle className="h-3 w-3 mr-1" />;
      case "warning":
      case "danger":
        return <AlertCircle className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <Badge variant={getVariant()} className={className}>
      {getIcon()}
      {label}
    </Badge>
  );
}

// Data Table Component
interface DataTableProps {
  data: any[];
  columns: Array<{
    key: string;
    label: string;
    render?: (value: any, row: any) => React.ReactNode;
  }>;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: any) => void;
}

export function DataTable({
  data,
  columns,
  loading = false,
  emptyMessage = "No data available",
  onRowClick,
}: DataTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={<FileX className="h-12 w-12 text-gray-400" />}
        title="No Data"
        description={emptyMessage}
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            {columns.map((column) => (
              <th
                key={column.key}
                className="text-left p-3 font-medium text-gray-600"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={index}
              className={`border-b hover:bg-gray-50 ${
                onRowClick ? "cursor-pointer" : ""
              }`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => (
                <td key={column.key} className="p-3">
                  {column.render
                    ? column.render(row[column.key], row)
                    : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
