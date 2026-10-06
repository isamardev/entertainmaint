import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { articleService } from "@/services/articleService";
import { fullDate } from "@/lib/format";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { z } from "zod";
import { DeleteModal } from "@/components/site/DeleteModal";

const adminArticlesSearchSchema = z.object({
  status: z.enum(["all", "draft", "published", "archived"]).optional().default("all"),
});

export const Route = createFileRoute("/admin/")({
  validateSearch: (s) => adminArticlesSearchSchema.parse(s),
  component: AdminArticles,
});

type StatusFilter = "all" | "draft" | "published" | "archived";

function AdminArticles() {
  const qc = useQueryClient();
  const { status: statusFilter } = Route.useSearch();
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["admin-articles"],
    queryFn: articleService.listAll,
  });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: number;
    title: string;
  }>({ isOpen: false, id: 0, title: "" });

  async function handleDelete() {
    try {
      await articleService.remove(deleteModal.id);
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
      toast.success("Article deleted successfully!");
    } catch (error) {
      console.error("Error deleting article:", error);
      toast.error(`Failed to delete article: ${(error as any).message || "Unknown error"}`);
    } finally {
      setDeleteModal({ isOpen: false, id: 0, title: "" });
    }
  }

  const filteredArticles =
    statusFilter === "all" ? data : data.filter((a) => a.status === statusFilter);

  const titleByStatus: Record<StatusFilter, string> = {
    all: "All Articles",
    published: "Published Articles",
    draft: "Draft Articles",
    archived: "Archived Articles",
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-4 shrink-0">
        <h2 className="display text-xl font-black uppercase">{titleByStatus[statusFilter]}</h2>
      </div>

      {isLoading ? (
        <div className="text-sm text-black">Loading articles…</div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-800">
                Unable to load articles
              </h3>
              <p className="mt-1 text-sm text-red-700">
                {(() => {
                  const raw = (error as any)?.message as string | undefined;
                  if (!raw) return "Please refresh the page and try again.";
                  if (raw.includes("<") || raw.includes("DOCTYPE") || raw.startsWith("Unexpected token")) {
                    return "Something went wrong. Please try again later.";
                  }
                  if (raw.length > 220) return raw.slice(0, 220) + "…";
                  return raw;
                })()}
              </p>
            </div>
            <button
              type="button"
              onClick={() => qc.invalidateQueries({ queryKey: ["admin-articles"] })}
              className="shrink-0 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-red-700 hover:bg-red-100"
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto border border-gray-200">
          <div className="min-w-[840px]">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="p-3 text-xs font-black uppercase tracking-widest text-black">
                    Title
                  </th>
                  <th className="p-3 text-xs font-black uppercase tracking-widest text-black">
                    Category
                  </th>
                  <th className="p-3 text-xs font-black uppercase tracking-widest text-black">
                    Status
                  </th>
                  <th className="p-3 text-xs font-black uppercase tracking-widest text-black">
                    Updated
                  </th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredArticles.map((a) => (
                  <tr key={a.id} className="border-t border-gray-200">
                    <td className="p-3 font-semibold">{a.title}</td>
                    <td className="p-3 text-black">{a.category?.name ?? "—"}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 text-[0.65rem] font-black uppercase tracking-widest ${
                          a.status === "published"
                            ? "bg-black text-white"
                            : "border border-gray-300 text-black"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-black">{fullDate(a.updated_at)}</td>
                    <td className="p-3 text-right flex items-center justify-end gap-2">
                      <Link
                        to="/admin/edit/$id"
                        params={{ id: String(a.id) }}
                        className="p-1 text-black hover:text-gray-700"
                      >
                        <Pencil size={18} />
                      </Link>
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, id: a.id, title: a.title })}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredArticles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-black">
                      No {statusFilter} articles yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DeleteModal
        isOpen={deleteModal.isOpen}
        title="Delete Article"
        message={`Are you sure you want to delete "${deleteModal.title}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ isOpen: false, id: 0, title: "" })}
      />
    </div>
  );
}
