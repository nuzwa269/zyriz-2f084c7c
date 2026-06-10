import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Save, Trash2, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/pages/$slug")({
  component: AdminPageEditor,
});

function slugify(s: string) {
  return s.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function AdminPageEditor() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-site-page", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_pages")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [title, setTitle] = useState("");
  const [pageSlug, setPageSlug] = useState(slug);
  const [content, setContent] = useState("");
  const [meta, setMeta] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [showInFooter, setShowInFooter] = useState(true);
  const [sortOrder, setSortOrder] = useState<number>(0);

  useEffect(() => {
    if (!data) return;
    setTitle(data.title);
    setPageSlug(data.slug);
    setContent(data.content ?? "");
    setMeta(data.meta_description ?? "");
    setIsPublished(data.is_published);
    setShowInFooter(data.show_in_footer);
    setSortOrder(data.sort_order ?? 0);
  }, [data]);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!data) throw new Error("Not loaded");
      const newSlug = slugify(pageSlug) || data.slug;
      const { error } = await supabase
        .from("site_pages")
        .update({
          title: title.trim(),
          slug: newSlug,
          content,
          meta_description: meta.trim() || null,
          is_published: isPublished,
          show_in_footer: showInFooter,
          sort_order: sortOrder,
        })
        .eq("id", data.id);
      if (error) throw error;
      return newSlug;
    },
    onSuccess: (newSlug) => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-site-pages"] });
      qc.invalidateQueries({ queryKey: ["footer-pages"] });
      qc.invalidateQueries({ queryKey: ["site-page", slug] });
      if (newSlug !== slug) navigate({ to: "/admin/pages/$slug", params: { slug: newSlug } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async () => {
      if (!data) return;
      const { error } = await supabase.from("site_pages").delete().eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-site-pages"] });
      qc.invalidateQueries({ queryKey: ["footer-pages"] });
      navigate({ to: "/admin/pages" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">Loading...</div>;
  if (!data) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Page not found.</p>
        <Link to="/admin/pages" className="text-primary text-sm">Back to pages</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <Link to="/admin/pages" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> All pages
        </Link>
        <div className="flex gap-2">
          <a href={`/p/${data.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm hover:text-primary">
            <ExternalLink className="h-4 w-4" /> View
          </a>
          <button
            onClick={() => { if (confirm(`Delete "${data.title}"?`)) deleteMut.mutate(); }}
            className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-transparent px-3" />
        </div>
        <div className="grid sm:grid-cols-[2fr_1fr] gap-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">URL slug</label>
            <div className="mt-1 flex items-center rounded-md border border-input bg-transparent">
              <span className="px-3 text-sm text-muted-foreground select-none">/p/</span>
              <input value={pageSlug} onChange={(e) => setPageSlug(slugify(e.target.value))} className="h-10 flex-1 bg-transparent pr-3 font-mono text-sm focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Sort order</label>
            <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value) || 0)} className="mt-1 h-10 w-full rounded-md border border-input bg-transparent px-3" />
          </div>
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Meta description (SEO)</label>
          <input value={meta} onChange={(e) => setMeta(e.target.value)} maxLength={160} className="mt-1 h-10 w-full rounded-md border border-input bg-transparent px-3" />
          <p className="mt-1 text-xs text-muted-foreground">{meta.length}/160</p>
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Content (Markdown or HTML)</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            className="mt-1 w-full rounded-md border border-input bg-transparent p-3 font-mono text-sm"
            placeholder="# Heading&#10;&#10;Write your page content here..."
          />
        </div>
        <div className="flex flex-wrap gap-6 pt-2">
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
            Published
          </label>
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={showInFooter} onChange={(e) => setShowInFooter(e.target.checked)} />
            Show in footer
          </label>
        </div>
        <div className="pt-4">
          <button
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm text-primary-foreground disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {saveMut.isPending ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
