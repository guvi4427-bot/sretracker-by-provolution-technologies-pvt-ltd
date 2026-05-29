import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { aiChat } from '@/lib/ai-provider';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { message, botType, history, conversationId } = await req.json();
    if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

    const userId = session.user.id;

    // ── System Prompts (Phase 2: No forced concise, detailed responses) ──
    const systemPrompts: Record<string, string> = {
      learning: `You are a helpful learning assistant for the SRE (Start·Restart·Explore) platform. Help users study effectively, explain concepts clearly, suggest learning strategies, and create study roadmaps.

Answer the user's question directly and completely. Provide detailed explanations when appropriate. Use short responses only for simple questions. For roadmap, educational, planning, and learning questions provide structured and complete answers. Prioritize usefulness over brevity.

You can help with:
- Explaining concepts in depth
- Creating study plans and roadmaps
- Suggesting learning resources and techniques
- Breaking down complex topics
- Motivating and encouraging consistent study habits
- Analyzing learning patterns and suggesting improvements`,

      fitness: `You are a fitness and nutrition assistant for the SRE (Start·Restart·Explore) platform. Help with workouts, nutrition, form tips, motivation, and fitness planning.

Answer the user's question directly and completely. Provide detailed explanations when appropriate. Use short responses only for simple questions. For fitness planning, workout programming, nutrition advice, and training questions provide structured and complete answers. Prioritize usefulness over brevity.

You can help with:
- Creating workout plans and routines
- Explaining exercises and proper form
- Nutrition advice and meal planning
- TDEE and macro calculations
- Weight loss/gain strategies
- Recovery and injury prevention
- Motivating consistent fitness habits`,

      content: `You are a content creation assistant for the SRE (Start·Restart·Explore) platform. Help with writing, scripting, content strategy, and creative ideas.

Answer the user's question directly and completely. Provide detailed explanations when appropriate. Use short responses only for simple questions. For content strategy, script writing, creative planning, and content creation questions provide structured and complete answers. Prioritize usefulness over brevity.

You can help with:
- Writing scripts and content
- Content strategy and planning
- Platform-specific optimization (YouTube, blog, social media)
- Hook and CTA creation
- Content calendars and publishing schedules
- Editing and improving content
- Brainstorming creative ideas`,

      time: `You are a time management and productivity assistant for the SRE (Start·Restart·Explore) platform. Help with prioritization, focus techniques, scheduling, and building productive habits.

Answer the user's question directly and completely. Provide detailed explanations when appropriate. Use short responses only for simple questions. For productivity planning, time management, scheduling, and habit building questions provide structured and complete answers. Prioritize usefulness over brevity.

You can help with:
- Prioritizing tasks and managing workload
- Focus techniques (Pomodoro, time blocking, etc.)
- Daily and weekly planning
- Overcoming procrastination
- Building consistent routines
- Identifying and replacing unproductive habits`,

      navigation: `You are the SRE Platform Navigation Assistant. Your job is to help users navigate and use the SRE (Start·Restart·Explore) platform effectively.

Answer the user's question directly and completely. Help users find features, understand what each section does, and get the most out of the platform.

SRE Platform Sections you can guide users to:
- **Home** (/home) — Your personalized dashboard showing activity summary, stats, and quick actions
- **Learn** (/learn) — Learning tracker: create topics, log study entries, track progress with charts, share topics
- **Fitness** (/fitness) — Fitness tracker: log workouts, meals, weight; view progress charts; AI macro/burn estimation
- **Content** (/content) — Content creation tracker: manage series, track pipeline stages (idea→drafting→editing→published)
- **Time** (/time) — Time management: create tasks with priorities, focus timer, day planner with AI rating
- **Feed** (/feed) — Social feed: see posts from people you follow, like, bookmark, repost, comment
- **Discover** (/discover) — Find new users and content to follow
- **Leaderboard** (/leaderboard) — Community XP rankings
- **Achievements** (/achievements) — View unlocked badges (100+ achievements across learning, fitness, time, content)
- **Analytics** (/analytics) — Visual dashboards for learning, fitness, and focus data
- **Profile** (/profile) — Your public profile with stats, achievements, and activity
- **Settings** (/settings) — Account settings and preferences
- **Notifications** (/notifications) — Activity notifications (likes, follows, comments, achievements)
- **Messages** (/messages) — Direct messages and group chats
- **Friends** (/friends) — Your friends list
- **Onboarding** (/onboarding) — Set up your phases and interests if not completed

Platform Concepts:
- **Phases**: Start (begin something new), Restart (return to paused goals), Explore (discover new interests)
- **XP System**: Earn XP for every activity, level up with increasing thresholds
- **Achievements**: Unlock bronze→silver→gold→platinum badges across 4 categories
- **Daily Quests**: Personalized challenges for bonus XP
- **Streaks**: Track consecutive active days
- **AI Assistants**: Each module has a specialized AI to help you

When a user asks where to find something or how to do something on the platform, give them clear navigation instructions with the page path.`,

      general: `You are SRE AI, a friendly self-growth assistant for the SRE (Start·Restart·Explore) platform. Help with learning, fitness, content creation, time management, and motivation.

Answer the user's question directly and completely. Provide detailed explanations when appropriate. Use short responses only for simple questions. For roadmap, educational, planning, fitness, productivity, technical, and content creation questions provide structured and complete answers. Prioritize usefulness over brevity.

You can help with:
- Learning and studying effectively
- Fitness planning and nutrition
- Content creation and strategy
- Time management and productivity
- Building consistent habits
- Motivation and overcoming setbacks
- Navigating the SRE platform features`,
    };

    const selectedPrompt = systemPrompts[botType || 'general'] || systemPrompts.general;

    // ── Phase 7: Context-Aware Memory (15 exchange window) ──
    // Load recent conversation history from DB if no history provided
    let conversationHistory = history || [];

    if (!history || history.length === 0) {
      // Try loading from DB
      try {
        const existingChat = conversationId
          ? await db.chatHistory.findUnique({ where: { id: conversationId } })
          : await db.chatHistory.findFirst({
              where: { userId, botType: botType || 'general' },
              orderBy: { updatedAt: 'desc' },
            });

        if (existingChat) {
          try {
            const dbMessages = JSON.parse(existingChat.messages);
            // Take last 15 exchanges (30 messages: 15 user + 15 assistant)
            conversationHistory = dbMessages.slice(-30);
          } catch { /* ignore parse errors */ }
        }
      } catch { /* DB not available yet, continue without history */ }
    }

    // Build messages with context window
    const messages = [
      ...conversationHistory.slice(-30).map((m: any) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    const reply = await aiChat(messages, selectedPrompt);

    // ── Phase 6: Persistent Chat History ──
    // Save the conversation to database
    try {
      if (conversationId) {
        // Update existing conversation
        const existing = await db.chatHistory.findUnique({ where: { id: conversationId } });
        if (existing && existing.userId === userId) {
          const existingMessages = JSON.parse(existing.messages);
          const updatedMessages = [
            ...existingMessages,
            { role: 'user', content: message, timestamp: new Date().toISOString() },
            { role: 'assistant', content: reply, timestamp: new Date().toISOString() },
          ];
          await db.chatHistory.update({
            where: { id: conversationId },
            data: {
              messages: JSON.stringify(updatedMessages.slice(-200)),
              updatedAt: new Date(),
            },
          });
        }
      } else {
        // Check if we should append to recent conversation or create new
        const recentChat = await db.chatHistory.findFirst({
          where: { userId, botType: botType || 'general' },
          orderBy: { updatedAt: 'desc' },
        });

        if (recentChat) {
          const existingMessages = JSON.parse(recentChat.messages);
          const lastMsgTime = existingMessages.length > 0
            ? new Date(existingMessages[existingMessages.length - 1]?.timestamp || 0)
            : new Date(0);
          const minutesSinceLastMsg = (Date.now() - lastMsgTime.getTime()) / 60000;

          if (minutesSinceLastMsg < 30) {
            const updatedMessages = [
              ...existingMessages,
              { role: 'user', content: message, timestamp: new Date().toISOString() },
              { role: 'assistant', content: reply, timestamp: new Date().toISOString() },
            ];
            await db.chatHistory.update({
              where: { id: recentChat.id },
              data: {
                messages: JSON.stringify(updatedMessages.slice(-200)),
                updatedAt: new Date(),
              },
            });
            return NextResponse.json({ reply, response: reply, conversationId: recentChat.id });
          }
        }

        // Create new conversation
        const newChat = await db.chatHistory.create({
          data: {
            userId,
            botType: botType || 'general',
            messages: JSON.stringify([
              { role: 'user', content: message, timestamp: new Date().toISOString() },
              { role: 'assistant', content: reply, timestamp: new Date().toISOString() },
            ]),
          },
        });
        return NextResponse.json({ reply, response: reply, conversationId: newChat.id });
      }
    } catch (dbError) {
      console.error('Chat history save error:', dbError);
      // Don't fail the response if DB save fails
    }

    return NextResponse.json({ reply, response: reply, conversationId });
  } catch (error) {
    console.error('AI chatbot error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
