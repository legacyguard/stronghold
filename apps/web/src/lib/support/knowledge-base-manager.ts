// Knowledge Base Manager - Dynamic FAQ and Help Articles
// Manages support content with AI-powered search and recommendations

import { createClient } from '@/lib/supabase';

export interface SupportArticle {
  id: string;
  title: string;
  content: string;
  category: SupportCategory;
  subcategory?: string;
  jurisdiction?: 'SK' | 'CZ' | 'universal';
  user_tier?: ('free' | 'premium' | 'enterprise')[];
  difficulty_level: 1 | 2 | 3 | 4 | 5; // 1=beginner, 5=expert

  // AI Enhancement
  keywords: string[];
  auto_generated: boolean;
  effectiveness_score: number; // 0.0-1.0
  view_count: number;
  helpful_votes: number;
  unhelpful_votes: number;

  // SEO and Discovery
  meta_description?: string;
  slug: string;
  featured: boolean;

  // Content Management
  author_id?: string;
  reviewer_id?: string;
  version: number;
  published: boolean;
  published_at?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export type SupportCategory =
  | 'getting_started'
  | 'account_security'
  | 'will_generator'
  | 'document_management'
  | 'family_sharing'
  | 'legal_compliance'
  | 'billing_subscription'
  | 'technical_support'
  | 'privacy_data'
  | 'emergency_access';

export interface SearchFilters {
  category?: SupportCategory;
  jurisdiction?: 'SK' | 'CZ' | 'universal';
  user_tier?: 'free' | 'premium' | 'enterprise';
  difficulty_level?: number[];
  featured_only?: boolean;
}

export interface SearchResult {
  article: SupportArticle;
  relevance_score: number;
  matching_keywords: string[];
  snippet: string;
}

export interface ContentRecommendation {
  article: SupportArticle;
  reason: 'trending' | 'related' | 'personalized' | 'seasonal';
  confidence: number;
}

export interface KnowledgeBaseStats {
  total_articles: number;
  categories_count: Record<SupportCategory, number>;
  avg_effectiveness_score: number;
  most_viewed_articles: SupportArticle[];
  trending_topics: string[];
  coverage_gaps: string[];
}

export class KnowledgeBaseManager {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Search articles with AI-powered relevance scoring
   */
  async searchArticles(
    query: string,
    filters?: SearchFilters,
    limit: number = 10
  ): Promise<SearchResult[]> {

    try {
      let queryBuilder = this.supabase
        .from('support_articles')
        .select('*')
        .eq('published', true);

      // Apply filters
      if (filters?.category) {
        queryBuilder = queryBuilder.eq('category', filters.category);
      }

      if (filters?.jurisdiction) {
        queryBuilder = queryBuilder.or(`jurisdiction.is.null,jurisdiction.eq.${filters.jurisdiction}`);
      }

      if (filters?.user_tier) {
        queryBuilder = queryBuilder.or(`user_tier.is.null,user_tier.cs.{${filters.user_tier}}`);
      }

      if (filters?.difficulty_level) {
        queryBuilder = queryBuilder.in('difficulty_level', filters.difficulty_level);
      }

      if (filters?.featured_only) {
        queryBuilder = queryBuilder.eq('featured', true);
      }

      // Text search
      if (query.trim()) {
        queryBuilder = queryBuilder.textSearch('title,content,keywords', query, {
          type: 'websearch',
          config: 'english'
        });
      }

      const { data: articles, error } = await queryBuilder
        .order('effectiveness_score', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Search failed: ${error.message}`);
      }

      // Calculate relevance scores and create results
      const results: SearchResult[] = (articles || []).map(article => ({
        article,
        relevance_score: this.calculateRelevanceScore(article, query, filters),
        matching_keywords: this.findMatchingKeywords(article, query),
        snippet: this.generateSnippet(article.content, query)
      }));

      // Sort by relevance score
      results.sort((a, b) => b.relevance_score - a.relevance_score);

      // Track search analytics
      await this.trackSearch(query, filters, results.length);

      return results;

    } catch (error) {
      console.error('Knowledge base search error:', error);
      return [];
    }
  }

  /**
   * Get article by ID or slug
   */
  async getArticle(identifier: string): Promise<SupportArticle | null> {
    try {
      const { data: article, error } = await this.supabase
        .from('support_articles')
        .select('*')
        .or(`id.eq.${identifier},slug.eq.${identifier}`)
        .eq('published', true)
        .single();

      if (error || !article) {
        return null;
      }

      // Increment view count
      await this.incrementViewCount(article.id);

      return article;

    } catch (error) {
      console.error('Failed to get article:', error);
      return null;
    }
  }

  /**
   * Get recommended articles based on user context
   */
  async getRecommendations(
    user_context: {
      current_article_id?: string;
      user_tier: 'free' | 'premium' | 'enterprise';
      jurisdiction: 'SK' | 'CZ';
      onboarding_step?: number;
      recent_searches?: string[];
    },
    limit: number = 5
  ): Promise<ContentRecommendation[]> {

    const recommendations: ContentRecommendation[] = [];

    try {
      // 1. Related articles (if viewing an article)
      if (user_context.current_article_id) {
        const relatedArticles = await this.getRelatedArticles(user_context.current_article_id);
        recommendations.push(...relatedArticles.map(article => ({
          article,
          reason: 'related' as const,
          confidence: 0.8
        })));
      }

      // 2. Onboarding-specific recommendations
      if (user_context.onboarding_step && user_context.onboarding_step < 5) {
        const onboardingArticles = await this.getOnboardingArticles(user_context.onboarding_step);
        recommendations.push(...onboardingArticles.map(article => ({
          article,
          reason: 'personalized' as const,
          confidence: 0.9
        })));
      }

      // 3. Tier-specific trending content
      const trendingArticles = await this.getTrendingArticles(user_context.user_tier, user_context.jurisdiction);
      recommendations.push(...trendingArticles.map(article => ({
        article,
        reason: 'trending' as const,
        confidence: 0.7
      })));

      // 4. Seasonal or feature-specific content
      const seasonalArticles = await this.getSeasonalContent();
      recommendations.push(...seasonalArticles.map(article => ({
        article,
        reason: 'seasonal' as const,
        confidence: 0.6
      })));

      // Deduplicate and sort by confidence
      const uniqueRecommendations = this.deduplicateRecommendations(recommendations);
      uniqueRecommendations.sort((a, b) => b.confidence - a.confidence);

      return uniqueRecommendations.slice(0, limit);

    } catch (error) {
      console.error('Failed to get recommendations:', error);
      return [];
    }
  }

  /**
   * Get popular articles by category
   */
  async getPopularArticles(
    category?: SupportCategory,
    jurisdiction?: 'SK' | 'CZ',
    limit: number = 10
  ): Promise<SupportArticle[]> {

    try {
      let queryBuilder = this.supabase
        .from('support_articles')
        .select('*')
        .eq('published', true);

      if (category) {
        queryBuilder = queryBuilder.eq('category', category);
      }

      if (jurisdiction) {
        queryBuilder = queryBuilder.or(`jurisdiction.is.null,jurisdiction.eq.${jurisdiction}`);
      }

      const { data: articles, error } = await queryBuilder
        .order('view_count', { ascending: false })
        .order('helpful_votes', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to get popular articles: ${error.message}`);
      }

      return articles || [];

    } catch (error) {
      console.error('Failed to get popular articles:', error);
      return [];
    }
  }

  /**
   * Vote on article helpfulness
   */
  async voteOnArticle(article_id: string, helpful: boolean): Promise<void> {
    try {
      const column = helpful ? 'helpful_votes' : 'unhelpful_votes';

      await this.supabase.rpc('increment_vote', {
        article_id,
        vote_type: column
      });

      // Update effectiveness score
      await this.updateEffectivenessScore(article_id);

    } catch (error) {
      console.error('Failed to vote on article:', error);
    }
  }

  /**
   * Get knowledge base statistics
   */
  async getStats(): Promise<KnowledgeBaseStats> {
    try {
      // Get total articles and category breakdown
      const { data: articles, error } = await this.supabase
        .from('support_articles')
        .select('category, effectiveness_score, view_count, title')
        .eq('published', true);

      if (error) {
        throw new Error(`Failed to get stats: ${error.message}`);
      }

      const total_articles = articles?.length || 0;
      const categories_count = this.groupByCategory(articles || []);
      const avg_effectiveness_score = this.calculateAverageEffectiveness(articles || []);
      const most_viewed_articles = this.getMostViewed(articles || [], 5);

      return {
        total_articles,
        categories_count,
        avg_effectiveness_score,
        most_viewed_articles,
        trending_topics: await this.getTrendingTopics(),
        coverage_gaps: await this.identifyCoverageGaps()
      };

    } catch (error) {
      console.error('Failed to get knowledge base stats:', error);
      return {
        total_articles: 0,
        categories_count: {} as Record<SupportCategory, number>,
        avg_effectiveness_score: 0,
        most_viewed_articles: [],
        trending_topics: [],
        coverage_gaps: []
      };
    }
  }

  /**
   * Create or update article
   */
  async createArticle(
    article_data: Omit<SupportArticle, 'id' | 'created_at' | 'updated_at' | 'view_count' | 'helpful_votes' | 'unhelpful_votes'>
  ): Promise<SupportArticle> {

    try {
      // Generate slug if not provided
      if (!article_data.slug) {
        article_data.slug = this.generateSlug(article_data.title);
      }

      // Auto-generate keywords if not provided
      if (!article_data.keywords || article_data.keywords.length === 0) {
        article_data.keywords = this.extractKeywords(article_data.title + ' ' + article_data.content);
      }

      const { data: article, error } = await this.supabase
        .from('support_articles')
        .insert({
          ...article_data,
          view_count: 0,
          helpful_votes: 0,
          unhelpful_votes: 0,
          version: 1
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create article: ${error.message}`);
      }

      return article;

    } catch (error) {
      console.error('Failed to create article:', error);
      throw error;
    }
  }

  /**
   * Initialize knowledge base with default content
   */
  async initializeDefaultContent(): Promise<void> {
    const defaultArticles: Omit<SupportArticle, 'id' | 'created_at' | 'updated_at' | 'view_count' | 'helpful_votes' | 'unhelpful_votes'>[] = [
      {
        title: 'Ako začať s LegacyGuard',
        content: `# Vitajte v LegacyGuard!

Táto príručka vám pomôže urobiť prvé kroky v našej aplikácii.

## 1. Dokončenie nastavenia účtu
- Overte váš email
- Nastavte recovery kit
- Vyberte jurisdikciu (SK/CZ)

## 2. Nahrajte prvý dokument
- Kliknite na "Pridať dokument"
- Vyberte súbor z počítača
- AI automaticky kategorizuje váš dokument

## 3. Pozvite rodinných členov
- Prejdite do sekcie "Rodina"
- Pošlite pozvánky emailom
- Nastavte prístupové oprávnenia

## 4. Vytvorte prvý závet
- Použite Generator závetu
- Postupujte podľa krokov wizardu
- Stiahnite PDF pre podpis

**Potrebujete pomoc?** Kontaktujte Sofiu AI alebo náš support tím!`,
        category: 'getting_started',
        jurisdiction: 'universal',
        user_tier: ['free', 'premium', 'enterprise'],
        difficulty_level: 1,
        keywords: ['začiatok', 'getting started', 'prvé kroky', 'onboarding', 'nastavenie'],
        auto_generated: false,
        effectiveness_score: 0.8,
        meta_description: 'Kompletný návod pre začiatočníkov v LegacyGuard aplikácii',
        slug: 'ako-zacat-s-legacyguard',
        featured: true,
        version: 1,
        published: true
      },

      {
        title: 'Bezpečnosť a šifrovanie dokumentov',
        content: `# Bezpečnosť vašich dokumentov

## End-to-End šifrovanie
Všetky vaše dokumenty sú šifrované priamo vo vašom prehliadači pomocou AES-256 šifrovania.

### Ako to funguje:
1. **Vo vašom prehliadači:** Dokument sa zašifruje pred odoslaním
2. **Na serveri:** Ukladajú sa len zašifrované dáta
3. **Dešifrovanie:** Len vy máte kľúč na dešifrovanie

### Recovery Kit
- Obsahuje záložný kľúč pre prístup k vašim dátam
- **Uložte si ho na bezpečné miesto!**
- Bez neho nemôžete obnoviť prístup k šifrovaným dokumentom

### Zero-Knowledge architektúra
- Ani my nemôžeme čítať vaše dokumenty
- Ani hackers nemôžu získať nešifrované dáta
- Ani vládne inštitúcie nemajú prístup

**Vaše súkromie je matematicky zaručené.**`,
        category: 'account_security',
        jurisdiction: 'universal',
        user_tier: ['free', 'premium', 'enterprise'],
        difficulty_level: 2,
        keywords: ['bezpečnosť', 'šifrovanie', 'security', 'encryption', 'privacy', 'recovery kit'],
        auto_generated: false,
        effectiveness_score: 0.9,
        meta_description: 'Ako LegacyGuard chráni vaše dokumenty pomocou end-to-end šifrovania',
        slug: 'bezpecnost-a-sifrovanie',
        featured: true,
        version: 1,
        published: true
      },

      {
        title: 'Právna platnosť závetu na Slovensku',
        content: `# Právna platnosť závetu - Slovensko

## Základné požiadavky
Podľa slovenského práva musí závet spĺňať tieto podmienky:

### Formy závetu:
1. **Holografný závet** (najčastejší)
   - Celý vlastnoručne napísaný
   - Vlastnoručne podpísaný
   - Obsahuje dátum

2. **Alografný závet**
   - Môže byť napísaný/tlačený
   - Podpísaný pred 2 svedkami
   - Svedkovia nesmú byť beneficienti

3. **Notársky závet**
   - Podpísaný pred notárom
   - Najvyššia právna istota

## Čo vygeneruje LegacyGuard:
- Obsahovo správny text závetu
- Inštrukcie pre právnu platnosť
- Odporúčania pre vašu situáciu

## Dôležité upozornenie:
⚠️ **Samotné vygenerovanie PDF ešte neznamená právnu platnosť!**

Musíte dodržať formálne náležitosti podľa slovenského práva.

### Odporúčanie:
Pre 100% istotu využite kontrolu nášho právneho partnera.`,
        category: 'legal_compliance',
        jurisdiction: 'SK',
        user_tier: ['free', 'premium', 'enterprise'],
        difficulty_level: 3,
        keywords: ['závet', 'will', 'slovensko', 'slovakia', 'právna platnosť', 'legal validity', 'notár'],
        auto_generated: false,
        effectiveness_score: 0.85,
        meta_description: 'Kompletný návod na právnu platnosť závetu podľa slovenského práva',
        slug: 'pravna-platnost-zavetu-slovensko',
        featured: true,
        version: 1,
        published: true
      },

      {
        title: 'Cenové plány a funkcie',
        content: `# Cenové plány LegacyGuard

## 🆓 Free Plan (Zdarma)
**Ideálny pre začiatočníkov**
- 5 dokumentov
- 10 Sofia AI správ/mesiac
- 1 PDF generácia/mesiac
- 2 rodinní členovia
- 1 guardian
- Základná podpora (72h)

## 💎 Premium Plan (4€/mesiac)
**Pre aktívne rodiny**
- 100 dokumentov
- 200 Sofia AI správ/mesiac
- 10 PDF generácií/mesiac
- 10 rodinných členov
- 5 guardians
- ✅ Plný prístup k Sofia AI
- ✅ Generator závetu
- ✅ Emergency protokoly
- Prioritná podpora (24h)

## 🏢 Enterprise Plan (9€/mesiac)
**Pre náročných používateľov**
- ♾️ Neobmedzené všetko
- 🚀 Prioritná podpora (4h)
- 📊 Pokročilé analytiky
- 🔌 API prístup
- 📞 Telefónna podpora
- 👨‍💼 Dedikovaný account manager

## Platobné možnosti:
- 💳 Kreditná/debetná karta
- 🏦 SEPA prevod
- 💰 Ročné zľavy dostupné

**Upgrade/downgrade kedykoľvek bez viazanosti.**`,
        category: 'billing_subscription',
        jurisdiction: 'universal',
        user_tier: ['free', 'premium', 'enterprise'],
        difficulty_level: 1,
        keywords: ['ceny', 'pricing', 'predplatné', 'subscription', 'upgrade', 'premium', 'enterprise'],
        auto_generated: false,
        effectiveness_score: 0.88,
        meta_description: 'Prehľad cenových plánov a funkcií LegacyGuard platformy',
        slug: 'cenove-plany-a-funkcie',
        featured: true,
        version: 1,
        published: true
      }
    ];

    // Insert articles one by one
    for (const article of defaultArticles) {
      try {
        await this.createArticle(article);
        console.log(`Created article: ${article.title}`);
      } catch (error) {
        console.error(`Failed to create article ${article.title}:`, error);
      }
    }
  }

  /**
   * Private helper methods
   */
  private calculateRelevanceScore(
    article: SupportArticle,
    query: string,
    filters?: SearchFilters
  ): number {
    let score = article.effectiveness_score;

    // Boost for exact keyword matches
    const queryWords = query.toLowerCase().split(' ');
    const keywordMatches = article.keywords.filter(keyword =>
      queryWords.some(word => keyword.toLowerCase().includes(word))
    ).length;
    score += (keywordMatches / article.keywords.length) * 0.3;

    // Boost for title matches
    if (article.title.toLowerCase().includes(query.toLowerCase())) {
      score += 0.2;
    }

    // Filter relevance boosts
    if (filters?.user_tier && article.user_tier?.includes(filters.user_tier)) {
      score += 0.1;
    }

    if (filters?.jurisdiction && article.jurisdiction === filters.jurisdiction) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  private findMatchingKeywords(article: SupportArticle, query: string): string[] {
    const queryWords = query.toLowerCase().split(' ');
    return article.keywords.filter(keyword =>
      queryWords.some(word => keyword.toLowerCase().includes(word))
    );
  }

  private generateSnippet(content: string, query: string, maxLength: number = 200): string {
    const sentences = content.split('.');
    const queryWords = query.toLowerCase().split(' ');

    // Find sentence with most query word matches
    let bestSentence = sentences[0];
    let maxMatches = 0;

    for (const sentence of sentences) {
      const matches = queryWords.filter(word =>
        sentence.toLowerCase().includes(word)
      ).length;

      if (matches > maxMatches) {
        maxMatches = matches;
        bestSentence = sentence;
      }
    }

    // Truncate if too long
    if (bestSentence.length > maxLength) {
      return bestSentence.substring(0, maxLength) + '...';
    }

    return bestSentence.trim();
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[ščťžýáíéúôňľŕďĺ]/g, (match) => {
        const map: Record<string, string> = {
          'š': 's', 'č': 'c', 'ť': 't', 'ž': 'z', 'ý': 'y',
          'á': 'a', 'í': 'i', 'é': 'e', 'ú': 'u', 'ô': 'o',
          'ň': 'n', 'ľ': 'l', 'ŕ': 'r', 'ď': 'd', 'ĺ': 'l'
        };
        return map[match] || match;
      })
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private extractKeywords(text: string, limit: number = 10): string[] {
    // Simple keyword extraction - in production would use more sophisticated NLP
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    // Count word frequency
    const wordCount: Record<string, number> = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // Sort by frequency and return top keywords
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([word]) => word);
  }

  private async getRelatedArticles(article_id: string): Promise<SupportArticle[]> {
    // Implementation would find articles with similar keywords/category
    return [];
  }

  private async getOnboardingArticles(step: number): Promise<SupportArticle[]> {
    // Implementation would return step-specific articles
    return [];
  }

  private async getTrendingArticles(user_tier: string, jurisdiction: string): Promise<SupportArticle[]> {
    // Implementation would return currently popular articles
    return [];
  }

  private async getSeasonalContent(): Promise<SupportArticle[]> {
    // Implementation would return seasonal/feature-specific content
    return [];
  }

  private deduplicateRecommendations(recommendations: ContentRecommendation[]): ContentRecommendation[] {
    const seen = new Set<string>();
    return recommendations.filter(rec => {
      if (seen.has(rec.article.id)) {
        return false;
      }
      seen.add(rec.article.id);
      return true;
    });
  }

  private async incrementViewCount(article_id: string): Promise<void> {
    await this.supabase.rpc('increment_view_count', { article_id });
  }

  private async updateEffectivenessScore(article_id: string): Promise<void> {
    // Calculate new effectiveness score based on votes and views
    // Implementation would use algorithm to update score
  }

  private async trackSearch(query: string, filters?: SearchFilters, results_count: number = 0): Promise<void> {
    // Track search analytics for improving content
  }

  private async getTrendingTopics(): Promise<string[]> {
    // Analyze search queries and popular keywords
    return [];
  }

  private async identifyCoverageGaps(): Promise<string[]> {
    // Identify topics with high search volume but low content
    return [];
  }

  private groupByCategory(articles: any[]): Record<SupportCategory, number> {
    const counts = {} as Record<SupportCategory, number>;
    articles.forEach(article => {
      const category = article.category as SupportCategory;
      counts[category] = (counts[category] || 0) + 1;
    });
    return counts;
  }

  private calculateAverageEffectiveness(articles: any[]): number {
    if (articles.length === 0) return 0;
    const sum = articles.reduce((acc, article) => acc + (article.effectiveness_score || 0), 0);
    return sum / articles.length;
  }

  private getMostViewed(articles: any[], limit: number): SupportArticle[] {
    return articles
      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
      .slice(0, limit);
  }
}

// Export singleton instance
export const knowledgeBaseManager = new KnowledgeBaseManager();