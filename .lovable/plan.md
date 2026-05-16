
# Turkish Gold-Plated Earrings — E-commerce Website Plan

## Language & Design
- **Language:** Full website in English
- **Design:** Luxury Gold & Black — black background, gold accents, serif headings (Cormorant) + clean sans body (Inter), subtle gold borders & soft glow shadows — a premium jewelry brand feel
- **Fully responsive** across mobile, tablet, desktop
- **SEO-optimized:** unique meta/title per route, JSON-LD Product schema, semantic HTML, alt text, canonical tags

---

## Tech Stack
- **Frontend:** TanStack Start + React + Tailwind + shadcn/ui
- **Backend:** Lovable Cloud (Postgres + Auth + Storage)
- **Image compression:** `browser-image-compression` library — compresses images in the admin's browser before upload (max 1600px, WebP, ~85% quality). Original visual quality preserved; no external conversion needed.
- **Checkout:** WhatsApp deep link — no payment gateway. Customer fills full details, then a button opens WhatsApp with the complete order message pre-filled.

---

## Pages (Routes)

### Public
| Route | Purpose |
|---|---|
| `/` | Home — hero, featured products, new arrivals, brand story |
| `/shop` | Full catalog with filters (color, price range, new arrivals) + sort |
| `/product/$slug` | Product detail — image gallery, description, price, Add to Cart, related products |
| `/cart` | Shopping cart (localStorage) + "Proceed to Checkout" button |
| `/checkout` | **Customer details form** (name, email, phone, full address, city, payment method choice: JazzCash / EasyPaisa / Bank Transfer) + **"Order through WhatsApp"** button |
| `/about` | About Us |
| `/contact` | Contact + WhatsApp link |

### Admin (protected `/_authenticated/admin/...`)
| Route | Purpose |
|---|---|
| `/login` | Email/password login |
| `/admin` | Dashboard — products list |
| `/admin/products/new` | Add new product |
| `/admin/products/$id` | Edit/delete product |

---

## Checkout Flow (as per uploaded reference)
1. Customer clicks **Add to Cart** on product → goes to `/cart`
2. Clicks **Proceed to Checkout** → `/checkout`
3. Fills the form:
   - Full Name
   - Email
   - Phone Number
   - Complete Address (street, city, province, postal code)
   - Optional order note
   - Payment Method selection (radio): **JazzCash / EasyPaisa / Direct Bank Transfer** — selected method's account details shown below
4. Clicks **"Order through WhatsApp"** button (green, WhatsApp icon)
5. App constructs a complete order message and opens `https://wa.me/<adminNumber>?text=<encoded>` in a new tab. Example message:
```
🛍️ New Order

👤 Name: Nuz Wa
📧 Email: nuz@example.com
📱 Phone: 03xx-xxxxxxx
📍 Address: 77, Bahria, Punjab 53420

💳 Payment: JazzCash

🛒 Items:
1. Royal Amethyst Charm Hoop Earrings × 1 — Rs 1,999

💰 Total: Rs 1,999

(Sent from website)
```
6. Cart is cleared; customer is shown a thank-you screen with the selected payment account details (JazzCash 03214858587 / EasyPaisa / Bank info) to send payment.

**No email is sent** — admin receives the full order details directly on WhatsApp.

---

## Database Schema (Lovable Cloud)

**`products`**
- `id` (uuid), `slug` (unique), `name`, `description`, `price` (numeric)
- `color`, `stock`, `is_featured` (bool), `is_new_arrival` (bool)
- `created_at`

**`product_images`**
- `id`, `product_id` (FK), `storage_path`, `display_order`

**`user_roles`** (separate table to prevent privilege-escalation)
- `id`, `user