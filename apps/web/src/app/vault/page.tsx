"use client";

import { Toaster } from 'react-hot-toast';
import SimpleDocumentUploader from '@/components/documents/SimpleDocumentUploader';
import AppLayout from '@/components/layout/AppLayout';

export default function VaultPage() {
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

      <AppLayout>
        <div className="space-y-2xl">
          {/* Page Header */}
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-h1 font-semibold text-text-dark mb-md">
              Document Vault
            </h1>
            <p className="text-body text-text-light">
              Securely store and manage your important family documents.
              All files are encrypted and protected with bank-level security.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-2xl">
            <div className="bg-surface rounded-lg p-lg border border-border/20 shadow-sm">
              <div className="flex items-center gap-sm">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <div>
                  <p className="text-caption text-text-light">Total Documents</p>
                  <p className="text-h3 font-semibold text-text-dark">0</p>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-lg p-lg border border-border/20 shadow-sm">
              <div className="flex items-center gap-sm">
                <div className="w-3 h-3 bg-primary-light rounded-full"></div>
                <div>
                  <p className="text-caption text-text-light">Storage Used</p>
                  <p className="text-h3 font-semibold text-text-dark">0 MB</p>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-lg p-lg border border-border/20 shadow-sm">
              <div className="flex items-center gap-sm">
                <div className="w-3 h-3 bg-neutral-light rounded-full"></div>
                <div>
                  <p className="text-caption text-text-light">Last Upload</p>
                  <p className="text-h3 font-semibold text-text-dark">Never</p>
                </div>
              </div>
            </div>
          </div>

          {/* Document Uploader */}
          <div className="flex justify-center">
            <SimpleDocumentUploader />
          </div>

          {/* Future: Document List */}
          <div className="bg-surface rounded-lg p-2xl border border-border/20 shadow-sm text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-neutral-beige rounded-full flex items-center justify-center mx-auto mb-md">
                <div className="w-8 h-8 bg-primary/20 rounded-lg"></div>
              </div>
              <h3 className="text-h3 font-semibold text-text-dark mb-sm">
                No documents yet
              </h3>
              <p className="text-body text-text-light mb-lg">
                Upload your first document to get started. We support PDF, DOC, images, and more.
              </p>
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
}