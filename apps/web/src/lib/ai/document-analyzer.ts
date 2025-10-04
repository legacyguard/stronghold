import { createClient } from '@/lib/supabase';

export interface DocumentAnalysis {
  id: string;
  document_id: string;
  user_id: string;
  analysis_type: 'content_extraction' | 'legal_review' | 'risk_assessment' | 'compliance_check' | 'entity_recognition';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: Date;
  completed_at?: Date;
  results: {
    entities: DocumentEntity[];
    key_terms: KeyTerm[];
    risk_factors: RiskFactor[];
    compliance_issues: ComplianceIssue[];
    recommendations: Recommendation[];
    confidence_score: number;
    summary: string;
  };
  metadata: {
    processing_time_ms: number;
    model_version: string;
    language_detected: string;
    page_count: number;
    word_count: number;
  };
}

export interface DocumentEntity {
  type: 'person' | 'organization' | 'location' | 'date' | 'amount' | 'legal_entity' | 'contract_term';
  text: string;
  confidence: number;
  position: {
    page: number;
    start: number;
    end: number;
  };
  normalized_value?: string;
  related_entities: string[];
}

export interface KeyTerm {
  term: string;
  frequency: number;
  importance: number;
  category: 'legal' | 'financial' | 'personal' | 'administrative';
  context: string[];
  definitions?: string;
}

export interface RiskFactor {
  type: 'legal' | 'financial' | 'compliance' | 'operational';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affected_clauses: string[];
  mitigation_suggestions: string[];
  confidence: number;
}

export interface ComplianceIssue {
  regulation: string;
  jurisdiction: string;
  issue_type: 'missing_clause' | 'conflicting_terms' | 'outdated_provision' | 'unclear_language';
  description: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  remediation_steps: string[];
  relevant_sections: string[];
}

export interface Recommendation {
  type: 'improvement' | 'correction' | 'addition' | 'removal';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  rationale: string;
  implementation_effort: 'minimal' | 'moderate' | 'significant';
  legal_basis?: string;
  suggested_text?: string;
}

export interface DocumentProcessingJob {
  id: string;
  document_id: string;
  user_id: string;
  job_type: 'analysis' | 'translation' | 'summarization' | 'comparison' | 'validation';
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  created_at: Date;
  started_at?: Date;
  completed_at?: Date;
  configuration: Record<string, any>;
  results?: Record<string, any>;
  error_message?: string;
  estimated_completion?: Date;
}

class AIDocumentAnalyzer {
  private static instance: AIDocumentAnalyzer;
  private supabase = createClient();
  private isInitialized = false;
  private processingQueue: Map<string, DocumentProcessingJob> = new Map();
  private modelCache: Map<string, any> = new Map();

  static getInstance(): AIDocumentAnalyzer {
    if (!AIDocumentAnalyzer.instance) {
      AIDocumentAnalyzer.instance = new AIDocumentAnalyzer();
    }
    return AIDocumentAnalyzer.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await this.loadModelConfigurations();
    await this.startProcessingWorker();
    this.isInitialized = true;
  }

  async analyzeDocument(
    documentId: string,
    userId: string,
    analysisType: string,
    options: {
      priority?: 'low' | 'normal' | 'high';
      jurisdiction?: string;
      language?: string;
      extractImages?: boolean;
      deepAnalysis?: boolean;
    } = {}
  ): Promise<string> {
    const jobId = crypto.randomUUID();

    const job: Partial<DocumentProcessingJob> = {
      id: jobId,
      document_id: documentId,
      user_id: userId,
      job_type: 'analysis',
      status: 'queued',
      progress: 0,
      created_at: new Date(),
      configuration: {
        analysis_type: analysisType,
        ...options
      }
    };

    const { data, error } = await this.supabase
      .from('document_processing_jobs')
      .insert(job)
      .select()
      .single();

    if (error) throw error;

    // Add to processing queue
    this.processingQueue.set(jobId, data);

    // Estimate completion time based on queue and document complexity
    const estimatedMinutes = this.estimateProcessingTime(documentId, analysisType);
    await this.supabase
      .from('document_processing_jobs')
      .update({
        estimated_completion: new Date(Date.now() + estimatedMinutes * 60000)
      })
      .eq('id', jobId);

    return jobId;
  }

  async getAnalysisResults(analysisId: string): Promise<DocumentAnalysis | null> {
    const { data, error } = await this.supabase
      .from('document_analyses')
      .select('*')
      .eq('id', analysisId)
      .single();

    if (error) return null;
    return data;
  }

  async getJobStatus(jobId: string): Promise<DocumentProcessingJob | null> {
    const { data, error } = await this.supabase
      .from('document_processing_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) return null;
    return data;
  }

  async extractDocumentEntities(
    documentContent: string,
    documentType: 'will' | 'trust' | 'contract' | 'legal_document' | 'financial_document'
  ): Promise<DocumentEntity[]> {
    const entities: DocumentEntity[] = [];

    // Person names extraction
    const personRegex = /\b[A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/g;
    let match;
    while ((match = personRegex.exec(documentContent)) !== null) {
      entities.push({
        type: 'person',
        text: match[0],
        confidence: 0.85,
        position: {
          page: 1,
          start: match.index,
          end: match.index + match[0].length
        },
        normalized_value: this.normalizeName(match[0]),
        related_entities: []
      });
    }

    // Date extraction
    const dateRegex = /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{2,4})\b/gi;
    while ((match = dateRegex.exec(documentContent)) !== null) {
      entities.push({
        type: 'date',
        text: match[0],
        confidence: 0.9,
        position: {
          page: 1,
          start: match.index,
          end: match.index + match[0].length
        },
        normalized_value: this.normalizeDate(match[0]),
        related_entities: []
      });
    }

    // Amount extraction
    const amountRegex = /\$[\d,]+(?:\.\d{2})?|\b\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars?|USD|EUR|GBP)\b/gi;
    while ((match = amountRegex.exec(documentContent)) !== null) {
      entities.push({
        type: 'amount',
        text: match[0],
        confidence: 0.95,
        position: {
          page: 1,
          start: match.index,
          end: match.index + match[0].length
        },
        normalized_value: this.normalizeAmount(match[0]),
        related_entities: []
      });
    }

    // Legal entity extraction (specific to document type)
    if (documentType === 'will') {
      entities.push(...this.extractWillSpecificEntities(documentContent));
    } else if (documentType === 'trust') {
      entities.push(...this.extractTrustSpecificEntities(documentContent));
    }

    return entities;
  }

  async identifyKeyTerms(
    documentContent: string,
    documentType: string
  ): Promise<KeyTerm[]> {
    const terms: KeyTerm[] = [];

    // Legal terms dictionary
    const legalTerms = [
      'executor', 'beneficiary', 'trustee', 'grantor', 'settlor', 'guardian',
      'power of attorney', 'living will', 'advance directive', 'last will and testament',
      'revocable trust', 'irrevocable trust', 'probate', 'estate', 'inheritance',
      'asset', 'liability', 'bequest', 'legacy', 'residuary', 'intestate'
    ];

    const financialTerms = [
      'assets', 'liabilities', 'equity', 'investment', 'portfolio', 'dividend',
      'interest', 'capital gains', 'tax', 'deduction', 'exemption', 'valuation'
    ];

    // Count term frequencies
    const allTerms = [...legalTerms, ...financialTerms];
    const contentLower = documentContent.toLowerCase();

    for (const term of allTerms) {
      const regex = new RegExp(`\\b${term.toLowerCase()}\\b`, 'gi');
      const matches = contentLower.match(regex);

      if (matches && matches.length > 0) {
        const contexts = this.extractContexts(documentContent, term, 3);

        terms.push({
          term,
          frequency: matches.length,
          importance: this.calculateTermImportance(term, matches.length, documentType),
          category: legalTerms.includes(term) ? 'legal' : 'financial',
          context: contexts,
          definitions: this.getTermDefinition(term)
        });
      }
    }

    return terms.sort((a, b) => b.importance - a.importance);
  }

  async assessDocumentRisks(
    documentContent: string,
    entities: DocumentEntity[],
    documentType: string
  ): Promise<RiskFactor[]> {
    const risks: RiskFactor[] = [];

    // Check for missing essential clauses
    if (documentType === 'will') {
      if (!this.containsClause(documentContent, ['executor', 'personal representative'])) {
        risks.push({
          type: 'legal',
          severity: 'high',
          description: 'No executor or personal representative designated',
          affected_clauses: ['Executor Designation'],
          mitigation_suggestions: [
            'Add an executor designation clause',
            'Consider naming a successor executor',
            'Ensure the designated executor is willing and able to serve'
          ],
          confidence: 0.9
        });
      }

      if (!this.containsClause(documentContent, ['residuary', 'remainder', 'rest of estate'])) {
        risks.push({
          type: 'legal',
          severity: 'medium',
          description: 'No residuary clause found - may lead to intestacy for unspecified assets',
          affected_clauses: ['Asset Distribution'],
          mitigation_suggestions: [
            'Add a residuary clause to cover all remaining assets',
            'Specify how unspecified assets should be distributed'
          ],
          confidence: 0.85
        });
      }
    }

    // Check for ambiguous language
    const ambiguousPatterns = [
      'if possible', 'when appropriate', 'as needed', 'reasonable', 'fair share',
      'substantial portion', 'most of', 'some of', 'part of'
    ];

    for (const pattern of ambiguousPatterns) {
      if (documentContent.toLowerCase().includes(pattern)) {
        risks.push({
          type: 'legal',
          severity: 'medium',
          description: `Ambiguous language detected: "${pattern}"`,
          affected_clauses: ['Language Clarity'],
          mitigation_suggestions: [
            'Replace ambiguous terms with specific percentages or amounts',
            'Define unclear terms in a definitions section',
            'Use precise legal language'
          ],
          confidence: 0.7
        });
      }
    }

    // Check for outdated references
    const currentYear = new Date().getFullYear();
    const dateEntities = entities.filter(e => e.type === 'date');

    for (const dateEntity of dateEntities) {
      const year = this.extractYear(dateEntity.text);
      if (year && currentYear - year > 5) {
        risks.push({
          type: 'compliance',
          severity: 'low',
          description: `Document contains potentially outdated date reference: ${dateEntity.text}`,
          affected_clauses: ['Date References'],
          mitigation_suggestions: [
            'Review and update outdated date references',
            'Ensure all legal requirements are current'
          ],
          confidence: 0.6
        });
      }
    }

    return risks.sort((a, b) => this.severityToNumber(b.severity) - this.severityToNumber(a.severity));
  }

  async generateRecommendations(
    analysis: Partial<DocumentAnalysis>,
    documentType: string,
    jurisdiction: string = 'US'
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Based on risk factors
    if (analysis.results?.risk_factors) {
      for (const risk of analysis.results.risk_factors) {
        if (risk.severity === 'high' || risk.severity === 'critical') {
          recommendations.push({
            type: 'correction',
            priority: 'urgent',
            title: `Address ${risk.type} risk: ${risk.description}`,
            description: risk.mitigation_suggestions.join('; '),
            rationale: `High-severity risk that could invalidate or complicate the document`,
            implementation_effort: 'moderate',
            legal_basis: this.getLegalBasis(risk.type, jurisdiction)
          });
        }
      }
    }

    // General improvements based on document type
    if (documentType === 'will') {
      recommendations.push({
        type: 'improvement',
        priority: 'medium',
        title: 'Consider adding digital asset clause',
        description: 'Modern wills should address digital assets including cryptocurrency, online accounts, and digital files',
        rationale: 'Digital assets are increasingly valuable and often overlooked in traditional wills',
        implementation_effort: 'minimal',
        suggested_text: 'I direct my executor to identify and distribute my digital assets according to the attached digital asset inventory.'
      });

      recommendations.push({
        type: 'improvement',
        priority: 'medium',
        title: 'Add guardianship provisions for minor children',
        description: 'If you have minor children, specify guardian preferences',
        rationale: 'Prevents court disputes and ensures your children are cared for by your chosen guardians',
        implementation_effort: 'moderate'
      });
    }

    return recommendations.sort((a, b) => this.priorityToNumber(b.priority) - this.priorityToNumber(a.priority));
  }

  private async processDocumentJob(job: DocumentProcessingJob): Promise<void> {
    try {
      await this.supabase
        .from('document_processing_jobs')
        .update({
          status: 'processing',
          started_at: new Date(),
          progress: 10
        })
        .eq('id', job.id);

      // Get document content
      const documentContent = await this.getDocumentContent(job.document_id);
      const documentType = job.configuration.analysis_type;

      // Update progress
      await this.updateJobProgress(job.id, 30);

      // Extract entities
      const entities = await this.extractDocumentEntities(documentContent, documentType);
      await this.updateJobProgress(job.id, 50);

      // Identify key terms
      const keyTerms = await this.identifyKeyTerms(documentContent, documentType);
      await this.updateJobProgress(job.id, 70);

      // Assess risks
      const riskFactors = await this.assessDocumentRisks(documentContent, entities, documentType);
      await this.updateJobProgress(job.id, 85);

      // Generate recommendations
      const recommendations = await this.generateRecommendations({
        results: { entities, key_terms: keyTerms, risk_factors: riskFactors }
      } as any, documentType, job.configuration.jurisdiction);

      await this.updateJobProgress(job.id, 95);

      // Create analysis record
      const analysis: Partial<DocumentAnalysis> = {
        id: crypto.randomUUID(),
        document_id: job.document_id,
        user_id: job.user_id,
        analysis_type: documentType,
        status: 'completed',
        created_at: job.created_at,
        completed_at: new Date(),
        results: {
          entities,
          key_terms: keyTerms,
          risk_factors: riskFactors,
          compliance_issues: [],
          recommendations,
          confidence_score: this.calculateOverallConfidence(entities, keyTerms, riskFactors),
          summary: this.generateAnalysisSummary(entities, keyTerms, riskFactors, recommendations)
        },
        metadata: {
          processing_time_ms: Date.now() - job.created_at.getTime(),
          model_version: '1.0.0',
          language_detected: 'en',
          page_count: 1,
          word_count: documentContent.split(' ').length
        }
      };

      await this.supabase.from('document_analyses').insert(analysis);

      // Complete job
      await this.supabase
        .from('document_processing_jobs')
        .update({
          status: 'completed',
          completed_at: new Date(),
          progress: 100,
          results: { analysis_id: analysis.id }
        })
        .eq('id', job.id);

    } catch (error) {
      await this.supabase
        .from('document_processing_jobs')
        .update({
          status: 'failed',
          completed_at: new Date(),
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', job.id);
    }
  }

  private async getDocumentContent(documentId: string): Promise<string> {
    // In production, this would fetch actual document content
    return "This is a sample will document content for analysis...";
  }

  private async updateJobProgress(jobId: string, progress: number): Promise<void> {
    await this.supabase
      .from('document_processing_jobs')
      .update({ progress })
      .eq('id', jobId);
  }

  private normalizeName(name: string): string {
    return name.trim().replace(/\s+/g, ' ');
  }

  private normalizeDate(date: string): string {
    try {
      return new Date(date).toISOString().split('T')[0];
    } catch {
      return date;
    }
  }

  private normalizeAmount(amount: string): string {
    return amount.replace(/[,$]/g, '');
  }

  private extractWillSpecificEntities(content: string): DocumentEntity[] {
    const entities: DocumentEntity[] = [];

    // Extract executor mentions
    const executorRegex = /executor[s]?\s*[:\-]?\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/gi;
    let match;
    while ((match = executorRegex.exec(content)) !== null) {
      entities.push({
        type: 'legal_entity',
        text: match[1],
        confidence: 0.8,
        position: { page: 1, start: match.index, end: match.index + match[0].length },
        related_entities: []
      });
    }

    return entities;
  }

  private extractTrustSpecificEntities(content: string): DocumentEntity[] {
    const entities: DocumentEntity[] = [];

    // Extract trustee mentions
    const trusteeRegex = /trustee[s]?\s*[:\-]?\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/gi;
    let match;
    while ((match = trusteeRegex.exec(content)) !== null) {
      entities.push({
        type: 'legal_entity',
        text: match[1],
        confidence: 0.8,
        position: { page: 1, start: match.index, end: match.index + match[0].length },
        related_entities: []
      });
    }

    return entities;
  }

  private extractContexts(content: string, term: string, sentences: number): string[] {
    const termRegex = new RegExp(`\\b${term}\\b`, 'gi');
    const contexts: string[] = [];
    let match;

    while ((match = termRegex.exec(content)) !== null) {
      const start = Math.max(0, match.index - 100);
      const end = Math.min(content.length, match.index + term.length + 100);
      contexts.push(content.substring(start, end).trim());

      if (contexts.length >= sentences) break;
    }

    return contexts;
  }

  private calculateTermImportance(term: string, frequency: number, documentType: string): number {
    const baseImportance = frequency * 0.1;
    const typeMultiplier = documentType === 'will' ? 1.5 : 1.0;
    const termWeight = this.getTermWeight(term);

    return baseImportance * typeMultiplier * termWeight;
  }

  private getTermWeight(term: string): number {
    const highImportanceTerms = ['executor', 'beneficiary', 'trustee', 'guardian'];
    const mediumImportanceTerms = ['asset', 'inheritance', 'bequest', 'legacy'];

    if (highImportanceTerms.includes(term.toLowerCase())) return 3.0;
    if (mediumImportanceTerms.includes(term.toLowerCase())) return 2.0;
    return 1.0;
  }

  private getTermDefinition(term: string): string {
    const definitions: Record<string, string> = {
      'executor': 'A person appointed by a will to carry out the instructions in the will',
      'beneficiary': 'A person who receives benefits from a will, trust, or insurance policy',
      'trustee': 'A person who manages trust assets for the benefit of beneficiaries',
      'guardian': 'A person appointed to care for a minor child or incapacitated adult'
    };

    return definitions[term.toLowerCase()] || '';
  }

  private containsClause(content: string, keywords: string[]): boolean {
    const contentLower = content.toLowerCase();
    return keywords.some(keyword => contentLower.includes(keyword.toLowerCase()));
  }

  private extractYear(dateText: string): number | null {
    const yearMatch = dateText.match(/\b(19|20)\d{2}\b/);
    return yearMatch ? parseInt(yearMatch[0]) : null;
  }

  private severityToNumber(severity: string): number {
    const mapping = { low: 1, medium: 2, high: 3, critical: 4 };
    return mapping[severity as keyof typeof mapping] || 0;
  }

  private priorityToNumber(priority: string): number {
    const mapping = { low: 1, medium: 2, high: 3, urgent: 4 };
    return mapping[priority as keyof typeof mapping] || 0;
  }

  private getLegalBasis(riskType: string, jurisdiction: string): string {
    return `${jurisdiction} legal requirements for ${riskType} compliance`;
  }

  private calculateOverallConfidence(
    entities: DocumentEntity[],
    keyTerms: KeyTerm[],
    riskFactors: RiskFactor[]
  ): number {
    const entityConfidence = entities.reduce((sum, e) => sum + e.confidence, 0) / Math.max(entities.length, 1);
    const riskConfidence = riskFactors.reduce((sum, r) => sum + r.confidence, 0) / Math.max(riskFactors.length, 1);

    return (entityConfidence + riskConfidence) / 2;
  }

  private generateAnalysisSummary(
    entities: DocumentEntity[],
    keyTerms: KeyTerm[],
    riskFactors: RiskFactor[],
    recommendations: Recommendation[]
  ): string {
    const entityCount = entities.length;
    const highRiskCount = riskFactors.filter(r => r.severity === 'high' || r.severity === 'critical').length;
    const urgentRecommendations = recommendations.filter(r => r.priority === 'urgent').length;

    return `Document analysis identified ${entityCount} entities, ${highRiskCount} high-severity risks, and generated ${urgentRecommendations} urgent recommendations for improvement.`;
  }

  private estimateProcessingTime(documentId: string, analysisType: string): number {
    // Simple estimation based on analysis type
    const baseTime = 2; // 2 minutes base
    const typeMultiplier = analysisType === 'legal_review' ? 1.5 : 1.0;
    return Math.ceil(baseTime * typeMultiplier);
  }

  private async loadModelConfigurations(): Promise<void> {
    // Load AI model configurations
  }

  private async startProcessingWorker(): Promise<void> {
    setInterval(async () => {
      try {
        const { data: pendingJobs } = await this.supabase
          .from('document_processing_jobs')
          .select('*')
          .eq('status', 'queued')
          .order('created_at', { ascending: true })
          .limit(5);

        if (pendingJobs) {
          for (const job of pendingJobs) {
            this.processDocumentJob(job);
          }
        }
      } catch (error) {
        console.error('Processing worker error:', error);
      }
    }, 10000); // Check every 10 seconds
  }
}

export const documentAnalyzer = AIDocumentAnalyzer.getInstance();