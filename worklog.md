---
Task ID: 1
Agent: Main
Task: Fix missing achievements - originally 115+ now only 74

Work Log:
- Investigated achievements system - found ACHIEVEMENT_DEFS in gamification.ts has 116 achievements
- Discovered Neon PostgreSQL database only had 74 achievements (incomplete seeding during DB migration)
- Found /api/seed endpoint is blocked in production
- Created new /api/achievements/sync endpoint that upserts all 116 achievements from ACHIEVEMENT_DEFS
- Deployed to production and called the sync endpoint with authenticated session
- Result: 42 new achievements created, 74 existing updated, 116 total in database

Stage Summary:
- Created: /src/app/api/achievements/sync/route.ts - New isolated endpoint to sync achievements from ACHIEVEMENT_DEFS
- Root cause: Database was seeded with incomplete achievement list during Neon PostgreSQL migration
- Fix: Sync endpoint upserts all 116 achievements (safe, idempotent, no duplicates)
- Verified: API now returns 116 achievements across all categories (learning: 25, fitness: 34, time: 25, content: 32)

---
Task ID: 2
Agent: Main
Task: Fix profile edit fields auto-deleting on space (name, bio, phone)

Work Log:
- Investigated the profile page edit flow - found useEffect([profile]) syncing edit fields with profile data
- Discovered AppShell has setInterval(() => fetchProfile(), 5000) - refreshes profile every 5 seconds
- Root cause: Every 5s, fetchProfile() creates a new profile object in Zustand store → triggers useEffect([profile]) → resets editName/editBio/editPhone back to original values while user is typing
- Fix: Replaced useEffect([profile]) with a startEditing() callback that only initializes edit fields when user clicks Edit button
- Changed Edit button onClick from () => setEditing(true) to startEditing
- This isolates edit field initialization from profile re-fetches

Stage Summary:
- File modified: /src/app/(main)/profile/page.tsx
- Removed: useEffect([profile]) that was resetting edit fields on every profile change
- Added: startEditing callback that initializes edit fields only when entering edit mode
- Root cause: AppShell's 5-second fetchProfile interval was triggering the useEffect and wiping user input
- Deployed to: https://sretrack.vercel.app

Previous fixes in this session (for context):
- Profile API crash: Changed db.profile.update to db.profile.upsert in PATCH /api/user/profile
- Macro rounding: Added 2 decimal place rounding in MacroBar component and fitness overview tab
---
Task ID: 1
Agent: main
Task: Fix 4 bugs: achievement count, profile editing crash, discover search, discover rich cards

Work Log:
- Added Cache-Control: no-store headers to /api/home response to prevent browser caching of stale achievement count
- Fixed profile editing crash by persisting edit state to sessionStorage (survives component remounts)
- Changed AppShell AnimatePresence from mode="wait" to mode="popLayout" to prevent page remounting
- Added updateEditName/updateEditBio/updateEditPhone callbacks that persist to sessionStorage
- Modified saveProfile to clear sessionStorage after successful save
- Fixed discover search API: added `mode: 'insensitive'` to all Prisma `contains` filters for case-insensitive search
- Added debounced search (300ms) to discover page to prevent excessive API calls
- Modified search callback to accept optional searchQuery parameter
- Fixed /api/feed/live-updates to always include own user's data (OR condition: userId=myUserId OR isPublic=true)
- This ensures the owner's learning/content/fitness live updates appear as rich cards in discover and feed tabs

Stage Summary:
- Modified files: src/app/api/home/route.ts, src/app/(main)/profile/page.tsx, src/components/app-shell.tsx, src/app/api/discover/route.ts, src/app/(main)/discover/page.tsx, src/app/api/feed/live-updates/route.ts
- All fixes deployed to production at sretracker.vercel.app
- Profile editing now persists state in sessionStorage across component remounts
- Live updates API now includes current user's own data regardless of isPublic setting
