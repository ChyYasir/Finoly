"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  signUp,
  type IndividualSignupData,
  type BusinessSignupData,
} from "@/lib/auth/client";
import { toast } from "sonner";
import { User, Building2, Mail, Lock, Phone } from "lucide-react";

type AccountType = "individual" | "business";

export default function SignUpPage() {
  const [accountType, setAccountType] = useState<AccountType>("individual");
  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    ownerName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (accountType === "individual" && !formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (
      accountType === "business" &&
      (!formData.businessName.trim() || !formData.ownerName.trim())
    ) {
      toast.error("Business name and owner name are required");
      return;
    }

    setIsLoading(true);

    try {
      let signupData: IndividualSignupData | BusinessSignupData;

      if (accountType === "individual") {
        signupData = {
          accountType: "individual",
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          phone: formData.phone.trim() || undefined,
        };
      } else {
        signupData = {
          accountType: "business",
          businessName: formData.businessName.trim(),
          ownerName: formData.ownerName.trim(),
          email: formData.email.trim(),
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          phone: formData.phone.trim() || undefined,
        };
      }

      console.log("Sending signup data:", signupData);

      const result = await signUp.email(signupData);
      console.log("Signup result:", result);

      if (result.status === "success") {
        toast.success("Account created successfully!");
        router.push("/signin");
      } else {
        toast.error(result.message || "Failed to create account");
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Create Your Account
          </CardTitle>
          <CardDescription className="text-gray-600">
            Join Finoly to manage your finances with AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Account Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">
              Choose Account Type
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={accountType === "individual" ? "default" : "outline"}
                className="h-auto flex-col gap-2 p-4 relative"
                onClick={() => setAccountType("individual")}
              >
                <User className="h-5 w-5" />
                <span className="text-sm font-medium">Individual</span>
                <span className="text-xs text-muted-foreground">
                  Personal use
                </span>
                {accountType === "individual" && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0" />
                )}
              </Button>
              <Button
                type="button"
                variant={accountType === "business" ? "default" : "outline"}
                className="h-auto flex-col gap-2 p-4 relative"
                onClick={() => setAccountType("business")}
              >
                <Building2 className="h-5 w-5" />
                <span className="text-sm font-medium">Business</span>
                <span className="text-xs text-muted-foreground">
                  Teams & SMEs
                </span>
                {accountType === "business" && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0" />
                )}
              </Button>
            </div>
          </div>

          <Separator />

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Individual Form Fields */}
            {accountType === "individual" && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            {/* Business Form Fields */}
            {accountType === "business" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName" className="text-sm font-medium">
                    Business Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="businessName"
                      name="businessName"
                      type="text"
                      required
                      value={formData.businessName}
                      onChange={handleChange}
                      placeholder="Enter your business name"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerName" className="text-sm font-medium">
                    Owner Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="ownerName"
                      name="ownerName"
                      type="text"
                      required
                      value={formData.ownerName}
                      onChange={handleChange}
                      placeholder="Enter owner's full name"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Common Fields */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a secure password"
                  className="pl-10"
                  minLength={8}
                />
              </div>
              <p className="text-xs text-gray-500">
                Must be at least 8 characters long
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="pl-10"
                  minLength={8}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Phone Number (Optional)
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/signin"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
