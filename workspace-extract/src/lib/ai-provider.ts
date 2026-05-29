// ── AI Provider — Pollinations AI (Authenticated) ──
//
// Provider: Pollinations AI
//   Authentication: Bearer token via POLLINATIONS_API_KEY (sk_ key)
//   Endpoint: https://text.pollinations.ai/openai/chat/completions (OpenAI-compatible)
//   Model: openai (GPT-4o-mini via Pollinations)
//
// No graceful degradation — direct Pollinations AI call with API key.

const POLLINATIONS_CHAT_URL = 'https://text.pollinations.ai/openai/chat/completions';
const MAX_TOKENS = 4500;
const REQUEST_TIMEOUT_MS = 60000; // 60s for long responses

// ── API Key ──
function getApiKey(): string {
  const key = process.env.POLLINATIONS_API_KEY;
  if (!key) {
    console.error('[AI] POLLINATIONS_API_KEY env var is NOT set!');
  }
  return key || '';
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

// ═══════════════════════════════════════════════════════
// Pollinations Chat Completion (Authenticated)
// ═══════════════════════════════════════════════════════
async function pollinationsChat(
  messages: { role: string; content: string }[],
  maxTokens = MAX_TOKENS,
): Promise<string | null> {
  const apiKey = getApiKey();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const res = await withTimeout(
    fetch(POLLINATIONS_CHAT_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'openai',
        messages,
        max_tokens: maxTokens,
        seed: 42,
      }),
    }),
    REQUEST_TIMEOUT_MS,
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.error(`[AI] Pollinations responded ${res.status}: ${errText.slice(0, 300)}`);
    throw new Error(`Pollinations responded ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || null;

  if (content) {
    console.log(`[AI] OK model=openai tokens_in=${data?.usage?.prompt_tokens || '?'} tokens_out=${data?.usage?.completion_tokens || '?'}`);
  } else {
    console.error('[AI] Pollinations returned empty content:', JSON.stringify(data).slice(0, 300));
  }

  return content;
}

// ═══════════════════════════════════════════════════════
// Public: Chat completion
// ═══════════════════════════════════════════════════════
export async function aiChat(
  messages: { role: string; content: string }[],
  systemPrompt?: string,
  maxTokens = MAX_TOKENS,
): Promise<string> {
  const allMessages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    ...messages,
  ];

  try {
    const result = await pollinationsChat(allMessages, maxTokens);
    if (result) return result;
  } catch (e: any) {
    console.error('[AI] aiChat failed:', e.message);
  }

  // Single retry on failure
  try {
    const result = await pollinationsChat(allMessages, maxTokens);
    if (result) return result;
  } catch (e: any) {
    console.error('[AI] aiChat retry also failed:', e.message);
  }

  return 'I\'m having trouble connecting right now. Please try again in a moment.';
}

// ═══════════════════════════════════════════════════════
// Public: Structured JSON chat
// ═══════════════════════════════════════════════════════
export async function aiStructuredChat<T>(
  messages: { role: string; content: string }[],
  systemPrompt?: string,
  maxTokens = 4500,
): Promise<T | null> {
  const allMessages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    ...messages,
  ];

  try {
    const content = await pollinationsChat(allMessages, maxTokens);
    if (content) {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]) as T;
      }
    }
  } catch (e: any) {
    console.error('[AI] aiStructuredChat failed:', e.message);
  }

  // Single retry
  try {
    const content = await pollinationsChat(allMessages, maxTokens);
    if (content) {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]) as T;
      }
    }
  } catch (e: any) {
    console.error('[AI] aiStructuredChat retry failed:', e.message);
  }

  return null;
}

// ═══════════════════════════════════════════════════════
// Public: Task classifier
// ═══════════════════════════════════════════════════════
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
      120,
    );
    if (result?.category) category = result.category;
    if (result?.productivity) productivity = result.productivity;
    if (result?.suggestion) suggestion = result.suggestion;
  } catch { /* keyword result already computed above */ }

  return { category, productivity, suggestion };
}

// ═══════════════════════════════════════════════════════
// Public: Title generation for conversations
// ═══════════════════════════════════════════════════════
export async function generateTitle(userMessage: string): Promise<string> {
  // First try a keyword-based approach (instant, no API call)
  const titleFromKeywords = extractTitle(userMessage);
  if (titleFromKeywords) return titleFromKeywords;

  // Use AI to generate a title (short, cheap call)
  try {
    const result = await aiStructuredChat<{ title: string }>(
      [{ role: 'user', content: `Generate a very short title (3-5 words max) for a conversation that starts with: "${userMessage.slice(0, 200)}"` }],
      'You generate conversation titles. Respond ONLY with valid JSON: {"title":"Short Title Here"}',
      60,
    );
    if (result?.title) return result.title;
  } catch { /* fallback */ }

  // Final fallback: use first 50 chars of user message
  return userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : '');
}

function extractTitle(message: string): string | null {
  const lower = message.toLowerCase();
  const patterns: [RegExp, (...args: string[]) => string][] = [
    [/roadmap\s+(?:to\s+)?(?:learn\s+)?(.+)/i, (_: string, m: string) => capitalize(m.trim())],
    [/help\s+me\s+(?:learn|study|understand)\s+(.+)/i, (_: string, m: string) => capitalize(m.trim())],
    [/how\s+(?:to|do\s+I)\s+(.+)/i, (_: string, m: string) => capitalize(m.trim())],
    [/what\s+is\s+(.+)/i, (_: string, m: string) => capitalize(m.trim())],
    [/explain\s+(.+)/i, (_: string, m: string) => capitalize(m.trim())],
    [/create\s+(?:a\s+)?(.+)(?:\s+plan|schedule|routine)/i, (_: string, m: string) => capitalize(m.trim()) + ' Plan'],
    [/create\s+(?:a\s+)?(.+)/i, (_: string, m: string) => capitalize(m.trim())],
    [/build\s+(?:a\s+)?(.+)/i, (_: string, m: string) => capitalize(m.trim())],
    [/plan\s+(?:for\s+)?(.+)/i, (_: string, m: string) => capitalize(m.trim()) + ' Plan'],
    [/suggest\s+(.+)/i, (_: string, m: string) => capitalize(m.trim())],
    [/recommend\s+(.+)/i, (_: string, m: string) => capitalize(m.trim())],
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

// ═══════════════════════════════════════════════════════
// Public: Navigator Bot — Preloaded local responses (instant, no API)
// ═══════════════════════════════════════════════════════
export function getNavigatorResponse(userMessage: string): string | null {
  const msg = userMessage.toLowerCase().trim();

  const navPatterns: [RegExp, string][] = [
    [/workout|exercise|gym|fitness log/i, 'You can log workouts and track fitness in the **Fitness** section! Go to **/fitness** to:\n- Log workouts with duration and type\n- Track meals and nutrition\n- View progress charts\n- Get AI macro and calorie burn estimates'],
    [/learn|study|track.*learn|learning/i, 'Track your learning in the **Learn** section at **/learn**! You can:\n- Create learning topics\n- Log study entries with time spent\n- Track progress with charts\n- Share topics with others'],
    [/achievements?|badge|trophy/i, 'View your achievements at **/achievements**! The SRE platform has 100+ badges across learning, fitness, time, and content. Badges range from bronze to platinum based on your milestones.'],
    [/content|script|series|post|publish/i, 'Content creation tools are in the **Content** section at **/content**! You can:\n- Manage content series\n- Track pipeline stages (idea → drafting → editing → published)\n- Get AI script reviews\n- Find best posting times'],
    [/task|todo|productivity|focus|time manage/i, 'Manage tasks and focus in the **Time** section at **/time**! Features include:\n- Create tasks with priorities\n- Focus timer (Pomodoro-style)\n- Day planner with AI rating\n- Task classification (productive/unproductive)'],
    [/dashboard|home|overview|summary/i, 'Your personalized dashboard is at **/home** — it shows your activity summary, stats, quick actions, and recent progress across all areas.'],
    [/analytics|chart|stats|data|progress/i, 'Visual dashboards are at **/analytics**! View charts for learning progress, fitness trends, and focus data across different time periods.'],
    [/profile|account|settings|preferences/i, 'Access your profile at **/profile** and settings at **/settings**. Your profile shows stats, achievements, and activity. Settings has account preferences.'],
    [/social|feed|follow|discover|community/i, 'Social features include:\n- **/feed** — See posts from people you follow\n- **/discover** — Find new users and content\n- **/leaderboard** — Community XP rankings'],
    [/message|chat|dm|friend/i, 'Communication features:\n- **/messages** — Direct messages and group chats\n- **/friends** — Your friends list\n- **/notifications** — Activity notifications'],
    [/ai|assistant|hub|chat/i, 'The **AI Hub** at **/ai-hub** is your unified AI chat center! Choose from 6 specialized assistants:\n- Main Assistant (general)\n- Learning Tutor\n- Fitness Coach\n- Productivity Coach\n- Content Assistant\n- Platform Navigator'],
    [/phase|start|restart|explore|onboard/i, 'SRE uses a **Phase system**:\n- **Start** — Begin something new\n- **Restart** — Return to paused goals\n- **Explore** — Discover new interests\n\nVisit **/onboarding** to set up your phases and interests.'],
    [/xp|level|rank|point/i, 'The **XP System** rewards every activity! Earn XP for logging workouts, studying, creating content, and more. Level up with increasing thresholds. Check your rank at **/leaderboard**.'],
    [/streak|daily|consecutive|quest/i, 'Track **Streaks** for consecutive active days and complete **Daily Quests** for bonus XP! Both appear on your dashboard at **/home**.'],
    [/navigate|how.*find|where.*go|where.*is|how.*use|help.*use/i, 'I can help you navigate! The SRE platform has these main sections:\n\n- **/home** — Dashboard\n- **/learn** — Learning tracker\n- **/fitness** — Fitness & nutrition\n- **/content** — Content creation\n- **/time** — Tasks & focus\n- **/ai-hub** — AI assistants\n- **/analytics** — Data dashboards\n- **/achievements** — Badges\n\nWhat would you like to find?'],
    [/hello|hi|hey|greet/i, 'Hello! I\'m the SRE Navigator, your guide to the platform. Ask me anything about where to find features, how to use tools, or what each section does!'],
    [/thank|thanks/i, 'You\'re welcome! If you need any more help navigating the SRE platform, just ask. I\'m always here to help!'],
  ];

  for (const [pattern, response] of navPatterns) {
    if (pattern.test(msg)) return response;
  }

  // No match — return null to let the AI API handle it
  return null;
}

// ═══════════════════════════════════════════════════════
// Public: Quick AI call for estimate-macros and estimate-burn
// ═══════════════════════════════════════════════════════
export async function aiQuickCall(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 100,
): Promise<string | null> {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  try {
    const result = await pollinationsChat(messages, maxTokens);
    if (result) return result;
  } catch (e: any) {
    console.error('[AI] aiQuickCall failed:', e.message);
  }

  // Single retry
  try {
    const result = await pollinationsChat(messages, maxTokens);
    if (result) return result;
  } catch (e: any) {
    console.error('[AI] aiQuickCall retry failed:', e.message);
  }

  return null;
}

// ═══════════════════════════════════════════════════════
// Public: Check if API key is configured
// ═══════════════════════════════════════════════════════
export function isApiKeyConfigured(): boolean {
  return !!getApiKey();
}
