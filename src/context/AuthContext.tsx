import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type Role = "reader" | "admin" | "super_admin";

type AuthState = {
  user: User | null;
  session: Session | null;
  roles: Role[];
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  // Temporary dev admin state
  const [isDevAdmin, setIsDevAdmin] = useState(false);

  useEffect(() => {
    // Check for dev admin in localStorage
    const devAdmin = localStorage.getItem("dev_admin");
    if (devAdmin === "true") {
      setIsDevAdmin(true);
      setRoles(["admin", "super_admin"]);
      setLoading(false);
      return;
    }

    // Register listener first
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        setTimeout(() => loadRoles(s.user.id), 0);
      } else {
        setRoles([]);
      }
    });
    // Then check existing session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) loadRoles(data.session.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function loadRoles(uid: string) {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    setRoles((data ?? []).map((r) => r.role as Role));
  }

  const value: AuthState = {
    user: isDevAdmin ? { id: "dev-admin-id", email: "admin@gmail.com" } as any : session?.user ?? null,
    session: isDevAdmin ? {} as any : session,
    roles,
    loading,
    isAdmin: isDevAdmin || roles.includes("admin") || roles.includes("super_admin"),
    isSuperAdmin: isDevAdmin || roles.includes("super_admin"),
    async signIn(email, password) {
      // Temporary dev admin login
      if (email === "admin@gmail.com" && password === "admin123") {
        localStorage.setItem("dev_admin", "true");
        setIsDevAdmin(true);
        setRoles(["admin", "super_admin"]);
        setLoading(false);
        return { error: undefined };
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message };
    },
    async signUp(email, password, displayName) {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: displayName ? { display_name: displayName } : undefined,
        },
      });
      return { error: error?.message };
    },
    async signOut() { 
      if (isDevAdmin) {
        localStorage.removeItem("dev_admin");
        setIsDevAdmin(false);
        setRoles([]);
        return;
      }
      await supabase.auth.signOut(); 
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
