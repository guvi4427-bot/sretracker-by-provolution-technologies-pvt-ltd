// ── AI Provider — Multi-tier Provider Chain with Graceful Degradation ──
//
// Provider Priority:
//   Tier 1: Pollinations GPT-4o (free, no key)
//   Tier 2: Pollinations Mistral (free, no key)
//   Tier 3: Lightweight prompt retry (shorter messages)
//   Tier 4: Pollinations text endpoint (simplest)
//   Tier 5: z-ai-web-dev-sdk (safe dynamic import, fallback)
//
// Features:
//   - Dynamic maxTokens: adapts to input size (4x input, min 500, max 8000)
//   - Safe z-ai SDK integration via try/catch dynamic import
//   - Rate-limit detection on Pollinations → automatic z-ai fallback
//   - Final error: "We are experiencing technical difficulties please try again later"
//   - Telemetry: provider, latency, tokens, retry count, errors

const POLLINATIONS_OPENAI = 'https://text.pollinations.ai/openai';
const POLLINATIONS_TEXT   = 'https://text.pollinations.ai/';

const REQUEST_TIMEOUT_MS = 30000;
const MIN_TOKENS = 500;
const MAX_TOKENS = 8000;

// ── Dynamic Token Allocation ──
// Estimates input token count and allocates enough output tokens
// so content/context loss never occurs, while staying within provider limits.
export function calculateMaxTokens(messages: { role: string; content: string }[]): number {
  // Rough estimate: ~4 chars per token for English, ~2 for code-heavy
  const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
  const estimatedInputTokens = Math.ceil(totalChars / 3.5);

  // Allocate 4x the input tokens for output, bounded by [MIN, MAX]
  const dynamicTokens = Math.max(MIN_TOKENS, Math.min(MAX_TOKENS, estimatedInputTokens * 4));

  return dynamicTokens;
}

// ── Telemetry Types ──
export interface AITelemetry {
  provider: string;
  model: string;
  latencyMs: number;
  tokensIn?: number;
  tokensOut?: number;
  retryCount: number;
  fallbackUsed: boolean;
  success: boolean;
  errorType?: string;
  errorMessage?: string;
  timestamp: string;
}

// In-memory telemetry store (last 100 calls) for admin analytics
const telemetryStore: AITelemetry[] = [];
const MAX_TELEMETRY = 100;

function recordTelemetry(t: AITelemetry) {
  telemetryStore.push(t);
  if (telemetryStore.length > MAX_TELEMETRY) telemetryStore.shift();
  console.log(`[AI] ${t.success ? 'OK' : 'FAIL'} provider=${t.provider}/${t.model} latency=${t.latencyMs}ms retries=${t.retryCount}${t.errorType ? ` error=${t.errorType}` : ''}`);
}

export function getTelemetry(): AITelemetry[] {
  return [...telemetryStore];
}

export function getTelemetryStats() {
  const total = telemetryStore.length || 1;
  const successes = telemetryStore.filter(t => t.success).length;
  const byProvider: Record<string, { count: number; successes: number; avgLatency: number }> = {};

  for (const t of telemetryStore) {
    const key = `${t.provider}/${t.model}`;
    if (!byProvider[key]) byProvider[key] = { count: 0, successes: 0, avgLatency: 0 };
    byProvider[key].count++;
    if (t.success) byProvider[key].successes++;
    byProvider[key].avgLatency += t.latencyMs;
  }
  for (const k of Object.keys(byProvider)) {
    byProvider[k].avgLatency = Math.round(byProvider[k].avgLatency / byProvider[k].count);
  }

  return {
    totalCalls: total,
    successRate: Math.round((successes / total) * 100),
    fallbackRate: Math.round((telemetryStore.filter(t => t.fallbackUsed).length / total) * 100),
    avgLatency: Math.round(telemetryStore.reduce((a, t) => a + t.latencyMs, 0) / total),
    byProvider,
  };
}

// ── Timeout Helper ──
function withTimeout<T>(promise: Promise<T>, ms = REQUEST_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);
}

// ── Rate Limit Detection ──
function isRateLimitError(error: any): boolean {
  const msg = (error?.message || '').toLowerCase();
  const status = error?.status || 0;
  return status === 429 || msg.includes('rate') || msg.includes('limit') || msg.includes('too many');
}

// ── Tier 1 & 2: OpenAI-compatible endpoint with model fallback ──
async function pollinationsChat(
  messages: { role: string; content: string }[],
  model: 'openai' | 'mistral' = 'openai',
  maxTokens = MAX_TOKENS
): Promise<{ content: string | null; tokensIn: number; tokensOut: number }> {
  const res = await fetch(POLLINATIONS_OPENAI, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      seed: 42,
    }),
  });

  if (!res.ok) {
    const error: any = new Error(`Pollinations ${model} responded ${res.status}`);
    error.status = res.status;
    throw error;
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  const usage = data?.usage;
  return {
    content: content || null,
    tokensIn: usage?.prompt_tokens || 0,
    tokensOut: usage?.completion_tokens || 0,
  };
}

// ── Tier 3: Simple text endpoint ──
async function pollinationsText(prompt: string): Promise<string | null> {
  const encoded = encodeURIComponent(prompt.slice(0, 2000));
  const res = await fetch(`${POLLINATIONS_TEXT}${encoded}`, {
    method: 'GET',
    headers: { 'Accept': 'text/plain' },
  });
  if (!res.ok) throw new Error(`Pollinations text responded ${res.status}`);
  const text = await res.text();
  return text?.trim() || null;
}

// ── Tier 5: z-ai-web-dev-sdk (SAFE dynamic import) ──
// Uses try/catch with dynamic import to prevent site crash.
// Only activated when Pollinations hits rate limits.
async function zaiChat(
  messages: { role: string; content: string }[],
  systemPrompt?: string,
): Promise<string | null> {
  try {
    // Dynamic import wrapped in try/catch — if the SDK is broken/missing,
    // this will catch the error and return null instead of crashing the site.
    const ZAIModule = await import('z-ai-web-dev-sdk').catch(() => null);
    if (!ZAIModule) {
      console.log('[AI] z-ai-web-dev-sdk not available, skipping');
      return null;
    }
    const ZAI = ZAIModule.default;
    if (!ZAI || typeof ZAI.create !== 'function') {
      console.log('[AI] z-ai-web-dev-sdk invalid, skipping');
      return null;
    }
    const zai = await ZAI.create();
    const allMessages = [
      ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
      ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ];
    const completion = await zai.chat.completions.create({
      messages: allMessages,
    });
    return completion.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.log('[AI] z-ai-web-dev-sdk error (non-fatal):', err instanceof Error ? err.message : 'unknown');
    return null;
  }
}

// ── Provider Attempt with Telemetry ──
async function attemptProvider(
  providerName: string,
  modelName: string,
  fn: () => Promise<string | null>,
  retryCount: number,
  fallbackUsed: boolean,
): Promise<{ result: string | null; telemetry: AITelemetry; isRateLimited?: boolean }> {
  const start = Date.now();
  try {
    const result = await withTimeout(fn(), REQUEST_TIMEOUT_MS);
    const latencyMs = Date.now() - start;
    const telemetry: AITelemetry = {
      provider: providerName,
      model: modelName,
      latencyMs,
      retryCount,
      fallbackUsed,
      success: !!result,
      timestamp: new Date().toISOString(),
    };
    recordTelemetry(telemetry);
    return { result, telemetry, isRateLimited: false };
  } catch (e: any) {
    const latencyMs = Date.now() - start;
    const rateLimited = isRateLimitError(e);
    const telemetry: AITelemetry = {
      provider: providerName,
      model: modelName,
      latencyMs,
      retryCount,
      fallbackUsed,
      success: false,
      errorType: rateLimited ? 'rate_limit' : e.message?.includes('Timeout') ? 'timeout' : 'provider_error',
      errorMessage: e.message?.slice(0, 200),
      timestamp: new Date().toISOString(),
    };
    recordTelemetry(telemetry);
    return { result: null, telemetry, isRateLimited: rateLimited };
  }
}

// ── The final error message shown ONLY when ALL providers are exhausted ──
const ALL_PROVIDERS_EXHAUSTED = 'We are experiencing technical difficulties please try again later';

// ── Public: Chat completion with retry chain ──
// Used by: chatbot, rate-day, script-review, estimate-burn, all AI features
export async function aiChat(
  messages: { role: string; content: string }[],
  systemPrompt?: string,
  maxTokens?: number,
): Promise<string> {
  const allMessages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    ...messages,
  ];

  // Dynamic token allocation if not explicitly provided
  const tokens = maxTokens || calculateMaxTokens(allMessages);

  let pollinationsRateLimited = false;

  const providers: Array<() => Promise<{ result: string | null; telemetry: AITelemetry; isRateLimited?: boolean }>> = [
    // Tier 1: Pollinations GPT-4o
    () => attemptProvider('pollinations', 'gpt-4o', async () => {
      const r = await pollinationsChat(allMessages, 'openai', tokens);
      return r.content;
    }, 0, false),
    // Tier 2: Pollinations Mistral
    () => attemptProvider('pollinations', 'mistral', async () => {
      const r = await pollinationsChat(allMessages, 'mistral', tokens);
      return r.content;
    }, 1, true),
    // Tier 3: Lightweight prompt retry (shorter messages)
    () => attemptProvider('pollinations', 'gpt-4o-lite', async () => {
      const lastMessage = messages[messages.length - 1]?.content || '';
      const liteMessages = systemPrompt
        ? [{ role: 'system' as const, content: systemPrompt.slice(0, 500) }, { role: 'user' as const, content: lastMessage }]
        : [{ role: 'user' as const, content: lastMessage }];
      const r = await pollinationsChat(liteMessages, 'openai', Math.min(tokens, 2000));
      return r.content;
    }, 2, true),
    // Tier 4: Pollinations text endpoint
    () => attemptProvider('pollinations', 'text', async () => {
      const lastMessage = messages[messages.length - 1]?.content || '';
      const prompt = systemPrompt
        ? `${systemPrompt}\n\nUser: ${lastMessage}`
        : lastMessage;
      return pollinationsText(prompt);
    }, 3, true),
    // Tier 5: z-ai-web-dev-sdk (safe dynamic import, used when Pollinations is rate-limited)
    () => attemptProvider('z-ai', 'default', async () => {
      return zaiChat(messages, systemPrompt);
    }, 4, true),
  ];

  // Try each provider in sequence
  for (const providerFn of providers) {
    try {
      const { result, isRateLimited } = await providerFn();
      if (isRateLimited) pollinationsRateLimited = true;
      if (result) return result;
    } catch {
      // Continue to next provider
    }
  }

  // All providers failed — return the standard error message
  console.error(`[AI] All providers failed for aiChat (pollinations rate-limited: ${pollinationsRateLimited})`);
  return ALL_PROVIDERS_EXHAUSTED;
}

// ── Public: Structured JSON chat ──
// Used by: estimate-macros, classify-task, script-review
export async function aiStructuredChat<T>(
  messages: { role: string; content: string }[],
  systemPrompt?: string,
  maxTokens?: number,
): Promise<T | null> {
  const allMessages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    ...messages,
  ];

  const tokens = maxTokens || Math.min(calculateMaxTokens(allMessages), 2000);

  // Tier 1: GPT-4o — best at following JSON instructions
  try {
    const start = Date.now();
    const r = await withTimeout(pollinationsChat(allMessages, 'openai', tokens));
    const latencyMs = Date.now() - start;
    if (r.content) {
      const match = r.content.match(/\{[\s\S]*\}/);
      if (match) {
        recordTelemetry({ provider: 'pollinations', model: 'gpt-4o-structured', latencyMs, tokensIn: r.tokensIn, tokensOut: r.tokensOut, retryCount: 0, fallbackUsed: false, success: true, timestamp: new Date().toISOString() });
        return JSON.parse(match[0]) as T;
      }
    }
    recordTelemetry({ provider: 'pollinations', model: 'gpt-4o-structured', latencyMs, tokensIn: r.tokensIn, tokensOut: r.tokensOut, retryCount: 0, fallbackUsed: false, success: false, errorType: 'malformed_response', timestamp: new Date().toISOString() });
  } catch (e: any) {
    recordTelemetry({ provider: 'pollinations', model: 'gpt-4o-structured', latencyMs: 0, retryCount: 0, fallbackUsed: false, success: false, errorType: isRateLimitError(e) ? 'rate_limit' : 'timeout', errorMessage: e.message?.slice(0, 200), timestamp: new Date().toISOString() });
  }

  // Tier 2: Mistral
  try {
    const start = Date.now();
    const r = await withTimeout(pollinationsChat(allMessages, 'mistral', tokens));
    const latencyMs = Date.now() - start;
    if (r.content) {
      const match = r.content.match(/\{[\s\S]*\}/);
      if (match) {
        recordTelemetry({ provider: 'pollinations', model: 'mistral-structured', latencyMs, tokensIn: r.tokensIn, tokensOut: r.tokensOut, retryCount: 1, fallbackUsed: true, success: true, timestamp: new Date().toISOString() });
        return JSON.parse(match[0]) as T;
      }
    }
  } catch { /* fall through */ }

  // Tier 3: z-ai-web-dev-sdk (safe fallback)
  try {
    const zaiResult = await zaiChat(messages, systemPrompt);
    if (zaiResult) {
      const match = zaiResult.match(/\{[\s\S]*\}/);
      if (match) {
        recordTelemetry({ provider: 'z-ai', model: 'default-structured', latencyMs: 0, retryCount: 2, fallbackUsed: true, success: true, timestamp: new Date().toISOString() });
        return JSON.parse(match[0]) as T;
      }
    }
  } catch { /* fall through */ }

  return null;
}

// ── Public: Task classifier ──
// Used by: classify-task route
export async function aiClassifyTask(
  title: string,
  description?: string
): Promise<{ category: string; productivity: string; suggestion?: string }> {
  const text = `${title} ${description || ''}`.toLowerCase();

  // Keyword baseline — instant, always runs first
  const CATS: Record<string, string[]> = {
    work:     ['meeting','email','report','presentation','deadline','project','client','review','code','deploy','git','standup','sprint','task','assign','deliver','proposal','invoice','contract'],
    personal: ['grocery','clean','laundry','cook','bill','pay','appointment','family','friend','home','repair','organize','shopping'],
    health:   ['gym','workout','exercise','run','walk','yoga','meditation','doctor','medicine','sleep','stretch','vitamin','water','diet','protein','meal prep'],
    learning: ['study','read','book','course','tutorial','learn','practice','research','homework','quiz','exam','note','revise','certificate'],
  };
  const UNPRODUCTIVE = ['scroll','binge','procrastinate','lazy','waste','distraction','social media','netflix','youtube browse','doom scroll','overthink','complain','idle','nothing','instagram reels','reels','tiktok scroll','shorts','scrolling','mindless browsing','youtube shorts','snapchat','facebook scroll','instagram','tiktok'];
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
    scrolling: 'Try: Put your phone down and do a 5-minute stretch or walk',
  };

  let category = 'other', maxMatches = 0;
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
  if (!suggestion && isUnproductive) {
    suggestion = 'Try replacing this with a 15-minute learning or exercise activity';
  }

  // Enhance with real AI
  try {
    const result = await aiStructuredChat<{ category: string; productivity: string; suggestion?: string }>(
      [{ role: 'user', content: `Classify this task: "${title}". ${description || ''}` }],
      'You are a task classifier. Respond ONLY with valid JSON: {"category":"work|personal|health|learning|other","productivity":"productive|unproductive","suggestion":"short replacement tip if unproductive, omit if productive"}',
      120
    );
    if (result?.category) category = result.category;
    if (result?.productivity) productivity = result.productivity;
    if (result?.suggestion) suggestion = result.suggestion;
  } catch { /* keyword result already computed above */ }

  return { category, productivity, suggestion };
}

// ── Title Generation ──
// Generates a short conversation title from the first user message
export async function generateTitle(userMessage: string): Promise<string> {
  // First try a keyword-based approach (instant, no AI call)
  const titleFromKeywords = extractTitle(userMessage);
  if (titleFromKeywords) return titleFromKeywords;

  // Fallback: use AI to generate a title (short, cheap call)
  try {
    const result = await aiStructuredChat<{ title: string }>(
      [{ role: 'user', content: `Generate a very short title (3-5 words max) for a conversation that starts with: "${userMessage.slice(0, 200)}"` }],
      'You generate conversation titles. Respond ONLY with valid JSON: {"title":"Short Title Here"}',
      60
    );
    if (result?.title) return result.title;
  } catch { /* fallback */ }

  // Final fallback: use first 50 chars of user message
  return userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : '');
}

function extractTitle(message: string): string | null {
  const lower = message.toLowerCase();
  const patterns: [RegExp, string][] = [
    [/roadmap\s+(?:to\s+)?(?:learn\s+)?(.+)/i, (_, m) => capitalize(m.trim())],
    [/help\s+me\s+(?:learn|study|understand)\s+(.+)/i, (_, m) => capitalize(m.trim())],
    [/how\s+(?:to|do\s+I)\s+(.+)/i, (_, m) => capitalize(m.trim())],
    [/what\s+is\s+(.+)/i, (_, m) => capitalize(m.trim())],
    [/explain\s+(.+)/i, (_, m) => capitalize(m.trim())],
    [/create\s+(?:a\s+)?(.+)(?:\s+plan|schedule|routine)/i, (_, m) => capitalize(m.trim()) + ' Plan'],
    [/create\s+(?:a\s+)?(.+)/i, (_, m) => capitalize(m.trim())],
    [/build\s+(?:a\s+)?(.+)/i, (_, m) => capitalize(m.trim())],
    [/plan\s+(?:for\s+)?(.+)/i, (_, m) => capitalize(m.trim()) + ' Plan'],
    [/suggest\s+(.+)/i, (_, m) => capitalize(m.trim())],
    [/recommend\s+(.+)/i, (_, m) => capitalize(m.trim())],
  ];

  for (const [regex, formatter] of patterns) {
    const match = lower.match(regex);
    if (match) {
      const title = formatter(match[0], match[1]);
      if (title && title.length > 2 && title.length < 60) return title;
    }
  }
  return null;
}

function capitalize(str: string): string {
  return str.replace(/\b\w/g, c => c.toUpperCase()).replace(/\s+/g, ' ').trim();
}
