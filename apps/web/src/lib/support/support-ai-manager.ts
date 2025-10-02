// Support AI Manager - Enhanced Sofia for User Support
// Integrates with existing Sofia AI system for intelligent user support

import { createClient } from '@/lib/supabase';
import { SofiaConversationManager } from '@/lib/sofia/conversation-manager';
import type { UserProfile } from '@/types';

export type SupportConversationType =
  | 'tech_support'
  | 'legal_guidance'
  | 'billing_help'
  | 'feature_tutorial'
  | 'onboarding_assist'
  | 'emergency_support';

export interface SupportContext {
  user_tier: 'free' | 'premium' | 'enterprise';
  current_page?: string;
  recent_actions?: UserAction[];
  documents_count?: number;
  onboarding_step?: number;
  browser_info?: BrowserDetails;
  subscription_status?: string;
  last_login?: string;
  jurisdiction?: string;
  language?: string;
}

export interface UserAction {
  action_type: string;
  timestamp: string;
  success: boolean;
  error_message?: string;
  page_url?: string;
}

export interface BrowserDetails {
  user_agent: string;
  browser_name: string;
  browser_version: string;
  os_name: string;
  screen_resolution: string;
  language: string;
}

export interface SupportAIResponse {
  content: string;
  confidence: number;
  response_type: 'rule_based' | 'knowledge_base' | 'ai_generated';
  follow_up_questions: string[];
  suggested_articles: SuggestedArticle[];
  escalation_recommended: boolean;
  resolution_probability: number;
  estimated_resolution_time?: number;
  next_steps?: string[];
  requires_human?: boolean;
}

export interface SuggestedArticle {
  id: string;
  title: string;
  url: string;
  relevance_score: number;
  estimated_read_time: number;
}

export interface EscalationTrigger {
  sentiment_negative: boolean;
  retry_count: number;
  complexity_score: number;
  requires_human: boolean;
  legal_sensitive: boolean;
  billing_related: boolean;
  user_tier_escalation: boolean;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: 'technical' | 'legal' | 'billing' | 'feature_request';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';

  // AI Analysis
  sentiment_score?: number;
  complexity_score?: number;
  ai_responses_count: number;
  escalated_reason?: string;

  // Resolution
  assigned_agent_id?: string;
  resolved_at?: string;
  resolution_time_minutes?: number;
  satisfaction_rating?: number;

  created_at: string;
  updated_at: string;
}

export class SupportAIManager {
  private supabase;
  private sofiaManager: SofiaConversationManager;

  // Rule-based responses for instant, zero-cost support
  private static RULE_BASED_RESPONSES: Record<string, SupportAIResponse> = {
    'password_reset': {
      content: `Na obnovenie hesla:

1. Kliknite na "Zabudli ste heslo?" na prihlasovcej stránke
2. Zadajte svoj email
3. Skontrolujte emailovú schránku (aj spam)
4. Kliknite na odkaz v emaili
5. Zadajte nové heslo

⚠️ **Dôležité:** Pre prístup k šifrovaným dokumentom budete potrebovať Recovery Kit, ktorý ste si uložili pri registrácii.`,
      confidence: 0.95,
      response_type: 'rule_based',
      follow_up_questions: [
        'Nedostal som email na obnovenie hesla',
        'Neviem nájsť môj Recovery Kit',
        'Ako si vytvorím nový Recovery Kit?'
      ],
      suggested_articles: [],
      escalation_recommended: false,
      resolution_probability: 0.9
    },

    'will_validity': {
      content: `🏛️ **Právna platnosť závetu:**

Aplikácia vygeneruje dokument obsahovo zodpovedajúci zákonným požiadavkám, ale aby sa stal **právne platným**:

**Slovensko/Česko:**
1. **Holografný závet:** Celý vlastnoručne prepísať a podpísať
2. **Alografný závet:** Podpísať pred 2 svedkami (nie beneficienti)
3. **Notársky závet:** Podpísať pred notárom

📋 **Po vygenerovaní** dostanete presné inštrukcie pre vašu jurisdikciu.

💡 **Odporúčame:** Právnu kontrolu nášho partnera pre 100% istotu.`,
      confidence: 0.98,
      response_type: 'rule_based',
      follow_up_questions: [
        'Ako nájdem notára vo svojom meste?',
        'Koľko stojí notárska služba?',
        'Môžem použiť rodinných príslušníkov ako svedkov?'
      ],
      suggested_articles: [],
      escalation_recommended: false,
      resolution_probability: 0.85
    },

    'document_security': {
      content: `🔒 **Bezpečnosť vašich dokumentov:**

**Matematicky zaručené súkromie:**
- ✅ End-to-end šifrovanie vo vašom prehliadači
- ✅ Zero-knowledge architektúra - my nemáme kľúče
- ✅ Nikto z LegacyGuard nemôže čítať vaše dokumenty
- ✅ Ani my, ani hackers, ani vládne inštitúcie

**Ako to funguje:**
1. Dokumenty sa šifrujú VO VAŠOM prehliadači
2. Na server idú už zašifrované dáta
3. Dešifrovací kľúč máte len vy

🛡️ **Vaše súkromie je naša priorita #1**`,
      confidence: 0.99,
      response_type: 'rule_based',
      follow_up_questions: [
        'Čo ak zabudnem heslo?',
        'Môžem zdieľať dokumenty s rodinou?',
        'Ako funguje Recovery Kit?'
      ],
      suggested_articles: [],
      escalation_recommended: false,
      resolution_probability: 0.95
    },

    'hard_refresh': {
      content: `🔄 **Riešenie technických problémov:**

**Prvé kroky (vyriešia 80% problémov):**

1. **Hard Refresh:**
   - Windows: Ctrl + Shift + R
   - Mac: Cmd + Shift + R

2. **Vymazať cache:**
   - Chrome: F12 → Network → Disable cache
   - Firefox: F12 → Settings → Disable cache

3. **Skúste iný prehliadač:**
   - Chrome → Firefox alebo Edge
   - Pomôže identifikovať browser-specific issues

4. **Skontrolujte internet:**
   - Stabilné pripojenie je kľúčové pre upload dokumentov

💡 **Stále problém?** Kontaktujte nás s detailmi: aký browser, aká chyba, čo ste robili.`,
      confidence: 0.92,
      response_type: 'rule_based',
      follow_up_questions: [
        'Stále sa mi nezobrazuje stránka správne',
        'Upload dokumentu nefunguje',
        'Aplikácia sa načítava pomaly'
      ],
      suggested_articles: [],
      escalation_recommended: false,
      resolution_probability: 0.8
    },

    'subscription_tiers': {
      content: `💳 **Naše cenové plány:**

🆓 **Free (Zdarma):**
- 5 dokumentov
- 10 AI správ/mesiac
- 1 PDF generácia/mesiac
- 2 rodinní členovia
- 1 guardian

💎 **Premium (4€/mesiac):**
- 100 dokumentov
- 200 AI správ/mesiac
- 10 PDF generácií/mesiac
- 10 rodinných členov
- 5 guardians
- ✅ Sofia AI prístup
- ✅ Generator závetu

🏢 **Enterprise (9€/mesiac):**
- ♾️ Neobmedzené všetko
- 🚀 Prioritná podpora
- 📊 Pokročilé analytiky
- 🔌 API prístup

📈 **Upgrade kedykoľvek** v nastaveniach účtu.`,
      confidence: 0.97,
      response_type: 'rule_based',
      follow_up_questions: [
        'Ako môžem upgradnúť svoj účet?',
        'Môžem zrušiť predplatné kedykoľvek?',
        'Aké sú platobné možnosti?'
      ],
      suggested_articles: [],
      escalation_recommended: false,
      resolution_probability: 0.9
    }
  };

  constructor() {
    this.supabase = createClient();
    this.sofiaManager = new SofiaConversationManager();
  }

  /**
   * Generate AI support response with enhanced capabilities
   */
  async generateSupportResponse(
    query: string,
    context: SupportContext,
    userId: string,
    conversation_id?: string
  ): Promise<SupportAIResponse> {

    // 1. Try rule-based responses first (zero cost)
    const ruleBasedResponse = this.checkRuleBasedResponses(query, context);
    if (ruleBasedResponse) {
      await this.trackSupportInteraction(context, query, ruleBasedResponse);
      return ruleBasedResponse;
    }

    // 2. Search knowledge base
    const knowledgeResponse = await this.searchKnowledgeBase(query, context);
    if (knowledgeResponse && knowledgeResponse.confidence > 0.7) {
      await this.trackSupportInteraction(context, query, knowledgeResponse);
      return knowledgeResponse;
    }

    // 3. Check escalation triggers
    const shouldEscalate = this.checkEscalationTriggers(query, context);
    if (shouldEscalate.requires_human) {
      return this.createEscalationResponse(query, context, shouldEscalate);
    }

    // 4. Use AI generation for complex queries (cost-controlled)
    if (this.canUseAI(context)) {
      const aiResponse = await this.generateAIResponse(query, context, userId, conversation_id);
      await this.trackSupportInteraction(context, query, aiResponse);
      return aiResponse;
    }

    // 5. Fallback to guided self-help
    return this.createSelfHelpResponse(query, context);
  }

  /**
   * Check rule-based responses for instant answers
   */
  private checkRuleBasedResponses(query: string, context: SupportContext): SupportAIResponse | null {
    const queryLower = query.toLowerCase();

    // Password and login issues
    if (queryLower.includes('heslo') || queryLower.includes('password') || queryLower.includes('prihlásenie')) {
      return SupportAIManager.RULE_BASED_RESPONSES.password_reset;
    }

    // Will validity questions
    if ((queryLower.includes('závet') || queryLower.includes('will')) &&
        (queryLower.includes('platný') || queryLower.includes('valid') || queryLower.includes('legal'))) {
      return SupportAIManager.RULE_BASED_RESPONSES.will_validity;
    }

    // Security and privacy
    if (queryLower.includes('bezpečnosť') || queryLower.includes('security') ||
        queryLower.includes('súkromie') || queryLower.includes('privacy') ||
        queryLower.includes('čítať dokumenty')) {
      return SupportAIManager.RULE_BASED_RESPONSES.document_security;
    }

    // Technical issues
    if (queryLower.includes('nefunguje') || queryLower.includes('problém') ||
        queryLower.includes('error') || queryLower.includes('načítava') ||
        queryLower.includes('zobrazuje')) {
      return SupportAIManager.RULE_BASED_RESPONSES.hard_refresh;
    }

    // Pricing and subscriptions
    if (queryLower.includes('cena') || queryLower.includes('price') ||
        queryLower.includes('predplatné') || queryLower.includes('subscription') ||
        queryLower.includes('plán') || queryLower.includes('tier')) {
      return SupportAIManager.RULE_BASED_RESPONSES.subscription_tiers;
    }

    return null;
  }

  /**
   * Search knowledge base for relevant articles
   */
  private async searchKnowledgeBase(query: string, context: SupportContext): Promise<SupportAIResponse | null> {
    try {
      // Search support articles with context filtering
      const { data: articles, error } = await this.supabase
        .from('support_articles')
        .select('*')
        .textSearch('title,content', query, { config: 'english' })
        .eq('published', true)
        .or(`jurisdiction.is.null,jurisdiction.eq.${context.jurisdiction || 'SK'}`)
        .or(`user_tier.is.null,user_tier.cs.{${context.user_tier}}`)
        .order('effectiveness_score', { ascending: false })
        .limit(5);

      if (error || !articles || articles.length === 0) {
        return null;
      }

      const bestArticle = articles[0];

      return {
        content: bestArticle.content,
        confidence: bestArticle.effectiveness_score || 0.5,
        response_type: 'knowledge_base',
        follow_up_questions: this.generateFollowUpQuestions(bestArticle.category),
        suggested_articles: articles.slice(1, 4).map(article => ({
          id: article.id,
          title: article.title,
          url: `/help/article/${article.id}`,
          relevance_score: article.effectiveness_score || 0.5,
          estimated_read_time: Math.ceil((article.content.length / 1000) * 2) // ~2 min per 1000 chars
        })),
        escalation_recommended: false,
        resolution_probability: bestArticle.effectiveness_score || 0.5
      };

    } catch (error) {
      console.error('Knowledge base search error:', error);
      return null;
    }
  }

  /**
   * Check if conversation should be escalated to human
   */
  private checkEscalationTriggers(query: string, context: SupportContext): EscalationTrigger {
    const queryLower = query.toLowerCase();

    return {
      sentiment_negative: this.detectNegativeSentiment(query),
      retry_count: 0, // Would be tracked in conversation history
      complexity_score: this.calculateComplexityScore(query),
      requires_human: this.requiresHumanExpertise(query),
      legal_sensitive: queryLower.includes('právnik') || queryLower.includes('lawyer') ||
                      queryLower.includes('súd') || queryLower.includes('court'),
      billing_related: queryLower.includes('fakturácia') || queryLower.includes('billing') ||
                      queryLower.includes('platba') || queryLower.includes('payment'),
      user_tier_escalation: context.user_tier === 'enterprise'
    };
  }

  /**
   * Generate AI response for complex queries
   */
  private async generateAIResponse(
    query: string,
    context: SupportContext,
    userId: string,
    conversation_id?: string
  ): Promise<SupportAIResponse> {

    // Use existing Sofia AI with support-specific context
    const supportContext = {
      user_tier: context.user_tier,
      support_mode: true,
      current_issue: query,
      browser_info: context.browser_info,
      recent_actions: context.recent_actions
    };

    try {
      const aiResponse = await SofiaConversationManager.sendMessage(userId, {
        conversation_id: conversation_id || undefined,
        message: query,
        context: supportContext
      });

      if (aiResponse.success && aiResponse.data) {
        return {
          content: aiResponse.data.content,
          confidence: aiResponse.data.confidence_score ?? 0.7,
          response_type: 'ai_generated',
          follow_up_questions: this.generateContextualFollowUp(query, context),
          suggested_articles: [],
          escalation_recommended: (aiResponse.data.confidence_score ?? 0.7) < 0.6,
          resolution_probability: aiResponse.data.confidence_score ?? 0.7,
          estimated_resolution_time: this.estimateResolutionTime(query, context)
        };
      }
    } catch (error) {
      console.error('AI response generation error:', error);
    }

    // Fallback if AI fails
    return this.createSelfHelpResponse(query, context);
  }

  /**
   * Create escalation response for human handoff
   */
  private createEscalationResponse(
    query: string,
    context: SupportContext,
    trigger: EscalationTrigger
  ): SupportAIResponse {
    let escalationMessage = '';

    if (trigger.legal_sensitive) {
      escalationMessage = `🏛️ **Právna konzultácia potrebná**

Vaša otázka sa týka právnych záležitostí, ktoré vyžadujú odbornú konzultáciu.

**Vytvorím vám ticket pre nášho právneho partnera:**
- ⚡ Enterprise: Odpoveď do 4 hodín
- 💎 Premium: Odpoveď do 24 hodín
- 🆓 Free: Odpoveď do 72 hodín

Právnik sa s vami spojí priamo na váš email.`;
    } else if (trigger.billing_related) {
      escalationMessage = `💳 **Fakturačná podpora**

Otázky týkajúce sa platieb a fakturácie rieši náš billing tím.

**Vytvorím vám prioritný ticket:**
- Všetky tiery: Odpoveď do 24 hodín
- Refund requests: Odpoveď do 4 hodín

Prosím, uveďte číslo objednávky ak ho máte.`;
    } else if (trigger.user_tier_escalation) {
      escalationMessage = `🏢 **Enterprise Priority Support**

Ako Enterprise klient máte nárok na prioritnú podporu.

**Váš ticket bude spracovaný okamžite:**
- ⚡ Cieľový čas odpovede: 4 hodiny
- 📞 Telefónna podpora dostupná
- 🎯 Dedikovaný account manager

Už vytváram váš prioritný ticket...`;
    } else {
      escalationMessage = `🎫 **Vytváram support ticket**

Vaša otázka vyžaduje individuálnu pozornosť nášho support tímu.

**Čo sa deje ďalej:**
1. Vytvorím ticket s kontextom vašej otázky
2. Náš agent vás kontaktuje na email
3. Dostanete tracking číslo pre sledovanie

Odpoveď očakávajte podľa vášho plátna.`;
    }

    return {
      content: escalationMessage,
      confidence: 1.0,
      response_type: 'rule_based',
      follow_up_questions: [
        'Môžem dostať telefónnu podporu?',
        'Ako dlho bude trvať riešenie?',
        'Kde môžem sledovať stav môjho ticketu?'
      ],
      suggested_articles: [],
      escalation_recommended: true,
      resolution_probability: 0.95,
      requires_human: true
    };
  }

  /**
   * Create support ticket for human agent
   */
  async createSupportTicket(
    user_id: string,
    title: string,
    description: string,
    context: SupportContext,
    category?: string
  ): Promise<SupportTicket> {

    const ticket_data = {
      user_id,
      title,
      description,
      category: category || this.categorizeQuery(description),
      priority: this.determinePriority(context, description),
      sentiment_score: this.detectNegativeSentiment(description) ? 0.2 : 0.7,
      complexity_score: this.calculateComplexityScore(description),
      ai_responses_count: 0
    };

    const { data: ticket, error } = await this.supabase
      .from('support_tickets')
      .insert(ticket_data)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create support ticket: ${error.message}`);
    }

    // Send notification to support team for high priority tickets
    if (ticket_data.priority === 'urgent' || ticket_data.priority === 'high') {
      await this.notifySupportTeam(ticket);
    }

    return ticket;
  }

  /**
   * Track support interaction for analytics
   */
  private async trackSupportInteraction(
    context: SupportContext,
    query: string,
    response: SupportAIResponse
  ): Promise<void> {
    try {
      await this.supabase
        .from('support_interactions')
        .insert({
          ticket_id: null, // For non-ticket interactions
          message_type: 'ai',
          content: response.content,
          confidence_score: response.confidence,
          response_time_ms: 100, // AI responses are fast
          knowledge_source: response.response_type
        });

      // Update user support health
      await this.updateUserSupportHealth(context, response);

    } catch (error) {
      console.error('Failed to track support interaction:', error);
    }
  }

  /**
   * Analyze ticket intent and provide AI recommendations
   */
  async analyzeTicketIntent(
    title: string,
    description: string,
    context: Record<string, any>
  ): Promise<{
    suggested_category: string;
    suggested_priority: string;
    escalation_reason: string;
    confidence: number;
    quick_fixes: string[];
  }> {
    const combinedText = `${title} ${description}`.toLowerCase();

    // Analyze category
    let suggested_category = 'technical';
    let category_confidence = 0.5;

    if (combinedText.includes('platba') || combinedText.includes('billing') ||
        combinedText.includes('fakturácia') || combinedText.includes('payment')) {
      suggested_category = 'billing';
      category_confidence = 0.9;
    } else if (combinedText.includes('právny') || combinedText.includes('legal') ||
               combinedText.includes('závet') || combinedText.includes('will') ||
               combinedText.includes('notár') || combinedText.includes('súd')) {
      suggested_category = 'legal';
      category_confidence = 0.9;
    } else if (combinedText.includes('feature') || combinedText.includes('funkcia') ||
               combinedText.includes('návrh') || combinedText.includes('improvement')) {
      suggested_category = 'feature_request';
      category_confidence = 0.8;
    } else if (combinedText.includes('error') || combinedText.includes('bug') ||
               combinedText.includes('nefunguje') || combinedText.includes('problém')) {
      suggested_category = 'technical';
      category_confidence = 0.9;
    }

    // Analyze priority
    let suggested_priority = 'medium';
    let priority_confidence = 0.6;

    if (combinedText.includes('urgent') || combinedText.includes('naliehavé') ||
        combinedText.includes('kritické') || combinedText.includes('critical')) {
      suggested_priority = 'urgent';
      priority_confidence = 0.9;
    } else if (combinedText.includes('dôležité') || combinedText.includes('important') ||
               combinedText.includes('asap') || combinedText.includes('čo najskôr')) {
      suggested_priority = 'high';
      priority_confidence = 0.8;
    } else if (combinedText.includes('nie je naliehavé') || combinedText.includes('not urgent') ||
               combinedText.includes('môže počkať') || combinedText.includes('can wait')) {
      suggested_priority = 'low';
      priority_confidence = 0.8;
    }

    // Generate quick fixes based on common issues
    const quick_fixes: string[] = [];

    if (combinedText.includes('heslo') || combinedText.includes('password')) {
      quick_fixes.push('Skúste obnoviť heslo cez "Zabudli ste heslo?" odkaz');
      quick_fixes.push('Skontrolujte spam folder pre reset email');
      quick_fixes.push('Uistite sa, že máte uložený Recovery Kit');
    }

    if (combinedText.includes('načítava') || combinedText.includes('pomaly') ||
        combinedText.includes('loading') || combinedText.includes('slow')) {
      quick_fixes.push('Vykonajte hard refresh (Ctrl+Shift+R)');
      quick_fixes.push('Vymazajte cache prehliadača');
      quick_fixes.push('Skúste iný prehliadač');
    }

    if (combinedText.includes('upload') || combinedText.includes('nahrať') ||
        combinedText.includes('dokument')) {
      quick_fixes.push('Skontrolujte internetové pripojenie');
      quick_fixes.push('Uistite sa, že súbor je menší ako 10MB');
      quick_fixes.push('Podporované formáty: PDF, JPG, PNG, DOC, DOCX');
    }

    // Determine escalation reason
    let escalation_reason = '';

    if (suggested_category === 'legal' && category_confidence > 0.8) {
      escalation_reason = 'Právne otázky vyžadujú odbornú konzultáciu';
    } else if (suggested_category === 'billing' && category_confidence > 0.8) {
      escalation_reason = 'Billing otázky spracováva špecializovaný tím';
    } else if (suggested_priority === 'urgent') {
      escalation_reason = 'Urgentné problémy vyžadujú okamžitú pozornosť';
    } else if (this.detectNegativeSentiment(description)) {
      escalation_reason = 'Detekovaná negatívna nálada - potrebná ľudská empátia';
    } else if (description.length > 500) {
      escalation_reason = 'Komplexný problém vyžaduje detailnú analýzu';
    }

    // Calculate overall confidence
    const overall_confidence = (category_confidence + priority_confidence) / 2;

    return {
      suggested_category,
      suggested_priority,
      escalation_reason,
      confidence: overall_confidence,
      quick_fixes
    };
  }

  /**
   * Helper methods
   */
  private canUseAI(context: SupportContext): boolean {
    // Check subscription limits and usage
    return context.user_tier !== 'free' || true; // For now, allow AI for all
  }

  private detectNegativeSentiment(text: string): boolean {
    const negativeWords = ['frustrated', 'angry', 'broken', 'terrible', 'awful', 'hate', 'rozčúlený', 'hrozné', 'nefunguje'];
    return negativeWords.some(word => text.toLowerCase().includes(word));
  }

  private calculateComplexityScore(query: string): number {
    // Simple heuristic based on query characteristics
    let score = 0.3; // base complexity

    if (query.length > 200) score += 0.2;
    if (query.includes('?') && query.split('?').length > 2) score += 0.2;
    if (query.toLowerCase().includes('legal') || query.includes('právny')) score += 0.3;
    if (query.toLowerCase().includes('technical') || query.includes('technický')) score += 0.2;

    return Math.min(score, 1.0);
  }

  private requiresHumanExpertise(query: string): boolean {
    const humanRequired = ['refund', 'cancel subscription', 'legal advice', 'court', 'lawsuit', 'právnik', 'súd'];
    return humanRequired.some(term => query.toLowerCase().includes(term));
  }

  private categorizeQuery(query: string): string {
    const queryLower = query.toLowerCase();

    if (queryLower.includes('payment') || queryLower.includes('billing') || queryLower.includes('platba')) return 'billing';
    if (queryLower.includes('legal') || queryLower.includes('právny') || queryLower.includes('závet')) return 'legal';
    if (queryLower.includes('error') || queryLower.includes('bug') || queryLower.includes('nefunguje')) return 'technical';

    return 'feature_request';
  }

  private determinePriority(context: SupportContext, query: string): string {
    if (context.user_tier === 'enterprise') return 'high';
    if (this.detectNegativeSentiment(query)) return 'medium';
    if (query.toLowerCase().includes('urgent') || query.includes('naliehavé')) return 'high';

    return 'medium';
  }

  private generateFollowUpQuestions(category: string): string[] {
    const questions: Record<string, string[]> = {
      'technical': [
        'Stále máte problém po vykonaní týchto krokov?',
        'Môžete poslať screenshot chyby?',
        'V akom prehliadači sa problém vyskytuje?'
      ],
      'legal': [
        'Potrebujete konzultáciu s našim právnym partnerom?',
        'O akú jurisdikciu sa jedná (SK/CZ)?',
        'Chcete si nechať závet skontrolovať odborníkom?'
      ],
      'billing': [
        'Máte otázky o upgrade na vyšší plán?',
        'Potrebujete faktúru na firmu?',
        'Chcete zmeniť platobný cyklus?'
      ]
    };

    return questions[category] || [
      'Pomohla vám táto odpoveď?',
      'Potrebujete dodatočné informácie?',
      'Máte ďalšie otázky?'
    ];
  }

  private generateContextualFollowUp(query: string, context: SupportContext): string[] {
    // Generate follow-up questions based on user context and query
    const questions = [];

    if (context.onboarding_step && context.onboarding_step < 5) {
      questions.push('Potrebujete pomoc s dokončením nastavenia účtu?');
    }

    if (context.documents_count === 0) {
      questions.push('Chcete sa naučiť ako nahrať prvý dokument?');
    }

    if (context.user_tier === 'free') {
      questions.push('Zaujíma vás upgrade na Premium pre viac funkcií?');
    }

    return questions.slice(0, 3); // Max 3 follow-ups
  }

  private estimateResolutionTime(query: string, context: SupportContext): number {
    // Estimate resolution time in minutes
    const complexity = this.calculateComplexityScore(query);
    const baseTime = context.user_tier === 'enterprise' ? 10 : 30;

    return Math.round(baseTime * (1 + complexity));
  }

  private createSelfHelpResponse(query: string, context: SupportContext): SupportAIResponse {
    return {
      content: `📚 **Pomôžem vám nájsť odpoveď**

Bohužiaľ, neviem presne odpovedať na vašu otázku, ale môžem vám ponúknúť tieto možnosti:

1. 🔍 **Prehľadajte Help Center** - možno nájdete odpoveď v našich článkoch
2. 💬 **Preformulujte otázku** - skúste použiť iné kľúčové slová
3. 🎫 **Vytvorte ticket** - náš tím vám odpovie osobne
4. 📞 **Kontaktujte nás** - podpora@legacyguard.sk

${context.user_tier === 'enterprise' ? '⚡ **Enterprise podpora** dostupná 24/7' : ''}`,
      confidence: 0.3,
      response_type: 'rule_based',
      follow_up_questions: [
        'Ako môžem vytvoriť support ticket?',
        'Kde nájdem Help Center?',
        'Aké sú kontaktné údaje podpory?'
      ],
      suggested_articles: [],
      escalation_recommended: true,
      resolution_probability: 0.2
    };
  }

  private async updateUserSupportHealth(context: SupportContext, response: SupportAIResponse): Promise<void> {
    // Update user support health metrics for proactive support
    // This would track user satisfaction, resolution rates, etc.
    // Implementation would depend on specific analytics needs
  }

  private async notifySupportTeam(ticket: SupportTicket): Promise<void> {
    // Send notification to human support team
    // Could integrate with Slack, email, or ticketing system
    console.log(`High priority ticket created: ${ticket.id}`);
  }
}

// Utility functions for support AI
export function createSupportAIManager(): SupportAIManager {
  return new SupportAIManager();
}

export async function getQuickSupportResponse(query: string, user_context: SupportContext, userId: string): Promise<SupportAIResponse> {
  const manager = new SupportAIManager();
  return manager.generateSupportResponse(query, user_context, userId);
}