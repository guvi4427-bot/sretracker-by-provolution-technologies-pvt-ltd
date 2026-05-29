---
Task ID: 1
Agent: main
Task: Fix multiple issues - SEO crawlability, blog page, share dialog, rich card actions, bookmark/report

Work Log:
- Added LiveUpdateBookmark model to Prisma schema with unique constraint and index
- Created `/api/live-updates/[updateId]/bookmark` API route (POST/DELETE)
- Updated `/api/feed/live-updates` to include bookmark counts and isBookmarked for all entity types
- Fixed share dialog: type-aware URLs (post→/feed, learning→/shared-topic, content→/discover#content, fitness→/discover#fitness), added error boundary, fixed link overflow
- Added bookmark + report buttons to ContentLiveUpdateCard, FitnessLiveUpdateCard, LearningLiveUpdateCard in feed page
- Added bookmark + report buttons to DiscoverContentCard, DiscoverFitnessCard, DiscoverLearningCard in discover page
- Added report dialog to discover page
- Updated robots.ts with 10+ new bot user agents (Googlebot-News, Googlebot-Video, AdsBot-Google, Bytespider, Applebot, YandexBot, Discordbot, Slackbot, LinkedInBot, SemrushBot)
- Updated sitemap.xml with 7 new pages (/blog, /leaderboard, /ai-hub, /fitness, /learn, /content, /landing)
- Created /blog page with SEO metadata, ad banners, category filtering, search
- Added Blog link to footer in app-shell, guest-shell, and landing page
- Built project successfully (next build passes)
- Pushed to git (main branch, commit 3d88d76 + 0ebd675 trigger commit)
- Vercel API rate-limited (100/day limit reached), deployments will trigger via git auto-deploy

Stage Summary:
- All code changes committed and pushed to git
- Schema changes will auto-apply via `npx prisma db push` in Vercel build command
- Deployments pending Vercel rate limit reset (~24 hours)
- Build compiles cleanly with all new features
