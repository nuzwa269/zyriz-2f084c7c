## Goal
"Shop by Category" feature add karna — categories: Earrings, Lockets, Rings, Bracelets, Jewellery Set, Watches, Anklet. Har product ek hi category mein hoga.

## Database (migration)
1. Naya table `categories`:
   - `id uuid PK`, `slug text unique`, `name text`, `description text`, `image_path text`, `display_order int`, `created_at`, `updated_at`
   - RLS: sab `SELECT` kar sakte hain; sirf admin manage kar sake (existing `private.has_role`).
2. `products` table mein add:
   - `category_id uuid REFERENCES categories(id) ON DELETE SET NULL` (nullable)
   - Index on `category_id`.
3. Seed 7 categories (Earrings, Lockets, Rings, Bracelets, Jewellery Set, Watches, Anklet) `display_order` ke saath. `image_path` initially null — fallback gradient tile dikhega.

## Frontend changes

### 1. Header navigation dropdown (`src/components/Header.tsx`)
- "Shop" ke saath ek "Categories" dropdown (shadcn `DropdownMenu`).
- Categories `useQuery` se fetch.
- Har item `<Link to="/category/$slug">` — mobile menu mein collapsible list.

### 2. Homepage section (`src/routes/index.tsx`)
- Best Sellers ke baad "Shop by Category" section.
- Responsive grid (2 cols mobile / 3-4 desktop), image + name overlay, gold gradient hover. Image na ho to gradient placeholder.

### 3. Dedicated category route (`src/routes/category.$slug.tsx`)
- Per-category `head()` (title/description/og) — SEO.
- Category fetch + `products where category_id = ...` (sort reuse from shop page).
- Shop page jaisa `ProductCard` grid. Invalid slug par 404.

### 4. Product form (`src/components/ProductForm.tsx`)
- "Category" `<Select>` (categories list se), `category_id` save/update mein include.

### 5. Existing queries update
- `src/routes/shop.tsx`, admin product list, product detail page: `category:categories(name, slug)` join — product card / breadcrumb par optional display.

## Skipped (user ne kaha "baad mein")
- Admin categories CRUD page (add/edit/delete + image upload). Seed categories chalengi; admin baad mein banayenge.

## Out of scope
- Many-to-many tags.
- Shop page sidebar filter.

Approve karein to migration + code changes shuru karunga.