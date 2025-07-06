import { useState, useEffect } from 'react';

// --- API Interaction Functions ---

async function apiPost(endpoint: string, body: any) {
  const response = await fetch(`/api/auth/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'API request failed');
  }

  return result;
}

export const signIn = {
  email: (credentials: any) => apiPost('signin', credentials),
};

export const signUp = {
  email: (credentials: any) => apiPost('signup', credentials),
};

export const signOut = () => apiPost('signout', {});

// --- Session Management Hook ---

export interface Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    createdAt: string;
  } | null;
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      setIsPending(true);
      const sessionData = await getSession();
      setSession(sessionData);
      setIsPending(false);
    }
    fetchSession();
  }, []);

  return { data: session, isPending };
}

// --- Server-side Session Retrieval ---

export async function getSession(): Promise<Session | null> {
  try {
    const response = await fetch('/api/auth/session');
    if (response.ok) {
      const { data } = await response.json();
      return { user: data };
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch session:', error);
    return null;
  }
}
