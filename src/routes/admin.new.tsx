import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArticleForm } from "@/components/admin/ArticleForm";

export const Route = createFileRoute("/admin/new")({ component: NewArticle });

function NewArticle() {
  const navigate = useNavigate();
  return (
    <div>
      <h2 className="display mb-4 text-xl font-black uppercase">New Article</h2>
      <ArticleForm onSaved={() => navigate({ to: "/admin" })} />
    </div>
  );
}
