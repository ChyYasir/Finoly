"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/dashboard/Topbar";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TeamCards } from "@/components/dashboard/TeamCards";
import { FinolyAssistant } from "@/components/dashboard/FinolyAssistant";
import { BudgetChart } from "@/components/dashboard/BudgetChart";
import { ForecastPreview } from "@/components/dashboard/ForecastPreview";
import { SmartAlerts } from "@/components/dashboard/SmartAlerts";
import { QuickActions } from "@/components/dashboard/QuickActions";

export default function DashboardPage() {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <Topbar
        user={user}
        activeTeam={activeTeam}
        onTeamChange={setActiveTeam}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          user={user}
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
          <div className="px-4 py-6 sm:px-6 lg:px-8">
            {/* Team Summary Cards */}
            <div className="mb-8">
              <TeamCards user={user} activeTeam={activeTeam} />
            </div>

            {/* AI Assistant */}
            <div className="mb-8">
              <FinolyAssistant user={user} activeTeam={activeTeam} />
            </div>

            {/* Charts and Widgets Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Budget Chart - Takes 2 columns */}
              <div className="lg:col-span-2">
                <BudgetChart user={user} activeTeam={activeTeam} />
              </div>

              {/* Smart Alerts */}
              <div className="lg:col-span-1">
                <SmartAlerts user={user} activeTeam={activeTeam} />
              </div>
            </div>

            {/* Forecast and Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Forecast Preview */}
              <ForecastPreview user={user} activeTeam={activeTeam} />

              {/* Quick Actions */}
              <QuickActions user={user} activeTeam={activeTeam} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
