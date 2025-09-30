-- Add AI metadata columns to documents table
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS ai_category text,
ADD COLUMN IF NOT EXISTS ai_metadata jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ai_confidence decimal(3,2) CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
ADD COLUMN IF NOT EXISTS ai_suggestions jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS extracted_text text,
ADD COLUMN IF NOT EXISTS description text;

-- Add index for better performance on AI queries
CREATE INDEX IF NOT EXISTS idx_documents_ai_category ON public.documents(ai_category);
CREATE INDEX IF NOT EXISTS idx_documents_ai_confidence ON public.documents(ai_confidence);

-- Add some useful GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_documents_ai_metadata ON public.documents USING GIN (ai_metadata);
CREATE INDEX IF NOT EXISTS idx_documents_ai_suggestions ON public.documents USING GIN (ai_suggestions);

-- Update the updated_at trigger to handle new columns
-- (The trigger function already exists from previous migration)