const URL_BASE =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  (typeof process !== "undefined" ? process.env.SUPABASE_URL : undefined) ||
  "";

export function productImageUrl(path: string | null | undefined) {
  if (!path) return "";
  return `${URL_BASE}/storage/v1/object/public/product-images/${path}`;
}
