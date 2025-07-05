import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Finoly
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Your AI-powered financial assistant for SME teams. Streamline
              expenses, budgets, and financial workflows.
            </p>
          </div>

          <div className="space-y-4">
            <Link href="/signin">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Sign In
              </Button>
            </Link>

            <Link href="/signup">
              <Button variant="outline" className="w-full">
                Create Account
              </Button>
            </Link>
          </div>

          <div className="mt-8 text-sm text-gray-500">
            <p>Manage your team's finances through web, WhatsApp, and email.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
