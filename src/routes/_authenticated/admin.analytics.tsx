import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShoppingCart, DollarSign, Users, TrendingUp, Package, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: AdminAnalytics,
});

type OrderRow = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  city: string;
  total: number;
  subtotal: number;
  payment_method: string;
  status: string;
  whatsapp_opened: boolean;
  created_at: string;
  items: any;
};

function AdminAnalytics() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-analytics-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OrderRow[];
    },
  });

  const { data: productsCount = 0 } = useQuery({
    queryKey: ["admin-analytics-products-count"],
    queryFn: async () => {
      const { count } = await supabase.from("products").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7 = new Date(today); last7.setDate(last7.getDate() - 6);
    const last30 = new Date(today); last30.setDate(last30.getDate() - 29);

    const ordersToday = orders.filter((o) => new Date(o.created_at) >= today);
    const orders7 = orders.filter((o) => new Date(o.created_at) >= last7);
    const orders30 = orders.filter((o) => new Date(o.created_at) >= last30);

    const revenue = orders.reduce((s, o) => s + Number(o.total || 0), 0);
    const revenue30 = orders30.reduce((s, o) => s + Number(o.total || 0), 0);
    const completed = orders.filter((o) => o.status === "completed" || o.status === "paid" || o.status === "shipped");
    const completedRevenue = completed.reduce((s, o) => s + Number(o.total || 0), 0);

    const uniqueCustomers = new Set(orders.map((o) => (o.customer_phone || o.customer_email || "").trim().toLowerCase()).filter(Boolean)).size;

    const byStatus: Record<string, number> = {};
    orders.forEach((o) => { byStatus[o.status] = (byStatus[o.status] || 0) + 1; });

    const byCity: Record<string, number> = {};
    orders.forEach((o) => {
      const c = (o.city || "").trim();
      if (c) byCity[c] = (byCity[c] || 0) + 1;
    });
    const topCities = Object.entries(byCity).sort((a, b) => b[1] - a[1]).slice(0, 6);

    const byPayment: Record<string, number> = {};
    orders.forEach((o) => { byPayment[o.payment_method] = (byPayment[o.payment_method] || 0) + 1; });

    const productCounts: Record<string, { name: string; qty: number; revenue: number; slug?: string }> = {};
    orders.forEach((o) => {
      const items = Array.isArray(o.items) ? o.items : [];
      items.forEach((it: any) => {
        const key = it?.productId || it?.slug || it?.name || "unknown";
        const name = it?.name || "Unknown";
        const qty = Number(it?.quantity || 1);
        const price = Number(it?.price || 0);
        if (!productCounts[key]) productCounts[key] = { name, qty: 0, revenue: 0, slug: it?.slug };
        productCounts[key].qty += qty;
        productCounts[key].revenue += qty * price;
      });
    });
    const topProducts = Object.values(productCounts).sort((a, b) => b.qty - a.qty).slice(0, 8);

    // last 14 days chart
    const days: { date: string; label: string; count: number; revenue: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const dayOrders = orders.filter((o) => {
        const t = new Date(o.created_at);
        return t >= d && t < next;
      });
      days.push({
        date: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        count: dayOrders.length,
        revenue: dayOrders.reduce((s, o) => s + Number(o.total || 0), 0),
      });
    }
    const maxDay = Math.max(1, ...days.map((d) => d.count));

    const whatsappRate = orders.length ? Math.round((orders.filter((o) => o.whatsapp_opened).length / orders.length) * 100) : 0;
    const avgOrder = orders.length ? revenue / orders.length : 0;

    return {
      total: orders.length,
      todayCount: ordersToday.length,
      count7: orders7.length,
      count30: orders30.length,
      revenue, revenue30, completedRevenue,
      uniqueCustomers,
      byStatus, topCities, byPayment, topProducts,
      days, maxDay, whatsappRate, avgOrder,
    };
  }, [orders]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const fmt = (n: number) => `Rs. ${Math.round(n).toLocaleString()}`;

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-4 py-6 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl">User Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of orders, customers and products.</p>
        </div>
        <Link to="/admin/orders" className="text-sm text-primary hover:underline">View all orders →</Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Kpi icon={<ShoppingCart className="h-4 w-4" />} label="Total orders" value={stats.total.toString()} hint={`${stats.todayCount} today`} />
        <Kpi icon={<TrendingUp className="h-4 w-4" />} label="Last 30 days" value={stats.count30.toString()} hint={`${stats.count7} in 7 days`} />
        <Kpi icon={<DollarSign className="h-4 w-4" />} label="Total revenue" value={fmt(stats.revenue)} hint={`Avg ${fmt(stats.avgOrder)}`} />
        <Kpi icon={<Users className="h-4 w-4" />} label="Unique customers" value={stats.uniqueCustomers.toString()} hint={`${productsCount} products`} />
      </div>

      {/* Trend chart */}
      <div className="mt-6 rounded-lg border border-border bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg">Orders — last 14 days</h2>
          <span className="text-xs text-muted-foreground">{fmt(stats.revenue30)} in 30 days</span>
        </div>
        <div className="flex items-end gap-1.5 sm:gap-2 h-40">
          {stats.days.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition">{d.count}</div>
              <div
                className="w-full bg-primary/70 hover:bg-primary rounded-t transition-all min-h-[2px]"
                style={{ height: `${(d.count / stats.maxDay) * 100}%` }}
                title={`${d.label}: ${d.count} orders, ${fmt(d.revenue)}`}
              />
              <div className="text-[9px] sm:text-[10px] text-muted-foreground truncate w-full text-center">{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Status breakdown */}
        <Panel title="Orders by status" icon={<Package className="h-4 w-4" />}>
          {Object.keys(stats.byStatus).length === 0 ? (
            <Empty />
          ) : (
            <div className="space-y-2">
              {Object.entries(stats.byStatus).sort((a, b) => b[1] - a[1]).map(([s, n]) => {
                const pct = Math.round((n / stats.total) * 100);
                return (
                  <div key={s}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize">{s}</span>
                      <span className="text-muted-foreground">{n} • {pct}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        {/* Payment methods */}
        <Panel title="Payment methods" icon={<DollarSign className="h-4 w-4" />}>
          {Object.keys(stats.byPayment).length === 0 ? (
            <Empty />
          ) : (
            <div className="space-y-2">
              {Object.entries(stats.byPayment).sort((a, b) => b[1] - a[1]).map(([p, n]) => {
                const pct = Math.round((n / stats.total) * 100);
                return (
                  <div key={p}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize">{p}</span>
                      <span className="text-muted-foreground">{n} • {pct}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded overflow-hidden">
                      <div className="h-full bg-primary/70" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        {/* Top products */}
        <Panel title="Top products" icon={<TrendingUp className="h-4 w-4" />}>
          {stats.topProducts.length === 0 ? <Empty /> : (
            <div className="divide-y divide-border/40">
              {stats.topProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-2 text-sm">
                  <span className="truncate pr-2">{p.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{p.qty} sold • {fmt(p.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Top cities */}
        <Panel title="Top cities" icon={<Users className="h-4 w-4" />}>
          {stats.topCities.length === 0 ? <Empty /> : (
            <div className="divide-y divide-border/40">
              {stats.topCities.map(([city, n]) => (
                <div key={city} className="flex items-center justify-between py-2 text-sm">
                  <span className="truncate pr-2">{city}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{n} orders</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card p-4 sm:p-5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm">
          <MessageCircle className="h-4 w-4 text-primary" />
          <span>WhatsApp opened rate</span>
        </div>
        <span className="text-sm font-medium">{stats.whatsappRate}%</span>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}<span>{label}</span>
      </div>
      <div className="mt-2 font-serif text-xl sm:text-2xl truncate">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        {icon}<h2 className="font-serif text-lg">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="text-xs text-muted-foreground">No data yet.</p>;
}
