"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  EmptyState,
  StatsCard,
  DataTable,
  ChartWrapper,
  StatusBadge,
} from "@/components/dashboard/DashboardComponents";
import {
  useTeamPermissions,
  useDashboardFilters,
  formatCurrency,
  formatDate,
} from "@/lib/dashboard/hooks";
import {
  Plus,
  Search,
  Filter,
  Download,
  Receipt,
  Calendar,
  DollarSign,
  TrendingUp,
  Edit,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

// Mock expenses data
const mockExpenses = [
  {
    id: 1,
    amount: 1200,
    category: "Office Supplies",
    description: "Monthly office supplies and equipment",
    date: "2024-01-15",
    user: "John Doe",
    status: "approved",
    receipts: 2,
    team: "Operations",
  },
  {
    id: 2,
    amount: 800,
    category: "Travel",
    description: "Business trip to New York",
    date: "2024-01-14",
    user: "Jane Smith",
    status: "pending",
    receipts: 1,
    team: "Sales",
  },
  {
    id: 3,
    amount: 299,
    category: "Software",
    description: "Design software subscription",
    date: "2024-01-13",
    user: "Mike Johnson",
    status: "approved",
    receipts: 1,
    team: "Marketing",
  },
  {
    id: 4,
    amount: 450,
    category: "Marketing",
    description: "Social media advertising campaign",
    date: "2024-01-12",
    user: "Sarah Wilson",
    status: "rejected",
    receipts: 0,
    team: "Marketing",
  },
  {
    id: 5,
    amount: 75,
    category: "Meals",
    description: "Client lunch meeting",
    date: "2024-01-11",
    user: "Tom Brown",
    status: "approved",
    receipts: 1,
    team: "Sales",
  },
];

export default function ExpensesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExpenses, setSelectedExpenses] = useState<number[]>([]);
  const { hasPermission } = useTeamPermissions("team_1"); // Example team
  const { filters, updateFilter } = useDashboardFilters();

  const handleAddExpense = () => {
    if (!hasPermission("create_expense")) {
      toast.error("You don't have permission to create expenses");
      return;
    }
    toast.success("Add expense form would open here");
  };

  const handleEditExpense = (expense: any) => {
    if (!hasPermission("update_expense")) {
      toast.error("You don't have permission to edit expenses");
      return;
    }
    toast.success(`Edit expense: ${expense.description}`);
  };

  const handleDeleteExpense = (expense: any) => {
    if (!hasPermission("delete_expense")) {
      toast.error("You don't have permission to delete expenses");
      return;
    }
    toast.success(`Delete expense: ${expense.description}`);
  };

  const filteredExpenses = mockExpenses.filter(
    (expense) =>
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.user.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalExpenses = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const approvedExpenses = filteredExpenses.filter(
    (e) => e.status === "approved"
  ).length;
  const pendingExpenses = filteredExpenses.filter(
    (e) => e.status === "pending"
  ).length;
  const averageExpense =
    filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0;

  const expenseColumns = [
    {
      key: "date",
      label: "Date",
      render: (value: string) => formatDate(value),
    },
    {
      key: "description",
      label: "Description",
      render: (value: string, row: any) => (
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-sm text-gray-500">{row.category}</p>
        </div>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (value: number) => (
        <span className="font-medium">{formatCurrency(value)}</span>
      ),
    },
    {
      key: "user",
      label: "User",
      render: (value: string, row: any) => (
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-sm text-gray-500">{row.team}</p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value: string) => (
        <StatusBadge
          status={
            value === "approved"
              ? "good"
              : value === "pending"
              ? "warning"
              : "danger"
          }
          label={value.charAt(0).toUpperCase() + value.slice(1)}
        />
      ),
    },
    {
      key: "receipts",
      label: "Receipts",
      render: (value: number) => (
        <div className="flex items-center gap-1">
          <Receipt className="h-4 w-4 text-gray-400" />
          <span className="text-sm">{value}</span>
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (value: any, row: any) => (
        <div className="flex items-center gap-1">
          {hasPermission("update_expense") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditExpense(row)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {hasPermission("delete_expense") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteExpense(row)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
            <p className="text-gray-600">Track and manage your team expenses</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            {hasPermission("create_expense") && (
              <Button onClick={handleAddExpense}>
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Expenses"
            value={formatCurrency(totalExpenses)}
            icon={<DollarSign className="h-5 w-5 text-blue-500" />}
            trend="up"
            change={12.5}
            changeType="negative"
          />
          <StatsCard
            title="Approved"
            value={approvedExpenses}
            icon={<Receipt className="h-5 w-5 text-green-500" />}
            description="This month"
          />
          <StatsCard
            title="Pending"
            value={pendingExpenses}
            icon={<Calendar className="h-5 w-5 text-yellow-500" />}
            description="Awaiting approval"
          />
          <StatsCard
            title="Average"
            value={formatCurrency(averageExpense)}
            icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
            description="Per expense"
          />
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search expenses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Date Range
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>
              {filteredExpenses.length} expenses found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredExpenses.length === 0 ? (
              <EmptyState
                title="No expenses found"
                description="No expenses match your search criteria. Try adjusting your filters or create a new expense."
                action={{
                  label: "Add Expense",
                  onClick: handleAddExpense,
                }}
              />
            ) : (
              <DataTable
                data={filteredExpenses}
                columns={expenseColumns}
                onRowClick={(expense) => {
                  toast.info(`Viewing expense: ${expense.description}`);
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
