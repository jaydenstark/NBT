'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("Global Client-Side Exception Caught:", error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
      fontFamily: 'system-ui, sans-serif',
      padding: '20px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🧪</div>
      <h2 style={{ color: '#0B2339', marginBottom: '10px', fontWeight: 800 }}>Temporary Hydration Update</h2>
      <p style={{ color: '#64748b', maxWidth: '400px', marginBottom: '24px', lineHeight: 1.5 }}>
        Your browser has cached an older version of this website. A quick reload will refresh the active sessions and scripts.
      </p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: '#2B8C8A',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: 650,
            cursor: 'pointer'
          }}
        >
          Reload Page 🔄
        </button>
        <button
          onClick={() => reset()}
          style={{
            background: 'transparent',
            color: '#64748b',
            border: '1px solid #cbd5e1',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: 650,
            cursor: 'pointer'
          }}
        >
          Reset Cache
        </button>
      </div>

      <details style={{ marginTop: '30px', textAlign: 'left', background: '#f1f5f9', padding: '16px', borderRadius: '8px', maxWidth: '600px', width: '100%', overflowX: 'auto', border: '1px solid #cbd5e1' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 650, color: '#0B2339' }}>View Technical Error Details</summary>
        <pre style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: '10px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          <strong>Error:</strong> {error?.message || 'Unknown error'}
          {"\n\n"}
          <strong>Stack:</strong> {error?.stack || 'No stack trace available'}
        </pre>
      </details>
    </div>
  );
}
