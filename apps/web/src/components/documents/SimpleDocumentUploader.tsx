"use client";

import React, { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadDocument } from '@/app/actions/documents';
import toast from 'react-hot-toast';

const SimpleDocumentUploader: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    const files = event.dataTransfer.files;
    if (files && files[0]) {
      setSelectedFile(files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  };

  const handleFormAction = async (formData: FormData) => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setIsUploading(true);

    try {
      const result = await uploadDocument(formData);

      if (result.success) {
        toast.success(result.message);

        // Reset form
        setSelectedFile(null);
        formRef.current?.reset();
      } else {
        toast.error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <form ref={formRef} action={handleFormAction} className="max-w-lg mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-neutral-beige/50 to-surface">
        <div className="flex items-center gap-sm">
          <div className="p-xs bg-primary/10 rounded-lg">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-h3 text-text-dark font-semibold">Upload Document</h3>
            <p className="text-caption text-text-light">Add documents to your secure vault</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-lg space-y-lg">
        {/* Drop Zone */}
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-lg text-center transition-all duration-300
            ${dragActive || selectedFile
              ? 'border-primary bg-primary/5'
              : 'border-border/30 hover:border-primary/50 hover:bg-neutral-beige/30'
            }
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Input
            id="file-input"
            name="file"
            type="file"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
          />

          {!selectedFile ? (
            <div className="space-y-sm">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-body font-medium text-text-dark">
                  Drag and drop your file here
                </p>
                <p className="text-caption text-text-light mt-xs">
                  or{' '}
                  <span className="text-primary font-medium cursor-pointer hover:underline">
                    browse files
                  </span>
                </p>
              </div>
              <p className="text-caption text-text-light">
                PDF, DOC, DOCX, TXT, JPG, PNG up to 10MB
              </p>
            </div>
          ) : (
            <div className="space-y-sm">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-body font-medium text-text-dark">File selected</p>
                <p className="text-caption text-text-light">Ready to upload</p>
              </div>
            </div>
          )}
        </div>

        {/* Selected File Info */}
        {selectedFile && (
          <div className="bg-neutral-beige/50 rounded-lg p-md border border-border/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-sm flex-1 min-w-0">
                <div className="p-xs bg-primary/10 rounded">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body font-medium text-text-dark truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-caption text-text-light">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="p-xs rounded-lg hover:bg-neutral-light/20 transition-colors"
              >
                <X className="h-4 w-4 text-text-light hover:text-text-dark" />
              </button>
            </div>
          </div>
        )}

        {/* Upload Button */}
        <Button
          type="submit"
          disabled={!selectedFile || isUploading}
          className="w-full py-md"
          size="lg"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {selectedFile ? 'Upload Document' : 'Select a file to upload'}
            </>
          )}
        </Button>

      </CardContent>

      <CardFooter className="bg-primary/5 border-t border-primary/10">
        <div className="w-full">
          <div className="flex items-start gap-sm">
            <div className="p-xs bg-primary/10 rounded mt-xs">
              <FileText className="h-3 w-3 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-caption font-medium text-text-dark mb-xs">
                Upload Guidelines
              </p>
              <ul className="text-caption text-text-light space-y-xs">
                <li>• Keep file names descriptive</li>
                <li>• Maximum file size: 10MB</li>
                <li>• Documents are encrypted automatically</li>
                <li>• All uploads are virus-scanned</li>
              </ul>
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
    </form>
  );
};

export default SimpleDocumentUploader;