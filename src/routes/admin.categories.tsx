import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { categoryService } from "@/services/articleService";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/admin/categories")({ component: CategoriesAdmin });

function CategoriesAdmin() {
  const { isSuperAdmin } = useAuth();
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["categories"], queryFn: categoryService.list });
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [err, setErr] = useState<string | null>(null);

  if (!isSuperAdmin) return <div className="meta">Super Admin only.</div>;

  async function add(e: React.FormEvent) {
    e.preventDefault(); setErr(null);
    try {
      await categoryService.create({ name, slug: slug || name.toLowerCase().replace(/\s+/g, "-") });
      setName(""); setSlug("");
      qc.invalidateQueries({ queryKey: ["categories"] });
    } catch (e: any) { setErr(e.message); }
  }
  async function del(id: string) {
    if (!confirm("Delete category?")) return;
    await categoryService.remove(id);
    qc.invalidateQueries({ queryKey: ["categories"] });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <h2 className="display mb-4 text-xl font-black uppercase">Categories</h2>
        <div className="border border-border">
          {data.map((c) => (
            <div key={c.id} className="flex items-center justify-between border-b border-border p-3 last:border-0">
              <div><div className="font-semibold">{c.name}</div><div className="meta">{c.slug}</div></div>
              <button onClick={() => del(c.id)} className="text-xs font-bold uppercase text-destructive hover:underline">Delete</button>
            </div>
          ))}
        </div>
      </div>
      <form onSubmit={add} className="space-y-3 border border-border bg-surface p-4">
        <div className="eyebrow">Add Category</div>
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Name"
               className="w-full border border-border bg-background px-3 py-2 outline-none focus:border-yellow" />
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug (optional)"
               className="w-full border border-border bg-background px-3 py-2 outline-none focus:border-yellow" />
        {err && <div className="text-xs text-destructive">{err}</div>}
        <button className="yellow-bar w-full py-2 font-black uppercase tracking-widest">Add</button>
      </form>
    </div>
  );
}
