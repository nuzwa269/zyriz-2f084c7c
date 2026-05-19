// Extract the YouTube video ID from any common YouTube URL form.
// Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID,
// youtube.com/embed/ID, plus optional query params.
export function getYoutubeId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  // Bare 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      const v = url.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      const parts = url.pathname.split("/").filter(Boolean);
      // /shorts/ID, /embed/ID, /v/ID, /live/ID
      const idx = parts.findIndex((p) => ["shorts", "embed", "v", "live"].includes(p));
      if (idx !== -1 && parts[idx + 1] && /^[a-zA-Z0-9_-]{11}$/.test(parts[idx + 1])) {
        return parts[idx + 1];
      }
    }
  } catch {
    return null;
  }
  return null;
}

export const youtubeEmbedUrl = (id: string) => `https://www.youtube.com/embed/${id}`;
export const youtubeThumbUrl = (id: string) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
