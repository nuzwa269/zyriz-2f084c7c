## Variable Products (WooCommerce-style)

Add full attribute + variation system to products. Admin can define attributes (Size, Color, etc.) per product, then generate variations (combinations) with their own price, sale price, stock, SKU, and image. Customers pick each attribute via buttons/dropdown on the product page; cart and checkout track the selected variation.

### Database changes (one migration)

New tables in `public`:

- `product_attributes` — per-product attribute definitions
  - `id`, `product_id` (FK → products), `name` (e.g. "Size"), `display_order`
- `product_attribute_values` — values for each attribute
  - `id`, `attribute_id` (FK), `value` (e.g. "Large"), `display_order`
- `product_variations` — one row per combination
  - `id`, `product_id` (FK), `sku`, `price`, `sale_price`, `stock`, `image_path`, `is_active`, `display_order`
- `product_variation_values` — junction linking variation ↔ chosen attribute values
  - `variation_id` (FK), `attribute_value_id` (FK), PK both

Add to `products`:
- `product_type` text default `'simple'` (values: `simple` | `variable`)

GRANTs: `SELECT` to `anon` + `authenticated` (public reads), full CRUD to `service_role`; RLS policies allow admin-only writes via `has_role(auth.uid(),'admin')`, public read for active rows.

### Admin UI

Extend `ProductForm.tsx`:
- Add a **Product type** selector: Simple / Variable.
- When Variable:
  - **Attributes panel** — add/remove attributes (name + comma-separated values, like Woo).
  - **Generate variations** button — creates all combinations; existing ones preserved.
  - **Variations list** — each row editable: price, sale price, stock, SKU, image upload, active toggle, delete.
  - Hide top-level price/stock fields (those become per-variation).
- Save flow: upsert attributes/values, then variations + junction rows in one transaction-style sequence.

### Frontend (product page)

`src/routes/product.$slug.tsx`:
- Detect `product_type === 'variable'`, load attributes + variations.
- Render one button-group per attribute (selected state highlighted).
- Resolve selected attribute combination → matching variation.
- Show that variation's price / sale price / stock / image; disable Add-to-Cart until a complete valid combination is chosen.
- Greyed-out unavailable combinations (no matching active variation or out of stock).

### Cart & checkout

`src/lib/cart.tsx` + `checkout.tsx`:
- Cart item gains optional `variation_id` and `variation_label` (e.g. "Red / Large").
- Cart key becomes `productId + variationId` so different variations of same product are separate lines.
- Order `items` JSON stores variation id + label + variation price snapshot.
- Stock decrement on order (if already implemented) targets the variation row.

### Files to add / edit

**New**
- `supabase/migrations/<ts>_variable_products.sql`
- `src/components/admin/VariationsEditor.tsx` (attributes + variations UI block)
- `src/components/product/VariationPicker.tsx` (frontend attribute buttons)

**Edit**
- `src/components/ProductForm.tsx` — product type selector + embed VariationsEditor
- `src/routes/product.$slug.tsx` — load variations, render picker, gate add-to-cart
- `src/components/ProductCard.tsx` — show "From Rs. X" price range for variable products
- `src/lib/cart.tsx` — variation-aware cart items
- `src/routes/cart.tsx` — show variation label per line
- `src/routes/checkout.tsx` — include variation info in order items
- `src/routes/_authenticated/admin.orders.$id.tsx` — display variation label
- `src/integrations/supabase/types.ts` — regenerated after migration

### Notes / decisions

- Variations are scoped per-product (no global attribute taxonomy yet — keeps it simple; can add later).
- Existing simple products stay as `product_type='simple'` with no migration of data needed.
- Variation image is optional; falls back to first product image.
- I'll ship this in two stages within one turn: (1) migration + admin editor, (2) frontend picker + cart/checkout wiring.

Ready to build?