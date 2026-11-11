# Imagica Portraits — owner dashboard

The deployed site includes hosted persistent storage and owner-only ChatGPT sign-in. Supabase is no longer required. Public visitors browse without an account.

## Sign in

Open https://imagica-portraits-studio.turfybass4.chatgpt.site/admin/ and choose **Sign in with ChatGPT**. Use the ChatGPT account that owns this Site. The server checks platform-authenticated identity against the hosted secret `ADMIN_OWNER_EMAIL`. Other accounts cannot manage content. There is no separate default password or public registration.

## Upload and manage photos

1. Open Upload photographs and choose the occasion category.
2. Enter title and description. Select JPG, PNG or WebP files up to 10 MB each. Review thumbnails.
3. Check Publish to public gallery and optionally Feature on homepage. Upload.
4. Published images are stored online and visible in their category to every visitor, across devices and refreshes. Draft media URLs require owner access.
5. Gallery manager supports editing, replacing, featuring, publication and deletion.
6. Delete moves the record to Trash. Restore returns it as an unpublished draft.

Events supports date/time in India, location, description, cover and additional photos. Status is calculated from the timestamp. Site Settings controls the real WhatsApp number, email, location, Instagram and an optional consented testimonial. WhatsApp needs the real number; no fake number is supplied.

## Maintenance

Public pages remain plain HTML/CSS/JavaScript. A small Cloudflare Worker serves assets and protected APIs. R2 stores individual JSON records and image files. The BUCKET binding preserves content across redeployment. All writes verify owner identity, origin and a custom request header. Server checks categories, text limits, image signatures, file size and image references. Public image delivery checks publication status on every request.

Soft-deleted and replaced files remain stored for recovery. No permanent-delete or backup-export UI is provided. This is intended for a studio portfolio rather than an unbounded archive. Public lists currently scan the stored portfolio records.

Run `npm test`, `node --check dist/app.js`, and `npm run build`. Public sources are in dist; backend sources are in worker/backend.mjs. build.mjs embeds public assets into dist/server/index.js. preview.mjs previews static pages only and cannot emulate hosted sign-in/storage. Configure secrets through Sites runtime settings, never public files.

supabase.sql is retained only as an optional migration reference and is not used. No Supabase data existed to migrate. Stock images remain clearly illustrative until studio photographs are published.
