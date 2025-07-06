"use client";

import { useSession, signOut } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  User,
  Building2,
  PlusCircle,
  FileText,
  DollarSign,
  Users,
  Activity,
  CheckCircle,
  LogOut,
  Settings,
} from "lucide-react";

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/signin");
    }
  }, [session, isPending, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const { user } = session;
  const displayName = user.name || user.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Finoly Dashboard
                  </h1>
                  <p className="text-sm text-gray-500">
                    {user.accountType === "business"
                      ? "Business Account"
                      : "Individual Account"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image || ""} alt={displayName} />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {displayName}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <Separator orientation="vertical" className="h-6" />
              <Button onClick={handleSignOut} variant="ghost" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Welcome back, {displayName}!
            </h2>
            <p className="text-gray-600">
              Here's what's happening with your{" "}
              {user.accountType === "business" ? "business" : "finances"} today.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Profile Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-sm text-gray-900">{user.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    Account Type
                  </p>
                  <Badge
                    variant={
                      user.accountType === "business" ? "default" : "secondary"
                    }
                    className="capitalize"
                  >
                    {user.accountType}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    Member Since
                  </p>
                  <p className="text-sm text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Business Information - Only for business users */}
            {user.accountType === "business" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Business Information
                  </CardTitle>
                  <CardDescription>Your business details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">
                      Business Name
                    </p>
                    <p className="text-sm text-gray-900">{user.businessName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">
                      Your Role
                    </p>
                    <Badge
                      variant={user.role === "owner" ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {user.role}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">
                      Team Memberships
                    </p>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <p className="text-sm text-gray-900">
                        {user.teams?.length || 0} team(s)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Team Memberships - Only for business users with teams */}
            {user.accountType === "business" &&
              user.teams &&
              user.teams.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Team Memberships
                    </CardTitle>
                    <CardDescription>
                      Your team roles and permissions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {user.teams.map((team) => (
                        <div
                          key={team.id}
                          className="border rounded-lg p-3 space-y-2"
                        >
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-medium text-gray-900">
                              {team.name}
                            </p>
                            {team.roleName && (
                              <Badge variant="outline" className="text-xs">
                                {team.roleName}
                              </Badge>
                            )}
                          </div>
                          {team.permissions && team.permissions.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {team.permissions
                                .slice(0, 3)
                                .map((permission) => (
                                  <Badge
                                    key={permission}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {permission.replace("_", " ")}
                                  </Badge>
                                ))}
                              {team.permissions.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{team.permissions.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <PlusCircle className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Common financial tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Create Budget
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Activity className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                {user.accountType === "business" && user.role === "owner" && (
                  <Button className="w-full justify-start" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Teams
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your latest financial activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    No recent activity to display
                  </p>
                  <p className="text-xs text-gray-500">
                    Start by adding your first expense or creating a budget
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  System Status
                </CardTitle>
                <CardDescription>Platform information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">API Status</span>
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Online
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last Sync</span>
                  <span className="text-sm text-gray-900">Just now</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Version</span>
                  <Badge variant="outline" className="text-xs">
                    v1.0.0
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
