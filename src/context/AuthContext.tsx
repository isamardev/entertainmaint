import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { adminAuthService, clearAdminToken, clearLegacyAdminStorage } from "@/services/adminAuthService";

export type Role = "reader" | "admin" | "super_admin";

type AuthState = {
  user: User | null;
  session: Session | null;
  roles: Role[];
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  signIn: (email: string, password: string, remember?: boolean) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateEmail: (newEmail: string, currentPassword: string) => Promise<{ error?: string }>;
  updatePassword: (newPassword: string, currentPassword: string) => Promise<{ error?: string }>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDevAdmin, setIsDevAdmin] = useState(false);
  const [devAdminEmail, setDevAdminEmail] = useState("");

  useEffect(() => {
    let active = true;

    async function initAuth() {
      clearLegacyAdminStorage();

      const adminSession = await adminAuthService.me();
      if (!active) return;

      if (adminSession.ok) {
        setIsDevAdmin(true);
        setDevAdminEmail(adminSession.email);
        setRoles(["admin", "super_admin"]);
        setLoading(false);
        return;
      }

      const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
        setSession(s);
        if (s?.user) {
          setTimeout(() => loadRoles(s.user.id), 0);
        } else {
          setRoles([]);
        }
      });

      const { data } = await supabase.auth.getSession();
      if (!active) {
        sub.subscription.unsubscribe();
        return;
      }

      setSession(data.session);
      if (data.session?.user) {
        await loadRoles(data.session.user.id);
      }
      setLoading(false);

      return () => sub.subscription.unsubscribe();
    }

    const cleanupPromise = initAuth();

    return () => {
      active = false;
      cleanupPromise.then((cleanup) => cleanup?.());
    };
  }, []);

  async function loadRoles(uid: string) {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    setRoles((data ?? []).map((r) => r.role as Role));
  }

  const value: AuthState = {
    user: isDevAdmin
      ? ({ id: "dev-admin-id", email: devAdminEmail } as User)
      : (session?.user ?? null),
    session: isDevAdmin ? ({} as Session) : session,
    roles,
    loading,
    isAdmin: isDevAdmin || roles.includes("admin") || roles.includes("super_admin"),
    isSuperAdmin: isDevAdmin || roles.includes("super_admin"),
    async signIn(email, password, remember = true) {
      const result = await adminAuthService.login(email, password, remember);
      if (result.error) return { error: result.error };

      setIsDevAdmin(true);
      setDevAdminEmail(result.email ?? "");
      setRoles(["admin", "super_admin"]);
      setLoading(false);
      return {};
    },
    async signUp(email, password, displayName) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: displayName ? { display_name: displayName } : undefined,
        },
      });
      return { error: error?.message };
    },
    async signOut() {
      if (isDevAdmin) {
        clearAdminToken();
        setIsDevAdmin(false);
        setDevAdminEmail("");
        setRoles([]);
        return;
      }
      await supabase.auth.signOut();
    },
    async updateEmail(newEmail, currentPassword) {
      if (!isDevAdmin) {
        const email = session?.user?.email;
        if (!email) return { error: "Not signed in." };
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: currentPassword,
        });
        if (signInError) return { error: "Current password is incorrect." };
        const { error } = await supabase.auth.updateUser({ email: newEmail });
        return { error: error?.message };
      }

      const result = await adminAuthService.updateEmail(newEmail, currentPassword);
      if (result.error) return { error: result.error };
      if (result.email) setDevAdminEmail(result.email);
      return {};
    },
    async updatePassword(newPassword, currentPassword) {
      if (!isDevAdmin) {
        const email = session?.user?.email;
        if (!email) return { error: "Not signed in." };
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: currentPassword,
        });
        if (signInError) return { error: "Current password is incorrect." };
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        return { error: error?.message };
      }

      const result = await adminAuthService.updatePassword(newPassword, currentPassword);
      return { error: result.error };
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
