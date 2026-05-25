---
Task ID: 1
Agent: Main Agent
Task: Fix all reported bugs and add new features

Work Log:
- Fixed follower/following count vanishing after following by using Math.max merge in loadUser and delaying server refresh to 1000ms
- Fixed profile editing space crash by removing useCallback wrappers that caused stale closures, replaced with simple functions
- Added shareLearningProgress field to Prisma Profile model, user store, profile API, and public profile API
- Added Share Learning Progress toggle in profile settings
- Rewrote /api/feed/live-updates to filter by share settings (shareFitnessProgress, shareContentStatus, shareLearningProgress) and respect private profile visibility (only followers can see)
- Rewrote /api/discover to also filter by share settings and private profile visibility
- Fixed home page achievement count showing 0 by adding cache-busting (_t=Date.now()) and no-store header to fetch
- Fixed discover search by using refs for query/tab instead of useCallback deps, preventing infinite re-render loop and only resetting current tab results

Stage Summary:
- 11 files changed with 297 insertions, 241 deletions
- All bugs fixed, new features implemented
- Prisma schema pushed to database (shareLearningProgress column added)
- Build succeeded
- Deployment requires manual git push (no credentials in environment)
