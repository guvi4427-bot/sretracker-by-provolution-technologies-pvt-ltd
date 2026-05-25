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
