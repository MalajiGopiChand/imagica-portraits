# Imagica Portraits administrator guide

Admin link: https://imagica-portraits.vercel.app/admin/

Sign in using the administrator email and password supplied privately. No ChatGPT account is needed. There is no public registration. Credentials are not stored in this repository.

1. Choose Upload photographs and select the occasion category.
2. Enter a title and description, then choose JPG, PNG or WebP images up to 10 MB each.
3. Review the previews. Keep Publish to public gallery selected to make the photos visible to visitors. Choose Feature on homepage for selected work.
4. Gallery manager lets you change categories, descriptions and images, or unpublish photographs. Delete moves a photograph to Trash; restoring creates a draft.
5. Events manages dates, locations, covers and event photographs. Site settings manages contact details and the studio biography.
6. Use Sign out when finished. Sessions expire after eight hours.

## Hosting and security

Vercel serves public pages and redirects /admin/ to the existing studio backend. The backend uses R2 for persistent photographs, records and sessions. Keep this backend deployed. Password verification uses PBKDF2-SHA256 with a random salt. Set ADMIN_LOGIN_EMAIL, ADMIN_PASSWORD_SALT and ADMIN_PASSWORD_HASH as secret runtime values. Never commit passwords or hashes. Updating the password hash and redeploying invalidates previous sessions. Login attempts are rate limited and all writes require an authenticated secure HttpOnly session, matching Origin and custom request header. ChatGPT identity headers do not grant access.

The MSR collection uses optimized copies; original files remain unchanged. All unique photographs are imported into the editable gallery. Six optimized image assets supply page backgrounds while data loads. Wedding, portrait, couple and maternity collections can be recategorized in Gallery manager. Replaced and trashed files are retained for recovery.

Public sources: dist/. Backend sources: worker/auth.mjs and worker/backend.mjs. Run npm test, npm run build, and npm run build:sites. The Sites build embeds assets into the Worker. Runtime secrets are configured in Sites, not Vercel or browser JavaScript. The Vercel API is a read-only public gateway.
