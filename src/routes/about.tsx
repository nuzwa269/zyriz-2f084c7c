import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Zarrin Atelier" },
      { name: "description", content: "Our story: handcrafted Turkish gold-plated earrings for the modern woman." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <article className="mx-auto max-w-3xl px-4 sm:px-6 py-20">
        <p className="text-xs uppercase tracking-[0.3em] text-primary text-center">Our Story</p>
        <h1 className="font-serif text-5xl text-center mt-3 gold-gradient">About Zarrin Atelier</h1>
        <div className="mt-10 space-y-6 text-muted-foreground leading-relaxed">
          <p>
            Born from a love of ancient craftsmanship and modern femininity, Zarrin Atelier brings you authentic Turkish-style, gold-plated earrings — each piece a small ode to timeless beauty.
          </p>
          <p>
            Every earring in our collection is hand-selected for its quality, its glow, and the story it carries. Our pieces are designed to be worn every day and remembered every time.
          </p>
          <p>
            We believe luxury should be accessible, ethical, and personal. That's why we offer direct, friendly service through WhatsApp — no endless forms, just a real conversation about the piece you love.
          </p>
        </div>
      </article>
      <Footer />
    </div>
  );
}
