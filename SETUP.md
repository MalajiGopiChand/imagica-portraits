# Imagica Portraits

Static, dependency-free website with Home, About, Gallery, Events, Contact and a private admin interface. The header uses a custom charcoal-and-gold SVG logo for clear lettering at every screen size. The original supplied logo is retained as an asset. Photography is illustrative until studio work is uploaded. No invented reviews, achievements, contact numbers or team members are published.

## Preview

Run `node preview.mjs` from this directory and open http://localhost:4173. Deploy the entire `dist` directory to any static host. Each page has an actual directory/index.html; no SPA rewrite is needed.

## Connect persistent admin storage

1. Create a Supabase project in your own account. Run `supabase.sql` in its SQL editor.
2. Create the owner account in Supabase Authentication > Users (do not enable public signup). Insert its UUID into `admin_users` using the final commented statement in the SQL file. Disable new-user registrations in Authentication settings.
3. Edit `dist/config.js`: set `supabaseUrl` to your project URL and `supabaseAnonKey` to the project's public anon key. These are public client connection values. NEVER use a service-role key, secret key, database password or admin password in this file.
4. Redeploy. Visit `/admin/`, sign in with the owner account, and fill Site Settings with the real WhatsApp number (country code + digits), email, Instagram, and studio location.
5. Upload images, choose the required occasion category, enter title and alt text, and choose publication/featured status. Originals are stored in Supabase Storage, metadata in Postgres. Published items are shared across all visitors and devices. Draft metadata is restricted by row-level security. The photo bucket is public: unpublished image URLs are still accessible to anyone holding the URL. Do not upload confidential client material.

The unconnected site is deliberately read-only. It does not pretend that local browser storage publishes photos. The admin UI explains setup instead of exposing a fake or insecure password. Auth tokens are kept in session storage and expire according to Supabase settings; sign in again when expired. No public signup page is included.

## Administration

Gallery manager supports editing, replacement, publication and featuring, plus deletion. Event manager supports date/time (India), location, description, cover and multiple supporting images. Event status is derived from its timestamp. Settings include an optional consented testimonial; it is hidden until entered. Inquiry forms open the owner's configured WhatsApp message for the visitor to send. Until a real number is configured, the form explains that booking is unavailable.

Deletion removes gallery metadata and the current storage file. Replaced images and removed event files may remain in storage; review them in the Supabase Storage dashboard. Failed metadata saves after a file upload can also leave an unused file. Back up the database and storage through your Supabase account as needed.

## SEO and assets

Set your final canonical domain in `dist/sitemap.xml` and `dist/robots.txt` if using a custom host. The current sitemap uses the assigned Sites domain. Placeholder photographs load from Unsplash and fonts from Google Fonts. Replace photos with licensed client originals and self-host fonts if required. The client-supplied logo is at `dist/assets/imagica-logo.jpg`.

## Verification

Run `node --check dist/app.js` and `node verify.mjs`. Cloud operations require a real project and owner account; they cannot be live-tested without those connection details. Verify anonymous writes are rejected and non-owner authenticated users cannot change data before launch. No cloud credentials were supplied with this brief.
