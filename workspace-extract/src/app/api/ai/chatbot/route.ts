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

    const messages = [...(history || []).map((m: any) => ({ role: m.role, content: m.content })), { role: 'user', content: message }];
    const reply = await aiChat(messages, systemPrompts[botType || 'general'] || systemPrompts.general);

    return NextResponse.json({ reply, response: reply });
  } catch (error) {
    console.error('AI chatbot error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
