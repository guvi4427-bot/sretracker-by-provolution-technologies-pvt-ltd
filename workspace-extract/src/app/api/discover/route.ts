import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { safeJsonParse } from '@/lib/utils';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'users';
    const q = (searchParams.get('q') || '').toLowerCase();

    if (type === 'posts') {
      const posts = await db.post.findMany({
        where: {
          ...(q ? { content: { contains: q } } : {}),
        },
        take: 20, orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, username: true, profile: { select: { name: true, avatarUrl: true, verified: true } } } },
          _count: { select: { likes: true, comments: true, reposts: true } },
          likes: { where: { userId: session.user.id }, select: { id: true } },
          reposts: { where: { userId: session.user.id }, select: { id: true } },
        },
      });
      const formatted = posts.map(p => ({
        id: p.id, content: p.content, hashtags: safeJsonParse<string[]>(p.hashtags, []), createdAt: p.createdAt,
        user: { id: p.user.id, username: p.user.username, name: p.user.profile?.name || p.user.username, avatarUrl: p.user.profile?.avatarUrl, verified: p.user.profile?.verified || false },
        stats: { likes: p._count.likes, comments: p._count.comments, reposts: p._count.reposts },
        isLiked: p.likes.length > 0, isReposted: p.reposts.length > 0,
      }));
      return NextResponse.json({ posts: formatted });
    }

    if (type === 'users') {
      const profiles = await db.profile.findMany({
        where: {
          userId: { not: session.user.id },
          ...(q ? { OR: [{ name: { contains: q } }, { user: { username: { contains: q } } }] } : {}),
          isPublic: true,
        },
        take: 20, orderBy: { xp: 'desc' },
        include: { user: { select: { id: true, username: true } } },
      });

      const follows = await db.follow.findMany({ where: { followerId: session.user.id }, select: { followingId: true, status: true } });
      const followMap = new Map(follows.map(f => [f.followingId, f.status]));

      const users = profiles.map(p => ({
        id: p.user.id, name: p.name || p.user.username, username: p.user.username, avatarUrl: p.avatarUrl,
        xp: p.xp, level: p.level, activePhases: safeJsonParse<string[]>(p.activePhases, []), verified: p.verified,
        isFollowing: followMap.get(p.user.id) === 'accepted', followRequestStatus: followMap.get(p.user.id) || 'none', isPublic: p.isPublic,
      }));
      return NextResponse.json({ users });
    }

    if (type === 'groups') {
      const groups = await db.groupChat.findMany({
        where: { isPublic: true, ...(q ? { name: { contains: q } } : {}) },
        take: 20, orderBy: { createdAt: 'desc' },
        include: { _count: { select: { members: true } } },
      });
      return NextResponse.json({ groups: groups.map(g => ({ id: g.id, name: g.name, description: g.description, memberCount: g._count.members, isPublic: g.isPublic })) });
    }

    if (type === 'topics') {
      const topics = await db.learningTopic.findMany({
        where: { isSharedCollection: true, ...(q ? { name: { contains: q } } : {}) },
        take: 20, orderBy: { sharedAt: 'desc' },
        include: {
          _count: { select: { entries: true } },
          user: { select: { id: true, username: true, profile: { select: { name: true, avatarUrl: true, verified: true } } } },
        },
      });
      return NextResponse.json({ topics: topics.map(t => ({
        id: t.id, name: t.name, phase: t.phase, entryCount: t._count.entries,
        isSharedCollection: t.isSharedCollection, collectionVisibility: t.collectionVisibility,
        sharedAt: t.sharedAt,
        author: t.user ? { id: t.user.id, username: t.user.username, name: t.user.profile?.name || t.user.username, avatarUrl: t.user.profile?.avatarUrl, verified: t.user.profile?.verified || false } : null,
      })) });
    }

    // ── Live Updates search (content + fitness updates) ──
    if (type === 'liveupdates') {
      const cleanQ = q.replace(/^#/, ''); // strip leading #
      const matchTag = cleanQ ? cleanQ.toLowerCase() : null;

      // Fetch fitness profiles for goal lookup
      const fitnessProfiles = await db.fitnessProfile.findMany({
        select: { userId: true, goal: true },
      });
      const goalMap = new Map(fitnessProfiles.map(fp => [fp.userId, fp.goal || 'maintain']));

      const results: any[] = [];

      // Content updates — filtered by hashtag if query matches
      if (!matchTag || matchTag === 'content' || matchTag === 'progress') {
        const contentEntries = await db.contentEntry.findMany({
          where: {
            user: { profile: { isPublic: true, shareContentStatus: true } },
          },
          include: {
            user: { select: { id: true, username: true, profile: { select: { name: true, avatarUrl: true, verified: true } } } },
            series: { select: { name: true } },
          },
          orderBy: { updatedAt: 'desc' },
          take: 20,
        });
        contentEntries.forEach(e => {
          results.push({
            id: e.id,
            type: 'content_update',
            title: e.title,
            contentType: e.contentType,
            liveStatus: e.liveStatus,
            status: e.status,
            updatedAt: e.updatedAt,
            createdAt: e.createdAt,
            seriesName: e.series?.name || null,
            user: { id: e.user.id, username: e.user.username, name: e.user.profile?.name || e.user.username, avatarUrl: e.user.profile?.avatarUrl, verified: e.user.profile?.verified || false },
            hashtags: ['content', 'progress'],
          });
        });
      }

      // Fitness updates — filtered by hashtag if query matches
      if (!matchTag || matchTag === 'fitness' || matchTag === 'gains' || matchTag === 'shredding') {
        const workouts = await db.fitnessWorkoutLog.findMany({
          where: {
            user: { profile: { isPublic: true, shareFitnessProgress: true } },
            createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
          },
          include: {
            user: { select: { id: true, username: true, profile: { select: { name: true, avatarUrl: true, verified: true } } } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        });
        workouts.forEach(w => {
          const goal = goalMap.get(w.userId) || 'maintain';
          const isGaining = goal === 'gain';
          const tags = ['fitness', isGaining ? 'gains' : 'shredding'];
          if (matchTag && matchTag !== 'fitness' && !tags.includes(matchTag)) return;
          results.push({
            id: w.id,
            type: 'fitness_update',
            subType: 'workout',
            workoutType: w.workoutType,
            duration: w.duration,
            estimatedCalories: w.estimatedCalories,
            muscleGroup: w.muscleGroup,
            sets: w.sets,
            reps: w.reps,
            loadKg: w.loadKg,
            date: w.date,
            createdAt: w.createdAt,
            user: { id: w.user.id, username: w.user.username, name: (w.user as any).profile?.name || w.user.username, avatarUrl: (w.user as any).profile?.avatarUrl, verified: (w.user as any).profile?.verified || false, fitnessGoal: goal },
            hashtags: tags,
          });
        });

        const weightLogs = await db.fitnessWeightLog.findMany({
          where: {
            user: { profile: { isPublic: true, shareFitnessProgress: true } },
            createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
          },
          include: {
            user: { select: { id: true, username: true, profile: { select: { name: true, avatarUrl: true, verified: true } } } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        });
        weightLogs.forEach(w => {
          const goal = goalMap.get(w.userId) || 'maintain';
          const isGaining = goal === 'gain';
          const tags = ['fitness', isGaining ? 'gains' : 'shredding'];
          if (matchTag && matchTag !== 'fitness' && !tags.includes(matchTag)) return;
          results.push({
            id: w.id,
            type: 'fitness_update',
            subType: 'weight',
            weight: w.weight,
            date: w.date,
            createdAt: w.createdAt,
            user: { id: w.user.id, username: w.user.username, name: (w.user as any).profile?.name || w.user.username, avatarUrl: (w.user as any).profile?.avatarUrl, verified: (w.user as any).profile?.verified || false, fitnessGoal: goal },
            hashtags: tags,
          });
        });
      }

      // Sort all results by time
      results.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

      return NextResponse.json({ liveupdates: results });
    }

    return NextResponse.json({ users: [], groups: [], topics: [] });
  } catch (error) {
    console.error('Discover error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
