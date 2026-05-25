import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * GET /api/feed/live-updates
 *
 * Fetches live content, fitness & learning updates from ALL public users
 * (INCLUDING the logged-in user's own data, so they can see
 * their live status in the Feed/Discover tabs alongside other users').
 *
 * Returns four arrays:
 *  - learningUpdates: shared learning topics with entry counts
 *  - contentUpdates: ContentEntry records with user info + pipeline data
 *  - fitnessUpdates: recent workouts with user info
 *  - weightUpdates: recent weight logs with user info + trend sparkline data
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
    const includeOwn = searchParams.get('includeOwn') !== 'false'; // default true

    // ── Fetch all fitness profiles for goal lookup ──
    const fitnessProfiles = await db.fitnessProfile.findMany({
      select: { userId: true, goal: true, weight: true },
    });
    const goalMap = new Map(fitnessProfiles.map(fp => [fp.userId, fp.goal || 'maintain']));
    const currentWeightMap = new Map(fitnessProfiles.map(fp => [fp.userId, fp.weight]));

    // ── Learning Updates (shared learning topics) ──
    // Always include own data + public users' data
    const learningWhere: any = {
      isSharedCollection: true,
      OR: [
        { userId: myUserId }, // Always include own
        { user: { profile: { isPublic: true } } }, // Public users
      ],
    };
    if (!includeOwn) learningWhere.OR = learningWhere.OR.filter((c: any) => !c.userId);

    const sharedTopics = await db.learningTopic.findMany({
      where: learningWhere,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: { select: { name: true, avatarUrl: true, verified: true } },
          },
        },
        _count: { select: { entries: true } },
      },
      orderBy: { sharedAt: 'desc' },
      take: limit,
    });

    const learningUpdates = sharedTopics.map(t => ({
      id: t.id,
      type: 'learning' as const,
      name: t.name,
      phase: t.phase,
      entryCount: t._count.entries,
      sharedAt: t.sharedAt,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      isOwn: t.userId === myUserId,
      user: {
        id: t.user.id,
        username: t.user.username,
        name: t.user.profile?.name || t.user.username,
        avatarUrl: t.user.profile?.avatarUrl,
        verified: t.user.profile?.verified || false,
      },
      hashtags: ['learning', t.phase || 'study'],
    }));

    // ── Content Updates ──
    // Always include own data + public users' data
    const contentWhere: any = {
      OR: [
        { userId: myUserId }, // Always include own
        { user: { profile: { isPublic: true } } }, // Public users
      ],
    };
    if (!includeOwn) contentWhere.OR = contentWhere.OR.filter((c: any) => !c.userId);

    const contentEntries = await db.contentEntry.findMany({
      where: contentWhere,
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
      isOwn: e.userId === myUserId,
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
    // Always include own data + public users' data
    const fitnessWhere: any = {
      createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
      OR: [
        { userId: myUserId }, // Always include own
        { user: { profile: { isPublic: true } } }, // Public users
      ],
    };
    if (!includeOwn) fitnessWhere.OR = fitnessWhere.OR.filter((c: any) => !c.userId);

    const recentWorkouts = await db.fitnessWorkoutLog.findMany({
      where: fitnessWhere,
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
        isOwn: w.userId === myUserId,
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
    // Always include own data + public users' data
    const weightWhere: any = {
      createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
      OR: [
        { userId: myUserId }, // Always include own
        { user: { profile: { isPublic: true } } }, // Public users
      ],
    };
    if (!includeOwn) weightWhere.OR = weightWhere.OR.filter((c: any) => !c.userId);

    const recentWeightLogs = await db.fitnessWeightLog.findMany({
      where: weightWhere,
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

    // ── Weight trend sparkline data per user ──
    const weightUserIds = [...new Set(recentWeightLogs.map(w => w.userId))];
    const weightTrendMap = new Map<string, { date: string; weight: number }[]>();

    if (weightUserIds.length > 0) {
      const trendData = await db.fitnessWeightLog.findMany({
        where: {
          userId: { in: weightUserIds },
        },
        select: { userId: true, date: true, weight: true },
        orderBy: { date: 'asc' },
      });

      const byUser: Record<string, { date: string; weight: number }[]> = {};
      trendData.forEach(t => {
        if (!byUser[t.userId]) byUser[t.userId] = [];
        byUser[t.userId].push({ date: t.date, weight: t.weight });
      });
      Object.entries(byUser).forEach(([uid, entries]) => {
        weightTrendMap.set(uid, entries.slice(-7));
      });
    }

    const weightUpdates = recentWeightLogs.map(w => {
      const goal = goalMap.get(w.userId) || 'maintain';
      const isGaining = goal === 'gain';
      const trend = weightTrendMap.get(w.userId) || [];

      let trendDirection: 'up' | 'down' | 'stable' | 'none' = 'none';
      if (trend.length >= 2) {
        const diff = trend[trend.length - 1].weight - trend[0].weight;
        if (diff > 0.3) trendDirection = 'up';
        else if (diff < -0.3) trendDirection = 'down';
        else trendDirection = 'stable';
      }

      const currentWeight = currentWeightMap.get(w.userId) || null;

      return {
        id: w.id,
        type: 'fitness' as const,
        subType: 'weight' as const,
        weight: w.weight,
        date: w.date,
        createdAt: w.createdAt,
        isOwn: w.userId === myUserId,
        trendData: trend,
        trendDirection,
        currentWeight,
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
      learningUpdates,
      contentUpdates,
      fitnessUpdates,
      weightUpdates,
    });
  } catch (error) {
    console.error('Live updates GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch live updates' }, { status: 500 });
  }
}
