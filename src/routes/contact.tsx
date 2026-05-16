import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SITE } from "@/lib/config";
import { MessageCircle, Mail } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Zyriz" },
      { name: "description", content: "Get in touch via WhatsApp or email." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-20 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">Contact</p>
        <h1 className="font-serif text-5xl mt-3 gold-gradient">Get in Touch</h1>
        <p className="mt-6 text-muted-foreground">
          We'd love to hear from you. Reach out via WhatsApp for the fastest response.
        </p>
        <div className="mt-10 grid sm:grid-cols-2 gap-4">
          <a
            href={`https://wa.me/${SITE.whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg border border-primary/50 p-6 hover:bg-primary/5"
          >
            <MessageCircle className="h-5 w-5 text-primary" />
            <span>WhatsApp Us</span>
          </a>
          <a
            href={`mailto:${SITE.email}`}
            className="flex items-center justify-center gap-2 rounded-lg border border-primary/50 p-6 hover:bg-primary/5"
          >
            <Mail className="h-5 w-5 text-primary" />
            <span>{SITE.email}</span>
          </a>
        </div>
      </div>
      <Footer />
    </div>
  );
}
