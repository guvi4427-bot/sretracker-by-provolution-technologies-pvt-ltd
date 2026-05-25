import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { aiChat } from '@/lib/ai-provider';

const BURN_ESTIMATES: Record<string, number> = {
  running: 11, walking: 4, cycling: 8, swimming: 10, 'weight training': 6, hiit: 12, yoga: 3,
  pilates: 4, dance: 7, boxing: 10, 'jump rope': 12, rowing: 9, elliptical: 7, 'stair climbing': 9,
  stretching: 2, basketball: 8, football: 9, tennis: 7, badminton: 6, cricket: 5,
  'push-ups': 8, 'pull-ups': 9, squats: 7, planks: 4, burpees: 10,
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { workoutType, duration } = await req.json();
    if (!workoutType || !duration) return NextResponse.json({ error: 'Workout type and duration required' }, { status: 400 });

    const key = workoutType.toLowerCase();
    const burnPerMin = BURN_ESTIMATES[key] || 6;
    const estimatedCalories = Math.round(burnPerMin * duration);

    try {
      const reply = await aiChat(
        [{ role: 'user', content: `Estimate calories burned for ${workoutType} for ${duration} minutes. Respond ONLY with JSON: {"estimatedCalories":0,"reasoning":"brief"}` }],
        'You are a fitness AI. Return only valid JSON.'
      );
      const match = reply.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.estimatedCalories) return NextResponse.json({ estimatedCalories: parsed.estimatedCalories, reasoning: parsed.reasoning || 'AI estimated' });
      }
    } catch {}

    return NextResponse.json({ estimatedCalories, reasoning: `Estimated ~${burnPerMin} cal/min for ${workoutType}` });
  } catch (error) {
    console.error('Estimate burn error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
