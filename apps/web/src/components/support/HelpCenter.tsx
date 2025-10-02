'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, BookOpen, Star, TrendingUp, Clock, Users, ThumbsUp, Filter, ArrowRight, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { knowledgeBaseManager, type SupportArticle, type SearchResult, type SupportCategory } from '@/lib/support/knowledge-base-manager';
import { useUser } from '@/hooks/useUser';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

export interface HelpCenterProps {
  /** Initial search query */
  initialQuery?: string;
  /** Show only specific categories */
  categories?: SupportCategory[];
  /** Compact layout for embedding */
  compact?: boolean;
}

export default function HelpCenter({
  initialQuery = '',
  categories,
  compact = false
}: HelpCenterProps) {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [popularArticles, setPopularArticles] = useState<SupportArticle[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<SupportArticle[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SupportCategory | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'popularity' | 'recent'>('relevance');

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Perform search when query changes
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      performSearch(debouncedSearchQuery);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchQuery, selectedCategory, selectedDifficulty, sortBy]);

  // Load initial content
  useEffect(() => {
    loadInitialContent();
  }, []);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const filters = {
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        jurisdiction: 'SK' as const,
        user_tier: 'free' as const,
        difficulty_level: selectedDifficulty !== 'all' ? [parseInt(selectedDifficulty)] : undefined
      };

      const results = await knowledgeBaseManager.searchArticles(query, filters, 20);

      // Sort results based on selected criteria
      const sortedResults = sortResults(results, sortBy);
      setSearchResults(sortedResults);

    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const loadInitialContent = async () => {
    try {
      const [popular, featured] = await Promise.all([
        knowledgeBaseManager.getPopularArticles(undefined, 'SK', 8),
        knowledgeBaseManager.searchArticles('', { featured_only: true }, 6)
      ]);

      setPopularArticles(popular);
      setFeaturedArticles(featured.map(r => r.article));
    } catch (error) {
      console.error('Failed to load initial content:', error);
    }
  };

  const sortResults = (results: SearchResult[], sortBy: string): SearchResult[] => {
    switch (sortBy) {
      case 'popularity':
        return [...results].sort((a, b) => b.article.view_count - a.article.view_count);
      case 'recent':
        return [...results].sort((a, b) =>
          new Date(b.article.updated_at).getTime() - new Date(a.article.updated_at).getTime()
        );
      case 'relevance':
      default:
        return results; // Already sorted by relevance
    }
  };

  const categoryLabels: Record<SupportCategory, string> = {
    getting_started: 'Začíname',
    account_security: 'Bezpečnosť',
    will_generator: 'Generator závetu',
    document_management: 'Dokumenty',
    family_sharing: 'Rodina',
    legal_compliance: 'Právne otázky',
    billing_subscription: 'Fakturácia',
    technical_support: 'Technická podpora',
    privacy_data: 'Súkromie',
    emergency_access: 'Núdzový prístup'
  };

  const filteredCategories = categories || Object.keys(categoryLabels) as SupportCategory[];

  const hasActiveFilters = selectedCategory !== 'all' || selectedDifficulty !== 'all' || sortBy !== 'relevance';

  return (
    <div className={cn('w-full', compact ? 'max-w-4xl' : 'max-w-6xl', 'mx-auto p-6 space-y-6')}>
      {/* Header */}
      {!compact && (
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Help Center</h1>
          <p className="text-muted-foreground">
            Nájdite odpovede na vaše otázky alebo sa spýtajte Sofia AI
          </p>
        </div>
      )}

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Hľadajte v help center..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-12 text-lg"
            />
            {isSearching && (
              <div className="absolute right-3 top-3">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}
          </div>

          {/* Search Filters */}
          {searchQuery && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
              <Select value={selectedCategory} onValueChange={(value: any) => setSelectedCategory(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Kategória" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všetky kategórie</SelectItem>
                  {filteredCategories.map(category => (
                    <SelectItem key={category} value={category}>
                      {categoryLabels[category]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Náročnosť" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všetky úrovne</SelectItem>
                  <SelectItem value="1">Začiatočník</SelectItem>
                  <SelectItem value="2">Mierne pokročilý</SelectItem>
                  <SelectItem value="3">Pokročilý</SelectItem>
                  <SelectItem value="4">Expert</SelectItem>
                  <SelectItem value="5">Špecialista</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Zoradiť podľa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevantnosť</SelectItem>
                  <SelectItem value="popularity">Popularita</SelectItem>
                  <SelectItem value="recent">Najnovšie</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedDifficulty('all');
                    setSortBy('relevance');
                  }}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Vymazať filtre
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchQuery && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Výsledky vyhľadávania
              {searchResults.length > 0 && (
                <Badge variant="secondary">{searchResults.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {searchResults.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Žiadne výsledky</h3>
                <p className="text-muted-foreground mb-4">
                  Skúste iné kľúčové slová alebo sa spýtajte Sofia AI
                </p>
                <Button>
                  Otvoriť Sofia AI
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {searchResults.map((result) => (
                  <SearchResultCard key={result.article.id} result={result} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content - only show when not searching */}
      {!searchQuery && (
        <Tabs defaultValue="featured" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="featured" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Odporúčané
            </TabsTrigger>
            <TabsTrigger value="popular" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Populárne
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Kategórie
            </TabsTrigger>
          </TabsList>

          <TabsContent value="featured" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featuredArticles.map((article) => (
                <ArticleCard key={article.id} article={article} featured />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="popular" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {popularArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCategories.map((category) => (
                <CategoryCard
                  key={category}
                  category={category}
                  label={categoryLabels[category]}
                  onClick={() => {
                    setSelectedCategory(category);
                    setSearchQuery(' '); // Trigger search with empty query to show category results
                  }}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Quick Links */}
      {!compact && !searchQuery && (
        <Card>
          <CardHeader>
            <CardTitle>Rýchle odkazy</CardTitle>
            <CardDescription>
              Najčastejšie potrebné informácie
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
              <QuickLinkButton
                icon={<Search className="h-4 w-4" />}
                label="Reset hesla"
                onClick={() => setSearchQuery('reset hesla')}
              />
              <QuickLinkButton
                icon={<BookOpen className="h-4 w-4" />}
                label="Právna platnosť závetu"
                onClick={() => setSearchQuery('závet právne platný')}
              />
              <QuickLinkButton
                icon={<Users className="h-4 w-4" />}
                label="Pozvanie rodiny"
                onClick={() => setSearchQuery('pozvanie rodinných členov')}
              />
              <QuickLinkButton
                icon={<Star className="h-4 w-4" />}
                label="Cenové plány"
                onClick={() => setSearchQuery('ceny predplatné')}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Article Card Component
function ArticleCard({ article, featured = false }: { article: SupportArticle; featured?: boolean }) {
  const difficultyColors = {
    1: 'bg-green-100 text-green-800',
    2: 'bg-blue-100 text-blue-800',
    3: 'bg-yellow-100 text-yellow-800',
    4: 'bg-orange-100 text-orange-800',
    5: 'bg-red-100 text-red-800'
  };

  const difficultyLabels = {
    1: 'Začiatočník',
    2: 'Základný',
    3: 'Pokročilý',
    4: 'Expert',
    5: 'Špecialista'
  };

  return (
    <Card className={cn('h-full transition-shadow hover:shadow-md', featured && 'border-primary')}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base line-clamp-2">{article.title}</CardTitle>
          {featured && <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            {article.category.replace('_', ' ')}
          </Badge>
          <Badge
            variant="secondary"
            className={cn('text-xs', difficultyColors[article.difficulty_level])}
          >
            {difficultyLabels[article.difficulty_level]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {article.view_count}
            </span>
            <span className="flex items-center gap-1">
              <ThumbsUp className="h-3 w-3" />
              {article.helpful_votes}
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {Math.ceil(article.content.length / 1000 * 2)} min
          </span>
        </div>

        <Button variant="outline" className="w-full" asChild>
          <a href={`/help/article/${article.slug}`}>
            Čítať článok
            <ArrowRight className="h-4 w-4 ml-2" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

// Search Result Card Component
function SearchResultCard({ result }: { result: SearchResult }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-lg mb-2 line-clamp-1">
              {result.article.title}
            </h3>

            <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
              {result.snippet}
            </p>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                {result.article.category.replace('_', ' ')}
              </Badge>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {result.article.view_count}
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                {Math.round(result.relevance_score * 100)}% match
              </span>
            </div>

            {result.matching_keywords.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {result.matching_keywords.slice(0, 3).map((keyword, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button variant="outline" asChild>
            <a href={`/help/article/${result.article.slug}`}>
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Category Card Component
function CategoryCard({
  category,
  label,
  onClick
}: {
  category: SupportCategory;
  label: string;
  onClick: () => void;
}) {
  const categoryIcons = {
    getting_started: <BookOpen className="h-6 w-6" />,
    account_security: <Star className="h-6 w-6" />,
    will_generator: <BookOpen className="h-6 w-6" />,
    document_management: <BookOpen className="h-6 w-6" />,
    family_sharing: <Users className="h-6 w-6" />,
    legal_compliance: <BookOpen className="h-6 w-6" />,
    billing_subscription: <BookOpen className="h-6 w-6" />,
    technical_support: <BookOpen className="h-6 w-6" />,
    privacy_data: <BookOpen className="h-6 w-6" />,
    emergency_access: <BookOpen className="h-6 w-6" />
  };

  return (
    <Card className="transition-shadow hover:shadow-md cursor-pointer" onClick={onClick}>
      <CardContent className="p-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-full">
            {categoryIcons[category]}
          </div>
          <h3 className="font-medium">{label}</h3>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

// Quick Link Button Component
function QuickLinkButton({
  icon,
  label,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button variant="outline" className="justify-start" onClick={onClick}>
      {icon}
      <span className="ml-2">{label}</span>
    </Button>
  );
}