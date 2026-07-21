# LYTRIX CONSULT — Company Website

Dark, cinematic Next.js site for LYTRIX CONSULT (web design, graphic design,
video ads, web POS systems, SaaS development). Brand colors pulled from the
logo: navy `#0A4D8C`, cyan `#16A9E8`, magenta `#E0218A`.

## Stack
- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** for styling + fluid type sizing
- **Framer Motion** for scroll-triggered reveals, parallax & counters
- **Lenis** for buttery smooth scrolling

## Run it
```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the build
```

## Add your design samples (no code needed)
Drop image files into **`public/work/`**. They appear automatically in the
**Work** section, sorted by filename. The filename becomes the title:

```
public/work/brand-kit_01.jpg   ->  "Brand Kit 01"
```

Supported: `.png .jpg .jpeg .webp .avif .gif .svg`.
Until you add images, placeholder cards are shown.

## Edit content
- **Services** → `components/Services.tsx`
- **Stats numbers** → `components/Stats.tsx`
- **Process steps** → `components/Process.tsx`
- **Contact email** → `CONTACT_EMAIL` in `components/Contact.tsx`
  (currently `elia@lytrixconsult.com` — change to your real address)
- **SEO / domain** → `app/layout.tsx` (`siteUrl`)

## Notes
- Fully mobile responsive (mobile-first, hamburger nav, fluid typography).
- Respects `prefers-reduced-motion` (disables smooth scroll & animations).
- Contact form opens the visitor's email client (mailto). To collect
  submissions server-side later, wire the form to an API route or a service
  like Formspree / Resend.

## Pharmacy POS demo (`/demo/pos`)

A self-contained, multi-branch pharmacy POS built as a client-facing feature
demo. No backend — the whole dataset is seeded in the browser and persisted to
`localStorage`, so it runs anywhere with zero setup.

**Routes**

| Route | What it shows |
| --- | --- |
| `/demo/pos` | Dashboard — KPIs, revenue chart, branch league table, alerts |
| `/demo/pos/reports` | Analytics — branch comparison, category & payment mix, dead stock, CSV export |
| `/demo/pos/sell` | POS terminal — catalogue, cart, Rx capture, payment, printable receipt |
| `/demo/pos/sales` | Sales history with filters, receipt drill-down, CSV export |
| `/demo/pos/prescriptions` | Rx records + controlled-substance register |
| `/demo/pos/inventory` | Products, per-branch stock, batches & expiry, stock adjustments |
| `/demo/pos/suppliers` | Suppliers + purchase-order builder |
| `/demo/pos/branches` | Create & manage branches, network comparison |
| `/demo/pos/transfers` | Inter-branch stock transfers with an approval workflow |
| `/demo/pos/staff` | Staff, roles & permissions |
| `/demo/pos/settings` | Business, currency, tax, receipt, reset demo |

**Branch scoping.** The branch switcher in the top bar sets a single `scope`
value. `"all"` is the **Main Branch consolidated view** — every figure in the
app aggregates across branches. Selecting one branch scopes the entire app to
it. Both paths share one set of selectors in `lib/pos/selectors.ts`.

**Code layout**
- `lib/pos/types.ts` — domain model
- `lib/pos/seed.ts` — deterministic seed (6 branches, 42 SKUs, 120 days of sales)
- `lib/pos/store.tsx` — `PosProvider` / `usePos()`, localStorage persistence
- `lib/pos/selectors.ts` — all analytics, every one scope-aware
- `components/pos/` — shell, sidebar, branch switcher, shared UI kit

Seeding runs **after mount**, never during render, so server and client HTML
can't disagree on dates. "Reset demo data" in the avatar menu restores the
seed.

Sales really decrement stock (oldest batch first) and receiving a transfer
really moves units between branches — the demo stays internally consistent as
the client clicks around.

## Deploy
Push to GitHub and import into **Vercel** — zero config. Set the custom domain
to `lytrixconsult.com` in Vercel project settings.

### Known issue: `npm run build` fails on the `D:` drive
`D:` is formatted **exFAT**, which has no symlink support, so webpack's
`readlink` call fails during a production build:

```
Error: EISDIR: illegal operation on a directory, readlink
  '...\node_modules\next\dist\pages\_app.js'
```

This is a filesystem limitation, not a code problem — it fails even with the
app routes removed. `npm run dev` works fine, and Vercel builds on Linux, so
deploys are unaffected. To produce a local production build, copy the project
to an NTFS drive (e.g. `C:`) and build there.
