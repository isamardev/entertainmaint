import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/admin/users")({ component: UsersAdmin });

function UsersAdmin() {
  const { isSuperAdmin } = useAuth();
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Super admin can see all user_roles thanks to RLS
      const { data, error } = await supabase.from("user_roles")
        .select("user_id, role, profile:profiles(display_name, avatar_url)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isSuperAdmin,
  });

  if (!isSuperAdmin) return <div className="meta">Super Admin only.</div>;

  async function setRole(userId: string, role: "reader" | "admin" | "super_admin", add: boolean) {
    if (add) {
      await supabase.from("user_roles").insert({ user_id: userId, role } as never);
    } else {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
    }
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  }

  // group by user
  const byUser = new Map<string, { roles: string[]; profile: any }>();
  for (const r of data as any[]) {
    const cur = byUser.get(r.user_id) ?? { roles: [], profile: r.profile };
    cur.roles.push(r.role);
    byUser.set(r.user_id, cur);
  }

  return (
    <div>
      <h2 className="display mb-4 text-xl font-black uppercase">Users &amp; Roles</h2>
      <div className="border border-border">
        {[...byUser.entries()].map(([uid, u]) => (
          <div key={uid} className="flex flex-wrap items-center gap-3 border-b border-border p-3 last:border-0">
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{u.profile?.display_name ?? uid.slice(0, 8)}</div>
              <div className="meta truncate">{uid}</div>
            </div>
            {(["reader", "admin", "super_admin"] as const).map((r) => {
              const on = u.roles.includes(r);
              return (
                <button key={r} onClick={() => setRole(uid, r, !on)}
                        className={`px-2 py-1 text-[0.65rem] font-black uppercase tracking-widest ${on ? "yellow-bar" : "border border-border text-muted-foreground hover:border-yellow"}`}>
                  {r.replace("_", " ")}
                </button>
              );
            })}
          </div>
        ))}
        {byUser.size === 0 && <div className="p-8 text-center text-muted-foreground">No users yet.</div>}
      </div>
      <p className="meta mt-4">Click a role tag to toggle it for that user.</p>
    </div>
  );
}
