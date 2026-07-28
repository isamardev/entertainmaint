import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { articleService } from "@/services/articleService";
import { ArticleForm } from "@/components/admin/ArticleForm";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:3001/api";

export const Route = createFileRoute("/admin/edit/$id")({ component: EditArticle });

function EditArticle() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const numericId = Number(id);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-article", numericId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/articles/${numericId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return await res.json();
    },
  });

  if (isLoading || !data) return <div className="meta">Loading…</div>;
  return (
    <div>
      <h2 className="display mb-4 text-xl font-black uppercase">Edit Article</h2>
      <ArticleForm initial={data as any} onSaved={() => navigate({ to: "/admin" })} />
    </div>
  );
}
