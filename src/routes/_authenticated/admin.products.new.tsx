import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ProductForm } from "@/components/ProductForm";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/products/new")({
  component: NewProduct,
});

function NewProduct() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="font-serif text-3xl mb-6">Add Product</h1>
      <ProductForm onSaved={() => navigate({ to: "/admin" })} />
    </div>
  );
}
