import { Link } from "@tanstack/react-router";
import { productImageUrl } from "@/lib/image-url";

type Props = {
  slug: string;
  name: string;
  price: number;
  image?: string | null;
  isNew?: boolean;
};

export function ProductCard({ slug, name, price, image, isNew }: Props) {
  return (
    <Link
      to="/product/$slug"
      params={{ slug }}
      className="group block overflow-hidden rounded-lg border border-border/40 bg-card transition-all hover:border-primary/60 hover:shadow-[0_8px_30px_-12px_oklch(0.78_0.13_82/0.3)]"
    >
      <div className="relative aspect-square overflow-hidden bg-secondary">
        {image ? (
          <img
            src={productImageUrl(image)}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
            No image
          </div>
        )}
        {isNew && (
          <span className="absolute left-3 top-3 rounded-full bg-primary/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
            New
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-serif text-lg text-foreground line-clamp-1">{name}</h3>
        <p className="mt-1 text-primary font-medium">Rs {price.toLocaleString()}</p>
      </div>
    </Link>
  );
}
