import { Link } from "@tanstack/react-router";
import { SITE } from "@/lib/config";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 grid gap-10 md:grid-cols-3">
        <div>
          <h3 className="font-serif text-2xl gold-gradient">{SITE.name}</h3>
          <p className="mt-3 text-sm text-muted-foreground max-w-xs">{SITE.description}</p>
        </div>
        <div>
          <h4 className="text-sm uppercase tracking-widest text-primary mb-3">Explore</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/shop" className="hover:text-primary">Shop</Link></li>
            <li><Link to="/about" className="hover:text-primary">About</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm uppercase tracking-widest text-primary mb-3">Contact</h4>
          <p className="text-sm text-muted-foreground">WhatsApp: +{SITE.whatsappNumber}</p>
          <p className="text-sm text-muted-foreground">{SITE.email}</p>
        </div>
      </div>
      <div className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {SITE.name}. All rights reserved.
      </div>
    </footer>
  );
}
