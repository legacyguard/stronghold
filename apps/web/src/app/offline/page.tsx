"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-md">
      <div className="max-w-md w-full text-center space-y-lg">
        <div className="space-y-md">
          <div className="w-24 h-24 mx-auto mb-lg">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-full h-full text-gray-400"
            >
              <path d="M3 12h6m0 0V3m0 9v9m6-9h6m-6 0V3m0 9v9" />
              <path d="m15 9 6-6m-6 6-6-6" />
            </svg>
          </div>

          <h1 className="text-h1 font-bold text-text-dark">
            You&apos;re Offline
          </h1>

          <p className="text-body text-gray-600">
            Your internet connection appears to be offline. Some features may be limited,
            but you can still access your cached documents and continue working.
          </p>
        </div>

        <div className="space-y-sm">
          <h2 className="text-h3 font-semibold text-text-dark">
            Available Offline Features:
          </h2>

          <ul className="text-left space-y-xs text-body text-gray-600">
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              View and edit cached will documents
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Access legal templates and validation rules
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Continue working on will generation
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Changes will sync when you&apos;re back online
            </li>
          </ul>
        </div>

        <div className="space-y-sm">
          <h2 className="text-h3 font-semibold text-text-dark">
            Limited Features:
          </h2>

          <ul className="text-left space-y-xs text-body text-gray-600">
            <li className="flex items-center">
              <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Sofia AI assistance
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Trust Seal generation
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Real-time document sync
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-sm justify-center">
          <Button
            onClick={() => window.location.reload()}
            variant="default"
            className="w-full sm:w-auto"
          >
            Try Again
          </Button>

          <Link href="/" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full">
              Go to Dashboard
            </Button>
          </Link>
        </div>

        <div className="pt-lg border-t border-gray-200">
          <p className="text-caption text-gray-500">
            Your documents are automatically saved locally and will sync when your internet connection is restored.
          </p>
        </div>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Check for network connection and redirect if online
              function checkConnection() {
                if (navigator.onLine) {
                  window.location.href = '/';
                }
              }

              // Check connection every 5 seconds
              setInterval(checkConnection, 5000);

              // Also check when page becomes visible
              document.addEventListener('visibilitychange', () => {
                if (!document.hidden) {
                  checkConnection();
                }
              });

              // Listen for online event
              window.addEventListener('online', checkConnection);
            `
          }}
        />
      </div>
    </div>
  );
}