import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { articleService } from "@/services/articleService";
import { fullDate } from "@/lib/format";

export const Route = createFileRoute("/admin/")({ component: AdminArticles });

function AdminArticles() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["admin-articles"], queryFn: articleService.listAll });

  async function del(id: string) {
    if (!confirm("Delete this article?")) return;
    await articleService.remove(id);
    qc.invalidateQueries({ queryKey: ["admin-articles"] });
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="display text-xl font-black uppercase">All Articles</h2>
      </div>
      {isLoading ? <div className="meta">Loading…</div> : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left">
              <tr>
                <th className="p-3 meta">Title</th>
                <th className="p-3 meta">Category</th>
                <th className="p-3 meta">Status</th>
                <th className="p-3 meta">Updated</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="p-3 font-semibold">{a.title}</td>
                  <td className="p-3 text-muted-foreground">{a.category?.name ?? "—"}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 text-[0.65rem] font-black uppercase tracking-widest ${
                      a.status === "published" ? "yellow-bar" : "border border-border text-muted-foreground"
                    }`}>{a.status}</span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{fullDate(a.updated_at)}</td>
                  <td className="p-3 text-right">
                    <Link to="/admin/edit/$id" params={{ id: a.id }} className="mr-2 text-xs font-bold uppercase text-yellow hover:underline">Edit</Link>
                    <button onClick={() => del(a.id)} className="text-xs font-bold uppercase text-destructive hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No articles yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
