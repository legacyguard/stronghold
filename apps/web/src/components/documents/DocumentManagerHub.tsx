'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Upload,
  Download,
  Search,
  Filter,
  MoreVertical,
  Folder,
  Clock,
  Shield,
  Eye,
  Edit,
  Trash2,
  Share2,
  Archive,
  Star,
  AlertTriangle,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { DocumentUploadGate } from '@/components/premium/PremiumGate';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { UsageTracker } from '@/lib/pricing/usage-tracker';
import { BehaviorTracker } from '@/lib/monitoring/behavior-tracker';

interface Document {
  id: string;
  name: string;
  type: 'will' | 'legal' | 'financial' | 'medical' | 'insurance' | 'personal';
  size: number;
  uploadedAt: string;
  lastModified: string;
  status: 'draft' | 'active' | 'archived' | 'expired';
  isStarred: boolean;
  isShared: boolean;
  accessLevel: 'private' | 'family' | 'emergency';
  tags: string[];
  expiryDate?: string;
  version: number;
  fileUrl?: string;
  thumbnail?: string;
  metadata: {
    createdBy: string;
    lastAccessedAt: string;
    downloadCount: number;
    shareCount: number;
  };
}

interface DocumentStats {
  totalDocuments: number;
  storageUsed: number;
  storageLimit: number;
  documentsByType: Record<string, number>;
  recentActivity: number;
  expiringDocuments: number;
  sharedDocuments: number;
}

interface DocumentManagerHubProps {
  className?: string;
}

export function DocumentManagerHub({ className }: DocumentManagerHubProps) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      loadDocuments();
      loadStats();
      trackPageView();
    }
  }, [user]);

  const trackPageView = async () => {
    if (user) {
      await BehaviorTracker.trackEvent(user.id, {
        event_type: 'page_view',
        page: 'document_manager',
        timestamp: new Date().toISOString()
      });
    }
  };

  const loadDocuments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to match our interface
      const transformedDocs: Document[] = (data || []).map(doc => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        size: doc.size || 0,
        uploadedAt: doc.created_at,
        lastModified: doc.updated_at,
        status: doc.status || 'active',
        isStarred: doc.is_starred || false,
        isShared: doc.is_shared || false,
        accessLevel: doc.access_level || 'private',
        tags: doc.tags || [],
        expiryDate: doc.expiry_date,
        version: doc.version || 1,
        fileUrl: doc.file_url,
        thumbnail: doc.thumbnail,
        metadata: {
          createdBy: doc.created_by || user.id,
          lastAccessedAt: doc.last_accessed_at || doc.created_at,
          downloadCount: doc.download_count || 0,
          shareCount: doc.share_count || 0
        }
      }));

      setDocuments(transformedDocs);

      // Track document viewing analytics
      await BehaviorTracker.trackEvent(user.id, {
        event_type: 'documents_viewed',
        document_count: transformedDocs.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;

    try {
      // Get usage summary for storage info
      const usageSummary = await UsageTracker.getUsageSummary(user.id);

      const documentsByType = documents.reduce((acc, doc) => {
        acc[doc.type] = (acc[doc.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const storageUsed = documents.reduce((total, doc) => total + doc.size, 0);
      const storageLimit = usageSummary?.limits.storage_gb.limit === -1
        ? -1
        : (usageSummary?.limits.storage_gb.limit || 0.1) * 1024 * 1024 * 1024; // Convert GB to bytes

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const recentActivity = documents.filter(doc =>
        new Date(doc.lastModified) > thirtyDaysAgo
      ).length;

      const expiringDocuments = documents.filter(doc => {
        if (!doc.expiryDate) return false;
        const expiryDate = new Date(doc.expiryDate);
        const warningDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
        return expiryDate <= warningDate;
      }).length;

      const sharedDocuments = documents.filter(doc => doc.isShared).length;

      setStats({
        totalDocuments: documents.length,
        storageUsed,
        storageLimit,
        documentsByType,
        recentActivity,
        expiringDocuments,
        sharedDocuments
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (!user || !files.length) return;

    // Check usage limits
    const canUpload = await UsageTracker.checkLimit(user.id, 'documents');
    if (!canUpload) {
      return; // PremiumGate will handle this
    }

    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Upload file to Supabase storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}_${file.name}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(fileName);

        // Create document record
        const { error: dbError } = await supabase
          .from('documents')
          .insert({
            user_id: user.id,
            name: file.name,
            type: getDocumentType(file.name),
            size: file.size,
            file_url: publicUrl,
            status: 'active',
            access_level: 'private',
            created_by: user.id
          });

        if (dbError) throw dbError;

        // Increment usage
        await UsageTracker.incrementUsage(user.id, 'documents');

        // Track upload event
        await BehaviorTracker.trackEvent(user.id, {
          event_type: 'document_uploaded',
          document_type: getDocumentType(file.name),
          file_size: file.size,
          timestamp: new Date().toISOString()
        });

        setUploadProgress(((i + 1) / files.length) * 100);
      }

      // Reload documents
      await loadDocuments();
      await loadStats();
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploadProgress(null);
    }
  };

  const getDocumentType = (fileName: string): Document['type'] => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const name = fileName.toLowerCase();

    if (name.includes('testament') || name.includes('will')) return 'will';
    if (name.includes('medical') || name.includes('health')) return 'medical';
    if (name.includes('insurance') || name.includes('policy')) return 'insurance';
    if (name.includes('financial') || name.includes('bank') || name.includes('investment')) return 'financial';
    if (ext && ['pdf', 'doc', 'docx'].includes(ext)) return 'legal';

    return 'personal';
  };

  const toggleDocumentStar = async (documentId: string) => {
    if (!user) return;

    try {
      const doc = documents.find(d => d.id === documentId);
      if (!doc) return;

      const { error } = await supabase
        .from('documents')
        .update({ is_starred: !doc.isStarred })
        .eq('id', documentId);

      if (error) throw error;

      setDocuments(docs =>
        docs.map(d =>
          d.id === documentId
            ? { ...d, isStarred: !d.isStarred }
            : d
        )
      );

      await BehaviorTracker.trackEvent(user.id, {
        event_type: 'document_starred',
        document_id: documentId,
        starred: !doc.isStarred,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (!user || !window.confirm('Naozaj chcete odstrániť tento dokument?')) return;

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      setDocuments(docs => docs.filter(d => d.id !== documentId));
      await UsageTracker.decrementUsage(user.id, 'documents');
      await loadStats();

      await BehaviorTracker.trackEvent(user.id, {
        event_type: 'document_deleted',
        document_id: documentId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const filteredDocuments = documents
    .filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = selectedType === 'all' || doc.type === selectedType;
      const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus;

      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'size':
          return b.size - a.size;
        case 'type':
          return a.type.localeCompare(b.type);
        case 'date':
        default:
          return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      }
    });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTypeIcon = (type: Document['type']) => {
    switch (type) {
      case 'will': return <FileText className="w-4 h-4 text-primary" />;
      case 'legal': return <Shield className="w-4 h-4 text-blue-600" />;
      case 'financial': return <FileText className="w-4 h-4 text-green-600" />;
      case 'medical': return <FileText className="w-4 h-4 text-red-600" />;
      case 'insurance': return <Shield className="w-4 h-4 text-purple-600" />;
      default: return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: Document['type']): string => {
    const labels = {
      will: 'Testament',
      legal: 'Právny',
      financial: 'Finančný',
      medical: 'Zdravotný',
      insurance: 'Poistenie',
      personal: 'Osobný'
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: Document['status']) => {
    const variants = {
      draft: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800',
      expired: 'bg-red-100 text-red-800'
    };

    const labels = {
      draft: 'Koncept',
      active: 'Aktívny',
      archived: 'Archivovaný',
      expired: 'Vypršaný'
    };

    return (
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <DocumentUploadGate>
      <div className={`space-y-6 ${className}`}>
        {/* Header with Stats */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Správa dokumentov</h1>
            <p className="text-muted-foreground">Organizujte a spravujte všetky svoje právne dokumenty</p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <input
              type="file"
              multiple
              className="hidden"
              id="file-upload"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            />
            <Button asChild>
              <label htmlFor="file-upload">
                <Upload className="w-4 h-4 mr-2" />
                Nahrať dokumenty
              </label>
            </Button>
          </div>
        </div>

        {/* Upload Progress */}
        {uploadProgress !== null && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Nahrávanie dokumentov...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Celkom dokumentov</p>
                    <p className="text-2xl font-bold">{stats.totalDocuments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Folder className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Využité úložisko</p>
                    <p className="text-2xl font-bold">
                      {formatFileSize(stats.storageUsed)}
                      {stats.storageLimit > 0 && (
                        <span className="text-sm font-normal text-muted-foreground">
                          /{formatFileSize(stats.storageLimit)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Nedávna aktivita</p>
                    <p className="text-2xl font-bold">{stats.recentActivity}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Share2 className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium">Zdieľané</p>
                    <p className="text-2xl font-bold">{stats.sharedDocuments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Alerts */}
        {stats && stats.expiringDocuments > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700">
              Máte {stats.expiringDocuments} dokumentov, ktoré čoskoro vyprší. Skontrolujte ich a aktualizujte.
            </AlertDescription>
          </Alert>
        )}

        {/* Filters and Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Hľadať dokumenty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">Všetky typy</option>
                  <option value="will">Testamenty</option>
                  <option value="legal">Právne</option>
                  <option value="financial">Finančné</option>
                  <option value="medical">Zdravotné</option>
                  <option value="insurance">Poistenie</option>
                  <option value="personal">Osobné</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">Všetky stavy</option>
                  <option value="active">Aktívne</option>
                  <option value="draft">Koncepty</option>
                  <option value="archived">Archivované</option>
                  <option value="expired">Vypršané</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="date">Dátum</option>
                  <option value="name">Názov</option>
                  <option value="type">Typ</option>
                  <option value="size">Veľkosť</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((document) => (
            <Card key={document.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(document.type)}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-medium truncate">
                        {document.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {getTypeLabel(document.type)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleDocumentStar(document.id)}
                    >
                      <Star className={`w-4 h-4 ${document.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    {getStatusBadge(document.status)}
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(document.size)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Upravený: {new Date(document.lastModified).toLocaleDateString('sk-SK')}</span>
                    {document.isShared && <Share2 className="w-3 h-3" />}
                  </div>

                  {document.expiryDate && (
                    <div className="flex items-center text-xs text-yellow-600">
                      <Calendar className="w-3 h-3 mr-1" />
                      Vypršanie: {new Date(document.expiryDate).toLocaleDateString('sk-SK')}
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="w-3 h-3 mr-1" />
                      Zobraziť
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteDocument(document.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredDocuments.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Žiadne dokumenty</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedType !== 'all' || selectedStatus !== 'all'
                    ? 'Žiadne dokumenty nevyhovujú vašim filtrom.'
                    : 'Začnite nahrávaním svojich prvých dokumentov.'
                  }
                </p>
                {(!searchTerm && selectedType === 'all' && selectedStatus === 'all') && (
                  <Button asChild>
                    <label htmlFor="file-upload">
                      <Upload className="w-4 h-4 mr-2" />
                      Nahrať dokumenty
                    </label>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DocumentUploadGate>
  );
}