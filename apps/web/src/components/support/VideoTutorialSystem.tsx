'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/supabase';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Search,
  Filter,
  Clock,
  Star,
  User,
  Calendar,
  ChevronRight,
  BookOpen,
  Award,
  Target,
  TrendingUp,
  CheckCircle
} from 'lucide-react';

export interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  duration: number; // in seconds
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  tags: string[];

  // Engagement metrics
  view_count: number;
  completion_rate: number;
  rating: number;

  // Accessibility
  has_subtitles: boolean;
  has_transcript: boolean;
  language: string;

  // Metadata
  instructor_name: string;
  created_at: string;
  updated_at: string;
  featured: boolean;
}

export interface TutorialProgress {
  tutorial_id: string;
  user_id: string;
  watched_duration: number;
  completed: boolean;
  last_position: number;
  rating?: number;
  notes?: string;
  bookmarked: boolean;
}

export interface VideoPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  playbackRate: number;
  showControls: boolean;
}

export interface VideoTutorialSystemProps {
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  featured?: boolean;
  maxResults?: number;
  autoPlay?: boolean;
  showProgress?: boolean;
}

export const VideoTutorialSystem: React.FC<VideoTutorialSystemProps> = ({
  category,
  difficulty,
  featured = false,
  maxResults = 12,
  autoPlay = false,
  showProgress = true
}) => {
  const [tutorials, setTutorials] = useState<VideoTutorial[]>([]);
  const [currentTutorial, setCurrentTutorial] = useState<VideoTutorial | null>(null);
  const [playerState, setPlayerState] = useState<VideoPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    isFullscreen: false,
    playbackRate: 1,
    showControls: true
  });
  const [userProgress, setUserProgress] = useState<TutorialProgress[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(category || '');
  const [selectedDifficulty, setSelectedDifficulty] = useState(difficulty || '');
  const [isLoading, setIsLoading] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const supabase = createClient();

  useEffect(() => {
    loadTutorials();
    loadUserProgress();
  }, [selectedCategory, selectedDifficulty, searchQuery]);

  useEffect(() => {
    if (currentTutorial && videoRef.current) {
      setupVideoPlayer();
    }
  }, [currentTutorial]);

  const loadTutorials = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('video_tutorials')
        .select('*')
        .eq('published', true);

      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      if (selectedDifficulty) {
        query = query.eq('difficulty_level', selectedDifficulty);
      }

      if (featured) {
        query = query.eq('featured', true);
      }

      if (searchQuery) {
        query = query.textSearch('title,description,tags', searchQuery);
      }

      query = query
        .order('featured', { ascending: false })
        .order('rating', { ascending: false })
        .limit(maxResults);

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        setTutorials(data);
        if (!currentTutorial && data.length > 0) {
          setCurrentTutorial(data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load tutorials:', error);
      // Load sample data for demonstration
      setTutorials(generateSampleTutorials());
      if (!currentTutorial) {
        setCurrentTutorial(generateSampleTutorials()[0]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tutorial_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      if (data) {
        setUserProgress(data);
      }
    } catch (error) {
      console.error('Failed to load user progress:', error);
    }
  };

  const setupVideoPlayer = () => {
    const video = videoRef.current;
    if (!video) return;

    video.addEventListener('loadedmetadata', () => {
      setPlayerState(prev => ({ ...prev, duration: video.duration }));
    });

    video.addEventListener('timeupdate', () => {
      setPlayerState(prev => ({ ...prev, currentTime: video.currentTime }));
      updateProgress(video.currentTime);
    });

    video.addEventListener('ended', () => {
      setPlayerState(prev => ({ ...prev, isPlaying: false }));
      markAsCompleted();
    });

    // Load user's last position
    const progress = getUserProgress(currentTutorial!.id);
    if (progress && progress.last_position > 0) {
      video.currentTime = progress.last_position;
    }
  };

  const playPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (playerState.isPlaying) {
      video.pause();
    } else {
      video.play();
    }

    setPlayerState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const seekTo = (time: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = time;
    setPlayerState(prev => ({ ...prev, currentTime: time }));
  };

  const changeVolume = (volume: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = volume;
    setPlayerState(prev => ({ ...prev, volume, isMuted: volume === 0 }));
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    const newMuted = !playerState.isMuted;
    video.muted = newMuted;
    setPlayerState(prev => ({ ...prev, isMuted: newMuted }));
  };

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setPlayerState(prev => ({ ...prev, playbackRate: rate }));
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!playerState.isFullscreen) {
      video.requestFullscreen();
    } else {
      document.exitFullscreen();
    }

    setPlayerState(prev => ({ ...prev, isFullscreen: !prev.isFullscreen }));
  };

  const updateProgress = async (currentTime: number) => {
    if (!currentTutorial) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const progress = Math.round((currentTime / playerState.duration) * 100);
      const isCompleted = progress >= 90; // Consider 90% as completed

      await supabase
        .from('tutorial_progress')
        .upsert({
          tutorial_id: currentTutorial.id,
          user_id: user.id,
          watched_duration: currentTime,
          last_position: currentTime,
          completed: isCompleted,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'tutorial_id,user_id'
        });

      // Update local state
      setUserProgress(prev =>
        prev.some(p => p.tutorial_id === currentTutorial.id)
          ? prev.map(p =>
              p.tutorial_id === currentTutorial.id
                ? { ...p, watched_duration: currentTime, last_position: currentTime, completed: isCompleted }
                : p
            )
          : [...prev, {
              tutorial_id: currentTutorial.id,
              user_id: user.id,
              watched_duration: currentTime,
              completed: isCompleted,
              last_position: currentTime,
              bookmarked: false
            }]
      );
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const markAsCompleted = async () => {
    if (!currentTutorial) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('tutorial_progress')
        .upsert({
          tutorial_id: currentTutorial.id,
          user_id: user.id,
          watched_duration: playerState.duration,
          last_position: playerState.duration,
          completed: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'tutorial_id,user_id'
        });

      // Show completion badge or celebration
      console.log('Tutorial completed!');
    } catch (error) {
      console.error('Failed to mark as completed:', error);
    }
  };

  const rateTutorial = async (rating: number) => {
    if (!currentTutorial) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('tutorial_progress')
        .upsert({
          tutorial_id: currentTutorial.id,
          user_id: user.id,
          rating,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'tutorial_id,user_id'
        });
    } catch (error) {
      console.error('Failed to rate tutorial:', error);
    }
  };

  const getUserProgress = (tutorialId: string): TutorialProgress | undefined => {
    return userProgress.find(p => p.tutorial_id === tutorialId);
  };

  const getProgressPercentage = (tutorialId: string): number => {
    const progress = getUserProgress(tutorialId);
    if (!progress) return 0;

    const tutorial = tutorials.find(t => t.id === tutorialId);
    if (!tutorial) return 0;

    return Math.round((progress.watched_duration / tutorial.duration) * 100);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const generateSampleTutorials = (): VideoTutorial[] => [
    {
      id: '1',
      title: 'Getting Started with LegacyGuard',
      description: 'Learn the basics of protecting your family\'s future with our comprehensive platform.',
      video_url: 'https://example.com/video1.mp4',
      thumbnail_url: 'https://via.placeholder.com/320x180',
      duration: 300,
      difficulty_level: 'beginner',
      category: 'getting_started',
      tags: ['basics', 'onboarding', 'introduction'],
      view_count: 1250,
      completion_rate: 0.85,
      rating: 4.8,
      has_subtitles: true,
      has_transcript: true,
      language: 'sk',
      instructor_name: 'Sofia AI',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      featured: true
    },
    {
      id: '2',
      title: 'Creating Your First Will',
      description: 'Step-by-step guide to creating a legally valid will using our AI-powered generator.',
      video_url: 'https://example.com/video2.mp4',
      thumbnail_url: 'https://via.placeholder.com/320x180',
      duration: 480,
      difficulty_level: 'beginner',
      category: 'will_generator',
      tags: ['will', 'legal', 'documents'],
      view_count: 890,
      completion_rate: 0.78,
      rating: 4.7,
      has_subtitles: true,
      has_transcript: true,
      language: 'sk',
      instructor_name: 'Legal Expert',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      featured: false
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-muted animate-pulse rounded" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Video Tutorials</h2>
          <p className="text-muted-foreground">
            Learn LegacyGuard with interactive video guides
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search tutorials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            <SelectItem value="getting_started">Getting Started</SelectItem>
            <SelectItem value="will_generator">Will Generator</SelectItem>
            <SelectItem value="document_management">Document Management</SelectItem>
            <SelectItem value="family_sharing">Family Sharing</SelectItem>
            <SelectItem value="security">Security</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Levels</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player */}
        <div className="lg:col-span-2">
          {currentTutorial && (
            <Card>
              <CardContent className="p-0">
                <div className="relative aspect-video bg-black rounded-t-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-full"
                    poster={currentTutorial.thumbnail_url}
                    controls={false}
                    onMouseEnter={() => setPlayerState(prev => ({ ...prev, showControls: true }))}
                    onMouseLeave={() => setPlayerState(prev => ({ ...prev, showControls: false }))}
                  >
                    <source src={currentTutorial.video_url} type="video/mp4" />
                    {currentTutorial.has_subtitles && (
                      <track kind="subtitles" src="subtitles.vtt" srcLang="sk" label="Slovak" />
                    )}
                  </video>

                  {/* Custom Controls */}
                  <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity ${playerState.showControls ? 'opacity-100' : 'opacity-0'}`}>
                    {/* Progress Bar */}
                    <div className="mb-3">
                      <Progress
                        value={(playerState.currentTime / playerState.duration) * 100}
                        className="h-1 cursor-pointer"
                        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const percentage = x / rect.width;
                          seekTo(percentage * playerState.duration);
                        }}
                      />
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => seekTo(Math.max(0, playerState.currentTime - 10))}
                        >
                          <SkipBack className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={playPause}>
                          {playerState.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => seekTo(Math.min(playerState.duration, playerState.currentTime + 10))}
                        >
                          <SkipForward className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={toggleMute}>
                          {playerState.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </Button>
                        <span className="text-sm">
                          {formatDuration(playerState.currentTime)} / {formatDuration(playerState.duration)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Select value={playerState.playbackRate.toString()} onValueChange={(rate: string) => changePlaybackRate(Number(rate))}>
                          <SelectTrigger className="w-20 h-8 text-white border-white/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0.5">0.5x</SelectItem>
                            <SelectItem value="1">1x</SelectItem>
                            <SelectItem value="1.25">1.25x</SelectItem>
                            <SelectItem value="1.5">1.5x</SelectItem>
                            <SelectItem value="2">2x</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
                          {playerState.isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Video Info */}
                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold">{currentTutorial.title}</h3>
                      <p className="text-muted-foreground">{currentTutorial.description}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${getDifficultyColor(currentTutorial.difficulty_level)}`} />
                        {currentTutorial.difficulty_level}
                      </Badge>
                      <Badge variant="outline">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDuration(currentTutorial.duration)}
                      </Badge>
                      <Badge variant="outline">
                        <Star className="w-3 h-3 mr-1" />
                        {currentTutorial.rating}
                      </Badge>
                      <Badge variant="outline">
                        <User className="w-3 h-3 mr-1" />
                        {currentTutorial.instructor_name}
                      </Badge>
                    </div>

                    {showProgress && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Your Progress</span>
                          <span className="text-sm font-medium">{getProgressPercentage(currentTutorial.id)}%</span>
                        </div>
                        <Progress value={getProgressPercentage(currentTutorial.id)} />
                      </div>
                    )}

                    {/* Rating */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Rate this tutorial:</span>
                      {[1, 2, 3, 4, 5].map(rating => (
                        <Button
                          key={rating}
                          variant="ghost"
                          size="sm"
                          onClick={() => rateTutorial(rating)}
                          className="p-1"
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tutorial List */}
        <div className="space-y-4">
          <h3 className="font-semibold">All Tutorials ({tutorials.length})</h3>
          <div className="space-y-3">
            {tutorials.map(tutorial => (
              <Card
                key={tutorial.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  currentTutorial?.id === tutorial.id ? 'border-primary' : ''
                }`}
                onClick={() => setCurrentTutorial(tutorial)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="relative">
                      <img
                        src={tutorial.thumbnail_url}
                        alt={tutorial.title}
                        className="w-20 h-12 object-cover rounded"
                      />
                      <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                        {formatDuration(tutorial.duration)}
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="font-medium text-sm line-clamp-2">{tutorial.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {tutorial.difficulty_level}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {tutorial.view_count} views
                        </span>
                      </div>
                      {showProgress && (
                        <div className="space-y-1">
                          <Progress value={getProgressPercentage(tutorial.id)} className="h-1" />
                          {getUserProgress(tutorial.id)?.completed && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-3 h-3" />
                              <span className="text-xs">Completed</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoTutorialSystem;