"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/dashboard/Topbar";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { toast } from "sonner";

interface DashboardLayoutProps {
  children: React.ReactNode;
  loading?: boolean;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTeam, setActiveTeam] = useState<string>("");

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/signin");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    // Set the first team as active by default
    if (session?.user?.teams && session.user.teams.length > 0) {
      setActiveTeam(session.user.teams[0].id);
    }
  }, [session]);

  // Handle team switching
  const handleTeamChange = (teamId: string) => {
    setActiveTeam(teamId);
    const team = session?.user?.teams?.find((t) => t.id === teamId);
    if (team) {
      toast.success(`Switched to ${team.name}`);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <Topbar
        user={session.user}
        activeTeam={activeTeam}
        onTeamChange={handleTeamChange}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          user={session.user}
          activeTeam={activeTeam}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <main
          className={`flex-1 transition-all duration-300 ${
            sidebarOpen ? "lg:ml-64" : "lg:ml-16"
          }`}
        >
          <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
