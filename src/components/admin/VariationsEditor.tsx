import { useState } from "react";
import imageCompression from "browser-image-compression";
import { Plus, X, Trash2, Wand2, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { productImageUrl } from "@/lib/image-url";

export type AttributeDraft = {
  id?: string;
  name: string;
  values: { id?: string; value: string }[];
};

export type VariationDraft = {
  id?: string;
  // attribute_value identifiers: use existing id (uuid) or local key `local:<attrName>:<value>`
  valueKeys: string[];
  sku: string;
  price: number;
  sale_price: number | null;
  stock: number;
  image_path: string | null;
  is_active: boolean;
};

export type VariationsState = {
  attributes: AttributeDraft[];
  variations: VariationDraft[];
};

function valueKeyFor(attr: AttributeDraft, val: { id?: string; value: string }) {
  return val.id ?? `local:${attr.name}:${val.value}`;
}

function cartesian<T>(arrs: T[][]): T[][] {
  return arrs.reduce<T[][]>((acc, arr) => acc.flatMap((a) => arr.map((v) => [...a, v])), [[]]);
}

export function VariationsEditor({
  state,
  onChange,
  productIdHint,
}: {
  state: VariationsState;
  onChange: (s: VariationsState) => void;
  productIdHint?: string;
}) {
  const [uploadingKey, setUploadingKey] = useState<number | null>(null);

  const addAttribute = () => {
    onChange({ ...state, attributes: [...state.attributes, { name: "", values: [] }] });
  };
  const removeAttribute = (ix: number) => {
    const attrs = [...state.attributes];
    attrs.splice(ix, 1);
    onChange({ ...state, attributes: attrs, variations: [] });
  };
  const updateAttr = (ix: number, patch: Partial<AttributeDraft>) => {
    const attrs = state.attributes.map((a, i) => (i === ix ? { ...a, ...patch } : a));
    onChange({ ...state, attributes: attrs });
  };
  const setAttrValuesFromCsv = (ix: number, csv: string) => {
    const existing = state.attributes[ix].values;
    const tokens = csv.split(",").map((t) => t.trim()).filter(Boolean);
    const values = tokens.map((v) => existing.find((e) => e.value === v) ?? { value: v });
    updateAttr(ix, { values });
  };

  const generate = () => {
    if (state.attributes.length === 0 || state.attributes.some((a) => !a.name.trim() || a.values.length === 0)) {
      toast.error("Add at least one attribute with name and values");
      return;
    }
    const lists = state.attributes.map((a) => a.values.map((v) => valueKeyFor(a, v)));
    const combos = cartesian(lists);
    const existingByKey = new Map(state.variations.map((v) => [v.valueKeys.slice().sort().join("|"), v]));
    const next: VariationDraft[] = combos.map((combo) => {
      const k = combo.slice().sort().join("|");
      return (
        existingByKey.get(k) ?? {
          valueKeys: combo,
          sku: "",
          price: 0,
          sale_price: null,
          stock: 0,
          image_path: null,
          is_active: true,
        }
      );
    });
    onChange({ ...state, variations: next });
    toast.success(`Generated ${next.length} variations`);
  };

  const updateVar = (ix: number, patch: Partial<VariationDraft>) => {
    const vars = state.variations.map((v, i) => (i === ix ? { ...v, ...patch } : v));
    onChange({ ...state, variations: vars });
  };
  const removeVar = (ix: number) => {
    const vars = [...state.variations];
    vars.splice(ix, 1);
    onChange({ ...state, variations: vars });
  };

  const handleImage = async (ix: number, file: File | null) => {
    if (!file) return;
    setUploadingKey(ix);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1800,
        useWebWorker: true,
        fileType: "image/webp",
        initialQuality: 0.92,
      });
      const folder = productIdHint ? `products/${productIdHint}/variations` : `products/temp-${crypto.randomUUID()}/variations`;
      const path = `${folder}/${crypto.randomUUID()}.webp`;
      const { error } = await supabase.storage.from("product-images").upload(path, compressed, {
        contentType: "image/webp",
        upsert: false,
      });
      if (error) throw error;
      updateVar(ix, { image_path: path });
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploadingKey(null);
    }
  };

  // Resolve display label for a variation
  const labelFor = (v: VariationDraft) => {
    const labels: string[] = [];
    state.attributes.forEach((a) => {
      const match = a.values.find((val) => v.valueKeys.includes(valueKeyFor(a, val)));
      if (match) labels.push(`${match.value}`);
    });
    return labels.join(" / ");
  };

  return (
    <div className="space-y-6">
      {/* Attributes */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg">Attributes</h3>
          <button type="button" onClick={addAttribute} className="inline-flex items-center gap-1 text-sm rounded-md border border-border px-3 py-1.5 hover:border-primary">
            <Plus className="h-3.5 w-3.5" /> Add attribute
          </button>
        </div>
        {state.attributes.length === 0 && (
          <p className="text-sm text-muted-foreground">No attributes yet. Add one like "Size" or "Color".</p>
        )}
        {state.attributes.map((attr, ix) => (
          <div key={ix} className="rounded-md border border-border p-3 space-y-2">
            <div className="flex items-center gap-2">
              <input
                placeholder="Attribute name (e.g. Size)"
                className="flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm"
                value={attr.name}
                onChange={(e) => updateAttr(ix, { name: e.target.value })}
              />
              <button type="button" onClick={() => removeAttribute(ix)} className="rounded-md border border-border p-2 text-muted-foreground hover:border-destructive hover:text-destructive">
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              placeholder="Values (comma-separated, e.g. Small, Medium, Large)"
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
              defaultValue={attr.values.map((v) => v.value).join(", ")}
              onBlur={(e) => setAttrValuesFromCsv(ix, e.target.value)}
            />
            {attr.values.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {attr.values.map((v) => (
                  <span key={v.value} className="text-xs rounded-full bg-secondary px-2.5 py-1">{v.value}</span>
                ))}
              </div>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={generate}
          disabled={state.attributes.length === 0}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Wand2 className="h-4 w-4" /> Generate variations
        </button>
      </div>

      {/* Variations list */}
      {state.variations.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h3 className="font-serif text-lg">Variations ({state.variations.length})</h3>
          <div className="space-y-3">
            {state.variations.map((v, ix) => (
              <div key={ix} className="rounded-md border border-border p-3 grid grid-cols-1 md:grid-cols-[80px_1fr] gap-3">
                <label className="aspect-square rounded-md border-2 border-dashed border-border flex items-center justify-center cursor-pointer overflow-hidden hover:border-primary">
                  {uploadingKey === ix ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : v.image_path ? (
                    <img src={productImageUrl(v.image_path)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImage(ix, e.target.files?.[0] ?? null)} />
                </label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{labelFor(v) || "Variation"}</p>
                    <div className="flex items-center gap-3">
                      <label className="text-xs flex items-center gap-1.5">
                        <input type="checkbox" checked={v.is_active} onChange={(e) => updateVar(ix, { is_active: e.target.checked })} className="accent-primary" />
                        Active
                      </label>
                      <button type="button" onClick={() => removeVar(ix)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <input
                      placeholder="Price"
                      type="number"
                      step="0.01"
                      className="rounded-md border border-border bg-input px-2 py-1.5 text-sm"
                      value={v.price}
                      onChange={(e) => updateVar(ix, { price: Number(e.target.value) })}
                    />
                    <input
                      placeholder="Sale price"
                      type="number"
                      step="0.01"
                      className="rounded-md border border-border bg-input px-2 py-1.5 text-sm"
                      value={v.sale_price ?? ""}
                      onChange={(e) => updateVar(ix, { sale_price: e.target.value === "" ? null : Number(e.target.value) })}
                    />
                    <input
                      placeholder="Stock"
                      type="number"
                      className="rounded-md border border-border bg-input px-2 py-1.5 text-sm"
                      value={v.stock}
                      onChange={(e) => updateVar(ix, { stock: Number(e.target.value) })}
                    />
                    <input
                      placeholder="SKU"
                      className="rounded-md border border-border bg-input px-2 py-1.5 text-sm"
                      value={v.sku}
                      onChange={(e) => updateVar(ix, { sku: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============== Load/Save helpers (used by ProductForm) ============== */

export async function loadVariationsState(productId: string): Promise<VariationsState> {
  const [{ data: attrs }, { data: vars }, { data: links }] = await Promise.all([
    supabase.from("product_attributes").select("id, name, display_order, product_attribute_values(id, value, display_order)").eq("product_id", productId).order("display_order"),
    supabase.from("product_variations").select("*").eq("product_id", productId).order("display_order"),
    supabase.from("product_variation_values").select("variation_id, attribute_value_id"),
  ]);
  const attributes: AttributeDraft[] = (attrs ?? []).map((a: any) => ({
    id: a.id,
    name: a.name,
    values: (a.product_attribute_values ?? [])
      .sort((x: any, y: any) => x.display_order - y.display_order)
      .map((v: any) => ({ id: v.id, value: v.value })),
  }));
  const variations: VariationDraft[] = (vars ?? []).map((v: any) => {
    const valueKeys = (links ?? []).filter((l: any) => l.variation_id === v.id).map((l: any) => l.attribute_value_id);
    return {
      id: v.id,
      valueKeys,
      sku: v.sku ?? "",
      price: Number(v.price ?? 0),
      sale_price: v.sale_price != null ? Number(v.sale_price) : null,
      stock: v.stock ?? 0,
      image_path: v.image_path ?? null,
      is_active: v.is_active ?? true,
    };
  });
  return { attributes, variations };
}

export async function saveVariationsState(productId: string, state: VariationsState) {
  // 1) Delete all existing attributes (cascades to values & junction); variations exist on their own and must be deleted too.
  await supabase.from("product_attributes").delete().eq("product_id", productId);
  await supabase.from("product_variations").delete().eq("product_id", productId);

  // 2) Insert attributes + values; build a map of local key -> new attribute_value id
  const localKeyToId = new Map<string, string>();
  for (let aIx = 0; aIx < state.attributes.length; aIx++) {
    const a = state.attributes[aIx];
    if (!a.name.trim() || a.values.length === 0) continue;
    const { data: attrRow, error: aErr } = await supabase
      .from("product_attributes")
      .insert({ product_id: productId, name: a.name.trim(), display_order: aIx })
      .select("id")
      .single();
    if (aErr) throw aErr;
    const rows = a.values.map((v, ix) => ({ attribute_id: attrRow.id, value: v.value, display_order: ix }));
    const { data: valRows, error: vErr } = await supabase
      .from("product_attribute_values")
      .insert(rows)
      .select("id, value");
    if (vErr) throw vErr;
    a.values.forEach((v) => {
      const matched = valRows!.find((r: any) => r.value === v.value);
      if (matched) {
        const localKey = valueKeyFor(a, v);
        localKeyToId.set(localKey, matched.id);
        // Also map original db id -> itself
        if (v.id) localKeyToId.set(v.id, matched.id);
      }
    });
  }

  // 3) Insert variations + junction
  for (let vIx = 0; vIx < state.variations.length; vIx++) {
    const v = state.variations[vIx];
    const { data: vRow, error: vErr } = await supabase
      .from("product_variations")
      .insert({
        product_id: productId,
        sku: v.sku || null,
        price: v.price,
        sale_price: v.sale_price,
        stock: v.stock,
        image_path: v.image_path,
        is_active: v.is_active,
        display_order: vIx,
      })
      .select("id")
      .single();
    if (vErr) throw vErr;
    const links = v.valueKeys
      .map((k) => localKeyToId.get(k))
      .filter((id): id is string => !!id)
      .map((attribute_value_id) => ({ variation_id: vRow.id, attribute_value_id }));
    if (links.length > 0) {
      const { error: lErr } = await supabase.from("product_variation_values").insert(links);
      if (lErr) throw lErr;
    }
  }
}

// Suppress unused warning for effect import (kept for future use)
void useEffect;
