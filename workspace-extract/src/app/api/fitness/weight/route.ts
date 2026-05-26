import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth-helper';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');

    // If userId is provided (public profile), use it; otherwise use logged-in user
    let userId: string;
    let isOwnData = true;
    if (targetUserId) {
      userId = targetUserId;
      isOwnData = false;
    } else {
      userId = await getUserId();
    }

    // Access control: check sharing settings and private account when viewing another user's data
    if (!isOwnData && targetUserId) {
      const viewerId = await getUserId();
      if (viewerId !== targetUserId) {
        const targetProfile = await db.profile.findUnique({ where: { userId: targetUserId }, select: { shareFitnessProgress: true, isPublic: true } });
        // If sharing is OFF, deny access
        if (!targetProfile?.shareFitnessProgress) {
          return NextResponse.json({ weightLogs: [] });
        }
        // If private account, check if viewer follows them
        if (targetProfile.isPublic === false) {
          const follow = await db.follow.findUnique({
            where: { followerId_followingId: { followerId: viewerId, followingId: targetUserId } },
            select: { status: true },
          });
          if (follow?.status !== 'accepted') {
            return NextResponse.json({ weightLogs: [] });
          }
        }
      }
    }

    const weightLogs = await db.fitnessWeightLog.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({ weightLogs });
  } catch (error) {
    console.error('Weight GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch weight logs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    const body = await request.json();
    const { weight, date } = body;

    if (!weight || !date) {
      return NextResponse.json({ error: 'Weight and date required' }, { status: 400 });
    }

    // Check if there's already an entry for this date, update instead
    const existing = await db.fitnessWeightLog.findFirst({
      where: { userId, date },
    });

    let weightLog;
    if (existing) {
      weightLog = await db.fitnessWeightLog.update({
        where: { id: existing.id },
        data: { weight: parseFloat(weight) },
      });
    } else {
      weightLog = await db.fitnessWeightLog.create({
        data: {
          userId,
          weight: parseFloat(weight),
          date,
        },
      });
    }

    // Also update fitness profile weight
    const fitnessProfile = await db.fitnessProfile.findUnique({ where: { userId } });
    if (fitnessProfile) {
      await db.fitnessProfile.update({
        where: { userId },
        data: { weight: parseFloat(weight) },
      });
    }

    return NextResponse.json({ weightLog }, { status: 201 });
  } catch (error) {
    console.error('Weight POST error:', error);
    return NextResponse.json({ error: 'Failed to log weight' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Weight log ID required' }, { status: 400 });
    }

    const existing = await db.fitnessWeightLog.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: 'Weight log not found' }, { status: 404 });
    }

    await db.fitnessWeightLog.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Weight DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete weight log' }, { status: 500 });
  }
}
