"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default function PDFTestButton() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testPDFEndpoint = async () => {
    if (!user) {
      setError('Please log in to test PDF generation');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      console.log('🧪 Testing PDF endpoint for user:', user.email);

      // Create Supabase client to get session token
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('No valid session token found');
      }

      // Test POST request with authentication
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          document_type: 'test_document',
          template_name: 'test_template',
          data: {
            test_field: 'test_value',
            user_email: user.email
          }
        })
      });

      const result = await response.json();

      if (response.ok) {
        console.log('✅ PDF endpoint test successful:', result);
        setResponse(JSON.stringify(result, null, 2));
      } else {
        console.error('❌ PDF endpoint test failed:', result);
        setError(`HTTP ${response.status}: ${result.error || result.message}`);
      }

    } catch (err) {
      console.error('❌ Error testing PDF endpoint:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const testGetEndpoint = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      console.log('🧪 Testing PDF GET endpoint...');

      const response = await fetch('/api/generate-pdf', {
        method: 'GET'
      });

      const result = await response.json();

      if (response.ok) {
        console.log('✅ PDF GET endpoint test successful:', result);
        setResponse(JSON.stringify(result, null, 2));
      } else {
        console.error('❌ PDF GET endpoint test failed:', result);
        setError(`HTTP ${response.status}: ${result.error || result.message}`);
      }

    } catch (err) {
      console.error('❌ Error testing PDF GET endpoint:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface rounded-lg p-lg border border-border/20 shadow-sm">
      <h3 className="text-h3 font-semibold text-text-dark mb-lg">PDF Generation Test</h3>

      <div className="space-y-md">
        <div className="flex gap-sm">
          <button
            onClick={testGetEndpoint}
            disabled={loading}
            className="px-md py-sm bg-neutral-beige text-text-dark rounded-md border border-border hover:bg-neutral-light disabled:opacity-50 disabled:cursor-not-allowed text-caption font-medium"
          >
            {loading ? 'Testing...' : 'Test GET'}
          </button>

          <button
            onClick={testPDFEndpoint}
            disabled={loading || !user}
            className="px-md py-sm bg-primary text-surface rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-caption font-medium"
          >
            {loading ? 'Testing...' : 'Test PDF Generation'}
          </button>
        </div>

        {!user && (
          <p className="text-caption text-text-light">
            ⚠️ Please log in to test authenticated PDF generation
          </p>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-sm">
            <p className="text-caption text-red-700 font-medium">Error:</p>
            <p className="text-caption text-red-600">{error}</p>
          </div>
        )}

        {response && (
          <div className="bg-green-50 border border-green-200 rounded-md p-sm">
            <p className="text-caption text-green-700 font-medium mb-xs">Response:</p>
            <pre className="text-xs text-green-600 overflow-auto max-h-32 bg-green-25 p-xs rounded border">
              {response}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}