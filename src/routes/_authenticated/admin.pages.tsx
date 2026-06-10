import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ExternalLink, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/pages")({
  component: AdminPagesList,
});

function slugify(s: string) {
  return s.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function AdminPagesList() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ["admin-site-pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_pages")
        .select("id, slug, title, is_published, show_in_footer, sort_order, updated_at")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const title = newTitle.trim();
      const slug = (newSlug.trim() || slugify(title));
      if (!title || !slug) throw new Error("Title and slug are required");
      const { data, error } = await supabase
        .from("site_pages")
        .insert({ title, slug, content: `# ${title}\n\n` })
        .select("slug")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success("Page created");
      setNewTitle(""); setNewSlug("");
      qc.invalidateQueries({ queryKey: ["admin-site-pages"] });
      qc.invalidateQueries({ queryKey: ["footer-pages"] });
      navigate({ to: "/admin/pages/$slug", params: { slug: data.slug } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: "is_published" | "show_in_footer"; value: boolean }) => {
      const patch = field === "is_published" ? { is_published: value } : { show_in_footer: value };
      const { error } = await supabase.from("site_pages").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-site-pages"] });
      qc.invalidateQueries({ queryKey: ["footer-pages"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("site_pages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Page deleted");
      qc.invalidateQueries({ queryKey: ["admin-site-pages"] });
      qc.invalidateQueries({ queryKey: ["footer-pages"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 animate-fade-in">
      <h1 className="font-serif text-3xl gold-gradient mb-6">Pages</h1>

      <div className="rounded-lg border border-border bg-card p-4 mb-6">
        <h2 className="text-sm font-medium mb-3 flex items-center gap-2"><Plus className="h-4 w-4" /> Create a new page</h2>
        <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
          <input
            value={newTitle}
            onChange={(e) => { setNewTitle(e.target.value); if (!newSlug) setNewSlug(slugify(e.target.value)); }}
            placeholder="Page title (e.g. Shipping)"
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          />
          <input
            value={newSlug}
            onChange={(e) => setNewSlug(slugify(e.target.value))}
            placeholder="url-slug"
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm font-mono"
          />
          <button
            onClick={() => createMut.mutate()}
            disabled={createMut.isPending || !newTitle.trim()}
            className="h-9 rounded-md bg-primary px-4 text-sm text-primary-foreground disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading...</div>
        ) : pages.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No pages yet.</div>
        ) : (
          <ul className="divide-y divide-border">
            {pages.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 p-3 sm:p-4">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{p.title}</div>
                  <div className="text-xs text-muted-foreground font-mono truncate">/p/{p.slug}</div>
                </div>
                <button
                  onClick={() => toggleMut.mutate({ id: p.id, field: "is_published", value: !p.is_published })}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs border ${p.is_published ? "border-emerald-500/40 text-emerald-500" : "border-border text-muted-foreground"}`}
                  title="Toggle published"
                >
                  {p.is_published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  {p.is_published ? "Published" : "Draft"}
                </button>
                <button
                  onClick={() => toggleMut.mutate({ id: p.id, field: "show_in_footer", value: !p.show_in_footer })}
                  className={`hidden sm:inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs border ${p.show_in_footer ? "border-primary/40 text-primary" : "border-border text-muted-foreground"}`}
                >
                  {p.show_in_footer ? "In footer" : "Hidden"}
                </button>
                <a
                  href={`/p/${p.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-muted-foreground hover:text-primary"
                  aria-label="View"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <Link
                  to="/admin/pages/$slug"
                  params={{ slug: p.slug }}
                  className="p-2 text-muted-foreground hover:text-primary"
                  aria-label="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => { if (confirm(`Delete "${p.title}"?`)) deleteMut.mutate(p.id); }}
                  className="p-2 text-muted-foreground hover:text-destructive"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Tip: You can use Markdown or plain HTML in page content. Published pages auto-appear in the footer if "In footer" is on.
      </p>
    </div>
  );
}
