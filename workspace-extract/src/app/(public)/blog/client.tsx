'use client';

import { useState } from 'react';
import { GlassCard } from '@/components/glass-card';
import { AdCard } from '@/components/ad-banner';
import { BookOpen, Dumbbell, PenTool, Clock, ChevronRight, Sparkles, TrendingUp, Target, Brain, Zap, Heart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SITE_NAME } from '@/lib/site-config';
import Link from 'next/link';

const BLOG_POSTS = [
  {
    id: '1',
    title: 'The Science of Habit Stacking: How to Build Multiple Habits at Once',
    excerpt: 'Discover the proven technique of habit stacking that turns small daily actions into powerful routines. Learn how to chain new habits onto existing ones for maximum consistency and minimal willpower drain.',
    category: 'Productivity',
    categoryIcon: Zap,
    categoryColor: 'text-amber-400',
    categoryBg: 'bg-amber-600/15',
    date: '2025-05-28',
    readTime: '8 min',
    featured: true,
  },
  {
    id: '2',
    title: 'Progressive Overload for Beginners: A Complete Fitness Guide',
    excerpt: 'Whether you are lifting weights or doing bodyweight exercises, progressive overload is the key to continuous improvement. This guide breaks down the principle into actionable steps for every fitness level.',
    category: 'Fitness',
    categoryIcon: Dumbbell,
    categoryColor: 'text-green-400',
    categoryBg: 'bg-green-600/15',
    date: '2025-05-25',
    readTime: '10 min',
    featured: false,
  },
  {
    id: '3',
    title: 'Spaced Repetition: The Learning Technique That Actually Works',
    excerpt: 'Forget cramming. Spaced repetition leverages the spacing effect to help you retain information for the long term. Here is how to implement it in your daily study sessions with practical examples.',
    category: 'Learning',
    categoryIcon: BookOpen,
    categoryColor: 'text-cyan-400',
    categoryBg: 'bg-cyan-600/15',
    date: '2025-05-22',
    readTime: '7 min',
    featured: false,
  },
  {
    id: '4',
    title: 'Content Creation Consistency: From Idea to Published in 5 Steps',
    excerpt: 'The hardest part of content creation is not inspiration — it is consistency. Learn the five-step framework that professional creators use to go from idea to published content week after week without burnout.',
    category: 'Content',
    categoryIcon: PenTool,
    categoryColor: 'text-purple-400',
    categoryBg: 'bg-purple-600/15',
    date: '2025-05-18',
    readTime: '6 min',
    featured: false,
  },
  {
    id: '5',
    title: 'Why Gamification Works: The Psychology Behind XP and Streaks',
    excerpt: 'Game mechanics are not just for fun — they tap into deep psychological drivers that make habits stick. Explore the science behind why XP systems, streaks, and achievements are so effective at driving long-term behavior change.',
    category: 'Productivity',
    categoryIcon: Zap,
    categoryColor: 'text-amber-400',
    categoryBg: 'bg-amber-600/15',
    date: '2025-05-15',
    readTime: '9 min',
    featured: false,
  },
  {
    id: '6',
    title: 'Tracking Your Way to Success: Why Measurement Matters',
    excerpt: 'You cannot improve what you do not measure. Discover how tracking your fitness, learning, and content metrics creates a feedback loop that accelerates progress and keeps you motivated through plateaus.',
    category: 'Growth',
    categoryIcon: TrendingUp,
    categoryColor: 'text-blue-400',
    categoryBg: 'bg-blue-600/15',
    date: '2025-05-12',
    readTime: '5 min',
    featured: false,
  },
  {
    id: '7',
    title: 'The Start-Restart-Explore Framework for Self-Growth',
    excerpt: 'Self-improvement is not linear. The SRE framework gives you permission to start new habits, restart when you fall off, and explore new interests — all without guilt. Here is how to apply it to your daily life.',
    category: 'Growth',
    categoryIcon: Target,
    categoryColor: 'text-blue-400',
    categoryBg: 'bg-blue-600/15',
    date: '2025-05-08',
    readTime: '6 min',
    featured: false,
  },
  {
    id: '8',
    title: 'AI-Assisted Learning: How to Use AI as Your Study Partner',
    excerpt: 'AI tools can transform how you learn — from generating practice questions to explaining complex concepts. Learn the best prompts and strategies to use AI as an effective study companion without becoming dependent on it.',
    category: 'Learning',
    categoryIcon: Brain,
    categoryColor: 'text-cyan-400',
    categoryBg: 'bg-cyan-600/15',
    date: '2025-05-05',
    readTime: '8 min',
    featured: false,
  },
];

const CATEGORIES = ['All', 'Fitness', 'Learning', 'Content', 'Productivity', 'Growth'];

export function BlogPageClient() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = BLOG_POSTS.filter(post => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesSearch = !searchQuery ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredPost = BLOG_POSTS.find(p => p.featured);
  const regularPosts = filteredPosts.filter(p => !p.featured);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="sr-only">Blog — {SITE_NAME}</h1>

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Sparkles size={20} className="text-amber-400" />
          <h2 className="text-2xl font-bold text-foreground">SRE Blog</h2>
          <Sparkles size={20} className="text-amber-400" />
        </div>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Insights, guides, and strategies for your self-growth journey. Track, learn, and grow with {SITE_NAME}.
        </p>
      </div>

      {/* Search and Filters */}
      <GlassCard className="p-4">
        <div className="flex gap-2 mb-3">
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search articles..."
            className="bg-accent border-border text-foreground"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'bg-accent/50 text-muted-foreground hover:bg-accent border border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Featured Post */}
      {featuredPost && selectedCategory === 'All' && !searchQuery && (
        <GlassCard className="p-6 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-400 font-medium">Featured</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${featuredPost.categoryBg} ${featuredPost.categoryColor} font-medium flex items-center gap-1`}>
              <featuredPost.categoryIcon size={10} />
              {featuredPost.category}
            </span>
            <span className="text-[10px] text-muted-foreground/50 ml-auto">{featuredPost.date} · {featuredPost.readTime} read</span>
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">{featuredPost.title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{featuredPost.excerpt}</p>
          <Button className="gradient-blue text-sm">
            Read Article <ArrowRight size={14} className="ml-1" />
          </Button>
        </GlassCard>
      )}

      {/* Ad Banner */}
      <AdCard format="horizontal" />

      {/* Posts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {regularPosts.map((post, idx) => {
          const PostIcon = post.categoryIcon;
          return (
            <GlassCard key={post.id} className="p-4 hover:border-border/50 transition-colors group cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${post.categoryBg} ${post.categoryColor} font-medium flex items-center gap-1`}>
                  <PostIcon size={10} />
                  {post.category}
                </span>
                <span className="text-[10px] text-muted-foreground/50 ml-auto">{post.date}</span>
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5 group-hover:text-blue-300 transition-colors line-clamp-2">{post.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-3 mb-3">{post.excerpt}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground/50">{post.readTime} read</span>
                <span className="text-xs text-blue-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Read <ChevronRight size={12} />
                </span>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Ad Banner between posts */}
      <AdCard format="in-article" />

      {/* Newsletter / CTA */}
      <GlassCard className="p-6 text-center border border-blue-500/20">
        <Heart size={24} className="mx-auto mb-2 text-rose-400" />
        <h3 className="text-lg font-bold text-foreground mb-1">Stay in the Loop</h3>
        <p className="text-sm text-muted-foreground mb-4">Get the latest self-growth tips and platform updates delivered to your feed.</p>
        <Link href="/feed">
          <Button className="gradient-blue">
            Go to Feed <ArrowRight size={14} className="ml-1" />
          </Button>
        </Link>
      </GlassCard>
    </div>
  );
}
