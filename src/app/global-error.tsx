'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          display: 'flex',
          minHeight: '100vh',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '1rem',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: '#0a0a0a',
          color: '#fafafa',
        }}
      >
        <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>Something went wrong</h1>
        <p style={{ color: '#a1a1aa', maxWidth: '28rem', margin: 0 }}>
          A critical error occurred. Please try again.
        </p>
        <button
          onClick={() => reset()}
          style={{
            marginTop: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            background: '#fafafa',
            color: '#0a0a0a',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
