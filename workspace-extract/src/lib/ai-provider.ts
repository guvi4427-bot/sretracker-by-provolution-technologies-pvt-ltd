// ── AI Provider — Pollinations AI (free, no key, no rate limit, real LLM) ──
// Primary:  Pollinations openai model (GPT-4o proxy) — free, no auth
// Fallback: Pollinations mistral model — free, no auth
// Final:    Pollinations text endpoint — simplest, always works
//
// Pollinations AI: https://pollinations.ai
// OpenAI-compatible endpoint: POST https://text.pollinations.ai/openai
// No API key. No rate limit. No account needed. Works from any server.

const POLLINATIONS_OPENAI = 'https://text.pollinations.ai/openai';
const POLLINATIONS_TEXT   = 'https://text.pollinations.ai/';

const REQUEST_TIMEOUT_MS = 25000; // 25s — Pollinations can be slow on cold start

function withTimeout<T>(promise: Promise<T>, ms = REQUEST_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
    ),
  ]);
}

// ── Tier 1 & 2: OpenAI-compatible endpoint with model fallback ──
async function pollinationsChat(
  messages: { role: string; content: string }[],
  model: 'openai' | 'mistral' = 'openai',
  maxTokens = 500
): Promise<string | null> {
  const res = await fetch(POLLINATIONS_OPENAI, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      seed: 42, // consistent responses
    }),
  });

  if (!res.ok) throw new Error(`Pollinations ${model} responded ${res.status}`);

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  return content || null;
}

// ── Tier 3: Simple text endpoint (most reliable fallback) ──
async function pollinationsText(prompt: string): Promise<string | null> {
  const encoded = encodeURIComponent(prompt.slice(0, 500)); // URL-safe
  const res = await fetch(`${POLLINATIONS_TEXT}${encoded}`, {
    method: 'GET',
    headers: { 'Accept': 'text/plain' },
  });
  if (!res.ok) throw new Error(`Pollinations text responded ${res.status}`);
  const text = await res.text();
  return text?.trim() || null;
}

// ── Public: Chat completion ──
// Used by: chatbot, rate-day, script-review, estimate-burn
export async function aiChat(
  messages: { role: string; content: string }[],
  systemPrompt?: string,
  maxTokens = 500
): Promise<string> {
  const allMessages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    ...messages,
  ];

  // Tier 1: GPT-4o via Pollinations
  try {
    const result = await withTimeout(pollinationsChat(allMessages, 'openai', maxTokens));
    if (result) return result;
  } catch (e: any) {
    console.warn('[AI] Pollinations openai failed:', e.message);
  }

  // Tier 2: Mistral via Pollinations
  try {
    const result = await withTimeout(pollinationsChat(allMessages, 'mistral', maxTokens));
    if (result) return result;
  } catch (e: any) {
    console.warn('[AI] Pollinations mistral failed:', e.message);
  }

  // Tier 3: Simple text endpoint
  try {
    const lastMessage = messages[messages.length - 1]?.content || '';
    const prompt = systemPrompt
      ? `${systemPrompt}\n\nUser: ${lastMessage}`
      : lastMessage;
    const result = await withTimeout(pollinationsText(prompt), 15000);
    if (result) return result;
  } catch (e: any) {
    console.warn('[AI] Pollinations text failed:', e.message);
  }

  return "I'm having trouble connecting right now. Please try again in a moment.";
}

// ── Public: Structured JSON chat ──
// Used by: estimate-macros, classify-task, script-review
export async function aiStructuredChat<T>(
  messages: { role: string; content: string }[],
  systemPrompt?: string,
  maxTokens = 300
): Promise<T | null> {
  const allMessages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    ...messages,
  ];

  // Tier 1: GPT-4o — best at following JSON instructions
  try {
    const result = await withTimeout(pollinationsChat(allMessages, 'openai', maxTokens));
    if (result) {
      const match = result.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]) as T;
    }
  } catch (e: any) {
    console.warn('[AI] Structured openai failed:', e.message);
  }

  // Tier 2: Mistral
  try {
    const result = await withTimeout(pollinationsChat(allMessages, 'mistral', maxTokens));
    if (result) {
      const match = result.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]) as T;
    }
  } catch (e: any) {
    console.warn('[AI] Structured mistral failed:', e.message);
  }

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
