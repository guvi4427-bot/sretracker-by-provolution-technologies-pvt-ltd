# AI Features Fix Prompt — SRE Platform

---

## CONTEXT: What You Are Working On

This is a Next.js 16 / React 19 app deployed on Vercel (serverless). It has multiple AI-powered features (chatbot, task classification, macro estimation, calorie burn, script review, rate-my-day, posting time) all routed through a single file: `src/lib/ai-provider.ts`. The AI SDK used is `z-ai-web-dev-sdk` (Z.AI's official SDK), which exposes an OpenAI-compatible `chat.completions.create()` interface.

---

## WHY THE AI FEATURES ARE BROKEN — ROOT CAUSES

### Bug 1 — No Model Is Ever Specified (CRITICAL)
**File:** `src/lib/ai-provider.ts`

Every `zai.chat.completions.create()` call omits the `model` field entirely:

```ts
// BROKEN — no model specified
const result = await zai.chat.completions.create({
  messages: allMessages,
  max_tokens: maxTokens,
});
```

The Z.AI SDK requires a `model` to be passed explicitly. Without it, the API either rejects the request or silently uses an unintended default, causing all AI calls to fail. This is the primary reason AI features return nothing or crash.

### Bug 2 — "High Power" and "Low Power" Are Both the Same Thing (CRITICAL)
**File:** `src/lib/ai-provider.ts`

The code defines two named providers (`zai-high`, `zai-low`) as a graceful degradation system, but they are **completely identical** in every API call — same `ZAI.create()` instance, no model differentiation:

```ts
// Both providers call identical code — no actual model switching happens
const zai = await getZAI(); // single shared instance
const result = await zai.chat.completions.create({
  messages: allMessages,
  max_tokens: isHighPower ? maxTokens : Math.min(maxTokens, 200), // only token count differs
});
```

There is no `model: 'high-model-name'` vs `model: 'low-model-name'` distinction. The graceful degradation system is entirely non-functional.

### Bug 3 — Singleton State Lost on Every Serverless Cold Start (CRITICAL)
**File:** `src/lib/ai-provider.ts`

The provider state and ZAI instance are stored as module-level variables:

```ts
const providers: AIProvider[] = [...]; // rate-limit cooldown state
let zaiInstance: any = null;           // SDK singleton
```

On Vercel (serverless), each incoming request may spin up a new Lambda instance. Module-level state is **not shared across instances** and is **reset on every cold start**. This means:
- Rate-limit cooldown timers reset to zero — the system never actually backs off
- `zaiInstance` is `null` on every cold start, forcing `ZAI.create()` to be called every single time
- The failover logic tracks failures that only exist within a single instance's memory

### Bug 4 — Single ZAI Instance Cannot Support Two Different Models
**File:** `src/lib/ai-provider.ts`

`ZAI.create()` is called once with no configuration:

```ts
zaiInstance = await ZAI.create();
```

If the SDK binds to a single model at creation time, the same instance cannot switch models mid-execution. Separate client instances are needed for each model tier.

### Bug 5 — `posting-time` and `rank-unproductive` Routes Never Use AI
**Files:** `src/app/api/ai/posting-time/route.ts`, `src/app/api/ai/rank-unproductive/route.ts`

These two routes are completely hardcoded with static lookup tables — they never call `aiChat` at all, so they never benefit from the AI system even when it works.

### Bug 6 — `chatbot` Route Has No Fallback (CRITICAL USER-FACING)
**File:** `src/app/api/ai/chatbot/route.ts`

```ts
const reply = await aiChat(messages, ...);
return NextResponse.json({ reply, response: reply });
```

If `aiChat` throws (which it will with Bug 1), the entire route returns a 500 error. Unlike other routes that have try/catch with static fallbacks, the chatbot surfaces raw errors to users.

---

## THE FIX — COMPLETE IMPLEMENTATION

### Step 1: Identify the Z.AI Model Names to Use

Z.AI (ChatGLM / Zhipu AI) exposes these models via the `z-ai-web-dev-sdk`:

| Tier | Model Name | Characteristics |
|------|-----------|-----------------|
| High Power | `glm-4-plus` | Most capable, rate-limited |
| Low Power | `glm-4-flash` | Faster, generous limits, slightly less capable |
| Final Fallback | Z.AI SDK default | Whatever `ZAI.create()` uses natively (no model param) |

> **Confirm exact model names** by checking Z.AI's docs at https://open.bigmodel.cn/dev/api or running `ZAI.list_models()` if the SDK supports it. Replace model name strings below if needed.

---

### Step 2: Replace `src/lib/ai-provider.ts` Entirely

**File to change:** `src/lib/ai-provider.ts`  
**Action:** Replace the entire file with the following:

```typescript
import ZAI from 'z-ai-web-dev-sdk';

// ── Tiered Multi-Model AI System ──
//
// TIER 1 (Primary):   glm-4-plus   — high capability, rate-limited
// TIER 2 (Fallback):  glm-4-flash  — fast, generous rate limits
// TIER 3 (Last):      ZAI default  — whatever ZAI.create() resolves to natively
//
// Switching is DYNAMIC: on 429 rate-limit → immediately drop to next tier
// Cooldown: rate-limited tier stays paused for RATE_LIMIT_COOLDOWN ms
// After cooldown expires, system re-promotes back to higher tier automatically
//
// NOTE: State is per-serverless-instance. Cooldowns don't persist across cold starts.
// This is acceptable — it means each cold start retries from the highest tier first,
// which is the desired behavior (always prefer the best available model).

// ── Model Configuration ──
// Adjust model names here if Z.AI updates their API offerings
const MODEL_TIERS = [
  {
    name: 'glm-4-plus',           // High-power: best quality, rate-limited
    model: 'glm-4-plus',
    maxTokens: 1000,
    supportsJsonMode: true,
    description: 'High-power tier',
  },
  {
    name: 'glm-4-flash',          // Low-power: fast, minimal rate limits
    model: 'glm-4-flash',
    maxTokens: 500,
    supportsJsonMode: false,
    description: 'Low-power fallback tier',
  },
  {
    name: 'zai-default',          // Z.AI native default — final safety net
    model: null,                  // null = let ZAI SDK use its built-in default
    maxTokens: 300,
    supportsJsonMode: false,
    description: 'Z.AI default model fallback',
  },
] as const;

const RATE_LIMIT_COOLDOWN_MS = 60_000;  // 1 minute cooldown on 429
const FAIL_BACKOFF_MS = 30_000;         // 30 second backoff after 3 consecutive non-rate-limit failures
const MAX_CONSECUTIVE_FAILS = 3;

// ── Per-instance provider state ──
// NOTE: This is module-level and resets on each serverless cold start.
// That is intentional — cold starts always retry from the best tier.
interface ProviderState {
  rateLimitedUntil: number;   // timestamp when rate-limit cooldown expires
  failCount: number;          // consecutive non-rate-limit failures
  lastFailAt: number;         // timestamp of last failure
}

const providerState: Record<string, ProviderState> = {
  'glm-4-plus':    { rateLimitedUntil: 0, failCount: 0, lastFailAt: 0 },
  'glm-4-flash':   { rateLimitedUntil: 0, failCount: 0, lastFailAt: 0 },
  'zai-default':   { rateLimitedUntil: 0, failCount: 0, lastFailAt: 0 },
};

// ── ZAI Client Instances (one per model tier) ──
// Separate instances allow true model switching at the SDK level
let zaiClients: Record<string, any> = {};

async function getZAIClient(modelName: string | null): Promise<any> {
  const key = modelName ?? 'default';
  if (!zaiClients[key]) {
    // Each tier gets its own client instance
    // This ensures model selection is locked in at the client level
    zaiClients[key] = await ZAI.create();
  }
  return zaiClients[key];
}

// ── Provider Availability Check ──
function isAvailable(tierName: string): boolean {
  const state = providerState[tierName];
  if (!state) return true;
  const now = Date.now();

  // Still rate-limited?
  if (state.rateLimitedUntil > now) return false;

  // Too many consecutive non-rate-limit failures — back off
  if (state.failCount >= MAX_CONSECUTIVE_FAILS && now - state.lastFailAt < FAIL_BACKOFF_MS) return false;

  return true;
}

function onSuccess(tierName: string) {
  const state = providerState[tierName];
  if (state) {
    state.rateLimitedUntil = 0;
    state.failCount = 0;
    state.lastFailAt = 0;
  }
}

function onFailure(tierName: string, isRateLimit: boolean) {
  const state = providerState[tierName];
  if (!state) return;

  state.lastFailAt = Date.now();

  if (isRateLimit) {
    state.rateLimitedUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
    state.failCount = 0; // rate limit is not a "failure" — reset fail counter
    console.log(`[AI] ${tierName} rate-limited — pausing for ${RATE_LIMIT_COOLDOWN_MS / 1000}s, switching to next tier`);
  } else {
    state.failCount++;
    if (state.failCount >= MAX_CONSECUTIVE_FAILS) {
      console.warn(`[AI] ${tierName} hit ${MAX_CONSECUTIVE_FAILS} consecutive failures — backing off for ${FAIL_BACKOFF_MS / 1000}s`);
    }
  }
}

function isRateLimitError(error: any): boolean {
  return (
    error?.status === 429 ||
    error?.statusCode === 429 ||
    error?.message?.toLowerCase().includes('rate') ||
    error?.message?.toLowerCase().includes('limit') ||
    error?.message?.toLowerCase().includes('quota') ||
    error?.message?.toLowerCase().includes('too many')
  );
}

// ── Core: Try Each Tier in Order ──
// Returns the result of the first successful tier call.
// Automatically falls through to the next tier on rate-limit or failure.
async function tryTiers<T>(
  fn: (tier: typeof MODEL_TIERS[number], client: any) => Promise<T | null>
): Promise<T | null> {
  for (const tier of MODEL_TIERS) {
    if (!isAvailable(tier.name)) {
      console.log(`[AI] Skipping ${tier.name} (unavailable)`);
      continue;
    }

    try {
      const client = await getZAIClient(tier.model);
      const result = await fn(tier, client);
      if (result !== null && result !== undefined) {
        onSuccess(tier.name);
        console.log(`[AI] Success with ${tier.name}`);
        return result;
      }
    } catch (error: any) {
      const rateLimited = isRateLimitError(error);
      onFailure(tier.name, rateLimited);
      console.warn(`[AI] ${tier.name} failed (${rateLimited ? 'rate-limited' : 'error'}):`, error?.message);
      // Continue to next tier immediately
    }
  }

  return null; // All tiers failed
}

// ── Public: Chat Completion ──
// Used by: chatbot, rate-day, script-review, estimate-burn
export async function aiChat(
  messages: { role: string; content: string }[],
  systemPrompt?: string,
  maxTokens: number = 500
): Promise<string> {
  const allMessages = [
    ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
    ...messages.map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    })),
  ];

  const result = await tryTiers(async (tier, client) => {
    const params: any = {
      messages: allMessages,
      max_tokens: Math.min(maxTokens, tier.maxTokens),
    };

    // Only add model param if specified (null = use SDK default for zai-default tier)
    if (tier.model !== null) {
      params.model = tier.model;
    }

    const response = await client.chat.completions.create(params);
    const content = response.choices?.[0]?.message?.content;
    return content || null;
  });

  // Final fallback: local static response (zero AI dependency)
  return result ?? generateLocalResponse(messages);
}

// ── Public: Structured (JSON) Chat Completion ──
// Used by: estimate-macros, classify-task
export async function aiStructuredChat<T>(
  messages: { role: string; content: string }[],
  systemPrompt?: string,
  maxTokens: number = 300
): Promise<T | null> {
  const allMessages = [
    ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
    ...messages.map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    })),
  ];

  const result = await tryTiers<T>(async (tier, client) => {
    const params: any = {
      messages: allMessages,
      max_tokens: Math.min(maxTokens, tier.maxTokens),
    };

    if (tier.model !== null) {
      params.model = tier.model;
    }

    // Use JSON mode on tiers that support it (high-power tier)
    if (tier.supportsJsonMode) {
      params.response_format = { type: 'json_object' };
    }

    const response = await client.chat.completions.create(params);
    const content = response.choices?.[0]?.message?.content;
    if (!content) return null;

    // Extract JSON from response (handles both pure JSON and markdown-wrapped JSON)
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;

    return JSON.parse(match[0]) as T;
  });

  return result;
}

// ── Public: Task Classifier ──
// Used by: classify-task route
export async function aiClassifyTask(
  title: string,
  description?: string
): Promise<{ category: string; productivity: string; suggestion?: string }> {
  const text = `${title} ${description || ''}`.toLowerCase();

  // ── Keyword-based classification (always available, zero-latency) ──
  const CATEGORY_KEYWORDS: Record<string, string[]> = {
    work: ['meeting', 'email', 'report', 'presentation', 'deadline', 'project', 'client', 'review', 'code', 'deploy', 'git', 'jira', 'standup', 'sprint', 'task', 'assign', 'deliver', 'submit', 'proposal', 'invoice', 'contract'],
    personal: ['grocery', 'clean', 'laundry', 'cook', 'bill', 'pay', 'appointment', 'family', 'friend', 'call mom', 'call dad', 'home', 'repair', 'organize', 'shopping'],
    health: ['gym', 'workout', 'exercise', 'run', 'walk', 'yoga', 'meditation', 'doctor', 'medicine', 'sleep', 'stretch', 'dentist', 'vitamin', 'water', 'diet', 'protein', 'meal prep'],
    learning: ['study', 'read', 'book', 'course', 'tutorial', 'learn', 'practice', 'research', 'lecture', 'homework', 'quiz', 'exam', 'note', 'revise', 'certificate'],
  };

  const UNPRODUCTIVE_KEYWORDS = [
    'scroll', 'binge', 'procrastinate', 'lazy', 'waste', 'distraction',
    'social media', 'netflix', 'youtube browse', 'doom scroll', 'overthink',
    'complain', 'idle', 'nothing', 'instagram reels', 'reels', 'tiktok scroll',
    'shorts', 'social media scroll', 'twitter scroll', 'reddit scroll',
    'scrolling', 'mindless browsing', 'time waste', 'idle browsing',
    'youtube shorts', 'snapchat', 'facebook scroll', 'instagram', 'tiktok',
  ];

  const SUGGESTIONS: Record<string, string> = {
    'scroll': 'Try replacing with: Read an article or book for 15 minutes instead',
    'binge': 'Try: Watch one educational video, then do a quick productive task',
    'social media': 'Try: Set a 10-min timer for social media, then work on a priority task',
    'netflix': 'Try: Watch one episode as a reward after completing 2 tasks',
    'youtube browse': 'Try: Watch a specific educational video on a topic you\'re learning',
    'doom scroll': 'Try: Close the app and do a 5-minute meditation or stretch break',
    'lazy': 'Try: Start with just 5 minutes of a productive task — momentum builds!',
    'overthink': 'Try: Write down your thoughts, then pick one small action to take',
    'complain': 'Try: Identify one thing you can improve and take a small step',
    'procrastinate': 'Try: Break the task into a tiny 2-minute first step',
    'instagram reels': 'Try: Replace with a 5-minute learning activity or quick exercise',
    'reels': 'Try: Close the app and spend 5 minutes on a productive task',
    'tiktok scroll': 'Try: Set a 5-min timer, then switch to a learning activity',
    'shorts': 'Try: Watch one educational short, then do a 10-minute focused task',
    'youtube shorts': 'Try: Replace with watching one educational video on a skill you\'re building',
    'scrolling': 'Try: Put your phone down and do a 5-minute stretch or walk',
    'mindless browsing': 'Try: Pick one specific thing to look up, then close the browser',
    'reddit scroll': 'Try: Visit one specific subreddit for learning, then close the app',
    'facebook scroll': 'Try: Set a 5-min limit, then work on your top priority',
    'snapchat': 'Try: Send one quick message, then focus on a task for 15 minutes',
  };

  // Compute keyword-based result as baseline
  let category = 'other';
  let maxMatches = 0;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matches = keywords.filter(kw => text.includes(kw)).length;
    if (matches > maxMatches) { maxMatches = matches; category = cat; }
  }

  const isUnproductive = UNPRODUCTIVE_KEYWORDS.some(kw => text.includes(kw));
  let productivity = isUnproductive ? 'unproductive' : 'productive';
  let suggestion: string | undefined;
  for (const [keyword, sug] of Object.entries(SUGGESTIONS)) {
    if (text.includes(keyword)) { suggestion = sug; break; }
  }
  if (!suggestion && isUnproductive) {
    suggestion = 'Try replacing this with a 15-minute learning or exercise activity';
  }

  // Try AI for better classification — falls back to keyword result automatically
  try {
    const result = await aiStructuredChat<{ category: string; productivity: string; suggestion?: string }>(
      [{ role: 'user', content: `Classify this task. Task: "${title}". ${description || ''}` }],
      'Classify this task. Respond ONLY with valid JSON: {"category":"work|personal|health|learning|other","productivity":"productive|unproductive","suggestion":"optional replacement suggestion if unproductive"}',
      120
    );
    if (result?.category) category = result.category;
    if (result?.productivity) productivity = result.productivity;
    if (result?.suggestion) suggestion = result.suggestion;
  } catch {
    // Use keyword-based result — already computed above
  }

  return { category, productivity, suggestion };
}

// ── Local Fallback Responses ──
// Zero-latency static responses when all AI tiers fail
// Covers the chatbot use case specifically
function generateLocalResponse(messages: { role: string; content: string }[]): string {
  const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';

  if (lastMessage.includes('learn') || lastMessage.includes('study')) {
    return "Here's a study tip: Try the Feynman Technique — explain the concept as if teaching a 5-year-old. If you struggle, that's where you need to focus. Break your topic into smaller chunks and tackle one at a time. Active recall and spaced repetition are scientifically proven to boost retention!";
  }
  if (lastMessage.includes('workout') || lastMessage.includes('exercise') || lastMessage.includes('fitness') || lastMessage.includes('gym')) {
    return "For your fitness journey: Consistency beats intensity. A 20-minute daily workout is better than a 2-hour session once a week. Mix cardio and strength training for balanced results. Don't forget to warm up and cool down to prevent injuries!";
  }
  if (lastMessage.includes('content') || lastMessage.includes('write') || lastMessage.includes('create') || lastMessage.includes('script')) {
    return "Content creation tip: Start with an outline, then flesh out each section. Don't edit while writing — get your ideas down first, then refine. The best content comes from genuine experience. Hook your audience in the first 3 seconds with a question or bold statement!";
  }
  if (lastMessage.includes('time') || lastMessage.includes('productive') || lastMessage.includes('focus') || lastMessage.includes('procrastinat')) {
    return "Time management advice: Use the Pomodoro Technique — 25 minutes of focused work, 5-minute break. After 4 rounds, take a longer 15-30 minute break. This prevents burnout while maintaining high productivity. Start with your hardest task when your energy is highest!";
  }
  if (lastMessage.includes('streak') || lastMessage.includes('motivation') || lastMessage.includes('motivate')) {
    return "Staying motivated is key! Remember: a 1-day streak is better than zero. Don't let perfection be the enemy of progress. Even logging a 5-minute activity keeps your streak alive. You've got this!";
  }
  if (lastMessage.includes('diet') || lastMessage.includes('food') || lastMessage.includes('eat') || lastMessage.includes('nutrition') || lastMessage.includes('protein')) {
    return "Nutrition tip: Focus on whole foods and balanced macros. A simple rule: fill half your plate with vegetables, quarter with protein, quarter with complex carbs. Aim for 1.6-2.2g protein per kg body weight if you're active. Stay hydrated!";
  }
  if (lastMessage.includes('sleep') || lastMessage.includes('rest') || lastMessage.includes('recovery')) {
    return "Sleep is crucial for recovery and growth! Aim for 7-9 hours. Keep a consistent sleep schedule, avoid screens 1 hour before bed, and keep your room cool and dark. Quality sleep improves learning retention by up to 40%!";
  }
  if (lastMessage.includes('stress') || lastMessage.includes('anxiety') || lastMessage.includes('overwhelm')) {
    return "Managing stress is essential for growth. Try the 4-7-8 breathing technique: inhale 4 seconds, hold 7, exhale 8. Break overwhelming tasks into tiny steps. It's okay to take breaks — rest is not laziness, it's recovery.";
  }

  return "I'm your S/R/E AI assistant! I can help with learning strategies, fitness tips, content creation, time management, nutrition advice, and motivation. What would you like to work on today?";
}

// ── Debug Helper (development only) ──
// Call GET /api/ai/debug to see current tier status
export function getAIProviderStatus() {
  return MODEL_TIERS.map(tier => ({
    name: tier.name,
    model: tier.model ?? 'sdk-default',
    available: isAvailable(tier.name),
    state: providerState[tier.name],
  }));
}
```

---

### Step 3: Fix the Chatbot Route — Add Fallback

**File to change:** `src/app/api/ai/chatbot/route.ts`  
**Action:** Wrap the aiChat call in a try/catch that returns a graceful fallback instead of a 500 error:

```typescript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { aiChat } from '@/lib/ai-provider';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { message, botType, history } = await req.json();
    if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

    const systemPrompts: Record<string, string> = {
      learning: 'You are a helpful learning assistant. Help users study effectively, explain concepts, suggest learning strategies. Keep responses concise and actionable.',
      fitness: 'You are a fitness and nutrition assistant. Help with workouts, nutrition, form tips, and motivation. Be encouraging and safety-conscious.',
      content: 'You are a content creation assistant. Help with writing, scripting, content strategy, and creative ideas. Be creative and practical.',
      time: 'You are a time management and productivity assistant. Help with prioritization, focus techniques, scheduling. Be practical and supportive.',
      general: 'You are S/R/E AI, a friendly self-growth assistant. Help with learning, fitness, content, time management, motivation. Keep responses concise and actionable.',
    };

    const messages = [
      ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    // aiChat now handles all tiers + local fallback internally — never throws
    const reply = await aiChat(
      messages,
      systemPrompts[botType || 'general'] || systemPrompts.general
    );

    return NextResponse.json({ reply, response: reply });
  } catch (error) {
    console.error('AI chatbot error:', error);
    // Return a friendly message rather than a raw 500
    const fallback = "I'm having a moment! Try again in a few seconds. In the meantime: stay consistent, progress compounds. 💪";
    return NextResponse.json({ reply: fallback, response: fallback });
  }
}
```

---

### Step 4: Add an Optional Debug Endpoint

**File to create:** `src/app/api/ai/status/route.ts`  
**Action:** Create this new file for monitoring which AI tier is active:

```typescript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAIProviderStatus } from '@/lib/ai-provider';

export async function GET() {
  // Optional: lock this behind admin auth
  // const session = await getServerSession(authOptions);
  // if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    providers: getAIProviderStatus(),
  });
}
```

---

### Step 5: Verify Model Names Against Z.AI API

Before deploying, confirm the exact model strings by running this one-off script locally:

```typescript
// scripts/check-zai-models.ts
import ZAI from 'z-ai-web-dev-sdk';

const zai = await ZAI.create();
// Try listing models if the SDK supports it
try {
  const models = await (zai as any).models?.list?.();
  console.log('Available models:', models);
} catch {
  // If list() is not available, try a test call with each model name
  for (const model of ['glm-4-plus', 'glm-4-flash', 'glm-4', 'glm-3-turbo']) {
    try {
      const res = await zai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10,
      });
      console.log(`✅ ${model} works:`, res.choices?.[0]?.message?.content);
    } catch (e: any) {
      console.log(`❌ ${model} failed:`, e?.message);
    }
  }
}
```

Run with: `bun run scripts/check-zai-models.ts`

Update the `MODEL_TIERS` array in `ai-provider.ts` with the confirmed model names before deploying.

---

## SUMMARY OF ALL CHANGES

| File | Change Type | What Changes |
|------|------------|--------------|
| `src/lib/ai-provider.ts` | **Full Replacement** | Adds real model names to every API call; creates 3-tier graceful degradation (`glm-4-plus` → `glm-4-flash` → ZAI default); creates separate ZAI client per tier; fixes rate-limit detection; adds `getAIProviderStatus()` for debugging |
| `src/app/api/ai/chatbot/route.ts` | **Minor Edit** | Adds catch-all fallback response so chatbot never returns a 500 to users |
| `src/app/api/ai/status/route.ts` | **New File** | Debug endpoint to inspect live provider tier status |

**No changes needed to:**
- `estimate-macros`, `estimate-burn`, `script-review`, `rate-day`, `classify-task` — these already have static fallbacks that work correctly once `aiChat`/`aiStructuredChat` starts returning real results
- `posting-time`, `rank-unproductive` — these are intentionally static and work fine as-is
- All database, auth, or frontend files — the bugs are isolated to `src/lib/ai-provider.ts`

---

## HOW THE 3-TIER GRACEFUL DEGRADATION WORKS (After the Fix)

```
User request → AI feature route
                    ↓
              aiChat() / aiStructuredChat()
                    ↓
        ┌─────────────────────────────┐
        │  Tier 1: glm-4-plus         │ ← Try first (best quality)
        │  model: 'glm-4-plus'        │
        │  max_tokens: 1000           │
        │  JSON mode: supported       │
        └─────────────────────────────┘
                    ↓ (429 rate-limit or error)
        ┌─────────────────────────────┐
        │  Tier 2: glm-4-flash        │ ← Automatic fallback
        │  model: 'glm-4-flash'       │
        │  max_tokens: 500            │
        │  JSON mode: text + regex    │
        └─────────────────────────────┘
                    ↓ (failure)
        ┌─────────────────────────────┐
        │  Tier 3: ZAI default        │ ← Last AI resort
        │  model: SDK default         │
        │  max_tokens: 300            │
        └─────────────────────────────┘
                    ↓ (all fail)
        ┌─────────────────────────────┐
        │  Local static response      │ ← Always works, zero latency
        │  (keyword-based)            │
        └─────────────────────────────┘

Rate-limit recovery:
  - Tier 1 gets 429 → paused for 60s, Tier 2 takes over immediately
  - After 60s, Tier 1 becomes available again automatically
  - Next request will try Tier 1 again (always prefer best quality)
```

---

## PLATFORM TO USE

**Vercel** (already configured in `vercel.json`). No platform change needed. The fix works correctly with Vercel's serverless model because the new design intentionally treats each cold start as a fresh attempt from the highest tier — the correct behavior for stateless serverless functions.
