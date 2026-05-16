import { Link } from "@tanstack/react-router";
import { ShoppingBag, Menu, X, Sun, Moon, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/lib/cart";
import { useTheme } from "@/hooks/use-theme";
import { SITE } from "@/lib/config";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { count } = useCart();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [mobileCatsOpen, setMobileCatsOpen] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["header-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("slug, name")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const nav = [
    { to: "/", label: "Home" },
    { to: "/shop", label: "Shop" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
  ] as const;

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 gap-2">
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <span className="font-serif text-xl sm:text-2xl font-semibold gold-gradient truncate">{SITE.name}</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {nav.map((n) =>
            n.label === "Shop" ? (
              <div key={n.to} className="flex items-center gap-1">
                <Link
                  to={n.to}
                  className="text-sm tracking-wide text-muted-foreground transition hover:text-primary"
                  activeProps={{ className: "text-primary" }}
                >
                  {n.label}
                </Link>
                {categories.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="text-muted-foreground hover:text-primary transition outline-none"
                      aria-label="Browse categories"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-48">
                      {categories.map((c) => (
                        <DropdownMenuItem key={c.slug} asChild>
                          <Link to="/category/$slug" params={{ slug: c.slug }} className="cursor-pointer">
                            {c.name}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ) : (
              <Link
                key={n.to}
                to={n.to}
                className="text-sm tracking-wide text-muted-foreground transition hover:text-primary"
                activeProps={{ className: "text-primary" }}
              >
                {n.label}
              </Link>
            ),
          )}
        </nav>
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="p-2 text-foreground hover:text-primary transition"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <Link to="/cart" className="relative p-2 text-foreground hover:text-primary transition">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
          <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-border/60 bg-background">
          <div className="flex flex-col px-4 py-3">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="py-3 text-sm text-muted-foreground hover:text-primary"
              >
                {n.label}
              </Link>
            ))}
            {categories.length > 0 && (
              <div className="border-t border-border/40 mt-2 pt-2">
                <button
                  onClick={() => setMobileCatsOpen(!mobileCatsOpen)}
                  className="w-full flex items-center justify-between py-3 text-sm text-muted-foreground hover:text-primary"
                >
                  <span>Shop by Category</span>
                  <ChevronDown className={`h-4 w-4 transition ${mobileCatsOpen ? "rotate-180" : ""}`} />
                </button>
                {mobileCatsOpen && (
                  <div className="pl-3 pb-2 flex flex-col">
                    {categories.map((c) => (
                      <Link
                        key={c.slug}
                        to="/category/$slug"
                        params={{ slug: c.slug }}
                        onClick={() => setOpen(false)}
                        className="py-2 text-sm text-muted-foreground hover:text-primary"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
