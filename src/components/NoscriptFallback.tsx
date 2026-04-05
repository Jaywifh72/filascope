import React from 'react';

interface NoscriptFallbackProps {
  title: string;
  description: string;
  structuredData?: object;
  children?: React.ReactNode;
}

export function NoscriptFallback({ title, description, structuredData, children }: NoscriptFallbackProps) {
  return (
    <noscript>
      <div className="noscript-content">
        <h1>{title}</h1>
        <p>{description}</p>
        {children}
        {structuredData && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
        )}
      </div>
      <style>{`
        .noscript-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          font-family: system-ui, sans-serif;
        }
        .noscript-content h1 {
          font-size: 2rem;
          margin-bottom: 1rem;
        }
        .noscript-content p {
          font-size: 1rem;
          line-height: 1.6;
        }
        .noscript-content ul {
          margin: 1rem 0;
          padding-left: 2rem;
        }
        .noscript-content li {
          margin: 0.5rem 0;
        }
        .noscript-content a {
          color: #2563eb;
          text-decoration: underline;
        }
        .noscript-content h2 {
          font-size: 1.5rem;
          margin: 1.5rem 0 1rem 0;
        }
      `}</style>
    </noscript>
  );
}
