import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/p/$slug")({
  component: PublicPage,
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-serif text-4xl gold-gradient">Page not found</h1>
        <p className="mt-3 text-muted-foreground">The page you're looking for doesn't exist.</p>
        <Link to="/" className="mt-6 inline-block rounded-md bg-primary px-5 py-2 text-sm text-primary-foreground">Back home</Link>
      </div>
      <Footer />
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-serif text-3xl">Something went wrong</h1>
        <p className="mt-3 text-sm text-muted-foreground">{error.message}</p>
      </div>
      <Footer />
    </div>
  ),
});

// Minimal markdown-ish renderer: headings, bold, italic, links, paragraphs, lists.
// Admin-trusted content; also allows raw HTML.
function renderContent(src: string): string {
  const escape = (s: string) => s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // If content already looks like HTML (starts with a tag), pass through.
  if (/^\s*<[a-z!]/i.test(src)) return src;

  const lines = src.split(/\r?\n/);
  const out: string[] = [];
  let inList = false;
  let paraBuf: string[] = [];

  const flushPara = () => {
    if (paraBuf.length) {
      let text = paraBuf.join(" ");
      text = escape(text);
      text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
      text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline">$1</a>');
      out.push(`<p>${text}</p>`);
      paraBuf = [];
    }
  };
  const closeList = () => { if (inList) { out.push("</ul>"); inList = false; } };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { flushPara(); closeList(); continue; }
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      flushPara(); closeList();
      const lvl = h[1].length;
      out.push(`<h${lvl}>${escape(h[2])}</h${lvl}>`);
      continue;
    }
    const li = /^[-*]\s+(.*)$/.exec(line);
    if (li) {
      flushPara();
      if (!inList) { out.push('<ul>'); inList = true; }
      let t = escape(li[1])
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline">$1</a>');
      out.push(`<li>${t}</li>`);
      continue;
    }
    closeList();
    paraBuf.push(line);
  }
  flushPara(); closeList();
  return out.join("\n");
}

function PublicPage() {
  const { slug } = Route.useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["site-page", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_pages")
        .select("title, content, meta_description, is_published")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-3xl px-4 py-20 text-sm text-muted-foreground">Loading...</div>
        <Footer />
      </div>
    );
  }

  if (error) throw error;
  if (!data || !data.is_published) throw notFound();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <article className="mx-auto max-w-3xl px-4 sm:px-6 py-16 animate-fade-in">
        <h1 className="font-serif text-4xl sm:text-5xl gold-gradient text-center">{data.title}</h1>
        {data.meta_description && (
          <p className="mt-3 text-center text-muted-foreground">{data.meta_description}</p>
        )}
        <div
          className="prose prose-invert mt-10 max-w-none text-muted-foreground leading-relaxed [&_h1]:font-serif [&_h1]:text-3xl [&_h1]:text-foreground [&_h1]:mt-8 [&_h1]:mb-4 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-foreground [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:font-serif [&_h3]:text-xl [&_h3]:text-foreground [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_li]:my-1 [&_a]:text-primary [&_strong]:text-foreground"
          dangerouslySetInnerHTML={{ __html: renderContent(data.content || "") }}
        />
      </article>
      <Footer />
    </div>
  );
}
