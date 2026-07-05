import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArticleForm } from "@/components/admin/ArticleForm";

export const Route = createFileRoute("/admin/edit/$id")({ component: EditArticle });

function EditArticle() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-article", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("articles").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
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
