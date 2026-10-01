import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { articleService } from "@/services/articleService";
import { ArticleForm } from "@/components/admin/ArticleForm";

export const Route = createFileRoute("/admin/edit/$id")({ component: EditArticle });

function EditArticle() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const numericId = Number(id);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-article", numericId],
    queryFn: async () => {
      try {
        return await articleService.listAll().then((all) => {
          const found = all.find((a) => a.id === numericId);
          if (!found) throw new Error(`The requested article (ID ${numericId}) does not exist or has been deleted.`);
          return found;
        });
      } catch (err) {
        throw new Error(
          err instanceof Error && err.message
            ? err.message
            : "Unable to load the article. Please try again later.",
        );
      }
    },
  });

  if (error) {
    return (
      <div className="space-y-3">
        <h2 className="display text-xl font-black uppercase">Edit Article</h2>
        <div className="border border-red-200 bg-red-50 text-red-700 rounded px-3 py-2 text-sm">
          {(error as Error).message}
        </div>
        <button
          type="button"
          onClick={() => navigate({ to: "/admin" })}
          className="px-4 py-2 bg-black text-white font-bold uppercase tracking-widest"
        >
          Back to articles
        </button>
      </div>
    );
  }
  if (isLoading || !data) return <div className="meta">Loading article…</div>;
  return (
    <div>
      <h2 className="display mb-4 text-xl font-black uppercase">Edit Article</h2>
      <ArticleForm
        initial={data as any}
        onSaved={() => navigate({ to: "/admin" })}
        uploadingState={{ uploading, progress, setUploading, setProgress }}
      />
    </div>
  );
}
