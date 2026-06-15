import { useCallback, useSyncExternalStore } from "react";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  variationId?: string | null;
  variationLabel?: string | null;
};

const KEY = "cart-v1";
const listeners = new Set<() => void>();
const EMPTY: CartItem[] = [];
let cache: CartItem[] = EMPTY;

export function itemKey(productId: string, variationId?: string | null) {
  return variationId ? `${productId}::${variationId}` : productId;
}

function load(): CartItem[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return EMPTY;
  }
}

if (typeof window !== "undefined") {
  cache = load();
}

function read(): CartItem[] {
  return cache;
}

function write(items: CartItem[]) {
  cache = items;
  localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function getServerSnapshot() {
  return EMPTY;
}

export function useCart() {
  const items = useSyncExternalStore(subscribe, read, getServerSnapshot);

  const add = useCallback((item: Omit<CartItem, "quantity">, qty = 1) => {
    const items = read();
    const k = itemKey(item.productId, item.variationId);
    const ix = items.findIndex((i) => itemKey(i.productId, i.variationId) === k);
    if (ix >= 0) items[ix].quantity += qty;
    else items.push({ ...item, quantity: qty });
    write([...items]);
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    const items = read().map((i) =>
      itemKey(i.productId, i.variationId) === key ? { ...i, quantity: Math.max(1, qty) } : i
    );
    write(items);
  }, []);

  const remove = useCallback((key: string) => {
    write(read().filter((i) => itemKey(i.productId, i.variationId) !== key));
  }, []);

  const clear = useCallback(() => write([]), []);

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return { items, add, setQty, remove, clear, total, count };
}
