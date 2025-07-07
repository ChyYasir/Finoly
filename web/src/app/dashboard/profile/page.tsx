// app/dashboard/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/lib/users/hooks";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  User,
  Mail,
  Calendar,
  Building2,
  Shield,
  Edit,
  Save,
  X,
  Users,
  Bell,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const { profile, loading, error, updateProfile } = useUserProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/signin");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      setUpdateLoading(true);

      // Validate form data
      if (!formData.name.trim()) {
        toast.error("Name is required");
        return;
      }

      await updateProfile({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
      });

      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        phone: profile.phone || "",
      });
    }
    setIsEditing(false);
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isPending || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!session?.user || !profile) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <p className="text-sm text-gray-600">
              Manage your personal information and preferences
            </p>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={updateLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateLoading}>
                <Save className="h-4 w-4 mr-2" />
                {updateLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Picture and Basic Info */}
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src="" alt={profile.name} />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                  {getUserInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-xl font-semibold">{profile.name}</h2>
                  <Badge variant="outline">
                    {profile.accountType === "business"
                      ? profile.isBusinessOwner
                        ? "Business Owner"
                        : "Team Member"
                      : "Individual"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-gray-600 mb-1">
                  <Mail className="h-4 w-4" />
                  <span>{profile.email}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600 mb-1">
                  <User className="h-4 w-4" />
                  <span className="font-mono text-sm">ID: {profile.id}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {formatDate(profile.createdAt)}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Editable Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter your full name"
                  />
                ) : (
                  <div className="p-2 bg-gray-50 rounded-md">
                    {profile.name || "Not specified"}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <div className="p-2 bg-gray-50 rounded-md">
                    {profile.phone || "Not specified"}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Email Address</Label>
                <div className="p-2 bg-gray-50 rounded-md text-gray-500">
                  {profile.email} (Cannot be changed)
                </div>
              </div>

              <div className="space-y-2">
                <Label>Account Type</Label>
                <div className="p-2 bg-gray-50 rounded-md">
                  {profile.accountType === "business"
                    ? "Business Account"
                    : "Individual Account"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        {profile.accountType === "business" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Business Name</Label>
                  <div className="p-2 bg-gray-50 rounded-md">
                    {profile.businessName || "Not specified"}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <div className="p-2 bg-gray-50 rounded-md flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-500" />
                    {profile.isBusinessOwner ? "Business Owner" : "Team Member"}
                  </div>
                </div>
              </div>

              {profile.teams && profile.teams.length > 0 && (
                <div className="space-y-2">
                  <Label>Team Memberships</Label>
                  <div className="space-y-2">
                    {profile.teams.map((team) => (
                      <div
                        key={team.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">{team.name}</div>
                            <div className="text-sm text-gray-600">
                              {team.roleName}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {team.permissions.length} permissions
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-gray-600">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={profile.preferences?.notifications?.email ?? true}
                  disabled // Will be functional when preferences are implemented
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>WhatsApp Notifications</Label>
                  <p className="text-sm text-gray-600">
                    Receive notifications via WhatsApp
                  </p>
                </div>
                <Switch
                  checked={profile.preferences?.notifications?.whatsapp ?? true}
                  disabled // Will be functional when preferences are implemented
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Web Notifications</Label>
                  <p className="text-sm text-gray-600">
                    Receive notifications in the web interface
                  </p>
                </div>
                <Switch
                  checked={profile.preferences?.notifications?.web ?? true}
                  disabled // Will be functional when preferences are implemented
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Default Currency</Label>
                <div className="p-2 bg-gray-50 rounded-md">
                  {profile.preferences?.currency || "USD"}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Timezone</Label>
                <div className="p-2 bg-gray-50 rounded-md">
                  {profile.preferences?.timezone || "UTC"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
