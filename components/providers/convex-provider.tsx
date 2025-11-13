// app/providers/convex-provider.tsx
"use client";

import { ReactNode, useEffect, useState } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";

interface Props {
  children: ReactNode;
}

export const ConvexClientProvider = ({ children }: Props) => {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}>
      <AuthReadyConvexProvider>{children}</AuthReadyConvexProvider>
    </ClerkProvider>
  );
};

function AuthReadyConvexProvider({ children }: Props) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [convexClient, setConvexClient] = useState<ConvexReactClient | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    let canceled = false;

    const initClient = async () => {
      try {
        const token = await getToken({ template: "convex" });
        if (!token) throw new Error("Failed to get JWT for Convex");

        if (canceled) return;

        const client = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!, {
          auth: () => token, // pass JWT to Convex
        });
        setConvexClient(client);
      } catch (err) {
        console.error("Error initializing Convex client:", err);
      }
    };

    initClient();

    return () => {
      canceled = true;
    };
  }, [isLoaded, isSignedIn, getToken]);

  if (!isLoaded) return <div>Loading Clerk...</div>;
  if (!isSignedIn) return <div>Please sign in to access the app.</div>;
  if (!convexClient) return <div>Initializing app...</div>;

  return <ConvexProviderWithClerk useAuth={useAuth} client={convexClient}>{children}</ConvexProviderWithClerk>;
}
