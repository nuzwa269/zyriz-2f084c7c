import { Link } from "@tanstack/react-router";
import { productImageUrl } from "@/lib/image-url";

type Props = {
  slug: string;
  name: string;
  price: number;
  salePrice?: number | null;
  image?: string | null;
  isNew?: boolean;
};

export function ProductCard({ slug, name, price, salePrice, image, isNew }: Props) {
  const onSale = salePrice != null && salePrice > 0 && salePrice < price;
  const discount = onSale ? Math.round(((price - (salePrice as number)) / price) * 100) : 0;

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
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {isNew && (
            <span className="rounded-full bg-primary/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
              New
            </span>
          )}
          {onSale && (
            <span className="rounded-full bg-destructive/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
              -{discount}%
            </span>
          )}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-serif text-lg text-foreground line-clamp-1">{name}</h3>
        {onSale ? (
          <p className="mt-1 flex items-baseline gap-2">
            <span className="text-primary font-medium">Rs {(salePrice as number).toLocaleString()}</span>
            <span className="text-xs text-muted-foreground line-through">Rs {price.toLocaleString()}</span>
          </p>
        ) : (
          <p className="mt-1 text-primary font-medium">Rs {price.toLocaleString()}</p>
        )}
      </div>
    </Link>
  );
}
