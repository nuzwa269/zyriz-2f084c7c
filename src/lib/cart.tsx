import { useEffect, useState, useCallback, useSyncExternalStore } from "react";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

const KEY = "cart-v1";
const listeners = new Set<() => void>();

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useCart() {
  const items = useSyncExternalStore(subscribe, read, () => [] as CartItem[]);

  const add = useCallback((item: Omit<CartItem, "quantity">, qty = 1) => {
    const items = read();
    const ix = items.findIndex((i) => i.productId === item.productId);
    if (ix >= 0) items[ix].quantity += qty;
    else items.push({ ...item, quantity: qty });
    write(items);
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    const items = read().map((i) =>
      i.productId === productId ? { ...i, quantity: Math.max(1, qty) } : i
    );
    write(items);
  }, []);

  const remove = useCallback((productId: string) => {
    write(read().filter((i) => i.productId !== productId));
  }, []);

  const clear = useCallback(() => write([]), []);

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return { items, add, setQty, remove, clear, total, count };
}
