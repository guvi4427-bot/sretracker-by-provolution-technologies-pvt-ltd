import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * GET /api/feed/live-updates
 *
 * Fetches live content & fitness updates from ALL public users
 * (excluding the logged-in user's own data, since that's already
 * visible in the Live tab).
 *
 * Returns three arrays:
 *  - contentUpdates: ContentEntry records with user info + pipeline data
 *  - fitnessUpdates: recent workouts with user info
 *  - weightUpdates: recent weight logs with user info
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const myUserId = session.user.id;
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 50);

    // ── Fetch all fitness profiles for goal lookup ──
    const fitnessProfiles = await db.fitnessProfile.findMany({
      select: { userId: true, goal: true },
    });
    const goalMap = new Map(fitnessProfiles.map(fp => [fp.userId, fp.goal || 'maintain']));

    // ── Content Updates ──
    const contentEntries = await db.contentEntry.findMany({
      where: {
        userId: { not: myUserId },
        user: {
          profile: {
            isPublic: true,
            shareContentStatus: true,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: { select: { name: true, avatarUrl: true, verified: true } },
          },
        },
        series: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    const contentUpdates = contentEntries.map(e => ({
      id: e.id,
      type: 'content' as const,
      title: e.title,
      contentType: e.contentType,
      liveStatus: e.liveStatus,
      status: e.status,
      platform: e.platform,
      updatedAt: e.updatedAt,
      createdAt: e.createdAt,
      seriesName: e.series?.name || null,
      user: {
        id: e.user.id,
        username: e.user.username,
        name: e.user.profile?.name || e.user.username,
        avatarUrl: e.user.profile?.avatarUrl,
        verified: e.user.profile?.verified || false,
      },
      hashtags: ['content', 'progress'],
    }));

    // ── Fitness Updates (Workouts) ──
    const recentWorkouts = await db.fitnessWorkoutLog.findMany({
      where: {
        userId: { not: myUserId },
        user: {
          profile: {
            isPublic: true,
            shareFitnessProgress: true,
          },
        },
        createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: { select: { name: true, avatarUrl: true, verified: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const fitnessUpdates = recentWorkouts.map(w => {
      const goal = goalMap.get(w.userId) || 'maintain';
      const isGaining = goal === 'gain';
      return {
        id: w.id,
        type: 'fitness' as const,
        subType: 'workout' as const,
        workoutType: w.workoutType,
        duration: w.duration,
        estimatedCalories: w.estimatedCalories,
        muscleGroup: w.muscleGroup,
        sets: w.sets,
        reps: w.reps,
        loadKg: w.loadKg,
        date: w.date,
        createdAt: w.createdAt,
        user: {
          id: w.user.id,
          username: w.user.username,
          name: (w.user as any).profile?.name || w.user.username,
          avatarUrl: (w.user as any).profile?.avatarUrl,
          verified: (w.user as any).profile?.verified || false,
          fitnessGoal: goal,
        },
        hashtags: ['fitness', isGaining ? 'gains' : 'shredding'],
      };
    });

    // ── Weight Updates ──
    const recentWeightLogs = await db.fitnessWeightLog.findMany({
      where: {
        userId: { not: myUserId },
        user: {
          profile: {
            isPublic: true,
            shareFitnessProgress: true,
          },
        },
        createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: { select: { name: true, avatarUrl: true, verified: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const weightUpdates = recentWeightLogs.map(w => {
      const goal = goalMap.get(w.userId) || 'maintain';
      const isGaining = goal === 'gain';
      return {
        id: w.id,
        type: 'fitness' as const,
        subType: 'weight' as const,
        weight: w.weight,
        date: w.date,
        createdAt: w.createdAt,
        user: {
          id: w.user.id,
          username: w.user.username,
          name: (w.user as any).profile?.name || w.user.username,
          avatarUrl: (w.user as any).profile?.avatarUrl,
          verified: (w.user as any).profile?.verified || false,
          fitnessGoal: goal,
        },
        hashtags: ['fitness', isGaining ? 'gains' : 'shredding'],
      };
    });

    return NextResponse.json({
      contentUpdates,
      fitnessUpdates,
      weightUpdates,
    });
  } catch (error) {
    console.error('Live updates GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch live updates' }, { status: 500 });
  }
}
