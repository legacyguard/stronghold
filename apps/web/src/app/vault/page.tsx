"use client";

import { Toaster } from 'react-hot-toast';
import AIDocumentUploader from '@/components/documents/AIDocumentUploader';
import SimpleDocumentForm from '@/components/SimpleDocumentForm';
import DocumentList from '@/components/DocumentList';
import PDFTestButton from '@/components/PDFTestButton';
import { useNamespace } from '@/contexts/LocalizationContext';
import { Suspense } from 'react';

export default function VaultPage() {
  const { t } = useNamespace('vault');

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#FFFFFF',
            color: '#2E2E2E',
            border: '1px solid #F5F5F5',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            iconTheme: {
              primary: '#6B8E23',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#DC2626',
              secondary: '#FFFFFF',
            },
          },
        }}
      />

        <div className="space-y-2xl">
          {/* Page Header */}
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-h1 font-semibold text-text-dark mb-md">
              {t('title')}
            </h1>
            <p className="text-body text-text-light">
              {t('subtitle')}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-2xl">
            <div className="bg-surface rounded-lg p-lg border border-border/20 shadow-sm">
              <div className="flex items-center gap-sm">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <div>
                  <p className="text-caption text-text-light">{t('stats.total_documents')}</p>
                  <p className="text-h3 font-semibold text-text-dark">0</p>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-lg p-lg border border-border/20 shadow-sm">
              <div className="flex items-center gap-sm">
                <div className="w-3 h-3 bg-primary-light rounded-full"></div>
                <div>
                  <p className="text-caption text-text-light">{t('stats.storage_used')}</p>
                  <p className="text-h3 font-semibold text-text-dark">0 MB</p>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-lg p-lg border border-border/20 shadow-sm">
              <div className="flex items-center gap-sm">
                <div className="w-3 h-3 bg-neutral-light rounded-full"></div>
                <div>
                  <p className="text-caption text-text-light">{t('stats.last_upload')}</p>
                  <p className="text-h3 font-semibold text-text-dark">{t('stats.never')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Document Management */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2xl">
            {/* AI Document Upload */}
            <div>
              <h3 className="text-h3 font-semibold text-text-dark mb-lg">{t('sections.ai_upload')}</h3>
              <AIDocumentUploader />
            </div>

            {/* Simple Document Entry (For Testing) */}
            <div>
              <h3 className="text-h3 font-semibold text-text-dark mb-lg">{t('sections.quick_add')}</h3>
              <SimpleDocumentForm />
            </div>
          </div>

          {/* PDF Generation Testing */}
          <div className="max-w-md">
            <PDFTestButton />
          </div>

          {/* Document List */}
          <div className="space-y-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-h2 font-semibold text-text-dark">{t('sections.your_documents')}</h2>
            </div>
            <Suspense fallback={
              <div className="bg-surface rounded-lg p-2xl border border-border/20 shadow-sm text-center">
                <div className="animate-pulse">
                  <div className="w-16 h-16 bg-neutral-beige rounded-full mx-auto mb-md"></div>
                  <div className="h-4 bg-neutral-beige rounded w-32 mx-auto mb-sm"></div>
                  <div className="h-3 bg-neutral-beige rounded w-48 mx-auto"></div>
                </div>
              </div>
            }>
              <DocumentList />
            </Suspense>
          </div>
        </div>
    </>
  );
}