import { useMemo, useState, useEffect } from "react";

export type VariationData = {
  attributes: { id: string; name: string; values: { id: string; value: string }[] }[];
  variations: {
    id: string;
    price: number;
    sale_price: number | null;
    stock: number;
    image_path: string | null;
    is_active: boolean;
    sku: string | null;
    value_ids: string[];
  }[];
};

export type SelectedVariation = VariationData["variations"][number] & { label: string };

export function VariationPicker({
  data,
  onSelect,
}: {
  data: VariationData;
  onSelect: (v: SelectedVariation | null) => void;
}) {
  const [selected, setSelected] = useState<Record<string, string>>({});

  const matched = useMemo(() => {
    const allChosen = data.attributes.every((a) => selected[a.id]);
    if (!allChosen) return null;
    const wantedIds = Object.values(selected);
    return (
      data.variations.find(
        (v) => v.is_active && wantedIds.every((id) => v.value_ids.includes(id))
      ) ?? null
    );
  }, [selected, data]);

  useEffect(() => {
    if (!matched) {
      onSelect(null);
      return;
    }
    const label = data.attributes
      .map((a) => a.values.find((v) => v.id === selected[a.id])?.value)
      .filter(Boolean)
      .join(" / ");
    onSelect({ ...matched, label });
  }, [matched]); // eslint-disable-line react-hooks/exhaustive-deps

  // For each candidate value, check if any active variation matches (combined with current selections of OTHER attributes)
  const isAvailable = (attrId: string, valueId: string) => {
    return data.variations.some((v) => {
      if (!v.is_active || v.stock <= 0) return false;
      if (!v.value_ids.includes(valueId)) return false;
      for (const a of data.attributes) {
        if (a.id === attrId) continue;
        const sel = selected[a.id];
        if (sel && !v.value_ids.includes(sel)) return false;
      }
      return true;
    });
  };

  return (
    <div className="space-y-4">
      {data.attributes.map((a) => (
        <div key={a.id}>
          <p className="text-sm text-muted-foreground mb-2">
            {a.name}: <span className="text-foreground">{a.values.find((v) => v.id === selected[a.id])?.value ?? "—"}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {a.values.map((v) => {
              const active = selected[a.id] === v.id;
              const available = isAvailable(a.id, v.id);
              return (
                <button
                  type="button"
                  key={v.id}
                  onClick={() => setSelected((s) => ({ ...s, [a.id]: v.id }))}
                  className={`rounded-full border px-4 py-1.5 text-sm transition ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : available
                      ? "border-border hover:border-primary"
                      : "border-border/40 text-muted-foreground line-through opacity-60"
                  }`}
                >
                  {v.value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
