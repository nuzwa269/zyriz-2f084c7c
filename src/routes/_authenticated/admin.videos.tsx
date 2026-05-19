import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff, ArrowUp, ArrowDown } from "lucide-react";
import { getYoutubeId, youtubeThumbUrl } from "@/lib/youtube";

export const Route = createFileRoute("/_authenticated/admin/videos")({
  component: AdminVideos,
});

type Row = {
  id: string;
  title: string | null;
  youtube_url: string;
  display_order: number;
  is_published: boolean;
};

function AdminVideos() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Row | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_videos")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-videos"] });
    qc.invalidateQueries({ queryKey: ["home-videos"] });
  };

  const togglePublish = async (r: Row) => {
    const { error } = await supabase.from("home_videos").update({ is_published: !r.is_published }).eq("id", r.id);
    if (error) return toast.error(error.message);
    invalidate();
  };

  const move = async (r: Row, dir: -1 | 1) => {
    const sorted = [...rows].sort((a, b) => a.display_order - b.display_order);
    const i = sorted.findIndex((x) => x.id === r.id);
    const j = i + dir;
    if (j < 0 || j >= sorted.length) return;
    const other = sorted[j];
    const { error: e1 } = await supabase.from("home_videos").update({ display_order: other.display_order }).eq("id", r.id);
    const { error: e2 } = await supabase.from("home_videos").update({ display_order: r.display_order }).eq("id", other.id);
    if (e1 || e2) return toast.error((e1 ?? e2)!.message);
    invalidate();
  };

  const remove = async (r: Row) => {
    if (!confirm(`Delete video "${r.title ?? r.youtube_url}"?`)) return;
    const { error } = await supabase.from("home_videos").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    invalidate();
  };

  return (
    <main className="mx-auto max-w-5xl px-3 sm:px-4 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl">YouTube Videos</h1>
          <p className="text-sm text-muted-foreground mt-1">Add, edit, hide, reorder or delete videos shown on the home page.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 sm:px-4 py-2 text-sm text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Add Video</span>
        </button>
      </div>

      {showForm && (
        <VideoForm
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); invalidate(); }}
        />
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No videos yet. Add a YouTube link to get started.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => {
            const ytId = getYoutubeId(r.youtube_url);
            return (
              <div key={r.id} className="flex items-center gap-2 sm:gap-3 rounded-lg border border-border bg-card p-3">
                <div className="flex flex-col">
                  <button onClick={() => move(r, -1)} className="p-1 text-muted-foreground hover:text-primary" aria-label="Move up">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => move(r, 1)} className="p-1 text-muted-foreground hover:text-primary" aria-label="Move down">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                {ytId ? (
                  <img src={youtubeThumbUrl(ytId)} alt="" className="w-24 sm:w-32 aspect-video object-cover rounded shrink-0" loading="lazy" />
                ) : (
                  <div className="w-24 sm:w-32 aspect-video rounded bg-destructive/10 text-destructive text-xs flex items-center justify-center shrink-0">Invalid</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{r.title ?? "(no title)"}</span>
                    {!r.is_published && <span className="text-[10px] uppercase rounded bg-destructive/10 text-destructive px-1.5 py-0.5">Hidden</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.youtube_url}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => togglePublish(r)} className="p-2 text-muted-foreground hover:text-primary" title={r.is_published ? "Hide" : "Show"}>
                    {r.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button onClick={() => { setEditing(r); setShowForm(true); }} className="p-2 text-muted-foreground hover:text-primary" title="Edit">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => remove(r)} className="p-2 text-muted-foreground hover:text-destructive" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

function VideoForm({ initial, onClose, onSaved }: { initial: Row | null; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [url, setUrl] = useState(initial?.youtube_url ?? "");
  const [displayOrder, setDisplayOrder] = useState(initial?.display_order ?? 100);
  const [isPublished, setIsPublished] = useState(initial?.is_published ?? true);
  const [saving, setSaving] = useState(false);

  const ytId = getYoutubeId(url);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ytId) {
      toast.error("Please enter a valid YouTube URL");
      return;
    }
    setSaving(true);
    const payload = {
      title: title.trim() || null,
      youtube_url: url.trim(),
      display_order: displayOrder,
      is_published: isPublished,
    };
    const { error } = initial
      ? await supabase.from("home_videos").update(payload).eq("id", initial.id)
      : await supabase.from("home_videos").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(initial ? "Updated" : "Added");
    onSaved();
  };

  return (
    <form onSubmit={save} className="rounded-lg border border-border bg-card p-4 sm:p-6 mb-6 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">YouTube URL</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          required
          maxLength={500}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        {url && !ytId && <p className="text-xs text-destructive mt-1">Not a valid YouTube URL.</p>}
        {ytId && (
          <div className="mt-3">
            <img src={youtubeThumbUrl(ytId)} alt="" className="w-48 aspect-video object-cover rounded" />
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Title (optional)</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Customer review — Lahore"
          maxLength={200}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Display order</label>
        <input
          type="number"
          value={displayOrder}
          onChange={(e) => setDisplayOrder(Number(e.target.value))}
          className="w-32 rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
        Published (visible on home page)
      </label>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm">Cancel</button>
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
        </button>
      </div>
    </form>
  );
}
