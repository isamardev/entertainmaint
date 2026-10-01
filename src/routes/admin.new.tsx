import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArticleForm } from "@/components/admin/ArticleForm";

export const Route = createFileRoute("/admin/new")({ component: NewArticle });

function NewArticle() {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  return (
    <div>
      <h2 className="display mb-4 text-xl font-black uppercase">New Article</h2>
      <ArticleForm
        onSaved={() => navigate({ to: "/admin" })}
        uploadingState={{ uploading, progress, setUploading, setProgress }}
      />
    </div>
  );
}
