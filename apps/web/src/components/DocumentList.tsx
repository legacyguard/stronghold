"use client";

import { useState, useEffect } from "react";
import { FileText, MoreHorizontal, Sparkles, Calendar, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getDocumentsForUser } from "@/app/actions/documents";
import { useNamespace } from "@/contexts/LocalizationContext";

interface Document {
  id: string;
  file_name: string;
  created_at: string;
  description?: string;
  ai_category?: string;
  ai_confidence?: number;
  expires_at?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  'Insurance': 'Poistenie',
  'Banking': 'Bankovníctvo',
  'Legal': 'Právne',
  'Medical': 'Zdravotné',
  'Property': 'Nehnuteľnosti',
  'Vehicles': 'Vozidlá',
  'Education': 'Vzdelanie',
  'Personal': 'Osobné',
  'Business': 'Podnikanie',
  'Other': 'Ostatné'
};

export const DocumentList = () => {
  const { t } = useNamespace('vault');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const docs = await getDocumentsForUser();
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    // Listen for document changes
    const handleDocumentChange = () => {
      fetchDocuments();
    };

    window.addEventListener('document-uploaded', handleDocumentChange);
    window.addEventListener('document-added', handleDocumentChange);

    return () => {
      window.removeEventListener('document-uploaded', handleDocumentChange);
      window.removeEventListener('document-added', handleDocumentChange);
    };
  }, []);
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-2xl text-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-neutral-beige rounded-full mx-auto mb-md"></div>
          <div className="h-4 bg-neutral-beige rounded w-32 mx-auto mb-sm"></div>
          <div className="h-3 bg-neutral-beige rounded w-48 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-2xl text-center">
        <div className="p-lg bg-background rounded-lg mb-md">
          <FileText className="w-8 h-8 text-text-light mx-auto" />
        </div>
        <p className="text-body text-text-light">{t('document_list.no_documents')}</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>{t('document_list.document_name')}</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>{t('document_list.date_created')}</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((document) => (
            <TableRow key={document.id} className="hover:bg-background/50">
              <TableCell>
                <div className="p-sm bg-background rounded-lg w-fit">
                  {document.ai_category ? (
                    <Sparkles className="w-4 h-4 text-primary" />
                  ) : (
                    <FileText className="w-4 h-4 text-primary" />
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium text-text-dark">
                <div>
                  <p className="truncate">{document.file_name}</p>
                  {document.description && (
                    <p className="text-caption text-text-light truncate mt-xs">
                      {document.description}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {document.ai_category ? (
                  <div className="flex items-center gap-xs">
                    <Badge variant="outline" className="text-xs">
                      {CATEGORY_LABELS[document.ai_category] || document.ai_category}
                    </Badge>
                    {document.ai_confidence && (
                      <span className="text-xs text-text-light">
                        {Math.round(document.ai_confidence * 100)}%
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-caption text-text-light">Manually added</span>
                )}
              </TableCell>
              <TableCell className="text-caption text-text-light">
                {formatDate(document.created_at)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-xs">
                  {document.expires_at && new Date(document.expires_at) < new Date() && (
                    <div className="flex items-center gap-xs text-red-600">
                      <AlertTriangle className="w-3 h-3" />
                      <span className="text-xs">Expired</span>
                    </div>
                  )}
                  {document.expires_at && new Date(document.expires_at) > new Date() && (
                    <div className="flex items-center gap-xs text-yellow-600">
                      <Calendar className="w-3 h-3" />
                      <span className="text-xs">Expires</span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-text-light hover:text-text-dark">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      {t('document_list.actions.view_details')}
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      {t('document_list.actions.download')}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      {t('document_list.actions.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DocumentList;