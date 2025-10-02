// Multi-Language Support System for Phase 6C
// Advanced language detection and support responses

import { createClient } from '@/lib/supabase';
import { SupportAIManager, SupportAIResponse, SupportContext } from './support-ai-manager';

export type SupportedLanguage = 'sk' | 'cs' | 'en' | 'de' | 'pl' | 'uk' | 'ru';

export interface LanguageDetectionResult {
  detected_language: SupportedLanguage;
  confidence: number;
  alternative_languages: { language: SupportedLanguage; confidence: number }[];
}

export interface MultiLanguageResponse {
  content: string;
  language: SupportedLanguage;
  translation_source: 'native' | 'translated' | 'ai_generated';
  confidence: number;
  original_response?: SupportAIResponse;
}

export interface LanguagePreferences {
  primary_language: SupportedLanguage;
  fallback_languages: SupportedLanguage[];
  auto_translate: boolean;
  translation_quality: 'fast' | 'balanced' | 'accurate';
}

export class MultiLanguageSupportManager {
  private supabase;
  private supportAI: SupportAIManager;

  // Rule-based responses in multiple languages
  private static MULTILINGUAL_RESPONSES: Record<string, Record<SupportedLanguage, string>> = {
    'password_reset': {
      'sk': `Na obnovenie hesla:

1. Kliknite na "Zabudli ste heslo?" na prihlasovcej stránke
2. Zadajte svoj email
3. Skontrolujte emailovú schránku (aj spam)
4. Kliknite na odkaz v emaili
5. Zadajte nové heslo

⚠️ **Dôležité:** Pre prístup k šifrovaným dokumentom budete potrebovať Recovery Kit.`,

      'cs': `Pro obnovení hesla:

1. Klikněte na "Zapomněli jste heslo?" na přihlašovací stránce
2. Zadejte svůj email
3. Zkontrolujte emailovou schránku (i spam)
4. Klikněte na odkaz v emailu
5. Zadejte nové heslo

⚠️ **Důležité:** Pro přístup k šifrovaným dokumentům budete potřebovat Recovery Kit.`,

      'en': `To reset your password:

1. Click "Forgot password?" on the login page
2. Enter your email address
3. Check your email inbox (including spam)
4. Click the link in the email
5. Enter your new password

⚠️ **Important:** You'll need your Recovery Kit to access encrypted documents.`,

      'de': `Passwort zurücksetzen:

1. Klicken Sie auf "Passwort vergessen?" auf der Anmeldeseite
2. Geben Sie Ihre E-Mail-Adresse ein
3. Überprüfen Sie Ihren Posteingang (auch Spam)
4. Klicken Sie auf den Link in der E-Mail
5. Geben Sie Ihr neues Passwort ein

⚠️ **Wichtig:** Sie benötigen Ihr Recovery Kit für den Zugriff auf verschlüsselte Dokumente.`,

      'pl': `Aby zresetować hasło:

1. Kliknij "Zapomniałeś hasła?" na stronie logowania
2. Podaj swój adres email
3. Sprawdź skrzynkę pocztową (także spam)
4. Kliknij link w emailu
5. Wprowadź nowe hasło

⚠️ **Ważne:** Będziesz potrzebować Recovery Kit do dostępu do zaszyfrowanych dokumentów.`,

      'uk': `Щоб скинути пароль:

1. Натисніть "Забули пароль?" на сторінці входу
2. Введіть свою електронну адресу
3. Перевірте поштову скриньку (включно зі спамом)
4. Натисніть посилання в електронному листі
5. Введіть новий пароль

⚠️ **Важливо:** Вам знадобиться Recovery Kit для доступу до зашифрованих документів.`,

      'ru': `Для сброса пароля:

1. Нажмите "Забыли пароль?" на странице входа
2. Введите свой email адрес
3. Проверьте почтовый ящик (включая спам)
4. Нажмите ссылку в письме
5. Введите новый пароль

⚠️ **Важно:** Вам понадобится Recovery Kit для доступа к зашифрованным документам.`
    },

    'will_validity': {
      'sk': `🏛️ **Právna platnosť závetu:**

Aplikácia vygeneruje dokument obsahovo zodpovedajúci zákonným požiadavkám, ale aby sa stal **právne platným**:

**Slovensko:**
1. **Holografný závet:** Celý vlastnoručne prepísať a podpísať
2. **Alografný závet:** Podpísať pred 2 svedkami (nie beneficienti)
3. **Notársky závet:** Podpísať pred notárom

📋 **Po vygenerovaní** dostanete presné inštrukcie.`,

      'cs': `🏛️ **Právní platnost závěti:**

Aplikace vygeneruje dokument obsahově odpovídající zákonným požadavkům, ale aby se stal **právně platným**:

**Česko:**
1. **Holografní závěť:** Celý vlastnoručně přepsat a podepsat
2. **Alografní závěť:** Podepsat před 2 svědky (ne beneficienti)
3. **Notářská závěť:** Podepsat před notářem

📋 **Po vygenerování** dostanete přesné instrukce.`,

      'en': `🏛️ **Will Legal Validity:**

The app generates a document that meets legal content requirements, but to become **legally valid**:

**Slovakia/Czech Republic:**
1. **Holographic will:** Write and sign entirely by hand
2. **Alographic will:** Sign before 2 witnesses (not beneficiaries)
3. **Notarial will:** Sign before a notary

📋 **After generation** you'll receive precise instructions.`,

      'de': `🏛️ **Rechtsgültigkeit des Testaments:**

Die App generiert ein Dokument, das den gesetzlichen Anforderungen entspricht, aber um **rechtsgültig** zu werden:

**Slowakei/Tschechien:**
1. **Eigenhändiges Testament:** Vollständig handschriftlich verfassen und unterschreiben
2. **Allographisches Testament:** Vor 2 Zeugen unterzeichnen (nicht Begünstigte)
3. **Notarielles Testament:** Vor einem Notar unterzeichnen

📋 **Nach der Generierung** erhalten Sie genaue Anweisungen.`,

      'pl': `🏛️ **Ważność prawna testamentu:**

Aplikacja generuje dokument spełniający wymogi prawne co do treści, ale aby stał się **prawnie ważny**:

**Słowacja/Czechy:**
1. **Testament holograficzny:** Całkowicie własnoręcznie napisać i podpisać
2. **Testament alograficzny:** Podpisać przed 2 świadkami (nie beneficjentami)
3. **Testament notarialny:** Podpisać przed notariuszem

📋 **Po wygenerowaniu** otrzymasz dokładne instrukcje.`,

      'uk': `🏛️ **Правова дійсність заповіту:**

Додаток генерує документ, що відповідає законним вимогам щодо змісту, але щоб стати **юридично дійсним**:

**Словаччина/Чехія:**
1. **Голографічний заповіт:** Повністю власноруч написати і підписати
2. **Алографічний заповіт:** Підписати перед 2 свідками (не бенефіціарами)
3. **Нотаріальний заповіт:** Підписати перед нотаріусом

📋 **Після генерації** ви отримаєте точні інструкції.`,

      'ru': `🏛️ **Правовая действительность завещания:**

Приложение генерирует документ, соответствующий законным требованиям по содержанию, но чтобы стать **юридически действительным**:

**Словакия/Чехия:**
1. **Голографическое завещание:** Полностью собственноручно написать и подписать
2. **Аллографическое завещание:** Подписать перед 2 свидетелями (не бенефициары)
3. **Нотариальное завещание:** Подписать перед нотариусом

📋 **После генерации** вы получите точные инструкции.`
    },

    'document_security': {
      'sk': `🔒 **Bezpečnosť vašich dokumentov:**

**Matematicky zaručené súkromie:**
- ✅ End-to-end šifrovanie vo vašom prehliadači
- ✅ Zero-knowledge architektúra - my nemáme kľúče
- ✅ Nikto z LegacyGuard nemôže čítať vaše dokumenty
- ✅ Ani my, ani hackers, ani vládne inštitúcie

🛡️ **Vaše súkromie je naša priorita #1**`,

      'cs': `🔒 **Bezpečnost vašich dokumentů:**

**Matematicky zaručené soukromí:**
- ✅ End-to-end šifrování ve vašem prohlížeči
- ✅ Zero-knowledge architektura - my nemáme klíče
- ✅ Nikdo z LegacyGuard nemůže číst vaše dokumenty
- ✅ Ani my, ani hackeři, ani vládní instituce

🛡️ **Vaše soukromí je naše priorita #1**`,

      'en': `🔒 **Your Document Security:**

**Mathematically guaranteed privacy:**
- ✅ End-to-end encryption in your browser
- ✅ Zero-knowledge architecture - we don't have keys
- ✅ No one at LegacyGuard can read your documents
- ✅ Not us, not hackers, not government institutions

🛡️ **Your privacy is our #1 priority**`,

      'de': `🔒 **Sicherheit Ihrer Dokumente:**

**Mathematisch garantierte Privatsphäre:**
- ✅ End-to-End-Verschlüsselung in Ihrem Browser
- ✅ Zero-Knowledge-Architektur - wir haben keine Schlüssel
- ✅ Niemand bei LegacyGuard kann Ihre Dokumente lesen
- ✅ Weder wir, noch Hacker, noch Regierungsinstitutionen

🛡️ **Ihre Privatsphäre ist unsere Priorität #1**`,

      'pl': `🔒 **Bezpieczeństwo Twoich dokumentów:**

**Matematycznie gwarantowana prywatność:**
- ✅ Szyfrowanie end-to-end w Twojej przeglądarce
- ✅ Architektura zero-knowledge - nie mamy kluczy
- ✅ Nikt w LegacyGuard nie może czytać Twoich dokumentów
- ✅ Ani my, ani hakerzy, ani instytucje rządowe

🛡️ **Twoja prywatność to nasz priorytet #1**`,

      'uk': `🔒 **Безпека ваших документів:**

**Математично гарантована приватність:**
- ✅ Наскрізне шифрування у вашому браузері
- ✅ Zero-knowledge архітектура - у нас немає ключів
- ✅ Ніхто в LegacyGuard не може читати ваші документи
- ✅ Ні ми, ні хакери, ні державні установи

🛡️ **Ваша приватність - наш пріоритет #1**`,

      'ru': `🔒 **Безопасность ваших документов:**

**Математически гарантированная приватность:**
- ✅ End-to-end шифрование в вашем браузере
- ✅ Zero-knowledge архитектура - у нас нет ключей
- ✅ Никто в LegacyGuard не может читать ваши документы
- ✅ Ни мы, ни хакеры, ни государственные учреждения

🛡️ **Ваша приватность - наш приоритет #1**`
    }
  };

  // Language detection patterns
  private static LANGUAGE_PATTERNS: Record<SupportedLanguage, string[]> = {
    'sk': ['heslo', 'závet', 'doklad', 'právny', 'naliehavé', 'problém', 'zabudol'],
    'cs': ['heslo', 'závěť', 'doklad', 'právní', 'naléhavé', 'problém', 'zapomněl'],
    'en': ['password', 'will', 'document', 'legal', 'urgent', 'problem', 'forgot'],
    'de': ['passwort', 'testament', 'dokument', 'rechtlich', 'dringend', 'problem', 'vergessen'],
    'pl': ['hasło', 'testament', 'dokument', 'prawny', 'pilne', 'problem', 'zapomniał'],
    'uk': ['пароль', 'заповіт', 'документ', 'правовий', 'терміново', 'проблема', 'забув'],
    'ru': ['пароль', 'завещание', 'документ', 'правовой', 'срочно', 'проблема', 'забыл']
  };

  constructor() {
    this.supabase = createClient();
    this.supportAI = new SupportAIManager();
  }

  /**
   * Detect language from user input
   */
  detectLanguage(text: string): LanguageDetectionResult {
    const textLower = text.toLowerCase();
    const scores: Record<SupportedLanguage, number> = {
      'sk': 0, 'cs': 0, 'en': 0, 'de': 0, 'pl': 0, 'uk': 0, 'ru': 0
    };

    // Score each language based on pattern matches
    Object.entries(MultiLanguageSupportManager.LANGUAGE_PATTERNS).forEach(([lang, patterns]) => {
      patterns.forEach(pattern => {
        if (textLower.includes(pattern)) {
          scores[lang as SupportedLanguage] += 1;
        }
      });
    });

    // Normalize scores
    const totalMatches = Object.values(scores).reduce((sum, score) => sum + score, 0);
    if (totalMatches === 0) {
      // Default to Slovak if no patterns match
      return {
        detected_language: 'sk',
        confidence: 0.5,
        alternative_languages: [
          { language: 'en', confidence: 0.3 },
          { language: 'cs', confidence: 0.2 }
        ]
      };
    }

    // Find best match
    const sortedLanguages = Object.entries(scores)
      .map(([lang, score]) => ({
        language: lang as SupportedLanguage,
        confidence: score / totalMatches
      }))
      .sort((a, b) => b.confidence - a.confidence);

    return {
      detected_language: sortedLanguages[0].language,
      confidence: sortedLanguages[0].confidence,
      alternative_languages: sortedLanguages.slice(1, 3)
    };
  }

  /**
   * Generate multilingual support response
   */
  async generateMultilingualResponse(
    query: string,
    context: SupportContext,
    userId: string,
    targetLanguage?: SupportedLanguage
  ): Promise<MultiLanguageResponse> {

    // 1. Detect language if not specified
    const languageDetection = this.detectLanguage(query);
    const language = targetLanguage || languageDetection.detected_language;

    // 2. Try rule-based responses first
    const ruleBasedResponse = this.getMultilingualRuleResponse(query, language);
    if (ruleBasedResponse) {
      return {
        content: ruleBasedResponse,
        language,
        translation_source: 'native',
        confidence: 0.95
      };
    }

    // 3. Get response in primary language (Slovak) and translate if needed
    const primaryResponse = await this.supportAI.generateSupportResponse(query, context, userId);

    if (language === 'sk') {
      return {
        content: primaryResponse.content,
        language: 'sk',
        translation_source: 'native',
        confidence: primaryResponse.confidence,
        original_response: primaryResponse
      };
    }

    // 4. Translate response to target language
    const translatedContent = await this.translateResponse(primaryResponse.content, language);

    return {
      content: translatedContent,
      language,
      translation_source: 'translated',
      confidence: primaryResponse.confidence * 0.9, // Slightly reduce confidence for translations
      original_response: primaryResponse
    };
  }

  /**
   * Get rule-based response in specific language
   */
  private getMultilingualRuleResponse(query: string, language: SupportedLanguage): string | null {
    const queryLower = query.toLowerCase();

    // Check for password reset patterns
    if (queryLower.includes('heslo') || queryLower.includes('password') ||
        queryLower.includes('passwort') || queryLower.includes('hasło') ||
        queryLower.includes('пароль')) {
      return MultiLanguageSupportManager.MULTILINGUAL_RESPONSES.password_reset[language];
    }

    // Check for will validity patterns
    if ((queryLower.includes('závet') || queryLower.includes('závěť') ||
         queryLower.includes('will') || queryLower.includes('testament') ||
         queryLower.includes('заповіт') || queryLower.includes('завещание')) &&
        (queryLower.includes('platný') || queryLower.includes('platný') ||
         queryLower.includes('valid') || queryLower.includes('gültig') ||
         queryLower.includes('ważny') || queryLower.includes('дійсний') ||
         queryLower.includes('действительный'))) {
      return MultiLanguageSupportManager.MULTILINGUAL_RESPONSES.will_validity[language];
    }

    // Check for security patterns
    if (queryLower.includes('bezpečnosť') || queryLower.includes('bezpečnost') ||
        queryLower.includes('security') || queryLower.includes('sicherheit') ||
        queryLower.includes('bezpieczeństwo') || queryLower.includes('безпека') ||
        queryLower.includes('безопасность')) {
      return MultiLanguageSupportManager.MULTILINGUAL_RESPONSES.document_security[language];
    }

    return null;
  }

  /**
   * Translate response to target language
   */
  private async translateResponse(content: string, targetLanguage: SupportedLanguage): Promise<string> {
    // For now, return a placeholder translation
    // In production, this would integrate with translation API

    const translations: Record<SupportedLanguage, string> = {
      'sk': content, // Original
      'cs': this.basicSlovakToCzechTranslation(content),
      'en': this.basicSlovakToEnglishTranslation(content),
      'de': `[DE] ${content}`, // Placeholder
      'pl': `[PL] ${content}`, // Placeholder
      'uk': `[UK] ${content}`, // Placeholder
      'ru': `[RU] ${content}`  // Placeholder
    };

    return translations[targetLanguage] || content;
  }

  /**
   * Basic Slovak to Czech translation (similar languages)
   */
  private basicSlovakToCzechTranslation(text: string): string {
    const replacements: Record<string, string> = {
      'ý': 'ý',
      'závet': 'závěť',
      'úč': 'úč',
      'aplikácia': 'aplikace',
      'stránka': 'stránka',
      'heslo': 'heslo',
      'dokumenty': 'dokumenty',
      'právny': 'právní',
      'kontaktujte': 'kontaktujte',
      'podporu': 'podporu'
    };

    let translated = text;
    Object.entries(replacements).forEach(([sk, cs]) => {
      translated = translated.replace(new RegExp(sk, 'gi'), cs);
    });

    return translated;
  }

  /**
   * Basic Slovak to English translation
   */
  private basicSlovakToEnglishTranslation(text: string): string {
    const replacements: Record<string, string> = {
      'Na obnovenie hesla:': 'To reset your password:',
      'Kliknite na': 'Click on',
      'Zadajte svoj email': 'Enter your email',
      'Skontrolujte emailovú schránku': 'Check your email inbox',
      'Zadajte nové heslo': 'Enter your new password',
      'Dôležité:': 'Important:',
      'Pre prístup k šifrovaným dokumentom': 'To access encrypted documents',
      'budete potrebovať': 'you will need',
      'Recovery Kit': 'Recovery Kit',
      'Bezpečnosť vašich dokumentov:': 'Your document security:',
      'Matematicky zaručené súkromie:': 'Mathematically guaranteed privacy:',
      'Vaše súkromie je naša priorita': 'Your privacy is our priority'
    };

    let translated = text;
    Object.entries(replacements).forEach(([sk, en]) => {
      translated = translated.replace(new RegExp(sk, 'gi'), en);
    });

    return translated;
  }

  /**
   * Get user language preferences
   */
  async getUserLanguagePreferences(userId: string): Promise<LanguagePreferences> {
    try {
      const { data } = await this.supabase
        .from('user_profiles')
        .select('language_preferences')
        .eq('id', userId)
        .single();

      if (data?.language_preferences) {
        return data.language_preferences;
      }
    } catch (error) {
      console.error('Failed to get language preferences:', error);
    }

    // Default preferences
    return {
      primary_language: 'sk',
      fallback_languages: ['en', 'cs'],
      auto_translate: true,
      translation_quality: 'balanced'
    };
  }

  /**
   * Update user language preferences
   */
  async updateLanguagePreferences(userId: string, preferences: LanguagePreferences): Promise<void> {
    try {
      await this.supabase
        .from('user_profiles')
        .update({
          language_preferences: preferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
    } catch (error) {
      console.error('Failed to update language preferences:', error);
      throw error;
    }
  }

  /**
   * Get supported languages list
   */
  getSupportedLanguages(): { code: SupportedLanguage; name: string; native_name: string }[] {
    return [
      { code: 'sk', name: 'Slovak', native_name: 'Slovenčina' },
      { code: 'cs', name: 'Czech', native_name: 'Čeština' },
      { code: 'en', name: 'English', native_name: 'English' },
      { code: 'de', name: 'German', native_name: 'Deutsch' },
      { code: 'pl', name: 'Polish', native_name: 'Polski' },
      { code: 'uk', name: 'Ukrainian', native_name: 'Українська' },
      { code: 'ru', name: 'Russian', native_name: 'Русский' }
    ];
  }

  /**
   * Log language detection for analytics
   */
  private async logLanguageDetection(
    userId: string,
    query: string,
    detection: LanguageDetectionResult,
    response: MultiLanguageResponse
  ): Promise<void> {
    try {
      await this.supabase
        .from('support_interactions')
        .insert({
          ticket_id: null,
          message_type: 'system',
          content: JSON.stringify({
            type: 'language_detection',
            query_excerpt: query.substring(0, 100),
            detected_language: detection.detected_language,
            confidence: detection.confidence,
            response_language: response.language,
            translation_source: response.translation_source
          }),
          confidence_score: detection.confidence,
          knowledge_source: 'rule_based'
        });
    } catch (error) {
      console.error('Failed to log language detection:', error);
    }
  }
}

// Export utility functions
export function createMultiLanguageSupportManager(): MultiLanguageSupportManager {
  return new MultiLanguageSupportManager();
}

export async function getMultilingualSupportResponse(
  query: string,
  context: SupportContext,
  userId: string,
  targetLanguage?: SupportedLanguage
): Promise<MultiLanguageResponse> {
  const manager = new MultiLanguageSupportManager();
  return manager.generateMultilingualResponse(query, context, userId, targetLanguage);
}