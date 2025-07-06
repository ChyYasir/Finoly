import { useState, useEffect } from "react";

// --- API Interaction Functions ---

async function apiPost(endpoint: string, body: any) {
  const response = await fetch(`/api/auth/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || result.error || "API request failed");
  }

  return result;
}

export const signIn = {
  email: (credentials: { email: string; password: string }) =>
    apiPost("signin", credentials),
};

export const signUp = {
  email: (credentials: IndividualSignupData | BusinessSignupData) =>
    apiPost("signup", credentials),
};

export const signOut = () => apiPost("signout", {});

// --- Types ---

export interface IndividualSignupData {
  accountType: "individual";
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
}

export interface BusinessSignupData {
  accountType: "business";
  businessName: string;
  ownerName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
}

export interface TeamMembership {
  id: string;
  name: string;
  roleId: string | null;
  roleName: string | null;
  permissions: string[];
}

export interface Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    accountType: "individual" | "business";
    businessId?: string | null;
    businessName?: string | null;
    role?: "owner" | "member" | null;
    teams?: TeamMembership[];
    createdAt: string;
  } | null;
}

// --- Session Management Hook ---

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      setIsPending(true);
      try {
        const sessionData = await getSession();
        setSession(sessionData);
      } catch (error) {
        console.error("Failed to fetch session:", error);
        setSession(null);
      } finally {
        setIsPending(false);
      }
    }
    fetchSession();
  }, []);

  return { data: session, isPending };
}

// --- Server-side Session Retrieval ---

export async function getSession(): Promise<Session | null> {
  try {
    const response = await fetch("/api/auth/session", {
      method: "GET",
      credentials: "include",
    });

    if (response.ok) {
      const result = await response.json();
      return { user: result.data };
    }

    if (response.status === 401) {
      // Session expired or invalid
      return null;
    }

    throw new Error("Failed to fetch session");
  } catch (error) {
    console.error("Failed to fetch session:", error);
    return null;
  }
}
