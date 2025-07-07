// app/dashboard/business/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Building2,
  Users,
  Calendar,
  DollarSign,
  Shield,
  Settings,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Crown,
  TrendingUp,
} from "lucide-react";

interface BusinessData {
  id: string;
  name: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  teamsCount: number;
  usersCount: number;
  totalExpenses: number;
  activeBudgets: number;
  createdAt: string;
  subscription: {
    plan: string;
    status: string;
    expiresAt: string | null;
  };
  settings: {
    defaultCurrency?: string;
    fiscalYearStart?: string;
    timezone?: string;
    features?: {
      whatsappIntegration?: boolean;
      aiInsights?: boolean;
      advancedReporting?: boolean;
    };
    notifications?: {
      email?: boolean;
      whatsapp?: boolean;
      web?: boolean;
    };
  };
}

function BusinessSettingsContent() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    defaultCurrency: "USD",
    fiscalYearStart: "2024-01-01",
    timezone: "UTC",
    features: {
      whatsappIntegration: true,
      aiInsights: true,
      advancedReporting: true,
    },
    notifications: {
      email: true,
      whatsapp: true,
      web: true,
    },
  });

  // Check if user is business owner
  useEffect(() => {
    console.log("Business Settings Page - User check:", {
      isPending,
      user: session?.user,
      accountType: session?.user?.accountType,
      isBusinessOwner: session?.user?.isBusinessOwner,
      businessId: session?.user?.businessId,
    });

    if (!isPending && session?.user) {
      if (session.user.accountType !== "business") {
        console.log("Redirecting: Not a business account");
        router.push("/dashboard");
        return;
      }
      if (!session.user.isBusinessOwner) {
        console.log("Redirecting: Not a business owner");
        router.push("/dashboard");
        return;
      }
    }
  }, [session, isPending, router]);

  // Fetch business data
  useEffect(() => {
    if (!isPending && session?.user?.accountType === "business") {
      fetchBusinessData();
    }
  }, [session, isPending]);

  const fetchBusinessData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/business", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch business data");
      }

      const result = await response.json();
      setBusinessData(result.data);

      // Update form data with fetched data
      setFormData({
        name: result.data.name,
        defaultCurrency: result.data.settings?.defaultCurrency || "USD",
        fiscalYearStart: result.data.settings?.fiscalYearStart || "2024-01-01",
        timezone: result.data.settings?.timezone || "UTC",
        features: {
          whatsappIntegration:
            result.data.settings?.features?.whatsappIntegration ?? true,
          aiInsights: result.data.settings?.features?.aiInsights ?? true,
          advancedReporting:
            result.data.settings?.features?.advancedReporting ?? true,
        },
        notifications: {
          email: result.data.settings?.notifications?.email ?? true,
          whatsapp: result.data.settings?.notifications?.whatsapp ?? true,
          web: result.data.settings?.notifications?.web ?? true,
        },
      });
    } catch (error) {
      console.error("Error fetching business data:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch business data"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch("/api/business", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          settings: {
            defaultCurrency: formData.defaultCurrency,
            fiscalYearStart: formData.fiscalYearStart,
            timezone: formData.timezone,
            features: formData.features,
            notifications: formData.notifications,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update business");
      }

      const result = await response.json();
      toast.success("Business settings updated successfully");

      // Refetch data to ensure UI is in sync
      await fetchBusinessData();
    } catch (error) {
      console.error("Error updating business:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update business";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: formData.defaultCurrency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading business settings...</p>
        </div>
      </div>
    );
  }

  if (error && !businessData) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Error Loading Business Data
              </h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchBusinessData} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Debug Session Info - Remove in production */}
      {process.env.NODE_ENV === "development" && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">
              Debug: Session Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-blue-100 p-4 rounded overflow-auto">
              {JSON.stringify(session?.user, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Business Settings
          </h1>
          <p className="text-gray-600">
            Manage your business information and preferences
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Crown className="h-4 w-4" />
          Business Owner
        </Badge>
      </div>

      {/* Business Overview */}
      {businessData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Teams</p>
                  <p className="text-xl font-semibold">
                    {businessData.teamsCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Users</p>
                  <p className="text-xl font-semibold">
                    {businessData.usersCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Expenses</p>
                  <p className="text-xl font-semibold">
                    {formatCurrency(businessData.totalExpenses)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Budgets</p>
                  <p className="text-xl font-semibold">
                    {businessData.activeBudgets}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Business Information
          </CardTitle>
          <CardDescription>
            Update your business details and basic information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter business name"
              />
            </div>
            <div>
              <Label htmlFor="defaultCurrency">Default Currency</Label>
              <Select
                value={formData.defaultCurrency}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, defaultCurrency: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                  <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                  <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fiscalYearStart">Fiscal Year Start</Label>
              <Input
                id="fiscalYearStart"
                type="date"
                value={formData.fiscalYearStart}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    fiscalYearStart: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, timezone: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">
                    Pacific Time
                  </SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Europe/Paris">Paris</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {businessData && (
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600">
                Business created on {formatDate(businessData.createdAt)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Features
          </CardTitle>
          <CardDescription>
            Enable or disable features for your business
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="whatsappIntegration">WhatsApp Integration</Label>
              <p className="text-sm text-gray-600">
                Enable WhatsApp queries and notifications
              </p>
            </div>
            <Switch
              id="whatsappIntegration"
              checked={formData.features.whatsappIntegration}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  features: { ...prev.features, whatsappIntegration: checked },
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="aiInsights">AI Insights</Label>
              <p className="text-sm text-gray-600">
                Enable AI-powered financial insights and recommendations
              </p>
            </div>
            <Switch
              id="aiInsights"
              checked={formData.features.aiInsights}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  features: { ...prev.features, aiInsights: checked },
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="advancedReporting">Advanced Reporting</Label>
              <p className="text-sm text-gray-600">
                Enable advanced reporting features and analytics
              </p>
            </div>
            <Switch
              id="advancedReporting"
              checked={formData.features.advancedReporting}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  features: { ...prev.features, advancedReporting: checked },
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="emailNotifications">Email Notifications</Label>
              <p className="text-sm text-gray-600">
                Receive notifications via email
              </p>
            </div>
            <Switch
              id="emailNotifications"
              checked={formData.notifications.email}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  notifications: { ...prev.notifications, email: checked },
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="whatsappNotifications">
                WhatsApp Notifications
              </Label>
              <p className="text-sm text-gray-600">
                Receive notifications via WhatsApp
              </p>
            </div>
            <Switch
              id="whatsappNotifications"
              checked={formData.notifications.whatsapp}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  notifications: { ...prev.notifications, whatsapp: checked },
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="webNotifications">Web Notifications</Label>
              <p className="text-sm text-gray-600">
                Receive notifications in the web interface
              </p>
            </div>
            <Switch
              id="webNotifications"
              checked={formData.notifications.web}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  notifications: { ...prev.notifications, web: checked },
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Subscription Info */}
      {businessData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Subscription
            </CardTitle>
            <CardDescription>
              Your current subscription plan and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Current Plan</p>
                <p className="text-sm text-gray-600">
                  {businessData.subscription.plan.toUpperCase()} -{" "}
                  {businessData.subscription.status}
                </p>
                {businessData.subscription.expiresAt && (
                  <p className="text-sm text-gray-600">
                    Expires: {formatDate(businessData.subscription.expiresAt)}
                  </p>
                )}
              </div>
              <Badge
                variant={
                  businessData.subscription.status === "active"
                    ? "default"
                    : "secondary"
                }
              >
                {businessData.subscription.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="text-red-700">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default function BusinessSettingsPage() {
  return (
    <DashboardLayout>
      <BusinessSettingsContent />
    </DashboardLayout>
  );
}
