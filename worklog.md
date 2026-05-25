---
Task ID: 1
Agent: Main
Task: Add live content/fitness updates visible to other users in Feed tab with hashtag grouping

Work Log:
- Created new API endpoint `/api/feed/live-updates/route.ts` that fetches other users' content entries, workout logs, and weight logs (respecting privacy settings `isPublic`, `shareContentStatus`, `shareFitnessProgress`)
- Used `fitnessProfile` lookup to determine goal (gain/maintain) for hashtag assignment (#gains vs #shredding)
- Modified feed page (`src/app/(main)/feed/page.tsx`):
  - Added state for `liveContentUpdates`, `liveFitnessUpdates`, `liveWeightUpdates`
  - Added `fetchLiveUpdates()` function calling the new API
  - Created `ContentLiveUpdateCard` component showing pipeline progress (same visual as Live tab screenshot)
  - Created `FitnessLiveUpdateCard` component showing workout/weight details with gains/shredding badges
  - Built `mergedFeedItems` useMemo that combines regular posts + live updates, sorted by time, grouped by hashtags
  - Force-grouped special hashtags: #content #progress (purple), #fitness #gains (green), #fitness #shredding (orange)
  - Live tab KEPT UNTOUCHED as requested
- Updated discover API (`src/app/api/discover/route.ts`) with `liveupdates` type search
- Updated discover page (`src/app/(main)/discover/page.tsx`):
  - Added "Live" tab with Activity icon (green active state)
  - Added `DiscoverContentCard` and `DiscoverFitnessCard` components
  - Auto-switches to live tab when hashtag URLs like #content, #fitness, #gains, #shredding are clicked
- Fixed TypeScript errors (goal field is on FitnessProfile, not Profile model)
- Built successfully and deployed to Vercel production

Stage Summary:
- New file: `src/app/api/feed/live-updates/route.ts`
- Modified: `src/app/(main)/feed/page.tsx` (added live update cards + hashtag grouping in Feed tab)
- Modified: `src/app/(main)/discover/page.tsx` (added Live tab + live update card components)
- Modified: `src/app/api/discover/route.ts` (added liveupdates search type)
- All changes are isolated — Live tab unchanged, no other working code affected
- Deployed to: https://workspace-extract.vercel.app / https://sretracker.vercel.app

---
Task ID: 2
Agent: Main
Task: Enhance live content/fitness update cards to be like "live topic sharing" with CTAs, sparkline trends, and real-time refresh

Work Log:
- Fixed content page `updateLiveStatus()` to dispatch `xp-updated` + `notification-updated` events when live status changes, so feed auto-refreshes
- Fixed fitness page `addWeight()` to dispatch `xp-updated` + `notification-updated` events when weight is logged
- Enhanced `/api/feed/live-updates/route.ts`:
  - Now includes the current user's OWN data (not just other users'), so they see their live status in Feed
  - Added `isOwn` flag to all response items
  - Added weight trend sparkline data (last 7 entries per user) via `trendData` field
  - Added `trendDirection` (up/down/stable/none) calculated from trend data
  - Added `currentWeight` from fitness profile
- Enhanced `/api/discover/route.ts` liveupdates section with same improvements (isOwn, trendData, trendDirection, currentWeight)
- Enhanced Feed page `ContentLiveUpdateCard`:
  - Added "View Live Status" CTA button (like Shared Topic CTA) — navigates to /content for own, /profile for others
  - Made avatar and name clickable (navigates to profile)
  - Added isOwn awareness
- Enhanced Feed page `FitnessLiveUpdateCard`:
  - Added mini weight trend sparkline visualization (bar chart using normalized heights)
  - Added trend direction arrow (up/down/stable)
  - Added "View Fitness Dashboard" CTA button (like Shared Topic CTA) — navigates to /fitness for own, /profile for others
  - Added current weight display
  - Made avatar and name clickable
  - Added isOwn awareness
- Applied identical enhancements to Discover page `DiscoverContentCard` and `DiscoverFitnessCard`
- Fixed TypeScript errors (FitnessProfile has `weight` not `currentWeight`, no `targetWeight` field)
- Build successful, deployed to production

Stage Summary:
- Modified: `src/app/(main)/content/page.tsx` (added xp-updated dispatch on live status change)
- Modified: `src/app/(main)/fitness/page.tsx` (added xp-updated dispatch on weight log)
- Modified: `src/app/api/feed/live-updates/route.ts` (own data + trend sparkline + isOwn)
- Modified: `src/app/api/discover/route.ts` (same enhancements for liveupdates)
- Modified: `src/app/(main)/feed/page.tsx` (CTA buttons + sparkline trends + clickable avatars)
- Modified: `src/app/(main)/discover/page.tsx` (same card enhancements)
- Live tab KEPT UNTOUCHED as requested
- All changes are isolated — no working code broken
- Deployed to: https://sretracker.vercel.app
