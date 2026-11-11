# imagica-portraits

Responsive ivory-and-gold photography website for **Imagica Portraits** — We Bring Imagination Into Reality.

## Vercel deployment

Import this GitHub repository into Vercel. Framework preset: **Other**. Root directory: the repository root. Build command: `npm run build`. Output directory: `public`. Node.js: 22 or newer. `vercel.json` configures these defaults, serverless content routes, and the admin redirect. No npm dependencies or client secrets are required.

The public Home, About, Gallery, Events, and Contact pages run on Vercel. Their serverless read-only gateway fetches the studio’s published content from its existing working backend. Uploaded photos, event records, and contact settings persist independently of Vercel deployments.

**Important architecture:** `/admin/` on Vercel redirects to the existing secure dashboard at https://imagica-portraits-studio.turfybass4.chatgpt.site/admin/. That host provides owner ChatGPT authentication and persistent R2 storage. It must stay deployed for admin, images, and published content to work. The backend is not migrated to Vercel storage. This avoids creating an unconfigured or insecure Vercel upload dashboard.

If you require the backend and admin to run entirely on Vercel, configure a Vercel-compatible identity provider and durable storage first; this repository does not fabricate those credentials or provision a paid storage account.

## Admin login and uploads

1. Open `/admin/` on your Vercel domain. It opens the secure owner dashboard.
2. Sign in using the ChatGPT account that owns the studio site. The current authorized account is configured server-side; other users cannot edit content.
3. In Upload photographs, choose Weddings, Birthdays, Pre-Wedding, Portraits, Engagements, Events, Maternity, or Fashion & Creative.
4. Add title and description. Select JPG, PNG or WebP photos up to 10 MB each and review previews.
5. Check Publish to public gallery and upload. Photos appear in the same category on both hosted public sites.
6. Gallery manager supports editing, replacing, featuring, unpublishing and deletion to recoverable Trash. Restore returns an item as a draft.
7. Events supports India date/time, location, description, cover and extra images, including removing saved photographs. Site Settings controls WhatsApp, email, location, Instagram, photographer name, About biography and consented testimonials.

No separate website password or Supabase setup is required. The real WhatsApp number and business contact details must be entered by the owner; no fake number is supplied.

## Local checks

```sh
npm test
npm run build
node --check dist/app.js
```

`node preview.mjs` previews the static source only; Vercel rewrites/functions need Vercel deployment or Vercel’s local development environment. `npm run build:sites` builds the existing Worker backend for Sites. See OWNER-GUIDE.md for its maintenance details.

## Optional domain configuration

Vercel automatically supplies its production hostname to the build for canonical links and sitemap. For a custom domain, set `SITE_URL` to its complete HTTPS URL in Vercel and redeploy. Only a public domain belongs in this value.

## Assets and storage

Custom SVG wordmark and favicon are included. The original supplied logo is retained. Stock photographs are clearly illustrative; replace them with licensed studio photographs. Fonts load from Google Fonts and sample photos from Unsplash.

Public content routes are read-only and do not forward authentication headers or cookies. The owner backend checks authenticated identity and request origin before writes. Draft image URLs are private; published media checks publication state on delivery. Soft-deleted and replaced assets remain stored for recovery. The current record-list implementation is intended for a studio portfolio, not an unbounded archive.
