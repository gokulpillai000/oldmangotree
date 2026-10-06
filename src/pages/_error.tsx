import React from 'react';
import Link from 'next/link';
import type { NextPageContext } from 'next';

interface ErrorProps {
  statusCode?: number;
}

function ErrorPage({ statusCode }: ErrorProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '24px',
        textAlign: 'center',
        backgroundColor: '#FFFDF9',
        color: '#1a1a1a',
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          padding: '36px 32px',
          borderRadius: '16px',
          border: '1px solid #e5e5e5',
          backgroundColor: '#ffffff',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        }}
      >
        <div
          style={{
            display: 'inline-block',
            padding: '4px 12px',
            backgroundColor: '#fff4eb',
            color: '#E27A2B',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 'bold',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}
        >
          {statusCode ? `Error ${statusCode}` : 'System Notification'}
        </div>
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#0C2340',
            marginBottom: '12px',
          }}
        >
          {statusCode === 404 ? 'Page Not Found' : 'An Unexpected Error Occurred'}
        </h1>
        <p
          style={{
            color: '#666',
            fontSize: '15px',
            lineHeight: '1.6',
            marginBottom: '24px',
          }}
        >
          {statusCode === 404
            ? 'The requested page could not be located on the server.'
            : 'A temporary error occurred while processing this request.'}
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            padding: '10px 24px',
            backgroundColor: '#E27A2B',
            color: '#ffffff',
            borderRadius: '9999px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '14px',
          }}
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default ErrorPage;
