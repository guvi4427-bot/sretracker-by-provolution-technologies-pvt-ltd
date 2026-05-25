---
Task ID: 1
Agent: Main
Task: Fix profile editing crash (name, bio, phone number)

Work Log:
- Investigated profile page saveProfile() function and API route PATCH /api/user/profile
- Found root cause: `db.profile.update({ where: { userId } })` crashes with Prisma P2025 error when Profile record doesn't exist for a user
- Changed `db.profile.update` to `db.profile.upsert` in the PATCH handler to create Profile if missing
- Added proper error feedback in profile page's saveProfile() - now shows toast.error on API failure instead of silently catching

Stage Summary:
- File modified: `/src/app/api/user/profile/route.ts` - Changed profile update to upsert
- File modified: `/src/app/(main)/profile/page.tsx` - Added error toasts for failed saves
- Fix ensures profile editing works even if Profile record was never created for the user

---
Task ID: 2
Agent: Main
Task: Round off daily macro values to 2 decimal points in fitness overview tab

Work Log:
- Investigated fitness page overview tab macro display
- Found MacroBar component displays raw float values without rounding
- Found weekly macro avg displays used .toFixed(0) (integer) for macro grams
- Updated MacroBar SingleMacro component to round value and goal to 2 decimal places using Math.round(x * 100) / 100
- Updated fitness page MacroBar props to round totalMacros values to 2 decimals before passing
- Updated weekly macro avg summary to use .toFixed(2) instead of .toFixed(0) for protein/carbs/fat grams
- Updated weekly daily breakdown to use .toFixed(2) instead of .toFixed(0) for protein/carbs/fat grams

Stage Summary:
- File modified: `/src/components/macro-bar.tsx` - Added displayValue/displayGoal rounding to 2dp
- File modified: `/src/app/(main)/fitness/page.tsx` - Rounded MacroBar props and weekly avg displays
- All daily macro values in overview tab now display with max 2 decimal places

---
Deployment: Successfully deployed to production via Vercel CLI
URL: https://workspace-extract-7p2drain4-gowtham-s-projects107.vercel.app / https://sretrack.vercel.app
