'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/lib/supabase';
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Star,
  Award,
  Clock,
  TrendingUp,
  Users,
  Search,
  Filter,
  Plus,
  CheckCircle,
  AlertCircle,
  Flag,
  Share2,
  BookOpen,
  Lightbulb,
  Target,
  Crown,
  Heart
} from 'lucide-react';

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  category: 'question' | 'tip' | 'guide' | 'discussion' | 'feedback';
  author_id: string;
  author_name: string;
  author_avatar?: string;
  author_badges: string[];

  // Engagement
  likes_count: number;
  replies_count: number;
  views_count: number;
  is_solved: boolean;
  is_featured: boolean;

  // User interaction
  user_liked?: boolean;
  user_bookmarked?: boolean;

  // Metadata
  tags: string[];
  created_at: string;
  updated_at: string;
  last_reply_at?: string;
}

export interface CommunityReply {
  id: string;
  post_id: string;
  content: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  author_badges: string[];

  // Engagement
  likes_count: number;
  is_solution: boolean;

  // User interaction
  user_liked?: boolean;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface UserContribution {
  user_id: string;
  posts_count: number;
  replies_count: number;
  solutions_count: number;
  likes_received: number;
  reputation_score: number;
  badges: string[];
  level: 'newcomer' | 'contributor' | 'expert' | 'moderator';
}

export interface CommunitySupportProps {
  category?: string;
  showCreatePost?: boolean;
  maxPosts?: number;
}

export const CommunitySupport: React.FC<CommunitySupportProps> = ({
  category,
  showCreatePost = true,
  maxPosts = 20
}) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [replies, setReplies] = useState<CommunityReply[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<string>('question');
  const [newReplyContent, setNewReplyContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(category || '');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'solved'>('recent');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadCommunityPosts();
  }, [selectedCategory, sortBy, searchQuery]);

  useEffect(() => {
    if (selectedPost) {
      loadPostReplies(selectedPost.id);
    }
  }, [selectedPost]);

  const loadCommunityPosts = async () => {
    setIsLoading(true);
    try {
      // Load sample data for demonstration
      const samplePosts = generateSamplePosts();
      setPosts(samplePosts);
    } catch (error) {
      console.error('Failed to load community posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPostReplies = async (postId: string) => {
    try {
      // Load sample replies for demonstration
      const sampleReplies = generateSampleReplies(postId);
      setReplies(sampleReplies);
    } catch (error) {
      console.error('Failed to load replies:', error);
    }
  };

  const createPost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newPost: Partial<CommunityPost> = {
        title: newPostTitle,
        content: newPostContent,
        category: newPostCategory as CommunityPost['category'],
        author_id: user.id,
        author_name: user.email?.split('@')[0] || 'Anonymous',
        author_badges: [],
        likes_count: 0,
        replies_count: 0,
        views_count: 0,
        is_solved: false,
        is_featured: false,
        tags: extractTagsFromContent(newPostContent),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // In production, this would save to database
      console.log('Creating post:', newPost);

      // Reset form
      setNewPostTitle('');
      setNewPostContent('');
      setShowCreateForm(false);

      // Reload posts
      loadCommunityPosts();
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  const createReply = async () => {
    if (!newReplyContent.trim() || !selectedPost) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newReply: Partial<CommunityReply> = {
        post_id: selectedPost.id,
        content: newReplyContent,
        author_id: user.id,
        author_name: user.email?.split('@')[0] || 'Anonymous',
        author_badges: [],
        likes_count: 0,
        is_solution: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // In production, this would save to database
      console.log('Creating reply:', newReply);

      setNewReplyContent('');
      loadPostReplies(selectedPost.id);
    } catch (error) {
      console.error('Failed to create reply:', error);
    }
  };

  const likePost = async (postId: string) => {
    try {
      setPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? {
                ...post,
                likes_count: post.user_liked ? post.likes_count - 1 : post.likes_count + 1,
                user_liked: !post.user_liked
              }
            : post
        )
      );
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const likeReply = async (replyId: string) => {
    try {
      setReplies(prev =>
        prev.map(reply =>
          reply.id === replyId
            ? {
                ...reply,
                likes_count: reply.user_liked ? reply.likes_count - 1 : reply.likes_count + 1,
                user_liked: !reply.user_liked
              }
            : reply
        )
      );
    } catch (error) {
      console.error('Failed to like reply:', error);
    }
  };

  const markAsSolution = async (replyId: string) => {
    try {
      setReplies(prev =>
        prev.map(reply =>
          reply.id === replyId
            ? { ...reply, is_solution: true }
            : { ...reply, is_solution: false }
        )
      );

      if (selectedPost) {
        setSelectedPost(prev => prev ? { ...prev, is_solved: true } : null);
        setPosts(prev =>
          prev.map(post =>
            post.id === selectedPost.id ? { ...post, is_solved: true } : post
          )
        );
      }
    } catch (error) {
      console.error('Failed to mark as solution:', error);
    }
  };

  const extractTagsFromContent = (content: string): string[] => {
    const commonTags = ['heslo', 'závet', 'dokumenty', 'bezpečnosť', 'rodina', 'právne', 'technické'];
    return commonTags.filter(tag => content.toLowerCase().includes(tag));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'question': return <MessageSquare className="w-4 h-4" />;
      case 'tip': return <Lightbulb className="w-4 h-4" />;
      case 'guide': return <BookOpen className="w-4 h-4" />;
      case 'discussion': return <Users className="w-4 h-4" />;
      case 'feedback': return <Heart className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'question': return 'bg-blue-500';
      case 'tip': return 'bg-yellow-500';
      case 'guide': return 'bg-green-500';
      case 'discussion': return 'bg-purple-500';
      case 'feedback': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'expert': return <Crown className="w-3 h-3" />;
      case 'helpful': return <Award className="w-3 h-3" />;
      case 'moderator': return <CheckCircle className="w-3 h-3" />;
      default: return <Star className="w-3 h-3" />;
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'pred chvíľou';
    if (diffInHours < 24) return `pred ${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `pred ${diffInDays}d`;
    return date.toLocaleDateString('sk-SK');
  };

  const generateSamplePosts = (): CommunityPost[] => [
    {
      id: '1',
      title: 'Ako si overím platnosť môjho závetu?',
      content: 'Vytvoril som závet cez aplikáciu, ale neviem si, či je právne platný. Aké kroky musím vykonať, aby bol závet platný na Slovensku?',
      category: 'question',
      author_id: 'user1',
      author_name: 'Janko',
      author_badges: ['newcomer'],
      likes_count: 5,
      replies_count: 3,
      views_count: 124,
      is_solved: true,
      is_featured: false,
      user_liked: false,
      tags: ['závet', 'právne', 'slovensko'],
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      last_reply_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      title: 'Tip: Ako si bezpečne uložiť Recovery Kit',
      content: 'Recovery Kit je kľúčový pre prístup k vašim dokumentom. Tu je niekoľko tipov ako si ho bezpečne uložiť:\n\n1. Vytlačte si ho a uložte na bezpečnom mieste\n2. Uložte kópiu v bankovom trezore\n3. Zdieľajte s dôveryhodnou osobou\n4. Nikdy ho neukladajte len digitálne',
      category: 'tip',
      author_id: 'user2',
      author_name: 'Mária Expert',
      author_badges: ['expert', 'helpful'],
      likes_count: 18,
      replies_count: 7,
      views_count: 289,
      is_solved: false,
      is_featured: true,
      user_liked: true,
      tags: ['recovery kit', 'bezpečnosť', 'tipy'],
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      last_reply_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      title: 'Problém s nahrávaním PDF dokumentov',
      content: 'Pri pokuse o nahranie PDF dokumentu sa mi zobrazuje chyba "Súbor je príliš veľký". Súbor má len 2MB. Viete mi poradiť?',
      category: 'question',
      author_id: 'user3',
      author_name: 'Peter',
      author_badges: ['contributor'],
      likes_count: 2,
      replies_count: 1,
      views_count: 45,
      is_solved: false,
      is_featured: false,
      user_liked: false,
      tags: ['pdf', 'upload', 'technické'],
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      last_reply_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    }
  ];

  const generateSampleReplies = (postId: string): CommunityReply[] => {
    if (postId === '1') {
      return [
        {
          id: '1-1',
          post_id: '1',
          content: 'Pre platný závet na Slovensku musíte dodržať formálne náležitosti. Najjednoduchšie je holografný závet - celý vlastnoručne prepísať a podpísať.',
          author_id: 'expert1',
          author_name: 'Legal Expert',
          author_badges: ['expert', 'moderator'],
          likes_count: 8,
          is_solution: true,
          user_liked: false,
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '1-2',
          post_id: '1',
          content: 'Odporúčam tiež konzultáciu s notárom pre 100% istotu. Aplikácia vám poskytne správny obsah, ale formálne náležitosti musíte dodržať.',
          author_id: 'user4',
          author_name: 'Anna',
          author_badges: ['helpful'],
          likes_count: 3,
          is_solution: false,
          user_liked: true,
          created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString()
        }
      ];
    }
    return [];
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted animate-pulse rounded" />
                  <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
                  <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Community Support</h2>
          <p className="text-muted-foreground">
            Zdieľajte skúsenosti a pomáhajte ostatným používateľom
          </p>
        </div>
        {showCreatePost && (
          <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nový príspevok
          </Button>
        )}
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Hľadať v community..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Všetky kategórie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Všetky kategórie</SelectItem>
            <SelectItem value="question">Otázky</SelectItem>
            <SelectItem value="tip">Tipy</SelectItem>
            <SelectItem value="guide">Návody</SelectItem>
            <SelectItem value="discussion">Diskusie</SelectItem>
            <SelectItem value="feedback">Feedback</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Najnovšie</SelectItem>
            <SelectItem value="popular">Najpopulárnejšie</SelectItem>
            <SelectItem value="solved">Vyriešené</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Create Post Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nový príspevok</CardTitle>
            <CardDescription>
              Zdieľajte svoj problém, tip alebo otázku s komunitou
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Názov príspevku..."
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Select value={newPostCategory} onValueChange={setNewPostCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="question">Otázka</SelectItem>
                  <SelectItem value="tip">Tip</SelectItem>
                  <SelectItem value="guide">Návod</SelectItem>
                  <SelectItem value="discussion">Diskusia</SelectItem>
                  <SelectItem value="feedback">Feedback</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Textarea
                placeholder="Opíšte váš problém alebo zdieľajte tip..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={createPost} disabled={!newPostTitle.trim() || !newPostContent.trim()}>
                Publikovať
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Zrušiť
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Posts List */}
        <div className="lg:col-span-2 space-y-4">
          {posts.map(post => (
            <Card
              key={post.id}
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                selectedPost?.id === post.id ? 'border-primary' : ''
              }`}
              onClick={() => setSelectedPost(post)}
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Post Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={post.author_avatar} />
                        <AvatarFallback>{post.author_name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{post.author_name}</span>
                          {post.author_badges.map(badge => (
                            <Badge key={badge} variant="outline" className="text-xs flex items-center gap-1">
                              {getBadgeIcon(badge)}
                              {badge}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(post.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`flex items-center gap-1 text-white ${getCategoryColor(post.category)}`}
                      >
                        {getCategoryIcon(post.category)}
                        {post.category}
                      </Badge>
                      {post.is_solved && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Vyriešené
                        </Badge>
                      )}
                      {post.is_featured && (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Post Content */}
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
                    <p className="text-muted-foreground line-clamp-3">{post.content}</p>
                  </div>

                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="flex items-center gap-2">
                      {post.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Post Stats */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          likePost(post.id);
                        }}
                        className={`flex items-center gap-1 ${post.user_liked ? 'text-red-500' : ''}`}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        {post.likes_count}
                      </Button>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MessageSquare className="w-4 h-4" />
                        {post.replies_count}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        {post.views_count}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Flag className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Post Detail & Replies */}
        <div className="space-y-4">
          {selectedPost ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{selectedPost.title}</CardTitle>
                  <CardDescription>
                    od {selectedPost.author_name} • {formatTimeAgo(selectedPost.created_at)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="whitespace-pre-wrap">{selectedPost.content}</p>

                    <Separator />

                    {/* Replies */}
                    <div className="space-y-4">
                      <h4 className="font-semibold">Odpovede ({replies.length})</h4>

                      {replies.map(reply => (
                        <div key={reply.id} className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={reply.author_avatar} />
                              <AvatarFallback className="text-xs">{reply.author_name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{reply.author_name}</span>
                                {reply.author_badges.map(badge => (
                                  <Badge key={badge} variant="outline" className="text-xs">
                                    {badge}
                                  </Badge>
                                ))}
                                {reply.is_solution && (
                                  <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Riešenie
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {formatTimeAgo(reply.created_at)}
                                </span>
                              </div>
                              <p className="text-sm">{reply.content}</p>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => likeReply(reply.id)}
                                  className={`text-xs ${reply.user_liked ? 'text-red-500' : ''}`}
                                >
                                  <ThumbsUp className="w-3 h-3 mr-1" />
                                  {reply.likes_count}
                                </Button>
                                {!reply.is_solution && selectedPost.author_id === 'current_user' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAsSolution(reply.id)}
                                    className="text-xs text-green-600"
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Označiť ako riešenie
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                          <Separator />
                        </div>
                      ))}

                      {/* New Reply */}
                      <div className="space-y-3">
                        <Textarea
                          placeholder="Napíšte svoju odpoveď..."
                          value={newReplyContent}
                          onChange={(e) => setNewReplyContent(e.target.value)}
                          className="min-h-[80px]"
                        />
                        <Button
                          onClick={createReply}
                          disabled={!newReplyContent.trim()}
                          size="sm"
                        >
                          Odpovedať
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium mb-2">Vyberte príspevok</h3>
                <p className="text-sm text-muted-foreground">
                  Kliknite na príspevok pre zobrazenie detailov a odpovedí
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunitySupport;