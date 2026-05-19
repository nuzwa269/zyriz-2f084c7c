import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: AdminOrders,
});

type OrderRow = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  city: string;
  total: number;
  payment_method: string;
  status: string;
  whatsapp_opened: boolean;
  created_at: string;
  items: any;
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  contacted: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  paid: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  shipped: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  completed: "bg-green-600/20 text-green-400 border-green-600/30",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
};

function AdminOrders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, customer_name, customer_email, customer_phone, city, total, payment_method, status, whatsapp_opened, created_at, items")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OrderRow[];
    },
  });

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (!s) return true;
      return (
        o.customer_name.toLowerCase().includes(s) ||
        o.customer_email.toLowerCase().includes(s) ||
        o.customer_phone.toLowerCase().includes(s) ||
        o.city.toLowerCase().includes(s) ||
        o.id.toLowerCase().includes(s)
      );
    });
  }, [orders, search, statusFilter]);

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl gold-gradient">Orders</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {orders.length} total • {filtered.length} shown
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, phone, email…"
              className="pl-8 pr-3 py-2 text-sm rounded-md border border-border bg-input focus:border-primary outline-none w-56"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-md border border-border bg-input focus:border-primary outline-none"
          >
            <option value="all">All statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="paid">Paid</option>
            <option value="shipped">Shipped</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading orders…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
          {orders.length === 0 ? "No orders yet." : "No orders match your filter."}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Customer</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Phone</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">City</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Items</th>
                  <th className="text-right px-4 py-3">Total</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Payment</th>
                  <th className="text-left px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const itemCount = Array.isArray(o.items) ? o.items.reduce((s: number, i: any) => s + (i.quantity || 0), 0) : 0;
                  return (
                    <tr key={o.id} className="border-t border-border hover:bg-secondary/20">
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        <Link to="/admin/orders/$id" params={{ id: o.id }} className="hover:text-primary">
                          {new Date(o.created_at).toLocaleDateString()}
                          <div className="text-xs opacity-70">{new Date(o.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link to="/admin/orders/$id" params={{ id: o.id }} className="font-medium hover:text-primary">
                          {o.customer_name}
                        </Link>
                        <div className="text-xs text-muted-foreground">{o.customer_email}</div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">{o.customer_phone}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">{o.city}</td>
                      <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{itemCount}</td>
                      <td className="px-4 py-3 text-right text-primary whitespace-nowrap">Rs {Number(o.total).toLocaleString()}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs">{o.payment_method}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs px-2 py-0.5 rounded border ${STATUS_COLORS[o.status] ?? "bg-secondary text-muted-foreground border-border"}`}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
