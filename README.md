# S19 Herbal Clinic

Next.js 16 + Tailwind CSS v4 marketing site and storefront for S19 Herbal Clinic (S19 King of Cure) - Bafoussam, Cameroon.

## Stack

- **Next.js 16 (App Router, TypeScript, React 19)** - pages are server components; interactive parts (cart, checkout, forms) are client components.
- **Tailwind CSS v4** - design tokens in `app/globals.css` (forest-green system).
- **MongoDB (Mongoose 9)** - products, categories, orders, inquiries. See `lib/models/`.
- **SMTP (Nodemailer)** - order confirmations, admin notifications, and booking alerts. Configure through the `SMTP_*` env vars in `lib/email.ts`.
- **Cloudinary** - image/file upload endpoint at `/api/upload`. Products read their image URL; admin uploads can point at Cloudinary.
- **Icons** - Font Awesome 6 SVG icons via `react-icons/fa6` only (no emoji anywhere).
- **Cart** - client-side context persisted to localStorage (`lib/cart-context.tsx`).

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in MONGO_URL, SMTP_*, CLOUDINARY_*
npm run seed                        # populate products + categories (needs MongoDB)
npm run dev                         # http://localhost:3000
```

The site **works without MongoDB**: catalog pages fall back to the bundled seed content in `lib/data/products.ts` so the storefront is always viewable. Orders, tracking, and the booking form persist to MongoDB when connected.

## Pages

Client/storefront (built): home, about, programs, telehealth, shop + product detail, cart, checkout, order confirmation, track order, contact/booking, location, privacy, terms, 404.

Patient portal / staff dashboard (auth + role-based portal) is a separate phase - the domain model, requirements, and portal spec are in `S19_Patient_Portal_Requirements.md`.

## Design rules

- Forest green tints/shades + white; spare gold accent (`--color-gold-400`).
- Cards: `border border-line`, **no heavy shadows**.
- Borders are 1px thin.
- Everything scales down on mobile (buttons `sm`, tighter padding via responsive utilities).
- Strictly no emoji icons; Font Awesome SVGs only.

## Scripts

- `npm run dev` / `npm run build` / `npm start`
- `npm run lint` - ESLint
- `npm run seed` - seed MongoDB from `lib/data/products.ts`
- `npm run seed:blog` - seed blog posts from `lib/data/blog-posts.ts`