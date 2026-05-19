# Orders / Checkout Submissions کا نظام

## مقصد
جونہی یوزر `Checkout` فارم سبمٹ کرے، اس کا مکمل ڈیٹا (کسٹمر تفصیلات + کارٹ آئٹمز + پیمنٹ میتھڈ + ٹوٹل) ڈیٹا بیس میں محفوظ ہو جائے — چاہے بعد میں WhatsApp پر بھیجے یا نہ بھیجے۔ ایڈمن پینل میں ایک نیا "Orders" صفحہ بنایا جائے گا جہاں سے یہ ساری سبمیشنز دیکھی، سرچ کی، اور بطورِ status اپڈیٹ کی جا سکیں۔

> نوٹ: صرف "Add to Cart" کرنے پر (جب تک یوزر فارم نہیں بھرتا) کوئی identifying ڈیٹا موجود نہیں ہوتا، اس لیے فارم سبمٹ کا لمحہ ہی save trigger ہے۔ یہی وہ مرحلہ ہے جہاں یوزر اپنا نام/فون/پتہ دیتا ہے۔

---

## کام کے مراحل

### 1) ڈیٹا بیس: نئی `orders` ٹیبل
ایک نئی ٹیبل بنائی جائے گی جس میں ہر فارم سبمیشن ایک row کے طور پر محفوظ ہو گی:

- کسٹمر: name, email, phone, address, city, postal_code, note
- آرڈر: items (JSON — productId, name, price, quantity, image, slug)، subtotal، total
- payment_method (JazzCash / EasyPaisa / Bank Transfer)
- status (default: "new") — ایڈمن بعد میں بدل سکے گا
- whatsapp_opened (boolean) — کیا یوزر نے WhatsApp بٹن کلک کیا تھا
- created_at

RLS:
- Insert: anonymous یوزرز بھی کر سکیں گے (تاکہ بغیر لاگ ان فارم سبمٹ ہو سکے)
- Select / Update / Delete: صرف admin

### 2) Checkout صفحہ (`src/routes/checkout.tsx`)
`onSubmit` کے اندر ترتیب یوں ہو گی:
1. پہلے `orders` میں row insert کرو۔
2. کامیاب insert پر ہی WhatsApp ونڈو کھولو اور کارٹ clear کرو۔
3. اگر DB insert ناکام ہو، یوزر کو error toast دکھا کر دوبارہ try کرنے دو (WhatsApp فلو رکا رہے)۔

موجودہ UI، WhatsApp میسج فارمیٹ، payment تفصیلات، اور success صفحہ — کچھ بھی نہیں بدلا جائے گا۔

### 3) ایڈمن پینل: نیا `Orders` صفحہ
- نیا route: `src/routes/_authenticated/admin.orders.tsx` (list) + `admin.orders.$id.tsx` (detail)
- List: تازہ ترین پہلے، ہر row میں — تاریخ، نام، فون، شہر، ٹوٹل، payment method، status badge
- Detail: مکمل کسٹمر معلومات، آئٹمز کی فہرست (image + name + qty + price)، note، WhatsApp re-send بٹن (وہی موجودہ میسج بنا کر)
- Status بدلنے کا dropdown: `new`, `contacted`, `paid`, `shipped`, `completed`, `cancelled` (default `new`)
- Admin sidebar میں نیا "Orders" لنک شامل (`src/routes/_authenticated.tsx`)

### 4) چھوٹی تفصیلات
- موجودہ کوئی فیچر، product، image، یا فلو نہیں بدلے گا۔
- صرف 3 فائلز edit (checkout, _authenticated sidebar) اور 2 نئی فائلز (admin.orders.tsx, admin.orders.$id.tsx) + 1 migration۔

---

## ٹیکنیکل تفصیل (مختصر)

- `orders` table پر RLS: `INSERT TO anon, authenticated WITH CHECK (true)` (کوئی sensitive read نہیں)، باقی operations صرف `private.has_role(auth.uid(), 'admin')`۔
- Insert براہِ راست browser `supabase` client سے ہو گا (anonymous-friendly، نیا server function درکار نہیں)۔
- Items کو `jsonb` کالم میں store کیا جائے گا تاکہ پراڈکٹ بعد میں ڈیلیٹ ہو جائے تب بھی آرڈر کا ریکارڈ مکمل رہے۔

---

اگر یہ پلان درست ہے تو **Implement plan** دبائیں — میں migration پہلے بھیجو