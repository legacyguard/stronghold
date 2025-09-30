"use client";

import React, { useState } from 'react';
import { Plus, FileText, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { addDocument } from '@/app/actions/documents';
// import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useNamespace } from '@/contexts/LocalizationContext';

const SimpleDocumentForm: React.FC = () => {
  const { t } = useNamespace('vault');
  const [fileName, setFileName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fileName.trim()) {
      toast.error(t('quick_add.name_required'));
      return;
    }

    setIsLoading(true);

    try {
      const result = await addDocument(fileName.trim(), description.trim() || undefined);

      if (result.success) {
        toast.success(t('messages.document_added'));

        // Reset form
        setFileName('');
        setDescription('');

        // Trigger document list refresh
        window.dispatchEvent(new CustomEvent('document-added'));
      } else {
        toast.error(t('messages.add_failed'));
      }
    } catch (error) {
      console.error('Add document error:', error);
      toast.error(t('messages.unexpected_error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg max-w-md mx-auto">
      <CardHeader className="bg-gradient-to-r from-neutral-beige/50 to-surface">
        <div className="flex items-center gap-sm">
          <div className="p-xs bg-primary/10 rounded-lg">
            <Plus className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-h3 text-text-dark font-semibold">{t('quick_add.title')}</h3>
            <p className="text-caption text-text-light">{t('quick_add.subtitle')}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-lg">
        <form onSubmit={handleSubmit} className="space-y-md">
          <div>
            <label htmlFor="fileName" className="block text-body font-medium text-text-dark mb-xs">
              {t('quick_add.document_name')} *
            </label>
            <Input
              id="fileName"
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder={t('quick_add.document_name_placeholder')}
              className="w-full"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-body font-medium text-text-dark mb-xs">
              {t('quick_add.description')}
            </label>
            <Input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('quick_add.description_placeholder')}
              className="w-full"
            />
          </div>

          <Button
            type="submit"
            disabled={!fileName.trim() || isLoading}
            className="w-full py-md"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('quick_add.adding')}
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                {t('quick_add.add_button')}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SimpleDocumentForm;