import { supabase } from '@/lib/supabase';
import {
  SofiaConversation,
  SofiaMessage,
  SofiaMessageRequest,
  SofiaContext,
  APIResponse,
  SubscriptionUsage
} from '@/types';
import { DashboardManager } from '@/lib/dashboard/dashboard-manager';

export class SofiaConversationManager {
  // Cache for common responses (zero API cost)
  private static responseCache = new Map<string, any>();

  // Rate limiting storage
  private static userLimits = new Map<string, { count: number; resetTime: number }>();

  /**
   * Start a new conversation with Sofia
   */
  static async startConversation(
    userId: string,
    conversationType: SofiaConversation['conversation_type'] = 'onboarding',
    initialContext?: Partial<SofiaContext>
  ): Promise<APIResponse<SofiaConversation>> {
    try {
      // Check if user can start new conversation
      const canProceed = await this.checkAIUsageLimits(userId);
      if (!canProceed.success || !canProceed.data?.canProceed) {
        return {
          success: false,
          error: `AI message limit reached. Current usage: ${canProceed.data?.currentUsage}/${canProceed.data?.limit}`
        };
      }

      // Get user profile for context
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name, language_preference, timezone, subscription_tier')
        .eq('id', userId)
        .single();

      const defaultContext: SofiaContext = {
        current_task: undefined,
        user_goals: [],
        mentioned_documents: [],
        mentioned_family_members: [],
        conversation_stage: 'greeting',
        user_tier: profile?.subscription_tier || 'free',
        language: profile?.language_preference || 'sk',
        timezone: profile?.timezone || 'Europe/Bratislava',
        ...initialContext
      };

      const conversationData = {
        user_id: userId,
        title: this.generateConversationTitle(conversationType),
        conversation_type: conversationType,
        context: defaultContext,
        is_active: true,
        last_activity_at: new Date().toISOString(),
        total_tokens_used: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('sofia_conversations')
        .insert(conversationData)
        .select()
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        return { success: false, error: error.message };
      }

      // Add initial greeting message
      const greetingMessage = await this.generateGreetingMessage(
        data.id,
        profile?.full_name,
        conversationType,
        defaultContext.language
      );

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error starting conversation:', error);
      return { success: false, error: 'Failed to start conversation' };
    }
  }

  /**
   * Send message to Sofia with cost optimization
   */
  static async sendMessage(
    userId: string,
    request: SofiaMessageRequest
  ): Promise<APIResponse<SofiaMessage>> {
    try {
      // Check rate limits
      const rateLimitCheck = await this.checkRateLimit(userId);
      if (!rateLimitCheck.success) {
        return rateLimitCheck;
      }

      // Check AI usage limits
      const usageCheck = await this.checkAIUsageLimits(userId);
      if (!usageCheck.success || !usageCheck.data?.canProceed) {
        return {
          success: false,
          error: `Monthly AI limit reached. Upgrade to premium for unlimited access.`
        };
      }

      let conversationId = request.conversation_id;

      // If no conversation ID, start new conversation
      if (!conversationId) {
        const newConversation = await this.startConversation(userId, 'will_help', request.context);
        if (!newConversation.success || !newConversation.data) {
          return { success: false, error: newConversation.error || 'Failed to start conversation' };
        }
        conversationId = newConversation.data.id;
      }

      // Get conversation context
      const { data: conversation, error: convError } = await supabase
        .from('sofia_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (convError) {
        return { success: false, error: 'Conversation not found' };
      }

      // Save user message
      const userMessage = await this.saveMessage(conversationId, {
        role: 'user',
        content: request.message,
        attachments: (request.attachments || []).map(a => ({
          type: a.type as 'document' | 'image' | 'link',
          url: a.data,
          description: ''
        }))
      });

      if (!userMessage.success) return userMessage;

      // Generate Sofia's response with cost optimization
      const response = await this.generateSofiaResponse(
        conversation,
        request.message,
        request.context
      );

      if (!response.success || !response.data) {
        return { success: false, error: response.error || 'Failed to generate response' };
      }

      // Save Sofia's response
      const sofiaMessage = await this.saveMessage(conversationId, {
        role: 'assistant',
        content: response.data.content,
        tokens_used: response.data.tokens_used,
        response_time_ms: response.data.response_time_ms,
        confidence_score: response.data.confidence_score,
        actions: response.data.actions || []
      });

      if (!sofiaMessage.success) return sofiaMessage;

      // Update conversation activity and token usage
      await this.updateConversationActivity(
        conversationId,
        response.data.tokens_used || 0,
        request.context
      );

      // Update user's AI usage statistics
      await DashboardManager.updateUsageStats(userId, 'ai_messages_used', 1);

      return sofiaMessage;
    } catch (error) {
      console.error('Unexpected error sending message:', error);
      return { success: false, error: 'Failed to send message' };
    }
  }

  /**
   * Generate Sofia's response with intelligent cost optimization
   */
  private static async generateSofiaResponse(
    conversation: SofiaConversation,
    userMessage: string,
    additionalContext?: Partial<SofiaContext>
  ): Promise<APIResponse<{
    content: string;
    tokens_used: number;
    response_time_ms: number;
    confidence_score: number;
    actions?: any[];
  }>> {
    const startTime = Date.now();

    try {
      // Check cache first for common questions (zero API cost)
      const cacheKey = this.generateCacheKey(userMessage, conversation.context.language);
      const cachedResponse = this.responseCache.get(cacheKey);

      if (cachedResponse) {
        return {
          success: true,
          data: {
            content: cachedResponse.content,
            tokens_used: 0, // Cached response costs nothing
            response_time_ms: Date.now() - startTime,
            confidence_score: cachedResponse.confidence_score,
            actions: cachedResponse.actions
          }
        };
      }

      // Use rule-based responses for common queries (zero API cost)
      const ruleBasedResponse = await this.tryRuleBasedResponse(
        userMessage,
        conversation.context
      );

      if (ruleBasedResponse) {
        // Cache the response for future use
        this.responseCache.set(cacheKey, ruleBasedResponse);

        return {
          success: true,
          data: {
            content: ruleBasedResponse.content,
            tokens_used: 0,
            response_time_ms: Date.now() - startTime,
            confidence_score: ruleBasedResponse.confidence_score,
            actions: ruleBasedResponse.actions
          }
        };
      }

      // For premium users or complex queries, use AI API
      const isPremiumUser = conversation.context.user_tier === 'premium' ||
                           conversation.context.user_tier === 'enterprise';

      if (isPremiumUser || this.isComplexQuery(userMessage)) {
        return await this.generateAIResponse(conversation, userMessage, startTime);
      } else {
        // Free users get helpful but limited responses
        const limitedResponse = this.generateLimitedResponse(
          userMessage,
          conversation.context.language
        );

        return {
          success: true,
          data: {
            content: limitedResponse,
            tokens_used: 0,
            response_time_ms: Date.now() - startTime,
            confidence_score: 0.7,
            actions: [{
              type: 'upgrade_suggestion',
              message: 'Upgrade to premium for AI-powered responses'
            }]
          }
        };
      }
    } catch (error) {
      console.error('Error generating Sofia response:', error);
      return { success: false, error: 'Failed to generate response' };
    }
  }

  /**
   * Try to generate rule-based response for common questions
   */
  private static async tryRuleBasedResponse(
    message: string,
    context: SofiaContext
  ): Promise<{
    content: string;
    confidence_score: number;
    actions?: any[];
  } | null> {
    const lowerMessage = message.toLowerCase();
    const isKSlovak = context.language === 'sk';
    const isCzech = context.language === 'cs';

    // Common greetings
    if (this.matchesPatterns(lowerMessage, ['ahoj', 'hello', 'hi', 'dobrý deň', 'dobré ráno'])) {
      return {
        content: isKSlovak
          ? 'Ahoj! Som Sofia, vaša digitálna ochránkyňa. Pomôžem vám zabezpečiť budoucnosť vašej rodiny. Čím vám môžem pomôcť?'
          : isCzech
          ? 'Ahoj! Jsem Sofia, vaše digitální ochránkyně. Pomohu vám zabezpečit budoucnost vaší rodiny. Čím vám mohu pomoci?'
          : 'Hello! I\'m Sofia, your digital guardian. I help protect your family\'s future. How can I help you today?',
        confidence_score: 0.95,
        actions: [{
          type: 'conversation_starter',
          suggestions: isKSlovak
            ? ['Chcem vytvoriť závěť', 'Ako pridám opatrovníka?', 'Čo je časová schránka?']
            : isCzech
            ? ['Chci vytvořit závěť', 'Jak přidám opatrovníka?', 'Co je časová schránka?']
            : ['I want to create a will', 'How do I add a guardian?', 'What is a time capsule?']
        }]
      };
    }

    // Will creation questions
    if (this.matchesPatterns(lowerMessage, ['závěť', 'will', 'testament', 'vytvoriť závěť', 'create will'])) {
      return {
        content: isKSlovak
          ? 'Vytvorenie závetu je dôležitý krok pre ochranu vašej rodiny. Naša AI-poháňaná funkcia vás prevedie celým procesom pre slovenskú a českú jurisdikciu. Začneme zbieraním základných informácií o vás a vašom majetku.'
          : isCzech
          ? 'Vytvoření závěti je důležitý krok pro ochranu vaší rodiny. Naše AI funkce vás provede celým procesem pro slovenskou a českou jurisdikci. Začneme sběrem základních informací o vás a vašem majetku.'
          : 'Creating a will is an important step in protecting your family. Our AI-powered feature will guide you through the entire process for Slovak and Czech jurisdictions. We\'ll start by gathering basic information about you and your assets.',
        confidence_score: 0.9,
        actions: [{
          type: 'redirect',
          url: '/will-generator',
          label: isKSlovak ? 'Začať vytváranie závetu' : isCzech ? 'Začít tvorbu závěti' : 'Start Will Creation'
        }]
      };
    }

    // Guardian questions
    if (this.matchesPatterns(lowerMessage, ['opatrovník', 'guardian', 'strážca', 'pridať opatrovníka'])) {
      return {
        content: isKSlovak
          ? 'Opatrovníci sú dôležití ľudia, ktorí vám pomôžu chrániť vašu rodinu v núdzových situáciách. Môžete pridať manželov, deti, rodičov, priateľov alebo právnikov. Každý opatrovník má svoje úrovne prístupu a môže byť kontaktovaný v krízových situáciách.'
          : isCzech
          ? 'Opatrovníci jsou důležití lidé, kteří vám pomohou chránit vaši rodinu v nouzových situacích. Můžete přidat manžele, děti, rodiče, přátele nebo právníky. Každý opatrovník má své úrovně přístupu a může být kontaktován v krizových situacích.'
          : 'Guardians are important people who help protect your family in emergency situations. You can add spouses, children, parents, friends, or lawyers. Each guardian has access levels and can be contacted in crisis situations.',
        confidence_score: 0.9,
        actions: [{
          type: 'redirect',
          url: '/guardians',
          label: isKSlovak ? 'Spravovať opatrovníkov' : isCzech ? 'Spravovat opatrovníky' : 'Manage Guardians'
        }]
      };
    }

    // Security questions
    if (this.matchesPatterns(lowerMessage, ['bezpečnosť', 'security', 'zabezpečenie', 'ochrana'])) {
      return {
        content: isKSlovak
          ? 'Vaša bezpečnosť je naša priorita. Používame vojenské šifrovanie AES-256, dvojfaktorovú autentifikáciu a pokročilé systémy detekcie hrozieb. Všetky dokumenty sú chránené a zálohované v geograficky rozložených dátových centrách.'
          : isCzech
          ? 'Vaše bezpečnost je naší prioritou. Používáme vojenské šifrování AES-256, dvoufaktorovou autentifikaci a pokročilé systémy detekce hrozeb. Všechny dokumenty jsou chráněny a zálohovány v geograficky rozložených datových centrech.'
          : 'Your security is our priority. We use military-grade AES-256 encryption, two-factor authentication, and advanced threat detection systems. All documents are protected and backed up in geographically distributed data centers.',
        confidence_score: 0.85,
        actions: [{
          type: 'redirect',
          url: '/settings/security',
          label: isKSlovak ? 'Nastavenia bezpečnosti' : isCzech ? 'Nastavení bezpečnosti' : 'Security Settings'
        }]
      };
    }

    // Pricing questions
    if (this.matchesPatterns(lowerMessage, ['cena', 'price', 'koľko', 'how much', 'upgrade', 'premium'])) {
      return {
        content: isKSlovak
          ? 'Naše ceny sú dostupné pre každú rodinu: Free (zadarmo), Premium (4€/mesiac) a Enterprise (9€/mesiac). Premium zahŕňa neobmedzené dokumenty, AI asistentku Sofiu a generátor závetu. Vytvorenie závetu stojí 9€.'
          : isCzech
          ? 'Naše ceny jsou dostupné pro každou rodinu: Free (zdarma), Premium (4€/měsíc) a Enterprise (9€/měsíc). Premium zahrnuje neomezené dokumenty, AI asistentku Sofii a generátor závěti. Vytvoření závěti stojí 9€.'
          : 'Our pricing is accessible for every family: Free (no cost), Premium (€4/month) and Enterprise (€9/month). Premium includes unlimited documents, Sofia AI assistant, and will generator. Will creation costs €9.',
        confidence_score: 0.9,
        actions: [{
          type: 'redirect',
          url: '/settings/subscription',
          label: isKSlovak ? 'Pozrieť plány' : isCzech ? 'Zobrazit plány' : 'View Plans'
        }]
      };
    }

    return null; // No rule-based response found
  }

  /**
   * Generate AI response for premium users (with API cost)
   */
  private static async generateAIResponse(
    conversation: SofiaConversation,
    userMessage: string,
    startTime: number
  ): Promise<APIResponse<{
    content: string;
    tokens_used: number;
    response_time_ms: number;
    confidence_score: number;
    actions?: any[];
  }>> {
    try {
      // In production, this would call OpenAI API or similar
      // For now, simulate API response with realistic timing and token usage

      // Simulate API delay (200-800ms)
      const delay = 200 + Math.random() * 600;
      await new Promise(resolve => setTimeout(resolve, delay));

      // Simulate token usage (50-200 tokens for typical response)
      const estimatedTokens = 50 + Math.floor(Math.random() * 150);

      // Generate contextual response based on conversation type
      const response = this.generateContextualResponse(
        conversation,
        userMessage
      );

      return {
        success: true,
        data: {
          content: response.content,
          tokens_used: estimatedTokens,
          response_time_ms: Date.now() - startTime,
          confidence_score: 0.95,
          actions: response.actions
        }
      };
    } catch (error) {
      console.error('Error generating AI response:', error);
      return { success: false, error: 'Failed to generate AI response' };
    }
  }

  /**
   * Generate contextual response for premium AI features
   */
  private static generateContextualResponse(
    conversation: SofiaConversation,
    userMessage: string
  ): { content: string; actions?: any[] } {
    const isKSlovak = conversation.context.language === 'sk';
    const isCzech = conversation.context.language === 'cs';

    // This would be replaced with actual AI in production
    const responses = {
      onboarding: isKSlovak
        ? 'Rozumiem vašej situácii. Začnime krokom za krokom s ochranou vašej rodiny. Prvým krokom je vytvorenie vášho profilu a pridanie základných informácií.'
        : isCzech
        ? 'Rozumím vaší situaci. Začněme krok za krokem s ochranou vaší rodiny. Prvním krokem je vytvoření vašeho profilu a přidání základních informací.'
        : 'I understand your situation. Let\'s start step by step with protecting your family. The first step is creating your profile and adding basic information.',

      will_help: isKSlovak
        ? 'Pomôžem vám vytvoriť právne platnú závěť pre slovenskú jurisdikciu. Budeme potrebovať informácie o vašom majetku, beneficientoch a špeciálnych pokynoch.'
        : isCzech
        ? 'Pomohu vám vytvořit právně platnou závěť pro českou jurisdikci. Budeme potřebovat informace o vašem majetku, beneficientech a speciálních pokynech.'
        : 'I\'ll help you create a legally valid will for Slovak jurisdiction. We\'ll need information about your assets, beneficiaries, and special instructions.',

      default: isKSlovak
        ? 'Ako vaša digitálna ochránkyňa som tu, aby som vám pomohla s ochranou vašej rodiny. Môžem vám poradiť s vytvorením závetu, pridaním opatrovníkov alebo organizovaním dokumentov.'
        : isCzech
        ? 'Jako vaše digitální ochránkyně jsem zde, abych vám pomohla s ochranou vaší rodiny. Mohu vám poradit s vytvořením závěti, přidáním opatrovníků nebo organizováním dokumentů.'
        : 'As your digital guardian, I\'m here to help protect your family. I can assist with creating wills, adding guardians, or organizing documents.'
    };

    const responseKey = conversation.conversation_type === 'onboarding' ? 'onboarding' :
                       conversation.conversation_type === 'will_help' ? 'will_help' : 'default';

    return {
      content: responses[responseKey],
      actions: [{
        type: 'suggested_actions',
        suggestions: isKSlovak
          ? ['Vytvoriť závěť', 'Pridať opatrovníka', 'Nahrať dokumenty']
          : isCzech
          ? ['Vytvořit závěť', 'Přidat opatrovníka', 'Nahrát dokumenty']
          : ['Create will', 'Add guardian', 'Upload documents']
      }]
    };
  }

  /**
   * Generate limited response for free users
   */
  private static generateLimitedResponse(message: string, language: string): string {
    const isKSlovak = language === 'sk';
    const isCzech = language === 'cs';

    return isKSlovak
      ? 'Ďakujem za vašu otázku! Pre plnú AI-poháňanú podporu od Sofie, prosím zvážte upgrade na Premium plán (4€/mesiac). Medzitým vám môžem pomôcť s základnými funkciami cez našu navigáciu.'
      : isCzech
      ? 'Děkuji za vaši otázku! Pro plnou AI podporu od Sofie prosím zvažte upgrade na Premium plán (4€/měsíc). Mezitím vám mohu pomoci se základními funkcemi přes naši navigaci.'
      : 'Thank you for your question! For full AI-powered support from Sofia, please consider upgrading to Premium (€4/month). Meanwhile, I can help you with basic features through our navigation.';
  }

  /**
   * Helper methods
   */
  private static matchesPatterns(text: string, patterns: string[]): boolean {
    return patterns.some(pattern => text.includes(pattern.toLowerCase()));
  }

  private static isComplexQuery(message: string): boolean {
    // Detect complex queries that need AI processing
    const complexKeywords = [
      'ako', 'how', 'prečo', 'why', 'kedy', 'when', 'kde', 'where',
      'môžem', 'can i', 'should', 'mal by', 'comparison', 'rozdiel'
    ];

    return message.length > 100 ||
           complexKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }

  private static generateCacheKey(message: string, language: string): string {
    // Generate cache key for common responses
    const normalizedMessage = message.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .trim()
      .substring(0, 50);

    return `${language}:${normalizedMessage}`;
  }

  private static generateConversationTitle(type: SofiaConversation['conversation_type']): string {
    const titles = {
      onboarding: 'Onboarding s Sofiou',
      will_help: 'Pomoc s vytvorením závetu',
      legal_advice: 'Právne poradenstvo',
      family_guidance: 'Rodinné poradenstvo',
      emergency_help: 'Núdzová pomoc',
      general: 'Rozhovor s Sofiou'
    };

    return titles[type] || titles.general;
  }

  private static async generateGreetingMessage(
    conversationId: string,
    userName?: string,
    type?: string,
    language = 'sk'
  ): Promise<APIResponse<SofiaMessage>> {
    const isKSlovak = language === 'sk';
    const isCzech = language === 'cs';

    let greeting = isKSlovak
      ? `Ahoj${userName ? ` ${userName}` : ''}! Som Sofia, vaša digitálna ochránkyňa.`
      : isCzech
      ? `Ahoj${userName ? ` ${userName}` : ''}! Jsem Sofia, vaše digitální ochránkyně.`
      : `Hello${userName ? ` ${userName}` : ''}! I'm Sofia, your digital guardian.`;

    if (type === 'onboarding') {
      greeting += isKSlovak
        ? ' Pomôžem vám začať s ochranou vašej rodiny. Začnime!'
        : isCzech
        ? ' Pomohu vám začít s ochranou vaší rodiny. Začněme!'
        : ' I\'ll help you get started with protecting your family. Let\'s begin!';
    }

    return await this.saveMessage(conversationId, {
      role: 'assistant',
      content: greeting,
      tokens_used: 0,
      response_time_ms: 0,
      confidence_score: 1.0
    });
  }

  /**
   * Rate limiting and usage checks
   */
  private static async checkRateLimit(userId: string): Promise<APIResponse> {
    const now = Date.now();
    const limit = this.userLimits.get(userId);

    if (!limit || now > limit.resetTime) {
      // Reset or initialize limit (10 messages per minute for free users)
      this.userLimits.set(userId, {
        count: 1,
        resetTime: now + 60000 // 1 minute
      });
      return { success: true };
    }

    if (limit.count >= 10) {
      return {
        success: false,
        error: 'Rate limit exceeded. Please wait a moment before sending another message.'
      };
    }

    limit.count++;
    return { success: true };
  }

  private static async checkAIUsageLimits(userId: string) {
    return await DashboardManager.checkUsageLimits(userId, 'ai_messages_used');
  }

  /**
   * Database operations
   */
  private static async saveMessage(
    conversationId: string,
    messageData: Partial<SofiaMessage>
  ): Promise<APIResponse<SofiaMessage>> {
    try {
      const { data, error } = await supabase
        .from('sofia_messages')
        .insert({
          conversation_id: conversationId,
          ...messageData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving message:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error saving message:', error);
      return { success: false, error: 'Failed to save message' };
    }
  }

  private static async updateConversationActivity(
    conversationId: string,
    tokensUsed: number,
    context?: Partial<SofiaContext>
  ): Promise<void> {
    try {
      const updateData: any = {
        last_activity_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (tokensUsed > 0) {
        // Get current conversation to update token count
        const { data: current } = await supabase
          .from('sofia_conversations')
          .select('total_tokens_used')
          .eq('id', conversationId)
          .single();

        if (current) {
          updateData.total_tokens_used = (current.total_tokens_used || 0) + tokensUsed;
        }
      }

      if (context) {
        // Update context with new information
        const { data: conversation } = await supabase
          .from('sofia_conversations')
          .select('context')
          .eq('id', conversationId)
          .single();

        if (conversation) {
          updateData.context = { ...conversation.context, ...context };
        }
      }

      await supabase
        .from('sofia_conversations')
        .update(updateData)
        .eq('id', conversationId);
    } catch (error) {
      console.error('Error updating conversation activity:', error);
    }
  }

  /**
   * Get conversation history
   */
  static async getConversation(
    conversationId: string,
    userId: string
  ): Promise<APIResponse<{
    conversation: SofiaConversation;
    messages: SofiaMessage[];
  }>> {
    try {
      const [conversationResult, messagesResult] = await Promise.all([
        supabase
          .from('sofia_conversations')
          .select('*')
          .eq('id', conversationId)
          .eq('user_id', userId)
          .single(),

        supabase
          .from('sofia_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
      ]);

      if (conversationResult.error) {
        return { success: false, error: conversationResult.error.message };
      }

      if (messagesResult.error) {
        return { success: false, error: messagesResult.error.message };
      }

      return {
        success: true,
        data: {
          conversation: conversationResult.data,
          messages: messagesResult.data || []
        }
      };
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return { success: false, error: 'Failed to fetch conversation' };
    }
  }

  /**
   * Get user's conversation list
   */
  static async getUserConversations(userId: string): Promise<APIResponse<SofiaConversation[]>> {
    try {
      const { data, error } = await supabase
        .from('sofia_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('last_activity_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching conversations:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Unexpected error fetching conversations:', error);
      return { success: false, error: 'Failed to fetch conversations' };
    }
  }
}