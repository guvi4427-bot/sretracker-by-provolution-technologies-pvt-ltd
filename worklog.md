---
Task ID: 1
Agent: Main Agent
Task: Implement 5 phases of SEO, crawlability, guest access, and content improvements for both pid1 and pid2

Work Log:
- PHASE 1: Created src/lib/site-config.ts for per-project branding (SITE_NAME, SITE_URL from env vars)
- PHASE 1: Updated layout.tsx with dynamic metadata using site-config (title templates, OG, Twitter, canonical URLs, JSON-LD)
- PHASE 1: Created src/app/manifest.ts for dynamic PWA manifest per project
- PHASE 1: Updated loading.tsx to use LogoSpinner instead of generic spinner
- PHASE 1: Updated logo.tsx, app-shell.tsx, constants.ts, i18n.ts to use site-config branding
- PHASE 1: Set NEXT_PUBLIC_SITE_NAME and NEXT_PUBLIC_SITE_URL env vars on both Vercel projects
- PHASE 1: Removed static public/site.webmanifest, added manifest.webmanifest headers to next.config.ts
- PHASE 1: Deployed to both pid1 (SRE Tracker) and pid2 (SRE Track)

- PHASE 2: Created src/app/robots.ts with dynamic robots.txt (blocks auth/admin/api paths for *, allows crawlers)
- PHASE 2: Created src/app/sitemap.ts with dynamic sitemap (home, feed, discover, about, contact, terms, privacy, community-guidelines)
- PHASE 2: Removed static public/robots.txt and public/sitemap.xml
- PHASE 2: Updated middleware.ts to allow /manifest.webmanifest
- PHASE 2: Deployed to both projects, verified per-domain sitemap URLs

- PHASE 3: Created src/components/guest-guard.tsx (GuestProvider, useGuest hook, LoginPrompt modal)
- PHASE 3: Created src/components/guest-shell.tsx (GuestShell with simplified nav for guests)
- PHASE 3: Updated src/middleware.ts with GUEST_ALLOWED_PATHS and GUEST_ALLOWED_API_PATHS
- PHASE 3: Updated src/app/(auth)/login/page.tsx with "Continue as Guest" button
- PHASE 3: Updated src/app/(main)/layout.tsx to detect guest mode and use GuestShell
- PHASE 3: Updated src/app/page.tsx to redirect guests to /feed
- PHASE 3: Added guest guards to feed/page.tsx (createPost, toggleLike, toggleBookmark, toggleRepost, addComment) and discover/page.tsx (followUser, joinGroup)
- PHASE 3: Hidden create-post textarea, My Posts tab, and Bookmarks tab for guests

- PHASE 4: Implemented guest session cleanup in guest-shell.tsx
- PHASE 4: Cookie max-age=86400 (24h) auto-expires in browser
- PHASE 4: Activity-based cookie extension (throttled to 5min intervals)
- PHASE 4: 60-second interval check for cookie expiration with auto-redirect to /login
- PHASE 4: localStorage cleanup on expiration

- PHASE 5: Added per-page metadata (title, description, canonical, OG) to all public pages (about, contact, terms, privacy, community-guidelines)
- PHASE 5: Created feed/layout.tsx and discover/layout.tsx with SEO metadata
- PHASE 5: Deployed to both projects

Stage Summary:
- All 5 phases completed and deployed to both pid1 (sretracker.vercel.app) and pid2 (sretrack.vercel.app)
- pid1 shows "SRE Tracker" branding, pid2 shows "SRE Track" branding via env vars
- Guest access allows browsing feed/discover/profiles but blocks all interactions
- robots.txt blocks auth/admin paths, sitemap.xml includes public pages
- All public pages have proper semantic HTML (H1/H2/H3) and per-page metadata
- Auth, routing, database schema, and existing user flows preserved unchanged
