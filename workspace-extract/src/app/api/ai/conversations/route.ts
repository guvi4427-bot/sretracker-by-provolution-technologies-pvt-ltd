import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/ai/conversations — List conversations with filters
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const agentType = searchParams.get('agentType');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '15'), 50);

    const where: any = { userId: session.user.id };
    if (agentType && agentType !== 'all') where.aiAgentType = agentType;

    // Search across titles (message search requires joins, done separately)
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [conversations, total] = await Promise.all([
      db.conversation.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          aiAgentType: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { messages: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { content: true, role: true, createdAt: true },
          },
        },
      }),
      db.conversation.count({ where }),
    ]);

    // If searching, also search message content
    let searchResults: any[] = [];
    if (search) {
      const msgMatches = await db.chatMessage.findMany({
        where: {
          content: { contains: search, mode: 'insensitive' },
          conversation: { userId: session.user.id, ...(agentType && agentType !== 'all' ? { aiAgentType: agentType } : {}) },
        },
        select: {
          conversationId: true,
          conversation: {
            select: {
              id: true,
              title: true,
              aiAgentType: true,
              createdAt: true,
              updatedAt: true,
              _count: { select: { messages: true } },
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: { content: true, role: true, createdAt: true },
              },
            },
          },
        },
        distinct: ['conversationId'],
        take: 20,
      });
      searchResults = msgMatches.map(m => m.conversation);
    }

    // Merge and deduplicate
    const allConvs = search
      ? [...conversations, ...searchResults.filter((sr: any) => !conversations.some((c: any) => c.id === sr.id))]
      : conversations;

    const formatted = allConvs.map((c: any) => ({
      id: c.id,
      title: c.title,
      aiAgentType: c.aiAgentType,
      messageCount: c._count?.messages || 0,
      lastMessage: c.messages?.[0]?.content?.slice(0, 100) || '',
      lastMessageAt: c.updatedAt,
      createdAt: c.createdAt,
    }));

    return NextResponse.json({
      conversations: formatted,
      total,
      page,
      hasMore: total > page * limit,
    });
  } catch (error) {
    console.error('Conversations GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

// POST /api/ai/conversations — Create new conversation
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, aiAgentType } = await req.json();
    const conversation = await db.conversation.create({
      data: {
        userId: session.user.id,
        title: title || 'New Conversation',
        aiAgentType: aiAgentType || 'general',
      },
    });

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Conversations POST error:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
