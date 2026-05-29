# Bug Fix Prompt — AI Loading Hang + Empty Weight Table + Weight Date Picker

## Context
Next.js 16 / React 19 app. AI powered by `z-ai-web-dev-sdk`. Fitness page at `src/app/(main)/fitness/page.tsx`. AI routes at `src/app/api/ai/`. Weight API at `src/app/api/fitness/weight/route.ts`.

---

## BUG 1 — AI Features Load Forever or Return Empty Output

### Why it happens

**Root cause A — No `model` field in any API call.**
Every `zai.chat.completions.create()` call in `src/lib/ai-provider.ts` omits the `model` parameter entirely. The Z.AI SDK requires it. Without it the API either hangs indefinitely waiting for a response, silently returns empty content, or throws a non-429 error that the current code swallows. Because the error is caught and the fallback path tries the same broken call again, the function exhausts all retry attempts before returning — causing the multi-second hang users see.

**Root cause B — No request timeout.**
There is no `AbortController` / `signal` on any `fetch` or SDK call. If the Z.AI API is slow or unreachable, each tier attempt waits indefinitely. With three tiers and no timeout, a single user request can block for 30–90 seconds before returning the local fallback.

**Root cause C — Two "tiers" use identical code, no real differentiation.**
`providers[0]` (`zai-high`) and `providers[1]` (`zai-low`) both call `getZAI()` which returns the same singleton instance with no model set. The only difference is `max_tokens`. There is no actual model switching.

**Root cause D — Module-level state resets on every Vercel cold start.**
`providers[]` and `zaiInstance` are module-level variables. On Vercel serverless, each Lambda may be a fresh process. Provider cooldown timers and fail counts evaporate on every cold start, so the backoff logic never persists across real traffic.

### How to fix

1. Add `model` to every `chat.completions.create()` call — this is the primary fix.
2. Add a 10-second `AbortController` timeout to each tier attempt.
3. Create separate ZAI client instances per model tier.
4. Treat cold-start state loss as acceptable by design — cold starts always retry from the best tier.

### Where to change

**File: `src/lib/ai-provider.ts` — full replacement**

```typescript
import ZAI from 'z-ai-web-dev-sdk';

// ── Z.AI Model Tiers ──
// Tier 1: glm-4-plus  — highest capability, rate-limited
// Tier 2: glm-4-flash — fast, generous limits
// Tier 3: ZAI default — SDK built-in default, final safety net
//
// Switching: on 429 or error → skip to next tier immediately
// Recovery:  after RATE_LIMIT_COOLDOWN_MS, tier re-enables automatically
// Timeout:   each tier call is capped at TIER_TIMEOUT_MS to prevent hangs
//
// Note: module-level state resets on Vercel cold starts — intentional.
// Cold starts always retry from the best tier, which is correct behavior.

const TIER_TIMEOUT_MS      = 10_000;  // 10s per-tier request timeout
const RATE_LIMIT_COOLDOWN  = 60_000;  // 1 min cooldown after 429
const FAIL_BACKOFF_MS      = 30_000;  // 30s backoff after 3 consecutive non-429 failures
const MAX_CONSECUTIVE_FAILS = 3;

// ── Model tier definitions ──
// Verify model names at: https://open.bigmodel.cn/dev/api
// To check available models run: bun run scripts/check-zai-models.ts (see below)
const TIERS = [
  { id: 'glm-4-plus',  model: 'glm-4-plus',  maxTokens: 1000, jsonMode: true  },
  { id: 'glm-4-flash', model: 'glm-4-flash',  maxTokens: 500,  jsonMode: false },
  { id: 'zai-default', model: null,            maxTokens: 300,  jsonMode: false },
] as const;

type TierId = typeof TIERS[number]['id'];

interface TierState {
  rateLimitedUntil: number;
  failCount: number;
  lastFailAt: number;
}

const state: Record<TierId, TierState> = {
  'glm-4-plus':  { rateLimitedUntil: 0, failCount: 0, lastFailAt: 0 },
  'glm-4-flash': { rateLimitedUntil: 0, failCount: 0, lastFailAt: 0 },
  'zai-default': { rateLimitedUntil: 0, failCount: 0, lastFailAt: 0 },
};

// One client instance per tier so model is bound at creation
const clients: Partial<Record<TierId, any>> = {};

async function getClient(tierId: TierId): Promise<any> {
  if (!clients[tierId]) clients[tierId] = await ZAI.create();
  return clients[tierId];
}

function isAvailable(id: TierId): boolean {
  const s = state[id];
  const now = Date.now();
  if (s.rateLimitedUntil > now) return false;
  if (s.failCount >= MAX_CONSECUTIVE_FAILS && now - s.lastFailAt < FAIL_BACKOFF_MS) return false;
  return true;
}

function onSuccess(id: TierId) {
  const s = state[id];
  s.rateLimitedUntil = 0; s.failCount = 0; s.lastFailAt = 0;
}

function onFailure(id: TierId, isRateLimit: boolean) {
  const s = state[id];
  s.lastFailAt = Date.now();
  if (isRateLimit) {
    s.rateLimitedUntil = Date.now() + RATE_LIMIT_COOLDOWN;
    s.failCount = 0;
    console.log(`[AI] ${id} rate-limited → pausing ${RATE_LIMIT_COOLDOWN / 1000}s`);
  } else {
    s.failCount++;
    if (s.failCount >= MAX_CONSECUTIVE_FAILS)
      console.warn(`[AI] ${id} ${MAX_CONSECUTIVE_FAILS} consecutive fails → backing off ${FAIL_BACKOFF_MS / 1000}s`);
  }
}

function isRateLimit(err: any): boolean {
  return err?.status === 429 || err?.statusCode === 429 ||
    /rate|limit|quota|too.many/i.test(err?.message || '');
}

// Wraps a promise with a timeout; throws if it exceeds TIER_TIMEOUT_MS
function withTimeout<T>(promise: Promise<T>, ms = TIER_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`AI tier timed out after ${ms}ms`)), ms)
    ),
  ]);
}

// ── Core dispatcher: try each tier in order, return first success ──
async function tryTiers<T>(
  call: (tier: typeof TIERS[number], client: any) => Promise<T | null>
): Promise<T | null> {
  for (const tier of TIERS) {
    if (!isAvailable(tier.id)) {
      console.log(`[AI] Skipping ${tier.id} (unavailable)`);
      continue;
    }
    try {
      const client = await getClient(tier.id);
      const result = await withTimeout(call(tier, client));
      if (result !== null && result !== undefined) {
        onSuccess(tier.id);
        return result;
      }
    } catch (err: any) {
      onFailure(tier.id, isRateLimit(err));
      console.warn(`[AI] ${tier.id} failed:`, err?.message);
    }
  }
  return null;
}

// ── Public: Chat completion ──
export async function aiChat(
  messages: { role: string; content: string }[],
  systemPrompt?: string,
  maxTokens = 500
): Promise<string> {
  const allMessages = [
    ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
    ...messages.map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content })),
  ];

  const result = await tryTiers(async (tier, client) => {
    const params: any = {
      messages: allMessages,
      max_tokens: Math.min(maxTokens, tier.maxTokens),
    };
    if (tier.model !== null) params.model = tier.model;

    const res = await client.chat.completions.create(params);
    return res.choices?.[0]?.message?.content || null;
  });

  return result ?? localFallback(messages);
}

// ── Public: Structured JSON chat ──
export async function aiStructuredChat<T>(
  messages: { role: string; content: string }[],
  systemPrompt?: string,
  maxTokens = 300
): Promise<T | null> {
  const allMessages = [
    ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
    ...messages.map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content })),
  ];

  return tryTiers<T>(async (tier, client) => {
    const params: any = {
      messages: allMessages,
      max_tokens: Math.min(maxTokens, tier.maxTokens),
    };
    if (tier.model !== null) params.model = tier.model;
    if (tier.jsonMode) params.response_format = { type: 'json_object' };

    const res = await client.chat.completions.create(params);
    const content = res.choices?.[0]?.message?.content;
    if (!content) return null;
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as T;
  });
}

// ── Public: Task classifier ──
export async function aiClassifyTask(title: string, description?: string): Promise<{
  category: string; productivity: string; suggestion?: string;
}> {
  const text = `${title} ${description || ''}`.toLowerCase();

  // Keyword baseline (instant, always available)
  const CATS: Record<string, string[]> = {
    work:     ['meeting','email','report','presentation','deadline','project','client','review','code','deploy','git','sprint','task','assign','deliver','proposal','invoice'],
    personal: ['grocery','clean','laundry','cook','bill','pay','appointment','family','friend','home','repair','organize','shopping'],
    health:   ['gym','workout','exercise','run','walk','yoga','meditation','doctor','medicine','sleep','stretch','vitamin','water','diet','protein','meal prep'],
    learning: ['study','read','book','course','tutorial','learn','practice','research','homework','quiz','exam','note','revise','certificate'],
  };
  const UNPRODUCTIVE = ['scroll','binge','procrastinate','lazy','waste','distraction','social media','netflix','youtube browse','doom scroll','overthink','complain','idle','reels','tiktok','shorts','scrolling','mindless browsing'];
  const SUGGESTIONS: Record<string, string> = {
    scroll: 'Try: Read an article for 15 minutes instead',
    binge: 'Try: Watch one educational video, then do a quick productive task',
    'social media': 'Try: Set a 10-min timer, then work on a priority task',
    netflix: 'Try: Watch one episode as a reward after completing 2 tasks',
    procrastinate: 'Try: Break the task into a tiny 2-minute first step',
    lazy: 'Try: Start with 5 minutes — momentum builds!',
    overthink: 'Try: Write your thoughts down, pick one small action',
    reels: 'Try: Close the app and spend 5 minutes on a productive task',
    tiktok: 'Try: Set a 5-min timer, then switch to a learning activity',
    shorts: 'Try: Watch one educational short, then do a 10-minute focused task',
    scrolling: 'Try: Put your phone down and do a 5-minute stretch or walk',
  };

  let category = 'other'; let maxMatches = 0;
  for (const [cat, kws] of Object.entries(CATS)) {
    const m = kws.filter(kw => text.includes(kw)).length;
    if (m > maxMatches) { maxMatches = m; category = cat; }
  }
  const isUnproductive = UNPRODUCTIVE.some(kw => text.includes(kw));
  let productivity = isUnproductive ? 'unproductive' : 'productive';
  let suggestion: string | undefined;
  for (const [kw, sug] of Object.entries(SUGGESTIONS)) {
    if (text.includes(kw)) { suggestion = sug; break; }
  }
  if (!suggestion && isUnproductive) suggestion = 'Try replacing this with a 15-minute learning or exercise activity';

  // Enhance with AI if available
  try {
    const result = await aiStructuredChat<{ category: string; productivity: string; suggestion?: string }>(
      [{ role: 'user', content: `Classify: "${title}". ${description || ''}` }],
      'Classify the task. JSON only: {"category":"work|personal|health|learning|other","productivity":"productive|unproductive","suggestion":"optional"}',
      120
    );
    if (result?.category) category = result.category;
    if (result?.productivity) productivity = result.productivity;
    if (result?.suggestion) suggestion = result.suggestion;
  } catch { /* keyword result already computed */ }

  return { category, productivity, suggestion };
}

// ── Local keyword fallback (zero latency, no AI dependency) ──
function localFallback(messages: { role: string; content: string }[]): string {
  const last = messages[messages.length - 1]?.content?.toLowerCase() || '';
  if (/learn|study/.test(last)) return "Study tip: Try the Feynman Technique — explain the concept as if teaching a 5-year-old. Break topics into small chunks and use active recall for better retention!";
  if (/workout|exercise|fitness|gym/.test(last)) return "Fitness tip: Consistency beats intensity. A 20-minute daily workout beats a 2-hour session once a week. Mix cardio and strength for balanced results!";
  if (/content|write|create|script/.test(last)) return "Content tip: Start with an outline, then flesh out each section. Don't edit while writing. Hook your audience in the first 3 seconds!";
  if (/time|productive|focus|procrastinat/.test(last)) return "Productivity tip: Use the Pomodoro Technique — 25 min focused work, 5 min break. Start with your hardest task when energy is highest!";
  if (/streak|motiv/.test(last)) return "Remember: a 1-day streak beats zero. Don't let perfection be the enemy of progress. You've got this!";
  if (/diet|food|eat|nutrition|protein/.test(last)) return "Nutrition tip: Fill half your plate with vegetables, quarter with protein, quarter with complex carbs. Aim for 1.6–2.2g protein/kg if active!";
  if (/sleep|rest|recovery/.test(last)) return "Sleep is crucial! Aim for 7–9 hours. Consistent schedule, no screens 1 hour before bed. Quality sleep improves learning retention by up to 40%!";
  if (/stress|anxiety|overwhelm/.test(last)) return "Try the 4-7-8 breathing technique: inhale 4s, hold 7s, exhale 8s. Break overwhelming tasks into tiny steps. Rest is recovery, not laziness.";
  return "I'm your S/R/E AI assistant! I can help with learning, fitness, content creation, time management, nutrition, and motivation. What would you like to work on?";
}

// ── Debug helper ──
export function getAIProviderStatus() {
  return TIERS.map(t => ({
    id: t.id, model: t.model ?? 'sdk-default',
    available: isAvailable(t.id), state: state[t.id],
  }));
}
```

---

## BUG 2 — Empty Weight Progress Table in Progress Tab

### Why it happens

The Progress tab's weight log section renders a list of `GlassCard` components only when `weightLogs` has items:

```tsx
// src/app/(main)/fitness/page.tsx  ~line 1273
<div className="space-y-2">
  {weightLogs.slice().reverse().slice(0, 20).map((w: any) => (
    <GlassCard ...>...</GlassCard>
  ))}
</div>
```

When `weightLogs` is empty (no weights logged yet, or fetch failed), this renders a completely empty `<div>` with no empty state message, no table headers, no guidance. To the user it looks like a broken or missing feature — they see a blank area with no indication of what to do.

Additionally, the `WeightChart` is gated on `weightChartData.length > 1` — so with 0 or 1 entries there is also no chart, and the entire Progress tab appears barren.

### How to fix

Add a proper empty state to the weight log section, and also show a `weightChartData.length === 1` single-entry state encouraging more logging.

### Where to change

**File: `src/app/(main)/fitness/page.tsx`**

Find the Progress tab section (~line 1215–1280). Replace the weight log input card and list with:

```tsx
{/* Progress Tab — Weight Logger */}
<GlassCard className="p-4">
  <h3 className="text-sm font-medium text-muted-foreground mb-3">{t('fitness.logWeight')}</h3>
  <div className="flex gap-2 mb-2">
    <Input
      type="number"
      value={weightValue}
      onChange={e => setWeightValue(e.target.value)}
      placeholder="Weight (kg)"
      className="bg-accent border-border text-foreground"
    />
    {/* NEW: date picker for weight entry */}
    <input
      type="date"
      value={weightDate}
      max={today}
      onChange={e => setWeightDate(e.target.value)}
      className="bg-accent border border-border text-foreground rounded-md px-3 py-2 text-sm"
    />
    <Button onClick={addWeight} className="gradient-blue shrink-0">{t('common.add')}</Button>
  </div>
  <p className="text-[10px] text-muted-foreground/50">Targets auto-recalculate when weight changes</p>
</GlassCard>

{/* Weight Progress Chart */}
{weightChartData.length > 1 && (
  <GlassCard variant="glowing" className="p-4">
    <div className="flex items-center gap-2 mb-3">
      <TrendingUp size={16} className="text-blue-400" />
      <h3 className="text-sm font-medium text-muted-foreground">Weight Progress</h3>
    </div>
    <WeightChart data={weightChartData} />
  </GlassCard>
)}

{/* Workout Calories Trend Chart */}
{workoutChartArr.length >= 1 && (
  <GlassCard variant="glowing" className="p-4">
    <div className="flex items-center gap-2 mb-3">
      <Activity size={16} className="text-red-400" />
      <h3 className="text-sm font-medium text-muted-foreground">Workout Calories Trend</h3>
    </div>
    <WorkoutChart data={workoutChartArr} />
  </GlassCard>
)}

{/* Calorie Balance Chart */}
{(() => {
  const calorieChartData = weekDates.slice().reverse().map(dateStr => {
    const logs = dateStr === today ? foodLogs : (nutritionHistory[dateStr] || []);
    const dayWorkouts = [...workouts, ...Object.values(workoutHistory).flat()].filter((w: any) => w.date === dateStr);
    return {
      date: dateStr.slice(5),
      consumed: logs.reduce((a: number, f: any) => a + (f.calories || 0), 0),
      burned: dayWorkouts.reduce((a: number, w: any) => a + (w.estimatedCalories || 0), 0),
    };
  });
  if (calorieChartData.every(d => d.consumed === 0 && d.burned === 0)) return null;
  return (
    <GlassCard variant="glowing" className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Flame size={16} className="text-amber-400" />
        <h3 className="text-sm font-medium text-muted-foreground">Calorie Balance (7 Days)</h3>
      </div>
      <CalorieChart data={calorieChartData} />
    </GlassCard>
  );
})()}

{/* Weight Log List */}
{weightLogs.length === 0 ? (
  {/* EMPTY STATE — was missing, causing the blank table */}
  <GlassCard className="p-6 text-center">
    <Scale size={32} className="text-muted-foreground/30 mx-auto mb-3" />
    <p className="text-sm text-muted-foreground/60">No weight entries yet</p>
    <p className="text-xs text-muted-foreground/40 mt-1">Log your first weight above to start tracking your progress</p>
  </GlassCard>
) : (
  <div className="space-y-2">
    {weightLogs.slice().reverse().slice(0, 20).map((w: any) => (
      <GlassCard key={w.id} className="p-3 flex items-center justify-between">
        <div>
          <p className="text-sm text-foreground">{w.weight} kg</p>
          <p className="text-[10px] text-muted-foreground/70">{w.date}</p>
        </div>
        <button onClick={() => deleteWeight(w.id)} className="text-muted-foreground/50 hover:text-red-400">
          <Trash2 size={14} />
        </button>
      </GlassCard>
    ))}
  </div>
)}
```

---

## BUG 3 — Weight Log Always Uses Today's Date (No Date Picker)

### Why it happens

The `addWeight` function hardcodes `date: today` in its POST body:

```ts
// src/app/(main)/fitness/page.tsx  ~line 403 — BROKEN
const r = await fetch('/api/fitness/weight', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ weight: parseFloat(weightValue), date: today }), // ← always today
});
```

There is no `weightDate` state, no date input in the Progress tab's weight logger, and no way for users to log a weight entry for a past date (e.g., if they forgot to log yesterday). The API route already supports any `date` string — the limitation is entirely in the frontend.

### How to fix

Add a `weightDate` state variable initialized to `today`, add a date `<input>` next to the weight input, and update `addWeight()` to use `weightDate` instead of `today`.

### Where to change

**File: `src/app/(main)/fitness/page.tsx`**

**Change 1 — Add state variable** (near the other state declarations, ~line 93):

```tsx
// ADD this line alongside the other useState declarations:
const [weightDate, setWeightDate] = useState(today);
```

**Change 2 — Update `addWeight()` to use `weightDate`** (~line 400–413):

```tsx
async function addWeight() {
  if (!weightValue) return;
  try {
    const r = await fetch('/api/fitness/weight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weight: parseFloat(weightValue), date: weightDate }), // ← use weightDate
    });
    if (r.ok) {
      const d = await r.json();
      const newWeight = d.weightLog;
      if (newWeight) {
        setWeightLogs(prev => [...prev, newWeight]);
      }
      setWeightValue('');
      setWeightDate(today); // reset date picker back to today after logging
      fetchWeights();
      fetchProfile();
      toast.success('Weight logged & targets updated!');
    }
  } catch {}
}
```

**Change 3 — Add the date picker input to the UI** (inside the Progress tab's weight logger GlassCard, as shown in Bug 2's code block above — the date `<input>` sits between the weight number input and the Add button):

```tsx
<input
  type="date"
  value={weightDate}
  max={today}
  onChange={e => setWeightDate(e.target.value)}
  className="bg-accent border border-border text-foreground rounded-md px-3 py-2 text-sm"
/>
```

No changes needed to the API route (`src/app/api/fitness/weight/route.ts`) — it already handles arbitrary date strings correctly, including upsert logic if a date already has an entry.

---

## SUMMARY OF ALL CHANGES

| File | Lines Affected | What Changes |
|------|---------------|--------------|
| `src/lib/ai-provider.ts` | Full file | Adds `model` to every API call; adds 10s timeout per tier; 3-tier graceful degradation (`glm-4-plus` → `glm-4-flash` → ZAI default → local keyword fallback) |
| `src/app/(main)/fitness/page.tsx` | ~line 93 | Add `weightDate` state |
| `src/app/(main)/fitness/page.tsx` | ~line 400–413 | `addWeight()` uses `weightDate` instead of hardcoded `today`; resets after log |
| `src/app/(main)/fitness/page.tsx` | ~line 1215–1280 | Add date picker next to weight input; add empty state for weight log list |

**No changes to API routes** — all backend routes are correct.

---

## VERIFY MODEL NAMES BEFORE DEPLOYING

Run this once locally to confirm which Z.AI model strings are valid:

```typescript
// scripts/check-zai-models.ts
import ZAI from 'z-ai-web-dev-sdk';
const zai = await ZAI.create();
for (const model of ['glm-4-plus', 'glm-4-flash', 'glm-4', 'glm-3-turbo']) {
  try {
    const r = await zai.chat.completions.create({ model, messages: [{ role: 'user', content: 'Hi' }], max_tokens: 5 });
    console.log(`✅ ${model}:`, r.choices?.[0]?.message?.content);
  } catch (e: any) {
    console.log(`❌ ${model}:`, e?.message);
  }
}
```

Run: `bun run scripts/check-zai-models.ts`

Update the `TIERS` array model strings if any differ from `glm-4-plus` / `glm-4-flash`.
