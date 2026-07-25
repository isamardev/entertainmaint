import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { categoryService } from "@/services/articleService";
import { useAuth } from "@/context/AuthContext";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DeleteModal } from "@/components/site/DeleteModal";

export const Route = createFileRoute("/admin/categories")({ component: CategoriesAdmin });

function CategoriesAdmin() {
  const { isSuperAdmin } = useAuth();
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["categories"], queryFn: categoryService.list });
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: number;
    name: string;
  }>({ isOpen: false, id: 0, name: "" });

  if (!isSuperAdmin) return <div className="text-sm text-gray-600">Super Admin only.</div>;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      const payload = { name, slug: slug || name.toLowerCase().replace(/\s+/g, "-") };
      if (editingId != null) {
        await categoryService.update(editingId, payload);
        toast.success("Category updated successfully!");
      } else {
        await categoryService.create(payload);
        toast.success("Category added successfully!");
      }
      setName("");
      setSlug("");
      setEditingId(null);
      qc.invalidateQueries({ queryKey: ["categories"] });
    } catch (e: any) {
      setErr(e.message);
      toast.error(editingId != null ? "Failed to update category." : "Failed to add category.");
    }
  }

  async function handleDelete() {
    try {
      await categoryService.remove(deleteModal.id);
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
      toast.success("Category deleted successfully!");
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete category.");
    } finally {
      setDeleteModal({ isOpen: false, id: 0, name: "" });
    }
  }

  return (
    <div className="grid h-full min-h-0 gap-8 lg:grid-cols-2">
      <div className="flex min-h-0 flex-col">
        <h2 className="display mb-4 shrink-0 text-xl font-black uppercase">Categories</h2>
        <div className="min-h-0 flex-1 overflow-auto border border-gray-200">
          {data.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3 border-b border-gray-200 p-3 last:border-0"
            >
              <div className="min-w-0">
                <div className="truncate font-semibold">{c.name}</div>
                <div className="truncate text-xs text-black">{c.slug}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(c.id);
                    setName(c.name);
                    setSlug(c.slug);
                    setErr(null);
                  }}
                  className="p-1 text-black hover:text-gray-700"
                  aria-label="Edit category"
                >
                  <Pencil size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteModal({ isOpen: true, id: c.id, name: c.name })}
                  className="p-1 text-red-600 hover:text-red-800"
                  aria-label="Delete category"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <form onSubmit={save} className="space-y-3 border border-gray-200 bg-gray-50 p-4">
        <div className="text-xs font-black uppercase tracking-widest text-black">
          {editingId != null ? "Update Category" : "Add Category"}
        </div>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-full border border-gray-300 bg-white px-3 py-2 outline-none focus:border-black"
        />
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="slug (optional)"
          className="w-full border border-gray-300 bg-white px-3 py-2 outline-none focus:border-black"
        />
        {err && <div className="text-xs text-red-600">{err}</div>}
        <div className="grid grid-cols-2 gap-2">
          <button className="py-2 font-black uppercase tracking-widest bg-black text-white hover:bg-gray-800">
            {editingId != null ? "Update" : "Add"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setName("");
              setSlug("");
              setErr(null);
            }}
            className="py-2 font-black uppercase tracking-widest border border-gray-300 text-black hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </form>
      <DeleteModal
        isOpen={deleteModal.isOpen}
        title="Delete Category"
        message={`Delete "${deleteModal.name}" category? If this category has articles, those articles will be deleted first.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ isOpen: false, id: 0, name: "" })}
      />
    </div>
  );
}
