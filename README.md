# Imagica Portraits

Responsive studio portfolio with original MSR photography, category galleries, events, contact pages, and a separate password-protected administration dashboard.

Website: https://imagica-portraits.vercel.app/
Admin: https://imagica-portraits.vercel.app/admin/

See OWNER-GUIDE.md for login, uploads and maintenance. Public pages are static HTML/CSS/JavaScript on Vercel; the existing Sites Worker and R2 provide persistent data and administrator sessions. No ChatGPT sign-in or Supabase setup is required.

Build: npm run build (Vercel), npm run build:sites (backend). Test: npm test. Never commit secrets. Public source is in dist/; public/ is generated.

Editorial design sources: dist/pages.js and dist/premium.css. Seven public routes plus the existing administrator dashboard. Original MSR imagery, responsive menus, carousel, category gallery, native-film support, and an expanded enquiry form. Actual films and real business contact details must be supplied by the studio.
