import {
  Outlet, createRootRouteWithContext, HeadContent, Scripts, useRouter, useLocation,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { TrendingBar } from "@/components/site/TrendingBar";
import { AdminSidebar } from "@/components/site/AdminSidebar";
import { supabase } from "@/integrations/supabase/client";
import { reportLovableError } from "@/lib/lovable-error-reporting";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Entertainment Trends — The Pulse of Pop Culture" },
      { name: "description", content: "Celebrity news, TV, music, style, royals and sport. Breaking entertainment stories, updated all day on Entertainment Trends." },
      { property: "og:title", content: "Entertainment Trends — The Pulse of Pop Culture" },
      { property: "og:description", content: "Celebrity news, TV, music, style, royals and sport. Breaking entertainment stories, updated all day on Entertainment Trends." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Entertainment Trends" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#000000" },
      { name: "twitter:title", content: "Entertainment Trends — The Pulse of Pop Culture" },
      { name: "twitter:description", content: "Celebrity news, TV, music, style, royals and sport. Breaking entertainment stories, updated all day on Entertainment Trends." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8877d541-1325-4aa9-9324-11d58997d58f/id-preview-e25dd483--5d7e3ee2-f4bf-491f-a637-6723bb781d6f.lovable.app-1783082550814.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8877d541-1325-4aa9-9324-11d58997d58f/id-preview-e25dd483--5d7e3ee2-f4bf-491f-a637-6723bb781d6f.lovable.app-1783082550814.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700;800&family=Playfair+Display:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: ErrorBoundary,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        router.invalidate();
        if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  if (isAdminRoute) {
    return (
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <div className="flex min-h-screen">
              <AdminSidebar />
              <main className="admin-panel flex-1 bg-black p-6">
                <Outlet />
              </main>
            </div>
          </AuthProvider>
        </QueryClientProvider>
      </HelmetProvider>
    );
  }

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <TrendingBar />
            <main className="flex-1"><Outlet /></main>
            <Footer />
          </div>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 text-center">
      <div>
        <div className="display text-7xl font-black text-yellow">404</div>
        <p className="mt-2 text-muted-foreground">This page has vanished from the red carpet.</p>
        <a href="/" className="mt-4 inline-block yellow-bar px-4 py-2 font-bold uppercase tracking-widest">Back home</a>
      </div>
    </div>
  );
}

function ErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { reportLovableError(error, { boundary: "root" }); }, [error]);
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 text-center">
      <div>
        <div className="display text-3xl font-black uppercase">Something broke</div>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button onClick={reset} className="mt-4 yellow-bar px-4 py-2 font-bold uppercase tracking-widest">Try again</button>
      </div>
    </div>
  );
}
