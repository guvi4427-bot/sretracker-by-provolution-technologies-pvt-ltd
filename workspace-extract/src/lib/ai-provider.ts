import ZAI from 'z-ai-web-dev-sdk';

// ── Tiered Multi-Model AI System ──
// Provider 0: High-power (rate-limited, higher max_tokens, JSON mode)
// Provider 1: Low-power (no rate limit, lower max_tokens, text mode)
// Automatic switching: On 429/rate-limit → cooldown high-power → use low-power
// Retry logic: On failure, try next provider immediately

interface AIProvider {
  name: string;
  cooldownUntil: number;
  rateLimited: boolean;
  failCount: number;        // consecutive failures
  lastFailAt: number;       // timestamp of last failure
}

const providers: AIProvider[] = [
  { name: 'zai-high', cooldownUntil: 0, rateLimited: false, failCount: 0, lastFailAt: 0 },
  { name: 'zai-low', cooldownUntil: 0, rateLimited: false, failCount: 0, lastFailAt: 0 },
];

const RATE_LIMIT_COOLDOWN = 60000;     // 1 min cooldown on rate limit
const MAX_CONSECUTIVE_FAILS = 3;       // after 3 fails, skip provider for 30s
const FAIL_BACKOFF = 30000;            // backoff after too many fails

let zaiInstance: any = null;

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

function isProviderAvailable(p: AIProvider): boolean {
  const now = Date.now();
  if (p.rateLimited && now < p.cooldownUntil) return false;
  if (p.failCount >= MAX_CONSECUTIVE_FAILS && now - p.lastFailAt < FAIL_BACKOFF) return false;
  return true;
}

function markProviderSuccess(p: AIProvider) {
  p.rateLimited = false;
  p.failCount = 0;
  p.lastFailAt = 0;
}

function markProviderFail(p: AIProvider, isRateLimit: boolean) {
  p.failCount++;
  p.lastFailAt = Date.now();
  if (isRateLimit) {
    p.rateLimited = true;
    p.cooldownUntil = Date.now() + RATE_LIMIT_COOLDOWN;
    console.log(`[AI] ${p.name} rate-limited, switching to next provider`);
  }
  if (p.failCount >= MAX_CONSECUTIVE_FAILS) {
    console.log(`[AI] ${p.name} hit ${MAX_CONSECUTIVE_FAILS} consecutive fails, backing off for ${FAIL_BACKOFF / 1000}s`);
  }
}

export async function aiChat(
  messages: { role: string; content: string }[],
  systemPrompt?: string,
  maxTokens: number = 500
): Promise<string> {
  const allMessages = [
    ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
    ...messages.map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content })),
  ];

  // Try each available provider in order (high-power → low-power)
  for (const provider of providers) {
    if (!isProviderAvailable(provider)) continue;

    try {
      const zai = await getZAI();
      const isHighPower = provider.name === 'zai-high';
      const result = await zai.chat.completions.create({
        messages: allMessages,
        max_tokens: isHighPower ? maxTokens : Math.min(maxTokens, 200),
      });
      const content = result.choices?.[0]?.message?.content;
      if (content) {
        markProviderSuccess(provider);
        return content;
      }
    } catch (error: any) {
      const isRateLimit = error?.status === 429 || error?.message?.includes('rate') || error?.message?.includes('limit');
      markProviderFail(provider, isRateLimit);
      console.warn(`[AI] ${provider.name} failed:`, error?.message);
    }
  }

  // All providers failed → local fallback
  return generateLocalResponse(messages);
}

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

// ── AI with JSON response format for structured outputs ──
// Tries high-power with JSON mode first, then low-power with text+regex extraction,
// then a second attempt on low-power with simplified prompt
export async function aiStructuredChat<T>(
  messages: { role: string; content: string }[],
  systemPrompt?: string,
  maxTokens: number = 300
): Promise<T | null> {
  const allMessages = [
    ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
    ...messages.map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content })),
  ];

  // Attempt 1: High-power AI with JSON mode
  const highProvider = providers[0];
  if (isProviderAvailable(highProvider)) {
    try {
      const zai = await getZAI();
      const result = await zai.chat.completions.create({
        messages: allMessages,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
      } as any);
      const content = result.choices?.[0]?.message?.content;
      if (content) {
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          markProviderSuccess(highProvider);
          return JSON.parse(match[0]) as T;
        }
      }
    } catch (error: any) {
      const isRateLimit = error?.status === 429 || error?.message?.includes('rate') || error?.message?.includes('limit');
      markProviderFail(highProvider, isRateLimit);
      console.warn(`[AI] ${highProvider.name} JSON failed:`, error?.message);
    }
  }

  // Attempt 2: Low-power AI with text mode + regex JSON extraction
  const lowProvider = providers[1];
  if (isProviderAvailable(lowProvider)) {
    try {
      const zai = await getZAI();
      const result = await zai.chat.completions.create({
        messages: allMessages,
        max_tokens: Math.min(maxTokens, 200),
      });
      const content = result.choices?.[0]?.message?.content;
      if (content) {
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          markProviderSuccess(lowProvider);
          return JSON.parse(match[0]) as T;
        }
      }
    } catch (error: any) {
      const isRateLimit = error?.status === 429 || error?.message?.includes('rate') || error?.message?.includes('limit');
      markProviderFail(lowProvider, isRateLimit);
      console.warn(`[AI] ${lowProvider.name} JSON failed:`, error?.message);
    }
  }

  // Attempt 3: Retry high-power if cooldown has expired by now
  // (useful for cases where the low-power attempt took enough time)
  if (isProviderAvailable(highProvider)) {
    try {
      const zai = await getZAI();
      const result = await zai.chat.completions.create({
        messages: allMessages,
        max_tokens: Math.min(maxTokens, 150),
      });
      const content = result.choices?.[0]?.message?.content;
      if (content) {
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          markProviderSuccess(highProvider);
          return JSON.parse(match[0]) as T;
        }
      }
    } catch (error: any) {
      const isRateLimit = error?.status === 429 || error?.message?.includes('rate') || error?.message?.includes('limit');
      markProviderFail(highProvider, isRateLimit);
    }
  }

  return null;
}

export async function aiClassifyTask(title: string, description?: string): Promise<{
  category: string;
  productivity: string;
  suggestion?: string;
}> {
  const text = `${title} ${description || ''}`.toLowerCase();

  // Keyword-based classification (always available as fallback)
  const CATEGORY_KEYWORDS: Record<string, string[]> = {
    work: ['meeting', 'email', 'report', 'presentation', 'deadline', 'project', 'client', 'review', 'code', 'deploy', 'git', 'jira', 'standup', 'sprint', 'task', 'assign', 'deliver', 'submit', 'proposal', 'invoice', 'contract'],
    personal: ['grocery', 'clean', 'laundry', 'cook', 'bill', 'pay', 'appointment', 'family', 'friend', 'call mom', 'call dad', 'home', 'repair', 'organize', 'shopping'],
    health: ['gym', 'workout', 'exercise', 'run', 'walk', 'yoga', 'meditation', 'doctor', 'medicine', 'sleep', 'stretch', 'dentist', 'vitamin', 'water', 'diet', 'protein', 'meal prep'],
    learning: ['study', 'read', 'book', 'course', 'tutorial', 'learn', 'practice', 'research', 'lecture', 'homework', 'quiz', 'exam', 'note', 'revise', 'certificate'],
  };

  const UNPRODUCTIVE_KEYWORDS = ['scroll', 'binge', 'procrastinate', 'lazy', 'waste', 'distraction', 'social media', 'netflix', 'youtube browse', 'doom scroll', 'overthink', 'complain', 'idle', 'nothing', 'instagram reels', 'reels', 'tiktok scroll', 'shorts', 'social media scroll', 'twitter scroll', 'reddit scroll', 'scrolling', 'mindless browsing', 'time waste', 'idle browsing', 'youtube shorts', 'snapchat', 'facebook scroll', 'instagram', 'tiktok'];

  let category = 'other';
  let maxMatches = 0;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matches = keywords.filter(kw => text.includes(kw)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      category = cat;
    }
  }

  const isUnproductive = UNPRODUCTIVE_KEYWORDS.some(kw => text.includes(kw));
  let productivity = isUnproductive ? 'unproductive' : 'productive';

  let suggestion: string | undefined;
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

  for (const [keyword, sug] of Object.entries(SUGGESTIONS)) {
    if (text.includes(keyword)) { suggestion = sug; break; }
  }
  if (!suggestion && isUnproductive) {
    suggestion = 'Try replacing this with a 15-minute learning or exercise activity';
  }

  // Try AI for better classification
  try {
    const result = await aiStructuredChat<{category: string; productivity: string; suggestion?: string}>(
      [{ role: 'user', content: `Classify this task. Task: ${title}. ${description || ''}` }],
      'Classify this task. Respond ONLY with valid JSON: {"category":"work|personal|health|learning|other","productivity":"productive|unproductive","suggestion":"optional replacement if unproductive"}',
      100
    );
    if (result) {
      if (result.category) category = result.category;
      if (result.productivity) productivity = result.productivity;
      if (result.suggestion) suggestion = result.suggestion;
    }
  } catch {
    // Use keyword-based fallback
  }

  return { category, productivity, suggestion };
}
