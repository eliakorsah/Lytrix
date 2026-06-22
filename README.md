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

## Deploy
Push to GitHub and import into **Vercel** — zero config. Set the custom domain
to `lytrixconsult.com` in Vercel project settings.
