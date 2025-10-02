'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, X, Bot, User, Loader2, ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { createSupportAIManager, type SupportAIResponse, type SupportContext } from '@/lib/support/support-ai-manager';
import { useUser } from '@/hooks/useUser';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  response_type?: 'rule_based' | 'knowledge_base' | 'ai_generated';
  confidence?: number;
  follow_up_questions?: string[];
  suggested_articles?: Array<{
    id: string;
    title: string;
    url: string;
    relevance_score: number;
  }>;
  helpful_rating?: boolean;
}

export interface SofiaChatWidgetProps {
  /** Position of the chat widget */
  position?: 'bottom-right' | 'bottom-left' | 'sidebar';
  /** Auto-trigger conditions */
  triggerConditions?: {
    timeOnPage?: number;
    errorDetected?: boolean;
    pageContext?: string;
  };
  /** Theme customization */
  theme?: 'light' | 'dark' | 'auto';
  /** Initial collapsed state */
  initiallyCollapsed?: boolean;
}

export default function SofiaChatWidget({
  position = 'bottom-right',
  triggerConditions,
  theme = 'auto',
  initiallyCollapsed = true
}: SofiaChatWidgetProps) {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(!initiallyCollapsed);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const supportAI = createSupportAIManager();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-trigger based on conditions
  useEffect(() => {
    if (triggerConditions && !isOpen) {
      const shouldTrigger =
        (triggerConditions.timeOnPage && performance.now() > triggerConditions.timeOnPage) ||
        triggerConditions.errorDetected ||
        false;

      if (shouldTrigger) {
        setIsOpen(true);
        // Add welcome message based on trigger condition
        addSystemMessage(getTriggeredWelcomeMessage(triggerConditions));
      }
    }
  }, [triggerConditions, isOpen]);

  // Initialize conversation with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addSystemMessage(getWelcomeMessage());
    }
  }, [isOpen]);

  // Focus input when widget opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const addSystemMessage = (content: string) => {
    const message: ChatMessage = {
      id: `system_${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: new Date(),
      response_type: 'rule_based',
      confidence: 1.0
    };
    setMessages(prev => [...prev, message]);
  };

  const getUserContext = (): SupportContext => ({
    user_tier: 'free' as const,
    current_page: window.location.pathname,
    jurisdiction: 'SK' as const,
    language: 'sk' as const,
    onboarding_step: undefined,
    documents_count: 0, // Would be fetched from actual data
    browser_info: {
      user_agent: navigator.userAgent,
      browser_name: getBrowserName(),
      browser_version: getBrowserVersion(),
      os_name: getOSName(),
      screen_resolution: `${screen.width}x${screen.height}`,
      language: navigator.language
    }
  });

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const context = getUserContext();
      const response = await supportAI.generateSupportResponse(
        userMessage.content,
        context,
        user?.id || 'anonymous',
        conversationId
      );

      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        response_type: response.response_type,
        confidence: response.confidence,
        follow_up_questions: response.follow_up_questions,
        suggested_articles: response.suggested_articles
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Handle escalation if recommended
      if (response.escalation_recommended && response.requires_human) {
        setTimeout(() => {
          addSystemMessage(
            "🎫 Vytváram support ticket pre vás. Náš tím sa s vami spojí v najbližšom čase na váš email."
          );
        }, 1000);
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: "Ospravedlňujem sa, nastala chyba. Skúste to prosím znovu alebo kontaktujte support na podpora@legacyguard.sk",
        timestamp: new Date(),
        response_type: 'rule_based',
        confidence: 0
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFollowUpClick = (question: string) => {
    setInput(question);
    setTimeout(handleSendMessage, 100);
  };

  const handleHelpfulVote = (messageId: string, helpful: boolean) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? { ...msg, helpful_rating: helpful }
          : msg
      )
    );
    // Track feedback for analytics
    // supportAI.trackMessageFeedback(messageId, helpful);
  };

  const getWelcomeMessage = (): string => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Dobré ráno' : hour < 18 ? 'Dobrý deň' : 'Dobrý večer';

    const tierMessage = '';

    return `${greeting}! 👋 Som Sofia, váš AI asistent pre LegacyGuard.${tierMessage}

Môžem vám pomôcť s:
• 🔒 Otázkami o bezpečnosti a šifrovaní
• ⚖️ Právnymi pokynmi pre závety (SK/CZ)
• 🔧 Technickými problémmi
• 💳 Informáciami o predplatnom
• 📚 Používaním funkcií aplikácie

Čím vám môžem pomôcť?`;
  };

  const getTriggeredWelcomeMessage = (trigger: any): string => {
    if (trigger.errorDetected) {
      return `🔧 Všimla som si, že sa môže vyskytnúť problém. Môžem vám pomôcť vyriešiť ho?

Skúste najprv:
1. Hard refresh: Ctrl+Shift+R (Windows) alebo Cmd+Shift+R (Mac)
2. Vymazať cache prehliadača

Ak problém pretrváva, opíšte mi čo sa deje.`;
    }

    if (trigger.timeOnPage) {
      return `👋 Vidím, že tu trávite čas. Potrebujete pomoc s niečím? Som tu pre vás 24/7!`;
    }

    return getWelcomeMessage();
  };

  const positionClasses = {
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'bottom-left': 'fixed bottom-4 left-4 z-50',
    'sidebar': 'relative h-full'
  };

  if (!isOpen && position !== 'sidebar') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setIsOpen(true)}
              className={cn(positionClasses[position], 'h-14 w-14 rounded-full shadow-lg')}
              size="icon"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Spýtajte sa Sofia AI</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Card className={cn(
      positionClasses[position],
      position === 'sidebar' ? 'h-full' : 'w-96 h-[600px]',
      'flex flex-col shadow-xl'
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-full">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </div>
          Sofia AI Support
        </CardTitle>
        {position !== 'sidebar' && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 gap-4">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="flex items-start justify-center w-8 h-8 bg-primary rounded-full flex-shrink-0 mt-1">
                  <Bot className="h-4 w-4 text-primary-foreground mt-1" />
                </div>
              )}

              <div className={cn(
                'max-w-[80%] rounded-lg p-3 text-sm',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground ml-8'
                  : 'bg-muted'
              )}>
                <div className="whitespace-pre-wrap">{message.content}</div>

                {/* Response metadata */}
                {message.role === 'assistant' && message.response_type && (
                  <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                    <Badge variant="outline" className="text-xs">
                      {message.response_type === 'rule_based' && '⚡ Instant'}
                      {message.response_type === 'knowledge_base' && '📚 KB'}
                      {message.response_type === 'ai_generated' && '🤖 AI'}
                    </Badge>
                    {message.confidence && (
                      <span>{Math.round(message.confidence * 100)}% confident</span>
                    )}
                  </div>
                )}

                {/* Follow-up questions */}
                {message.follow_up_questions && message.follow_up_questions.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <div className="text-xs font-medium opacity-70">Súvisiace otázky:</div>
                    {message.follow_up_questions.map((question, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs h-auto p-2 whitespace-normal"
                        onClick={() => handleFollowUpClick(question)}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Suggested articles */}
                {message.suggested_articles && message.suggested_articles.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <div className="text-xs font-medium opacity-70">Užitočné články:</div>
                    {message.suggested_articles.map((article) => (
                      <Button
                        key={article.id}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between text-xs h-auto p-2"
                        asChild
                      >
                        <a href={article.url} target="_blank" rel="noopener noreferrer">
                          <span className="truncate">{article.title}</span>
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                      </Button>
                    ))}
                  </div>
                )}

                {/* Feedback buttons */}
                {message.role === 'assistant' && message.helpful_rating === undefined && (
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs opacity-70">Pomohlo to?</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleHelpfulVote(message.id, true)}
                    >
                      <ThumbsUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleHelpfulVote(message.id, false)}
                    >
                      <ThumbsDown className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                {/* Feedback confirmation */}
                {message.helpful_rating !== undefined && (
                  <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                    {message.helpful_rating ? (
                      <>
                        <ThumbsUp className="h-3 w-3" />
                        <span>Ďakujeme za feedback!</span>
                      </>
                    ) : (
                      <>
                        <ThumbsDown className="h-3 w-3" />
                        <span>Prepáčte, skúsime to lepšie</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {message.role === 'user' && (
                <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full flex-shrink-0 mt-1">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-full flex-shrink-0">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Sofia premýšľa...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Spýtajte sa Sofia AI..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-1">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => handleFollowUpClick("Ako resetovať heslo?")}
          >
            Reset hesla
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => handleFollowUpClick("Je môj závet právne platný?")}
          >
            Platnosť závetu
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => handleFollowUpClick("Aplikácia nefunguje")}
          >
            Tech problémy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper functions
function getBrowserName(): string {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Unknown';
}

function getBrowserVersion(): string {
  const userAgent = navigator.userAgent;
  const match = userAgent.match(/(?:Chrome|Firefox|Safari|Edge)\/(\d+)/);
  return match ? match[1] : 'Unknown';
}

function getOSName(): string {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'Unknown';
}